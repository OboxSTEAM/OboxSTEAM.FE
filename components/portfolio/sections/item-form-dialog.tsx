"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { MediaUploader } from "@/components/portfolio/editor/media-uploader";
import { RichTextEditor } from "@/components/portfolio/editor/rich-text-editor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type {
  PortfolioItem,
  PortfolioItemType,
  PortfolioMediaAsset,
} from "@/lib/api/entities/portfolio";
import {
  createPortfolioItem,
  updatePortfolioItem,
} from "@/lib/api/portfolios";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import {
  MANUAL_PORTFOLIO_ITEM_TYPES,
  PORTFOLIO_ITEM_TYPE_LABELS,
} from "@/lib/portfolio/constants";
import { nullIfEmptyHtml } from "@/lib/portfolio/sanitize-html";
import {
  LIGHT_SELECT_CONTENT_PANEL,
  LIGHT_SELECT_ITEM_PANEL,
  LIGHT_SELECT_TRIGGER_FULL,
} from "@/lib/ui/select-styles";
import {
  createPortfolioItemSchema,
  updatePortfolioItemSchema,
} from "@/lib/validations/portfolios";

const createFormSchema = createPortfolioItemSchema;
const editFormSchema = updatePortfolioItemSchema;

type CreateFormValues = z.infer<typeof createFormSchema>;
type EditFormValues = z.infer<typeof editFormSchema>;

type PortfolioItemFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: PortfolioItem | null;
  /** When editing an auto-imported item, only narrative fields are emphasized. */
  narrativeOnly?: boolean;
  onSaved: (item: PortfolioItem) => void;
};

export function PortfolioItemFormDialog({
  open,
  onOpenChange,
  item,
  narrativeOnly = false,
  onSaved,
}: PortfolioItemFormDialogProps) {
  const isEdit = item != null;

  const createForm = useForm<CreateFormValues>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      itemType: "Project",
      title: "",
      subtitle: "",
      organization: "",
      description: "",
      studentEditedBody: "",
      mediaUrl: "",
      externalUrl: "",
      startDate: "",
      endDate: "",
      isVisible: true,
    },
  });

  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (!open) return;
    if (item) {
      editForm.reset({
        title: item.title,
        subtitle: item.subtitle,
        organization: item.organization,
        description: item.description,
        studentEditedBody: item.studentEditedBody,
        mediaUrl: item.mediaUrl,
        externalUrl: item.externalUrl,
        startDate: item.startDate,
        endDate: item.endDate,
        isVisible: item.isVisible,
      });
    } else {
      createForm.reset({
        itemType: "Project",
        title: "",
        subtitle: "",
        organization: "",
        description: "",
        studentEditedBody: "",
        mediaUrl: "",
        externalUrl: "",
        startDate: "",
        endDate: "",
        isVisible: true,
      });
    }
  }, [open, item]); // eslint-disable-line react-hooks/exhaustive-deps

  const [itemType, setItemType] = useState<PortfolioItemType>("Project");
  const [mediaAssets, setMediaAssets] = useState<PortfolioMediaAsset[]>([]);

  useEffect(() => {
    if (!isEdit) setItemType("Project");
  }, [isEdit, open]);

  useEffect(() => {
    if (!open) return;
    setMediaAssets(item?.mediaAssets ?? []);
  }, [open, item]);

  const handleCreate = createForm.handleSubmit(async (values) => {
    try {
      const result = await createPortfolioItem({
        ...values,
        itemType,
        title: values.title,
        subtitle: values.subtitle || null,
        organization: values.organization || null,
        description: nullIfEmptyHtml(values.description),
        studentEditedBody: nullIfEmptyHtml(values.studentEditedBody),
        mediaUrl: values.mediaUrl || null,
        externalUrl: values.externalUrl || null,
        startDate: values.startDate || null,
        endDate: values.endDate || null,
        isVisible: values.isVisible ?? true,
        mediaAssets: mediaAssets.map((asset, index) => ({
          id: asset.id,
          caption: asset.caption,
          displayOrder: asset.displayOrder ?? index,
        })),
      });
      onSaved(result.data);
      onOpenChange(false);
      showAppSuccess({
        title: "Đã thêm mục",
        description: result.message,
      });
    } catch (error) {
      showAppErrorFromUnknown(error, "portfolio.item");
    }
  });

  const handleEdit = editForm.handleSubmit(async (values) => {
    if (!item) return;
    try {
      const result = await updatePortfolioItem(item.id, {
        title: narrativeOnly ? undefined : values.title || null,
        subtitle: narrativeOnly ? undefined : values.subtitle || null,
        organization: narrativeOnly ? undefined : values.organization || null,
        description: nullIfEmptyHtml(values.description),
        studentEditedBody: nullIfEmptyHtml(values.studentEditedBody),
        mediaUrl: narrativeOnly ? undefined : values.mediaUrl || null,
        externalUrl: narrativeOnly ? undefined : values.externalUrl || null,
        startDate: narrativeOnly ? undefined : values.startDate || null,
        endDate: narrativeOnly ? undefined : values.endDate || null,
        isVisible: values.isVisible,
        mediaAssets: mediaAssets.map((asset, index) => ({
          id: asset.id,
          caption: asset.caption,
          displayOrder: asset.displayOrder ?? index,
        })),
      });
      onSaved(result.data);
      onOpenChange(false);
      showAppSuccess({
        title: "Đã cập nhật mục",
        description: result.message,
      });
    } catch (error) {
      showAppErrorFromUnknown(error, "portfolio.item");
    }
  });

  const isSubmitting = isEdit
    ? editForm.formState.isSubmitting
    : createForm.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-h-[min(90dvh,40rem)] max-w-lg overflow-y-auto">
        <DialogClose />
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Chỉnh sửa mục" : "Thêm mục thủ công"}
          </DialogTitle>
          <DialogDescription>
            {narrativeOnly
              ? "Mục tự động nhập chỉ chỉnh nội dung tường thuật và hiển thị."
              : "Tạo ExternalCert, Hobby, Extracurricular hoặc Project."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={isEdit ? handleEdit : handleCreate}
          className="mt-2 space-y-4"
        >
          {!isEdit ? (
            <div className="space-y-2">
              <Label>Loại mục</Label>
              <Select
                value={itemType}
                onValueChange={(value) => {
                  if (value) setItemType(value as PortfolioItemType);
                }}
              >
                <SelectTrigger className={LIGHT_SELECT_TRIGGER_FULL}>
                  <span>
                    {PORTFOLIO_ITEM_TYPE_LABELS[itemType] ?? itemType}
                  </span>
                </SelectTrigger>
                <SelectContent className={LIGHT_SELECT_CONTENT_PANEL}>
                  {MANUAL_PORTFOLIO_ITEM_TYPES.map((type) => (
                    <SelectItem
                      key={type}
                      value={type}
                      className={LIGHT_SELECT_ITEM_PANEL}
                    >
                      {PORTFOLIO_ITEM_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {!narrativeOnly ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="item-title">Tiêu đề</Label>
                <Input
                  id="item-title"
                  className="h-11 rounded-xl"
                  {...(isEdit
                    ? editForm.register("title")
                    : createForm.register("title"))}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Phụ đề</Label>
                  <Input
                    className="h-11 rounded-xl"
                    {...(isEdit
                      ? editForm.register("subtitle")
                      : createForm.register("subtitle"))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tổ chức</Label>
                  <Input
                    className="h-11 rounded-xl"
                    {...(isEdit
                      ? editForm.register("organization")
                      : createForm.register("organization"))}
                  />
                </div>
              </div>
            </>
          ) : null}

          <div className="space-y-2">
            <Label>Mô tả</Label>
            {isEdit ? (
              <Controller
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Mô tả ngắn…"
                  />
                )}
              />
            ) : (
              <Controller
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Mô tả ngắn…"
                  />
                )}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>Nội dung tường thuật</Label>
            {isEdit ? (
              <Controller
                control={editForm.control}
                name="studentEditedBody"
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Bạn đã học được gì? Câu chuyện phía sau…"
                  />
                )}
              />
            ) : (
              <Controller
                control={createForm.control}
                name="studentEditedBody"
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Bạn đã học được gì? Câu chuyện phía sau…"
                  />
                )}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>Ảnh minh chứng</Label>
            <MediaUploader
              assets={mediaAssets}
              onChange={setMediaAssets}
              label="ảnh"
            />
          </div>

          {!narrativeOnly ? (
            <>
              <div className="space-y-2">
                <Label>URL ngoài</Label>
                <Input
                  className="h-11 rounded-xl"
                  placeholder="https://"
                  {...(isEdit
                    ? editForm.register("externalUrl")
                    : createForm.register("externalUrl"))}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Bắt đầu</Label>
                  <Input
                    className="h-11 rounded-xl"
                    placeholder="15/06/2026 14:30:00"
                    {...(isEdit
                      ? editForm.register("startDate")
                      : createForm.register("startDate"))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kết thúc</Label>
                  <Input
                    className="h-11 rounded-xl"
                    placeholder="15/06/2026 14:30:00"
                    {...(isEdit
                      ? editForm.register("endDate")
                      : createForm.register("endDate"))}
                  />
                </div>
              </div>
            </>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 rounded-xl bg-[#E94B3C] text-white hover:bg-[#E94B3C]/90"
            >
              {isSubmitting ? "Đang lưu…" : isEdit ? "Lưu thay đổi" : "Thêm mục"}
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  );
}
