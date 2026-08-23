import { ImageSlot } from "@/components/common/image-slot";
import { STEAM_CATEGORIES, STEAM_SECTION } from "@/lib/landing/content";

export function SteamCategoriesSection() {
  return (
    <section
      id="steam"
      aria-labelledby="steam-heading"
      className="bg-[#FAFAF5]"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-7">
        <h2
          id="steam-heading"
          className="font-heading font-extrabold text-[#2D2D2D] text-center text-balance tracking-tight"
          style={{ fontSize: "clamp(1.35rem, 3vw, 1.75rem)" }}
        >
          {STEAM_SECTION.heading}
        </h2>
      </div>

      <div className="hidden md:flex group/strip overflow-hidden">
        {STEAM_CATEGORIES.map((cat) => (
          <div
            key={cat.key}
            className="relative flex-1 transition-[flex,filter] duration-300 ease-out group-hover/strip:brightness-[0.82] hover:brightness-100! hover:flex-[1.35]! overflow-hidden"
            style={{ background: cat.color, minHeight: 460 }}
          >
            <div className="absolute inset-0 opacity-35 group-hover/strip:opacity-28 hover:opacity-55! transition-opacity duration-300">
              <ImageSlot
                ratio="4:3"
                src={cat.imageSrc}
                alt={`Học sinh học ${cat.label}`}
                tone={cat.key}
                className="absolute inset-0 rounded-none w-full h-full"
                sizes="20vw"
              />
            </div>

            <div
              className="absolute top-5 left-5 font-mono text-[10px] uppercase tracking-[0.22em] opacity-70"
              style={{ color: cat.textColor }}
            >
              {cat.letter} - {cat.label}
            </div>

            <span
              aria-hidden="true"
              className="absolute -bottom-4 -left-2 font-heading font-extrabold leading-none select-none pointer-events-none"
              style={{
                fontSize: "clamp(6rem, 12vw, 12rem)",
                color: cat.textColor,
                opacity: 0.18,
                letterSpacing: "-0.04em",
              }}
            >
              {cat.letter}
            </span>

            <div className="absolute bottom-0 right-0 p-5 lg:p-7 max-w-[240px] text-right transition-transform duration-300 ease-out group-hover/strip:translate-y-1 hover:translate-y-0!">
              <h3
                className="font-heading font-bold text-xl leading-tight mb-1.5"
                style={{ color: cat.textColor }}
              >
                {cat.label}
              </h3>
              <p
                className="text-sm leading-relaxed opacity-80"
                style={{ color: cat.textColor }}
              >
                {cat.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="md:hidden flex overflow-x-auto snap-x snap-mandatory pb-4 gap-2 px-4 scrollbar-none">
        {STEAM_CATEGORIES.map((cat) => (
          <div
            key={cat.key}
            className="relative snap-start shrink-0 w-[78vw] max-w-xs overflow-hidden rounded-2xl"
            style={{ background: cat.color, minHeight: 340 }}
          >
            <div className="absolute inset-0 opacity-35">
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
              className="absolute top-5 left-5 font-mono text-[10px] uppercase tracking-[0.2em] opacity-70"
              style={{ color: cat.textColor }}
            >
              {cat.letter} - {cat.label}
            </div>
            <span
              aria-hidden="true"
              className="absolute -bottom-2 -left-1 font-heading font-extrabold leading-none select-none pointer-events-none"
              style={{
                fontSize: "8rem",
                color: cat.textColor,
                opacity: 0.18,
                letterSpacing: "-0.04em",
              }}
            >
              {cat.letter}
            </span>
            <div className="absolute bottom-0 right-0 p-5 max-w-[210px] text-right">
              <h3
                className="font-heading font-bold text-lg leading-tight mb-1"
                style={{ color: cat.textColor }}
              >
                {cat.label}
              </h3>
              <p
                className="text-xs leading-relaxed opacity-80"
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
