import { describe, expect, it } from "vitest";

import { createConversationSchema, newConversationFormSchema } from "./schemas";

describe("createConversationSchema", () => {
  it("accepts a recipient email and normalizes it", () => {
    const parsed = createConversationSchema.safeParse({
      recipient_email: "  Jane@Example.com ",
    });

    expect(parsed.success).toBe(true);

    if (parsed.success) {
      expect(parsed.data.recipient_email).toBe("jane@example.com");
    }
  });

  it("accepts a recipient id", () => {
    expect(
      createConversationSchema.safeParse({ recipient_id: "2" }).success,
    ).toBe(true);
  });

  it("rejects both keys and neither key", () => {
    expect(
      createConversationSchema.safeParse({
        recipient_id: 2,
        recipient_email: "jane@example.com",
      }).success,
    ).toBe(false);
    expect(createConversationSchema.safeParse({}).success).toBe(false);
  });

  it("rejects a non-positive id", () => {
    expect(
      createConversationSchema.safeParse({ recipient_id: 0 }).success,
    ).toBe(false);
  });
});

describe("newConversationFormSchema", () => {
  it("requires an email address", () => {
    expect(
      newConversationFormSchema.safeParse({ recipientEmail: "" }).success,
    ).toBe(false);
    expect(
      newConversationFormSchema.safeParse({ recipientEmail: "nope" }).success,
    ).toBe(false);
    expect(
      newConversationFormSchema.safeParse({
        recipientEmail: "jane@example.com",
      }).success,
    ).toBe(true);
  });
});
