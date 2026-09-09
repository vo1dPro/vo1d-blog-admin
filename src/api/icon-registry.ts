import { allPages } from './client';
import type { Skill, SocialLink } from './types';

export type IconPair = Pick<Skill, 'icon' | 'darkIcon'>;

// Compatibility keys only; image URLs and theme variants always come from the backend.
const aliases: Record<string, string> = {
  html: 'html5',
  css: 'css-old',
  claude: 'claude-ai',
  'ant-design-dark-theme': 'ant-design',
};

export async function loadIconRegistry(signal: AbortSignal): Promise<Record<string, IconPair>> {
  const [skills, socials] = await Promise.all([
    allPages<Skill>('/admin/skills', signal),
    allPages<SocialLink>('/admin/social-links', signal),
  ]);
  const registry: Record<string, IconPair> = Object.create(null) as Record<string, IconPair>;
  const ambiguous = new Set<string>();
  for (const row of [...skills, ...socials]) {
    if (!row.iconKey || row.iconKey === 'custom' || (!row.icon && !row.darkIcon)) continue;
    const previous = registry[row.iconKey];
    if (
      previous &&
      (previous.icon?.id !== row.icon?.id || previous.darkIcon?.id !== row.darkIcon?.id)
    ) {
      ambiguous.add(row.iconKey);
    }
    registry[row.iconKey] = { icon: row.icon ?? null, darkIcon: row.darkIcon ?? null };
  }
  for (const key of ambiguous) delete registry[key];
  for (const [alias, key] of Object.entries(aliases)) {
    if (!registry[alias] && registry[key]) registry[alias] = registry[key];
  }
  return registry;
}
