import userEvent from "@testing-library/user-event";
import { fireEvent, screen, waitFor } from "@testing-library/react";

import { LoginForm } from "@/components/auth/login-form";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { navigationMocks } from "../../helpers/navigation-mocks";
import { renderWithProviders } from "../../helpers/render";

function submitForm(buttonName: string) {
  const button = screen.getByRole("button", { name: buttonName });
  const form = button.closest("form");
  if (!form) throw new Error("Form not found");
  fireEvent.submit(form);
}

describe("LoginForm", () => {
  it("shows validation errors when submitted empty", async () => {
    renderWithProviders(<LoginForm />);
    submitForm("Đăng nhập");

    expect(await screen.findByText("Email không hợp lệ.")).toBeInTheDocument();
    expect(screen.getByText("Mật khẩu là bắt buộc.")).toBeInTheDocument();
  });

  it("shows error for invalid email format", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.type(screen.getByLabelText("Mật khẩu"), "password123");
    submitForm("Đăng nhập");

    expect(await screen.findByText("Email không hợp lệ.")).toBeInTheDocument();
  });

  it("redirects to home after successful login", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "student@example.com");
    await user.type(screen.getByLabelText("Mật khẩu"), "password123");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    await waitFor(() => {
      expect(showAppSuccess).toHaveBeenCalled();
      expect(navigationMocks.push).toHaveBeenCalledWith("/");
    });
  });

  it("shows auth.login error toast when API rejects credentials", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "fail@example.com");
    await user.type(screen.getByLabelText("Mật khẩu"), "wrong");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    await waitFor(() => {
      expect(showAppErrorFromUnknown).toHaveBeenCalledWith(
        expect.anything(),
        "auth.login",
      );
    });
  });
});
