import type {
  InfiniteData,
  QueryClient,
  QueryKey,
} from "@tanstack/react-query";

import type { CursorPage } from "@/lib/api/types";
import type { Message } from "./types";

export function upsertMessage(
  queryClient: QueryClient,
  queryKey: QueryKey,
  message: Message,
) {
  const current =
    queryClient.getQueryData<
      InfiniteData<CursorPage<Message>, string | undefined>
    >(queryKey);

  if (!current || current.pages.length === 0) return;

  const pages = current.pages.map((page) => ({
    ...page,
    data: page.data.filter((item) => item.id !== message.id),
  }));

  // Messages arrive newest-first, so the newest page holds the newest message.
  pages[0] = {
    ...pages[0],
    data: [message, ...pages[0].data],
  };

  queryClient.setQueryData(queryKey, { ...current, pages });
}
