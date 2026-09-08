import { test, expect, type APIRequestContext } from '@playwright/test';
import { randomBytes } from 'node:crypto';
import { createLiveAdmin } from './live-fixture';
import { tinyPng } from './mock-api';
import type { Page as ApiPage } from '../../src/api/client';
import type { Article, Game, Media, SteamGame, SteamStatus } from '../../src/api/types';
import { gameInitial } from '../../src/features/games/model';
import { mkdir, writeFile } from 'node:fs/promises';

const base = 'http://localhost:3100';
const origin = { Origin: 'http://localhost:5174' };

test('真实后端：图标上传替换、深浅主题、媒体保护和多账号明细', async ({ page, context }) => {
  test.setTimeout(90000);
  const admin = createLiveAdmin();
  const records: { resource: string; id: number }[] = [];
  const mediaIds: number[] = [];
  try {
    await page.goto('/login');
    await page.getByLabel('邮箱', { exact: true }).fill(admin.email);
    await page.getByLabel('密码', { exact: true }).fill(admin.password);
    await page.getByRole('button', { name: '进入工作台' }).click();
    await expect(page).not.toHaveURL(/login/);
    await page.goto('/skills/new');
    await page.getByLabel('技能名称', { exact: true }).fill('临时图标验证');
    await page.getByRole('button', { name: '选择浅色背景图标 / 通用', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('input[type=file]').setInputFiles({
      name: 'test.svg',
      mimeType: 'image/svg+xml',
      buffer: Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="12" fill="#3366ff"/></svg>',
      ),
    });
    const uploadResponse = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === '/admin/media/images' &&
        response.request().method() === 'POST',
    );
    await dialog.getByRole('button', { name: '开始上传' }).click();
    const upload = await uploadResponse;
    expect(upload.status()).toBe(201);
    const media = (await upload.json()) as { asset: { id: number; url: string; mimeType: string } };
    mediaIds.push(media.asset.id);
    expect(media.asset.mimeType).toBe('image/webp');
    await expect(dialog.getByRole('status')).toContainText('上传成功');
    // Selecting the freshly uploaded item closes the media picker.
    await dialog.getByRole('button', { name: `选择素材 ${media.asset.id}`, exact: true }).click();
    const createResponse = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === '/admin/skills' &&
        response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: '创建并保存' }).click();
    const created = await createResponse;
    expect(created.status()).toBe(201);
    const skill = (await created.json()) as { id: number; iconMediaId: number };
    records.push({ resource: 'skills', id: skill.id });
    expect(skill.iconMediaId).toBe(media.asset.id);
    const inUse = await context.request.delete(`${base}/admin/media/${media.asset.id}`, {
      headers: origin,
    });
    expect(inUse.status()).toBe(409);
    await expect(page.locator('.media-selection img').first()).toBeVisible();
    const dark = await context.request.patch(`${base}/admin/skills/${skill.id}`, {
      headers: origin,
      data: { darkIconMediaId: media.asset.id },
    });
    expect(dark.status()).toBe(200);
    await page.reload();
    await expect(page.locator('.media-selection img')).toHaveCount(2);
    await mkdir('docs/screenshots', { recursive: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({ path: 'docs/screenshots/icon-editor-desktop.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: 'docs/screenshots/icon-editor-mobile.png', fullPage: true });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/steam');
    const status = (await (
      await context.request.get(`${base}/admin/steam/status`)
    ).json()) as SteamStatus;
    expect(status.accounts.length).toBeGreaterThanOrEqual(1);
    for (const account of status.accounts)
      await expect(page.getByRole('cell', { name: account.steamId, exact: true })).toBeVisible();
    await page.screenshot({ path: 'docs/screenshots/steam-accounts.png', fullPage: true });
  } finally {
    admin.cleanupContent(records, mediaIds);
    admin.cleanup();
  }
});
async function all<T>(api: APIRequestContext, path: string) {
  const items: T[] = [];
  let totalPages = 1;
  for (let page = 1; page <= totalPages; page++) {
    const response = await api.get(`${base}${path}?page=${page}&pageSize=50`);
    expect(response.status()).toBe(200);
    const body = (await response.json()) as ApiPage<T>;
    totalPages = body.totalPages;
    items.push(...body.items);
  }
  return items;
}
test('真实后端：认证、完整管理读写、图片与照片、Steam 关联、数据清理及桌面窄屏验证', async ({
  page,
  context,
}) => {
  test.setTimeout(180000);
  const admin = createLiveAdmin();
  const api = context.request;
  const prefix = `admin-e2e-${randomBytes(8).toString('hex')}`;
  const records: { resource: string; id: number }[] = [];
  const mediaIds: number[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  const resources = [
    'articles',
    'categories',
    'tags',
    'books',
    'games',
    'photos',
    'skills',
    'social-links',
    'media',
  ];
  const before: Record<string, number[]> = {};
  async function login() {
    await page.goto('/login');
    await page.getByLabel('邮箱', { exact: true }).fill(admin.email);
    await page.getByLabel('密码', { exact: true }).fill(admin.password);
    await page.getByRole('button', { name: '进入工作台' }).click();
    await expect(page).not.toHaveURL(/login/);
  }
  async function create(resource: string, data: object) {
    const response = await api.post(`${base}/admin/${resource}`, { data, headers: origin });
    expect(response.status()).toBe(201);
    const item = (await response.json()) as { id: number };
    records.push({ resource, id: item.id });
    return item;
  }
  async function trackUiCreate(resource: string, action: () => Promise<void>) {
    const wait = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === `/admin/${resource}` &&
        response.request().method() === 'POST',
    );
    await action();
    const response = await wait;
    expect(response.status()).toBe(201);
    const result = (await response.json()) as { id: number };
    records.push({ resource, id: result.id });
    return result;
  }
  let beforeGames: Game[] = [];
  let liveSummary: Record<string, unknown> = {};
  try {
    await page.goto('/games');
    await expect(page).toHaveURL(/login/);
    await page.getByLabel('邮箱', { exact: true }).fill(admin.email);
    await page.getByLabel('密码', { exact: true }).fill(randomBytes(24).toString('hex'));
    await page.getByRole('button', { name: '进入工作台' }).click();
    await expect(page.getByRole('alert')).toContainText('邮箱或密码错误');
    await page.getByLabel('密码', { exact: true }).fill(admin.password);
    await page.getByRole('button', { name: '进入工作台' }).click();
    await expect(page).toHaveURL('/games');
    for (const resource of resources)
      before[resource] = (await all<{ id: number }>(api, `/admin/${resource}`))
        .map((item) => item.id)
        .sort((a, b) => a - b);
    beforeGames = await all<Game>(api, '/admin/games');
    const statusResponse = await api.get(`${base}/admin/steam/status`);
    expect(statusResponse.status()).toBe(200);
    const steamStatus = (await statusResponse.json()) as SteamStatus;
    const library = await all<SteamGame>(api, '/admin/steam/library');
    // Capture real data, never a mocked overview.
    await page.goto('/');
    await expect(page.getByRole('heading', { name: '概览', exact: true })).toBeVisible();
    await expect(page.getByText('最近编辑', { exact: true })).toBeVisible();
    await page.setViewportSize({ width: 1440, height: 1050 });
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'light';
      localStorage.setItem('admin-theme', 'light');
    });
    await page.reload();
    await expect(page.getByRole('link', { name: '管理游戏' })).toBeVisible();
    await page.screenshot({
      path: 'docs/screenshots/overview-light.png',
      fullPage: true,
      animations: 'disabled',
    });
    await page.getByRole('button', { name: '切换深色主题' }).click();
    await page.screenshot({
      path: 'docs/screenshots/overview-dark.png',
      fullPage: true,
      animations: 'disabled',
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: 'docs/screenshots/overview-mobile.png',
      fullPage: true,
      animations: 'disabled',
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.setViewportSize({ width: 1440, height: 1050 });
    await page.getByRole('button', { name: '切换浅色主题' }).click();
    // Real IMAGE upload from the browser.
    await page.goto('/media');
    await page.getByRole('button', { name: '上传素材', exact: true }).click();
    await page.getByLabel('选择图片文件', { exact: true }).setInputFiles({
      name: `${prefix}.png`,
      mimeType: 'image/png',
      buffer: Buffer.from(tinyPng, 'base64'),
    });
    const uploadWait = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === '/admin/media/images' &&
        response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: '开始上传' }).click();
    const upload = await uploadWait;
    expect(upload.status()).toBe(201);
    const uploaded = (await upload.json()) as { asset: Media };
    mediaIds.push(uploaded.asset.id);
    await expect(page.getByRole('status')).toContainText('上传成功');
    expect((await api.get(uploaded.asset.url)).status()).toBe(200);
    await page.getByRole('button', { name: '关闭弹窗' }).click();
    // Category creation and visibility, then tag through the actual form.
    await page.goto('/categories/new');
    await page.getByLabel('分类名称', { exact: true }).fill(prefix);
    await page.getByLabel('分类标识', { exact: true }).fill(prefix);
    const category = await trackUiCreate('categories', () =>
      page.getByRole('button', { name: '创建并保存' }).click(),
    );
    await expect(page).toHaveURL(`/categories/${category.id}`);
    await page.goto('/tags/new');
    await page.getByLabel('标签名称', { exact: true }).fill(prefix);
    await page.getByLabel('slug', { exact: true }).fill(prefix);
    const tag = await trackUiCreate('tags', () =>
      page.getByRole('button', { name: '创建并保存' }).click(),
    );
    await expect(page).toHaveURL(`/tags/${tag.id}`);
    await page.goto('/articles/new');
    await page.getByLabel('标题', { exact: true }).fill(prefix);
    await page.getByLabel('slug', { exact: true }).fill(prefix);
    await page.getByLabel('摘要', { exact: true }).fill('真实联调临时文章');
    await page
      .getByLabel('Markdown 正文')
      .fill('# 验证标题\n\n真实后端保存。\n<script>window.hacked=1</script>');
    await page.getByLabel('分类', { exact: true }).selectOption(String(category.id));
    await page.getByLabel(prefix, { exact: true }).check();
    await page.getByRole('button', { name: '选择封面' }).click();
    await page.getByRole('button', { name: `选择素材 ${uploaded.asset.id}`, exact: true }).click();
    const article = await trackUiCreate('articles', () =>
      page.getByRole('button', { name: '创建并保存' }).click(),
    );
    await expect(page).toHaveURL(`/articles/${article.id}`);
    expect((await api.get(`${base}/articles/${prefix}`)).status()).toBe(404);
    const articleBody = (await (
      await api.get(`${base}/admin/articles/${article.id}`)
    ).json()) as Article;
    expect(articleBody.bodyMarkdown).toContain('# 验证标题');
    expect(articleBody).not.toHaveProperty('contentHtml');
    const refDelete = await api.delete(`${base}/admin/media/${uploaded.asset.id}`, {
      headers: origin,
    });
    expect(refDelete.status()).toBe(409);
    expect(
      (await api.delete(`${base}/admin/categories/${category.id}`, { headers: origin })).status(),
    ).toBe(409);
    await page.getByLabel('文章状态').selectOption('PUBLISHED');
    await page.getByLabel('发布时间', { exact: true }).fill('2026-01-01T12:00');
    await page.getByRole('button', { name: '保存更改' }).click();
    await expect(page.getByRole('status')).toContainText('保存成功');
    const publicArticle = await api.get(`${base}/articles/${prefix}`);
    expect(publicArticle.status()).toBe(200);
    expect(((await publicArticle.json()) as { contentHtml: string }).contentHtml).not.toContain(
      '<script',
    );
    // A conflicting slug fails and retains the entered title.
    await page.goto('/articles/new');
    await page.getByLabel('标题', { exact: true }).fill(`${prefix}-conflict`);
    await page.getByLabel('slug', { exact: true }).fill(prefix);
    await page.getByLabel('摘要', { exact: true }).fill('冲突测试');
    await page.getByLabel('Markdown 正文').fill('# Test');
    await page.getByLabel('分类', { exact: true }).selectOption(String(category.id));
    await page.getByRole('button', { name: '选择封面' }).click();
    await page.getByRole('button', { name: `选择素材 ${uploaded.asset.id}`, exact: true }).click();
    await page.getByRole('button', { name: '创建并保存' }).click();
    await expect(page.getByRole('alert')).toContainText('冲突');
    await expect(page.getByLabel('标题', { exact: true })).toHaveValue(`${prefix}-conflict`);
    // Navigate through the unsaved guard, not by accepting an accidental browser unload.
    await page.getByRole('link', { name: '游戏', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: '确认', exact: true }).click();
    // Temporary game edits; original games are never modified.
    const testGame = await create('games', {
      title: prefix,
      coverMediaId: uploaded.asset.id,
      rating: 0,
      playtimeHours: 7,
      likeLevel: 0,
      isVisible: false,
      sortOrder: 1000000,
    });
    await page.goto(`/games/${testGame.id}`);
    await expect(page.getByLabel('自定义时长（小时）')).toHaveValue('7');
    await page.getByLabel('自定义时长（小时）').fill('0');
    await page.getByRole('button', { name: '保存更改' }).click();
    await expect(page.getByRole('status')).toContainText('保存成功');
    const unlinked = library.find(
      (item) => !beforeGames.some((game) => game.steamAppId === item.appId),
    );
    if (unlinked) {
      const linkResponse = await api.patch(`${base}/admin/games/${testGame.id}`, {
        headers: origin,
        data: { steamAppId: unlinked.appId },
      });
      expect(linkResponse.status()).toBe(200);
      await page.reload();
      await expect(page.getByLabel('自定义时长（小时）')).toHaveValue('0');
      await expect(page.getByText(`已关联 · App ID ${unlinked.appId}`)).toBeVisible();
      await page.getByRole('button', { name: '解除关联', exact: true }).click();
      await page.getByRole('button', { name: '保存更改' }).click();
      await expect(page.getByRole('status')).toContainText('保存成功');
      expect(
        ((await (await api.get(`${base}/admin/games/${testGame.id}`)).json()) as Game).steamAppId,
      ).toBeNull();
    }
    // Complete book form: zero progress and empty source/date values.
    await page.goto('/books/new');
    await page.getByLabel('书名', { exact: true }).fill(prefix);
    await page.getByLabel('作者', { exact: true }).fill('临时测试');
    await page.getByRole('button', { name: '选择封面' }).click();
    await page.getByRole('button', { name: `选择素材 ${uploaded.asset.id}`, exact: true }).click();
    await page.getByLabel('公开展示', { exact: true }).uncheck();
    const book = await trackUiCreate('books', () =>
      page.getByRole('button', { name: '创建并保存' }).click(),
    );
    await expect(page).toHaveURL(`/books/${book.id}`);
    const bookBody = (await (await api.get(`${base}/admin/books/${book.id}`)).json()) as {
      progress: number;
      sourceName: string | null;
      sourceUrl: string | null;
      isVisible: boolean;
    };
    expect(bookBody).toMatchObject({
      progress: 0,
      sourceName: null,
      sourceUrl: null,
      isVisible: false,
    });
    // Dedicated PHOTO upload captures both media IDs, then saves the actual photo form.
    await page.goto('/photos/new');
    await page.getByLabel('选择图片文件', { exact: true }).setInputFiles({
      name: `${prefix}-photo.png`,
      mimeType: 'image/png',
      buffer: Buffer.from(tinyPng, 'base64'),
    });
    const photoUploadWait = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === '/admin/media/images' &&
        response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: '开始上传' }).click();
    const photoUpload = await photoUploadWait;
    expect(photoUpload.status()).toBe(201);
    const pair = (await photoUpload.json()) as { original: Media; thumbnail: Media };
    mediaIds.push(pair.original.id, pair.thumbnail.id);
    expect(pair.original.id).not.toBe(pair.thumbnail.id);
    await page.getByLabel('照片标题').fill(prefix);
    await page.getByLabel('替代文本', { exact: true }).fill('临时测试照片');
    await page.getByLabel('公开展示', { exact: true }).uncheck();
    const photo = await trackUiCreate('photos', () =>
      page.getByRole('button', { name: '创建并保存' }).click(),
    );
    await expect(page).toHaveURL(`/photos/${photo.id}`);
    // Small resources and an atomic reorder containing only our temporary rows.
    const skill = await create('skills', {
      name: prefix,
      iconKey: 'react',
      isVisible: false,
      sortOrder: 1000000,
    });
    const skill2 = await create('skills', {
      name: `${prefix}-2`,
      iconKey: 'typescript',
      isVisible: false,
      sortOrder: 1000001,
    });
    expect(
      (
        await api.patch(`${base}/admin/skills/reorder`, {
          headers: origin,
          data: {
            items: [
              { id: skill.id, sortOrder: 1000001 },
              { id: skill2.id, sortOrder: 1000000 },
            ],
          },
        })
      ).status(),
    ).toBe(204);
    await create('social-links', {
      name: prefix,
      platform: 'github',
      url: 'https://example.com',
      iconKey: 'github',
      isVisible: false,
      sortOrder: 1000000,
    });
    // Read every production-backed page and load selectors beyond the first 50 entries.
    for (const resource of [
      'categories',
      'tags',
      'books',
      'games',
      'photos',
      'skills',
      'social-links',
      'site-profile',
      'media',
      'steam',
    ]) {
      await page.goto(`/${resource}`);
      await expect(page.locator('main h1')).toBeVisible();
      await expect(page.locator('main').getByRole('alert')).toHaveCount(0);
    }
    await page.goto(`/games/${testGame.id}`);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByLabel('自定义时长（小时）')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: 'docs/screenshots/game-editor-mobile.png',
      fullPage: true,
      animations: 'disabled',
    });
    await page.setViewportSize({ width: 1440, height: 1050 });
    // Real UI deletion (204) of our temporary photo only.
    await page.goto('/photos');
    let found = false;
    for (let step = 0; step < 20; step++) {
      await expect(page.getByRole('navigation', { name: '分页' })).toContainText(
        `第 ${step + 1} /`,
      );
      const button = page.getByRole('button', { name: `删除 ${prefix}`, exact: true });
      if (await button.count()) {
        await button.click();
        found = true;
        break;
      }
      await page.getByRole('button', { name: '下一页', exact: true }).click();
    }
    expect(found).toBe(true);
    await page.getByRole('dialog').getByRole('button', { name: '确认', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect((await api.get(`${base}/admin/photos/${photo.id}`)).status()).toBe(404);
    liveSummary = {
      base,
      counts: Object.fromEntries(Object.entries(before).map(([key, ids]) => [key, ids.length])),
      steamLibraryCount: library.length,
      steamStatus,
      linkedTemporaryGame: unlinked !== undefined,
      consoleErrors,
      verifiedAt: new Date().toISOString(),
    };
    expect(consoleErrors).toEqual([]);
  } catch (error) {
    console.log('Live failure location:', new URL(page.url()).pathname);
    console.log('Visible alerts:', await page.getByRole('alert').allTextContents());
    await page.screenshot({
      path: 'test-results/live-before-cleanup.png',
      fullPage: true,
      animations: 'disabled',
    });
    throw error;
  } finally {
    // Dependency-aware cleanup, restricted to explicit IDs created in this test.
    const priority: Record<string, number> = {
      articles: 0,
      photos: 0,
      books: 0,
      games: 0,
      skills: 0,
      'social-links': 0,
      tags: 1,
      categories: 2,
    };
    records.sort((a, b) => (priority[a.resource] ?? 0) - (priority[b.resource] ?? 0));
    try {
      // Cleanup runs in the backend, independent of the browser test timeout/session.
      admin.cleanupContent(records, mediaIds);
      for (const resource of resources)
        if (before[resource])
          expect(
            (await all<{ id: number }>(api, `/admin/${resource}`))
              .map((item) => item.id)
              .sort((a, b) => a - b),
          ).toEqual(before[resource]);
      if (beforeGames.length)
        expect((await all<Game>(api, '/admin/games')).map(gameInitial)).toEqual(
          beforeGames.map(gameInitial),
        );
      admin.expire();
      await page.goto('/games');
      await expect(page).toHaveURL(/login/);
      await login();
      await page.getByRole('button', { name: '退出登录', exact: true }).click();
      await page.getByRole('button', { name: '确认', exact: true }).click();
      await expect(page).toHaveURL(/login/);
      expect((await api.get(`${base}/auth/me`)).status()).toBe(401);
      if ('verifiedAt' in liveSummary) {
        await mkdir('docs/screenshots', { recursive: true });
        await writeFile(
          'docs/live-verification.json',
          JSON.stringify(
            {
              ...liveSummary,
              cleanup:
                'all temporary content and media removed; original IDs and game writable fields unchanged',
              sessionExpiryAndLogout: 'passed',
            },
            null,
            2,
          ) + '\n',
        );
      }
    } finally {
      admin.cleanup();
    }
  }
});
