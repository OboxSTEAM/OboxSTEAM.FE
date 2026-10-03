import { BookOpen, MapPin, Video } from "lucide-react";

import type { ClassSessionKind } from "@/lib/api/entities/class-session";

/**
 * Kind owns the colour channel on schedule surfaces — status and attendance
 * stay neutral so online / offline / assignment remain distinguishable.
 */
export function sessionKindVisual(kind: ClassSessionKind) {
  if (kind === "LiveOnline") {
    return {
      Icon: Video,
      label: "Lớp học trực tuyến",
      ink: "text-[#0277BD] dark:text-[#81D4FA]",
      band: "bg-[#4FC3F7]/15 text-[#01579B] dark:text-[#81D4FA]",
      bandLive: "bg-[#0277BD] text-white",
      liveBorder: "border-[#0277BD]/60",
      chip: "bg-[#4FC3F7]/18 text-[#0277BD]",
      dot: "bg-[#4FC3F7]",
    };
  }
  if (kind === "Offline") {
    return {
      Icon: MapPin,
      label: "Ngoại khóa",
      ink: "text-[#558B2F] dark:text-[#AED581]",
      band: "bg-[#7CB342]/15 text-[#33691E] dark:text-[#AED581]",
      bandLive: "bg-[#558B2F] text-white",
      liveBorder: "border-[#558B2F]/60",
      chip: "bg-[#7CB342]/18 text-[#33691E]",
      dot: "bg-[#7CB342]",
    };
  }
  return {
    Icon: BookOpen,
    label: "Nộp bài tập",
    ink: "text-[#725D00] dark:text-[#FDE047]",
    band: "bg-[#FDD835]/30 text-[#725D00] dark:text-[#FDE047]",
    bandLive: "bg-[#FDD835] text-[#2D2D2D]",
    liveBorder: "border-[#F9A825]/70",
    chip: "bg-[#FDD835]/35 text-[#F57F17]",
    dot: "bg-[#FDD835]",
  };
}
