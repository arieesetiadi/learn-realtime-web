"use client";

import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useSession } from "@/features/auth/session-provider";
import { ConversationList } from "@/features/conversations/components/conversation-list";
import { NewConversationDialog } from "@/features/conversations/components/new-conversation-dialog";
import { apiFetch } from "@/lib/api/client";

export function AppShell({ children }: { children: ReactNode }) {
  const user = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  async function handleLogout() {
    try {
      await apiFetch("/api/auth/logout", {
        method: "POST",
        redirectOn401: false,
      });
    } catch {
      // The cookie is cleared by the BFF even when the upstream call fails.
    } finally {
      queryClient.clear();
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/conversations" className="truncate font-semibold">
            Realtime Chat
          </Link>
          <span className="hidden truncate text-sm text-muted-foreground sm:inline">
            {user.name}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <NewConversationDialog />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            aria-label="Log out"
          >
            <LogOut />
          </Button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-80 shrink-0 flex-col border-r md:flex">
          <ConversationList />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
