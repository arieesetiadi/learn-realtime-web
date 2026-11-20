import Link from "next/link";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatFullTime, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Conversation } from "../types";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ConversationItem({
  conversation,
  isActive,
}: {
  conversation: Conversation;
  isActive?: boolean;
}) {
  const name = conversation.other_user.name;

  return (
    <Link
      href={`/conversations/${conversation.id}`}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/60",
        isActive && "bg-accent text-accent-foreground",
      )}
    >
      <Avatar>
        <AvatarFallback>{initials(name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {conversation.last_message?.body ?? "No messages yet"}
        </p>
      </div>
      <time
        dateTime={conversation.updated_at}
        title={formatFullTime(conversation.updated_at)}
        className="shrink-0 text-[11px] text-muted-foreground"
      >
        {formatRelativeTime(conversation.updated_at)}
      </time>
    </Link>
  );
}
