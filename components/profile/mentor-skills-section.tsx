"use client";

import { useMemo, useState } from "react";
import { animate, motion, useMotionValue } from "motion/react";
import { ChevronDown, Plus, Sparkles, Trash2 } from "lucide-react";

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
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  addMyMentorSkill,
  deleteMyMentorSkill,
  getMentorBoard,
  getMyMentorSkills,
  type MentorSkill,
  type SkillProficiencyLevel,
  type SkillSummary,
} from "@/lib/api";
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

const SWIPE_DELETE_THRESHOLD = 64;

const PROFICIENCY_STYLES: Record<SkillProficiencyLevel, string> = {
  Beginner: "border-[#E5E5E0] bg-[#F5F5F0] text-[#6B6B6B]",
  Intermediate: "border-[#4FC3F7]/30 bg-[#4FC3F7]/12 text-[#0d6e9c]",
  Advanced: "border-[#7CB342]/25 bg-[#7CB342]/15 text-[#3d5c22]",
  Expert: "border-[#FDD835]/35 bg-[#FDD835]/20 text-[#8A7200]",
};

async function fetchSkillCatalog(): Promise<SkillSummary[]> {
  const result = await getMentorBoard({ page: 1, pageSize: 100 });
  const byId = new Map<string, SkillSummary>();

  for (const classItem of result.data?.items ?? []) {
    for (const skill of classItem.requiredSkills) {
      byId.set(skill.id, skill);
    }
  }

  return [...byId.values()].sort((left, right) =>
    (left.name ?? left.code ?? "").localeCompare(
      right.name ?? right.code ?? "",
      "vi",
    ),
  );
}

type SwipeSkillRowProps = {
  item: MentorSkill;
  isBusy: boolean;
  onSwipeDelete: (item: MentorSkill) => void;
};

function SwipeSkillRow({ item, isBusy, onSwipeDelete }: SwipeSkillRowProps) {
  const x = useMotionValue(0);
  const name =
    item.skill?.name?.trim() || item.skill?.code?.trim() || "Kỹ năng";
  const category = item.skill?.category;

  return (
    <li className="relative overflow-hidden border-b border-[#E5E5E0] last:border-b-0">
      <div
        className="absolute inset-0 flex items-center justify-end bg-[#E94B3C] px-4"
        aria-hidden
      >
        <Trash2 className="size-4 text-white" />
      </div>

      <motion.div
        style={{ x }}
        drag={isBusy ? false : "x"}
        dragConstraints={{ left: -180, right: 0 }}
        dragElastic={{ left: 0.15, right: 0.05 }}
        dragMomentum={false}
        onDragEnd={(_, info) => {
          const shouldDelete =
            info.offset.x < -SWIPE_DELETE_THRESHOLD || info.velocity.x < -450;

          if (shouldDelete) {
            void animate(x, -420, { duration: 0.18, ease: "easeIn" }).then(() => {
              onSwipeDelete(item);
            });
            return;
          }

          void animate(x, 0, {
            type: "spring",
            stiffness: 420,
            damping: 36,
          });
        }}
        className={cn(
          "relative z-[1] touch-pan-y bg-white px-3 py-2.5",
          isBusy ? "cursor-wait opacity-70" : "cursor-grab active:cursor-grabbing",
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#2D2D2D]">
            {name}
          </span>
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 rounded-full px-2 py-0 text-[10px] font-semibold",
              PROFICIENCY_STYLES[item.proficiencyLevel],
            )}
          >
            {SKILL_PROFICIENCY_LABELS[item.proficiencyLevel]}
          </Badge>
        </div>
        {(category || item.skill?.code || item.notes?.trim()) && (
          <p className="mt-0.5 truncate text-[11px] text-[#6B6B6B]">
            {[
              category ? SKILL_CATEGORY_LABELS[category] : null,
              item.skill?.code,
              item.notes?.trim(),
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </motion.div>
    </li>
  );
}

/** Mentor-only skills block on `/profile`. */
export function MentorSkillsSection() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [proficiencyLevel, setProficiencyLevel] =
    useState<SkillProficiencyLevel>("Intermediate");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    data: skills,
    isLoading,
    markLoading,
    retry,
    mutate,
  } = useClientFetch({
    fetcher: async () => {
      const result = await getMyMentorSkills();
      return result.data ?? [];
    },
    deps: [],
    onError: (error) => showAppErrorFromUnknown(error, "mentors.skills.list"),
  });

  const { data: catalogData, isLoading: isCatalogLoading } = useClientFetch({
    enabled: isAddOpen,
    fetcher: fetchSkillCatalog,
    deps: [isAddOpen],
    onError: (error) =>
      showAppErrorFromUnknown(error, "classMentorRequests.board"),
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
    setNotes("");
    setFormError(null);
  }

  async function handleAddSkill() {
    if (!selectedSkillId) {
      setFormError("Hãy chọn một kỹ năng.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      await addMyMentorSkill({
        skillId: selectedSkillId,
        proficiencyLevel,
        notes: notes.trim() ? notes.trim() : null,
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
    } catch (error) {
      showAppErrorFromUnknown(error, "mentors.skills.add");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSwipeDelete(item: MentorSkill) {
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
    } catch (error) {
      showAppErrorFromUnknown(error, "mentors.skills.delete");
      markLoading();
      retry();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card id="mentor-skills" className="border-[#E5E5E0] bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
        <button
          type="button"
          onClick={() => setIsExpanded((open) => !open)}
          aria-expanded={isExpanded}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md text-left outline-none transition-colors hover:bg-[#FAFAF5] focus-visible:ring-2 focus-visible:ring-[#E94B3C]/30"
        >
          <Sparkles className="size-4 shrink-0 text-[#E94B3C]" aria-hidden />
          <CardTitle className="font-heading truncate text-base font-semibold text-[#2D2D2D]">
            Kỹ năng mentor
            {list.length > 0 ? (
              <span className="ml-1.5 font-mono text-xs font-medium text-[#6B6B6B]">
                · {list.length}
              </span>
            ) : null}
          </CardTitle>
          <ChevronDown
            className={cn(
              "ml-0.5 size-4 shrink-0 text-[#6B6B6B] transition-transform duration-200",
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
          className="h-9 shrink-0 rounded-lg bg-[#E94B3C] px-3.5 text-sm font-semibold text-white hover:bg-[#E94B3C]/90"
        >
          <Plus className="size-4" />
          Thêm
        </Button>
      </CardHeader>

      {isExpanded ? (
        <CardContent className="px-4 pb-3 pt-0 sm:px-5">
          {isLoading && list.length === 0 ? (
            <div className="space-y-1.5">
              <div className="h-10 animate-pulse rounded-md bg-[#E5E5E0]" />
              <div className="h-10 animate-pulse rounded-md bg-[#E5E5E0]" />
            </div>
          ) : list.length === 0 ? (
            <p className="rounded-md border border-dashed border-[#E5E5E0] bg-[#FAFAF5] px-3 py-2 text-xs text-[#6B6B6B]">
              Chưa có kỹ năng — bấm Thêm để khớp lớp đang tuyển.
            </p>
          ) : (
            <>
              <p className="mb-1.5 text-[11px] text-[#6B6B6B]">
                Vuốt trái để xóa ngay
              </p>
              <ul
                className={cn(
                  "overflow-hidden rounded-md border border-[#E5E5E0]",
                  isLoading && "opacity-60",
                )}
              >
                {list.map((item) => (
                  <SwipeSkillRow
                    key={item.id}
                    item={item}
                    isBusy={deletingId === item.id}
                    onSwipeDelete={handleSwipeDelete}
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
        <DialogPopup className="sm:max-w-md">
          <DialogClose />
          <DialogHeader>
            <DialogTitle>Thêm kỹ năng</DialogTitle>
            <DialogDescription>
              Chọn từ kỹ năng của lớp đang tuyển mentor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
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
                          ? "Không còn kỹ năng để thêm"
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

            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}
          </div>

          <DialogFooter>
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
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </Card>
  );
}
