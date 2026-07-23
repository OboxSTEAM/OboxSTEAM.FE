"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Database,
  Loader2,
  Plus,
  Trash,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/manager/shared/confirm-dialog";
import {
  createQuestionBank,
  deleteBankQuestion,
  deleteQuestionBank,
  getQuestionBanks,
  importBankQuestions,
  type BankQuestion,
  type ImportRowError,
  type QuestionBankListItem,
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
  green: "#7cb342",
  amber: "#c08a1e",
} as const;

const IN =
  "h-10 rounded-lg border text-sm font-normal outline-none px-3 w-full transition-colors focus:ring-1 focus:ring-[#4FC3F7]/50 bg-white";

/** Session-only tally of the last CSV import for a bank. */
type BankImportStat = {
  imported: number;
  failed: number;
  errors: ImportRowError[];
};

function STitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: W.faint }}>
      {children}
    </p>
  );
}

function difficultyLabel(level: number | null | undefined): string {
  if (level == null) return "—";
  if (level <= 1) return "Dễ";
  if (level === 2) return "TB";
  return "Khó";
}

type SectionBank = QuestionBankListItem & { questions: BankQuestion[] };

export function QuestionBankSection({ courseId }: { courseId: string }) {
  const [banks, setBanks] = useState<SectionBank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [stats, setStats] = useState<Record<string, BankImportStat>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showBank, setShowBank] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SectionBank | null>(null);
  const [confirmQuestion, setConfirmQuestion] = useState<{
    bank: SectionBank;
    question: BankQuestion;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [importingId, setImportingId] = useState<string | null>(null);

  const busy = creating || deleting || importingId !== null;

  async function reloadBanks(preserveQuestions?: Record<string, BankQuestion[]>) {
    const result = await getQuestionBanks({
      courseId,
      page: 1,
      pageSize: 100,
    });
    const items = result?.data?.items ?? [];
    setBanks(
      items.map((item) => ({
        ...item,
        questions: preserveQuestions?.[item.id] ?? [],
      })),
    );
    setShowBank((prev) => prev || items.length > 0);
  }

  useEffect(() => {
    let active = true;
    setLoadingBanks(true);
    setName("");
    setDescription("");
    setError(null);
    setConfirmDelete(null);
    setConfirmQuestion(null);
    setExpandedId(null);
    getQuestionBanks({ courseId, page: 1, pageSize: 100 })
      .then((result) => {
        if (!active) return;
        const items = result?.data?.items ?? [];
        setBanks(items.map((item) => ({ ...item, questions: [] })));
        setShowBank(items.length > 0);
      })
      .catch((err) => {
        if (!active) return;
        setBanks([]);
        showAppErrorFromUnknown(err, "curriculum.questionBank.save");
      })
      .finally(() => {
        if (active) setLoadingBanks(false);
      });
    return () => {
      active = false;
    };
  }, [courseId]);

  async function handleCreate() {
    if (!name.trim()) {
      setError("Vui lòng nhập tên ngân hàng đề.");
      return;
    }
    setCreating(true);
    try {
      const result = await createQuestionBank({
        courseId,
        name: name.trim(),
        description: description.trim() || null,
      });
      if (!result?.data) {
        throw new Error("Create question bank returned empty data.");
      }
      const questionsById = Object.fromEntries(
        banks.map((b) => [b.id, b.questions]),
      );
      await reloadBanks(questionsById);
      setShowBank(true);
      setName("");
      setDescription("");
      setError(null);
      showAppSuccess({
        title: "Tạo thành công",
        description: `Đã tạo ngân hàng "${name.trim()}".`,
      });
    } catch (err) {
      showAppErrorFromUnknown(err, "curriculum.questionBank.save");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    const target = confirmDelete;
    setDeleting(true);
    try {
      await deleteQuestionBank(target.id);
      setBanks((prev) => prev.filter((b) => b.id !== target.id));
      setStats((prev) => {
        const next = { ...prev };
        delete next[target.id];
        return next;
      });
      showAppSuccess({
        title: "Đã xóa",
        description: `Ngân hàng "${target.name ?? ""}" đã được xóa.`,
      });
    } catch (err) {
      showAppErrorFromUnknown(err, "curriculum.questionBank.delete");
      throw err;
    } finally {
      setDeleting(false);
    }
  }

  async function handleDeleteQuestion() {
    if (!confirmQuestion) return;
    const { bank, question } = confirmQuestion;
    setDeleting(true);
    try {
      await deleteBankQuestion(bank.id, question.id);
      setBanks((prev) =>
        prev.map((b) => {
          if (b.id !== bank.id) return b;
          const questions = b.questions.filter((q) => q.id !== question.id);
          return {
            ...b,
            questions,
            questionCount: questions.length || Math.max(0, (b.questionCount ?? 1) - 1),
          };
        }),
      );
      showAppSuccess({
        title: "Đã xóa câu hỏi",
        description: "Câu hỏi đã được gỡ khỏi ngân hàng đề.",
      });
    } catch (err) {
      showAppErrorFromUnknown(err, "curriculum.questionBank.questionDelete");
      throw err;
    } finally {
      setDeleting(false);
    }
  }

  function triggerImport(bankId: string) {
    if (busy) return;
    setImportingId(bankId);
    importInputRef.current?.click();
  }

  async function handleImportFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const bankId = importingId;
    if (importInputRef.current) importInputRef.current.value = "";
    if (!file || !bankId) {
      setImportingId(null);
      return;
    }
    try {
      const result = await importBankQuestions(bankId, file);
      const data = result?.data;
      const imported = data?.importedCount ?? 0;
      const failed = data?.failedCount ?? 0;
      const questions = data?.importedQuestions ?? [];
      if (questions.length > 0) {
        setBanks((prev) =>
          prev.map((b) => {
            if (b.id !== bankId) return b;
            const byId = new Map(b.questions.map((q) => [q.id, q]));
            for (const q of questions) byId.set(q.id, q);
            const nextQuestions = [...byId.values()].sort(
              (a, c) => (a.orderIndex ?? 0) - (c.orderIndex ?? 0),
            );
            return {
              ...b,
              questions: nextQuestions,
              questionCount: nextQuestions.length,
            };
          }),
        );
      } else {
        const questionsById = Object.fromEntries(
          banks.map((b) => [b.id, b.questions]),
        );
        await reloadBanks(questionsById);
      }
      setStats((prev) => ({
        ...prev,
        [bankId]: {
          imported: (prev[bankId]?.imported ?? 0) + imported,
          failed,
          errors: data?.errors ?? [],
        },
      }));
      setExpandedId(bankId);
      if (failed > 0) {
        showAppSuccess({
          title: "Import hoàn tất (có lỗi)",
          description: `Đã nhập ${imported} câu, ${failed} dòng lỗi.`,
        });
      } else {
        showAppSuccess({
          title: "Import hoàn tất",
          description: `Đã nhập ${imported} câu hỏi từ tệp CSV.`,
        });
      }
    } catch (err) {
      showAppErrorFromUnknown(err, "curriculum.questionBank.import");
    } finally {
      setImportingId(null);
    }
  }

  async function copyBankId(id: string) {
    try {
      await navigator.clipboard.writeText(id);
      showAppSuccess({
        title: "Đã sao chép ID",
        description: "Dán vào bài quiz nếu cần (thường chọn từ danh sách).",
      });
    } catch {
      showAppErrorFromUnknown(new Error("Clipboard unavailable"), "generic");
    }
  }

  return (
    <div className="border-t pt-5" style={{ borderColor: W.border }}>
      <STitle>Ngân hàng đề</STitle>
      <label className="flex cursor-pointer items-center gap-2">
        <Checkbox
          checked={showBank}
          onCheckedChange={(v) => setShowBank(v === true)}
          className="border-[#8c8678] bg-white data-checked:border-primary"
        />
        <span className="text-sm font-semibold" style={{ color: W.textStrong }}>
          Đính kèm ngân hàng đề
        </span>
        {banks.length > 0 && (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{ background: W.surface2, color: W.muted }}
          >
            {banks.length} ngân hàng
          </span>
        )}
      </label>
      {!showBank && (
        <p className="mt-1.5 text-[11px] leading-relaxed" style={{ color: W.faint }}>
          Tích chọn để tạo và import câu hỏi cho ngân hàng đề của khóa học này.
        </p>
      )}

      {showBank ? (
        <div className="mt-4">
          {loadingBanks ? (
            <p className="mb-4 text-xs" style={{ color: W.faint }}>
              Đang tải ngân hàng đề…
            </p>
          ) : null}
          {banks.length > 0 ? (
            <ul className="mb-4 space-y-2">
              {banks.map((bank) => {
                const stat = stats[bank.id];
                const isImporting = importingId === bank.id;
                const isExpanded = expandedId === bank.id;
                const questionCount =
                  bank.questions.length || bank.questionCount || 0;
                return (
                  <li
                    key={bank.id}
                    className="rounded-xl border bg-white p-3"
                    style={{ borderColor: W.border }}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="flex size-9 shrink-0 items-center justify-center rounded-lg border"
                        style={{
                          background: "white",
                          borderColor: W.border,
                          color: W.green,
                        }}
                      >
                        <Database className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className="truncate text-sm font-semibold"
                          style={{ color: W.textStrong }}
                        >
                          {bank.name}
                        </p>
                        {bank.description && (
                          <p className="truncate text-xs" style={{ color: W.muted }}>
                            {bank.description}
                          </p>
                        )}
                        <div
                          className="mt-1 flex flex-wrap items-center gap-2 text-[11px]"
                          style={{ color: W.faint }}
                        >
                          <span>{questionCount} câu hỏi</span>
                          {stat && stat.imported > 0 && (
                            <span
                              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold"
                              style={{ background: "#eef6e5", color: W.green }}
                            >
                              <CheckCircle2 className="size-3" />
                              +{stat.imported} lần nhập gần nhất
                            </span>
                          )}
                          {bank.createdAt && <span>Tạo lúc {bank.createdAt}</span>}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          title="Sao chép ID ngân hàng"
                          onClick={() => void copyBankId(bank.id)}
                          className="flex size-8 items-center justify-center rounded-lg border transition-colors hover:bg-[#f4f1ea]"
                          style={{ borderColor: W.border, color: W.muted }}
                        >
                          <Copy className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Import câu hỏi (CSV)"
                          onClick={() => triggerImport(bank.id)}
                          disabled={busy}
                          className={cn(
                            "flex h-8 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold transition-colors hover:bg-[#f4f1ea] disabled:opacity-50",
                          )}
                          style={{ borderColor: W.border, color: W.accent }}
                        >
                          {isImporting ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Upload className="size-3.5" />
                          )}
                          {isImporting ? "Đang nhập..." : "Import CSV"}
                        </button>
                        <button
                          type="button"
                          title="Xóa ngân hàng"
                          onClick={() => setConfirmDelete(bank)}
                          disabled={busy}
                          className="flex size-8 items-center justify-center rounded-lg border transition-colors hover:bg-red-50 disabled:opacity-50"
                          style={{ borderColor: W.border, color: W.primary }}
                        >
                          <Trash className="size-3.5" />
                        </button>
                      </div>
                    </div>

                    {stat && stat.failed > 0 && (
                      <div
                        className="mt-2 rounded-lg border p-2.5 text-[11px]"
                        style={{
                          borderColor: "#e6d3a3",
                          background: "#fbf6e9",
                          color: W.amber,
                        }}
                      >
                        <p className="flex items-center gap-1.5 font-semibold">
                          <AlertTriangle className="size-3.5" />
                          {stat.failed} dòng không nhập được
                        </p>
                        {stat.errors.length > 0 && (
                          <ul
                            className="mt-1.5 space-y-0.5 pl-5"
                            style={{ color: "#8a6d1c" }}
                          >
                            {stat.errors.slice(0, 5).map((rowErr, i) => (
                              <li key={i} className="list-disc">
                                {rowErr.rowNumber != null
                                  ? `Dòng ${rowErr.rowNumber}: `
                                  : ""}
                                {rowErr.error ?? "Không rõ lỗi"}
                              </li>
                            ))}
                            {stat.errors.length > 5 && (
                              <li className="list-disc">
                                … và {stat.errors.length - 5} lỗi khác
                              </li>
                            )}
                          </ul>
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId((prev) => (prev === bank.id ? null : bank.id))
                      }
                      className="mt-2 flex w-full items-center gap-1.5 rounded-lg px-1 py-1.5 text-left text-[11px] font-semibold transition-colors hover:bg-[#f4f1ea]"
                      style={{ color: W.muted }}
                    >
                      {isExpanded ? (
                        <ChevronDown className="size-3.5" />
                      ) : (
                        <ChevronRight className="size-3.5" />
                      )}
                      {isExpanded ? "Ẩn câu hỏi" : `Xem câu hỏi (${questionCount})`}
                    </button>

                    {isExpanded && (
                      <ul className="mt-1 space-y-1.5 border-t pt-2" style={{ borderColor: W.border }}>
                        {bank.questions.length === 0 ? (
                          <li
                            className="rounded-lg border border-dashed px-3 py-3 text-center text-[11px]"
                            style={{ borderColor: W.border, color: W.faint }}
                          >
                            Chưa có câu hỏi trong bộ nhớ cục bộ. Import CSV để
                            xem và xóa từng câu (BE chưa có API liệt kê đầy đủ).
                          </li>
                        ) : (
                          bank.questions.map((q, idx) => (
                            <li
                              key={q.id}
                              className="flex items-start gap-2 rounded-lg border bg-[#fafaf5] px-2.5 py-2"
                              style={{ borderColor: W.border }}
                            >
                              <span
                                className="mt-0.5 font-mono text-[10px] font-bold"
                                style={{ color: W.faint }}
                              >
                                {idx + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p
                                  className="text-xs font-medium leading-snug"
                                  style={{ color: W.textStrong }}
                                >
                                  {q.questionText || "(Không có nội dung)"}
                                </p>
                                <p className="mt-0.5 text-[10px]" style={{ color: W.faint }}>
                                  {q.questionType ?? "—"} ·{" "}
                                  {difficultyLabel(q.difficultyLevel)} ·{" "}
                                  {q.points ?? 0} điểm
                                  {q.options?.length
                                    ? ` · ${q.options.length} đáp án`
                                    : ""}
                                </p>
                              </div>
                              <button
                                type="button"
                                title="Xóa câu hỏi"
                                disabled={busy}
                                onClick={() =>
                                  setConfirmQuestion({ bank, question: q })
                                }
                                className="flex size-7 shrink-0 items-center justify-center rounded-md border transition-colors hover:bg-red-50 disabled:opacity-50"
                                style={{ borderColor: W.border, color: W.primary }}
                              >
                                <Trash className="size-3" />
                              </button>
                            </li>
                          ))
                        )}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p
              className="mb-4 rounded-xl border border-dashed p-4 text-center text-xs"
              style={{ borderColor: W.border, color: W.muted }}
            >
              Chưa có ngân hàng đề. Tạo mới bên dưới rồi import câu hỏi từ CSV.
            </p>
          )}

          <div
            className="space-y-3 rounded-xl border border-dashed bg-white/60 p-4"
            style={{ borderColor: W.border }}
          >
            <p
              className="text-[11px] font-bold uppercase tracking-wide"
              style={{ color: W.faint }}
            >
              Thêm ngân hàng mới
            </p>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>
                Tên ngân hàng <span style={{ color: W.primary }}>*</span>
              </Label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Ngân hàng đề Chương 1"
                className={IN}
                style={{ borderColor: W.border }}
                disabled={creating}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold" style={{ color: W.textStrong }}>
                Mô tả
              </Label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả ngắn (tùy chọn)"
                className={IN}
                style={{ borderColor: W.border }}
                disabled={creating}
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
                disabled={creating}
                className={cn(
                  "h-9 gap-2 rounded-lg px-4 text-sm font-semibold text-white",
                  "bg-[#7CB342] hover:bg-[#6ca438]",
                )}
              >
                {creating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                {creating ? "Đang tạo..." : "Tạo ngân hàng"}
              </Button>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: W.faint }}>
              Danh sách ngân hàng được lưu trên trình duyệt (BE chưa có API list
              theo khóa học). Câu hỏi hiện sau khi Import CSV; có thể xóa từng câu.
            </p>
          </div>
        </div>
      ) : null}

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
        title="Xác nhận xóa ngân hàng đề"
        description={`Xóa "${confirmDelete?.name ?? ""}" và toàn bộ câu hỏi bên trong? Hành động không thể hoàn tác.`}
        confirmLabel="Xóa bỏ"
        cancelLabel="Hủy"
        variant="destructive"
      />

      <ConfirmDialog
        isOpen={!!confirmQuestion}
        onOpenChange={(open) => !open && setConfirmQuestion(null)}
        onConfirm={handleDeleteQuestion}
        title="Xác nhận xóa câu hỏi"
        description={`Xóa câu hỏi khỏi ngân hàng "${confirmQuestion?.bank.name ?? ""}"?`}
        confirmLabel="Xóa câu hỏi"
        cancelLabel="Hủy"
        variant="destructive"
      />
    </div>
  );
}
