import { z } from "zod";

import {
  portfolioItemSpanSchema,
  portfolioItemTypeSchema,
  portfolioLinkSchema,
  portfolioSectionKindSchema,
  portfolioThemeSchema,
} from "@/lib/api/entities/portfolio";

export const portfolioItemIdParamSchema = z.object({
  itemId: z.string().uuid("ID mục portfolio không hợp lệ."),
});

export const portfolioSectionIdParamSchema = z.object({
  sectionId: z.string().uuid("ID section portfolio không hợp lệ."),
});

export const portfolioMediaIdParamSchema = z.object({
  mediaId: z.string().uuid("ID media portfolio không hợp lệ."),
});

export const portfolioSubdomainParamSchema = z.object({
  subdomain: z.string().min(1, "Subdomain là bắt buộc."),
});

/** Query for `GET /api/portfolios/subdomain-available`. */
export const portfolioSubdomainAvailabilityQuerySchema = z.object({
  subdomain: z.string().min(1, "Subdomain là bắt buộc."),
});

/** Attach media by uploaded id (item or section gallery). */
export const portfolioMediaAssetRefSchema = z.object({
  id: z.string().uuid("ID media không hợp lệ.").nullable().optional(),
  caption: z.string().max(255, "Chú thích tối đa 255 ký tự.").nullable().optional(),
  displayOrder: z.number().int().min(0).max(2147483647).optional(),
});

/** Body for `PUT /api/portfolios/me` — profile, theme, and links only. */
export const updatePortfolioSchema = z.object({
  displayName: z.string().max(255, "Tên hiển thị tối đa 255 ký tự.").nullable().optional(),
  headline: z.string().max(255, "Tiêu đề tối đa 255 ký tự.").nullable().optional(),
  tagline: z.string().max(255, "Tagline tối đa 255 ký tự.").nullable().optional(),
  summary: z.string().nullable().optional(),
  avatarUrl: z
    .string()
    .max(500, "URL avatar tối đa 500 ký tự.")
    .url("URL avatar không hợp lệ.")
    .nullable()
    .optional(),
  coverImageUrl: z
    .string()
    .max(500, "URL ảnh bìa tối đa 500 ký tự.")
    .url("URL ảnh bìa không hợp lệ.")
    .nullable()
    .optional(),
  theme: portfolioThemeSchema.optional(),
  links: z.array(portfolioLinkSchema).nullable().optional(),
});

/** Body for `PUT /api/portfolios/me/subdomain`. Send null/blank to clear while unpublished. */
export const updatePortfolioSubdomainSchema = z.object({
  subdomain: z.string().max(100, "Subdomain tối đa 100 ký tự.").nullable().optional(),
});

/** Body for `PUT /api/portfolios/me/publication`. */
export const updatePortfolioPublicationSchema = z.object({
  isPublished: z.boolean(),
});

/** Body for `POST /api/portfolios/me/items`. */
export const createPortfolioItemSchema = z.object({
  itemType: portfolioItemTypeSchema,
  title: z.string().min(1, "Tiêu đề là bắt buộc.").max(255, "Tiêu đề tối đa 255 ký tự."),
  subtitle: z.string().max(255, "Phụ đề tối đa 255 ký tự.").nullable().optional(),
  organization: z.string().max(255, "Tổ chức tối đa 255 ký tự.").nullable().optional(),
  description: z.string().nullable().optional(),
  studentEditedBody: z.string().nullable().optional(),
  mediaUrl: z.string().nullable().optional(),
  externalUrl: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  displayOrder: z.number().int().min(0).max(2147483647).nullable().optional(),
  isVisible: z.boolean().nullable().optional(),
  accentColor: z.string().max(20, "Màu nhấn tối đa 20 ký tự.").nullable().optional(),
  isFeatured: z.boolean().nullable().optional(),
  span: portfolioItemSpanSchema.nullable().optional(),
  mediaAssets: z.array(portfolioMediaAssetRefSchema).nullable().optional(),
});

/** Body for `PUT /api/portfolios/me/items/{itemId}`. */
export const updatePortfolioItemSchema = z.object({
  title: z.string().max(255, "Tiêu đề tối đa 255 ký tự.").nullable().optional(),
  subtitle: z.string().max(255, "Phụ đề tối đa 255 ký tự.").nullable().optional(),
  organization: z.string().max(255, "Tổ chức tối đa 255 ký tự.").nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  studentEditedBody: z.string().nullable().optional(),
  mediaUrl: z.string().nullable().optional(),
  externalUrl: z.string().nullable().optional(),
  displayOrder: z.number().int().min(0).max(2147483647).nullable().optional(),
  isVisible: z.boolean().nullable().optional(),
  accentColor: z.string().max(20, "Màu nhấn tối đa 20 ký tự.").nullable().optional(),
  isFeatured: z.boolean().nullable().optional(),
  span: portfolioItemSpanSchema.nullable().optional(),
  mediaAssets: z.array(portfolioMediaAssetRefSchema).nullable().optional(),
});

const reorderPortfolioItemEntrySchema = z.object({
  id: z.string().uuid("ID mục portfolio không hợp lệ."),
  displayOrder: z
    .number()
    .int()
    .min(0, "Thứ tự hiển thị không được âm.")
    .max(2147483647),
});

/** Body for `PUT /api/portfolios/me/items/reorder`. */
export const reorderPortfolioItemsSchema = z.object({
  items: z.array(reorderPortfolioItemEntrySchema).min(1, "Danh sách mục không được trống."),
});

/** Body for `POST /api/portfolios/me/sections`. */
export const createPortfolioSectionSchema = z.object({
  kind: portfolioSectionKindSchema,
  title: z.string().max(255, "Tiêu đề section tối đa 255 ký tự.").nullable().optional(),
  displayOrder: z.number().int().min(0).max(2147483647).nullable().optional(),
  isVisible: z.boolean().nullable().optional(),
  contentHtml: z.string().nullable().optional(),
  settingsJson: z.string().max(2000, "Settings tối đa 2000 ký tự.").nullable().optional(),
  mediaAssets: z.array(portfolioMediaAssetRefSchema).nullable().optional(),
});

/** Body for `PUT /api/portfolios/me/sections/{sectionId}`. */
export const updatePortfolioSectionSchema = z.object({
  title: z.string().max(255, "Tiêu đề section tối đa 255 ký tự.").nullable().optional(),
  displayOrder: z.number().int().min(0).max(2147483647).nullable().optional(),
  isVisible: z.boolean().nullable().optional(),
  contentHtml: z.string().nullable().optional(),
  settingsJson: z.string().max(2000, "Settings tối đa 2000 ký tự.").nullable().optional(),
  mediaAssets: z.array(portfolioMediaAssetRefSchema).nullable().optional(),
});

const reorderPortfolioSectionEntrySchema = z.object({
  id: z.string().uuid("ID section portfolio không hợp lệ."),
  displayOrder: z
    .number()
    .int()
    .min(0, "Thứ tự hiển thị không được âm.")
    .max(2147483647),
});

/** Body for `PUT /api/portfolios/me/sections/reorder`. */
export const reorderPortfolioSectionsSchema = z.object({
  sections: z
    .array(reorderPortfolioSectionEntrySchema)
    .min(1, "Danh sách section không được trống."),
});

export type PortfolioItemIdParam = z.infer<typeof portfolioItemIdParamSchema>;
export type PortfolioSectionIdParam = z.infer<typeof portfolioSectionIdParamSchema>;
export type PortfolioMediaIdParam = z.infer<typeof portfolioMediaIdParamSchema>;
export type PortfolioSubdomainParam = z.infer<typeof portfolioSubdomainParamSchema>;
export type PortfolioSubdomainAvailabilityQuery = z.infer<
  typeof portfolioSubdomainAvailabilityQuerySchema
>;
export type PortfolioMediaAssetRef = z.infer<typeof portfolioMediaAssetRefSchema>;
export type UpdatePortfolioInput = z.infer<typeof updatePortfolioSchema>;
export type UpdatePortfolioSubdomainInput = z.infer<typeof updatePortfolioSubdomainSchema>;
export type UpdatePortfolioPublicationInput = z.infer<typeof updatePortfolioPublicationSchema>;
export type CreatePortfolioItemInput = z.infer<typeof createPortfolioItemSchema>;
export type UpdatePortfolioItemInput = z.infer<typeof updatePortfolioItemSchema>;
export type ReorderPortfolioItemsInput = z.infer<typeof reorderPortfolioItemsSchema>;
export type CreatePortfolioSectionInput = z.infer<typeof createPortfolioSectionSchema>;
export type UpdatePortfolioSectionInput = z.infer<typeof updatePortfolioSectionSchema>;
export type ReorderPortfolioSectionsInput = z.infer<typeof reorderPortfolioSectionsSchema>;
