import { Suspense } from "react";
import { redirect } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { RegisterForm } from "@/features/auth/components/register-form";
import { getCurrentUser } from "@/lib/auth/session";

function RegisterFallback() {
  return <Skeleton className="h-[560px] w-full rounded-xl" />;
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterFallback />}>
      <RegisterContent />
    </Suspense>
  );
}

async function RegisterContent() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/conversations");
  }

  return <RegisterForm />;
}
