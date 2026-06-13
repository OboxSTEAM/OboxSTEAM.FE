import Image from "next/image";

import { cn } from "@/lib/utils";

type PaymentIllustrationProps = {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
};

export function PaymentIllustration({
  src,
  alt,
  className,
  priority = false,
}: PaymentIllustrationProps) {
  return (
    <div
      className={cn(
        "relative mx-auto aspect-[4/3] w-full max-w-sm overflow-hidden rounded-2xl bg-[#FAFAF5]",
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 1024px) 80vw, 24rem"
        className="object-contain p-4"
      />
    </div>
  );
}
