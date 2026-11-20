import { apiFetch } from "@/lib/api/client";
import type { CursorPage } from "@/lib/api/types";
import type { Message } from "./types";

export function fetchMessages(
  conversationId: number,
  cursor: string | undefined,
  signal?: AbortSignal,
) {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return apiFetch<CursorPage<Message>>(
    `/api/conversations/${conversationId}/messages${query}`,
    { signal },
  );
}

export function sendMessage(conversationId: number, body: string) {
  return apiFetch<{ data: Message }>(
    `/api/conversations/${conversationId}/messages`,
    {
      method: "POST",
      body: JSON.stringify({ body }),
    },
  );
}
