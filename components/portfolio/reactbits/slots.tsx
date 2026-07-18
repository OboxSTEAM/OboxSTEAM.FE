"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";

import type {
  BackgroundSlotId,
  CardSlotId,
  GallerySlotId,
  HeroTextSlotId,
  RevealSlotId,
  ResolvedPortfolioTheme,
} from "@/lib/portfolio/theme-presets";
import { cn } from "@/lib/utils";

const Aurora = dynamic(() => import("@/components/Aurora"), { ssr: false });
const Waves = dynamic(() => import("@/components/Waves"), { ssr: false });
const DotGrid = dynamic(() => import("@/components/DotGrid"), { ssr: false });
const SplitText = dynamic(() => import("@/components/SplitText"), { ssr: false });
const GradientText = dynamic(() => import("@/components/GradientText"), { ssr: false });
const TrueFocus = dynamic(() => import("@/components/TrueFocus"), { ssr: false });
const DecryptedText = dynamic(() => import("@/components/DecryptedText"), { ssr: false });
const BlurText = dynamic(() => import("@/components/BlurText"), { ssr: false });
const ShinyText = dynamic(() => import("@/components/ShinyText"), { ssr: false });
const SpotlightCard = dynamic(() => import("@/components/SpotlightCard"), { ssr: false });
const StarBorder = dynamic(() => import("@/components/StarBorder"), { ssr: false });
const GlareHover = dynamic(() => import("@/components/GlareHover"), { ssr: false });
const AnimatedContent = dynamic(() => import("@/components/AnimatedContent"), {
  ssr: false,
});
const FadeContent = dynamic(() => import("@/components/FadeContent"), { ssr: false });
const CircularGallery = dynamic(() => import("@/components/CircularGallery"), {
  ssr: false,
});
const Masonry = dynamic(() => import("@/components/Masonry"), { ssr: false });

function useShouldAnimate() {
  const reduce = useReducedMotion();
  return !(reduce ?? false);
}

export function PortfolioBackground({
  slot,
  theme,
  className,
}: {
  slot: BackgroundSlotId;
  theme: ResolvedPortfolioTheme;
  className?: string;
}) {
  const animate = useShouldAnimate();

  const baseStyle: CSSProperties | undefined =
    theme.backgroundStyle === "Gradient" || slot === "GradientSoft"
      ? {
          background: `linear-gradient(145deg, ${theme.primaryColor}38 0%, ${theme.secondaryColor}28 42%, ${theme.accentColor}18 100%)`,
        }
      : theme.backgroundStyle === "Pattern"
        ? {
            backgroundColor: theme.isDark ? "#121212" : "#FAFAF5",
            backgroundImage: `radial-gradient(${theme.primaryColor}40 1.5px, transparent 1.5px)`,
            backgroundSize: "16px 16px",
          }
        : theme.backgroundStyle === "Image" && theme.backgroundImageUrl
          ? {
              backgroundImage: `url(${theme.backgroundImageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : theme.backgroundImageUrl
            ? {
                backgroundImage: `url(${theme.backgroundImageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined;

  const showEffect = animate && slot !== "None";

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden",
        className,
      )}
      aria-hidden
    >
      {baseStyle ? <div className="absolute inset-0" style={baseStyle} /> : null}

      {showEffect && slot === "Aurora" ? (
        <div className="absolute inset-0 size-full min-h-[280px] opacity-90">
          <Aurora
            colorStops={[theme.primaryColor, theme.accentColor, theme.secondaryColor]}
            blend={0.5}
            amplitude={0.8}
            speed={0.6}
          />
        </div>
      ) : null}
      {showEffect && slot === "Waves" ? (
        <Waves
          lineColor={`${theme.primaryColor}66`}
          backgroundColor="transparent"
          waveSpeedX={0.012}
          waveSpeedY={0.008}
        />
      ) : null}
      {showEffect && slot === "DotGrid" ? (
        <div className="absolute inset-0 size-full bg-[#121212]/80">
          <DotGrid
            dotSize={3}
            gap={22}
            baseColor="#2a2a2a"
            activeColor={theme.primaryColor}
            proximity={100}
          />
        </div>
      ) : null}
      {showEffect && slot === "GradientSoft" && !baseStyle ? (
        <div
          className="absolute inset-0 size-full"
          style={{
            background: `linear-gradient(145deg, ${theme.primaryColor}38 0%, ${theme.secondaryColor}28 42%, ${theme.accentColor}18 100%)`,
          }}
        />
      ) : null}
    </div>
  );
}

export function PortfolioHeroText({
  slot,
  name,
  headline,
  className,
}: {
  slot: HeroTextSlotId;
  name: string;
  headline?: string | null;
  className?: string;
}) {
  const animate = useShouldAnimate();

  if (!animate || slot === "Plain") {
    return (
      <div className={className}>
        <p className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
          {name}
        </p>
        {headline ? (
          <p className="mt-2 text-lg font-medium opacity-90">{headline}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={className}>
      {slot === "SplitGradient" ? (
        <>
          <SplitText
            text={name}
            className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl"
            delay={40}
          />
          {headline ? (
            <div className="mt-2 text-lg font-semibold">
              <GradientText
                colors={["#E94B3C", "#7E57C2", "#4FC3F7"]}
                showBorder={false}
              >
                {headline}
              </GradientText>
            </div>
          ) : null}
        </>
      ) : null}
      {slot === "TrueFocus" ? (
        <TrueFocus
          sentence={headline ? `${name} — ${headline}` : name}
          manualMode={false}
          blurAmount={4}
          borderColor="#E94B3C"
        />
      ) : null}
      {slot === "Decrypted" ? (
        <>
          <DecryptedText
            text={name}
            animateOn="view"
            className="font-heading text-3xl font-bold"
          />
          {headline ? (
            <p className="mt-2 font-mono text-sm opacity-80">{headline}</p>
          ) : null}
        </>
      ) : null}
      {slot === "BlurShiny" ? (
        <>
          <BlurText text={name} className="font-heading text-3xl font-extrabold" />
          {headline ? (
            <div className="mt-2">
              <ShinyText text={headline} speed={3} className="text-lg font-medium" />
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export function PortfolioCardShell({
  slot,
  surfaceClass,
  className,
  isDark = false,
  children,
}: {
  slot: CardSlotId;
  surfaceClass: string;
  className?: string;
  /** When false, effect wrappers must stay transparent so light card surfaces remain readable. */
  isDark?: boolean;
  children: ReactNode;
}) {
  const animate = useShouldAnimate();
  const body = (
    <div className={cn("relative z-[1] h-full rounded-2xl p-4 sm:p-5", surfaceClass, className)}>
      {children}
    </div>
  );

  if (!animate || slot === "Soft") {
    return body;
  }

  // Bounce/Tilted reactbits are image-oriented; glare overlay only — never paint a black shell.
  if (slot === "Bounce" || slot === "Tilted") {
    return (
      <GlareHover
        className="!h-full !w-full cursor-auto rounded-2xl border-transparent"
        width="100%"
        height="100%"
        background="transparent"
        borderColor="transparent"
        borderRadius="1rem"
        glareColor={isDark ? "#ffffff" : "#4FC3F7"}
        glareOpacity={isDark ? 0.22 : 0.32}
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        {body}
      </GlareHover>
    );
  }

  if (slot === "Spotlight") {
    return (
      <SpotlightCard
        className="h-full rounded-2xl bg-transparent p-0"
        spotlightColor={
          isDark ? "rgba(79, 195, 247, 0.22)" : "rgba(79, 195, 247, 0.16)"
        }
      >
        {body}
      </SpotlightCard>
    );
  }

  if (slot === "StarBorder") {
    return (
      <StarBorder
        as="div"
        className="block h-full w-full"
        color="#4FC3F7"
        speed="6s"
        contentClassName="!border-0 !bg-transparent !p-0 !text-left !text-inherit"
      >
        {body}
      </StarBorder>
    );
  }

  return body;
}

export function PortfolioReveal({
  slot,
  children,
  className,
}: {
  slot: RevealSlotId;
  children: ReactNode;
  className?: string;
}) {
  const animate = useShouldAnimate();
  if (!animate || slot === "None") {
    return <div className={className}>{children}</div>;
  }
  if (slot === "FadeContent") {
    return (
      <FadeContent blur className={className}>
        {children}
      </FadeContent>
    );
  }
  return (
    <AnimatedContent distance={40} className={className}>
      {children}
    </AnimatedContent>
  );
}

export type GalleryImage = { src: string; alt?: string; caption?: string | null };

export function PortfolioGallery({
  slot,
  images,
  className,
}: {
  slot: GallerySlotId;
  images: GalleryImage[];
  className?: string;
}) {
  const animate = useShouldAnimate();
  const items = images.filter((image) => Boolean(image.src));

  if (items.length === 0) {
    return (
      <p className={cn("text-sm text-[#6B6B6B]", className)}>
        Chưa có ảnh trong thư viện này.
      </p>
    );
  }

  if (!animate || slot === "Grid" || slot === "Carousel") {
    return (
      <div
        className={cn(
          slot === "Carousel"
            ? "flex gap-3 overflow-x-auto pb-2 snap-x"
            : "grid grid-cols-2 gap-2 sm:grid-cols-3",
          className,
        )}
      >
        {items.map((image, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${image.src}-${index}`}
            src={image.src}
            alt={image.alt ?? image.caption ?? ""}
            className={cn(
              "rounded-xl object-cover",
              slot === "Carousel"
                ? "h-48 w-72 shrink-0 snap-center"
                : "aspect-square w-full",
            )}
          />
        ))}
      </div>
    );
  }

  if (slot === "CircularGallery") {
    return (
      <div className={cn("h-[360px] w-full", className)}>
        <CircularGallery
          items={items.map((image) => ({
            image: image.src,
            text: image.caption ?? "",
          }))}
          bend={2}
          borderRadius={0.08}
        />
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <Masonry
        items={items.map((image, index) => ({
          id: String(index),
          img: image.src,
          url: image.src,
          height: 220 + (index % 3) * 40,
        }))}
      />
    </div>
  );
}
