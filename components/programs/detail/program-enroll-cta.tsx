import { Button } from "@/components/ui/button";
import { getProgramPriceParts } from "@/lib/programs/constants";
import { cn } from "@/lib/utils";

type ProgramEnrollCtaProps = {
  price: number;
  variant?: "hero" | "sidebar";
  className?: string;
};

export function ProgramEnrollCta({
  price,
  variant = "sidebar",
  className,
}: ProgramEnrollCtaProps) {
  const priceParts = getProgramPriceParts(price);
  const isHero = variant === "hero";

  return (
    <div className={cn("space-y-2", className)}>
      {isHero && !priceParts.isFree ? (
        <p className="text-sm text-[#6B6B6B]">
          Học phí{" "}
          <span className="font-semibold text-[#2D2D2D]">
            {priceParts.amount} {priceParts.unit}
          </span>
        </p>
      ) : null}

      <Button
        type="button"
        className={cn(
          "font-semibold",
          isHero ? "h-11 px-6 text-sm" : "h-11 w-full text-sm",
        )}
        aria-label="Đăng ký chương trình"
      >
        {priceParts.isFree ? "Đăng ký miễn phí" : "Đăng ký chương trình"}
      </Button>

      <p
        className={cn(
          "text-xs leading-relaxed text-[#6B6B6B]",
          isHero ? "" : "text-center",
        )}
      >
        Tính năng đăng ký sẽ sớm ra mắt
      </p>
    </div>
  );
}
