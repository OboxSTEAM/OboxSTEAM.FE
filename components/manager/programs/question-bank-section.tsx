"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Database, Plus, Trash, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/manager/shared/confirm-dialog";
import {
  createQuestionBank,
  deleteQuestionBank,
  importBankQuestions,
  type QuestionBank,
} from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";

const W = {
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

function STitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: W.faint }}>
      {children}
    </p>
  );
}

export function QuestionBankSection({ courseId }: { courseId: string }) {
  // Backend has no "list banks by course" endpoint yet (see plan.md); we surface
  // only the banks created in this session.
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<QuestionBank | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [importingId, setImportingId] = useState<string | null>(null);

  async function handleCreate() {
    if (!name.trim()) {
      setError("Vui lòng nhập tên ngân hàng câu hỏi.");
      return;
    }
    setBusy(true);
    try {
      const result = await createQuestionBank({
        courseId,
        name: name.trim(),
        description: description.trim() || null,
      });
      if (result?.data) setBanks((prev) => [...prev, result.data]);
      setName("");
      setDescription("");
      setError(null);
      showAppSuccess({ title: "Tạo thành công", description: `Đã tạo ngân hàng "${name.trim()}".` });
    } catch (err) {
      showAppErrorFromUnknown(err, "curriculum.questionBank.save");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    const target = confirmDelete;
    setBusy(true);
    try {
      await deleteQuestionBank(target.id);
      setBanks((prev) => prev.filter((b) => b.id !== target.id));
      showAppSuccess({ title: "Đã xóa", description: `Ngân hàng "${target.name ?? ""}" đã được xóa.` });
    } catch (err) {
      showAppErrorFromUnknown(err, "curriculum.questionBank.delete");
      throw err;
    } finally {
      setBusy(false);
    }
  }

  function triggerImport(bankId: string) {
    setImportingId(bankId);
    importInputRef.current?.click();
  }

  async function handleImportFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const bankId = importingId;
    if (importInputRef.current) importInputRef.current.value = "";
    if (!file || !bankId) return;
    setBusy(true);
    try {
      await importBankQuestions(bankId, file);
      showAppSuccess({ title: "Import hoàn tất", description: "Đã nhập câu hỏi từ tệp CSV." });
    } catch (err) {
      showAppErrorFromUnknown(err, "curriculum.questionBank.import");
    } finally {
      setBusy(false);
      setImportingId(null);
    }
  }

  return (
    <div className="border-t pt-5" style={{ borderColor: W.border }}>
      <STitle>Ngân hàng câu hỏi</STitle>

      {banks.length > 0 && (
        <ul className="mb-4 space-y-2">
          {banks.map((bank) => (
            <li
              key={bank.id}
              className="flex items-start gap-3 rounded-xl border bg-white p-3"
              style={{ borderColor: W.border }}
            >
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-lg border"
                style={{ background: "white", borderColor: W.border, color: "#7cb342" }}
              >
                <Database className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold" style={{ color: W.textStrong }}>
                  {bank.name}
                </p>
                {bank.description && (
                  <p className="truncate text-xs" style={{ color: W.muted }}>
                    {bank.description}
                  </p>
                )}
                <p className="mt-0.5 font-mono text-[10px]" style={{ color: W.faint }}>
                  {bank.id}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  title="Import câu hỏi (CSV)"
                  onClick={() => triggerImport(bank.id)}
                  disabled={busy}
                  className="flex size-8 items-center justify-center rounded-lg border transition-colors hover:bg-[#f4f1ea]"
                  style={{ borderColor: W.border, color: W.accent }}
                >
                  <Upload className="size-3.5" />
                </button>
                <button
                  type="button"
                  title="Xóa ngân hàng"
                  onClick={() => setConfirmDelete(bank)}
                  disabled={busy}
                  className="flex size-8 items-center justify-center rounded-lg border transition-colors hover:bg-red-50"
                  style={{ borderColor: W.border, color: W.primary }}
                >
                  <Trash className="size-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-3 rounded-xl border border-dashed bg-white/60 p-4" style={{ borderColor: W.border }}>
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>
            Tên ngân hàng <span style={{ color: W.primary }}>*</span>
          </Label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: Ngân hàng câu hỏi Chương 1"
            className={IN}
            style={{ borderColor: W.border }}
            disabled={busy}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>Mô tả</Label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả ngắn (tùy chọn)"
            className={IN}
            style={{ borderColor: W.border }}
            disabled={busy}
          />
        </div>
        {error && (
          <p className="text-xs font-semibold" style={{ color: W.primary }}>
            {error}
          </p>
        )}
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleCreate}
            disabled={busy}
            className={cn(
              "h-9 gap-2 rounded-lg px-4 text-sm font-semibold text-white",
              "bg-[#7CB342] hover:bg-[#6ca438]",
            )}
          >
            <Plus className="size-4" />
            {busy ? "Đang xử lý..." : "Tạo ngân hàng"}
          </Button>
        </div>
        <p className="text-[11px] leading-relaxed" style={{ color: W.faint }}>
          Thêm câu hỏi bằng cách import tệp CSV. Chưa có API liệt kê/sửa từng câu hỏi
          (xem plan.md).
        </p>
      </div>

      <input
        ref={importInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleImportFile}
        className="hidden"
      />

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Xác nhận xóa ngân hàng câu hỏi"
        description={`Xóa "${confirmDelete?.name ?? ""}" và toàn bộ câu hỏi bên trong? Hành động không thể hoàn tác.`}
        confirmLabel="Xóa bỏ"
        cancelLabel="Hủy"
        variant="destructive"
      />
    </div>
  );
}
