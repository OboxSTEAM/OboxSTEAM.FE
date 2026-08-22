import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { showAppSuccess } from "@/lib/errors";
import { navigationMocks } from "../../helpers/navigation-mocks";
import { renderWithProviders } from "../../helpers/render";

describe("ResetPasswordForm", () => {
  it("shows mismatch error when confirm password differs", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ResetPasswordForm email="student@example.com" token="reset-token" />,
    );

    await user.type(screen.getByLabelText("Mật khẩu mới"), "password123");
    await user.type(screen.getByLabelText("Xác nhận mật khẩu"), "different");
    await user.click(screen.getByRole("button", { name: "Cập nhật mật khẩu" }));

    expect(
      await screen.findByText("Mật khẩu xác nhận không khớp."),
    ).toBeInTheDocument();
  });

  it("rejects password shorter than 8 characters", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ResetPasswordForm email="student@example.com" token="reset-token" />,
    );

    await user.type(screen.getByLabelText("Mật khẩu mới"), "short");
    await user.type(screen.getByLabelText("Xác nhận mật khẩu"), "short");
    await user.click(screen.getByRole("button", { name: "Cập nhật mật khẩu" }));

    expect(
      await screen.findByText("Mật khẩu phải có ít nhất 8 ký tự."),
    ).toBeInTheDocument();
  });

  it("updates password and redirects to login", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderWithProviders(
      <ResetPasswordForm email="student@example.com" token="reset-token" />,
    );

    await user.type(screen.getByLabelText("Mật khẩu mới"), "newpassword123");
    await user.type(screen.getByLabelText("Xác nhận mật khẩu"), "newpassword123");
    await user.click(screen.getByRole("button", { name: "Cập nhật mật khẩu" }));

    await waitFor(() => {
      expect(showAppSuccess).toHaveBeenCalled();
    });

    jest.advanceTimersByTime(1200);
    expect(navigationMocks.push).toHaveBeenCalledWith("/login");
    jest.useRealTimers();
  });
});
