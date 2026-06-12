"use client";

import { useCallback, useState } from "react";

import {
  ExpertProfileContent,
  ExpertProfilePreview,
  ExpertProfileSkeleton,
} from "@/components/experts/expert-profile-content";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useClientFetch } from "@/hooks/use-client-fetch";
import type { ProgramExpert } from "@/lib/api/entities/expert";
import { getExpertById } from "@/lib/api/experts";
import { showAppErrorFromUnknown } from "@/lib/errors";
import { getExpertAvatarUrl, getProgramExpertId } from "@/lib/programs/format";

type ExpertProfileDialogProps = {
  expertId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentProgramId?: string;
  preview?: ProgramExpert | null;
};

export function ExpertProfileDialog({
  expertId,
  open,
  onOpenChange,
  currentProgramId,
  preview,
}: ExpertProfileDialogProps) {
  const { data, isLoading, hasError, retry } = useClientFetch({
    enabled: open && expertId != null,
    fetcher: async () => {
      if (!expertId) return null;
      const result = await getExpertById(expertId);
      return result?.data ?? null;
    },
    deps: [open, expertId],
    onError: (error) => showAppErrorFromUnknown(error, "programs.expert"),
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
      <DialogPopup className="flex max-h-[min(88vh,640px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <div className="relative shrink-0 border-b border-[#E5E5E0] px-6 pb-4 pt-6">
          <DialogClose className="top-4 right-4" />
          <DialogTitle>Thông tin chuyên gia</DialogTitle>
          <DialogDescription className="sr-only">
            Chi tiết chuyên gia, tiểu sử và chương trình tham gia.
          </DialogDescription>
        </div>

        <ScrollArea className="h-[min(520px,calc(88vh-5.75rem))]">
          <div className="px-6 py-4">
            {hasError ? (
              <div className="py-8 text-center">
                <p className="text-sm text-[#6B6B6B]">
                  Không tải được thông tin chuyên gia.
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
            ) : isLoading && (!data || data.id !== expertId) ? (
              preview ? (
                <div className="space-y-3">
                  <ExpertProfilePreview
                    fullName={preview.fullName}
                    title={preview.title}
                    organization={preview.organization}
                    avatarUrl={previewAvatarUrl}
                    code={preview.code}
                  />
                  <ExpertProfileSkeleton />
                </div>
              ) : (
                <ExpertProfileSkeleton />
              )
            ) : data && data.id === expertId ? (
              <ExpertProfileContent
                expert={data}
                currentProgramId={currentProgramId}
              />
            ) : null}
          </div>
        </ScrollArea>
      </DialogPopup>
    </Dialog>
  );
}

export type ExpertDialogSelection = {
  expertId: string;
  preview: ProgramExpert;
};

export function useExpertProfileDialog() {
  const [selection, setSelection] = useState<ExpertDialogSelection | null>(
    null,
  );

  const openExpert = useCallback((expert: ProgramExpert) => {
    const expertId = getProgramExpertId(expert);
    if (!expertId) return;

    setSelection({ expertId, preview: expert });
  }, []);

  const closeExpert = useCallback(() => {
    setSelection(null);
  }, []);

  return {
    selection,
    openExpert,
    closeExpert,
    isOpen: selection != null,
  };
}
