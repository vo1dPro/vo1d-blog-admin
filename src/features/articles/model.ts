import { z } from 'zod';
import type { Article, ArticleInput } from '../../api/types';
import { date, id, integer, nullableText, text } from '../../lib/validation';
import { toLocalDateTime } from '../../lib/values';
export const articleSchema: z.ZodType<ArticleInput, ArticleInput> = z
  .object({
    title: text(300),
    slug: text(200).regex(
      /^(?=.*[a-z])[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'slug 需包含英文字母，使用小写字母、数字和连字符',
    ),
    summary: text(1000),
    bodyMarkdown: z.string().min(1).max(1000000),
    categoryId: id,
    coverMediaId: id,
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
    publishedAt: date,
    readingTimeMinutes: integer(1, 1440),
    seoTitle: nullableText(300),
    seoDescription: nullableText(1000),
    tagIds: z.array(id).max(100),
  })
  .superRefine((value, context) => {
    if (value.status === 'PUBLISHED' && !value.publishedAt)
      context.addIssue({ code: 'custom', path: ['publishedAt'], message: '发布必须设置发布时间' });
  });
export function articleInitial(item?: Article): ArticleInput {
  return {
    title: item?.title ?? '',
    slug: item?.slug ?? '',
    summary: item?.summary ?? '',
    bodyMarkdown: item?.bodyMarkdown ?? '',
    categoryId: item?.categoryId ?? 0,
    coverMediaId: item?.coverMediaId ?? 0,
    status: item?.status ?? 'DRAFT',
    publishedAt: toLocalDateTime(item?.publishedAt),
    readingTimeMinutes: item?.readingTimeMinutes ?? 5,
    seoTitle: item?.seoTitle ?? null,
    seoDescription: item?.seoDescription ?? null,
    tagIds: item?.tagIds ?? [],
  };
}
export function articleStatus(item: Pick<Article, 'status' | 'publishedAt' | 'category'>) {
  if (item.status === 'DRAFT') return '草稿';
  if (item.status === 'ARCHIVED') return '已归档';
  if (!item.category.isVisible) return '分类隐藏';
  if (item.publishedAt && new Date(item.publishedAt).getTime() > Date.now()) return '定时公开';
  return '已发布';
}
