export const PROGRAM_DETAIL_SECTIONS = [
  { id: "about", label: "Tổng quan" },
  { id: "curriculum", label: "Chương trình học" },
  { id: "reviews", label: "Đánh giá" },
] as const;

export type ProgramDetailSectionId =
  (typeof PROGRAM_DETAIL_SECTIONS)[number]["id"];

/** Offset for scroll-into-view below fixed header + sticky section nav */
export const PROGRAM_DETAIL_SCROLL_MARGIN =
  "scroll-mt-[calc(4.5rem+3.25rem)] sm:scroll-mt-[calc(5rem+3.25rem)]";
