import { MessagesSquare } from "lucide-react";

import { ConversationList } from "@/features/conversations/components/conversation-list";
import { NewConversationDialog } from "@/features/conversations/components/new-conversation-dialog";

export default function ConversationsPage() {
  return (
    <>
      <div className="h-full md:hidden">
        <ConversationList />
      </div>
      <div className="hidden h-full flex-col items-center justify-center gap-4 p-6 text-center md:flex">
        <MessagesSquare className="size-8 text-muted-foreground" />
        <div className="space-y-1">
          <p className="font-medium">Select a conversation</p>
          <p className="text-sm text-muted-foreground">
            Choose a chat from the sidebar or start a new one.
          </p>
        </div>
        <NewConversationDialog />
      </div>
    </>
  );
}
