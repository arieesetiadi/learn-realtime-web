import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { conversationKeys } from "@/features/conversations/queries";
import { fetchMessages, sendMessage } from "./api";
import { upsertMessage } from "./cache";
import { messageBodySchema } from "./schemas";

export const messageKeys = {
  all: ["messages"] as const,
  list: (conversationId: number) =>
    [...messageKeys.all, "list", conversationId] as const,
};

export function useMessages(conversationId: number) {
  return useInfiniteQuery({
    queryKey: messageKeys.list(conversationId),
    queryFn: ({ pageParam, signal }) =>
      fetchMessages(conversationId, pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.next_cursor ?? undefined,
  });
}

export function useSendMessage(conversationId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: string) => {
      const parsed = messageBodySchema.safeParse(body);

      if (!parsed.success) {
        return Promise.reject(
          new Error(parsed.error.issues[0]?.message ?? "Invalid message."),
        );
      }

      return sendMessage(conversationId, parsed.data);
    },
    onSuccess: (response) => {
      upsertMessage(
        queryClient,
        messageKeys.list(conversationId),
        response.data,
      );
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.all,
      });
    },
  });
}
