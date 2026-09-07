import { z } from 'zod';
import type { SiteInput, SkillInput, SocialInput } from '../../api/types';
import { id, key, ordering, text, url } from '../../lib/validation';
export const siteSchema: z.ZodType<SiteInput, SiteInput> = z.object({
  displayName: text(120),
  role: text(160),
  heroTitlePrefix: text(160),
  heroDescription: text(2000),
  learningNote: text(4000),
  footerMessage: text(500),
  avatarMediaId: id.nullable(),
});
export const skillSchema: z.ZodType<SkillInput, SkillInput> = z.object({
  name: text(200),
  iconKey: key,
  iconMediaId: id.nullable().optional(),
  darkIconMediaId: id.nullable().optional(),
  ...ordering,
});
export const socialSchema: z.ZodType<SocialInput, SocialInput> = z.object({
  name: text(200),
  platform: key,
  url,
  iconKey: key,
  iconMediaId: id.nullable().optional(),
  darkIconMediaId: id.nullable().optional(),
  ...ordering,
});
