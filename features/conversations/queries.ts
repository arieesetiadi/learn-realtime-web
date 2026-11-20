import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createConversation,
  fetchConversations,
  type CreateConversationInput,
} from "./api";

export const conversationKeys = {
  all: ["conversations"] as const,
  list: () => [...conversationKeys.all, "list"] as const,
};

export function useConversations() {
  return useInfiniteQuery({
    queryKey: conversationKeys.list(),
    queryFn: ({ pageParam, signal }) => fetchConversations(pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.next_cursor ?? undefined,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateConversationInput) => createConversation(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: conversationKeys.all }),
  });
}
