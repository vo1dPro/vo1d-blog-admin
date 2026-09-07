import { z } from 'zod';
import type { Book, BookInput } from '../../api/types';
import { date, id, integer, nullableText, nullableUrl, ordering, text } from '../../lib/validation';
import { toLocalDateTime } from '../../lib/values';
export const bookSchema: z.ZodType<BookInput, BookInput> = z.object({
  title: text(200),
  author: text(200),
  coverMediaId: id,
  accent: z.string().regex(/^#(?:[\da-f]{3}|[\da-f]{6})$/i, '请输入十六进制颜色'),
  sourceName: nullableText(100).refine(
    (value) => value?.toLowerCase() !== 'xx',
    '请填写真实来源或留空',
  ),
  sourceUrl: nullableUrl,
  readingOrder: integer(1),
  progress: integer(0, 100),
  startedAt: date,
  lastReadAt: date,
  finishedAt: date,
  ...ordering,
});
export function bookInitial(item?: Book): BookInput {
  return {
    title: item?.title ?? '',
    author: item?.author ?? '',
    coverMediaId: item?.coverMediaId ?? 0,
    accent: item?.accent ?? '#007aff',
    sourceName: item?.sourceName ?? null,
    sourceUrl: item?.sourceUrl ?? null,
    readingOrder: item?.readingOrder ?? 1,
    progress: item?.progress ?? 0,
    startedAt: toLocalDateTime(item?.startedAt),
    lastReadAt: toLocalDateTime(item?.lastReadAt),
    finishedAt: toLocalDateTime(item?.finishedAt),
    sortOrder: item?.sortOrder ?? 0,
    isVisible: item?.isVisible ?? true,
  };
}
