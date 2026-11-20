import { Suspense } from "react";
import { notFound } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { ConversationView } from "@/features/messages/components/conversation-view";

type ConversationPageProps = {
  params: Promise<{ conversationId: string }>;
};

function ChatFallback() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="flex-1 space-y-3 p-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="ml-auto h-10 w-1/2" />
        <Skeleton className="h-10 w-3/5" />
      </div>
      <div className="border-t p-4">
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}

export default function ConversationPage({ params }: ConversationPageProps) {
  return (
    <Suspense fallback={<ChatFallback />}>
      <ConversationContent params={params} />
    </Suspense>
  );
}

async function ConversationContent({ params }: ConversationPageProps) {
  const { conversationId } = await params;
  const id = Number(conversationId);

  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  return <ConversationView conversationId={id} />;
}
