"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FileArchive,
  FileText,
  FileUp,
  Loader2,
  Music,
  Trash2,
  Upload,
} from "lucide-react";

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
import { Skeleton } from "@/components/ui/skeleton";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  getAssignmentById,
  getModuleEnrollmentResearchMilestoneProgress,
  getResearchSubmissionById,
  submitResearchSubmission,
  uploadResearchSubmissionFile,
  type AssignmentDetail,
  type EnrollmentCurriculum,
  type ResearchSubmission,
  type ResearchSubmissionStatus,
  type StudentMilestoneItemProgress,
} from "@/lib/api";
import {
  getAssignmentBreadcrumb,
  isAssignmentSelectable,
  type FlatCurriculumAssignment,
} from "@/lib/curriculum/assignment-helpers";
import { formatAssignmentTimestamp } from "@/lib/curriculum/assignment-outcome";
import {
  buildResearchGradedOutcome,
  buildResearchPendingOutcome,
  buildResearchRevisionOutcome,
} from "@/lib/curriculum/build-assignment-outcome";
import {
  ASSIGNMENT_TYPE_LABELS,
  RESEARCH_EVIDENCE_ACCEPT,
  RESEARCH_UPLOAD_ACCEPT,
  RESEARCH_UPLOAD_MAX_BYTES,
  RESEARCH_UPLOAD_MAX_EVIDENCE,
} from "@/lib/curriculum/constants";
import {
  researchFileTypeLabel,
  resolveResearchPreviewKind,
} from "@/lib/curriculum/research-file-preview";
import {
  clearStoredResearchStaging,
  fileNameFromUrl,
  getStoredResearchStaging,
  migrateResearchStagingKey,
  researchDraftStorageKey,
  setStoredResearchStaging,
  type ResearchStagingEvidence,
  type ResearchStagingState,
} from "@/lib/curriculum/research-staging-storage";
import { AssignmentRecoveryActions } from "@/components/curriculum/recovery";
import {
  getEffectiveMaxAttempts,
  hasAttemptsRemaining,
} from "@/lib/curriculum/recovery-decision";
import { useMyRecoveryRequests } from "@/hooks/use-my-recovery-requests";
import { showAppErrorFromUnknown, showAppSuccess, localizeUserFacingMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

import {
  AssignmentPendingCard,
  AssignmentResultCard,
  AssignmentRevisionCard,
  AttemptQuotaPill,
} from "./assignment-outcome";

type ResearchSubmissionPanelProps = {
  curriculum: EnrollmentCurriculum;
  assignmentId: string;
  flatAssignment: FlatCurriculumAssignment;
  onCurriculumRefresh: () => Promise<void>;
  programName?: string | null;
  programPrice?: number | null;
  completedModuleCount?: number;
};

type UploadTarget = "primary" | "evidence";

/** Legacy progress reason — mentor open step was removed. */
const MENTOR_OPEN_BLOCK_REASON = "Mentor has not opened submission yet.";

function isEditableStatus(status: ResearchSubmissionStatus): boolean {
  return status === "Pending" || status === "ReturnedForRevision";
}

function resolveDraftStaging(
  moduleEnrollmentId: string,
  researchMilestoneId: string,
): ResearchStagingState {
  const stored = getStoredResearchStaging(
    researchDraftStorageKey(moduleEnrollmentId, researchMilestoneId),
  );
  if (stored && (stored.fileUrl || stored.evidence.length > 0 || stored.contentText.trim())) {
    return stored;
  }
  return emptyStaging();
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function emptyStaging(): ResearchStagingState {
  return {
    contentText: "",
    fileUrl: null,
    fileName: null,
    evidence: [],
  };
}

function stagingFromSubmission(submission: ResearchSubmission): ResearchStagingState {
  const evidenceUrls = submission.evidenceUrls ?? [];
  const evidenceMediaAssetIds = submission.evidenceMediaAssetIds ?? [];
  const evidence: ResearchStagingEvidence[] = [];

  for (let index = 0; index < evidenceMediaAssetIds.length; index += 1) {
    const mediaAssetId = evidenceMediaAssetIds[index]?.trim();
    if (!mediaAssetId) continue;
    const url = evidenceUrls[index]?.trim() ?? "";
    evidence.push({
      mediaAssetId,
      url,
      name: url ? fileNameFromUrl(url) : `minh-chung-${index + 1}`,
    });
  }

  return {
    contentText: submission.contentText ?? "",
    fileUrl: submission.fileUrl,
    fileName: submission.fileUrl ? fileNameFromUrl(submission.fileUrl) : null,
    evidence,
  };
}

function isAllowedEvidenceFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    name.endsWith(".mp4") ||
    name.endsWith(".mov")
  );
}

function resolveInitialStaging(
  submission: ResearchSubmission,
  draftKey?: string,
): ResearchStagingState {
  const stored =
    getStoredResearchStaging(submission.id) ??
    (draftKey ? getStoredResearchStaging(draftKey) : null);
  if (stored && (stored.fileUrl || stored.evidence.length > 0 || stored.contentText.trim())) {
    return stored;
  }
  if (isEditableStatus(submission.status)) {
    return stagingFromSubmission(submission);
  }
  return emptyStaging();
}

function DropZone({
  label,
  hint,
  disabled,
  isDragging,
  isUploading,
  onBrowse,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
}: {
  label: string;
  hint: string;
  disabled: boolean;
  isDragging: boolean;
  isUploading: boolean;
  onBrowse: () => void;
  onDragEnter: (event: React.DragEvent) => void;
  onDragLeave: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => {
        if (!disabled) onBrowse();
      }}
      onKeyDown={(event) => {
        if (disabled) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onBrowse();
        }
      }}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        "flex min-h-[4.5rem] cursor-pointer items-center gap-3 rounded-lg border border-dashed px-3 py-2.5 text-left transition-colors",
        disabled && "cursor-not-allowed opacity-60",
        isDragging
          ? "border-learn-accent bg-learn-accent/5"
          : "border-learn-border bg-learn-bg hover:border-learn-accent/45 hover:bg-learn-surface-2/50",
      )}
    >
      {isUploading ? (
        <Loader2 className="size-4 shrink-0 animate-spin text-learn-accent" aria-hidden />
      ) : (
        <Upload
          className={cn(
            "size-4 shrink-0",
            isDragging ? "text-learn-accent" : "text-learn-faint",
          )}
          aria-hidden
        />
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-learn-text-strong">
          {isUploading ? "Đang tải lên…" : label}
        </p>
        <p className="truncate text-[11px] text-learn-muted">{hint}</p>
      </div>
    </div>
  );
}

function FilePreviewMedia({
  url,
  name,
  size = "md",
}: {
  url: string;
  name: string;
  size?: "sm" | "md" | "tile";
}) {
  const kind = resolveResearchPreviewKind(name, url);
  const frameClass =
    size === "tile"
      ? "aspect-square w-full overflow-hidden rounded-none bg-learn-surface-2"
      : size === "sm"
        ? "h-12 w-12 shrink-0 overflow-hidden rounded-md border border-learn-border bg-learn-surface-2"
        : "h-[4.25rem] w-[4.25rem] shrink-0 overflow-hidden rounded-lg border border-learn-border bg-learn-surface-2";

  if (kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote S3 submission URLs
      <img
        src={url}
        alt={name}
        className={cn(frameClass, "object-cover object-center")}
        loading="lazy"
      />
    );
  }

  if (kind === "pdf") {
    return (
      <div className={cn(frameClass, "relative flex items-center justify-center bg-white")}>
        <iframe
          src={`${url}#page=1&view=FitH`}
          title={name}
          className="pointer-events-none absolute inset-0 h-[240%] w-full origin-top scale-[0.42]"
          tabIndex={-1}
        />
        <FileText className="relative size-5 text-learn-faint/30" aria-hidden />
      </div>
    );
  }

  if (kind === "video") {
    return (
      <video
        src={url}
        muted
        playsInline
        preload="metadata"
        className={cn(frameClass, "object-cover")}
      />
    );
  }

  const Icon =
    kind === "audio" ? Music : name.toLowerCase().match(/\.(zip|rar|7z)$/) ? FileArchive : FileText;

  return (
    <div className={cn(frameClass, "flex items-center justify-center")}>
      <Icon className={cn("text-learn-faint", size === "tile" ? "size-6" : "size-5")} aria-hidden />
    </div>
  );
}

function StagedPrimaryCard({
  url,
  name,
  onRemove,
  onReplace,
  disabled,
}: {
  url: string;
  name: string;
  onRemove?: () => void;
  onReplace?: () => void;
  disabled?: boolean;
}) {
  const kind = resolveResearchPreviewKind(name, url);
  const typeLabel = researchFileTypeLabel(kind, name);

  return (
    <div className="flex gap-2.5 rounded-lg border border-learn-border bg-learn-surface p-2">
      <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0">
        <FilePreviewMedia url={url} name={name} size="md" />
      </a>
      <div className="min-w-0 flex-1 py-0.5">
        <p className="truncate text-sm font-medium text-learn-text-strong" title={name}>
          {name}
        </p>
        <p className="mt-0.5 text-[11px] uppercase tracking-wide text-learn-faint">{typeLabel}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2.5">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-medium text-learn-accent underline-offset-2 hover:underline"
          >
            Mở
          </a>
          {onReplace ? (
            <button
              type="button"
              className="text-[11px] font-medium text-learn-accent underline-offset-2 hover:underline disabled:opacity-50"
              disabled={disabled}
              onClick={onReplace}
            >
              Thay thế
            </button>
          ) : null}
        </div>
      </div>
      {onRemove ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="size-7 shrink-0 self-start p-0 text-learn-muted hover:text-learn-primary"
          onClick={onRemove}
          disabled={disabled}
          aria-label={`Xóa ${name}`}
        >
          <Trash2 className="size-3.5" />
        </Button>
      ) : null}
    </div>
  );
}

function EvidenceTile({
  url,
  name,
  onRemove,
  disabled,
}: {
  url: string;
  name: string;
  onRemove?: () => void;
  disabled?: boolean;
}) {
  const preview = (
    <>
      <div className="aspect-square w-full overflow-hidden bg-learn-surface-2">
        {url ? (
          <FilePreviewMedia url={url} name={name} size="tile" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <FileText className="size-5 text-learn-faint" aria-hidden />
          </div>
        )}
      </div>
      <p
        className="truncate border-t border-learn-border/70 px-1.5 py-1 text-[10px] font-medium leading-tight text-learn-text-strong"
        title={name}
      >
        {name}
      </p>
    </>
  );

  return (
    <div className="group relative w-[5.5rem] shrink-0 overflow-hidden rounded-md border border-learn-border bg-learn-surface">
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="block">
          {preview}
        </a>
      ) : (
        <div className="block">{preview}</div>
      )}
      {onRemove ? (
        <button
          type="button"
          className={cn(
            "absolute right-1 top-1 flex size-5 items-center justify-center rounded-full",
            "bg-learn-surface/95 text-learn-muted shadow-sm",
            "opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100",
            "hover:text-learn-primary disabled:opacity-50",
          )}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onRemove();
          }}
          disabled={disabled}
          aria-label={`Xóa ${name}`}
        >
          <Trash2 className="size-3" />
        </button>
      ) : null}
    </div>
  );
}

function ResearchSubmissionPanelSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-learn-border bg-learn-surface p-4 shadow-[0_4px_20px_rgba(45,45,45,0.04)] sm:p-5">
      <Skeleton className="h-3 w-40 bg-learn-surface-2" />
      <Skeleton className="mt-2 h-7 w-2/3 bg-learn-surface-2" />
      <Skeleton className="mt-4 h-24 w-full rounded-xl bg-learn-surface-2" />
    </div>
  );
}

export function ResearchSubmissionPanel({
  curriculum,
  assignmentId,
  flatAssignment,
  onCurriculumRefresh,
  programName,
  programPrice,
  completedModuleCount,
}: ResearchSubmissionPanelProps) {
  const primaryInputRef = useRef<HTMLInputElement>(null);
  const evidenceInputRef = useRef<HTMLInputElement>(null);
  const primaryDragDepthRef = useRef(0);
  const evidenceDragDepthRef = useRef(0);

  const [submission, setSubmission] = useState<ResearchSubmission | null>(null);
  const [localSubmissionId, setLocalSubmissionId] = useState<string | null>(null);
  const [staging, setStaging] = useState<ResearchStagingState>(emptyStaging);
  const [isPrimaryDragging, setIsPrimaryDragging] = useState(false);
  const [isEvidenceDragging, setIsEvidenceDragging] = useState(false);
  const [uploadingTarget, setUploadingTarget] = useState<UploadTarget | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  /** Ignore graded progress submission while student starts a free retry. */
  const [isRetaking, setIsRetaking] = useState(false);
  /** Attempt number of the failed submission that seeded this retake. */
  const [retakeFromAttempt, setRetakeFromAttempt] = useState<number | null>(null);
  const stagingRef = useRef(staging);
  stagingRef.current = staging;

  const breadcrumb = useMemo(
    () => getAssignmentBreadcrumb(curriculum, assignmentId),
    [assignmentId, curriculum],
  );

  const {
    recoveryRequests,
    redeliveryRequests,
    refresh: refreshRecoveryRequests,
  } = useMyRecoveryRequests(true);

  const moduleEnrollmentId = useMemo(() => {
    return (
      curriculum.modules.find((module) => module.moduleId === flatAssignment.moduleId)
        ?.moduleEnrollmentId ?? null
    );
  }, [curriculum.modules, flatAssignment.moduleId]);

  const milestoneId = flatAssignment.milestoneId;

  const draftStorageKey =
    moduleEnrollmentId && milestoneId
      ? researchDraftStorageKey(moduleEnrollmentId, milestoneId)
      : null;

  const resetLocal = useCallback(() => {
    setSubmission(null);
    setLocalSubmissionId(null);
    setStaging(emptyStaging());
    setIsPrimaryDragging(false);
    setIsEvidenceDragging(false);
    setUploadingTarget(null);
    setIsSubmitting(false);
    setIsConfirmOpen(false);
    setIsRetaking(false);
    setRetakeFromAttempt(null);
    primaryDragDepthRef.current = 0;
    evidenceDragDepthRef.current = 0;
  }, []);

  useEffect(() => {
    resetLocal();
  }, [assignmentId, resetLocal]);

  const persistStaging = useCallback(
    (storageKey: string, updater: (prev: ResearchStagingState) => ResearchStagingState) => {
      setStaging((prev) => {
        const next = updater(prev);
        setStoredResearchStaging(storageKey, next);
        return next;
      });
    },
    [],
  );

  const {
    data: assignmentResult,
    isLoading: isAssignmentLoading,
    hasError: assignmentError,
    retry: retryAssignment,
  } = useClientFetch({
    enabled: isAssignmentSelectable(flatAssignment.status) && Boolean(milestoneId),
    fetcher: async () => getAssignmentById(assignmentId),
    deps: [assignmentId],
    onError: (error) => {
      showAppErrorFromUnknown(error, "generic");
    },
  });

  const assignment: AssignmentDetail | null = assignmentResult?.data ?? null;

  const {
    data: progressResult,
    isLoading: isProgressLoading,
    hasError: progressError,
    retry: retryProgress,
  } = useClientFetch({
    enabled:
      isAssignmentSelectable(flatAssignment.status) &&
      Boolean(moduleEnrollmentId) &&
      Boolean(milestoneId),
    fetcher: async () => {
      if (!moduleEnrollmentId) {
        throw new Error("Thiếu module enrollment.");
      }
      return getModuleEnrollmentResearchMilestoneProgress(moduleEnrollmentId);
    },
    deps: [moduleEnrollmentId],
    onError: (error) => {
      showAppErrorFromUnknown(error, "generic");
    },
  });

  const milestoneProgress: StudentMilestoneItemProgress | null = useMemo(() => {
    const milestones = progressResult?.data?.milestones ?? [];
    if (!milestoneId) return null;
    return milestones.find((item) => item.milestoneId === milestoneId) ?? null;
  }, [milestoneId, progressResult?.data?.milestones]);

  const progressSubmissionId = isRetaking
    ? localSubmissionId
    : (milestoneProgress?.submissionId ?? localSubmissionId);

  const {
    data: submissionResult,
    isLoading: isSubmissionLoading,
    hasError: submissionError,
    retry: retrySubmission,
  } = useClientFetch({
    enabled: Boolean(progressSubmissionId),
    fetcher: async () => {
      if (!progressSubmissionId) {
        throw new Error("Thiếu submission id.");
      }
      return getResearchSubmissionById(progressSubmissionId);
    },
    deps: [progressSubmissionId],
    onError: (error) => {
      showAppErrorFromUnknown(error, "generic");
    },
  });

  useEffect(() => {
    const next = submissionResult?.data ?? null;
    if (!next) return;
    setSubmission(next);
    setLocalSubmissionId(next.id);
    if (isEditableStatus(next.status)) {
      setIsRetaking(false);
      setRetakeFromAttempt(null);
      setStaging(resolveInitialStaging(next, draftStorageKey ?? undefined));
      if (draftStorageKey) {
        migrateResearchStagingKey(draftStorageKey, next.id);
      }
    } else {
      setStaging(stagingFromSubmission(next));
    }
  }, [draftStorageKey, submissionResult?.data]);

  // Draft mode: canSubmit / unlocked with no submission yet.
  // Retake seeds staging from the failed attempt in handleRetry — do not clobber.
  useEffect(() => {
    if (submission || progressSubmissionId) return;
    if (!moduleEnrollmentId || !milestoneId) return;
    if (isRetaking) return;
    if (!(milestoneProgress?.isUnlocked || milestoneProgress?.canSubmit)) {
      return;
    }
    setStaging(resolveDraftStaging(moduleEnrollmentId, milestoneId));
  }, [
    isRetaking,
    milestoneId,
    milestoneProgress?.canSubmit,
    milestoneProgress?.isUnlocked,
    moduleEnrollmentId,
    progressSubmissionId,
    submission,
  ]);

  const isUnlocked = milestoneProgress?.isUnlocked ?? false;
  const canSubmitProgress = milestoneProgress?.canSubmit ?? false;
  const isEditable = submission
    ? isEditableStatus(submission.status)
    : isRetaking || isUnlocked || canSubmitProgress;
  const stagingKey = submission?.id ?? draftStorageKey;
  const blockReasons =
    milestoneProgress?.submitBlockReasons
      ?.filter(Boolean)
      .filter((reason) => reason !== MENTOR_OPEN_BLOCK_REASON)
      .map((reason) =>
        localizeUserFacingMessage(
          reason,
          "Chưa đủ điều kiện để nộp mốc này.",
        ),
      ) ?? [];
  const requiredActivities = milestoneProgress?.requiredActivities ?? [];

  const validateFile = useCallback((file: File): boolean => {
    if (file.size > RESEARCH_UPLOAD_MAX_BYTES) {
      showAppErrorFromUnknown(
        new Error(`Tệp vượt quá ${formatFileSize(RESEARCH_UPLOAD_MAX_BYTES)}.`),
        "research.upload",
      );
      return false;
    }
    return true;
  }, []);

  const validateEvidenceFile = useCallback((file: File): boolean => {
    if (!validateFile(file)) return false;
    if (!isAllowedEvidenceFile(file)) {
      showAppErrorFromUnknown(
        new Error("Minh chứng chỉ nhận JPG, PNG, MP4 hoặc MOV."),
        "research.upload",
      );
      return false;
    }
    return true;
  }, [validateFile]);

  const uploadFiles = useCallback(
    async (files: FileList | File[], target: UploadTarget) => {
      if (
        !isEditable ||
        uploadingTarget ||
        !moduleEnrollmentId ||
        !milestoneId ||
        !stagingKey
      ) {
        return;
      }

      const list = Array.from(files);
      if (list.length === 0) return;

      if (target === "primary") {
        const file = list[0];
        if (!file || !validateFile(file)) return;

        setUploadingTarget("primary");
        try {
          const result = await uploadResearchSubmissionFile(file, {
            moduleEnrollmentId,
            researchMilestoneId: milestoneId,
            isEvidence: false,
          });
          const payload = result?.data;
          const fileUrl = payload?.fileUrl;
          const createdSubmissionId = payload?.submissionId;
          if (!fileUrl || !createdSubmissionId) {
            throw new Error("Phản hồi tải lên thiếu đường dẫn tệp.");
          }

          if (draftStorageKey && createdSubmissionId !== stagingKey) {
            migrateResearchStagingKey(draftStorageKey, createdSubmissionId);
          }
          setLocalSubmissionId(createdSubmissionId);
          persistStaging(createdSubmissionId, (prev) => ({
            ...prev,
            fileUrl,
            fileName: file.name,
          }));
          showAppSuccess({
            title: "Đã tải tệp chính",
            description: "Tệp đang ở trạng thái chờ nộp.",
          });
        } catch (error) {
          showAppErrorFromUnknown(error, "research.upload");
        } finally {
          setUploadingTarget(null);
        }
        return;
      }

      const remaining =
        RESEARCH_UPLOAD_MAX_EVIDENCE - stagingRef.current.evidence.length;
      if (remaining <= 0) {
        showAppErrorFromUnknown(
          new Error(`Chỉ được tải tối đa ${RESEARCH_UPLOAD_MAX_EVIDENCE} minh chứng.`),
          "research.upload",
        );
        return;
      }

      const queued = list.slice(0, remaining).filter(validateEvidenceFile);
      if (queued.length === 0) return;

      setUploadingTarget("evidence");
      try {
        const added: ResearchStagingEvidence[] = [];
        let createdSubmissionId = submission?.id ?? localSubmissionId;
        for (const file of queued) {
          const result = await uploadResearchSubmissionFile(file, {
            moduleEnrollmentId,
            researchMilestoneId: milestoneId,
            isEvidence: true,
          });
          const payload = result?.data;
          const mediaAssetId = payload?.mediaAssetId?.trim();
          const urls = payload?.evidenceUrls?.filter(Boolean) ?? [];
          const url = urls[urls.length - 1] ?? "";
          if (!mediaAssetId || !payload?.submissionId) {
            throw new Error(`Không nhận được media asset cho ${file.name}.`);
          }
          createdSubmissionId = payload.submissionId;
          added.push({
            mediaAssetId,
            url,
            name: file.name,
          });
        }

        if (!createdSubmissionId) {
          throw new Error("Phản hồi tải lên thiếu submission id.");
        }

        if (draftStorageKey && createdSubmissionId !== stagingKey) {
          migrateResearchStagingKey(draftStorageKey, createdSubmissionId);
        }
        setLocalSubmissionId(createdSubmissionId);
        persistStaging(createdSubmissionId, (prev) => {
          const nextEvidence = [...prev.evidence];
          for (const item of added) {
            if (
              !nextEvidence.some(
                (existing) => existing.mediaAssetId === item.mediaAssetId,
              )
            ) {
              nextEvidence.push(item);
            }
          }
          return {
            ...prev,
            evidence: nextEvidence,
          };
        });
        showAppSuccess({
          title: "Đã tải minh chứng",
          description: `${added.length} tệp đã thêm vào danh sách chờ nộp.`,
        });
      } catch (error) {
        showAppErrorFromUnknown(error, "research.upload");
      } finally {
        setUploadingTarget(null);
      }
    },
    [
      draftStorageKey,
      isEditable,
      localSubmissionId,
      milestoneId,
      moduleEnrollmentId,
      persistStaging,
      stagingKey,
      submission?.id,
      uploadingTarget,
      validateEvidenceFile,
      validateFile,
    ],
  );

  const clearPrimary = useCallback(() => {
    if (!isEditable || !stagingKey) return;
    persistStaging(stagingKey, (prev) => ({
      ...prev,
      fileUrl: null,
      fileName: null,
    }));
  }, [isEditable, persistStaging, stagingKey]);

  const removeEvidence = useCallback(
    (mediaAssetId: string) => {
      if (!isEditable || !stagingKey) return;
      persistStaging(stagingKey, (prev) => ({
        ...prev,
        evidence: prev.evidence.filter(
          (item) => item.mediaAssetId !== mediaAssetId,
        ),
      }));
    },
    [isEditable, persistStaging, stagingKey],
  );

  const handleContentChange = useCallback(
    (value: string) => {
      if (!isEditable || !stagingKey) return;
      persistStaging(stagingKey, (prev) => ({
        ...prev,
        contentText: value,
      }));
    },
    [isEditable, persistStaging, stagingKey],
  );

  const performSubmit = useCallback(async () => {
    if (!isEditable || !moduleEnrollmentId || !milestoneId) return;

    const draft = stagingRef.current;
    const hasText = Boolean(draft.contentText.trim());
    const hasFile = Boolean(draft.fileUrl);
    const hasEvidence = draft.evidence.length > 0;

    if (!hasText && !hasFile && !hasEvidence) {
      showAppErrorFromUnknown(
        new Error("Cần ít nhất một trong: ghi chú, tệp chính, hoặc minh chứng."),
        "research.submit",
      );
      return;
    }

    if (!canSubmitProgress && !isRetaking) {
      showAppErrorFromUnknown(
        new Error(blockReasons[0] ?? "Chưa đủ điều kiện để nộp mốc này."),
        "research.submit",
      );
      return;
    }

    setIsConfirmOpen(false);
    setIsSubmitting(true);
    try {
      const result = await submitResearchSubmission({
        moduleEnrollmentId,
        researchMilestoneId: milestoneId,
        contentText: draft.contentText.trim() || null,
        fileUrl: draft.fileUrl,
        evidenceMediaAssetIds:
          draft.evidence.length > 0
            ? draft.evidence.map((item) => item.mediaAssetId)
            : null,
      });
      const submitted = result?.data;
      if (!submitted) {
        throw new Error("Phản hồi nộp bài thiếu dữ liệu.");
      }

      if (stagingKey) clearStoredResearchStaging(stagingKey);
      if (draftStorageKey) clearStoredResearchStaging(draftStorageKey);
      clearStoredResearchStaging(submitted.id);
      setLocalSubmissionId(submitted.id);
      setSubmission(submitted);
      setStaging(stagingFromSubmission(submitted));
      setIsRetaking(false);
      setRetakeFromAttempt(null);
      showAppSuccess({
        title: "Đã nộp bài nghiên cứu",
        description: "Mentor sẽ chấm điểm và phản hồi sớm.",
      });
      await onCurriculumRefresh();
    } catch (error) {
      showAppErrorFromUnknown(error, "research.submit");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    blockReasons,
    canSubmitProgress,
    draftStorageKey,
    isEditable,
    isRetaking,
    milestoneId,
    moduleEnrollmentId,
    onCurriculumRefresh,
    stagingKey,
  ]);

  const handleRetry = useCallback(() => {
    const previous = submission;
    const seeded = previous
      ? stagingFromSubmission(previous)
      : moduleEnrollmentId && milestoneId
        ? resolveDraftStaging(moduleEnrollmentId, milestoneId)
        : emptyStaging();

    setIsRetaking(true);
    setRetakeFromAttempt(previous?.attemptNumber ?? null);
    setSubmission(null);
    setLocalSubmissionId(null);
    setStaging(seeded);
    if (draftStorageKey) {
      setStoredResearchStaging(draftStorageKey, seeded);
    }
    setIsConfirmOpen(false);
  }, [draftStorageKey, milestoneId, moduleEnrollmentId, submission]);

  const makeDragHandlers = (
    target: UploadTarget,
    depthRef: React.MutableRefObject<number>,
    setDragging: (value: boolean) => void,
  ) => ({
    onDragEnter: (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (!isEditable || uploadingTarget) return;
      depthRef.current += 1;
      setDragging(true);
    },
    onDragLeave: (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      depthRef.current = Math.max(0, depthRef.current - 1);
      if (depthRef.current === 0) setDragging(false);
    },
    onDragOver: (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
    },
    onDrop: (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      depthRef.current = 0;
      setDragging(false);
      if (!isEditable || uploadingTarget) return;
      void uploadFiles(event.dataTransfer.files, target);
    },
  });

  if (!milestoneId) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-learn-border bg-learn-surface p-8 text-center shadow-[0_4px_20px_rgba(45,45,45,0.04)]">
        <p className="text-sm text-learn-muted">
          Bài nộp nghiên cứu chỉ khả dụng trong mốc nghiên cứu.
        </p>
      </div>
    );
  }

  if (!isAssignmentSelectable(flatAssignment.status)) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-learn-border bg-learn-surface p-8 text-center shadow-[0_4px_20px_rgba(45,45,45,0.04)]">
        <p className="text-sm text-learn-muted">
          Bài nộp này chưa mở khóa. Hoàn thành các hoạt động trước để tiếp tục.
        </p>
      </div>
    );
  }

  const isBootstrapping =
    (isAssignmentLoading && !assignment) ||
    (isProgressLoading && !progressResult) ||
    (Boolean(progressSubmissionId) && isSubmissionLoading && !submission);

  if (isBootstrapping) {
    return <ResearchSubmissionPanelSkeleton />;
  }

  if (
    (assignmentError && !assignment) ||
    (progressError && !progressResult) ||
    (submissionError && progressSubmissionId && !submission)
  ) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-learn-border bg-learn-surface p-8 text-center shadow-[0_4px_20px_rgba(45,45,45,0.04)]">
        <p className="text-sm text-learn-muted">Không tải được bài nộp nghiên cứu.</p>
        <Button
          type="button"
          variant="outline"
          className="mt-4 border-learn-border"
          onClick={() => {
            if (assignmentError) retryAssignment();
            if (progressError) retryProgress();
            if (submissionError) retrySubmission();
          }}
        >
          Thử lại
        </Button>
      </div>
    );
  }

  if (!assignment) {
    return <ResearchSubmissionPanelSkeleton />;
  }

  const description = assignment.description?.trim() || null;

  const submittedLabel = formatAssignmentTimestamp(submission?.submittedAt);
  const passScore = submission?.passScore ?? assignment.passScore;
  const maxPoints = submission?.maxPoints ?? assignment.maxPoints;
  const hasStagedContent =
    Boolean(staging.fileUrl) ||
    Boolean(staging.contentText.trim()) ||
    staging.evidence.length > 0;
  const canCommit =
    isEditable &&
    hasStagedContent &&
    (canSubmitProgress || isRetaking) &&
    !uploadingTarget &&
    !isSubmitting &&
    Boolean(moduleEnrollmentId) &&
    Boolean(milestoneId);

  const satisfiedCount = requiredActivities.filter((item) => item.isSatisfied).length;
  const requiredTotal = requiredActivities.length;
  const allActivitiesReady = requiredTotal === 0 || satisfiedCount === requiredTotal;

  const primaryDrag = makeDragHandlers("primary", primaryDragDepthRef, setIsPrimaryDragging);
  const evidenceDrag = makeDragHandlers("evidence", evidenceDragDepthRef, setIsEvidenceDragging);

  const recoveryEnrollmentId =
    flatAssignment.moduleEnrollmentId ||
    submission?.moduleEnrollmentId ||
    moduleEnrollmentId ||
    "";
  const effectiveMaxAttempts = getEffectiveMaxAttempts(
    assignment.maxAttempts,
    recoveryRequests,
    recoveryEnrollmentId,
    assignmentId,
  );
  const canRetryFailed =
    submission?.status === "Graded" &&
    submission.passed === false &&
    hasAttemptsRemaining(
      submission.attemptNumber,
      assignment.maxAttempts,
      recoveryRequests,
      recoveryEnrollmentId,
      assignmentId,
    );
  const attemptCurrent =
    submission?.attemptNumber ??
    (isRetaking ? retakeFromAttempt : null);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-learn-border bg-learn-surface shadow-[0_4px_20px_rgba(45,45,45,0.04)]">
      <div className="shrink-0 space-y-2 border-b border-learn-border/70 px-4 py-3 sm:px-5">
        {breadcrumb ? (
          <p className="text-xs text-learn-muted">
            {breadcrumb.moduleName}
            {breadcrumb.groupLabel ? ` · ${breadcrumb.groupLabel}` : null}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-heading min-w-0 flex-1 text-lg font-semibold text-learn-text-strong sm:text-xl">
            {assignment.title}
          </h1>
          <Badge variant="secondary" className="bg-learn-surface-2 text-learn-muted">
            {ASSIGNMENT_TYPE_LABELS.FileUpload}
          </Badge>
          {attemptCurrent != null ? (
            <AttemptQuotaPill
              attemptNumber={attemptCurrent}
              maxAttempts={effectiveMaxAttempts}
            />
          ) : null}
        </div>
        {description ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-learn-muted">{description}</p>
        ) : null}
        {requiredTotal > 0 || (!canSubmitProgress && blockReasons.length > 0) ? (
          <div className="flex flex-wrap items-center gap-2">
            {requiredTotal > 0 ? (
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tabular-nums",
                  allActivitiesReady
                    ? "bg-learn-success/15 text-learn-success"
                    : "bg-learn-surface-2 text-learn-muted",
                )}
              >
                {satisfiedCount}/{requiredTotal} hoạt động sẵn sàng
              </span>
            ) : null}
            {!canSubmitProgress && blockReasons[0] ? (
              <span className="text-[11px] text-learn-primary">{blockReasons[0]}</span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-3 sm:px-5">
        {!submission && milestoneProgress && !isUnlocked ? (
          <div className="rounded-lg border border-dashed border-learn-border bg-learn-surface-2/40 px-3 py-4 text-center">
            <FileUp className="mx-auto size-4 text-learn-faint" aria-hidden />
            <p className="mt-1.5 text-sm font-medium text-learn-text-strong">
              Mốc chưa mở khóa
            </p>
            <p className="mt-0.5 text-xs text-learn-muted">
              {localizeUserFacingMessage(
                milestoneProgress.unlockReason,
                "Hoàn thành điều kiện trước để nộp bài nghiên cứu.",
              )}
            </p>
          </div>
        ) : null}

        {isRetaking ? (
          <p className="text-xs text-learn-muted">
            Đang làm lại — tệp lần trước được giữ; xóa nếu muốn thay.
          </p>
        ) : null}

        {submission?.status === "TurnedIn" ? (
          <AssignmentPendingCard {...buildResearchPendingOutcome(submission)} />
        ) : null}

        {submission?.status === "ReturnedForRevision" ? (
          <AssignmentRevisionCard {...buildResearchRevisionOutcome(submission)} />
        ) : null}

        {submission?.status === "Graded" ? (
          <AssignmentResultCard {...buildResearchGradedOutcome(submission)} />
        ) : null}

        {isEditable ? (
          <div className="space-y-3 rounded-xl border border-learn-border bg-learn-bg/60 p-3">
            <aside
              className={cn(
                "rounded-lg border border-learn-accent/30 bg-learn-accent/8 px-3 py-2.5",
                "text-xs leading-relaxed text-learn-text-strong",
              )}
            >
              <p className="font-semibold text-learn-accent">Hướng dẫn nộp bài</p>
              <ul className="mt-1.5 list-disc space-y-1 pl-4 text-learn-muted">
                <li>
                  <span className="font-medium text-learn-text-strong">Tệp chính:</span>{" "}
                  báo cáo, slide, tài liệu (PDF/Office…) — không qua pipeline AI.
                </li>
                <li>
                  <span className="font-medium text-learn-text-strong">Minh chứng (tuỳ chọn):</span>{" "}
                  chỉ ảnh/video JPG, PNG, MP4, MOV để AI xử lý.
                </li>
                <li>
                  Ảnh minh chứng nên có khuôn mặt bạn hoặc bạn cùng lớp để gắn thẻ AI.
                </li>
              </ul>
            </aside>

            <section className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-learn-faint">
                  Tệp chính
                </p>
                <p className="text-[11px] text-learn-faint">
                  ≤ {formatFileSize(RESEARCH_UPLOAD_MAX_BYTES)}
                </p>
              </div>
              <input
                ref={primaryInputRef}
                type="file"
                accept={RESEARCH_UPLOAD_ACCEPT}
                className="sr-only"
                disabled={Boolean(uploadingTarget)}
                onChange={(event) => {
                  const files = event.target.files;
                  if (files) void uploadFiles(files, "primary");
                  event.target.value = "";
                }}
              />
              {staging.fileUrl ? (
                <StagedPrimaryCard
                  url={staging.fileUrl}
                  name={staging.fileName ?? fileNameFromUrl(staging.fileUrl)}
                  disabled={Boolean(uploadingTarget)}
                  onRemove={clearPrimary}
                  onReplace={() => primaryInputRef.current?.click()}
                />
              ) : (
                <DropZone
                  label="Kéo thả hoặc chọn tệp chính"
                  hint="PDF, Office, ảnh, video…"
                  disabled={Boolean(uploadingTarget)}
                  isDragging={isPrimaryDragging}
                  isUploading={uploadingTarget === "primary"}
                  onBrowse={() => primaryInputRef.current?.click()}
                  {...primaryDrag}
                />
              )}
            </section>

            <section className="space-y-1.5 border-t border-learn-border/70 pt-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-learn-faint">
                  Minh chứng{" "}
                  <span className="font-normal normal-case tracking-normal">· tuỳ chọn</span>
                </p>
                <p className="text-[11px] tabular-nums text-learn-faint">
                  {staging.evidence.length}/{RESEARCH_UPLOAD_MAX_EVIDENCE}
                </p>
              </div>
              <p className="text-[11px] leading-relaxed text-learn-muted">
                Chỉ JPG/PNG/MP4/MOV. Ảnh nên có khuôn mặt bạn hoặc bạn cùng lớp.
              </p>
              <input
                ref={evidenceInputRef}
                type="file"
                accept={RESEARCH_EVIDENCE_ACCEPT}
                multiple
                className="sr-only"
                disabled={Boolean(uploadingTarget)}
                onChange={(event) => {
                  const files = event.target.files;
                  if (files) void uploadFiles(files, "evidence");
                  event.target.value = "";
                }}
              />
              <DropZone
                label="Thêm minh chứng ảnh/video"
                hint="JPG, PNG, MP4, MOV — có thể chọn nhiều tệp"
                disabled={
                  Boolean(uploadingTarget) ||
                  staging.evidence.length >= RESEARCH_UPLOAD_MAX_EVIDENCE
                }
                isDragging={isEvidenceDragging}
                isUploading={uploadingTarget === "evidence"}
                onBrowse={() => evidenceInputRef.current?.click()}
                {...evidenceDrag}
              />
              {staging.evidence.length > 0 ? (
                <ul className="flex flex-wrap gap-2 pt-0.5">
                  {staging.evidence.map((item) => (
                    <li key={item.mediaAssetId}>
                      <EvidenceTile
                        url={item.url}
                        name={item.name}
                        disabled={Boolean(uploadingTarget)}
                        onRemove={() => removeEvidence(item.mediaAssetId)}
                      />
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>

            <section className="space-y-1 border-t border-learn-border/70 pt-3">
              <label
                htmlFor="research-content-text"
                className="text-[11px] font-semibold uppercase tracking-wide text-learn-faint"
              >
                Ghi chú{" "}
                <span className="font-normal normal-case tracking-normal">· tuỳ chọn</span>
              </label>
              <textarea
                id="research-content-text"
                value={staging.contentText}
                onChange={(event) => handleContentChange(event.target.value)}
                rows={2}
                maxLength={2000}
                placeholder="Mô tả ngắn cho mentor…"
                className={cn(
                  "w-full resize-none rounded-lg border border-learn-border bg-learn-surface px-2.5 py-2 text-sm leading-relaxed text-learn-text-strong outline-none",
                  "placeholder:text-learn-faint",
                  "focus:border-learn-accent focus:ring-2 focus:ring-learn-accent/15",
                )}
              />
            </section>
          </div>
        ) : null}

        {submission && !isEditable ? (
          <div className="space-y-3 rounded-xl border border-learn-border bg-learn-bg/60 p-3">
            {submission.fileUrl ? (
              <section className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-learn-faint">
                  Tệp chính
                </p>
                <StagedPrimaryCard
                  url={submission.fileUrl}
                  name={fileNameFromUrl(submission.fileUrl)}
                />
              </section>
            ) : null}
            {(submission.evidenceUrls?.length ?? 0) > 0 ? (
              <section className="space-y-1.5 border-t border-learn-border/70 pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-learn-faint">
                  Minh chứng
                </p>
                <ul className="flex flex-wrap gap-2">
                  {submission.evidenceUrls?.map((url) => (
                    <li key={url}>
                      <EvidenceTile url={url} name={fileNameFromUrl(url)} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {submission.contentText ? (
              <section className="border-t border-learn-border/70 pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-learn-faint">
                  Ghi chú
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-learn-text-strong">
                  {submission.contentText}
                </p>
              </section>
            ) : null}
            {submittedLabel ? (
              <p className="text-[11px] text-learn-faint">Đã nộp · {submittedLabel}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      {isEditable ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-learn-border px-4 py-2.5 sm:px-5">
          <p className="text-sm font-medium text-learn-muted">
            Điểm đạt{" "}
            <span className="tabular-nums text-learn-text-strong">
              {passScore}/{maxPoints}
            </span>
          </p>
          <Button
            type="button"
            className="ml-auto bg-learn-primary text-white hover:bg-learn-primary/90"
            disabled={!canCommit}
            onClick={() => setIsConfirmOpen(true)}
          >
            {isSubmitting ? "Đang nộp..." : "Nộp bài"}
          </Button>
        </div>
      ) : null}

      {assignment &&
      submission?.status === "Graded" &&
      submission.passed === false &&
      !isRetaking ? (
        <AssignmentRecoveryActions
          moduleType={flatAssignment.moduleType}
          moduleEnrollmentId={recoveryEnrollmentId}
          assignmentId={assignmentId}
          attemptNumber={submission.attemptNumber}
          maxAttempts={assignment.maxAttempts}
          showRecoveryUi={!canRetryFailed}
          recoveryRequests={recoveryRequests}
          redeliveryRequests={redeliveryRequests}
          onRetry={canRetryFailed ? handleRetry : undefined}
          onRequestsChanged={() => {
            void refreshRecoveryRequests();
            void onCurriculumRefresh();
          }}
          programName={programName}
          programPrice={programPrice}
          completedModuleCount={completedModuleCount}
        />
      ) : null}

      <Dialog
        open={isConfirmOpen}
        onOpenChange={(open) => {
          if (!isSubmitting) setIsConfirmOpen(open);
        }}
      >
        <DialogPopup className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nộp bài nghiên cứu?</DialogTitle>
            <DialogDescription>
              Sau khi nộp, bạn không thể chỉnh sửa cho đến khi mentor yêu cầu chỉnh sửa lại.
              {staging.evidence.length > 0
                ? ` Kèm ${staging.evidence.length} minh chứng.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setIsConfirmOpen(false)}
            >
              Tiếp tục chỉnh
            </Button>
            <Button
              type="button"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isSubmitting}
              onClick={() => void performSubmit()}
            >
              {isSubmitting ? "Đang nộp..." : "Nộp bài"}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
