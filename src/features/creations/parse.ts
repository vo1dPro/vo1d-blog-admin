import { creationPlatforms } from './model';
import type {
  Creation,
  CreationAuthor,
  CreationFeed,
  CreationMedia,
  CreationPlatform,
  CreationText,
} from './model';

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('动态数据格式不正确。');
  return value as Record<string, unknown>;
}
function text(value: unknown): string {
  if (typeof value !== 'string') throw new Error('动态文字格式不正确。');
  return value;
}
function array(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error('动态列表格式不正确。');
  return value;
}
function resource(value: unknown): string {
  const url = text(value);
  // Allow same-origin assets and HTTPS media only.
  if (/^\/(?!\/)/.test(url) && !url.includes('\\')) return url;
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password)
    throw new Error('动态媒体地址不安全。');
  return parsed.href;
}
function author(value: unknown): CreationAuthor {
  const data = object(value);
  return {
    name: text(data.name),
    handle: data.handle === undefined ? undefined : text(data.handle),
    avatarUrl: data.avatarUrl === undefined ? undefined : resource(data.avatarUrl),
    verified: data.verified === true,
  };
}
function body(value: unknown): CreationText[] {
  return array(value).map((item) => {
    const data = object(item);
    if (!['text', 'mention', 'hashtag', 'link'].includes(text(data.kind)))
      throw new Error('不支持的动态文字类型。');
    return { text: text(data.text), kind: data.kind as CreationText['kind'] };
  });
}
function media(value: unknown): CreationMedia[] {
  return array(value).map((item) => {
    const data = object(item);
    const dimensions = {
      width: typeof data.width === 'number' && data.width > 0 ? data.width : undefined,
      height: typeof data.height === 'number' && data.height > 0 ? data.height : undefined,
    };
    if (data.kind === 'image')
      return { kind: 'image', url: resource(data.url), alt: text(data.alt), ...dimensions };
    if (data.kind === 'video')
      return {
        kind: 'video',
        alt: text(data.alt),
        ...dimensions,
        url: data.url === undefined ? undefined : resource(data.url),
        posterUrl: data.posterUrl === undefined ? undefined : resource(data.posterUrl),
      };
    throw new Error('不支持的动态媒体类型。');
  });
}
export function parseCreationFeed(value: unknown): CreationFeed {
  const data = object(value);
  if (data.version !== 1 || (data.mode !== 'preview' && data.mode !== 'live'))
    throw new Error('动态接口版本不支持。');
  const items: Creation[] = array(data.items).map((item) => {
    const post = object(item);
    const platform = text(post.platform);
    if (!Object.hasOwn(creationPlatforms, platform)) throw new Error('不支持的内容平台。');
    const key = platform as CreationPlatform;
    const source = new URL(text(post.sourceUrl));
    if (
      source.protocol !== 'https:' ||
      source.username ||
      source.password ||
      !creationPlatforms[key].hosts.some(
        (host) => source.hostname === host || source.hostname.endsWith(`.${host}`),
      )
    ) {
      throw new Error('动态原文地址与平台不匹配。');
    }
    const quote = post.quote === undefined ? undefined : object(post.quote);
    const article = post.article === undefined ? undefined : object(post.article);
    if (
      article &&
      (key !== 'x' ||
        !/^\d{10,25}$/.test(text(article.id)) ||
        article.url !== `https://x.com/i/article/${article.id}`)
    )
      throw new Error('文章地址不正确。');
    const publishedAt = text(post.publishedAt);
    const metrics: Creation['metrics'] = {};
    if (post.metrics !== undefined) {
      const values = object(post.metrics);
      for (const key of ['replies', 'reposts', 'quotes', 'likes', 'views'] as const) {
        const value = values[key];
        if (value === undefined) continue;
        if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0)
          throw new Error('动态计数格式不正确。');
        metrics[key] = value;
      }
    }
    if (!Number.isFinite(Date.parse(publishedAt))) throw new Error('动态发布时间不正确。');
    return {
      id: text(post.id),
      platform: key,
      sourceUrl: source.href,
      author: author(post.author),
      publishedAt,
      metrics,
      title: post.title === undefined ? undefined : text(post.title),
      article: article
        ? {
            id: text(article.id),
            url: text(article.url),
            title: text(article.title),
            excerpt: text(article.excerpt),
            coverUrl: article.coverUrl === undefined ? undefined : resource(article.coverUrl),
          }
        : undefined,
      body: body(post.body),
      media: media(post.media),
      textStatus:
        post.textStatus === 'complete' ||
        post.textStatus === 'truncated' ||
        post.textStatus === 'unavailable'
          ? post.textStatus
          : undefined,
      quote: quote
        ? { author: author(quote.author), body: body(quote.body), media: media(quote.media) }
        : undefined,
    };
  });
  if (new Set(items.map((item) => `${item.platform}:${item.id}`)).size !== items.length)
    throw new Error('动态列表包含重复内容。');
  return { version: 1, mode: data.mode, updatedAt: text(data.updatedAt), items };
}
