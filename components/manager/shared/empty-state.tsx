import Link from "next/link";
import { FolderOpen, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type ManagerEmptyStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
};

export function ManagerEmptyState({
  title,
  description,
  icon: Icon = FolderOpen,
  actionLabel,
  actionHref,
  onAction,
}: ManagerEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E5E5E0] bg-white p-12 text-center shadow-sm">
      {/* Icon Wrapper */}
      <div className="flex size-14 items-center justify-center rounded-2xl bg-[#FAFAF5] text-[#6B6B6B] ring-1 ring-[#E5E5E0]">
        <Icon className="size-7" aria-hidden />
      </div>

      {/* Text Info */}
      <h3 className="font-heading mt-5 text-lg font-bold text-[#2D2D2D]">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-[#6B6B6B]">
        {description}
      </p>

      {/* Optional CTA Action */}
      {actionLabel ? (
        <div className="mt-6">
          {actionHref ? (
            <Button
              nativeButton={false}
              render={<Link href={actionHref} />}
              className="h-10 rounded-lg bg-[#E94B3C] px-5 font-semibold text-white hover:bg-[#E94B3C]/90"
            >
              {actionLabel}
            </Button>
          ) : (
            <Button
              onClick={onAction}
              className="h-10 rounded-lg bg-[#E94B3C] px-5 font-semibold text-white hover:bg-[#E94B3C]/90"
            >
              {actionLabel}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
