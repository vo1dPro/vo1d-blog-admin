import { z } from 'zod';
import type { CategoryInput, TagInput } from '../../api/types';
import { key, nullableText, ordering, text } from '../../lib/validation';
export const categorySchema: z.ZodType<CategoryInput, CategoryInput> = z.object({
  key: text(100).regex(
    /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/,
    '分类标识使用小写字母、数字、连字符或下划线',
  ),
  label: text(200),
  iconKey: nullableText(100),
  ...ordering,
});
export const tagSchema: z.ZodType<TagInput, TagInput> = z.object({ slug: key, name: text(100) });
