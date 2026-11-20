"use client";

import { Send } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/errors";
import { useSendMessage } from "../queries";
import { messageBodySchema } from "../schemas";

export function MessageComposer({
  conversationId,
  onSent,
}: {
  conversationId: number;
  onSent?: () => void;
}) {
  const [body, setBody] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendMessage = useSendMessage(conversationId);

  async function submit() {
    const parsed = messageBodySchema.safeParse(body);

    if (!parsed.success) {
      if (body.trim().length > 0) {
        toast.error(parsed.error.issues[0]?.message ?? "Invalid message.");
      }
      return;
    }

    try {
      await sendMessage.mutateAsync(parsed.data);
      setBody("");
      requestAnimationFrame(() => textareaRef.current?.focus());
      onSent?.();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("The message could not be sent.");
      }
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      void submit();
    }
  }

  const disabled = sendMessage.isPending || body.trim().length === 0;

  return (
    <div className="border-t p-3 sm:p-4">
      <div className="mx-auto w-full max-w-3xl space-y-2">
        <Label htmlFor="message-body" className="sr-only">
          Message
        </Label>
        <div className="flex items-end gap-2">
          <Textarea
            id="message-body"
            ref={textareaRef}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a message..."
            rows={2}
            maxLength={5000}
            disabled={sendMessage.isPending}
            aria-describedby="message-hint"
            className="max-h-40 resize-none"
          />
          <Button
            type="button"
            size="icon"
            onClick={() => void submit()}
            disabled={disabled}
            aria-label="Send message"
          >
            <Send />
          </Button>
        </div>
        <p id="message-hint" className="text-xs text-muted-foreground">
          Enter sends, Shift+Enter adds a new line.
        </p>
      </div>
    </div>
  );
}
