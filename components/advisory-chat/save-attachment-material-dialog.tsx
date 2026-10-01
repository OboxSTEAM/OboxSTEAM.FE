"use client";

import { useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";

import { useAdvisoryChat } from "@/components/advisory-chat/advisory-chat-provider";
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
import { stripFileExtension } from "@/lib/advisory/attachment-format";
import { createMaterialFromDiscussionAttachment, type DiscussionAttachment } from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { matchesQuery } from "@/lib/search/fold-text";
import { createMaterialFromAttachmentSchema } from "@/lib/validations";
import { cn } from "@/lib/utils";

type SaveAttachmentMaterialDialogProps = {
  attachment: DiscussionAttachment | null;
  onOpenChange: (open: boolean) => void;
};

/** Turn a chat attachment into the material of a self-paced activity. */
export function SaveAttachmentMaterialDialog({
  attachment,
  onOpenChange,
}: SaveAttachmentMaterialDialogProps) {
  return (
    <Dialog open={attachment !== null} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-md">
        {attachment ? (
          <SaveAttachmentMaterialForm
            key={attachment.id}
            attachment={attachment}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogPopup>
    </Dialog>
  );
}

function SaveAttachmentMaterialForm({
  attachment,
  onDone,
}: {
  attachment: DiscussionAttachment;
  onDone: () => void;
}) {
  const { materialActivities, workspace } = useAdvisoryChat();
  const [title, setTitle] = useState(() => stripFileExtension(attachment.fileName));
  const [query, setQuery] = useState("");
  const [activityId, setActivityId] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const visibleActivities = useMemo(
    () =>
      materialActivities.filter((option) => matchesQuery([option.label, option.path], query)),
    [materialActivities, query],
  );
  const willRevokeApproval = workspace?.approval != null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = createMaterialFromAttachmentSchema.safeParse({
      attachmentId: attachment.id,
      activityId: activityId ?? "",
      title,
    });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Thông tin chưa hợp lệ.");
      return;
    }

    setFieldError(null);
    setIsSaving(true);
    try {
      await createMaterialFromDiscussionAttachment(parsed.data);
      showAppSuccess({
        title: "Đã lưu thành tài liệu",
        description: "Tài liệu đã được gắn vào hoạt động đã chọn.",
      });
      onDone();
    } catch (error) {
      showAppErrorFromUnknown(error, "advisory.saveMaterial");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <DialogClose />
      <DialogHeader>
        <DialogTitle>Lưu thành tài liệu hoạt động</DialogTitle>
        <DialogDescription>
          Chọn một hoạt động tự học chưa có tài liệu để gắn tệp “{attachment.fileName}”.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-1.5">
        <Label htmlFor="material-title">Tên tài liệu</Label>
        <Input
          id="material-title"
          value={title}
          maxLength={255}
          onChange={(event) => setTitle(event.target.value)}
          className="h-11"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="material-activity-search">Hoạt động</Label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="material-activity-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo tên hoạt động, khóa học, module"
            className="h-11 pl-9"
          />
        </div>
        <div
          role="radiogroup"
          aria-label="Chọn hoạt động"
          className="max-h-56 overflow-y-auto rounded-xl border border-border p-1"
        >
          {materialActivities.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">
              Không có hoạt động tự học nào còn trống tài liệu.
            </p>
          ) : visibleActivities.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">Không tìm thấy hoạt động phù hợp.</p>
          ) : (
            visibleActivities.map((option) => {
              const isSelected = option.activityId === activityId;
              return (
                <button
                  key={option.activityId}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setActivityId(option.activityId)}
                  className={cn(
                    "flex min-h-11 w-full flex-col justify-center rounded-lg px-2.5 py-1.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    isSelected ? "bg-accent/15" : "hover:bg-muted",
                  )}
                >
                  <span className="text-sm font-medium text-foreground">{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.path}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {willRevokeApproval ? (
        <p className="rounded-lg bg-amber-500/12 px-3 py-2 text-xs text-amber-900 dark:text-amber-300">
          Đây là một chỉnh sửa chương trình — chấp thuận hiện tại của chuyên gia sẽ bị huỷ.
        </p>
      ) : null}
      {fieldError ? (
        <p className="text-sm text-destructive" role="alert">
          {fieldError}
        </p>
      ) : null}

      <DialogFooter>
        <Button type="button" variant="outline" disabled={isSaving} onClick={onDone}>
          Huỷ
        </Button>
        <Button type="submit" disabled={isSaving || !activityId}>
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
          Lưu tài liệu
        </Button>
      </DialogFooter>
    </form>
  );
}
