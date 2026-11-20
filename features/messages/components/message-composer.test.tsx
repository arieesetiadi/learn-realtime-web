import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "../../../test/msw/server";
import { MessageComposer } from "./message-composer";

function renderComposer() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MessageComposer conversationId={1} />
    </QueryClientProvider>,
  );
}

const sentMessage = {
  id: 10,
  conversation_id: 1,
  body: "Hello",
  sender: { id: 1, name: "Alex", email: "alex@example.com" },
  created_at: "2026-01-01T10:00:00.000Z",
};

describe("MessageComposer", () => {
  it("prevents empty submits", async () => {
    let requestCount = 0;
    server.use(
      http.post("*/api/conversations/1/messages", () => {
        requestCount += 1;
        return HttpResponse.json({ data: sentMessage }, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderComposer();

    const textarea = screen.getByRole("textbox", { name: "Message" });
    const sendButton = screen.getByRole("button", { name: "Send message" });

    expect(sendButton).toBeDisabled();

    await user.type(textarea, "{Enter}");

    expect(requestCount).toBe(0);
  });

  it("disables the composer while a message is sending", async () => {
    let releaseRequest: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      releaseRequest = resolve;
    });

    server.use(
      http.post("*/api/conversations/1/messages", async () => {
        await gate;
        return HttpResponse.json({ data: sentMessage }, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderComposer();

    const textarea = screen.getByRole("textbox", { name: "Message" });
    const sendButton = screen.getByRole("button", { name: "Send message" });

    await user.type(textarea, "Hello");
    await user.click(sendButton);

    await waitFor(() => {
      expect(textarea).toBeDisabled();
    });
    expect(sendButton).toBeDisabled();

    releaseRequest();

    await waitFor(() => {
      expect(textarea).not.toBeDisabled();
    });
    expect(textarea).toHaveValue("");
  });

  it("keeps the text when sending fails", async () => {
    server.use(
      http.post("*/api/conversations/1/messages", () =>
        HttpResponse.json(
          {
            message: "The message could not be sent.",
            code: "server_error",
            request_id: null,
          },
          { status: 500 },
        ),
      ),
    );

    const user = userEvent.setup();
    renderComposer();

    const textarea = screen.getByRole("textbox", { name: "Message" });
    await user.type(textarea, "Hello");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() => {
      expect(textarea).not.toBeDisabled();
    });
    expect(textarea).toHaveValue("Hello");
  });
});
