import type { User } from "@/features/auth/types";
import type { Message } from "@/features/messages/types";

export type Conversation = {
  id: number;
  other_user: User;
  last_message: Message | null;
  created_at: string;
  updated_at: string;
};
