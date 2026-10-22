export type CreationPlatform = 'x' | 'bilibili' | 'douyin';

export interface CreationAuthor {
  name: string;
  handle?: string;
  avatarUrl?: string;
  verified?: boolean;
}

export interface CreationText {
  text: string;
  kind: 'text' | 'mention' | 'hashtag' | 'link';
}

export type CreationMedia =
  | { kind: 'image'; url: string; alt: string; width?: number; height?: number }
  | {
      kind: 'video';
      posterUrl?: string;
      url?: string;
      alt: string;
      width?: number;
      height?: number;
    };

/** Platform adapters normalize upstream responses into this model on the server.
 * No provider-specific player scripts, HTML, or credentials enter the renderer.
 */
export interface Creation {
  id: string;
  platform: CreationPlatform;
  sourceUrl: string;
  author: CreationAuthor;
  title?: string;
  article?: { id: string; url: string; title: string; excerpt: string; coverUrl?: string };
  body: CreationText[];
  textStatus?: 'complete' | 'truncated' | 'unavailable';
  media: CreationMedia[];
  publishedAt: string;
  metrics?: Partial<Record<'replies' | 'reposts' | 'quotes' | 'likes' | 'views', number>>;
  quote?: Pick<Creation, 'author' | 'body' | 'media'>;
}

export interface CreationFeed {
  version: 1;
  mode: 'preview' | 'live';
  updatedAt: string;
  items: Creation[];
}

export const creationPlatforms: Record<
  CreationPlatform,
  { label: string; hosts: readonly string[] }
> = {
  x: { label: 'X', hosts: ['x.com', 'twitter.com'] },
  bilibili: { label: '哔哩哔哩', hosts: ['bilibili.com', 'b23.tv'] },
  douyin: { label: '抖音', hosts: ['douyin.com', 'iesdouyin.com'] },
};
