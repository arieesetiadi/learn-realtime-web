"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useCreateConversation } from "../queries";
import {
  newConversationFormSchema,
  type NewConversationFormInput,
} from "../schemas";

export function NewConversationDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const createConversation = useCreateConversation();
  const form = useForm<NewConversationFormInput>({
    resolver: zodResolver(newConversationFormSchema),
    defaultValues: {
      recipientEmail: "",
    },
  });

  async function onSubmit(values: NewConversationFormInput) {
    try {
      const response = await createConversation.mutateAsync({
        recipientEmail: values.recipientEmail,
      });

      setOpen(false);
      form.reset();
      router.push(`/conversations/${response.data.id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        const recipientError = error.errors?.recipient_email?.[0];

        if (error.status === 422 && recipientError) {
          form.setError("recipientEmail", {
            type: "server",
            message: recipientError,
          });
          return;
        }

        toast.error(error.message);
        return;
      }

      toast.error("The conversation could not be created.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          New chat
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a conversation</DialogTitle>
          <DialogDescription>
            Enter the email of the person you want to chat with.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="recipientEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="email"
                        autoCapitalize="none"
                        placeholder="jane@example.com"
                        disabled={createConversation.isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="mt-6">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={createConversation.isPending}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={createConversation.isPending}>
                {createConversation.isPending ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Starting
                  </>
                ) : (
                  "Start chat"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
