import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";

import { VerifyOtpForm } from "@/components/auth/verify-otp-form";
import { showAppSuccess } from "@/lib/errors";
import { navigationMocks } from "../../helpers/navigation-mocks";
import { renderWithProviders } from "../../helpers/render";

describe("VerifyOtpForm", () => {
  beforeEach(() => {
    navigationMocks.searchParams = new URLSearchParams({
      email: "student@example.com",
    });
  });

  it("blocks non-6-digit OTP on submit", async () => {
    const user = userEvent.setup();
    renderWithProviders(<VerifyOtpForm />);

    await user.type(screen.getByLabelText("Mã OTP"), "123");
    await user.click(screen.getByRole("button", { name: "Xác thực" }));

    expect(
      await screen.findByText("Mã OTP phải có 6 chữ số."),
    ).toBeInTheDocument();
  });

  it("submits valid OTP and schedules login redirect", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderWithProviders(<VerifyOtpForm />);

    await user.type(screen.getByLabelText("Mã OTP"), "123456");
    await user.click(screen.getByRole("button", { name: "Xác thực" }));

    await waitFor(() => {
      expect(showAppSuccess).toHaveBeenCalled();
    });

    jest.advanceTimersByTime(1200);

    expect(navigationMocks.push).toHaveBeenCalledWith("/login");
    jest.useRealTimers();
  });
});
