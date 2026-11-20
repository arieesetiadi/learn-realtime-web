"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/errors";
import { apiFetch } from "@/lib/api/client";
import { loginSchema, type LoginInput } from "../schemas";
import type { User } from "../types";

type LoginResponse = {
  data: {
    user: User;
  };
};

export function LoginForm() {
  const router = useRouter();
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginInput) {
    try {
      await apiFetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
        redirectOn401: false,
      });

      router.replace("/conversations");
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 422) {
          const emailMessage = error.errors?.email?.[0] ?? error.message;
          const passwordMessage = error.errors?.password?.[0];

          form.setError("email", {
            type: "server",
            message: emailMessage,
          });

          if (passwordMessage) {
            form.setError("password", {
              type: "server",
              message: passwordMessage,
            });
          }

          return;
        }

        if (error.status === 429) {
          toast.error(
            error.retryAfter
              ? `Too many attempts. Try again in ${error.retryAfter} seconds.`
              : "Too many attempts. Please try again later.",
          );
          return;
        }

        toast.error(error.message);
        return;
      }

      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>
          Log in to continue your conversations.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="mt-6 flex-col gap-3">
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Logging in
                </>
              ) : (
                "Log in"
              )}
            </Button>
            <p className="text-sm text-muted-foreground">
              Need an account?{" "}
              <Link href="/register" className="text-foreground underline">
                Register
              </Link>
            </p>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
