"use client";

import {
  Briefcase,
  CheckCircle2,
  Mail,
  Phone,
  Sparkles,
  UserRound,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetHeader,
  SheetPopup,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientFetch } from "@/hooks/use-client-fetch";
import { getMentorById, type SkillSummary } from "@/lib/api";
import type { MentorSkillProficiency } from "@/lib/api/entities/mentor";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { cn } from "@/lib/utils";

const PROFICIENCY_LABELS: Record<MentorSkillProficiency, string> = {
  Beginner: "Cơ bản",
  Intermediate: "Trung bình",
  Advanced: "Nâng cao",
  Expert: "Chuyên gia",
};

const CATEGORY_LABELS: Record<string, string> = {
  Science: "Science",
  Technology: "Technology",
  Engineering: "Engineering",
  Arts: "Arts",
  Math: "Math",
  SoftSkill: "Soft skill",
};

function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "GV";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

type MentorQuickPreviewSheetProps = {
  mentorId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Class required skills — matching mentor skills are highlighted. */
  requiredSkills?: SkillSummary[];
  requestMessage?: string | null;
};

export function MentorQuickPreviewSheet({
  mentorId,
  open,
  onOpenChange,
  requiredSkills = [],
  requestMessage,
}: MentorQuickPreviewSheetProps) {
  const { data, isLoading } = useClientFetch({
    enabled: open && !!mentorId,
    fetcher: async () => {
      if (!mentorId) return null;
      return getMentorById(mentorId);
    },
    deps: [mentorId, open],
    onError: (error) => showAppErrorFromUnknown(error, "mentors.detail"),
  });

  const mentor = data?.data ?? null;
  const requiredSkillIds = new Set(requiredSkills.map((skill) => skill.id));
  const skills = mentor?.skills ?? [];
  const matchedCount = skills.filter((item) =>
    requiredSkillIds.has(item.skillId),
  ).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetPopup side="right" className="w-[min(26rem,92vw)]">
        <SheetHeader className="pr-12">
          <SheetTitle>Hồ sơ mentor</SheetTitle>
          <p className="text-xs text-[#6B6B6B]">
            Xem nhanh để quyết định duyệt — không cần rời trang lớp.
          </p>
        </SheetHeader>
        <SheetClose />

        <SheetBody className="space-y-5 px-4 py-4">
          {isLoading && !mentor ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-14 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          ) : !mentor ? (
            <div className="rounded-xl border border-dashed border-[#D8D8D2] bg-[#FAFAF5] px-4 py-8 text-center">
              <UserRound className="mx-auto size-8 text-[#B0B0A8]" />
              <p className="mt-3 text-sm font-medium text-[#2D2D2D]">
                Không tải được hồ sơ mentor
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <Avatar className="size-14 border border-[#E5E5E0]">
                  <AvatarImage src={mentor.avatarUrl || undefined} alt="" />
                  <AvatarFallback className="bg-[#4FC3F7]/12 text-sm font-bold text-[#0D6E9C]">
                    {getInitials(mentor.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-heading text-lg font-bold text-[#2D2D2D]">
                    {mentor.fullName || "Mentor chưa đặt tên"}
                  </p>
                  <p className="font-mono text-xs text-[#6B6B6B]">
                    {mentor.code || "—"}
                  </p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "mt-2 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                      mentor.status === "Active"
                        ? "border-[#7CB342]/20 bg-[#7CB342]/15 text-[#3d5c22]"
                        : "border-[#E94B3C]/15 bg-[#E94B3C]/10 text-[#a82a1e]",
                    )}
                  >
                    {mentor.status === "Active" ? "Đang hoạt động" : mentor.status}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-2 rounded-xl border border-[#E5E5E0] bg-[#FAFAF5]/80 p-3 text-sm">
                <InfoRow
                  icon={Mail}
                  label="Email"
                  value={mentor.email || "—"}
                />
                <InfoRow
                  icon={Phone}
                  label="SĐT"
                  value={mentor.phone || "—"}
                />
                <InfoRow
                  icon={Briefcase}
                  label="Tải lớp"
                  value={`${mentor.concurrentUsage}/${mentor.effectiveMaxConcurrentClasses} · ${mentor.assignedClassCount} đang dạy · ${mentor.pendingRequestCount} yêu cầu chờ`}
                />
              </div>

              {requestMessage ? (
                <div className="rounded-xl border border-[#E5E5E0] bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">
                    Lời nhắn xin nhận lớp
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#2D2D2D]">
                    {requestMessage}
                  </p>
                </div>
              ) : null}

              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-[#2D2D2D]">
                    <Sparkles className="size-4 text-[#E94B3C]" />
                    Kỹ năng ({skills.length})
                  </p>
                  {requiredSkills.length > 0 ? (
                    <p className="text-xs font-medium text-[#0D6E9C]">
                      {matchedCount}/{requiredSkills.length} khớp lớp
                    </p>
                  ) : null}
                </div>

                {skills.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-[#D8D8D2] px-3 py-6 text-center text-sm text-[#6B6B6B]">
                    Mentor chưa cập nhật kỹ năng.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {skills.map((item) => {
                      const isMatch = requiredSkillIds.has(item.skillId);
                      return (
                        <li
                          key={item.id}
                          className={cn(
                            "rounded-xl border px-3 py-2.5",
                            isMatch
                              ? "border-[#7CB342]/35 bg-[#7CB342]/8"
                              : "border-[#E5E5E0] bg-white",
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[#2D2D2D]">
                                {item.skill?.name || item.skill?.code || "Skill"}
                              </p>
                              <p className="mt-0.5 text-[11px] text-[#6B6B6B]">
                                {CATEGORY_LABELS[item.skill?.category ?? ""] ??
                                  item.skill?.category ??
                                  "—"}
                                {item.skill?.subcategory
                                  ? ` · ${item.skill.subcategory}`
                                  : ""}
                              </p>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-1">
                              <span className="rounded-full bg-[#F5F5F0] px-2 py-0.5 text-[11px] font-semibold text-[#4A4A4A]">
                                {PROFICIENCY_LABELS[item.proficiencyLevel]}
                              </span>
                              {isMatch ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#3d5c22]">
                                  <CheckCircle2 className="size-3" />
                                  Khớp lớp
                                </span>
                              ) : null}
                            </div>
                          </div>
                          {item.notes ? (
                            <p className="mt-1.5 line-clamp-2 text-xs text-[#6B6B6B]">
                              {item.notes}
                            </p>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {requiredSkills.length > 0 ? (
                  <div className="mt-3 rounded-xl bg-[#FAFAF5] px-3 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B]">
                      Skill lớp yêu cầu
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {requiredSkills.map((skill) => {
                        const matched = skills.some(
                          (item) => item.skillId === skill.id,
                        );
                        return (
                          <span
                            key={skill.id}
                            className={cn(
                              "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                              matched
                                ? "border-[#7CB342]/25 bg-[#7CB342]/15 text-[#3d5c22]"
                                : "border-[#E5E5E0] bg-white text-[#6B6B6B]",
                            )}
                          >
                            {skill.name || skill.code || "Skill"}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </SheetBody>
      </SheetPopup>
    </Sheet>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-[#8A8A84]" />
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-[#8A8A84]">{label}</p>
        <p className="break-words text-[#2D2D2D]">{value}</p>
      </div>
    </div>
  );
}
