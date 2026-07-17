"use client";

import { useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import {
  FileText,
  FileType,
  Video,
  Image as ImageIcon,
  Link2,
  Upload,
  Trash,
  Pencil,
  Check,
  X,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/manager/shared/confirm-dialog";
import {
  uploadMaterial,
  updateMaterial,
  deleteMaterial,
  type ActivityMaterial,
} from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";

/* ─── Palette (mirrors curriculum-split-panel) ─────────────────────────────── */
const W = {
  surface: "#f4f1ea",
  surface2: "#e7e2d8",
  border: "#d8d2c6",
  textStrong: "#2d2b27",
  muted: "#6b6b6b",
  faint: "#8c8678",
  accent: "#4fc3f7",
  primary: "#e94b3c",
} as const;

const IN =
  "h-10 rounded-lg border text-sm font-normal outline-none px-3 w-full transition-colors focus:ring-1 focus:ring-[#4FC3F7]/50 bg-white";

/* ─── Material type presentation ───────────────────────────────────────────── */
type MaterialVisual = { Icon: React.ElementType; color: string; label: string };

const MATERIAL_TYPE_VISUAL: Record<string, MaterialVisual> = {
  PDF: { Icon: FileText, color: "#E94B3C", label: "PDF" },
  DOC: { Icon: FileType, color: "#4FC3F7", label: "Tài liệu" },
  Video: { Icon: Video, color: "#7E57C2", label: "Video" },
  Image: { Icon: ImageIcon, color: "#FDD835", label: "Hình ảnh" },
  ExternalLink: { Icon: Link2, color: "#7CB342", label: "Liên kết" },
};

function visualFor(materialType: string): MaterialVisual {
  return MATERIAL_TYPE_VISUAL[materialType] ?? { Icon: FileText, color: W.faint, label: materialType };
}

function formatBytes(bytes: number | null): string {
  if (bytes == null || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  const exp = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exp);
  return `${value.toFixed(value >= 10 || exp === 0 ? 0 : 1)} ${units[exp]}`;
}

/* ─── Section title (mirrors STitle) ───────────────────────────────────────── */
function STitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: W.faint }}>
      {children}
    </p>
  );
}

type ActivityMaterialSectionProps = {
  activityId: string;
  initialMaterial: ActivityMaterial | null;
  onChanged: () => void;
};

export function ActivityMaterialSection({
  activityId,
  initialMaterial,
  onChanged,
}: ActivityMaterialSectionProps) {
  const [material, setMaterial] = useState<ActivityMaterial | null>(initialMaterial);
  const [busy, setBusy] = useState(false);

  // Upload draft
  const [file, setFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Title editing
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState(false);

  function resetUploadDraft() {
    setFile(null);
    setUploadTitle("");
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFilePick(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null;
    setFile(picked);
    setUploadError(null);
    if (picked && !uploadTitle.trim()) {
      setUploadTitle(picked.name.replace(/\.[^/.]+$/, ""));
    }
  }

  async function handleUpload() {
    if (!file) {
      setUploadError("Vui lòng chọn tệp tài liệu.");
      return;
    }
    if (!uploadTitle.trim()) {
      setUploadError("Vui lòng nhập tiêu đề tài liệu.");
      return;
    }
    setBusy(true);
    try {
      const result = await uploadMaterial(activityId, uploadTitle.trim(), file);
      setMaterial(result?.data ?? null);
      resetUploadDraft();
      showAppSuccess({
        title: "Tải lên thành công",
        description: `Đã đính kèm tài liệu "${uploadTitle.trim()}".`,
      });
      onChanged();
    } catch (err) {
      showAppErrorFromUnknown(err, "curriculum.material.save");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveTitle() {
    if (!material) return;
    const next = titleDraft.trim();
    if (!next) return;
    if (next === material.title) {
      setEditingTitle(false);
      return;
    }
    setBusy(true);
    try {
      const result = await updateMaterial(material.id, { title: next });
      setMaterial(result?.data ?? { ...material, title: next });
      setEditingTitle(false);
      showAppSuccess({ title: "Cập nhật thành công", description: "Đã đổi tiêu đề tài liệu." });
      onChanged();
    } catch (err) {
      showAppErrorFromUnknown(err, "curriculum.material.save");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!material) return;
    setBusy(true);
    try {
      await deleteMaterial(material.id);
      setMaterial(null);
      showAppSuccess({ title: "Đã xóa", description: "Tài liệu đã được gỡ khỏi hoạt động." });
      onChanged();
    } catch (err) {
      showAppErrorFromUnknown(err, "curriculum.material.delete");
      throw err;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-t pt-5" style={{ borderColor: W.border }}>
      <STitle>Tài liệu học tập</STitle>

      {material ? (
        <div
          className="flex items-start gap-3 rounded-xl border bg-white p-3.5"
          style={{ borderColor: W.border }}
        >
          <MaterialIcon materialType={material.materialType} />

          <div className="min-w-0 flex-1">
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleSaveTitle();
                    }
                    if (e.key === "Escape") {
                      e.preventDefault();
                      setEditingTitle(false);
                    }
                  }}
                  className={cn(IN, "h-9")}
                  style={{ borderColor: W.border }}
                  disabled={busy}
                />
                <button
                  type="button"
                  title="Lưu"
                  onClick={() => void handleSaveTitle()}
                  disabled={busy}
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white"
                  style={{ background: W.accent }}
                >
                  <Check className="size-4" />
                </button>
                <button
                  type="button"
                  title="Hủy"
                  onClick={() => setEditingTitle(false)}
                  disabled={busy}
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg border"
                  style={{ borderColor: W.border, color: W.muted }}
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <p className="truncate text-sm font-semibold" style={{ color: W.textStrong }}>
                {material.title}
              </p>
            )}

            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]" style={{ color: W.faint }}>
              <span
                className="rounded-full px-2 py-0.5 font-semibold"
                style={{ background: W.surface2, color: W.muted }}
              >
                {visualFor(material.materialType).label}
              </span>
              {formatBytes(material.fileSizeBytes) && <span>{formatBytes(material.fileSizeBytes)}</span>}
              {material.fileUrl ? (
                <a
                  href={material.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold hover:underline"
                  style={{ color: W.accent }}
                >
                  <ExternalLink className="size-3" />
                  Xem tệp
                </a>
              ) : null}
            </div>
          </div>

          {!editingTitle && (
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                title="Đổi tiêu đề"
                onClick={() => {
                  setTitleDraft(material.title);
                  setEditingTitle(true);
                }}
                disabled={busy}
                className="flex size-8 items-center justify-center rounded-lg border transition-colors hover:bg-[#f4f1ea]"
                style={{ borderColor: W.border, color: W.muted }}
              >
                <Pencil className="size-3.5" />
              </button>
              <button
                type="button"
                title="Xóa tài liệu"
                onClick={() => setConfirmDelete(true)}
                disabled={busy}
                className="flex size-8 items-center justify-center rounded-lg border transition-colors hover:bg-red-50"
                style={{ borderColor: W.border, color: W.primary }}
              >
                <Trash className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border border-dashed bg-white/60 p-4" style={{ borderColor: W.border }}>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>
              Tệp tài liệu <span style={{ color: W.primary }}>*</span>
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFilePick}
              disabled={busy}
              className="block w-full text-sm text-[#3a3833] file:mr-3 file:rounded-lg file:border-0 file:bg-[#e7e2d8] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#3a3833] hover:file:bg-[#ded8cc]"
            />
            {file && (
              <p className="text-[11px]" style={{ color: W.faint }}>
                {file.name} · {formatBytes(file.size)}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>
              Tiêu đề <span style={{ color: W.primary }}>*</span>
            </Label>
            <input
              type="text"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleUpload();
                }
              }}
              placeholder="Ví dụ: Slide bài giảng Assembly"
              className={IN}
              style={{ borderColor: W.border }}
              disabled={busy}
            />
          </div>

          {uploadError && (
            <p className="text-xs font-semibold" style={{ color: W.primary }}>
              {uploadError}
            </p>
          )}

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => void handleUpload()}
              disabled={busy}
              className="h-9 gap-2 rounded-lg bg-[#4FC3F7] px-4 text-sm font-semibold text-white hover:bg-[#3bb4ea]"
            >
              <Upload className="size-4" />
              {busy ? "Đang tải lên..." : "Tải lên tài liệu"}
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDelete}
        onOpenChange={setConfirmDelete}
        onConfirm={handleDelete}
        title="Xác nhận xóa tài liệu"
        description={`Bạn có chắc muốn xóa "${material?.title ?? ""}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa bỏ"
        cancelLabel="Hủy"
        variant="destructive"
      />
    </div>
  );
}

function MaterialIcon({ materialType }: { materialType: string }) {
  const { Icon, color } = visualFor(materialType);
  return (
    <span
      className="flex size-10 shrink-0 items-center justify-center rounded-lg border"
      style={{ background: "white", borderColor: W.border, color }}
      aria-hidden
    >
      <Icon className="size-5" strokeWidth={2} />
    </span>
  );
}
