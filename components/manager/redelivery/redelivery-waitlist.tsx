"use client";

import { useState } from "react";
import {
  CalendarDays,
  Inbox,
  Layers,
  ListOrdered,
  RotateCcw,
  Users,
} from "lucide-react";

import { ClassRedeliveryQueue } from "@/components/manager/redelivery/class-redelivery-queue";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { ManagerPageHeader } from "@/components/manager/shared/page-header";
import {
  LIGHT_SELECT_CONTENT,
  LIGHT_SELECT_ITEM,
  LIGHT_SELECT_TRIGGER,
} from "@/components/programs/program-select-styles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  getManagerRedeliveryWaitlist,
  getMentors,
  openRemedialClass,
  type RedeliveryWaitlistModuleGroup,
  type RedeliveryWaitlistProgramGroup,
} from "@/lib/api";
import { toApiDateTimeFromLocalInput } from "@/lib/curriculum/datetime";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { cn } from "@/lib/utils";

const INPUT_CLASS =
  "h-11 rounded-xl border-input bg-card text-sm text-foreground focus-visible:ring-ring/50";

type OpenRemedialTarget = {
  program: RedeliveryWaitlistProgramGroup;
  module: RedeliveryWaitlistModuleGroup;
};

function mentorLabel(mentor: {
  fullName: string | null;
  email: string | null;
  code: string | null;
}): string {
  return (
    mentor.fullName?.trim() ||
    mentor.email?.trim() ||
    mentor.code?.trim() ||
    "Mentor"
  );
}

function moduleTitle(module: RedeliveryWaitlistModuleGroup): string {
  return (
    module.moduleName?.trim() ||
    module.moduleCode?.trim() ||
    `${module.moduleId.slice(0, 8)}…`
  );
}

function programTitle(program: RedeliveryWaitlistProgramGroup): string {
  return (
    program.programName?.trim() ||
    program.programCode?.trim() ||
    `${program.programId.slice(0, 8)}…`
  );
}

export function RedeliveryWaitlist() {
  const [tab, setTab] = useState<"waitlist" | "pending">("waitlist");
  const [openTarget, setOpenTarget] = useState<OpenRemedialTarget | null>(null);
  const [mentorId, setMentorId] = useState<string | null>(null);
  const [startDateLocal, setStartDateLocal] = useState("");
  const [capacity, setCapacity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading, retry, markLoading } = useClientFetch({
    fetcher: async () => {
      const result = await getManagerRedeliveryWaitlist();
      return result?.data ?? [];
    },
    deps: [],
    onError: (error) => showAppErrorFromUnknown(error, "class-redelivery.list"),
  });

  const { data: mentorsData, isLoading: isMentorsLoading } = useClientFetch({
    enabled: openTarget != null,
    fetcher: async () => {
      const result = await getMentors({ page: 1, pageSize: 100 });
      return result?.data?.items ?? [];
    },
    deps: [openTarget?.module.moduleId],
    onError: (error) => showAppErrorFromUnknown(error, "generic"),
  });

  const groups = data ?? [];
  const mentors = mentorsData ?? [];
  const totalWaiting = groups.reduce(
    (sum, program) =>
      sum +
      program.modules.reduce(
        (moduleSum, module) => moduleSum + module.waitingCount,
        0,
      ),
    0,
  );

  function resetOpenDialog() {
    setOpenTarget(null);
    setMentorId(null);
    setStartDateLocal("");
    setCapacity("");
  }

  async function handleOpenRemedial() {
    if (!openTarget || !mentorId) return;
    const startDate = toApiDateTimeFromLocalInput(startDateLocal);
    if (!startDate) return;

    const capacityValue = capacity.trim()
      ? Number.parseInt(capacity, 10)
      : null;
    if (
      capacity.trim() &&
      (Number.isNaN(capacityValue) || (capacityValue ?? 0) < 1)
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await openRemedialClass({
        moduleId: openTarget.module.moduleId,
        mentorId,
        startDate,
        capacity: capacityValue,
      });
      const offered = result?.data?.offeredRequestCount ?? 0;
      showAppSuccess({
        title: "Đã mở lớp học lại",
        description:
          offered > 0
            ? `Đã gửi đề nghị tới ${offered} học viên trong danh sách chờ.`
            : result?.data?.className
              ? `Lớp ${result.data.className} đã được tạo.`
              : undefined,
      });
      resetOpenDialog();
      markLoading();
      retry();
    } catch (error) {
      showAppErrorFromUnknown(error, "class-redelivery.decide");
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit =
    mentorId != null &&
    Boolean(toApiDateTimeFromLocalInput(startDateLocal)) &&
    (!capacity.trim() ||
      (!Number.isNaN(Number.parseInt(capacity, 10)) &&
        Number.parseInt(capacity, 10) >= 1));

  return (
    <div className="flex flex-col gap-6">
      <ManagerPageHeader
        title="Học lại lớp"
        description="Theo dõi danh sách chờ theo chương trình/module và mở lớp học lại khi đủ nhu cầu."
        breadcrumbs={[{ label: "Học lại lớp" }]}
      >
        {tab === "waitlist" ? (
          <Button
            type="button"
            variant="outline"
            className="h-11 gap-2 rounded-xl border-border"
            onClick={() => {
              markLoading();
              retry();
            }}
          >
            <RotateCcw className="size-4" aria-hidden />
            Tải lại
          </Button>
        ) : null}
      </ManagerPageHeader>

      <div className="px-6 pb-12">
        <Tabs
          value={tab}
          onValueChange={(value) => {
            if (value === "waitlist" || value === "pending") setTab(value);
          }}
          className="gap-4"
        >
          <TabsList
            variant="line"
            className="h-auto w-full justify-start gap-1 rounded-none border-b border-border bg-transparent p-0"
          >
            <TabsTrigger
              value="waitlist"
              className="rounded-none px-4 py-2.5 data-active:text-primary"
            >
              <Layers className="size-4" />
              Danh sách chờ
              {totalWaiting > 0 ? (
                <Badge
                  variant="outline"
                  className="ml-1 border-[#4FC3F7]/35 bg-[#4FC3F7]/15 text-[#0277BD]"
                >
                  {totalWaiting}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              className="rounded-none px-4 py-2.5 data-active:text-primary"
            >
              <ListOrdered className="size-4" />
              PendingManager
            </TabsTrigger>
          </TabsList>

          <TabsContent value="waitlist" className="mt-0">
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              {isLoading ? (
                <div className="space-y-3 p-6">
                  <Skeleton className="h-20 w-full rounded-xl" />
                  <Skeleton className="h-20 w-full rounded-xl" />
                  <Skeleton className="h-20 w-full rounded-xl" />
                </div>
              ) : groups.length === 0 ? (
                <div className="p-6">
                  <ManagerEmptyState
                    icon={Inbox}
                    title="Danh sách chờ trống"
                    description="Khi học viên đăng ký học lại mà chưa có lớp phù hợp, họ sẽ xuất hiện theo chương trình và module tại đây."
                  />
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {groups.map((program) => (
                    <li key={program.programId} className="px-4 py-5 sm:px-6">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <h2 className="font-heading text-base font-bold text-foreground">
                          {programTitle(program)}
                        </h2>
                        {program.programCode?.trim() ? (
                          <span className="font-mono text-xs text-muted-foreground">
                            {program.programCode.trim()}
                          </span>
                        ) : null}
                      </div>
                      {program.modules.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Không có module đang chờ.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {program.modules.map((module) => (
                            <li
                              key={module.moduleId}
                              className="flex flex-col gap-3 rounded-xl border border-border bg-background/60 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4"
                            >
                              <div className="min-w-0 space-y-1">
                                <p className="truncate text-sm font-semibold text-foreground">
                                  {moduleTitle(module)}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                  {module.moduleCode?.trim() ? (
                                    <span className="font-mono">
                                      {module.moduleCode.trim()}
                                    </span>
                                  ) : null}
                                  <Badge
                                    variant="outline"
                                    className="border-[#7CB342]/35 bg-[#7CB342]/15 text-[#3d5c22]"
                                  >
                                    <Users className="size-3" aria-hidden />
                                    {module.waitingCount} đang chờ
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="border-[#FDD835]/35 bg-[#FDD835]/20 text-[#8A7200]"
                                  >
                                    <CalendarDays
                                      className="size-3"
                                      aria-hidden
                                    />
                                    Lâu nhất {module.oldestWaitingDays} ngày
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                type="button"
                                className="h-10 shrink-0 rounded-xl"
                                onClick={() => {
                                  setMentorId(null);
                                  setStartDateLocal("");
                                  setCapacity("");
                                  setOpenTarget({ program, module });
                                }}
                              >
                                Mở lớp học lại
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pending" className="mt-0">
            <p className="mb-3 text-sm text-muted-foreground">
              Hàng đợi phụ: chỉ định lớp đích hoặc từ chối yêu cầu PendingManager
              khi không mở lớp mới từ danh sách chờ.
            </p>
            <ClassRedeliveryQueue embedded />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog
        open={openTarget != null}
        onOpenChange={(open) => !open && resetOpenDialog()}
      >
        <DialogPopup className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mở lớp học lại</DialogTitle>
            <DialogDescription>
              {openTarget
                ? `${moduleTitle(openTarget.module)} · ${programTitle(openTarget.program)} — ${openTarget.module.waitingCount} học viên đang chờ.`
                : "Chọn mentor và ngày bắt đầu để mở lớp học lại."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Mentor</Label>
              <Select
                value={mentorId ?? undefined}
                onValueChange={(value) => setMentorId(value)}
              >
                <SelectTrigger
                  className={cn(LIGHT_SELECT_TRIGGER, "h-11 w-full rounded-xl")}
                >
                  <span className="truncate">
                    {isMentorsLoading
                      ? "Đang tải mentor…"
                      : mentorId
                        ? mentorLabel(
                            mentors.find((item) => item.id === mentorId) ?? {
                              fullName: null,
                              email: null,
                              code: null,
                            },
                          )
                        : "Chọn mentor"}
                  </span>
                </SelectTrigger>
                <SelectContent className={LIGHT_SELECT_CONTENT}>
                  {mentors.map((mentor) => (
                    <SelectItem
                      key={mentor.id}
                      value={mentor.id}
                      className={LIGHT_SELECT_ITEM}
                    >
                      {mentorLabel(mentor)}
                      {mentor.code?.trim() ? (
                        <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                          {mentor.code.trim()}
                        </span>
                      ) : null}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="remedial-start">Ngày bắt đầu</Label>
              <Input
                id="remedial-start"
                type="datetime-local"
                value={startDateLocal}
                onChange={(event) => setStartDateLocal(event.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="remedial-capacity">Sĩ số (không bắt buộc)</Label>
              <Input
                id="remedial-capacity"
                type="number"
                min={1}
                placeholder="Theo mặc định hệ thống"
                value={capacity}
                onChange={(event) => setCapacity(event.target.value)}
                className={cn(INPUT_CLASS, "font-mono")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={resetOpenDialog}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="button"
              disabled={!canSubmit || isSubmitting}
              onClick={() => void handleOpenRemedial()}
            >
              {isSubmitting ? "Đang mở…" : "Mở lớp"}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
