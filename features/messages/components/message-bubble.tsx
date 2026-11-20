import { cn } from "@/lib/utils";
import { formatFullTime, formatRelativeTime } from "@/lib/format";
import type { Message } from "../types";

export function MessageBubble({
  message,
  currentUserId,
}: {
  message: Message;
  currentUserId: number;
}) {
  const isOwn = message.sender.id === currentUserId;

  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] space-y-1 rounded-2xl px-3 py-2",
          isOwn
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground",
        )}
      >
        <p className="text-sm break-words whitespace-pre-wrap">
          {message.body}
        </p>
        <time
          dateTime={message.created_at}
          title={formatFullTime(message.created_at)}
          className={cn(
            "block text-[11px]",
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          {formatRelativeTime(message.created_at)}
        </time>
      </div>
    </div>
  );
}
