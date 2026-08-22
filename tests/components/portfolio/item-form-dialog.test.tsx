import userEvent from "@testing-library/user-event";
import { fireEvent, screen, waitFor } from "@testing-library/react";

import { PortfolioItemFormDialog } from "@/components/portfolio/sections/item-form-dialog";
import {
  createPortfolioItem,
  updatePortfolioItem,
} from "@/lib/api/portfolios";
import { showAppSuccess } from "@/lib/errors";
import { mockPortfolioItem } from "../../helpers/profile-api.mock";
import { renderWithProviders } from "../../helpers/render";

jest.mock("@/lib/portfolio/sanitize-html", () => ({
  nullIfEmptyHtml: (value: string | null | undefined) => value ?? null,
}));

jest.mock("@/components/portfolio/editor/rich-text-editor", () => ({
  RichTextEditor: ({
    value,
    onChange,
    placeholder,
  }: {
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
  }) => (
    <textarea
      aria-label={placeholder ?? "rich-text"}
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

jest.mock("@/components/portfolio/editor/media-uploader", () => ({
  MediaUploader: () => <div data-testid="media-uploader" />,
}));

function submitCreateForm() {
  const button = screen.getByRole("button", { name: "Thêm mục" });
  const form = button.closest("form");
  if (!form) throw new Error("Form not found");
  fireEvent.submit(form);
}

describe("PortfolioItemFormDialog", () => {
  it("does not create item when title is empty", async () => {
    const onSaved = jest.fn();
    renderWithProviders(
      <PortfolioItemFormDialog
        open
        onOpenChange={jest.fn()}
        onSaved={onSaved}
      />,
    );

    submitCreateForm();

    await waitFor(() => {
      expect(createPortfolioItem).not.toHaveBeenCalled();
    });
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("creates portfolio item when title is provided", async () => {
    const user = userEvent.setup();
    const onSaved = jest.fn();
    const onOpenChange = jest.fn();

    renderWithProviders(
      <PortfolioItemFormDialog
        open
        onOpenChange={onOpenChange}
        onSaved={onSaved}
      />,
    );

    await user.type(screen.getByLabelText("Tiêu đề"), "Du an robot");
    await user.click(screen.getByRole("button", { name: "Thêm mục" }));

    await waitFor(() => {
      expect(createPortfolioItem).toHaveBeenCalled();
      expect(onSaved).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(showAppSuccess).toHaveBeenCalled();
    });
  });

  it("updates existing portfolio item in edit mode", async () => {
    const user = userEvent.setup();
    const onSaved = jest.fn();

    renderWithProviders(
      <PortfolioItemFormDialog
        open
        item={mockPortfolioItem}
        onOpenChange={jest.fn()}
        onSaved={onSaved}
      />,
    );

    const titleInput = screen.getByLabelText("Tiêu đề");
    await user.clear(titleInput);
    await user.type(titleInput, "Du an da cap nhat");
    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    await waitFor(() => {
      expect(updatePortfolioItem).toHaveBeenCalledWith(
        mockPortfolioItem.id,
        expect.objectContaining({ title: "Du an da cap nhat" }),
      );
      expect(onSaved).toHaveBeenCalled();
      expect(showAppSuccess).toHaveBeenCalled();
    });
  });
});
