import { z } from 'zod';
import { toIsoDateTime } from './values';
export const text = (max: number) =>
  z.string().trim().min(1, '不能为空').max(max, `最多 ${max} 个字符`);
export const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((value) => (value === '' ? null : value));
export const integer = (min = 0, max = 2147483647) =>
  z.number('请输入数字').int('请输入整数').min(min, `不能小于 ${min}`).max(max, `不能大于 ${max}`);
export const id = integer(1);
export const key = text(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, '仅允许小写字母、数字和连字符');
export const date = z
  .string()
  .nullable()
  .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), '请输入有效日期')
  .transform(toIsoDateTime);
export const url = text(2048).refine((value) => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}, '请输入完整的 http 或 https 地址');
export const nullableUrl = z
  .string()
  .nullable()
  .transform((value) => value?.trim() || null)
  .pipe(url.nullable());
export const ordering = { sortOrder: integer(), isVisible: z.boolean() };
