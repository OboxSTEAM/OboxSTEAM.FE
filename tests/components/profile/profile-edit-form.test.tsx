import userEvent from "@testing-library/user-event";
import { fireEvent, screen, waitFor } from "@testing-library/react";

import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { updateProfile } from "@/lib/api/account";
import { showAppSuccess } from "@/lib/errors";
import { mockUserProfile } from "../../helpers/profile-api.mock";
import { renderWithProviders } from "../../helpers/render";

function submitForm() {
  const button = screen.getByRole("button", { name: "Lưu thay đổi" });
  const form = button.closest("form");
  if (!form) throw new Error("Form not found");
  fireEvent.submit(form);
}

describe("ProfileEditForm", () => {
  it("shows unsaved changes hint after editing", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ProfileEditForm profile={mockUserProfile} onUpdated={jest.fn()} />,
    );

    await user.clear(screen.getByLabelText("Họ và tên"));
    await user.type(screen.getByLabelText("Họ và tên"), "Tran Thi B");

    expect(
      screen.getByText("Bạn có thay đổi chưa lưu."),
    ).toBeInTheDocument();
  });

  it("shows validation error when full name is cleared", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ProfileEditForm profile={mockUserProfile} onUpdated={jest.fn()} />,
    );

    await user.clear(screen.getByLabelText("Họ và tên"));
    submitForm();

    expect(await screen.findByText("Họ tên là bắt buộc.")).toBeInTheDocument();
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it("saves profile and notifies parent on success", async () => {
    const user = userEvent.setup();
    const onUpdated = jest.fn();
    renderWithProviders(
      <ProfileEditForm profile={mockUserProfile} onUpdated={onUpdated} />,
    );

    await user.clear(screen.getByLabelText("Họ và tên"));
    await user.type(screen.getByLabelText("Họ và tên"), "Tran Thi B");
    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith({
        fullName: "Tran Thi B",
        phone: "0912345678",
      });
      expect(onUpdated).toHaveBeenCalled();
      expect(showAppSuccess).toHaveBeenCalled();
    });
  });
});
