import type { Page, Route } from '@playwright/test';
export const tinyPng =
  'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAO0lEQVRIiWPgqHhNU8QwakHFaBC9Hk1FHKMZ7fVoUcExWppWjFY4HKNVZsVoq+L1aMOrYrTp+HpQt64BQ8+sTIZmAk8AAAAASUVORK5CYII=';
const date = '2026-09-05T08:20:00.000Z';
export const medium = {
  id: 1,
  url: `data:image/png;base64,${tinyPng}`,
  mimeType: 'image/webp',
  sizeBytes: 200,
  width: 40,
  height: 40,
  altText: '测试图片',
  kind: 'IMAGE',
  createdAt: date,
};
export const category = {
  id: 1,
  key: 'technology',
  label: '技术',
  iconKey: 'Code2',
  sortOrder: 0,
  isVisible: true,
  createdAt: date,
  updatedAt: date,
};
export const game = {
  id: 1,
  title: '测试游戏',
  platform: null,
  coverMediaId: 1,
  cover: medium,
  rating: 0,
  playtimeHours: 7,
  manualPlaytimeHours: 7,
  likeLevel: 0,
  comment: null,
  steamAppId: 730,
  steam: {
    appId: 730,
    name: 'Steam Test',
    playtimeMinutes: 6000,
    playtimeTwoWeeksMinutes: null,
    lastPlayedAt: null,
    syncedAt: date,
    stale: false,
    storeUrl: 'https://store.steampowered.com/app/730',
  },
  isVisible: false,
  sortOrder: 0,
  createdAt: date,
  updatedAt: date,
};
export const article = {
  id: 1,
  title: '测试文章',
  slug: 'test-article',
  summary: '摘要',
  bodyMarkdown: '# 测试标题',
  categoryId: 1,
  category,
  tags: [],
  tagIds: [],
  coverMediaId: 1,
  cover: medium,
  status: 'DRAFT',
  publishedAt: null,
  readingTimeMinutes: 5,
  seoTitle: null,
  seoDescription: null,
  createdAt: date,
  updatedAt: date,
};
type Row = { id: number; [key: string]: unknown };
export interface MockState {
  authenticated: boolean;
  data: Record<string, Row[]>;
  writes: { path: string; body: Record<string, unknown>; method: string }[];
  expired: boolean;
}
export async function respond(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    headers: {
      'Access-Control-Allow-Origin': 'http://localhost:5174',
      'Access-Control-Allow-Credentials': 'true',
      'Content-Type': 'application/json',
    },
    body: status === 204 ? undefined : JSON.stringify(body),
  });
}
export async function mockApi(page: Page, authenticated = true) {
  const state: MockState = {
    authenticated,
    expired: false,
    writes: [],
    data: {
      articles: [structuredClone(article)],
      categories: [
        structuredClone(category),
        { ...category, id: 2, key: 'life', label: '生活', sortOrder: 1 },
      ],
      tags: [{ id: 1, name: '标签一', slug: 'tag-one' }],
      games: [structuredClone(game)],
      books: [],
      photos: [],
      skills: [{ id: 1, name: 'React', iconKey: 'react', sortOrder: 0, isVisible: true }],
      'social-links': [],
      media: [structuredClone(medium)],
    },
  };
  await page.route('http://localhost:3100/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();
    if (method === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': 'http://localhost:5174',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Headers': 'Content-Type,Accept',
          'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
        },
      });
      return;
    }
    if (path === '/auth/login') {
      const data = route.request().postDataJSON() as { email: string; password: string };
      if (data.email === 'fail@example.test') {
        await respond(route, { message: 'Invalid email or password' }, 401);
        return;
      }
      state.authenticated = true;
      await respond(route, { admin: { id: 1, email: data.email } });
      return;
    }
    if (!state.authenticated || state.expired) {
      await respond(route, { message: 'Session expired' }, 401);
      return;
    }
    if (path === '/auth/me') {
      await respond(route, { id: 1, email: 'demo@example.test' });
      return;
    }
    if (path === '/auth/logout') {
      state.authenticated = false;
      await respond(route, null, 204);
      return;
    }
    if (path === '/admin/steam/status') {
      await respond(route, {
        enabled: true,
        steamId: 'test-account',
        intervalSeconds: 300,
        syncing: false,
        libraryVisible: true,
        gameCount: 51,
        lastSuccessAt: date,
        nextSyncAt: null,
        lastErrorCode: null,
      });
      return;
    }
    if (path === '/admin/steam/library') {
      const number = Number(url.searchParams.get('page') ?? 1);
      await respond(route, {
        items: [
          {
            appId: number === 1 ? 730 : 999,
            name: number === 1 ? 'Steam Test' : '第二页 Steam 游戏',
            playtimeMinutes: 6000,
            playtimeTwoWeeksMinutes: null,
            lastPlayedAt: null,
            syncedAt: date,
            stale: false,
            storeUrl: 'https://store.steampowered.com',
          },
        ],
        page: number,
        pageSize: 50,
        total: 51,
        totalPages: 2,
      });
      return;
    }
    if (path === '/admin/site-profile') {
      await respond(route, {
        id: 1,
        displayName: 'vo1d',
        role: 'Developer',
        heroTitlePrefix: 'Hi',
        heroDescription: '介绍',
        learningNote: '学习',
        footerMessage: '页脚',
        avatarMediaId: null,
        avatar: null,
        createdAt: date,
        updatedAt: date,
      });
      return;
    }
    const [, , resource, rawId] = path.split('/');
    if (!resource) {
      await respond(route, {}, 404);
      return;
    }
    const rows = state.data[resource] ?? [];
    if (method === 'GET') {
      if (rawId) {
        await respond(
          route,
          rows.find((item) => item.id === Number(rawId)) ?? {},
          rows.some((item) => item.id === Number(rawId)) ? 200 : 404,
        );
        return;
      }
      const number = Number(url.searchParams.get('page') ?? 1);
      const size = Number(url.searchParams.get('pageSize') ?? 10);
      await respond(route, {
        items: rows.slice((number - 1) * size, number * size),
        page: number,
        pageSize: size,
        total: rows.length,
        totalPages: Math.ceil(rows.length / size),
      });
      return;
    }
    const body: Record<string, unknown> =
      method === 'DELETE' ? {} : (route.request().postDataJSON() as Record<string, unknown>);
    state.writes.push({ path, method, body });
    if (method === 'DELETE') {
      state.data[resource] = rows.filter((item) => item.id !== Number(rawId));
      await respond(route, null, 204);
      return;
    }
    if (rawId === 'reorder') {
      for (const entry of body.items as { id: number; sortOrder: number }[]) {
        const row = rows.find((item) => item.id === entry.id);
        if (row) row.sortOrder = entry.sortOrder;
      }
      rows.sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder));
      await respond(route, null, 204);
      return;
    }
    if (method === 'PATCH') {
      const row = rows.find((item) => item.id === Number(rawId));
      if (row) Object.assign(row, body);
      await respond(route, row);
      return;
    }
    const row = { ...body, id: 100 + rows.length, createdAt: date, updatedAt: date };
    rows.push(row);
    state.data[resource] = rows;
    await respond(route, row, 201);
  });
  return state;
}
