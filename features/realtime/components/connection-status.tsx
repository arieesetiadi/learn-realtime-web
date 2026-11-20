import type { ConnectionStatus as EchoConnectionStatus } from "laravel-echo";

import { Badge } from "@/components/ui/badge";

function labelFor(status: EchoConnectionStatus): string {
  if (status === "connected") return "Connected";
  if (status === "connecting") return "Connecting";
  if (status === "reconnecting") return "Reconnecting";
  return "Disconnected";
}

export function ConnectionStatus({ status }: { status: EchoConnectionStatus }) {
  return (
    <Badge variant="outline" className="text-xs whitespace-nowrap">
      {labelFor(status)}
    </Badge>
  );
}
