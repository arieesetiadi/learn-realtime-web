import { apiFetch } from "@/lib/api/client";
import type { CursorPage } from "@/lib/api/types";
import type { Conversation } from "./types";

export type CreateConversationInput =
  { recipientId: number } | { recipientEmail: string };

export function fetchConversations(
  cursor: string | undefined,
  signal?: AbortSignal,
) {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return apiFetch<CursorPage<Conversation>>(`/api/conversations${query}`, {
    signal,
  });
}

export function createConversation(input: CreateConversationInput) {
  return apiFetch<{ data: Conversation }>("/api/conversations", {
    method: "POST",
    body: JSON.stringify(
      "recipientId" in input
        ? { recipient_id: input.recipientId }
        : { recipient_email: input.recipientEmail },
    ),
  });
}
