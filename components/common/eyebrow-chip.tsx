import { cn } from "@/lib/utils";

interface EyebrowChipProps {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
}

export function EyebrowChip({ children, className, dark = false }: EyebrowChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.18em]",
        dark
          ? "bg-white/10 text-white/80"
          : "bg-[#F5F5F0] text-[#6B6B6B]",
        className
      )}
    >
      {children}
    </span>
  );
}
