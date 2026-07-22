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
import { getHeroStyle, HERO_MOTION } from "@/lib/portfolio/hero-styles";
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
const AnimatedContent = dynamic(() => import("@/components/AnimatedContent"), {
  ssr: false,
});
const FadeContent = dynamic(() => import("@/components/FadeContent"), { ssr: false });
const DomeGallery = dynamic(() => import("@/components/DomeGallery"), {
  ssr: false,
});
const AccordionGallery = dynamic(() => import("@/components/AccordionGallery"), {
  ssr: false,
});

function useShouldAnimate() {
  const reduce = useReducedMotion();
  return !(reduce ?? false);
}

function resolvePageBackgroundStyle(
  theme: ResolvedPortfolioTheme,
): CSSProperties {
  const plainFill = theme.isDark ? "#121212" : "#FAFAF5";

  if (theme.backgroundStyle === "Gradient") {
    return {
      background: `linear-gradient(145deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 48%, ${theme.accentColor} 100%)`,
    };
  }

  if (theme.backgroundStyle === "Pattern") {
    return {
      backgroundColor: plainFill,
      backgroundImage: `radial-gradient(${theme.primaryColor} 1.6px, transparent 1.6px)`,
      backgroundSize: "16px 16px",
    };
  }

  if (theme.backgroundStyle === "Image") {
    if (theme.backgroundImageUrl) {
      return {
        backgroundImage: `linear-gradient(145deg, ${theme.primaryColor}55, ${theme.secondaryColor}40), url(${theme.backgroundImageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }
    return {
      backgroundColor: plainFill,
      backgroundImage:
        "linear-gradient(45deg, #E5E5E0 25%, transparent 25%), linear-gradient(-45deg, #E5E5E0 25%, transparent 25%)",
      backgroundSize: "18px 18px",
    };
  }

  // Plain — solid page fill tinted lightly by primary
  return {
    background: theme.isDark
      ? plainFill
      : `linear-gradient(180deg, ${theme.primaryColor}22 0%, ${plainFill} 38%, ${plainFill} 100%)`,
  };
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
  const pageStyle = resolvePageBackgroundStyle(theme);

  // Animated overlays when Nền hiệu ứng is the active stage (page style forced Plain).
  const showEffect =
    animate &&
    slot !== "None" &&
    (theme.backgroundMode === "effect" || theme.backgroundStyle === "Plain");

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-0 overflow-hidden",
        className,
      )}
      aria-hidden
      style={pageStyle}
    >
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
        <div className="absolute inset-0 size-full">
          <DotGrid
            dotSize={3}
            gap={22}
            baseColor={theme.isDark ? "#2a2a2a" : "#D0D0C8"}
            activeColor={theme.primaryColor}
            proximity={100}
          />
        </div>
      ) : null}
      {showEffect && slot === "GradientSoft" ? (
        <div
          className="absolute inset-0 size-full opacity-80"
          style={{
            background: `linear-gradient(145deg, ${theme.primaryColor}55 0%, ${theme.secondaryColor}40 42%, ${theme.accentColor}30 100%)`,
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
  colors = ["#E94B3C", "#7E57C2", "#4FC3F7"],
}: {
  slot: HeroTextSlotId;
  name: string;
  headline?: string | null;
  className?: string;
  colors?: [string, string, string] | string[];
}) {
  const animate = useShouldAnimate();
  const [c0, c1, c2] = colors;
  const style = getHeroStyle(slot);
  const motion = HERO_MOTION;

  if (!animate || slot === "Plain") {
    return (
      <div className={cn("mt-3 min-w-0", className)}>
        <p className={cn("font-heading", style.nameClass)}>{name}</p>
        {headline ? (
          <p className={cn(style.headlineClass, "opacity-90")}>{headline}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("mt-3 min-w-0", className)}>
      {slot === "SplitGradient" ? (
        <>
          <SplitText
            text={name}
            className={cn(
              "font-heading !block w-full max-w-full",
              style.nameClass,
            )}
            delay={motion.splitText.delay}
            duration={motion.splitText.duration}
            ease={motion.splitText.ease}
            textAlign="left"
          />
          {headline ? (
            <div className={style.headlineClass}>
              <GradientText
                colors={[c0, c1, c2]}
                showBorder={false}
                animationSpeed={motion.gradientText.animationSpeed}
              >
                {headline}
              </GradientText>
            </div>
          ) : null}
        </>
      ) : null}
      {slot === "TrueFocus" ? (
        <>
          <TrueFocus
            sentence={name}
            manualMode={false}
            blurAmount={motion.trueFocus.blurAmount}
            borderColor={c0}
            glowColor={`${c0}99`}
            animationDuration={motion.trueFocus.animationDuration}
            pauseBetweenAnimations={motion.trueFocus.pauseBetweenAnimations}
            className="!justify-start"
            wordClassName={cn(
              "relative cursor-pointer font-heading",
              style.nameClass,
            )}
          />
          {headline ? (
            <p className={cn(style.headlineClass, "opacity-90")}>{headline}</p>
          ) : null}
        </>
      ) : null}
      {slot === "Decrypted" ? (
        <>
          <DecryptedText
            text={name}
            animateOn="view"
            speed={motion.decrypted.speed}
            maxIterations={motion.decrypted.maxIterations}
            className={cn("font-heading", style.nameClass)}
            parentClassName="font-heading block w-full max-w-full break-words"
          />
          {headline ? (
            <p className={style.headlineClass}>{headline}</p>
          ) : null}
        </>
      ) : null}
      {slot === "BlurShiny" ? (
        <>
          <BlurText
            text={name}
            className={cn("font-heading", style.nameClass)}
            delay={motion.blurText.delay}
            stepDuration={motion.blurText.stepDuration}
          />
          {headline ? (
            <div className={style.headlineClass}>
              <ShinyText
                text={headline}
                speed={motion.shinyText.speed}
                className="text-base font-medium @min-[640px]/pf:text-lg"
                color={c0}
              />
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
  accentColor = "#4FC3F7",
  radiusClass = "rounded-2xl",
  children,
}: {
  slot: CardSlotId;
  surfaceClass: string;
  className?: string;
  /** Kept for call-site compatibility; card chrome is static (no hover glitter). */
  isDark?: boolean;
  /** Theme primary — drives distinct card chrome per slot. */
  accentColor?: string;
  /** @deprecated Hover glare/spotlight wrappers removed — ignored. */
  effectsEnabled?: boolean;
  /** Preset personality radius (e.g. Studio Play squircles). */
  radiusClass?: string;
  children: ReactNode;
}) {
  const slotChrome =
    slot === "Spotlight"
      ? {
          className: "ring-2",
          style: { boxShadow: `0 0 0 2px ${accentColor}` } as CSSProperties,
        }
        : slot === "Tilted"
          ? {
              className: "origin-center @min-[640px]/pf:rotate-2",
              style: {
                boxShadow: `6px 10px 0 0 ${accentColor}33`,
              } as CSSProperties,
            }
        : slot === "Bounce"
          ? {
              className: "",
              style: {
                boxShadow: `0 12px 0 0 ${accentColor}40, 0 18px 32px rgba(45,45,45,0.12)`,
              } as CSSProperties,
            }
          : slot === "StarBorder"
            ? {
                className: "ring-2 ring-dashed",
                style: { boxShadow: `0 0 0 2px ${accentColor}` } as CSSProperties,
              }
            : { className: "", style: undefined };

  return (
    <div
      className={cn(
        "relative z-[1] h-full min-w-0 overflow-hidden p-3.5 @min-[640px]/pf:p-5",
        radiusClass,
        surfaceClass,
        slotChrome.className,
        className,
      )}
      style={slotChrome.style}
    >
      {children}
    </div>
  );
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

function GalleryCaption({
  caption,
  className,
  isDark = false,
}: {
  caption?: string | null;
  className?: string;
  isDark?: boolean;
}) {
  const text = caption?.trim();
  if (!text) return null;
  return (
    <p
      className={cn(
        "mt-1.5 line-clamp-2 text-xs leading-snug",
        isDark ? "text-[#FAFAF5]/65" : "text-[#6B6B6B]",
        className,
      )}
    >
      {text}
    </p>
  );
}

function galleryActivateHandler(
  onImageActivate: ((index: number) => void) | undefined,
  index: number,
) {
  if (!onImageActivate) return undefined;
  return () => onImageActivate(index);
}

/** Dome vignette must match page wash — cream on Studio Play / Aurora Gradient looks broken. */
function resolveGalleryDomeSurface(theme?: {
  isDark?: boolean;
  primaryColor?: string;
  backgroundStyle?: ResolvedPortfolioTheme["backgroundStyle"];
}): { fill: string; overlay: string } {
  if (theme?.isDark) {
    return { fill: "#121212", overlay: "rgba(18, 18, 18, 0.97)" };
  }
  const primary = theme?.primaryColor ?? "#4FC3F7";
  if (theme?.backgroundStyle === "Gradient") {
    return {
      fill: `color-mix(in srgb, ${primary} 20%, #FAFAF5)`,
      overlay: `color-mix(in srgb, ${primary} 26%, rgba(250, 250, 245, 0.94))`,
    };
  }
  return { fill: "#FAFAF5", overlay: "rgba(250, 250, 245, 0.92)" };
}

export function PortfolioGallery({
  slot,
  images,
  className,
  onImageActivate,
  isDark = false,
  primaryColor,
  backgroundStyle,
}: {
  slot: GallerySlotId;
  images: GalleryImage[];
  className?: string;
  /** When set (editor), clicking an image opens caption edit. */
  onImageActivate?: (index: number) => void;
  isDark?: boolean;
  primaryColor?: string;
  backgroundStyle?: ResolvedPortfolioTheme["backgroundStyle"];
}) {
  const animate = useShouldAnimate();
  const items = images.filter((image) => Boolean(image.src));
  const isEditable = Boolean(onImageActivate);
  const domeSurface = resolveGalleryDomeSurface({
    isDark,
    primaryColor,
    backgroundStyle,
  });

  if (items.length === 0) {
    return (
      <p
        className={cn(
          "text-sm",
          isDark ? "text-[#FAFAF5]/55" : "text-[#6B6B6B]",
          className,
        )}
      >
        Chưa có ảnh trong thư viện này.
      </p>
    );
  }

  if (slot === "DomeGallery" && animate) {
    return (
      <div
        className={cn(
          "h-[220px] w-full overflow-hidden rounded-xl @min-[640px]/pf:h-[320px] @min-[640px]/pf:rounded-2xl @min-[768px]/pf:h-[380px]",
          isEditable && "cursor-pointer",
          className,
        )}
        style={{ backgroundColor: domeSurface.fill }}
        onClick={
          onImageActivate
            ? (event) => {
                const img = (event.target as HTMLElement).closest("img");
                if (!img) return;
                const src = img.getAttribute("src");
                const index = items.findIndex((item) => item.src === src);
                if (index >= 0) onImageActivate(index);
              }
            : undefined
        }
      >
        <DomeGallery
          images={items.map((image) => ({
            src: image.src,
            alt: image.caption?.trim() || image.alt || "",
          }))}
          fit={0.72}
          minRadius={320}
          maxRadius={620}
          grayscale={false}
          overlayBlurColor={domeSurface.overlay}
        />
      </div>
    );
  }

  if (slot === "Accordion") {
    return (
      <AccordionGallery
        items={items}
        reduceMotion={!animate}
        className={className}
        onImageActivate={onImageActivate}
      />
    );
  }

  // Grid / Carousel / reduced-motion fallbacks
  return (
    <div
      className={cn(
        slot === "Carousel"
          ? "flex gap-2.5 overflow-x-auto overscroll-x-contain pb-2 [-ms-overflow-style:none] [scrollbar-width:none] snap-x @min-[640px]/pf:gap-3 [&::-webkit-scrollbar]:hidden"
          : "grid grid-cols-2 gap-2.5 @min-[640px]/pf:grid-cols-3 @min-[640px]/pf:gap-3",
        className,
      )}
    >
      {items.map((image, index) => {
        const caption = image.caption?.trim() || image.alt?.trim() || "";
        const activate = galleryActivateHandler(onImageActivate, index);
        return (
          <figure
            key={`${image.src}-${index}`}
            className={cn(
              "min-w-0",
              slot === "Carousel" &&
                "w-[min(16rem,78%)] shrink-0 snap-center @min-[640px]/pf:w-72",
            )}
          >
            <button
              type="button"
              disabled={!activate}
              onClick={activate}
              className={cn(
                "block w-full overflow-hidden rounded-xl text-left outline-none",
                activate &&
                  "cursor-pointer transition hover:brightness-[0.97] focus-visible:ring-2 focus-visible:ring-[#4FC3F7]/55",
                !activate && "cursor-default",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.src}
                alt={caption}
                className={cn(
                  "rounded-xl object-cover",
                  slot === "Carousel" ? "h-36 w-full @min-[640px]/pf:h-48" : "aspect-square w-full",
                )}
              />
            </button>
            <GalleryCaption caption={caption} isDark={isDark} />
          </figure>
        );
      })}
    </div>
  );
}
