import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType =
  | "active"
  | "success"
  | "verified"
  | "approved"
  | "published"
  | "pending"
  | "draft"
  | "waiting"
  | "upcoming"
  | "inactive"
  | "rejected"
  | "cancelled"
  | "suspended"
  | "expired"
  | "premium";

type ManagerStatusBadgeProps = {
  status: string | StatusType;
  label?: string;
  className?: string;
};

export function ManagerStatusBadge({
  status,
  label,
  className,
}: ManagerStatusBadgeProps) {
  const normStatus = status.trim().toLowerCase();

  // Mapping configurations
  let badgeStyle = "bg-muted text-muted-foreground border-border";
  let displayLabel = label ?? status;

  if (
    [
      "active",
      "success",
      "verified",
      "approved",
      "published",
      "hoạt động",
      "đã duyệt",
      "thành công",
    ].includes(normStatus)
  ) {
    badgeStyle = "bg-[#7CB342]/15 text-[#3d5c22] border-[#7CB342]/20";
    displayLabel = label ?? "Hoạt động";
  } else if (
    [
      "pending",
      "draft",
      "waiting",
      "upcoming",
      "chờ duyệt",
      "nháp",
      "chờ",
    ].includes(normStatus)
  ) {
    badgeStyle = "bg-[#4FC3F7]/15 text-[#0d6e9c] border-[#4FC3F7]/25";
    displayLabel = label ?? "Chờ duyệt";
  } else if (
    [
      "inactive",
      "rejected",
      "cancelled",
      "suspended",
      "expired",
      "hủy",
      "khóa",
      "từ chối",
    ].includes(normStatus)
  ) {
    badgeStyle = "bg-primary/10 text-[#a82a1e] border-primary/15";
    displayLabel = label ?? "Đã khóa";
  } else if (["premium", "vip"].includes(normStatus)) {
    badgeStyle = "bg-[#7E57C2]/12 text-[#51308a] border-[#7E57C2]/20";
    displayLabel = label ?? "Premium";
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize tracking-wide transition-colors",
        badgeStyle,
        className
      )}
    >
      {displayLabel}
    </Badge>
  );
}
