import { BookOpen, MapPin, Video } from "lucide-react";

import type { ClassSessionKind } from "@/lib/api/entities/class-session";

export function sessionKindVisual(kind: ClassSessionKind) {
  if (kind === "LiveOnline") {
    return {
      Icon: Video,
      well: "bg-[#4FC3F7]/15 text-[#0277BD]",
      chip: "bg-[#4FC3F7]/18 text-[#0277BD]",
      dot: "bg-[#4FC3F7]",
      rail: "bg-[#4FC3F7]",
    };
  }
  if (kind === "Offline") {
    return {
      Icon: MapPin,
      well: "bg-[#7CB342]/15 text-[#558B2F]",
      chip: "bg-[#7CB342]/18 text-[#33691E]",
      dot: "bg-[#7CB342]",
      rail: "bg-[#7CB342]",
    };
  }
  return {
    Icon: BookOpen,
    well: "bg-[#FDD835]/30 text-[#F9A825]",
    chip: "bg-[#FDD835]/35 text-[#F57F17]",
    dot: "bg-[#FDD835]",
    rail: "bg-[#FDD835]",
  };
}
