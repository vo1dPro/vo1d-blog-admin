import { test, expect, type APIRequestContext } from '@playwright/test';
import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { createLiveAdmin, loginLiveAdmin } from './live-fixture';
import { tinyPng } from './mock-api';
import type { Media, SiteProfile } from '../../src/api/types';

const base = 'http://localhost:3100';
const blogUrl = 'http://localhost:5173';
const headers = { Origin: 'http://localhost:5174' };
async function all(api: APIRequestContext, resource: string): Promise<{ id: number }[]> {
  const items: { id: number }[] = [];
  for (let page = 1; ; page++) {
    const response = await api.get(`${base}/admin/${resource}?page=${page}&pageSize=50`);
    expect(response.status()).toBe(200);
    const value = (await response.json()) as { items: { id: number }[]; totalPages: number };
    items.push(...value.items);
    if (page >= value.totalPages) return items;
  }
}

test('三项目真实联动：资料、书籍媒体与排序、照片撤回', async ({
  page,
  context,
  browser,
}) => {
  test.setTimeout(240000);
  const admin = createLiveAdmin();
  const visitor = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    timezoneId: 'Asia/Hong_Kong',
  });
  const blog = await visitor.newPage();
  const api = context.request;
  const prefix = `link-e2e-${randomBytes(6).toString('hex')}`;
  const records: { resource: string; id: number }[] = [];
  const mediaIds: number[] = [];
  const before: Record<string, number[]> = {};
  const errors: string[] = [];
  const checks: string[] = [];
  let restoreProfile: Record<string, unknown> | undefined;
  blog.on('pageerror', (error) => errors.push(error.message));
  async function create(resource: string, data: object) {
    const response = await api.post(`${base}/admin/${resource}`, { headers, data });
    expect(response.status()).toBe(201);
    const item = (await response.json()) as { id: number };
    records.push({ resource, id: item.id });
    return item;
  }
  async function patch(resource: string, data: object) {
    const response = await api.patch(`${base}/admin/${resource}`, { headers, data });
    expect(response.status()).toBe(200);
  }
  async function save() {
    const saved = page.waitForResponse(
      (r) => r.request().method() === 'PATCH' && r.url().startsWith(base + '/admin/'),
    );
    await page.getByRole('button', { name: '保存更改', exact: true }).click();
    expect((await saved).status()).toBe(200);
    await expect(page.getByRole('status')).toContainText('保存成功');
  }
  try {
    await loginLiveAdmin(page, admin);
    for (const resource of [
      'books',
      'photos',
      'media',
      'games',
      'skills',
      'social-links',
    ])
      before[resource] = (await all(api, resource)).map((item) => item.id).sort((a, b) => a - b);
    const profile = (await (await api.get(`${base}/admin/site-profile`)).json()) as SiteProfile;
    restoreProfile = Object.fromEntries(
      [
        'displayName',
        'role',
        'heroTitlePrefix',
        'heroDescription',
        'learningNote',
        'footerMessage',
        'avatarMediaId',
      ].map((key) => [key, profile[key as keyof SiteProfile]]),
    );
    // Two real uploads; no test media is substituted in the public browser.
    const media: Media[] = [];
    for (let index = 0; index < 2; index++) {
      const upload = await api.post(`${base}/admin/media/images`, {
        headers,
        multipart: {
          file: {
            name: `${prefix}-${index}.png`,
            mimeType: 'image/png',
            buffer: Buffer.from(tinyPng, 'base64'),
          },
          purpose: 'IMAGE',
        },
      });
      expect(upload.status()).toBe(201);
      const result = (await upload.json()) as { asset: Media };
      mediaIds.push(result.asset.id);
      media.push(result.asset);
    }
    const [firstMedia, secondMedia] = media;
    if (!firstMedia || !secondMedia) throw new Error('Two uploaded media required');
    await page.goto('/site-profile');
    for (const [label, value] of [
      ['显示名', prefix],
      ['角色', '联动开发者'],
      ['Hero 标题前缀', 'Hello'],
      ['介绍', '真实接口介绍'],
      ['学习说明', '真实接口学习文案'],
      ['页脚文案', '真实接口页脚文案'],
    ] as const)
      await page.getByLabel(label, { exact: true }).fill(value);
    await page.getByRole('button', { name: '选择头像', exact: true }).click();
    await page.getByRole('button', { name: `选择素材 ${firstMedia.id}`, exact: true }).click();
    await save();
    await blog.goto(blogUrl);
    await expect(blog.locator('#home h1')).toContainText(prefix);
    await expect(blog.locator('#home p')).toHaveText('真实接口介绍');
    await expect(blog.locator('#home img')).toHaveAttribute('src', firstMedia.url);
    await expect(blog.locator('#skills p[aria-label]')).toHaveAttribute(
      'aria-label',
      '真实接口学习文案',
    );
    await expect(blog.locator('.animated-footer__intro')).toContainText('真实接口页脚文案');
    expect((await visitor.cookies(base)).length).toBe(0);
    checks.push('site profile UI save -> all public placements, avatar, no visitor cookie');

    await page.goto('/books/new');
    await page.getByLabel('书名', { exact: true }).fill(prefix);
    await page.getByLabel('作者', { exact: true }).fill('临时作者');
    await page.getByRole('button', { name: '选择封面', exact: true }).click();
    await page.getByRole('button', { name: `选择素材 ${firstMedia.id}`, exact: true }).click();
    const createdWait = page.waitForResponse(
      (r) => r.request().method() === 'POST' && r.url() === `${base}/admin/books`,
    );
    await page.getByRole('button', { name: '创建并保存' }).click();
    const created = await createdWait;
    expect(created.status()).toBe(201);
    const book = (await created.json()) as { id: number };
    records.push({ resource: 'books', id: book.id });
    await expect(page).toHaveURL(`/books/${book.id}`);
    await blog.reload();
    const card = blog.locator(`#book-card-${book.id}`);
    await expect(card).toContainText('0%');
    await expect(card.locator('a')).toHaveCount(0);
    await expect(card).not.toContainText(/Invalid Date|1970|最近阅读|开始阅读|读完/);
    await page.getByLabel('书名', { exact: true }).fill(`${prefix}-edited`);
    await page.getByRole('button', { name: '选择封面', exact: true }).click();
    await page.getByRole('button', { name: `选择素材 ${secondMedia.id}`, exact: true }).click();
    await save();
    await blog.reload();
    await expect(card).toContainText(`${prefix}-edited`);
    await expect(card.locator('img')).toHaveAttribute('src', secondMedia.url);
    const book2 = await create('books', {
      title: `${prefix}-second`,
      author: '临时作者',
      coverMediaId: firstMedia.id,
      accent: '#007aff',
      readingOrder: 1,
      progress: 0,
      sortOrder: 999999,
    });
    const reordered = await api.patch(`${base}/admin/books/reorder`, {
      headers,
      data: {
        items: [
          { id: book.id, sortOrder: 999999 },
          { id: book2.id, sortOrder: 999998 },
        ],
      },
    });
    expect(reordered.status()).toBe(204);
    await blog.reload();
    await expect(blog.locator('.book-library__card').last()).toHaveAttribute(
      'id',
      `book-card-${book.id}`,
    );
    await page.getByLabel('公开展示', { exact: true }).uncheck();
    await save();
    await blog.reload();
    await expect(card).toHaveCount(0);
    checks.push(
      'book UI create/edit/replace/hide, nullable dates/source, zero progress, real reorder 204',
    );

    const uploaded = await api.post(`${base}/admin/media/images`, {
      headers,
      multipart: {
        file: {
          name: `${prefix}-photo.png`,
          mimeType: 'image/png',
          buffer: Buffer.from(tinyPng, 'base64'),
        },
        purpose: 'PHOTO',
      },
    });
    expect(uploaded.status()).toBe(201);
    const pair = (await uploaded.json()) as { original: Media; thumbnail: Media };
    mediaIds.push(pair.original.id, pair.thumbnail.id);
    const photo = await create('photos', {
      title: prefix,
      description: '照片真实联动',
      alt: '测试照片',
      originalMediaId: pair.original.id,
      thumbnailMediaId: pair.thumbnail.id,
      sortOrder: 0,
    });
    await blog.reload();
    const photoButton = blog.locator(`[data-photo-id="${photo.id}"]`).first();
    await expect(photoButton.locator('img')).toHaveAttribute('src', pair.thumbnail.url);
    await photoButton.evaluate((el: HTMLButtonElement) => el.click());
    await expect(blog.getByRole('dialog')).toBeVisible();
    await expect(blog.getByRole('dialog').locator('img')).toHaveAttribute('src', pair.original.url);
    await page.goto(`/photos/${photo.id}`);
    const replacementUpload = await api.post(`${base}/admin/media/images`, {
      headers,
      multipart: {
        file: {
          name: `${prefix}-replacement.png`,
          mimeType: 'image/png',
          buffer: Buffer.from(tinyPng, 'base64'),
        },
        purpose: 'PHOTO',
      },
    });
    expect(replacementUpload.status()).toBe(201);
    const replacement = (await replacementUpload.json()) as { original: Media; thumbnail: Media };
    mediaIds.push(replacement.original.id, replacement.thumbnail.id);
    await page.getByRole('button', { name: '选择展示图', exact: true }).click();
    await page
      .getByRole('button', { name: `选择素材 ${replacement.original.id}`, exact: true })
      .click();
    await page.getByRole('button', { name: '选择缩略图', exact: true }).click();
    await page
      .getByRole('button', { name: `选择素材 ${replacement.thumbnail.id}`, exact: true })
      .click();
    await save();
    await blog.reload();
    await expect(photoButton.locator('img')).toHaveAttribute('src', replacement.thumbnail.url);
    await photoButton.evaluate((el: HTMLButtonElement) => el.click());
    await expect(blog.getByRole('dialog').locator('img')).toHaveAttribute(
      'src',
      replacement.original.url,
    );
    await blog.keyboard.press('Escape');
    await expect(blog.getByRole('dialog')).toHaveCount(0);
    await expect(blog.locator('#root')).not.toHaveAttribute('inert', '');
    await page.getByLabel('公开展示', { exact: true }).uncheck();
    await save();
    await blog.reload();
    await expect(photoButton).toHaveCount(0);
    await patch('photos/' + photo.id, { isVisible: true });
    await blog.reload();
    await expect(photoButton).toBeAttached();
    expect((await api.delete(base + '/admin/photos/' + photo.id, { headers })).status()).toBe(204);
    await blog.reload();
    await expect(photoButton).toHaveCount(0);
    checks.push(
      'photo original/thumbnail replacement, dialog and Escape, hide/delete after refresh',
    );

    // Restore shared profile before capturing final visual evidence.
    await patch('site-profile', restoreProfile);
    await blog.goto(blogUrl);
    await expect(blog.locator('#home h1')).toContainText(profile.displayName);
    await mkdir('docs/screenshots', { recursive: true });
    for (const theme of ['light', 'dark']) {
      await blog.evaluate((value) => {
        localStorage.setItem('theme', value);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(value);
      }, theme);
      await blog
        .locator('#blog')
        .screenshot({ path: `docs/screenshots/integration-blog-${theme}.png` });
      await blog
        .locator('.book-library')
        .screenshot({ path: `docs/screenshots/integration-books-${theme}.png` });
      await blog.setViewportSize({ width: 390, height: 844 });
      await blog
        .locator('#blog')
        .screenshot({ path: `docs/screenshots/integration-blog-mobile-${theme}.png` });
      expect(await blog.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await blog.setViewportSize({ width: 1440, height: 1000 });
    }
    expect(errors).toEqual([]);
    checks.push('desktop/mobile light/dark without overflow or browser exceptions');
  } finally {
    const order: Record<string, number> = {
      books: 0,
      photos: 0,
    };
    records.sort((a, b) => (order[a.resource] ?? 0) - (order[b.resource] ?? 0));
    try {
      admin.cleanupContent(records, mediaIds, restoreProfile);
      for (const [resource, ids] of Object.entries(before))
        expect((await all(api, resource)).map((item) => item.id).sort((a, b) => a - b)).toEqual(
          ids,
        );
      if (restoreProfile)
        expect(await (await api.get(`${base}/admin/site-profile`)).json()).toMatchObject(
          restoreProfile,
        );
      await mkdir('docs', { recursive: true });
      await writeFile(
        'docs/full-integration-verification.json',
        JSON.stringify(
          {
            checkedAt: new Date().toISOString(),
            checks,
            errors,
            cleanup:
              'temporary rows, media, identity removed; original IDs retained and site profile fields restored',
          },
          null,
          2,
        ) + '\n',
      );
    } finally {
      admin.cleanup();
      await visitor.close();
    }
  }
});
