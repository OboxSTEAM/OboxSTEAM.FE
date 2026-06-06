import { z } from "zod";

export function createPaginatedSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    currentPage: z.number(),
    totalPages: z.number(),
    pageSize: z.number(),
    totalCount: z.number(),
    hasPrevious: z.boolean(),
    hasNext: z.boolean(),
  });
}

export type Paginated<T> = {
  items: T[];
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  hasPrevious: boolean;
  hasNext: boolean;
};
