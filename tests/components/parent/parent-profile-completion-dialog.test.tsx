import userEvent from "@testing-library/user-event";
import { fireEvent, screen, waitFor } from "@testing-library/react";

import { ParentProfileCompletionDialog } from "@/components/parent/parent-profile-completion-dialog";
import { completeParentProfile } from "@/lib/api";
import { showAppSuccess } from "@/lib/errors";
import { mockParentProfile } from "../../helpers/profile-api.mock";
import { renderWithProviders } from "../../helpers/render";

const mockRefresh = jest.fn().mockResolvedValue(mockParentProfile);

jest.mock("@/hooks/use-current-user", () => ({
  useCurrentUser: () => ({
    profile: mockParentProfile,
    refresh: mockRefresh,
  }),
}));

jest.mock("@/lib/auth/parent-profile", () => ({
  clearParentProfilePending: jest.fn(),
}));

jest.mock("@/lib/auth/session", () => ({
  clearAuthSession: jest.fn(),
}));

function submitForm() {
  const button = screen.getByRole("button", { name: "Hoàn tất hồ sơ" });
  const form = button.closest("form");
  if (!form) throw new Error("Form not found");
  fireEvent.submit(form);
}

describe("ParentProfileCompletionDialog", () => {
  it("shows required field errors on empty submit", async () => {
    renderWithProviders(
      <ParentProfileCompletionDialog open profile={mockParentProfile} />,
    );

    submitForm();

    expect(await screen.findByText("Họ tên là bắt buộc.")).toBeInTheDocument();
    expect(screen.getByText("Số điện thoại là bắt buộc.")).toBeInTheDocument();
    expect(screen.getByText("Mật khẩu phải có ít nhất 8 ký tự.")).toBeInTheDocument();
    expect(completeParentProfile).not.toHaveBeenCalled();
  });

  it("shows mismatch error when confirm password differs", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ParentProfileCompletionDialog open profile={mockParentProfile} />,
    );

    await user.type(screen.getByLabelText("Họ và tên"), "Phu Huynh A");
    await user.type(screen.getByLabelText("Số điện thoại"), "0987654321");
    await user.type(screen.getByLabelText("Mật khẩu mới"), "password123");
    await user.type(screen.getByLabelText("Xác nhận mật khẩu"), "different");
    submitForm();

    expect(
      await screen.findByText("Mật khẩu xác nhận không khớp."),
    ).toBeInTheDocument();
  });

  it("completes parent profile successfully", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ParentProfileCompletionDialog open profile={mockParentProfile} />,
    );

    await user.type(screen.getByLabelText("Họ và tên"), "Phu Huynh A");
    await user.type(screen.getByLabelText("Số điện thoại"), "0987654321");
    await user.type(screen.getByLabelText("Mật khẩu mới"), "password123");
    await user.type(screen.getByLabelText("Xác nhận mật khẩu"), "password123");
    await user.click(screen.getByRole("button", { name: "Hoàn tất hồ sơ" }));

    await waitFor(() => {
      expect(completeParentProfile).toHaveBeenCalledWith({
        fullName: "Phu Huynh A",
        phone: "0987654321",
        password: "password123",
      });
      expect(mockRefresh).toHaveBeenCalled();
      expect(showAppSuccess).toHaveBeenCalled();
    });
  });
});
