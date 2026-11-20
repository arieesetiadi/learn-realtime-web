import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-4 text-center">
      <div>
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="text-2xl font-semibold">Page not found</h1>
      </div>
      <Button asChild>
        <Link href="/conversations">Back to conversations</Link>
      </Button>
    </div>
  );
}
