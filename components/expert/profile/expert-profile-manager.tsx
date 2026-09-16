"use client";

import { useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Camera, ChevronDown, ExternalLink, Save, UserRound } from "lucide-react";
import { z } from "zod";

import { useCurrentUser } from "@/components/providers/current-user-provider";
import { ExpertCredentialsEditor } from "@/components/manager/experts/expert-credentials-editor";
import { ManagerEmptyState } from "@/components/manager/shared/empty-state";
import { ManagerPageHeader } from "@/components/manager/shared/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientFetch } from "@/hooks/use-client-fetch";
import {
  ApiRequestError,
  EMPTY_CREDENTIAL_DRAFTS,
  getMyExpert,
  updateMyExpert,
  uploadMyExpertAvatar,
  type Expert,
} from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { getExpertAvatarUrl, getExpertInitials } from "@/lib/programs/format";
import { cn } from "@/lib/utils";
import {
  updateMyExpertSchema,
  uploadExpertAvatarSchema,
} from "@/lib/validations/experts";

/** Form fields — strings only; mapped to `UpdateMyExpertInput` on submit. */
const profileFormSchema = z.object({
  fullName: updateMyExpertSchema.shape.fullName,
  title: z.string().trim().max(255, "Chức danh không được quá 255 ký tự."),
  organization: z
    .string()
    .trim()
    .max(255, "Tổ chức không được quá 255 ký tự."),
  bio: z.string().trim().max(4000, "Giới thiệu không được quá 4000 ký tự."),
  linkedInUrl: z
    .string()
    .trim()
    .refine((value) => {
      if (value === "") return true;
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    }, "URL phải bắt đầu bằng http:// hoặc https://."),
  achievements: z
    .string()
    .trim()
    .max(4000, "Thành tựu không được quá 4000 ký tự."),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const INPUT_CLASS =
  "h-11 rounded-xl border-input bg-card text-sm text-foreground focus-visible:ring-ring/50";
const TEXTAREA_CLASS =
  "w-full resize-none rounded-xl border border-input bg-card px-3.5 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30";

function toFormValues(expert: Expert): ProfileFormValues {
  return {
    fullName: expert.fullName,
    title: expert.title,
    organization: expert.organization,
    bio: expert.bio,
    linkedInUrl: expert.linkedInUrl,
    achievements: expert.achievements,
  };
}

export function ExpertProfileManager() {
  const { isAuthenticated, isLoading: isProfileLoading, refresh } =
    useCurrentUser();

  const { data: fetchedExpert, isLoading: isExpertLoading } = useClientFetch({
    enabled: isAuthenticated,
    fetcher: async () => {
      try {
        const result = await getMyExpert();
        return result?.data ?? null;
      } catch (error) {
        if (error instanceof ApiRequestError && error.status === 404) {
          return null;
        }
        throw error;
      }
    },
    deps: [isAuthenticated],
    onError: (error) => showAppErrorFromUnknown(error, "experts.profile"),
  });

  const [expert, setExpert] = useState<Expert | null>(null);
  const [syncedExpertId, setSyncedExpertId] = useState<string | null>(null);

  // Adopt the freshly loaded profile without wiping in-page credential edits.
  if (fetchedExpert && fetchedExpert.id !== syncedExpertId) {
    setSyncedExpertId(fetchedExpert.id);
    setExpert(fetchedExpert);
  }

  if (!isExpertLoading && fetchedExpert == null && syncedExpertId != null) {
    setSyncedExpertId(null);
    setExpert(null);
  }

  const isLoading = isProfileLoading || isExpertLoading;

  return (
    <div className="flex flex-col gap-6">
      <ManagerPageHeader
        title="Hồ sơ chuyên môn"
        description="Thông tin chuyên môn, học vị và minh chứng năng lực của bạn."
        breadcrumbs={[{ label: "Hồ sơ chuyên môn" }]}
      />

      <div className="px-6 pb-12">
        {isLoading ? (
          <div className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)] xl:items-start">
            <Skeleton className="h-72 w-full rounded-2xl" />
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
        ) : !expert ? (
          <ManagerEmptyState
            icon={UserRound}
            title="Chưa tìm thấy hồ sơ chuyên gia"
            description="Tài khoản của bạn chưa được liên kết với hồ sơ chuyên gia nào. Vui lòng liên hệ quản trị viên để được cấp hồ sơ."
          />
        ) : (
          <div className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)] xl:items-start">
            <ProfileCard
              expert={expert}
              onExpertChange={setExpert}
              onAccountRefresh={refresh}
            />

            <div className="space-y-6">
              <ProfileForm
                key={expert.id}
                expert={expert}
                onExpertChange={setExpert}
                onAccountRefresh={refresh}
              />

              <section className="rounded-2xl border border-border bg-card p-6 shadow-[0_4px_18px_rgba(45,45,45,0.04)]">
                <h2 className="font-heading text-sm font-bold text-foreground">
                  Minh chứng năng lực
                </h2>
                <p className="mt-1 mb-5 text-xs text-muted-foreground">
                  Bằng cấp và bài báo khoa học được lưu ngay khi bạn thêm hoặc
                  sửa.
                </p>
                <ExpertCredentialsEditor
                  expert={expert}
                  drafts={EMPTY_CREDENTIAL_DRAFTS}
                  onDraftsChange={() => undefined}
                  onExpertChange={setExpert}
                  selfService
                />
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileCard({
  expert,
  onExpertChange,
  onAccountRefresh,
}: {
  expert: Expert;
  onExpertChange: (expert: Expert) => void;
  onAccountRefresh: () => Promise<unknown>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleAvatarChange(file: File | undefined) {
    if (!file) return;

    const parsed = uploadExpertAvatarSchema.safeParse({ file });
    if (!parsed.success) {
      showAppErrorFromUnknown(parsed.error, "experts.upload-avatar");
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadMyExpertAvatar(parsed.data.file);
      const next = result?.data;
      if (next) {
        onExpertChange(next);
      }
      await onAccountRefresh();
      showAppSuccess({ title: "Đã cập nhật ảnh đại diện" });
    } catch (error) {
      showAppErrorFromUnknown(error, "experts.upload-avatar");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 text-center shadow-[0_4px_18px_rgba(45,45,45,0.04)] xl:sticky xl:top-6">
      <div className="relative mx-auto w-fit">
        <Avatar className="size-24 ring-2 ring-border">
          <AvatarImage
            src={getExpertAvatarUrl(expert.avatarUrl) ?? undefined}
            alt={expert.fullName || "Chuyên gia"}
          />
          <AvatarFallback className="bg-muted font-heading text-lg font-bold text-foreground">
            {getExpertInitials(expert.fullName)}
          </AvatarFallback>
        </Avatar>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          aria-label="Đổi ảnh đại diện"
          className="absolute -bottom-1 -right-1 size-9 rounded-full border-border bg-card shadow-sm"
        >
          <Camera className="size-4" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) =>
            void handleAvatarChange(event.target.files?.[0] ?? undefined)
          }
        />
      </div>

      <h2 className="font-heading mt-4 text-lg font-bold text-foreground">
        {expert.fullName || "Chuyên gia"}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {expert.title || "Chưa cập nhật chức danh"}
      </p>
      <p className="text-sm text-muted-foreground">
        {expert.organization || "Chưa cập nhật tổ chức"}
      </p>

      <dl className="mt-5 space-y-3 border-t border-border pt-5 text-left">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Mã chuyên gia
          </dt>
          <dd className="mt-0.5 font-mono text-sm text-foreground">
            {expert.code || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Email
          </dt>
          <dd className="mt-0.5 truncate text-sm text-foreground" title={expert.email}>
            {expert.email || "—"}
          </dd>
        </div>
        {expert.linkedInUrl ? (
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              LinkedIn
            </dt>
            <dd className="mt-0.5">
              <a
                href={expert.linkedInUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <ExternalLink className="size-3.5" />
                Xem trang cá nhân
              </a>
            </dd>
          </div>
        ) : null}
      </dl>

      {expert.programs.length > 0 ? (
        <ProgramBoardSummary programs={expert.programs} />
      ) : null}
    </section>
  );
}

function ProgramBoardSummary({
  programs,
}: {
  programs: Expert["programs"];
}) {
  const [open, setOpen] = useState(false);
  const count = programs.length;
  const preview = programs
    .slice(0, 2)
    .map((program) => program.name || program.code)
    .filter(Boolean)
    .join(", ");
  const more = count > 2 ? count - 2 : 0;

  return (
    <div
      className="t-acc mt-5 border-t border-border pt-5 text-left"
      data-open={open ? "true" : "false"}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "t-acc-head group flex min-h-14 w-full items-center gap-3 rounded-xl border border-border bg-muted/40 px-3.5 py-3 text-left",
          "outline-none transition-[background-color,border-color,box-shadow] duration-200",
          "hover:border-border hover:bg-muted/70 hover:shadow-[0_2px_10px_rgba(45,45,45,0.05)]",
          "focus-visible:ring-2 focus-visible:ring-ring/40",
          open && "border-primary/20 bg-card shadow-[0_2px_10px_rgba(45,45,45,0.04)]",
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-heading text-sm font-bold tracking-tight text-foreground">
              Hội đồng chương trình
            </p>
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary/10 px-2 font-mono text-xs font-bold tabular-nums text-primary">
              {count}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {open
              ? "Danh sách chương trình bạn đang đồng hành"
              : `${preview}${more > 0 ? ` +${more}` : ""}`}
          </p>
        </div>
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground",
            "transition-colors duration-200 group-hover:text-foreground",
          )}
          aria-hidden
        >
          <ChevronDown className="t-acc-chevron size-4" />
        </span>
      </button>

      <div className="t-acc-panel">
        <div className="t-acc-panel-inner">
          <ul className="mt-3 space-y-2 rounded-xl border border-border bg-card p-3">
            {programs.map((program) => (
              <li
                key={program.programId}
                className="rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-muted/50"
              >
                <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
                  {program.name || program.code}
                </p>
                {program.roleInBoard ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {program.roleInBoard}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ProfileForm({
  expert,
  onExpertChange,
  onAccountRefresh,
}: {
  expert: Expert;
  onExpertChange: (expert: Expert) => void;
  onAccountRefresh: () => Promise<unknown>;
}) {
  const [specializationText, setSpecializationText] = useState(
    expert.specialization.join(", "),
  );
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: toFormValues(expert),
  });

  const onSubmit = handleSubmit(async (values) => {
    const specialization = specializationText
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== "")
      .slice(0, 20);

    setIsSaving(true);
    try {
      const result = await updateMyExpert({
        fullName: values.fullName,
        title: values.title || null,
        organization: values.organization || null,
        bio: values.bio || null,
        linkedInUrl: values.linkedInUrl || null,
        achievements: values.achievements || null,
        specialization,
      });
      const next = result?.data;
      onExpertChange(next ?? { ...expert, ...values, specialization });
      await onAccountRefresh();
      showAppSuccess({
        title: "Đã lưu hồ sơ",
        description: "Thông tin chuyên môn của bạn đã được cập nhật.",
      });
    } catch (error) {
      showAppErrorFromUnknown(error, "experts.update");
    } finally {
      setIsSaving(false);
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-[0_4px_18px_rgba(45,45,45,0.04)]"
    >
      <div>
        <h2 className="font-heading text-sm font-bold text-foreground">
          Thông tin chuyên môn
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Nội dung này xuất hiện trên trang giới thiệu hội đồng chương trình.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="profile-fullName">Họ và tên</Label>
          <Input
            id="profile-fullName"
            {...register("fullName")}
            className={INPUT_CLASS}
          />
          {errors.fullName ? (
            <p className="text-xs font-medium text-primary">
              {errors.fullName.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-title">Chức danh</Label>
          <Input
            id="profile-title"
            {...register("title")}
            placeholder="PGS.TS Khoa học Máy tính"
            className={INPUT_CLASS}
          />
          {errors.title ? (
            <p className="text-xs font-medium text-primary">
              {errors.title.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-organization">Tổ chức</Label>
          <Input
            id="profile-organization"
            {...register("organization")}
            placeholder="Đại học Bách khoa Hà Nội"
            className={INPUT_CLASS}
          />
          {errors.organization ? (
            <p className="text-xs font-medium text-primary">
              {errors.organization.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-linkedin">LinkedIn</Label>
          <Input
            id="profile-linkedin"
            {...register("linkedInUrl")}
            placeholder="https://linkedin.com/in/..."
            className={INPUT_CLASS}
          />
          {errors.linkedInUrl ? (
            <p className="text-xs font-medium text-primary">
              {errors.linkedInUrl.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-specialization">Chuyên môn</Label>
        <Input
          id="profile-specialization"
          value={specializationText}
          onChange={(event) => setSpecializationText(event.target.value)}
          placeholder="Robotics, AI cho giáo dục, STEM assessment"
          className={INPUT_CLASS}
        />
        <p className="text-[11px] text-muted-foreground">
          Cách nhau bằng dấu phẩy — tối đa 20 lĩnh vực.
        </p>
        {specializationText.trim() !== "" ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {specializationText
              .split(",")
              .map((item) => item.trim())
              .filter((item) => item !== "")
              .map((item, index) => (
                <Badge
                  key={`${item}-${index}`}
                  variant="secondary"
                  className="rounded-md bg-muted text-[11px] font-medium text-foreground"
                >
                  {item}
                </Badge>
              ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-bio">Giới thiệu</Label>
        <textarea
          id="profile-bio"
          rows={4}
          {...register("bio")}
          placeholder="Kinh nghiệm giảng dạy, nghiên cứu và định hướng chuyên môn..."
          className={TEXTAREA_CLASS}
        />
        {errors.bio ? (
          <p className="text-xs font-medium text-primary">{errors.bio.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-achievements">Thành tựu</Label>
        <textarea
          id="profile-achievements"
          rows={3}
          {...register("achievements")}
          placeholder="Giải thưởng, dự án tiêu biểu, đóng góp cộng đồng..."
          className={TEXTAREA_CLASS}
        />
        {errors.achievements ? (
          <p className="text-xs font-medium text-primary">
            {errors.achievements.message}
          </p>
        ) : null}
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSaving}
          className="h-11 gap-2 rounded-xl bg-primary px-6 font-semibold text-white hover:bg-primary/90"
        >
          <Save className="size-4" />
          {isSaving ? "Đang lưu..." : "Lưu hồ sơ"}
        </Button>
      </div>
    </form>
  );
}
