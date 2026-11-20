import { Suspense } from "react";
import { redirect } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { LoginForm } from "@/features/auth/components/login-form";
import { getCurrentUser } from "@/lib/auth/session";

function LoginFallback() {
  return <Skeleton className="h-[420px] w-full rounded-xl" />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}

async function LoginContent() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/conversations");
  }

  return <LoginForm />;
}
