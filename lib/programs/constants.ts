import type { ModuleType } from "@/lib/api/entities/module";
import type { ProgramCategory, ProgramLevel } from "@/lib/api/entities/program";
import type { ProgramListQuery, ProgramReviewsQuery } from "@/lib/api/programs";
import type { SteamCategory } from "@/lib/landing/content";

export type ProgramSortOption = {
  id: string;
  label: string;
  sortBy: NonNullable<ProgramListQuery["sortBy"]>;
  isDescending: boolean;
};

export const PROGRAM_CATEGORY_ORDER: ProgramCategory[] = [
  "Science",
  "Technology",
  "Engineering",
  "Art",
  "Mathematic",
];

export const PROGRAM_CATEGORY_META: Record<
  ProgramCategory,
  {
    label: string;
    letter: string;
    color: string;
    steamKey: SteamCategory;
  }
> = {
  Science: {
    label: "Khoa học",
    letter: "S",
    color: "#E94B3C",
    steamKey: "science",
  },
  Technology: {
    label: "Công nghệ",
    letter: "T",
    color: "#7CB342",
    steamKey: "technology",
  },
  Engineering: {
    label: "Kỹ thuật",
    letter: "E",
    color: "#4FC3F7",
    steamKey: "engineering",
  },
  Art: {
    label: "Nghệ thuật",
    letter: "A",
    color: "#FDD835",
    steamKey: "arts",
  },
  Mathematic: {
    label: "Toán học",
    letter: "M",
    color: "#7E57C2",
    steamKey: "mathematics",
  },
};

export const PROGRAM_LEVEL_LABELS: Record<ProgramLevel, string> = {
  Beginner: "Cơ bản",
  Intermediate: "Trung cấp",
  Advanced: "Nâng cao",
  AllLevels: "Mọi cấp độ",
};

export const PROGRAM_LEVEL_ORDER: ProgramLevel[] = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "AllLevels",
];

export const PROGRAM_SORT_OPTIONS: ProgramSortOption[] = [
  {
    id: "rating-desc",
    label: "Đánh giá cao nhất",
    sortBy: "rating",
    isDescending: true,
  },
  {
    id: "createdAt-desc",
    label: "Mới nhất",
    sortBy: "createdAt",
    isDescending: true,
  },
  {
    id: "price-asc",
    label: "Giá thấp nhất",
    sortBy: "price",
    isDescending: false,
  },
  {
    id: "name-asc",
    label: "Tên A-Z",
    sortBy: "name",
    isDescending: false,
  },
];

export const DEFAULT_PROGRAM_QUERY: ProgramListQuery = {
  page: 1,
  pageSize: 8,
  sortBy: "rating",
  isDescending: true,
};

export const MODULE_TYPE_LABELS: Record<ModuleType, string> = {
  Theory: "Lý thuyết",
  Experiential: "Trải nghiệm",
  Research: "Nghiên cứu",
};

export type ProgramReviewSortOption = {
  id: string;
  label: string;
  sortBy: NonNullable<ProgramReviewsQuery["sortBy"]>;
  isDescending: boolean;
};

export const PROGRAM_REVIEW_SORT_OPTIONS: ProgramReviewSortOption[] = [
  {
    id: "createdAt-desc",
    label: "Mới nhất",
    sortBy: "createdAt",
    isDescending: true,
  },
  {
    id: "starRating-desc",
    label: "Điểm cao nhất",
    sortBy: "starRating",
    isDescending: true,
  },
  {
    id: "starRating-asc",
    label: "Điểm thấp nhất",
    sortBy: "starRating",
    isDescending: false,
  },
];

export const DEFAULT_PROGRAM_REVIEWS_QUERY: ProgramReviewsQuery = {
  page: 1,
  pageSize: 10,
  sortBy: "createdAt",
  isDescending: true,
};

export function getReviewSortOptionId(query: ProgramReviewsQuery): string {
  const match = PROGRAM_REVIEW_SORT_OPTIONS.find(
    (option) =>
      option.sortBy === query.sortBy &&
      option.isDescending === query.isDescending,
  );

  return match?.id ?? PROGRAM_REVIEW_SORT_OPTIONS[0].id;
}

/** @deprecated Use `DEFAULT_MIN_SKELETON_MS` from `@/lib/ui/min-skeleton-delay`. */
export { DEFAULT_MIN_SKELETON_MS as PROGRAM_GRID_MIN_SKELETON_MS } from "@/lib/ui/min-skeleton-delay";

export const PROGRAM_GRID_RHYTHM = [3, 2, 3] as const;

export type ProgramPriceParts =
  | { isFree: true; label: "Miễn phí" }
  | { isFree: false; amount: string; unit: "đ" };

export function getProgramPriceParts(price: number): ProgramPriceParts {
  if (price === 0) {
    return { isFree: true, label: "Miễn phí" };
  }

  return {
    isFree: false,
    amount: new Intl.NumberFormat("vi-VN").format(price),
    unit: "đ",
  };
}

export function formatProgramPrice(price: number): string {
  const parts = getProgramPriceParts(price);
  if (parts.isFree) return parts.label;
  return `${parts.amount} ${parts.unit}`;
}

export function getCategoryAccentColor(
  category: ProgramCategory | null | undefined,
): string {
  if (!category) {
    return "rgba(255,255,255,0.12)";
  }

  return PROGRAM_CATEGORY_META[category].color;
}

export function getSortOptionId(query: ProgramListQuery): string {
  const match = PROGRAM_SORT_OPTIONS.find(
    (option) =>
      option.sortBy === query.sortBy &&
      option.isDescending === query.isDescending,
  );

  return match?.id ?? PROGRAM_SORT_OPTIONS[0].id;
}

export function isProgramQueryFiltered(query: ProgramListQuery): boolean {
  return Boolean(
    query.search?.trim() ||
      query.category ||
      query.level ||
      query.sortBy !== DEFAULT_PROGRAM_QUERY.sortBy ||
      query.isDescending !== DEFAULT_PROGRAM_QUERY.isDescending,
  );
}

export function chunkProgramsForRhythm<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  let index = 0;
  let patternIndex = 0;

  while (index < items.length) {
    const rowSize = PROGRAM_GRID_RHYTHM[patternIndex % PROGRAM_GRID_RHYTHM.length];
    rows.push(items.slice(index, index + rowSize));
    index += rowSize;
    patternIndex += 1;
  }

  return rows;
}
