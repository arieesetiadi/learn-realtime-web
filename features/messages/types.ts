import type { User } from "@/features/auth/types";

export type Message = {
  id: number;
  conversation_id: number;
  body: string;
  sender: User;
  created_at: string;
};
