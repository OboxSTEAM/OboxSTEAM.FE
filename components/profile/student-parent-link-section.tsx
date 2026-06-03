"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link2, Mail } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { AuthField } from "@/components/auth/auth-field";
import { AuthSubmitButton } from "@/components/auth/auth-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getParentLinks,
  requestParentLink,
  type ParentLinkedStudent,
} from "@/lib/api";
import { showAppErrorFromUnknown, showAppSuccess } from "@/lib/errors";
import { requestParentLinkSchema } from "@/lib/validations/parent";

const MAX_PARENTS = 2;

type RequestParentLinkValues = z.infer<typeof requestParentLinkSchema>;

function getDisplayName(parent: ParentLinkedStudent): string {
  if (parent.fullName?.trim()) return parent.fullName.trim();
  const local = parent.email.split("@")[0] ?? "PH";
  return local.replace(/[._-]/g, " ");
}

function getInitials(parent: ParentLinkedStudent): string {
  const name = getDisplayName(parent);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function NoParentLinkedState() {
  return (
    <p className="rounded-lg border border-dashed border-[#E5E5E0] bg-[#FAFAF5] px-3 py-2.5 text-sm text-[#6B6B6B]">
      <Link2 className="mr-1.5 inline size-4 -translate-y-px text-[#E94B3C]" aria-hidden />
      Chưa liên kết phụ huynh — gửi email mời bên dưới.
    </p>
  );
}

function LinkedParentRow({ parent }: { parent: ParentLinkedStudent }) {
  const displayName = getDisplayName(parent);
  const hasProfile = Boolean(parent.fullName?.trim());
  const contact = [parent.email, parent.phone?.trim()].filter(Boolean).join(" · ");

  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <Avatar className="size-9 shrink-0">
        {parent.avatarUrl ? (
          <AvatarImage src={parent.avatarUrl} alt={displayName} />
        ) : null}
        <AvatarFallback className="bg-[#E94B3C]/10 text-xs font-semibold text-[#E94B3C]">
          {getInitials(parent)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="truncate text-sm font-medium text-[#2D2D2D]">
            {displayName}
          </span>
          <Badge
            variant={parent.isVerified ? "default" : "secondary"}
            className={
              parent.isVerified
                ? "h-5 shrink-0 px-1.5 text-[10px] bg-[#7CB342]/15 text-[#3d5c22] hover:bg-[#7CB342]/15"
                : "h-5 shrink-0 px-1.5 text-[10px] bg-[#FDD835]/20 text-[#7a6200] hover:bg-[#FDD835]/20"
            }
          >
            {parent.isVerified ? "Đã xác nhận" : "Chờ xác nhận"}
          </Badge>
          <span className="shrink-0 text-xs text-[#6B6B6B]">{parent.code}</span>
          {!hasProfile ? (
            <span className="text-[10px] text-[#6B6B6B]">Chưa hoàn tất hồ sơ</span>
          ) : null}
        </div>
        <p className="truncate text-xs text-[#6B6B6B]">{contact}</p>
      </div>
    </li>
  );
}

type ParentsLoadState = "loading" | "empty" | "has-data" | "error";

export function StudentParentLinkSection() {
  const [parents, setParents] = useState<ParentLinkedStudent[]>([]);
  const [loadState, setLoadState] = useState<ParentsLoadState>("loading");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RequestParentLinkValues>({
    resolver: zodResolver(requestParentLinkSchema),
    defaultValues: { parentEmail: "" },
  });

  const loadParents = useCallback(async () => {
    setLoadState("loading");
    try {
      const result = await getParentLinks();
      const data = result?.data ?? [];
      setParents(data);
      setLoadState(data.length > 0 ? "has-data" : "empty");
    } catch (error) {
      setParents([]);
      setLoadState("error");
      showAppErrorFromUnknown(error, "student.links");
    }
  }, []);

  useEffect(() => {
    void loadParents();
  }, [loadParents]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await requestParentLink(values);
      const apiMessage = result?.message?.trim();
      showAppSuccess({
        title: "Gửi email thành công",
        description:
          apiMessage ||
          `Đã gửi liên kết xác nhận tới ${values.parentEmail}. Vui lòng nhắc phụ huynh kiểm tra hộp thư (cả thư mục spam).`,
      });
      reset({ parentEmail: "" });
      await loadParents();
    } catch (error) {
      showAppErrorFromUnknown(error, "parent.request-link");
    }
  });

  const hasLinkedParents = loadState === "has-data" && parents.length > 0;

  const showInviteForm = useMemo(() => {
    if (loadState === "loading" || loadState === "error") return false;
    const atCapacityAndAllVerified =
      parents.length >= MAX_PARENTS && parents.every((p) => p.isVerified);
    return !atCapacityAndAllVerified;
  }, [loadState, parents]);

  return (
    <Card className="border-[#E5E5E0] bg-white shadow-sm">
      <CardHeader className="space-y-1 border-b border-[#E5E5E0] px-4 py-4 sm:px-6">
        <CardTitle className="font-heading text-base text-[#2D2D2D] sm:text-lg">
          Liên kết phụ huynh
        </CardTitle>
        <CardDescription className="text-sm text-[#6B6B6B]">
          {hasLinkedParents
            ? `Tối đa ${MAX_PARENTS} phụ huynh · ${parents.filter((p) => p.isVerified).length}/${parents.length} đã xác nhận`
            : "Gửi email mời phụ huynh xác nhận liên kết."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-4 py-4 sm:px-6">
        {loadState === "loading" ? (
          <div className="h-14 animate-pulse rounded-lg bg-[#E5E5E0]" />
        ) : loadState === "error" ? (
          <div className="rounded-lg border border-[#E5E5E0] bg-[#FAFAF5] px-3 py-2.5 text-sm">
            <p className="font-medium text-[#2D2D2D]">Không tải được thông tin phụ huynh</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 h-8 rounded-lg"
              onClick={() => void loadParents()}
            >
              Thử lại
            </Button>
          </div>
        ) : hasLinkedParents ? (
          <ul className="divide-y divide-[#E5E5E0] overflow-hidden rounded-lg border border-[#E5E5E0] bg-[#FAFAF5]/60">
            {parents.map((parent) => (
              <LinkedParentRow key={parent.linkedUserId} parent={parent} />
            ))}
          </ul>
        ) : (
          <NoParentLinkedState />
        )}

        {showInviteForm ? (
          <div
            className={
              hasLinkedParents
                ? "border-t border-[#E5E5E0] pt-4"
                : undefined
            }
          >
            {hasLinkedParents ? (
              <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-[#6B6B6B]">
                <Mail className="size-3.5" aria-hidden />
                {parents.length < MAX_PARENTS
                  ? "Mời thêm phụ huynh (còn có thể thêm)"
                  : "Còn phụ huynh chưa xác nhận — có thể gửi lại liên kết"}
              </p>
            ) : null}
            <form
              onSubmit={onSubmit}
              className="flex w-full flex-col gap-3 sm:flex-row sm:items-end"
            >
              <div className="min-w-0 w-full flex-1">
                <AuthField
                  id="parentEmail"
                  label="Email phụ huynh"
                  type="email"
                  autoComplete="email"
                  placeholder="phuhuynh@example.com"
                  error={errors.parentEmail?.message}
                  {...register("parentEmail")}
                />
              </div>
              <AuthSubmitButton
                isLoading={isSubmitting}
                className="w-full shrink-0 sm:w-[10.5rem]"
              >
                Gửi liên kết
              </AuthSubmitButton>
            </form>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
