import userEvent from "@testing-library/user-event";
import { fireEvent, screen, waitFor } from "@testing-library/react";

import { StudentParentLinkSection } from "@/components/profile/student-parent-link-section";
import { getParentLinks, requestParentLink } from "@/lib/api";
import { showAppSuccess } from "@/lib/errors";
import { renderWithProviders } from "../../helpers/render";

function submitInviteForm() {
  const button = screen.getByRole("button", { name: "Gửi liên kết" });
  const form = button.closest("form");
  if (!form) throw new Error("Form not found");
  fireEvent.submit(form);
}

describe("StudentParentLinkSection", () => {
  it("shows parent invite form after links load", async () => {
    renderWithProviders(<StudentParentLinkSection />);

    expect(await screen.findByLabelText("Email phụ huynh")).toBeInTheDocument();
    expect(getParentLinks).toHaveBeenCalled();
  });

  it("shows validation error for invalid parent email", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StudentParentLinkSection />);

    await screen.findByLabelText("Email phụ huynh");
    await user.type(screen.getByLabelText("Email phụ huynh"), "bad-email");
    submitInviteForm();

    expect(
      await screen.findByText("Email phụ huynh không hợp lệ."),
    ).toBeInTheDocument();
    expect(requestParentLink).not.toHaveBeenCalled();
  });

  it("sends parent link request successfully", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StudentParentLinkSection />);

    await screen.findByLabelText("Email phụ huynh");
    await user.type(
      screen.getByLabelText("Email phụ huynh"),
      "parent@example.com",
    );
    await user.click(screen.getByRole("button", { name: "Gửi liên kết" }));

    await waitFor(() => {
      expect(requestParentLink).toHaveBeenCalledWith({
        parentEmail: "parent@example.com",
      });
      expect(showAppSuccess).toHaveBeenCalled();
    });

    expect(screen.getByLabelText("Email phụ huynh")).toHaveValue("");
  });
});
