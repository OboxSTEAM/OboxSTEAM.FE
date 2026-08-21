"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogScrollBody,
  DialogScrollFooter,
  DialogScrollHeader,
  DialogScrollPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  addMyMentorSkill,
  deleteMyMentorSkill,
  getMyMentorSkills,
  getSkills,
  setMyMentorSkillVisibility,
  updateMyMentorSkill,
  type MentorSkill,
  type MentorSkillEvidence,
  type MentorSkillEvidenceInput,
  type SkillProficiencyLevel,
  type SkillSummary,
} from "@/lib/api";
import { parseApiDateTime } from "@/lib/curriculum/datetime";
import { mentorSkillEvidenceInputSchema } from "@/lib/validations";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import {
  SKILL_CATEGORY_LABELS,
  SKILL_PROFICIENCY_LABELS,
  SKILL_PROFICIENCY_OPTIONS,
} from "@/lib/mentors/skill-labels";
import {
  THEME_SELECT_CONTENT,
  THEME_SELECT_ITEM,
  THEME_SELECT_TRIGGER,
} from "@/lib/ui/select-styles";
import { cn } from "@/lib/utils";

const MAX_EVIDENCES = 10;

const EVIDENCE_CURRENT_YEAR = new Date().getFullYear();
const EVIDENCE_YEARS = Array.from(
  { length: EVIDENCE_CURRENT_YEAR - 1969 },
  (_, index) => EVIDENCE_CURRENT_YEAR - index,
);
const EVIDENCE_MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function daysInMonth(month: number, year: number): number {
  if (!month) return 31;
  return new Date(year || 2000, month, 0).getDate();
}

/** Compose `yyyy-MM-dd` only when day/month/year are all set. */
function issuedAtFromParts(day: string, month: string, year: string): string {
  if (!day || !month || !year) return "";
  const maxDay = daysInMonth(Number(month), Number(year));
  const safeDay = Math.min(Number(day), maxDay);
  return `${year}-${pad2(Number(month))}-${pad2(safeDay)}`;
}

function selectDatePart(value: string | null): string {
  if (!value || value === "none") return "";
  return value;
}

function clampIssuedDay(day: string, month: string, year: string): string {
  if (!day) return "";
  const maxDay = daysInMonth(
    Number(month) || 0,
    Number(year) || EVIDENCE_CURRENT_YEAR,
  );
  const n = Number(day);
  if (!Number.isFinite(n) || n < 1) return "";
  return String(Math.min(n, maxDay));
}

type EvidenceFormRow = {
  title: string;
  issuer: string;
  url: string;
  issuedDay: string;
  issuedMonth: string;
  issuedYear: string;
  credentialId: string;
};

const EMPTY_EVIDENCE_ROW: EvidenceFormRow = {
  title: "",
  issuer: "",
  url: "",
  issuedDay: "",
  issuedMonth: "",
  issuedYear: "",
  credentialId: "",
};

function evidenceRowFromApi(evidence: MentorSkillEvidence): EvidenceFormRow {
  const parsed = parseApiDateTime(evidence.issuedAt);
  return {
    title: evidence.title,
    issuer: evidence.issuer ?? "",
    url: evidence.url,
    issuedDay: parsed ? String(parsed.getDate()) : "",
    issuedMonth: parsed ? String(parsed.getMonth() + 1) : "",
    issuedYear: parsed ? String(parsed.getFullYear()) : "",
    credentialId: evidence.credentialId ?? "",
  };
}

function isEvidenceRowEmpty(row: EvidenceFormRow): boolean {
  return (
    !row.title.trim() &&
    !row.issuer.trim() &&
    !row.url.trim() &&
    !row.issuedDay &&
    !row.issuedMonth &&
    !row.issuedYear &&
    !row.credentialId.trim()
  );
}

function isIssuedAtPartial(row: EvidenceFormRow): boolean {
  const any = Boolean(row.issuedDay || row.issuedMonth || row.issuedYear);
  const all = Boolean(row.issuedDay && row.issuedMonth && row.issuedYear);
  return any && !all;
}

/**
 * Maps form rows to API inputs. Returns an error message for partially
 * filled rows; completely empty rows are skipped.
 */
function mapEvidenceRows(
  rows: EvidenceFormRow[],
): { inputs: MentorSkillEvidenceInput[]; error: string | null } {
  const inputs: MentorSkillEvidenceInput[] = [];

  for (const row of rows) {
    if (isEvidenceRowEmpty(row)) continue;
    if (!row.title.trim() || !row.url.trim()) {
      return {
        inputs: [],
        error: "Mỗi evidence cần đủ tên và URL (hoặc để trống cả dòng).",
      };
    }

    if (isIssuedAtPartial(row)) {
      return {
        inputs: [],
        error: "Ngày cấp cần đủ ngày, tháng và năm (hoặc để trống cả ba).",
      };
    }

    const candidate = {
      title: row.title.trim(),
      issuer: row.issuer.trim() || null,
      url: row.url.trim(),
      issuedAt:
        issuedAtFromParts(row.issuedDay, row.issuedMonth, row.issuedYear) ||
        null,
      credentialId: row.credentialId.trim() || null,
    };
    const parsed = mentorSkillEvidenceInputSchema.safeParse(candidate);
    if (!parsed.success) {
      return {
        inputs: [],
        error: parsed.error.issues[0]?.message ?? "Evidence chưa hợp lệ.",
      };
    }
    inputs.push(parsed.data);
  }

  return { inputs, error: null };
}

type SkillEvidenceEditorProps = {
  rows: EvidenceFormRow[];
  onChange: (rows: EvidenceFormRow[]) => void;
  disabled?: boolean;
};

/** Inline editor for the skill evidence list (BE replaces all rows on save). */
function SkillEvidenceEditor({
  rows,
  onChange,
  disabled = false,
}: SkillEvidenceEditorProps) {
  function updateRow(index: number, patch: Partial<EvidenceFormRow>) {
    onChange(
      rows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    );
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, rowIndex) => rowIndex !== index));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-foreground">
          Bằng cấp / chứng nhận{" "}
          <span className="font-normal text-muted-foreground">(tuỳ chọn)</span>
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || rows.length >= MAX_EVIDENCES}
          onClick={() => onChange([...rows, { ...EMPTY_EVIDENCE_ROW }])}
          className="h-7 rounded-md px-2 text-xs"
        >
          <Plus className="size-3.5" />
          Thêm evidence
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
          Chưa có evidence — thêm link chứng chỉ, bằng cấp chứng minh kỹ năng.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row, index) => {
            const dayOptions = Array.from(
              {
                length: daysInMonth(
                  Number(row.issuedMonth) || 0,
                  Number(row.issuedYear) || EVIDENCE_CURRENT_YEAR,
                ),
              },
              (_, i) => i + 1,
            );

            return (
              <li
                key={index}
                className="space-y-2.5 rounded-lg border border-border bg-card p-3"
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1 space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Tên chứng chỉ <span className="text-destructive">*</span>
                    </label>
                    <Input
                      value={row.title}
                      onChange={(event) =>
                        updateRow(index, { title: event.target.value })
                      }
                      maxLength={255}
                      placeholder="VD: AWS Cloud Practitioner"
                      disabled={disabled}
                      className="h-8 text-sm"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={disabled}
                    onClick={() => removeRow(index)}
                    aria-label="Xóa evidence"
                    className="mt-5 size-8 shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Link chứng chỉ <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={row.url}
                    onChange={(event) =>
                      updateRow(index, { url: event.target.value })
                    }
                    maxLength={2000}
                    placeholder="https://..."
                    disabled={disabled}
                    className="h-8 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Đơn vị cấp
                    </label>
                    <Input
                      value={row.issuer}
                      onChange={(event) =>
                        updateRow(index, { issuer: event.target.value })
                      }
                      maxLength={255}
                      placeholder="VD: Amazon Web Services"
                      disabled={disabled}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Mã chứng nhận
                    </label>
                    <Input
                      value={row.credentialId}
                      onChange={(event) =>
                        updateRow(index, { credentialId: event.target.value })
                      }
                      maxLength={100}
                      placeholder="VD: ABC-123"
                      disabled={disabled}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Thời gian cấp
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <Select
                      value={row.issuedDay || null}
                      onValueChange={(value) =>
                        updateRow(index, {
                          issuedDay: selectDatePart(value),
                        })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger
                        className="h-8 w-full min-w-0 text-sm"
                        aria-label="Ngày cấp"
                      >
                        <span className="truncate">
                          {row.issuedDay ? `Ngày ${row.issuedDay}` : "Ngày"}
                        </span>
                      </SelectTrigger>
                      <SelectContent
                        align="start"
                        alignItemWithTrigger={false}
                        sideOffset={8}
                      >
                        <SelectItem value="none">—</SelectItem>
                        {dayOptions.map((day) => (
                          <SelectItem key={day} value={String(day)}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={row.issuedMonth || null}
                      onValueChange={(value) => {
                        const issuedMonth = selectDatePart(value);
                        updateRow(index, {
                          issuedMonth,
                          issuedDay: clampIssuedDay(
                            row.issuedDay,
                            issuedMonth,
                            row.issuedYear,
                          ),
                        });
                      }}
                      disabled={disabled}
                    >
                      <SelectTrigger
                        className="h-8 w-full min-w-0 text-sm"
                        aria-label="Tháng cấp"
                      >
                        <span className="truncate">
                          {row.issuedMonth
                            ? `Tháng ${row.issuedMonth}`
                            : "Tháng"}
                        </span>
                      </SelectTrigger>
                      <SelectContent
                        align="start"
                        alignItemWithTrigger={false}
                        sideOffset={8}
                      >
                        <SelectItem value="none">—</SelectItem>
                        {EVIDENCE_MONTHS.map((month) => (
                          <SelectItem key={month} value={String(month)}>
                            Tháng {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={row.issuedYear || null}
                      onValueChange={(value) => {
                        const issuedYear = selectDatePart(value);
                        updateRow(index, {
                          issuedYear,
                          issuedDay: clampIssuedDay(
                            row.issuedDay,
                            row.issuedMonth,
                            issuedYear,
                          ),
                        });
                      }}
                      disabled={disabled}
                    >
                      <SelectTrigger
                        className="h-8 w-full min-w-0 text-sm"
                        aria-label="Năm cấp"
                      >
                        <span className="truncate">
                          {row.issuedYear || "Năm"}
                        </span>
                      </SelectTrigger>
                      <SelectContent
                        align="start"
                        alignItemWithTrigger={false}
                        sideOffset={8}
                      >
                        <SelectItem value="none">—</SelectItem>
                        {EVIDENCE_YEARS.map((year) => (
                          <SelectItem key={year} value={String(year)}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const PROFICIENCY_STYLES: Record<SkillProficiencyLevel, string> = {
  Beginner:
    "border-border bg-muted text-muted-foreground",
  Intermediate:
    "border-[#4FC3F7]/30 bg-[#4FC3F7]/12 text-[#0d6e9c] dark:border-[#4FC3F7]/40 dark:bg-[#4FC3F7]/20 dark:text-[#7dd3fc]",
  Advanced:
    "border-[#7CB342]/25 bg-[#7CB342]/15 text-[#3d5c22] dark:border-[#7CB342]/40 dark:bg-[#7CB342]/20 dark:text-[#a3e635]",
  Expert:
    "border-[#FDD835]/35 bg-[#FDD835]/20 text-[#8A7200] dark:border-[#FDD835]/40 dark:bg-[#FDD835]/20 dark:text-[#fde047]",
};

async function fetchSkillCatalog(): Promise<SkillSummary[]> {
  const result = await getSkills({ page: 1, pageSize: 100, sortBy: "name" });
  return result?.data?.items ?? [];
}

type SkillRowProps = {
  item: MentorSkill;
  isBusy: boolean;
  isVisibilityBusy: boolean;
  onDelete: (item: MentorSkill) => void;
  onToggleVisibility: (item: MentorSkill) => void;
  onEdit: (item: MentorSkill) => void;
};

function SkillRow({
  item,
  isBusy,
  isVisibilityBusy,
  onDelete,
  onToggleVisibility,
  onEdit,
}: SkillRowProps) {
  const name =
    item.skill?.name?.trim() || item.skill?.code?.trim() || "Kỹ năng";
  const category = item.skill?.category;
  const isHidden = !item.isPublic;

  return (
    <li
      className={cn(
        "border-b border-border px-3 py-2.5 transition-[opacity,filter,background-color] duration-300 last:border-b-0",
        isBusy && "cursor-wait opacity-70",
        isHidden && "bg-muted/60 opacity-55 grayscale-[0.35]",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-sm font-medium text-foreground",
            isHidden && "text-muted-foreground",
          )}
        >
          {name}
        </span>
        {isHidden ? (
          <Badge
            variant="outline"
            className="shrink-0 rounded-full border-border bg-muted/70 px-2 py-0 text-[10px] font-semibold text-muted-foreground"
          >
            Đang ẩn
          </Badge>
        ) : null}
        <Badge
          variant="outline"
          className={cn(
            "shrink-0 rounded-full px-2 py-0 text-[10px] font-semibold",
            PROFICIENCY_STYLES[item.proficiencyLevel],
            isHidden && "opacity-80",
          )}
        >
          {SKILL_PROFICIENCY_LABELS[item.proficiencyLevel]}
        </Badge>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={isBusy || isVisibilityBusy}
          onClick={() => onToggleVisibility(item)}
          aria-label={isHidden ? "Hiện kỹ năng" : "Ẩn kỹ năng"}
          title={
            isHidden
              ? "Hiện kỹ năng với học viên"
              : "Ẩn kỹ năng khỏi học viên"
          }
          className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
        >
          {isHidden ? (
            <EyeOff className="size-3.5" />
          ) : (
            <Eye className="size-3.5" />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={isBusy}
          onClick={() => onEdit(item)}
          aria-label="Chỉnh sửa kỹ năng"
          title="Chỉnh sửa kỹ năng"
          className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
        >
          <Pencil className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={isBusy}
          onClick={() => onDelete(item)}
          aria-label="Xóa kỹ năng"
          title="Xóa kỹ năng"
          className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
      {(category ||
        item.skill?.code ||
        item.yearsOfExperience > 0 ||
        item.evidences.length > 0 ||
        item.notes?.trim()) && (
        <p
          className={cn(
            "mt-0.5 truncate text-[11px] text-muted-foreground",
            isHidden && "opacity-80",
          )}
        >
          {[
            category ? SKILL_CATEGORY_LABELS[category] : null,
            item.skill?.code,
            item.yearsOfExperience > 0
              ? `${item.yearsOfExperience} năm KN`
              : null,
            item.evidences.length > 0
              ? `${item.evidences.length} evidence`
              : null,
            item.notes?.trim(),
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
    </li>
  );
}

type MentorSkillsSectionProps = {
  /** Called after add / edit / delete / visibility so board match can refresh. */
  onChanged?: () => void;
  /** Start collapsed (useful on crowded registration page). */
  defaultExpanded?: boolean;
  className?: string;
};

/** Mentor skills manager — used on class registration (and optionally profile). */
export function MentorSkillsSection({
  onChanged,
  defaultExpanded = true,
  className,
}: MentorSkillsSectionProps = {}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [visibilityBusyId, setVisibilityBusyId] = useState<string | null>(null);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [proficiencyLevel, setProficiencyLevel] =
    useState<SkillProficiencyLevel>("Intermediate");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [notes, setNotes] = useState("");
  const [addIsPublic, setAddIsPublic] = useState(true);
  const [addEvidences, setAddEvidences] = useState<EvidenceFormRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<MentorSkill | null>(null);
  const [editProficiency, setEditProficiency] =
    useState<SkillProficiencyLevel>("Intermediate");
  const [editYears, setEditYears] = useState("0");
  const [editDescription, setEditDescription] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [editEvidences, setEditEvidences] = useState<EvidenceFormRow[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const {
    data: skills,
    isLoading,
    markLoading,
    retry,
    mutate,
  } = useClientFetch({
    fetcher: async () => {
      const result = await getMyMentorSkills();
      return result?.data ?? [];
    },
    deps: [],
    onError: (error) => showAppErrorFromUnknown(error, "mentors.skills.list"),
  });

  const { data: catalogData, isLoading: isCatalogLoading } = useClientFetch({
    enabled: isAddOpen,
    fetcher: fetchSkillCatalog,
    deps: [isAddOpen],
    onError: (error) => showAppErrorFromUnknown(error, "skills.list"),
  });
  const catalog = catalogData ?? [];

  const ownedSkillIds = useMemo(
    () => new Set((skills ?? []).map((item) => item.skillId)),
    [skills],
  );

  const availableSkills = useMemo(
    () => catalog.filter((skill) => !ownedSkillIds.has(skill.id)),
    [catalog, ownedSkillIds],
  );

  const selectedSkill = availableSkills.find(
    (skill) => skill.id === selectedSkillId,
  );

  const list = skills ?? [];

  function resetAddForm() {
    setSelectedSkillId(null);
    setProficiencyLevel("Intermediate");
    setYearsOfExperience("");
    setNotes("");
    setAddIsPublic(true);
    setAddEvidences([]);
    setFormError(null);
  }

  async function handleAddSkill() {
    if (!selectedSkillId) {
      setFormError("Hãy chọn một kỹ năng.");
      return;
    }

    const parsedYears = yearsOfExperience.trim()
      ? Number(yearsOfExperience)
      : undefined;
    if (
      parsedYears !== undefined &&
      (!Number.isInteger(parsedYears) || parsedYears < 0 || parsedYears > 60)
    ) {
      setFormError("Số năm kinh nghiệm phải là số nguyên từ 0 đến 60.");
      return;
    }

    const evidenceResult = mapEvidenceRows(addEvidences);
    if (evidenceResult.error) {
      setFormError(evidenceResult.error);
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      await addMyMentorSkill({
        skillId: selectedSkillId,
        proficiencyLevel,
        yearsOfExperience: parsedYears,
        notes: notes.trim() ? notes.trim() : null,
        isPublic: addIsPublic,
        evidences:
          evidenceResult.inputs.length > 0 ? evidenceResult.inputs : undefined,
      });
      showAppSuccess({
        title: "Đã thêm kỹ năng",
        description: selectedSkill?.name
          ? `${selectedSkill.name} đã được thêm vào hồ sơ mentor.`
          : "Kỹ năng đã được thêm vào hồ sơ mentor.",
      });
      setIsAddOpen(false);
      resetAddForm();
      setIsExpanded(true);
      markLoading();
      retry();
      onChanged?.();
    } catch (error) {
      showAppErrorFromUnknown(error, "mentors.skills.add");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleVisibility(item: MentorSkill) {
    if (visibilityBusyId) return;
    const nextIsPublic = !item.isPublic;
    setVisibilityBusyId(item.id);
    // Optimistic toggle for snappy UX.
    mutate((prev) =>
      (prev ?? []).map((skill) =>
        skill.id === item.id ? { ...skill, isPublic: nextIsPublic } : skill,
      ),
    );

    try {
      await setMyMentorSkillVisibility(item.id, { isPublic: nextIsPublic });
      showAppSuccess({
        title: nextIsPublic ? "Đã hiện kỹ năng" : "Đã ẩn kỹ năng",
        description: item.skill?.name
          ? nextIsPublic
            ? `${item.skill.name} đã hiển thị với học viên.`
            : `${item.skill.name} đã được ẩn khỏi học viên.`
          : undefined,
      });
      onChanged?.();
    } catch (error) {
      showAppErrorFromUnknown(error, "mentors.skills.visibility");
      markLoading();
      retry();
    } finally {
      setVisibilityBusyId(null);
    }
  }

  function handleOpenEdit(item: MentorSkill) {
    setEditTarget(item);
    setEditProficiency(item.proficiencyLevel);
    setEditYears(String(item.yearsOfExperience));
    setEditDescription(item.description ?? "");
    setEditNotes(item.notes ?? "");
    setEditIsPublic(item.isPublic);
    setEditEvidences(item.evidences.map(evidenceRowFromApi));
    setEditError(null);
  }

  async function handleSaveEdit() {
    if (!editTarget) return;

    const parsedYears = editYears.trim() ? Number(editYears) : 0;
    if (!Number.isInteger(parsedYears) || parsedYears < 0 || parsedYears > 60) {
      setEditError("Số năm kinh nghiệm phải là số nguyên từ 0 đến 60.");
      return;
    }

    const evidenceResult = mapEvidenceRows(editEvidences);
    if (evidenceResult.error) {
      setEditError(evidenceResult.error);
      return;
    }

    try {
      setIsSavingEdit(true);
      setEditError(null);
      await updateMyMentorSkill(editTarget.id, {
        proficiencyLevel: editProficiency,
        yearsOfExperience: parsedYears,
        description: editDescription.trim() ? editDescription.trim() : null,
        notes: editNotes.trim() ? editNotes.trim() : null,
        isPublic: editIsPublic,
        evidences: evidenceResult.inputs,
      });
      showAppSuccess({
        title: "Đã cập nhật kỹ năng",
        description: editTarget.skill?.name || undefined,
      });
      setEditTarget(null);
      markLoading();
      retry();
      onChanged?.();
    } catch (error) {
      showAppErrorFromUnknown(error, "mentors.skills.update");
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleDeleteSkill(item: MentorSkill) {
    if (deletingId) return;
    setDeletingId(item.id);
    // Optimistic remove for snappy swipe UX.
    mutate((prev) => (prev ?? []).filter((skill) => skill.id !== item.id));

    try {
      await deleteMyMentorSkill(item.id);
      showAppSuccess({
        title: "Đã xóa kỹ năng",
        description: item.skill?.name
          ? `${item.skill.name} đã được gỡ khỏi hồ sơ.`
          : "Kỹ năng đã được gỡ khỏi hồ sơ.",
      });
      onChanged?.();
    } catch (error) {
      showAppErrorFromUnknown(error, "mentors.skills.delete");
      markLoading();
      retry();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card
      id="mentor-skills"
      className={cn("border-border bg-card shadow-sm", className)}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
        <button
          type="button"
          onClick={() => setIsExpanded((open) => !open)}
          aria-expanded={isExpanded}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Sparkles className="size-4 shrink-0 text-primary" aria-hidden />
          <CardTitle className="font-heading truncate text-base font-semibold text-foreground">
            Kỹ năng mentor
            {list.length > 0 ? (
              <span className="ml-1.5 font-mono text-xs font-medium text-muted-foreground">
                · {list.length}
              </span>
            ) : null}
          </CardTitle>
          <ChevronDown
            className={cn(
              "ml-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-200",
              isExpanded && "rotate-180",
            )}
            aria-hidden
          />
        </button>

        <Button
          type="button"
          size="sm"
          onClick={() => {
            resetAddForm();
            setIsAddOpen(true);
          }}
          className="h-9 shrink-0 rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Thêm
        </Button>
      </CardHeader>

      {isExpanded ? (
        <CardContent className="px-4 pb-3 pt-0 sm:px-5">
          <p className="mb-2.5 text-xs text-muted-foreground">
            Cập nhật kỹ năng tại đây để khớp với lớp Bản nháp đang nhận mentor — không cần vào
            hồ sơ cá nhân.
          </p>
          {isLoading && list.length === 0 ? (
            <div className="space-y-1.5">
              <div className="h-10 animate-pulse rounded-md bg-muted" />
              <div className="h-10 animate-pulse rounded-md bg-muted" />
            </div>
          ) : list.length === 0 ? (
            <p className="rounded-md border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              Chưa có kỹ năng — bấm Thêm để chọn từ danh mục STEAM.
            </p>
          ) : (
            <>
              <ul
                className={cn(
                  "overflow-hidden rounded-md border border-border",
                  isLoading && "opacity-60",
                )}
              >
                {list.map((item) => (
                  <SkillRow
                    key={item.id}
                    item={item}
                    isBusy={deletingId === item.id}
                    isVisibilityBusy={visibilityBusyId === item.id}
                    onDelete={(target) => void handleDeleteSkill(target)}
                    onToggleVisibility={(target) =>
                      void handleToggleVisibility(target)
                    }
                    onEdit={handleOpenEdit}
                  />
                ))}
              </ul>
            </>
          )}
        </CardContent>
      ) : null}

      <Dialog
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) resetAddForm();
        }}
      >
        <DialogScrollPopup className="sm:max-w-lg">
          <DialogScrollHeader>
            <DialogClose />
            <DialogHeader>
              <DialogTitle>Thêm kỹ năng</DialogTitle>
              <DialogDescription>
                Chọn kỹ năng từ danh mục STEAM của hệ thống.
              </DialogDescription>
            </DialogHeader>
          </DialogScrollHeader>

          <DialogScrollBody className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Kỹ năng
              </label>
              <Select
                value={selectedSkillId}
                onValueChange={(value) => {
                  setSelectedSkillId(value);
                  setFormError(null);
                }}
                disabled={isCatalogLoading || availableSkills.length === 0}
              >
                <SelectTrigger className={cn(THEME_SELECT_TRIGGER, "w-full")}>
                  <span className="truncate">
                    {selectedSkill
                      ? selectedSkill.name || selectedSkill.code || "Kỹ năng"
                      : isCatalogLoading
                        ? "Đang tải..."
                        : availableSkills.length === 0
                          ? catalog.length === 0
                            ? "Chưa có kỹ năng trong danh mục"
                            : "Bạn đã thêm hết kỹ năng khả dụng"
                          : "Chọn kỹ năng"}
                  </span>
                </SelectTrigger>
                <SelectContent
                  align="start"
                  alignItemWithTrigger={false}
                  sideOffset={8}
                  className={THEME_SELECT_CONTENT}
                >
                  {availableSkills.map((skill) => (
                    <SelectItem
                      key={skill.id}
                      value={skill.id}
                      className={cn(THEME_SELECT_ITEM, "cursor-pointer")}
                    >
                      <span className="flex flex-col gap-0.5 py-0.5 text-left">
                        <span>{skill.name || skill.code || "Kỹ năng"}</span>
                        <span className="text-xs text-muted-foreground">
                          {SKILL_CATEGORY_LABELS[skill.category]}
                          {skill.code ? ` · ${skill.code}` : ""}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Mức thành thạo
              </label>
              <Select
                value={proficiencyLevel}
                onValueChange={(value) => {
                  if (value) {
                    setProficiencyLevel(value as SkillProficiencyLevel);
                  }
                }}
              >
                <SelectTrigger className={cn(THEME_SELECT_TRIGGER, "w-full")}>
                  <span className="truncate">
                    {SKILL_PROFICIENCY_LABELS[proficiencyLevel]}
                  </span>
                </SelectTrigger>
                <SelectContent
                  align="start"
                  alignItemWithTrigger={false}
                  sideOffset={8}
                  className={THEME_SELECT_CONTENT}
                >
                  {SKILL_PROFICIENCY_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className={cn(THEME_SELECT_ITEM, "cursor-pointer")}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="mentor-skill-years"
                className="text-xs font-medium text-foreground"
              >
                Số năm kinh nghiệm{" "}
                <span className="font-normal text-muted-foreground">
                  (tuỳ chọn)
                </span>
              </label>
              <Input
                id="mentor-skill-years"
                type="number"
                inputMode="numeric"
                min={0}
                max={60}
                value={yearsOfExperience}
                onChange={(event) => setYearsOfExperience(event.target.value)}
                placeholder="Ví dụ: 2"
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="mentor-skill-notes"
                className="text-xs font-medium text-foreground"
              >
                Ghi chú{" "}
                <span className="font-normal text-muted-foreground">
                  (tuỳ chọn)
                </span>
              </label>
              <Textarea
                id="mentor-skill-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={500}
                placeholder="Ví dụ: đã dạy robotics 2 năm..."
                className="min-h-20 resize-none text-sm"
              />
            </div>

            <SkillEvidenceEditor
              rows={addEvidences}
              onChange={setAddEvidences}
              disabled={isSubmitting}
            />

            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-foreground">
                  Hiển thị với học viên
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Kỹ năng ẩn chỉ mentor và manager thấy.
                </p>
              </div>
              <Switch
                checked={addIsPublic}
                onCheckedChange={(checked) => setAddIsPublic(checked)}
                aria-label="Hiển thị kỹ năng với học viên"
              />
            </div>

            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}
          </DialogScrollBody>

          <DialogScrollFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddOpen(false)}
              disabled={isSubmitting}
              className="h-9 rounded-lg"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleAddSkill}
              disabled={isSubmitting || availableSkills.length === 0}
              className="h-9 rounded-lg bg-[#E94B3C] font-semibold text-white hover:bg-[#E94B3C]/90"
            >
              {isSubmitting ? "Đang thêm…" : "Thêm"}
            </Button>
          </DialogScrollFooter>
        </DialogScrollPopup>
      </Dialog>

      <Dialog
        open={editTarget != null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
      >
        <DialogScrollPopup className="sm:max-w-lg">
          <DialogScrollHeader>
            <DialogClose />
            <DialogHeader>
              <DialogTitle>Chỉnh sửa kỹ năng</DialogTitle>
              <DialogDescription>
                {editTarget?.skill?.name || editTarget?.skill?.code || "Kỹ năng"}
              </DialogDescription>
            </DialogHeader>
          </DialogScrollHeader>

          <DialogScrollBody className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Mức thành thạo
                </label>
                <Select
                  value={editProficiency}
                  onValueChange={(value) => {
                    if (value) {
                      setEditProficiency(value as SkillProficiencyLevel);
                    }
                  }}
                >
                  <SelectTrigger className={cn(THEME_SELECT_TRIGGER, "w-full")}>
                    <span className="truncate">
                      {SKILL_PROFICIENCY_LABELS[editProficiency]}
                    </span>
                  </SelectTrigger>
                  <SelectContent
                    align="start"
                    alignItemWithTrigger={false}
                    sideOffset={8}
                    className={THEME_SELECT_CONTENT}
                  >
                    {SKILL_PROFICIENCY_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className={cn(THEME_SELECT_ITEM, "cursor-pointer")}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="mentor-skill-edit-years"
                  className="text-xs font-medium text-foreground"
                >
                  Năm kinh nghiệm
                </label>
                <Input
                  id="mentor-skill-edit-years"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={60}
                  value={editYears}
                  onChange={(event) => setEditYears(event.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="mentor-skill-edit-description"
                className="text-xs font-medium text-foreground"
              >
                Mô tả{" "}
                <span className="font-normal text-muted-foreground">
                  (tuỳ chọn)
                </span>
              </label>
              <Textarea
                id="mentor-skill-edit-description"
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                maxLength={4000}
                placeholder="Kinh nghiệm, dự án tiêu biểu liên quan đến kỹ năng này..."
                className="min-h-24 resize-none text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="mentor-skill-edit-notes"
                className="text-xs font-medium text-foreground"
              >
                Ghi chú{" "}
                <span className="font-normal text-muted-foreground">
                  (tuỳ chọn)
                </span>
              </label>
              <Textarea
                id="mentor-skill-edit-notes"
                value={editNotes}
                onChange={(event) => setEditNotes(event.target.value)}
                maxLength={500}
                className="min-h-16 resize-none text-sm"
              />
            </div>

            <SkillEvidenceEditor
              rows={editEvidences}
              onChange={setEditEvidences}
              disabled={isSavingEdit}
            />

            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-foreground">
                  Hiển thị với học viên
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Kỹ năng ẩn chỉ mentor và manager thấy.
                </p>
              </div>
              <Switch
                checked={editIsPublic}
                onCheckedChange={(checked) => setEditIsPublic(checked)}
                aria-label="Hiển thị kỹ năng với học viên"
              />
            </div>

            {editError ? (
              <p className="text-sm text-destructive">{editError}</p>
            ) : null}
          </DialogScrollBody>

          <DialogScrollFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditTarget(null)}
              disabled={isSavingEdit}
              className="h-9 rounded-lg"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={() => void handleSaveEdit()}
              disabled={isSavingEdit}
              className="h-9 rounded-lg bg-[#E94B3C] font-semibold text-white hover:bg-[#E94B3C]/90"
            >
              {isSavingEdit ? "Đang lưu…" : "Lưu thay đổi"}
            </Button>
          </DialogScrollFooter>
        </DialogScrollPopup>
      </Dialog>
    </Card>
  );
}
