import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { allPages, ApiError, request, setUnauthorizedHandler } from '../../src/api/client';
import { gameInitial, gameSchema } from '../../src/features/games/model';
import { articleInitial, articleSchema } from '../../src/features/articles/model';
import { bookInitial, bookSchema } from '../../src/features/books/model';
import { photoInitial, photoSchema } from '../../src/features/photos/model';
import { MarkdownPreview } from '../../src/features/articles/MarkdownPreview';
import { changedFields, safeReturnTo, toIsoDateTime, toLocalDateTime } from '../../src/lib/values';
import { reorderPayload } from '../../src/components/CollectionPage';
import { uploadImage, validateImage } from '../../src/features/media/upload-image';
import { syncUnavailable } from '../../src/features/steam/SteamPage';
import type { Game, SteamStatus } from '../../src/api/types';
afterEach(() => {
  vi.unstubAllGlobals();
  setUnauthorizedHandler(() => {});
});
const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });

describe('HTTP contract', () => {
  it('handles 204 and includes credentials without pretending to set Origin', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetch);
    expect(await request<void>('/auth/logout', { method: 'POST' })).toBeUndefined();
    const init = fetch.mock.calls[0]?.[1] as RequestInit;
    expect(init.credentials).toBe('include');
    expect(new Headers(init.headers).has('Origin')).toBe(false);
  });
  it.each([400, 401, 403, 404, 409, 413, 429, 503])(
    'keeps error %s distinct and does not retry mutations',
    async (status) => {
      const fetch = vi.fn().mockResolvedValue(json({ message: ['first', 'second'] }, status));
      vi.stubGlobal('fetch', fetch);
      await expect(request('/admin/games', { method: 'POST', json: {} })).rejects.toMatchObject({
        status,
        detail: 'first；second',
      });
      expect(fetch).toHaveBeenCalledTimes(1);
    },
  );
  it('expires private sessions, but login failures do not expire the whole app', async () => {
    const expired = vi.fn();
    setUnauthorizedHandler(expired);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => Promise.resolve(json({}, 401))),
    );
    await expect(request('/auth/login', { method: 'POST' })).rejects.toBeInstanceOf(ApiError);
    expect(expired).not.toHaveBeenCalled();
    await expect(request('/admin/games')).rejects.toBeInstanceOf(ApiError);
    expect(expired).toHaveBeenCalledOnce();
  });
  it('collects all selector pages, including the second page', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(json({ items: [{ id: 1 }], totalPages: 3 }))
      .mockResolvedValueOnce(json({ items: [{ id: 51 }], totalPages: 3 }))
      .mockResolvedValueOnce(json({ items: [{ id: 101 }], totalPages: 3 }));
    vi.stubGlobal('fetch', fetch);
    expect(await allPages('/admin/media')).toEqual([{ id: 1 }, { id: 51 }, { id: 101 }]);
    expect(fetch.mock.calls[2]?.[0]).toContain('page=3&pageSize=50');
  });
  it('does not silently return a partial selector when a later page fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(json({ items: [{ id: 1 }], totalPages: 2 }))
        .mockResolvedValueOnce(json({}, 503)),
    );
    await expect(allPages('/admin/categories')).rejects.toMatchObject({ status: 503 });
  });
});
describe('writable DTOs and meaningful empty values', () => {
  it('maps manual hours and discards Steam and read-only properties', () => {
    const item = {
      id: 7,
      title: 'Test',
      platform: null,
      coverMediaId: 1,
      rating: 0,
      playtimeHours: 100,
      manualPlaytimeHours: 0,
      likeLevel: 0,
      comment: null,
      steamAppId: 730,
      isVisible: false,
      sortOrder: 0,
      steam: { playtimeMinutes: 6000 },
    } as Game;
    const result = gameSchema.parse(gameInitial(item));
    expect(result.playtimeHours).toBe(0);
    expect(result.isVisible).toBe(false);
    expect(result.rating).toBe(0);
    expect(result.comment).toBeNull();
    for (const key of ['id', 'steam', 'manualPlaytimeHours', 'createdAt', 'updatedAt'])
      expect(result).not.toHaveProperty(key);
  });
  it('PATCH sends only changed writable fields, preserving null and false', () => {
    expect(
      changedFields(
        { steamAppId: 730 as number | null, isVisible: true, playtimeHours: 0 },
        { steamAppId: null, isVisible: false, playtimeHours: 0 },
      ),
    ).toEqual({ steamAppId: null, isVisible: false });
  });
  it('rejects missing numbers and out-of-range values', () => {
    const initial = { ...gameInitial(), title: 'Test', coverMediaId: 1 };
    for (const change of [
      { rating: 1.23 },
      { playtimeHours: -1 },
      { playtimeHours: NaN },
      { likeLevel: 6 },
    ])
      expect(gameSchema.safeParse({ ...initial, ...change }).success).toBe(false);
  });
  it('requires a timestamp for publishing, permits future scheduling', () => {
    const article = {
      ...articleInitial(),
      title: 'T',
      slug: 'test',
      summary: 'S',
      bodyMarkdown: '# T',
      categoryId: 1,
      coverMediaId: 1,
      status: 'PUBLISHED' as const,
    };
    expect(articleSchema.safeParse(article).success).toBe(false);
    expect(
      articleSchema.parse({ ...article, publishedAt: '2099-01-01T12:00' }).publishedAt,
    ).toMatch(/Z$/);
  });
  it('turns blank book source and dates into null without changing progress 0', () => {
    const book = bookSchema.parse({
      ...bookInitial(),
      title: 'T',
      author: 'A',
      coverMediaId: 1,
      sourceName: '',
      sourceUrl: '',
    });
    expect(book.sourceName).toBeNull();
    expect(book.sourceUrl).toBeNull();
    expect(book.startedAt).toBeNull();
    expect(book.progress).toBe(0);
    expect(bookSchema.safeParse({ ...book, sourceName: 'xx' }).success).toBe(false);
    expect(bookSchema.safeParse({ ...book, progress: 101 }).success).toBe(false);
  });
  it('requires different photo assets', () => {
    expect(
      photoSchema.safeParse({
        ...photoInitial(),
        title: 'T',
        alt: 'A',
        originalMediaId: 1,
        thumbnailMediaId: 1,
      }).success,
    ).toBe(false);
  });
  it('round-trips local time including seconds and milliseconds', () => {
    const date = '2026-09-05T08:23:45.123Z';
    expect(toIsoDateTime(toLocalDateTime(date))).toBe(date);
    expect(toLocalDateTime(null)).toBe('');
    expect(toIsoDateTime('')).toBeNull();
  });
  it.each(['https://evil.example', '//evil.example', '/\\evil.example', '/login', '/\n/evil'])(
    'rejects external or malformed return address %s',
    (value) => expect(safeReturnTo(value)).toBe('/'),
  );
  it('preserves internal return paths', () =>
    expect(safeReturnTo('/articles/3?tab=edit')).toBe('/articles/3?tab=edit'));
});
describe('media and safe preview', () => {
  it('never renders executable raw HTML, dangerous links or event handlers', () => {
    const html = renderToStaticMarkup(
      createElement(MarkdownPreview, {
        source:
          '<script>alert(1)</script>\n<img src=x onerror="alert(2)">\n\n[click](javascript:alert%281%29)\n\n# Safe title',
      }),
    );
    expect(html).not.toContain('<script');
    expect(html).not.toContain('onerror=');
    expect(html).not.toContain('href="javascript:');
    expect(html).toContain('Safe title');
  });
  it('validates extension, MIME and size before uploading', () => {
    expect(validateImage(new File(['x'], 'x.svg', { type: 'image/svg+xml' }))).toContain('仅支持');
    expect(
      validateImage(
        new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'x.png', { type: 'image/png' }),
      ),
    ).toContain('10 MiB');
  });
  it.each(['IMAGE', 'PHOTO'] as const)(
    'uses multipart for %s without setting Content-Type',
    async (purpose) => {
      const fetch = vi
        .fn()
        .mockResolvedValue(
          json(
            purpose === 'PHOTO'
              ? { original: { id: 1 }, thumbnail: { id: 2 } }
              : { asset: { id: 1 } },
          ),
        );
      vi.stubGlobal('fetch', fetch);
      const result = await uploadImage(
        new File(['png'], 'x.png', { type: 'image/png' }),
        purpose,
        'image',
      );
      expect(purpose === 'PHOTO' ? 'original' in result : 'asset' in result).toBe(true);
      const options = fetch.mock.calls[0]?.[1] as RequestInit;
      expect(new Headers(options.headers).has('Content-Type')).toBe(false);
      expect((options.body as FormData).get('purpose')).toBe(purpose);
    },
  );
});
describe('order and Steam', () => {
  it('creates unique global orders and protects batch limits', () => {
    const batch = reorderPayload([{ id: 51 }, { id: 2 }]);
    expect(batch.items).toEqual([
      { id: 51, sortOrder: 0 },
      { id: 2, sortOrder: 1 },
    ]);
    expect(() => reorderPayload([{ id: 1 }, { id: 1 }])).toThrow();
    expect(() => reorderPayload(Array.from({ length: 501 }, (_, id) => ({ id })))).toThrow();
  });
  it('disables sync during server cooldown or lease', () => {
    const status: SteamStatus = {
      accounts: [],
      enabled: true,
      syncing: false,
      steamId: 'account',
      intervalSeconds: 300,
      gameCount: 0,
      libraryVisible: true,
      nextSyncAt: '2099-01-01T00:00:00Z',
      lastSuccessAt: null,
      lastErrorCode: null,
    };
    expect(syncUnavailable(status)).toBe(true);
    expect(syncUnavailable({ ...status, nextSyncAt: null })).toBe(false);
    expect(syncUnavailable({ ...status, syncing: true, nextSyncAt: null })).toBe(true);
  });
});
