import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { server } from "../../../test/msw/server";
import { LoginForm } from "./login-form";

const { replaceMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("LoginForm", () => {
  it("shows client-side validation errors", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(
      await screen.findByText("Enter a valid email address."),
    ).toBeInTheDocument();
    expect(screen.getByText("Password is required.")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("redirects to conversations after a successful login", async () => {
    server.use(
      http.post("*/api/auth/login", () =>
        HttpResponse.json({
          data: {
            user: {
              id: 1,
              name: "Alex",
              email: "alex@example.com",
            },
          },
        }),
      ),
    );

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(
      screen.getByRole("textbox", { name: "Email" }),
      "alex@example.com",
    );
    await user.type(
      screen.getByLabelText("Password"),
      "CorrectHorseBatteryStaple1!",
    );
    await user.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/conversations");
    });
  });

  it("maps a 422 response to the email field", async () => {
    server.use(
      http.post("*/api/auth/login", () =>
        HttpResponse.json(
          {
            message: "The given data was invalid.",
            code: "validation_failed",
            request_id: null,
            errors: {
              email: ["These credentials do not match our records."],
            },
          },
          { status: 422 },
        ),
      ),
    );

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(
      screen.getByRole("textbox", { name: "Email" }),
      "alex@example.com",
    );
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(
      await screen.findByText("These credentials do not match our records."),
    ).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
