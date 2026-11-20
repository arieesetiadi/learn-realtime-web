"use client";

import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useConversations } from "../queries";
import { ConversationItem } from "./conversation-item";
import { NewConversationDialog } from "./new-conversation-dialog";

function ConversationListSkeleton() {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 px-2 py-2">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ConversationList() {
  const pathname = usePathname();
  const {
    data,
    isPending,
    isError,
    refetch,
    isFetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useConversations();

  if (isPending) {
    return <ConversationListSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Conversations could not be loaded.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          {isFetching ? <Loader2 className="animate-spin" /> : null}
          Try again
        </Button>
      </div>
    );
  }

  const conversations = data.pages.flatMap((page) => page.data);

  if (conversations.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="space-y-1">
          <p className="font-medium">No conversations yet</p>
          <p className="text-sm text-muted-foreground">
            Start chatting with someone.
          </p>
        </div>
        <NewConversationDialog />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isActive={pathname === `/conversations/${conversation.id}`}
            />
          ))}
        </div>
        {hasNextPage ? (
          <div className="p-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="animate-spin" />
                  Loading
                </>
              ) : (
                "Load more"
              )}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
