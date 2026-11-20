"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { ConnectionStatus } from "laravel-echo";

import { conversationKeys } from "@/features/conversations/queries";
import { upsertMessage } from "@/features/messages/cache";
import { messageKeys } from "@/features/messages/queries";
import type { Message } from "@/features/messages/types";
import { getEcho } from "./echo";

export function useConversationChannel(conversationId: number) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ConnectionStatus>("connecting");

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    let leaveChannel: (() => void) | undefined;

    async function setup() {
      const echo = await getEcho();

      if (cancelled) return;

      const channelName = `conversation.${conversationId}`;
      const channel = echo.private(channelName);

      channel.listen(".MessageSent", (message: Message) => {
        upsertMessage(queryClient, messageKeys.list(conversationId), message);
        void queryClient.invalidateQueries({
          queryKey: conversationKeys.all,
        });
      });

      const initialStatus = echo.connectionStatus();
      setStatus(initialStatus);
      let hasConnected = initialStatus === "connected";

      unsubscribe = echo.connector.onConnectionChange((nextStatus) => {
        setStatus(nextStatus);

        if (nextStatus === "connected") {
          if (hasConnected) {
            void queryClient.invalidateQueries({
              queryKey: messageKeys.list(conversationId),
            });
            void queryClient.invalidateQueries({
              queryKey: conversationKeys.all,
            });
          }

          hasConnected = true;
        }
      });

      leaveChannel = () =>
        echo.connector.leaveChannel(`private-${channelName}`);
    }

    void setup().catch(() => {
      if (!cancelled) {
        setStatus("failed");
      }
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
      leaveChannel?.();
    };
  }, [conversationId, queryClient]);

  return { status };
}
