import type { ChannelAuthorizationHandler } from "pusher-js";
import type Echo from "laravel-echo";

import { env } from "@/lib/env";

let echoPromise: Promise<Echo<"reverb">> | null = null;

async function createEcho(): Promise<Echo<"reverb">> {
  const [{ default: EchoClient }, { default: PusherClient }] =
    await Promise.all([import("laravel-echo"), import("pusher-js")]);

  type PusherWindow = Window & { Pusher?: typeof PusherClient };
  (window as PusherWindow).Pusher = PusherClient;

  // Pusher's custom handler lets the token stay in the httpOnly cookie.
  const customHandler: ChannelAuthorizationHandler = async (
    { socketId, channelName },
    callback,
  ) => {
    try {
      const response = await fetch("/api/realtime/auth", {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          socket_id: socketId,
          channel_name: channelName,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Realtime authorization failed with HTTP ${response.status}.`,
        );
      }

      const data = (await response.json()) as {
        auth: string;
        channel_data?: string;
      };

      callback(null, data);
    } catch (error) {
      callback(
        error instanceof Error
          ? error
          : new Error("Realtime authorization failed."),
        null,
      );
    }
  };

  return new EchoClient<"reverb">({
    broadcaster: "reverb",
    key: env.NEXT_PUBLIC_REVERB_APP_KEY,
    wsHost: env.NEXT_PUBLIC_REVERB_HOST,
    wsPort: env.NEXT_PUBLIC_REVERB_PORT,
    wssPort: env.NEXT_PUBLIC_REVERB_PORT,
    forceTLS: env.NEXT_PUBLIC_REVERB_SCHEME === "https",
    enabledTransports: ["ws", "wss"],
    channelAuthorization: { customHandler },
  });
}

export function getEcho(): Promise<Echo<"reverb">> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Echo can only run in the browser."));
  }

  echoPromise ??= createEcho();
  return echoPromise;
}
