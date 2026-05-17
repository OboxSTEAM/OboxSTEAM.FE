import Image from "next/image";
import { cn } from "@/lib/utils";

type AspectRatio = "16:9" | "1:1" | "4:3" | "3:4";
type SteamTone = "science" | "technology" | "engineering" | "arts" | "mathematics" | "neutral";

interface ImageSlotProps {
  ratio: AspectRatio;
  src?: string;
  alt: string;
  tone?: SteamTone;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

const RATIO_CLASS: Record<AspectRatio, string> = {
  "16:9": "aspect-video",
  "1:1": "aspect-square",
  "4:3": "aspect-[4/3]",
  "3:4": "aspect-[3/4]",
};

const TONE_COLOR: Record<SteamTone, string> = {
  science: "#E94B3C",
  technology: "#7CB342",
  engineering: "#4FC3F7",
  arts: "#FDD835",
  mathematics: "#7E57C2",
  neutral: "#E5E5E0",
};

export function ImageSlot({
  ratio,
  src,
  alt,
  tone = "neutral",
  className,
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
}: ImageSlotProps) {
  const isDev = process.env.NODE_ENV === "development";
  const color = TONE_COLOR[tone];

  if (src) {
    return (
      <div className={cn("relative overflow-hidden rounded-2xl", RATIO_CLASS[ratio], className)}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl flex items-center justify-center",
        RATIO_CLASS[ratio],
        className,
        isDev ? "border-2 border-dashed" : "bg-[#F5F5F0]"
      )}
      style={
        isDev
          ? {
              borderColor: color,
              background: `${color}12`,
            }
          : undefined
      }
      aria-hidden="true"
      role="img"
      aria-label={alt}
    >
      {isDev && (
        <span className="font-mono text-xs text-center px-4 select-none" style={{ color }}>
          {ratio} · {alt}
        </span>
      )}
    </div>
  );
}
