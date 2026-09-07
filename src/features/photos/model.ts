import { z } from 'zod';
import type { Photo, PhotoInput } from '../../api/types';
import { date, id, ordering, text } from '../../lib/validation';
import { toLocalDateTime } from '../../lib/values';
export const photoSchema: z.ZodType<PhotoInput, PhotoInput> = z
  .object({
    originalMediaId: id,
    thumbnailMediaId: id,
    alt: text(500),
    title: text(200),
    description: z.string().max(2000),
    capturedAt: date,
    ...ordering,
  })
  .refine((value) => value.originalMediaId !== value.thumbnailMediaId, {
    path: ['thumbnailMediaId'],
    message: '展示图与缩略图必须使用不同用途的素材',
  });
export function photoInitial(item?: Photo): PhotoInput {
  return {
    originalMediaId: item?.originalMediaId ?? 0,
    thumbnailMediaId: item?.thumbnailMediaId ?? 0,
    alt: item?.alt ?? '',
    title: item?.title ?? '',
    description: item?.description ?? '',
    capturedAt: toLocalDateTime(item?.capturedAt),
    isVisible: item?.isVisible ?? true,
    sortOrder: item?.sortOrder ?? 0,
  };
}
