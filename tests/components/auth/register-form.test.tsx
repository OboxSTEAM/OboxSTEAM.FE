import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";

import { RegisterForm } from "@/components/auth/register-form";
import { showAppSuccess } from "@/lib/errors";
import { navigationMocks } from "../../helpers/navigation-mocks";
import { renderWithProviders } from "../../helpers/render";

describe("RegisterForm", () => {
  it("shows validation errors for empty required fields", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await user.click(screen.getByRole("button", { name: "Đăng ký" }));

    expect(await screen.findByText("Họ tên là bắt buộc.")).toBeInTheDocument();
    expect(screen.getByText("Email không hợp lệ.")).toBeInTheDocument();
    expect(screen.getByText("Số điện thoại là bắt buộc.")).toBeInTheDocument();
  });

  it("rejects password shorter than 8 characters", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await user.type(screen.getByLabelText("Họ và tên"), "Nguyen Van A");
    await user.type(screen.getByLabelText("Email"), "new@example.com");
    await user.type(screen.getByLabelText("Số điện thoại"), "0912345678");
    await user.type(screen.getByLabelText("Mật khẩu"), "short");
    await user.click(screen.getByRole("button", { name: "Đăng ký" }));

    expect(
      await screen.findByText("Mật khẩu phải có ít nhất 8 ký tự."),
    ).toBeInTheDocument();
  });

  it("navigates to verify OTP after successful registration", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await user.type(screen.getByLabelText("Họ và tên"), "Nguyen Van A");
    await user.type(screen.getByLabelText("Email"), "new@example.com");
    await user.type(screen.getByLabelText("Số điện thoại"), "0912345678");
    await user.type(screen.getByLabelText("Mật khẩu"), "password123");
    await user.click(screen.getByRole("button", { name: "Đăng ký" }));

    await waitFor(() => {
      expect(showAppSuccess).toHaveBeenCalled();
      expect(navigationMocks.push).toHaveBeenCalledWith(
        "/verify-otp?email=new%40example.com",
      );
    });
  });
});
