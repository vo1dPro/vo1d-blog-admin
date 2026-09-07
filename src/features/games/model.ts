import { z } from 'zod';
import type { Game, GameInput } from '../../api/types';
import { id, integer, nullableText, ordering, text } from '../../lib/validation';
export const gameSchema: z.ZodType<GameInput, GameInput> = z.object({
  title: text(200),
  platform: nullableText(100),
  coverMediaId: id,
  rating: z
    .number()
    .min(0)
    .max(10)
    .refine((value) => Math.abs(value * 10 - Math.round(value * 10)) < 1e-8, '评分最多一位小数'),
  playtimeHours: integer(),
  likeLevel: integer(0, 5),
  comment: nullableText(5000),
  steamAppId: id.nullable(),
  ...ordering,
});
export function gameInitial(item?: Game): GameInput {
  return {
    title: item?.title ?? '',
    platform: item?.platform ?? null,
    coverMediaId: item?.coverMediaId ?? 0,
    rating: item?.rating ?? 0,
    playtimeHours: item?.manualPlaytimeHours ?? 0,
    likeLevel: item?.likeLevel ?? 0,
    comment: item?.comment ?? null,
    steamAppId: item?.steamAppId ?? null,
    sortOrder: item?.sortOrder ?? 0,
    isVisible: item?.isVisible ?? true,
  };
}
