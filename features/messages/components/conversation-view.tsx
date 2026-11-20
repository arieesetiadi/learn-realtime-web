"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { Button } from "@/components/ui/button";
import { useSession } from "@/features/auth/session-provider";
import { useConversations } from "@/features/conversations/queries";
import { ConnectionStatus } from "@/features/realtime/components/connection-status";
import { useConversationChannel } from "@/features/realtime/use-conversation-channel";
import { MessageComposer } from "./message-composer";
import { MessageList } from "./message-list";
import { useMessages } from "../queries";

export function ConversationView({
  conversationId,
}: {
  conversationId: number;
}) {
  const currentUser = useSession();
  const conversations = useConversations();
  const messagesQuery = useMessages(conversationId);
  const { status } = useConversationChannel(conversationId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const didInitialScroll = useRef(false);

  const conversation = conversations.data?.pages
    .flatMap((page) => page.data)
    .find((item) => item.id === conversationId);

  const title = conversation?.other_user.name ?? "Conversation";

  const messages = useMemo(() => {
    if (!messagesQuery.data) return [];
    return messagesQuery.data.pages.flatMap((page) => page.data).reverse();
  }, [messagesQuery.data]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior, block: "end" });
    });
  }, []);

  useEffect(() => {
    if (
      messagesQuery.isSuccess &&
      !didInitialScroll.current &&
      messages.length > 0
    ) {
      scrollToBottom("auto");
      didInitialScroll.current = true;
    }
  }, [messages.length, messagesQuery.isSuccess, scrollToBottom]);

  const lastMessage = messages[messages.length - 1];
  const announcement =
    lastMessage && lastMessage.sender.id !== currentUser.id
      ? `${lastMessage.sender.name}: ${lastMessage.body}`
      : "";

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Back to conversations"
        >
          <Link href="/conversations">
            <ChevronLeft />
          </Link>
        </Button>
        <p className="min-w-0 flex-1 truncate font-medium">{title}</p>
        <ConnectionStatus status={status} />
      </header>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      <MessageList
        messages={messages}
        currentUserId={currentUser.id}
        isPending={messagesQuery.isPending}
        isError={messagesQuery.isError}
        onRetry={() => void messagesQuery.refetch()}
        hasNextPage={messagesQuery.hasNextPage}
        isFetchingNextPage={messagesQuery.isFetchingNextPage}
        onLoadOlder={() => void messagesQuery.fetchNextPage()}
        bottomRef={bottomRef}
      />

      <MessageComposer
        conversationId={conversationId}
        onSent={() => scrollToBottom()}
      />
    </div>
  );
}
