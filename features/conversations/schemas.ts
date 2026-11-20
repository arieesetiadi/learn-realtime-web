import { z } from "zod";

export const createConversationSchema = z
  .object({
    recipient_id: z.coerce.number().int().positive().optional(),
    recipient_email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Enter a valid email address.")
      .optional(),
  })
  .refine(
    (values) =>
      Number(values.recipient_id !== undefined) +
        Number(values.recipient_email !== undefined) ===
      1,
    { message: "Provide either a recipient ID or a recipient email." },
  );

export const newConversationFormSchema = z.object({
  recipientEmail: z
    .string()
    .trim()
    .min(1, "Recipient email is required.")
    .email("Enter a valid email address."),
});

export type NewConversationFormInput = z.infer<
  typeof newConversationFormSchema
>;
