"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  History,
  LayoutGrid,
  ListChecks,
  MessageSquareWarning,
} from "lucide-react";

import { ManagerPageHeader } from "@/components/manager/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  approveProgramReview,
  getCurriculumReviews,
  getProgramFrameworkById,
  requestProgramChanges,
  type FrameworkRubricCriterion,
  type ProgramWithModules,
  type ReviewCriterionScoreRequestInput,
} from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import {
  MODULE_TYPE_LABELS,
  PROGRAM_CATEGORY_META,
  PROGRAM_LEVEL_LABELS,
  PROGRAM_STATUS_LABELS,
  formatProgramPrice,
} from "@/lib/programs/constants";

type ScoreDraft = {
  score: string;
  comment: string;
};

type ExpertReviewDetailProps = {
  program: ProgramWithModules;
};

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
}

export function ExpertReviewDetail({ program }: ExpertReviewDetailProps) {
  const router = useRouter();
  const [scores, setScores] = useState<Record<string, ScoreDraft>>({});
  const [overallComment, setOverallComment] = useState("");
  const [changesComment, setChangesComment] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "approve" | "request-changes" | null
  >(null);

  const isPendingReview = program.status === "PendingReview";

  const { data: frameworkData, isLoading: isFrameworkLoading } = useClientFetch({
    enabled: program.frameworkId != null,
    fetcher: () => getProgramFrameworkById(program.frameworkId as string),
    deps: [program.frameworkId],
    onError: (error) => showAppErrorFromUnknown(error, "frameworks.detail"),
  });

  const { data: reviewsData, isLoading: isReviewsLoading, retry } = useClientFetch({
    fetcher: () => getCurriculumReviews(program.id),
    deps: [program.id],
    onError: (error) => showAppErrorFromUnknown(error, "expert.review.detail"),
  });

  const framework = frameworkData?.data ?? null;
  const reviews = reviewsData?.data ?? [];

  const criteria = useMemo<FrameworkRubricCriterion[]>(
    () =>
      framework
        ? [...framework.criteria].sort(
            (left, right) => left.displayOrder - right.displayOrder,
          )
        : [],
    [framework],
  );

  const totalMaxScore = criteria.reduce(
    (total, criterion) => total + criterion.maxScore,
    0,
  );
  const totalScore = criteria.reduce((total, criterion) => {
    const raw = Number(scores[criterion.id]?.score ?? "");
    return Number.isFinite(raw) ? total + raw : total;
  }, 0);

  function updateScore(criterionId: string, patch: Partial<ScoreDraft>) {
    setScores((prev) => ({
      ...prev,
      [criterionId]: { ...(prev[criterionId] ?? { score: "", comment: "" }), ...patch },
    }));
  }

  function collectScores(): ReviewCriterionScoreRequestInput[] | null {
    const collected: ReviewCriterionScoreRequestInput[] = [];
    for (const criterion of criteria) {
      const draft = scores[criterion.id];
      const raw = draft?.score.trim() ?? "";
      if (raw === "") {
        setFormError(`Vui lòng chấm điểm tiêu chí “${criterion.name}”.`);
        return null;
      }
      const value = Number(raw);
      if (!Number.isInteger(value) || value < 0 || value > criterion.maxScore) {
        setFormError(
          `Điểm của “${criterion.name}” phải là số nguyên từ 0 đến ${criterion.maxScore}.`,
        );
        return null;
      }
      collected.push({
        criterionId: criterion.id,
        score: value,
        comment: draft?.comment.trim() || null,
      });
    }
    setFormError(null);
    return collected;
  }

  async function handleApprove() {
    const collected = collectScores();
    if (collected == null) return;

    setPendingAction("approve");
    try {
      await approveProgramReview(program.id, {
        comment: overallComment.trim() || null,
        scores: collected.length > 0 ? collected : null,
      });
      showAppSuccess({
        title: "Đã phê duyệt chương trình",
        description: `“${program.name}” chuyển sang trạng thái Đã duyệt.`,
      });
      retry();
      router.push("/expert/reviews");
      router.refresh();
    } catch (error) {
      showAppErrorFromUnknown(error, "expert.review.approve");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleRequestChanges() {
    const comment = changesComment.trim();
    if (!comment) {
      setFormError("Vui lòng nhập lý do cần chỉnh sửa để Manager biết phải sửa gì.");
      return;
    }

    setFormError(null);
    setPendingAction("request-changes");
    try {
      await requestProgramChanges(program.id, { comment });
      showAppSuccess({
        title: "Đã gửi yêu cầu chỉnh sửa",
        description: `“${program.name}” được trả về cho Manager để chỉnh sửa.`,
      });
      setChangesComment("");
      retry();
      router.push("/expert/reviews");
      router.refresh();
    } catch (error) {
      showAppErrorFromUnknown(error, "expert.review.requestChanges");
    } finally {
      setPendingAction(null);
    }
  }

  const isBusy = pendingAction !== null;

  return (
    <div className="flex flex-col gap-6">
      <ManagerPageHeader
        title={program.name || "Chương trình"}
        description={`Mã: ${program.code || "—"} · Thẩm định curriculum và chấm rubric`}
        breadcrumbs={[
          { label: "Duyệt chương trình", href: "/expert/reviews" },
          { label: program.name },
        ]}
      >
        <Button
          nativeButton={false}
          render={<Link href="/expert/reviews" />}
          variant="outline"
          className="h-11 gap-2 rounded-xl border-border px-4 font-semibold"
        >
          <ArrowLeft className="size-4" />
          Về hàng chờ
        </Button>
      </ManagerPageHeader>

      <div className="grid gap-6 px-6 pb-12 xl:grid-cols-[minmax(0,1fr)_26rem] xl:items-start">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-[0_4px_18px_rgba(45,45,45,0.04)]">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-md bg-[#4FC3F7]/15 text-[11px] font-semibold text-[#0D6E9C] dark:text-[#7dd3fc]">
                {PROGRAM_STATUS_LABELS[program.status]}
              </Badge>
              {program.category ? (
                <Badge
                  variant="outline"
                  className="rounded-md border-border text-[11px] font-medium text-foreground"
                >
                  {PROGRAM_CATEGORY_META[program.category].label}
                </Badge>
              ) : null}
              <Badge
                variant="outline"
                className="rounded-md border-border text-[11px] font-medium text-foreground"
              >
                {PROGRAM_LEVEL_LABELS[program.level]}
              </Badge>
              <Badge
                variant="outline"
                className="rounded-md border-border text-[11px] font-medium text-foreground"
              >
                {formatProgramPrice(program.price)}
              </Badge>
            </div>

            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {program.description || "Chương trình chưa có mô tả."}
            </p>

            <dl className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Series
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {program.seriesName || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Thời lượng dự kiến
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {program.estimatedDuration || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Kỹ năng đạt được
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {program.skillsGained || "—"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_4px_18px_rgba(45,45,45,0.04)]">
            <header className="flex items-center justify-between gap-3 border-b border-border bg-background/70 px-6 py-4">
              <h2 className="flex items-center gap-2 font-heading text-sm font-bold text-foreground">
                <LayoutGrid className="size-4 text-primary" />
                Khung nội dung
              </h2>
              <span className="text-xs text-muted-foreground">
                {program.modules.length} học phần
              </span>
            </header>

            {program.modules.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-muted-foreground">
                Chương trình chưa có học phần nào.
              </p>
            ) : (
              <ol className="divide-y divide-border">
                {[...program.modules]
                  .sort((left, right) => left.moduleOrder - right.moduleOrder)
                  .map((module) => (
                    <li key={module.id} className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[11px] font-bold text-foreground">
                          {module.moduleOrder}
                        </span>
                        <p className="font-semibold text-sm text-foreground">
                          {module.name}
                        </p>
                        <Badge
                          variant="outline"
                          className="rounded-md border-border text-[10px] font-medium text-muted-foreground"
                        >
                          {MODULE_TYPE_LABELS[module.moduleType]}
                        </Badge>
                        {module.isMandatory ? (
                          <Badge className="rounded-md bg-primary/10 text-[10px] font-semibold text-primary">
                            Bắt buộc
                          </Badge>
                        ) : null}
                      </div>

                      {module.courses.length > 0 ? (
                        <ul className="mt-2 space-y-1 pl-8">
                          {[...module.courses]
                            .sort((left, right) => left.courseOrder - right.courseOrder)
                            .map((course) => (
                              <li
                                key={course.id}
                                className="flex items-baseline gap-2 text-sm text-muted-foreground"
                              >
                                <span className="text-muted-foreground/60">•</span>
                                <span className="min-w-0 truncate">{course.name}</span>
                              </li>
                            ))}
                        </ul>
                      ) : (
                        <p className="mt-2 pl-8 text-xs italic text-muted-foreground">
                          Học phần chưa có khóa học.
                        </p>
                      )}
                    </li>
                  ))}
              </ol>
            )}
          </section>

          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_4px_18px_rgba(45,45,45,0.04)]">
            <header className="flex items-center justify-between gap-3 border-b border-border bg-background/70 px-6 py-4">
              <h2 className="flex items-center gap-2 font-heading text-sm font-bold text-foreground">
                <History className="size-4 text-primary" />
                Lịch sử thẩm định
              </h2>
              <span className="text-xs text-muted-foreground">
                {reviews.length} vòng
              </span>
            </header>

            {isReviewsLoading ? (
              <div className="space-y-3 p-6">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : reviews.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-muted-foreground">
                Chương trình chưa qua vòng thẩm định nào.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {reviews.map((review) => (
                  <li key={review.id} className="px-6 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        className={
                          review.decision === "Approved"
                            ? "rounded-md bg-[#7CB342]/15 text-[11px] font-semibold text-[#33691e] dark:text-[#a5d66f]"
                            : "rounded-md bg-primary/10 text-[11px] font-semibold text-primary"
                        }
                      >
                        {review.decision === "Approved"
                          ? "Đã phê duyệt"
                          : "Yêu cầu chỉnh sửa"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Vòng {review.round} · {review.expertName || "Chuyên gia"} ·{" "}
                        {formatDateTime(review.reviewedAt)}
                      </span>
                    </div>
                    {review.comment ? (
                      <p className="mt-2 whitespace-pre-line text-sm text-foreground">
                        {review.comment}
                      </p>
                    ) : null}
                    {review.scores.length > 0 ? (
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {review.scores.map((score) => (
                          <li key={score.id}>
                            <Badge
                              variant="secondary"
                              className="rounded-md bg-muted text-[11px] font-medium text-foreground"
                              title={score.comment || undefined}
                            >
                              {score.criterionName}: {score.score}/{score.maxScore}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6">
          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_4px_18px_rgba(45,45,45,0.04)]">
            <header className="border-b border-border bg-background/70 px-5 py-4">
              <h2 className="flex items-center gap-2 font-heading text-sm font-bold text-foreground">
                <ListChecks className="size-4 text-primary" />
                Bảng điểm rubric
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {framework
                  ? framework.name
                  : program.frameworkId
                    ? "Đang tải khung chương trình…"
                    : "Chương trình chưa gán khung — có thể duyệt bằng nhận xét."}
              </p>
            </header>

            <div className="space-y-4 p-5">
              {isFrameworkLoading ? (
                <>
                  <Skeleton className="h-20 w-full rounded-xl" />
                  <Skeleton className="h-20 w-full rounded-xl" />
                </>
              ) : criteria.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                  Khung chưa có tiêu chí rubric. Ghi nhận xét tổng quan bên dưới.
                </p>
              ) : (
                <>
                  {criteria.map((criterion) => (
                    <div
                      key={criterion.id}
                      className="space-y-2 rounded-xl border border-border bg-background/60 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">
                            {criterion.name}
                          </p>
                          {criterion.description ? (
                            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                              {criterion.description}
                            </p>
                          ) : null}
                        </div>
                        <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                          /{criterion.maxScore}
                        </span>
                      </div>
                      <Input
                        value={scores[criterion.id]?.score ?? ""}
                        onChange={(event) =>
                          updateScore(criterion.id, { score: event.target.value })
                        }
                        inputMode="numeric"
                        placeholder={`0 – ${criterion.maxScore}`}
                        aria-label={`Điểm cho tiêu chí ${criterion.name}`}
                        disabled={!isPendingReview || isBusy}
                        className="h-10 rounded-lg border-input bg-card text-sm"
                      />
                      <Input
                        value={scores[criterion.id]?.comment ?? ""}
                        onChange={(event) =>
                          updateScore(criterion.id, { comment: event.target.value })
                        }
                        placeholder="Nhận xét cho tiêu chí (không bắt buộc)"
                        aria-label={`Nhận xét cho tiêu chí ${criterion.name}`}
                        disabled={!isPendingReview || isBusy}
                        className="h-10 rounded-lg border-input bg-card text-xs"
                      />
                    </div>
                  ))}

                  <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Tổng điểm
                    </span>
                    <span className="font-mono text-sm font-bold text-foreground">
                      {totalScore}/{totalMaxScore}
                    </span>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-[0_4px_18px_rgba(45,45,45,0.04)]">
            <div className="space-y-2">
              <Label htmlFor="review-overall-comment">Nhận xét tổng quan</Label>
              <Textarea
                id="review-overall-comment"
                rows={3}
                value={overallComment}
                onChange={(event) => setOverallComment(event.target.value)}
                placeholder="Điểm mạnh của curriculum và lưu ý khi triển khai..."
                disabled={!isPendingReview || isBusy}
                className="rounded-xl border-input bg-card"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-changes-comment">
                Lý do cần chỉnh sửa
                <span className="ml-1 text-primary">*</span>
              </Label>
              <Textarea
                id="review-changes-comment"
                rows={3}
                value={changesComment}
                onChange={(event) => setChangesComment(event.target.value)}
                placeholder="Bắt buộc khi yêu cầu chỉnh sửa — nêu rõ phần nào cần sửa."
                disabled={!isPendingReview || isBusy}
                className="rounded-xl border-input bg-card"
              />
            </div>

            {formError ? (
              <p className="flex items-start gap-1.5 text-xs font-medium text-primary">
                <AlertCircle className="mt-px size-3.5 shrink-0" />
                {formError}
              </p>
            ) : null}

            {isPendingReview ? null : (
              <p className="rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">
                Chương trình đang ở trạng thái{" "}
                <strong className="text-foreground">
                  {PROGRAM_STATUS_LABELS[program.status]}
                </strong>{" "}
                nên không thể thẩm định. Chỉ chương trình Chờ duyệt mới nhận quyết định.
              </p>
            )}

            <div className="flex flex-col gap-2">
              <Button
                type="button"
                onClick={handleApprove}
                disabled={!isPendingReview || isBusy}
                className="h-11 gap-2 rounded-xl bg-[#7CB342] px-5 font-semibold text-white hover:bg-[#7CB342]/90 active:scale-[0.98]"
              >
                <CheckCircle2 className="size-4" />
                {pendingAction === "approve" ? "Đang phê duyệt..." : "Phê duyệt"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleRequestChanges}
                disabled={!isPendingReview || isBusy}
                className="h-11 gap-2 rounded-xl border-primary/40 px-5 font-semibold text-primary hover:bg-primary/10"
              >
                <MessageSquareWarning className="size-4" />
                {pendingAction === "request-changes"
                  ? "Đang gửi..."
                  : "Yêu cầu chỉnh sửa"}
              </Button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
