"use client";

import { useMemo, useState } from "react";
import { Search, UserRoundPlus } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Expert } from "@/lib/api";
import { getExpertAvatarUrl, getExpertInitials } from "@/lib/programs/format";
import { cn } from "@/lib/utils";

type AssignExistingExpertDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programName: string;
  experts: Expert[];
  assignedExpertIds: string[];
  isLoading: boolean;
  isSubmitting: boolean;
  onSubmit: (expertId: string, roleInBoard: string) => Promise<void>;
};

export function AssignExistingExpertDialog({
  open,
  onOpenChange,
  programName,
  experts,
  assignedExpertIds,
  isLoading,
  isSubmitting,
  onSubmit,
}: AssignExistingExpertDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedExpertId, setSelectedExpertId] = useState<string | null>(null);
  const [roleInBoard, setRoleInBoard] = useState("");

  const availableExperts = useMemo(() => {
    const assigned = new Set(assignedExpertIds);
    const keyword = search.trim().toLocaleLowerCase("vi");
    return experts.filter((expert) => {
      if (assigned.has(expert.id)) return false;
      if (!keyword) return true;
      return `${expert.fullName} ${expert.code} ${expert.organization}`
        .toLocaleLowerCase("vi")
        .includes(keyword);
    });
  }, [assignedExpertIds, experts, search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-2xl gap-0 p-0">
        <DialogHeader className="border-b border-[#E8E8E3] px-6 py-5 pr-14">
          <DialogTitle>Gán chuyên gia có sẵn</DialogTitle>
          <DialogDescription>
            Chọn một chuyên gia để tham gia chương trình {programName}.
          </DialogDescription>
        </DialogHeader>
        <DialogClose />

        <div className="space-y-5 px-6 py-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-[#7A7A74]" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo tên, mã hoặc tổ chức..."
              className="h-11 rounded-xl border-[#D8D8D2] pl-10 focus-visible:ring-[#4FC3F7]/40"
            />
          </div>

          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {isLoading ? (
              [0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-16 animate-pulse rounded-xl bg-[#F5F5F0]"
                />
              ))
            ) : availableExperts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#D8D8D2] px-5 py-10 text-center">
                <UserRoundPlus className="mx-auto size-7 text-[#9A9A94]" />
                <p className="mt-3 text-sm font-semibold text-[#2D2D2D]">
                  Không có chuyên gia phù hợp
                </p>
                <p className="mt-1 text-xs text-[#6B6B6B]">
                  Các chuyên gia đã tham gia chương trình sẽ không xuất hiện tại đây.
                </p>
              </div>
            ) : (
              availableExperts.map((expert) => {
                const selected = selectedExpertId === expert.id;
                const avatarUrl = getExpertAvatarUrl(expert.avatarUrl);
                return (
                  <button
                    key={expert.id}
                    type="button"
                    onClick={() => setSelectedExpertId(expert.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4FC3F7]/40",
                      selected
                        ? "border-[#4FC3F7] bg-[#4FC3F7]/8"
                        : "border-[#E5E5E0] bg-white hover:bg-[#FAFAF5]",
                    )}
                  >
                    <Avatar className="size-10 border border-[#E5E5E0]">
                      {avatarUrl ? (
                        <AvatarImage src={avatarUrl} alt={expert.fullName} />
                      ) : null}
                      <AvatarFallback className="bg-[#4FC3F7]/12 text-xs font-bold text-[#0D6E9C]">
                        {getExpertInitials(expert.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[#2D2D2D]">
                        {expert.fullName || "Chưa cập nhật tên"}
                      </span>
                      <span className="block truncate text-xs text-[#6B6B6B]">
                        {[expert.code, expert.title, expert.organization]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "size-4 rounded-full border-2",
                        selected
                          ? "border-[#E94B3C] bg-[#E94B3C] shadow-[inset_0_0_0_3px_white]"
                          : "border-[#B8B8B2]",
                      )}
                    />
                  </button>
                );
              })
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="existing-expert-role">Vai trò trong hội đồng</Label>
            <Input
              id="existing-expert-role"
              value={roleInBoard}
              onChange={(event) => setRoleInBoard(event.target.value)}
              placeholder="Ví dụ: Cố vấn chương trình"
              maxLength={255}
              className="h-11 rounded-xl border-[#D8D8D2] focus-visible:ring-[#4FC3F7]/40"
            />
          </div>
        </div>

        <DialogFooter className="border-t border-[#E8E8E3] px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="h-11 rounded-xl border-[#D8D8D2] px-5"
          >
            Hủy
          </Button>
          <Button
            type="button"
            disabled={!selectedExpertId || isSubmitting}
            onClick={() => {
              if (selectedExpertId) {
                void onSubmit(selectedExpertId, roleInBoard.trim());
              }
            }}
            className="h-11 rounded-xl bg-[#E94B3C] px-6 font-semibold text-white hover:bg-[#D94134]"
          >
            {isSubmitting ? "Đang gán..." : "Gán vào chương trình"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
