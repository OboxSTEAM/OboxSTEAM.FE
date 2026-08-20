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
  DialogScrollBody,
  DialogScrollHeader,
  DialogScrollPopup,
  DialogTitle,
} from "@/components/ui/dialog";
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
      <DialogScrollPopup className="max-h-[min(92dvh,52rem)] sm:max-w-4xl">
        <DialogScrollHeader className="px-7">
          <DialogClose />
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Hội đồng chuyên gia
          </p>
          <DialogTitle className="mt-1 text-lg font-semibold tracking-tight">
            Hồ sơ học thuật
          </DialogTitle>
          <DialogDescription className="sr-only">
            Hồ sơ học thuật của chuyên gia: giới thiệu, học vấn, công bố và hội đồng
            chương trình.
          </DialogDescription>
        </DialogScrollHeader>

        <DialogScrollBody className="bg-[#FAFAF5] px-7 py-6 dark:bg-background">
          {hasError ? (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground">
                Không tải được hồ sơ chuyên gia.
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
              <div className="space-y-8">
                <ExpertProfilePreview
                  fullName={preview.fullName}
                  title={preview.title}
                  organization={preview.organization}
                  avatarUrl={previewAvatarUrl}
                  code={preview.code}
                />
                <ExpertProfileSkeleton hideIdentity />
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
        </DialogScrollBody>
      </DialogScrollPopup>
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
