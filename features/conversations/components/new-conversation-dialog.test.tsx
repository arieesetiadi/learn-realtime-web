import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { server } from "../../../test/msw/server";
import { NewConversationDialog } from "./new-conversation-dialog";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const conversation = {
  id: 7,
  other_user: { id: 2, name: "Jane", email: "jane@example.com" },
  last_message: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

function renderDialog() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <NewConversationDialog />
    </QueryClientProvider>,
  );
}

async function openDialog() {
  const user = userEvent.setup();
  renderDialog();
  await user.click(screen.getByRole("button", { name: "New chat" }));
  return user;
}

describe("NewConversationDialog", () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it("creates a conversation by recipient email and navigates to it", async () => {
    let body: unknown;

    server.use(
      http.post("*/api/conversations", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ data: conversation }, { status: 201 });
      }),
    );

    const user = await openDialog();
    await user.type(
      screen.getByRole("textbox", { name: "Recipient email" }),
      "jane@example.com",
    );
    await user.click(screen.getByRole("button", { name: "Start chat" }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/conversations/7");
    });
    expect(body).toEqual({ recipient_email: "jane@example.com" });
  });

  it("maps a 422 recipient_email error onto the field", async () => {
    server.use(
      http.post("*/api/conversations", () =>
        HttpResponse.json(
          {
            message: "The given data was invalid.",
            code: "validation_failed",
            request_id: null,
            errors: {
              recipient_email: ["No user found with that email."],
            },
          },
          { status: 422 },
        ),
      ),
    );

    const user = await openDialog();
    await user.type(
      screen.getByRole("textbox", { name: "Recipient email" }),
      "nobody@example.com",
    );
    await user.click(screen.getByRole("button", { name: "Start chat" }));

    expect(
      await screen.findByText("No user found with that email."),
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("blocks submission for an invalid email", async () => {
    const user = await openDialog();
    await user.type(
      screen.getByRole("textbox", { name: "Recipient email" }),
      "not-an-email",
    );
    await user.click(screen.getByRole("button", { name: "Start chat" }));

    expect(
      await screen.findByText("Enter a valid email address."),
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
