/** Shared Select styling for program catalog (dark) and detail (light) surfaces. */

export const DARK_SELECT_TRIGGER =
  "h-9 min-w-[11rem] border-white/12 bg-[#2A2A2A] px-3 text-sm text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-white/22 hover:bg-[#333333] hover:text-white focus-visible:border-[#4FC3F7]/60 focus-visible:ring-[#4FC3F7]/25 [&_svg]:text-white/50 hover:[&_svg]:text-white/70";

export const DARK_SELECT_CONTENT =
  "border border-white/12 bg-[#2A2A2A] p-1 text-white/90 shadow-[0_20px_48px_rgba(0,0,0,0.55)] ring-0 data-open:animate-none data-closed:animate-none";

export const DARK_SELECT_ITEM =
  "rounded-md py-2 pl-2.5 pr-8 text-sm text-white/85 focus:bg-white/14! focus:text-white! focus:**:text-white! data-[highlighted]:bg-white/14! data-[highlighted]:text-white! data-[highlighted]:**:text-white! [&_svg]:text-[#4FC3F7]";

export const LIGHT_SELECT_TRIGGER =
  "h-9 min-w-[11rem] border-[#D8D8D3] bg-white px-3 text-sm text-[#2D2D2D] shadow-[0_2px_8px_rgba(45,45,45,0.04)] hover:border-[#B8B8B3] hover:bg-[#F5F5F0] hover:text-[#2D2D2D] focus-visible:border-[#4FC3F7]/60 focus-visible:ring-[#4FC3F7]/25 [&_svg]:text-[#6B6B6B] hover:[&_svg]:text-[#2D2D2D]";

export const LIGHT_SELECT_CONTENT =
  "border border-[#E5E5E0] bg-white p-1 text-[#2D2D2D] shadow-[0_12px_32px_rgba(45,45,45,0.12)] ring-0 data-open:animate-none data-closed:animate-none";

export const LIGHT_SELECT_ITEM =
  "rounded-md py-2 pl-2.5 pr-8 text-sm text-[#2D2D2D] focus:bg-[#EBEBE6]! focus:text-[#2D2D2D]! focus:**:text-[#2D2D2D]! data-[highlighted]:bg-[#EBEBE6]! data-[highlighted]:text-[#2D2D2D]! data-[highlighted]:**:text-[#2D2D2D]! [&_svg]:text-[#2ea8d8] data-[highlighted]:[&_svg]:text-[#E94B3C]";
