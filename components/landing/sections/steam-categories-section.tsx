import { ImageSlot } from "@/components/common/image-slot";
import { EyebrowChip } from "@/components/common/eyebrow-chip";
import { STEAM_CATEGORIES } from "@/lib/landing/content";

export function SteamCategoriesSection() {
  return (
    <section
      id="steam"
      aria-labelledby="steam-heading"
      className="bg-[#FAFAF5]"
    >
      {/* Section intro band */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 lg:pt-20 pb-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div>
          <EyebrowChip className="mb-3">5 Lĩnh vực · STEAM</EyebrowChip>
          <h2
            id="steam-heading"
            className="font-heading font-extrabold text-[#2D2D2D] text-balance tracking-tight leading-[0.95]"
            style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
          >
            Chọn con đường của bạn.
          </h2>
        </div>
        <p className="text-[#6B6B6B] text-base max-w-sm">
          Mỗi lĩnh vực một màu sắc, một câu chuyện. Bắt đầu từ sự tò mò.
        </p>
      </div>

      {/* Desktop: Nike-poster strip (5 panels with hover-grow) */}
      <div className="hidden md:flex group/strip overflow-hidden">
        {STEAM_CATEGORIES.map((cat) => (
          <div
            key={cat.key}
            className="relative flex-1 transition-[flex,filter] duration-300 ease-out group-hover/strip:brightness-[0.78] hover:brightness-100! hover:flex-[1.35]! overflow-hidden"
            style={{ background: cat.color, minHeight: 520 }}
          >
            {/* Background image inset */}
            <div className="absolute inset-0 opacity-[0.18] group-hover/strip:opacity-[0.18] hover:opacity-[0.42]! transition-opacity duration-300">
              <ImageSlot
                ratio="4:3"
                src={cat.imageSrc}
                alt={`Học sinh học ${cat.label}`}
                tone={cat.key}
                className="absolute inset-0 rounded-none w-full h-full"
                sizes="20vw"
              />
            </div>

            {/* Top mono eyebrow */}
            <div
              className="absolute top-6 left-6 font-mono text-[11px] uppercase tracking-[0.25em] opacity-75"
              style={{ color: cat.textColor }}
            >
              {cat.letter} — {cat.label}
            </div>

            {/* Giant Nike-scale letter, anchored bottom-left */}
            <span
              aria-hidden="true"
              className="absolute -bottom-4 -left-2 font-heading font-extrabold leading-none select-none pointer-events-none"
              style={{
                fontSize: "clamp(7rem, 14vw, 14rem)",
                color: cat.textColor,
                opacity: 0.22,
                letterSpacing: "-0.04em",
              }}
            >
              {cat.letter}
            </span>

            {/* Content anchored bottom-right with smooth slide-up on hover */}
            <div className="absolute bottom-0 right-0 p-6 lg:p-8 max-w-[260px] text-right transition-transform duration-300 ease-out group-hover/strip:translate-y-1 hover:translate-y-0!">
              <h3
                className="font-heading font-bold text-2xl leading-tight mb-2"
                style={{ color: cat.textColor }}
              >
                {cat.label}
              </h3>
              <p
                className="text-sm leading-relaxed opacity-85"
                style={{ color: cat.textColor }}
              >
                {cat.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: horizontal snap-scroll */}
      <div className="md:hidden flex overflow-x-auto snap-x snap-mandatory pb-4 gap-2 px-4 scrollbar-none">
        {STEAM_CATEGORIES.map((cat) => (
          <div
            key={cat.key}
            className="relative snap-start shrink-0 w-[78vw] max-w-xs overflow-hidden rounded-2xl"
            style={{ background: cat.color, minHeight: 380 }}
          >
            <div className="absolute inset-0 opacity-20">
              <ImageSlot
                ratio="3:4"
                src={cat.imageSrc}
                alt={`Học sinh học ${cat.label}`}
                tone={cat.key}
                className="absolute inset-0 rounded-none w-full h-full"
                sizes="80vw"
              />
            </div>
            <div
              className="absolute top-5 left-5 font-mono text-[11px] uppercase tracking-[0.22em] opacity-75"
              style={{ color: cat.textColor }}
            >
              {cat.letter} — {cat.label}
            </div>
            <span
              aria-hidden="true"
              className="absolute -bottom-2 -left-1 font-heading font-extrabold leading-none select-none pointer-events-none"
              style={{
                fontSize: "9rem",
                color: cat.textColor,
                opacity: 0.22,
                letterSpacing: "-0.04em",
              }}
            >
              {cat.letter}
            </span>
            <div className="absolute bottom-0 right-0 p-5 max-w-[220px] text-right">
              <h3
                className="font-heading font-bold text-xl leading-tight mb-1.5"
                style={{ color: cat.textColor }}
              >
                {cat.label}
              </h3>
              <p
                className="text-xs leading-relaxed opacity-85"
                style={{ color: cat.textColor }}
              >
                {cat.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
