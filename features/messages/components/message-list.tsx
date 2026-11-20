"use client";

import { Loader2 } from "lucide-react";
import type { RefObject } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageBubble } from "./message-bubble";
import type { Message } from "../types";

export function MessageList({
  messages,
  currentUserId,
  isPending,
  isError,
  onRetry,
  hasNextPage,
  isFetchingNextPage,
  onLoadOlder,
  bottomRef,
}: {
  messages: Message[];
  currentUserId: number;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadOlder: () => void;
  bottomRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      className="flex-1 overflow-y-auto"
      role="log"
      aria-live="polite"
      aria-label="Messages"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 p-4">
        {hasNextPage ? (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={onLoadOlder}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="animate-spin" />
                  Loading
                </>
              ) : (
                "Load older messages"
              )}
            </Button>
          </div>
        ) : null}

        {isPending ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="ml-auto h-10 w-1/2" />
            <Skeleton className="h-10 w-3/5" />
          </div>
        ) : null}

        {isError ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Messages could not be loaded.
            </p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Try again
            </Button>
          </div>
        ) : null}

        {!isPending && !isError && messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No messages yet. Say hello.
          </p>
        ) : null}

        {!isPending && !isError
          ? messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                currentUserId={currentUserId}
              />
            ))
          : null}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
