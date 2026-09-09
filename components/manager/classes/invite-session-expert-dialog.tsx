"use client";

import { useState } from "react";
import { TriangleAlert, UserPlus, Users } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  getClassSessionExperts,
  getProgramById,
  inviteClassSessionExpert,
  withdrawClassSessionExpert,
  type ClassSession,
  type ClassSessionExpertStatus,
} from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { getExpertAvatarUrl, getExpertInitials } from "@/lib/programs/format";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<ClassSessionExpertStatus, string> = {
  Invited: "Chờ phản hồi",
  Accepted: "Đã nhận lời",
  Declined: "Đã từ chối",
};

const STATUS_TONE: Record<ClassSessionExpertStatus, string> = {
  Invited: "bg-[#FDD835]/25 text-[#725D00] dark:text-[#fde047]",
  Accepted: "bg-[#7CB342]/15 text-[#33691e] dark:text-[#a5d66f]",
  Declined: "bg-muted text-muted-foreground",
};

type InviteSessionExpertDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  session: ClassSession | null;
  programId: string | undefined;
};

export function InviteSessionExpertDialog({
  isOpen,
  onOpenChange,
  session,
  programId,
}: InviteSessionExpertDialogProps) {
  const [busyExpertId, setBusyExpertId] = useState<string | null>(null);
  const sessionId = session?.id ?? "";

  const { data: programData, isLoading: isProgramLoading } = useClientFetch({
    enabled: isOpen && !!programId,
    fetcher: () => getProgramById(programId as string),
    deps: [isOpen, programId],
    onError: (error) => showAppErrorFromUnknown(error, "programs.detail"),
  });

  const {
    data: invitesData,
    isLoading: isInvitesLoading,
    retry,
  } = useClientFetch({
    enabled: isOpen && sessionId !== "",
    fetcher: () =>
      getClassSessionExperts({ sessionId, page: 1, pageSize: 100 }),
    deps: [isOpen, sessionId],
    onError: (error) => showAppErrorFromUnknown(error, "coteach.list"),
  });

  const boardExperts = programData?.data?.experts ?? [];
  const invites = invitesData?.data?.items ?? [];
  const isLoading = isProgramLoading || isInvitesLoading;

  async function handleInvite(expertId: string, expertName: string) {
    if (!sessionId) return;
    setBusyExpertId(expertId);
    try {
      const result = await inviteClassSessionExpert({
        classSessionId: sessionId,
        expertId,
      });
      const warning = result?.data?.scheduleConflictWarning;
      showAppSuccess({
        title: "Đã gửi lời mời đồng hành",
        description:
          warning ||
          `${expertName} sẽ nhận thông báo và phản hồi trong mục Lịch đồng hành.`,
      });
      retry();
    } catch (error) {
      showAppErrorFromUnknown(error, "coteach.invite");
    } finally {
      setBusyExpertId(null);
    }
  }

  async function handleWithdraw(inviteId: string, expertId: string) {
    setBusyExpertId(expertId);
    try {
      await withdrawClassSessionExpert(inviteId);
      showAppSuccess({ title: "Đã thu hồi lời mời" });
      retry();
    } catch (error) {
      showAppErrorFromUnknown(error, "coteach.withdraw");
    } finally {
      setBusyExpertId(null);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-[560px] gap-5">
        <DialogClose />

        <DialogHeader className="gap-1.5">
          <DialogTitle>Mời chuyên gia đồng hành</DialogTitle>
          <DialogDescription>
            {session
              ? `Buổi “${session.title || "ngoại khóa"}” · chọn chuyên gia trong hội đồng chương trình.`
              : "Chọn chuyên gia trong hội đồng chương trình."}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : boardExperts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-8 text-center">
            <Users className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Chương trình chưa có chuyên gia trong hội đồng. Thêm chuyên gia ở
              trang chi tiết chương trình trước khi mời.
            </p>
          </div>
        ) : (
          <ul className="max-h-[22rem] space-y-2 overflow-y-auto pr-1">
            {boardExperts.map((expert) => {
              const invite = invites.find(
                (item) => item.expertId === expert.expertId,
              );
              const isBusy = busyExpertId === expert.expertId;

              return (
                <li
                  key={expert.expertId}
                  className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-3"
                >
                  <Avatar className="size-10 shrink-0">
                    <AvatarImage
                      src={getExpertAvatarUrl(expert.avatarUrl) ?? undefined}
                      alt={expert.fullName || "Chuyên gia"}
                    />
                    <AvatarFallback className="bg-muted text-xs font-bold text-foreground">
                      {getExpertInitials(expert.fullName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {expert.fullName || "Chuyên gia"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {expert.roleInBoard || expert.title || expert.organization || "—"}
                    </p>
                    {invite?.scheduleConflictWarning ? (
                      <p className="mt-1 flex items-start gap-1 text-[11px] font-medium text-[#725D00] dark:text-[#fde047]">
                        <TriangleAlert className="mt-px size-3 shrink-0" />
                        {invite.scheduleConflictWarning}
                      </p>
                    ) : null}
                  </div>

                  {invite ? (
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge
                        className={cn(
                          "rounded-md text-[11px] font-semibold",
                          STATUS_TONE[invite.status],
                        )}
                      >
                        {STATUS_LABEL[invite.status]}
                      </Badge>
                      {invite.status !== "Accepted" ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isBusy}
                          onClick={() =>
                            void handleWithdraw(invite.id, expert.expertId)
                          }
                          className="h-9 rounded-lg px-3 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          Thu hồi
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isBusy}
                      onClick={() =>
                        void handleInvite(
                          expert.expertId,
                          expert.fullName || "Chuyên gia",
                        )
                      }
                      className="h-9 shrink-0 gap-1.5 rounded-lg border-border px-3 text-xs font-semibold"
                    >
                      <UserPlus className="size-3.5" />
                      Mời
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </DialogPopup>
    </Dialog>
  );
}
