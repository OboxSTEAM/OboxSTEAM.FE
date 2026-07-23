"use client";

import { useCallback, useState } from "react";

import {
  MentorProfileContent,
  MentorProfilePreview,
  MentorProfileSkeleton,
} from "@/components/mentors/mentor-profile-content";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { useClientFetch } from "@/hooks/use-client-fetch";
import type { ClassMentorSummary, Mentor } from "@/lib/api/entities/mentor";
import type { SkillSummary } from "@/lib/api/entities/skill";
import { getMentorById } from "@/lib/api/mentors";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { getExpertAvatarUrl } from "@/lib/programs/format";

export type MentorDialogPreview = {
  fullName?: string | null;
  title?: string | null;
  organization?: string | null;
  code?: string | null;
  status?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
};

type MentorProfileDialogProps = {
  mentorId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preview?: MentorDialogPreview | Pick<
    Mentor | ClassMentorSummary,
    "fullName" | "title" | "organization" | "avatarUrl"
  > & { code?: string | null } | null;
  requiredSkills?: SkillSummary[];
  requestMessage?: string | null;
};

export function MentorProfileDialog({
  mentorId,
  open,
  onOpenChange,
  preview,
  requiredSkills = [],
  requestMessage,
}: MentorProfileDialogProps) {
  const { data, isLoading, hasError, retry } = useClientFetch({
    enabled: open && mentorId != null,
    fetcher: async () => {
      if (!mentorId) return null;
      const result = await getMentorById(mentorId);
      return result?.data ?? null;
    },
    deps: [open, mentorId],
    onError: (error) => showAppErrorFromUnknown(error, "mentors.detail"),
  });

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      onOpenChange(nextOpen);
    },
    [onOpenChange],
  );

  const previewAvatarUrl = preview
    ? getExpertAvatarUrl(preview.avatarUrl)
    : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPopup className="flex max-h-[min(90vh,44rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <div className="relative shrink-0 border-b border-[#E5E5E0] px-7 pb-4 pt-5">
          <DialogClose className="top-4 right-4" />
          <DialogTitle className="text-lg">Thông tin mentor</DialogTitle>
          <DialogDescription className="sr-only">
            Chi tiết mentor, tiểu sử, thành tựu và kỹ năng.
          </DialogDescription>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-7 py-5">
          {hasError ? (
            <div className="py-6 text-center">
              <p className="text-sm text-[#6B6B6B]">
                Không tải được thông tin mentor.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={retry}
              >
                Thử lại
              </Button>
            </div>
          ) : isLoading && (!data || data.id !== mentorId) ? (
            preview ? (
              <div className="space-y-4">
                <MentorProfilePreview
                  fullName={preview.fullName?.trim() || "Mentor"}
                  title={"title" in preview ? preview.title?.trim() || "" : ""}
                  organization={
                    "organization" in preview
                      ? preview.organization?.trim() || ""
                      : ""
                  }
                  avatarUrl={previewAvatarUrl}
                  code={preview.code}
                />
                <MentorProfileSkeleton />
              </div>
            ) : (
              <MentorProfileSkeleton />
            )
          ) : data && data.id === mentorId ? (
            <MentorProfileContent
              mentor={data}
              requiredSkills={requiredSkills}
              requestMessage={requestMessage}
            />
          ) : null}
        </div>
      </DialogPopup>
    </Dialog>
  );
}

export type MentorDialogSelection = {
  mentorId: string;
  preview?: MentorDialogPreview;
  requestMessage?: string | null;
};

export function useMentorProfileDialog() {
  const [selection, setSelection] = useState<MentorDialogSelection | null>(
    null,
  );

  const openMentor = useCallback(
    (
      mentorId: string,
      options?: {
        preview?: MentorDialogPreview;
        requestMessage?: string | null;
      },
    ) => {
      if (!mentorId) return;
      setSelection({
        mentorId,
        preview: options?.preview,
        requestMessage: options?.requestMessage,
      });
    },
    [],
  );

  const closeMentor = useCallback(() => {
    setSelection(null);
  }, []);

  return {
    selection,
    openMentor,
    closeMentor,
    isOpen: selection != null,
  };
}
