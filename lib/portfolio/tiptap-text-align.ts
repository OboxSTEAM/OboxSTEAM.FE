import TextAlign from "@tiptap/extension-text-align";

const ALIGNMENTS = ["left", "center", "right", "justify"] as const;
type Alignment = (typeof ALIGNMENTS)[number];

const ALIGN_CLASS_RE = /\bpf-align-(left|center|right|justify)\b/i;

function isAlignment(value: string | null | undefined): value is Alignment {
  return (
    value != null &&
    (ALIGNMENTS as readonly string[]).includes(value.toLowerCase())
  );
}

function alignmentFromClass(className: string | null): Alignment | null {
  if (!className) return null;
  const match = className.match(ALIGN_CLASS_RE);
  return match && isAlignment(match[1]) ? (match[1].toLowerCase() as Alignment) : null;
}

/**
 * TextAlign that persists via `class="pf-align-*"` instead of inline `style`.
 * Backend HTML sanitizers strip `style` but often keep `class`.
 */
export const PortfolioTextAlign = TextAlign.extend({
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          textAlign: {
            default: this.options.defaultAlignment,
            parseHTML: (element) => {
              const fromClass = alignmentFromClass(element.getAttribute("class"));
              if (fromClass) return fromClass;

              const fromAlign = element.getAttribute("align");
              if (isAlignment(fromAlign)) return fromAlign.toLowerCase();

              const fromStyle = element.style.textAlign;
              if (isAlignment(fromStyle)) return fromStyle.toLowerCase();

              return this.options.defaultAlignment;
            },
            renderHTML: (attributes) => {
              const align = attributes.textAlign as string | null | undefined;
              if (!align || !isAlignment(align)) return {};
              // Class only — do not emit style (BE strips it).
              return { class: `pf-align-${align.toLowerCase()}` };
            },
          },
        },
      },
    ];
  },
});
