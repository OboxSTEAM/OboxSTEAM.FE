/**
 * Shared Select styling.
 *
 * Canonical look is baked into `components/ui/select.tsx` — new code should
 * use `<SelectTrigger>` / `<SelectContent>` / `<SelectItem>` with layout-only
 * `className` overrides (`w-full`, `min-w-0`, `z-[60]`).
 *
 * `DARK_*` remains for dark marketing chrome (e.g. program filters).
 * `LIGHT_*` / `THEME_*` are deprecated aliases for existing call sites.
 */

/** @deprecated Prefer default Select primitive styles. */
export const THEME_SELECT_TRIGGER =
  "h-9 min-w-[11rem] border-border bg-card px-3 text-sm text-foreground shadow-sm hover:border-border hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/25 [&_svg]:text-muted-foreground hover:[&_svg]:text-foreground";

/** @deprecated Prefer default Select primitive styles. */
export const THEME_SELECT_CONTENT =
  "border border-border bg-popover p-1 text-foreground shadow-lg ring-0 data-open:animate-none data-closed:animate-none";

/** @deprecated Prefer default Select primitive styles. */
export const THEME_SELECT_ITEM =
  "rounded-md py-2 pl-2.5 pr-8 text-sm text-foreground focus:bg-muted! focus:text-foreground! focus:**:text-foreground! data-[highlighted]:bg-muted! data-[highlighted]:text-foreground! data-[highlighted]:**:text-foreground! [&_svg]:text-accent data-[highlighted]:[&_svg]:text-primary cursor-pointer";

/** Dark marketing surfaces only (not the app chrome default). */
export const DARK_SELECT_TRIGGER =
  "h-9 min-w-[11rem] border-white/12 bg-[#2A2A2A] px-3 text-sm text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-white/22 hover:bg-[#333333] hover:text-white focus-visible:border-[#4FC3F7]/60 focus-visible:ring-[#4FC3F7]/25 [&_svg]:text-white/50 hover:[&_svg]:text-white/70";

export const DARK_SELECT_CONTENT =
  "border border-white/12 bg-[#2A2A2A] p-1 text-white/90 shadow-[0_20px_48px_rgba(0,0,0,0.55)] ring-0 data-open:animate-none data-closed:animate-none";

export const DARK_SELECT_ITEM =
  "rounded-md py-2 pl-2.5 pr-8 text-sm text-white/85 focus:bg-white/14! focus:text-white! focus:**:text-white! data-[highlighted]:bg-white/14! data-[highlighted]:text-white! data-[highlighted]:**:text-white! [&_svg]:text-[#4FC3F7] cursor-pointer";

/** @deprecated Alias of THEME — use default Select primitive. */
export const LIGHT_SELECT_TRIGGER = THEME_SELECT_TRIGGER;
/** @deprecated Alias of THEME — use default Select primitive. */
export const LIGHT_SELECT_CONTENT = THEME_SELECT_CONTENT;
/** @deprecated Alias of THEME — use default Select primitive. */
export const LIGHT_SELECT_ITEM = THEME_SELECT_ITEM;

/** @deprecated Use `className="h-10 w-full min-w-0"` on SelectTrigger. */
export const LIGHT_SELECT_TRIGGER_FULL = `${THEME_SELECT_TRIGGER} h-10 w-full min-w-0`;
/** @deprecated Use default SelectContent. */
export const LIGHT_SELECT_CONTENT_PANEL = THEME_SELECT_CONTENT;
/** @deprecated Use default SelectItem. */
export const LIGHT_SELECT_ITEM_PANEL = THEME_SELECT_ITEM;
