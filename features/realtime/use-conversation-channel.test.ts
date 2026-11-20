import type { InfiniteData } from "@tanstack/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { conversationKeys } from "@/features/conversations/queries";
import type { CursorPage } from "@/lib/api/types";
import type { Message } from "@/features/messages/types";
import { messageKeys } from "@/features/messages/queries";

const { getEchoMock } = vi.hoisted(() => ({
  getEchoMock: vi.fn(),
}));

vi.mock("./echo", () => ({
  getEcho: getEchoMock,
}));

import { useConversationChannel } from "./use-conversation-channel";

const firstMessage: Message = {
  id: 1,
  conversation_id: 1,
  body: "First",
  sender: { id: 2, name: "Sam", email: "sam@example.com" },
  created_at: "2026-01-01T10:00:00.000Z",
};

function page(data: Message[]): CursorPage<Message> {
  return {
    data,
    links: {},
    meta: { next_cursor: null, prev_cursor: null },
  };
}

describe("useConversationChannel", () => {
  it("upserts by id, deduplicates, and invalidates conversations", async () => {
    let messageHandler: ((message: Message) => void) | undefined;
    const unsubscribe = vi.fn();
    const leaveChannel = vi.fn();
    const privateChannel = {
      listen: vi.fn((event: string, handler: (message: Message) => void) => {
        expect(event).toBe(".MessageSent");
        messageHandler = handler;
        return privateChannel;
      }),
    };
    const echo = {
      private: vi.fn(() => privateChannel),
      connectionStatus: vi.fn(() => "connected"),
      connector: {
        onConnectionChange: vi.fn(() => unsubscribe),
        leaveChannel,
      },
    };

    getEchoMock.mockResolvedValue(echo);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    queryClient.setQueryData<
      InfiniteData<CursorPage<Message>, string | undefined>
    >(messageKeys.list(1), {
      pages: [page([firstMessage])],
      pageParams: [undefined],
    });

    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { unmount } = renderHook(() => useConversationChannel(1), {
      wrapper,
    });

    await waitFor(() => {
      expect(privateChannel.listen).toHaveBeenCalled();
    });

    act(() => {
      messageHandler?.({ ...firstMessage, body: "Updated" });
    });

    let data = queryClient.getQueryData<
      InfiniteData<CursorPage<Message>, string | undefined>
    >(messageKeys.list(1));

    expect(data?.pages[0].data).toHaveLength(1);
    expect(data?.pages[0].data[0].body).toBe("Updated");

    act(() => {
      messageHandler?.({ ...firstMessage, body: "Updated again" });
    });

    data = queryClient.getQueryData<
      InfiniteData<CursorPage<Message>, string | undefined>
    >(messageKeys.list(1));

    expect(data?.pages[0].data).toHaveLength(1);
    expect(data?.pages[0].data[0].body).toBe("Updated again");

    act(() => {
      messageHandler?.({
        ...firstMessage,
        id: 2,
        body: "Second",
      });
    });

    data = queryClient.getQueryData<
      InfiniteData<CursorPage<Message>, string | undefined>
    >(messageKeys.list(1));

    expect(data?.pages[0].data).toHaveLength(2);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: conversationKeys.all,
    });

    unmount();

    expect(unsubscribe).toHaveBeenCalled();
    expect(leaveChannel).toHaveBeenCalledWith("private-conversation.1");
  });
});
