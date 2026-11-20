import { z } from "zod";

export const messageBodySchema = z
  .string()
  .trim()
  .min(1, "Write a message first.")
  .max(5000, "Messages can be at most 5000 characters.");

export const sendMessageSchema = z.object({
  body: messageBodySchema,
});
