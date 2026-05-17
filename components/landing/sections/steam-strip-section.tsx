import { ImageSlot } from "@/components/common/image-slot";
import { STEAM_CATEGORIES } from "@/lib/landing/content";

export function SteamStripSection() {
  return (
    <section
      aria-label="Các lĩnh vực STEAM"
      className="overflow-hidden"
    >
      {/* Desktop: horizontal 5-panel strip */}
      <div className="hidden md:flex">
        {STEAM_CATEGORIES.map((cat) => (
          <div
            key={cat.key}
            className="relative flex-1 group overflow-hidden"
            style={{ background: cat.color, minHeight: 440 }}
          >
            {/* Image slot (4:3 inset) */}
            <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500">
              <ImageSlot
                ratio="4:3"
                alt={`Học sinh học ${cat.label}`}
                tone={cat.key}
                className="absolute inset-0 rounded-none"
              />
            </div>

            {/* Content */}
            <div className="relative h-full flex flex-col justify-between p-6 lg:p-8">
              {/* Giant letter */}
              <span
                className="font-heading font-extrabold leading-none select-none"
                style={{
                  fontSize: "clamp(5rem, 9vw, 9rem)",
                  color: cat.textColor,
                  opacity: 0.18,
                }}
                aria-hidden="true"
              >
                {cat.letter}
              </span>

              {/* Label at bottom */}
              <div className="mt-auto">
                <p
                  className="font-mono text-xs uppercase tracking-[0.2em] mb-1 opacity-75"
                  style={{ color: cat.textColor }}
                >
                  {cat.letter} —
                </p>
                <h2
                  className="font-heading font-bold text-xl leading-tight mb-2"
                  style={{ color: cat.textColor }}
                >
                  {cat.label}
                </h2>
                <p
                  className="text-sm leading-relaxed opacity-80 max-w-[200px]"
                  style={{ color: cat.textColor }}
                >
                  {cat.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: horizontal scroll */}
      <div className="md:hidden flex overflow-x-auto snap-x snap-mandatory scrollbar-none">
        {STEAM_CATEGORIES.map((cat) => (
          <div
            key={cat.key}
            className="relative snap-start shrink-0 w-[80vw] max-w-xs overflow-hidden"
            style={{ background: cat.color, minHeight: 360 }}
          >
            <div className="absolute inset-0 opacity-15">
              <ImageSlot
                ratio="3:4"
                alt={`Học sinh học ${cat.label}`}
                tone={cat.key}
                className="absolute inset-0 rounded-none"
              />
            </div>
            <div className="relative h-full flex flex-col justify-between p-6">
              <span
                className="font-heading font-extrabold leading-none select-none"
                style={{ fontSize: "6rem", color: cat.textColor, opacity: 0.18 }}
                aria-hidden="true"
              >
                {cat.letter}
              </span>
              <div>
                <p
                  className="font-mono text-xs uppercase tracking-[0.2em] mb-1 opacity-75"
                  style={{ color: cat.textColor }}
                >
                  {cat.letter} —
                </p>
                <h2
                  className="font-heading font-bold text-xl leading-tight mb-2"
                  style={{ color: cat.textColor }}
                >
                  {cat.label}
                </h2>
                <p className="text-sm leading-relaxed opacity-80" style={{ color: cat.textColor }}>
                  {cat.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
