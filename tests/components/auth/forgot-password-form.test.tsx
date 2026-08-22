import userEvent from "@testing-library/user-event";
import { fireEvent, screen, waitFor } from "@testing-library/react";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { showAppSuccess } from "@/lib/errors";
import { renderWithProviders } from "../../helpers/render";

function submitForm(buttonName: string) {
  const button = screen.getByRole("button", { name: buttonName });
  const form = button.closest("form");
  if (!form) throw new Error("Form not found");
  fireEvent.submit(form);
}

describe("ForgotPasswordForm", () => {
  it("shows error for invalid email", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("Email"), "bad-email");
    submitForm("Gửi liên kết");

    expect(await screen.findByText("Email không hợp lệ.")).toBeInTheDocument();
  });

  it("shows success toast after sending reset link", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("Email"), "student@example.com");
    await user.click(screen.getByRole("button", { name: "Gửi liên kết" }));

    await waitFor(() => {
      expect(showAppSuccess).toHaveBeenCalled();
    });
  });
});
