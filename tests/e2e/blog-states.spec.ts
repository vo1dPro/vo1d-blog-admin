import { test, expect } from '@playwright/test';

const base = 'http://localhost:3100';
const blog = 'http://localhost:5173';

test('公开列表：加载、空列表、失败和重试不会显示静态内容', async ({ page }) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const resource of ['books', 'games', 'photos', 'skills']) {
    const pattern = base + '/' + resource + '?*';
    const region =
      resource === 'skills'
          ? page.locator('#skills')
          : page.locator('#hobbies');
    await page.route(pattern, (route) =>
      route.fulfill({ json: { items: [], page: 1, pageSize: 50, total: 0, totalPages: 0 } }),
    );
    await page.goto(blog);
    await expect(region.getByText('No ' + resource + ' to display.')).toBeVisible();
    if (resource === 'books') await expect(page.locator('.book-library')).toHaveCount(0);
    if (resource === 'games') await expect(page.locator('.game-showcase')).toHaveCount(0);
    if (resource === 'photos') await expect(page.locator('[data-photo-id]')).toHaveCount(0);
    await page.unroute(pattern);
    await page.route(pattern, (route) => route.fulfill({ status: 503, json: {} }));
    await page.reload();
    await expect(region).toContainText('(503)');
    await expect(region.getByText('No ' + resource + ' to display.')).toHaveCount(0);
    await page.unroute(pattern);
    await region.getByRole('button', { name: 'Retry', exact: true }).click();
    await expect(region.getByRole('button', { name: 'Retry', exact: true })).toHaveCount(0);
  }
  await page.route(base + '/social-links?*', (route) =>
    route.fulfill({ json: { items: [], page: 1, pageSize: 50, total: 0, totalPages: 0 } }),
  );
  await page.reload();
  await expect(page.locator('.sm-header-social-link')).toHaveCount(0);
  await expect(page.locator('.animated-footer__social-link')).toHaveCount(0);
  await page.unroute(base + '/social-links?*');
  await page.route(base + '/site-profile', (route) => route.fulfill({ status: 503, json: {} }));
  await page.reload();
  await expect(page.locator('#home')).toContainText('(503)');
  await expect(page.locator('#home h1')).toHaveCount(0);
  await page.unroute(base + '/site-profile');
  await page.locator('#home').getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.locator('#home h1')).toContainText('vo1d');
  expect(errors).toEqual([]);
});

test('旧文章链接显示 404，不再请求文章接口', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto(blog + '/blog/1');
  await expect(page.locator('#not-found-title')).toBeVisible();
  expect(requests.some(url => url.startsWith(base + '/articles'))).toBe(false);
});

test('动态列表空态、失败重试、完整分页及零值展示', async ({ page }) => {
  let mode = 'empty';
  const pattern = base + '/creations?*';
  await page.addInitScript(() => sessionStorage.setItem('vo1d-blog:opening-seen', '1'));
  await page.route(pattern, route => {
    if (mode === 'error') return route.fulfill({ status: 503, json: {} });
    const number = Number(new URL(route.request().url()).searchParams.get('page'));
    if (mode === 'partial' && number === 2) return route.fulfill({ status: 503, json: {} });
    const count = mode === 'empty' ? 0 : 51;
    return route.fulfill({ json: {
      version: 1, mode: 'live', updatedAt: '2026-10-22T00:00:00Z', page: number,
      pageSize: 50, total: count, totalPages: count ? 2 : 0,
      items: Array.from({ length: count ? (number === 1 ? 50 : 1) : 0 }, (_, index) => ({
        id: String((number - 1) * 50 + index), platform: 'x',
        sourceUrl: 'https://x.com/vo1dZzz/status/2112140462157132128',
        author: { name: 'Test author', handle: 'vo1dZzz' }, publishedAt: '2026-10-21T00:00:00Z',
        body: [{ kind: 'text', text: '分页测试动态' }], media: [],
        metrics: { replies: 0, reposts: 1, quotes: 2, likes: 0, views: 9 },
      })),
    } });
  });
  await page.goto(blog + '/#blog');
  await expect(page.locator('#blog')).toContainText('还没有发布的动态。');
  mode = 'error';
  await page.reload();
  await expect(page.locator('#blog')).toContainText('暂时无法加载动态。');
  mode = 'partial';
  await page.getByRole('button', { name: '重新加载', exact: true }).click();
  await expect(page.locator('#blog')).toContainText('暂时无法加载动态。');
  await expect(page.locator('.creation-card')).toHaveCount(0);
  mode = 'success';
  await page.getByRole('button', { name: '重新加载', exact: true }).click();
  await expect(page.locator('.creation-card')).toHaveCount(51);
  await expect(page.locator('.creation-stat-replies').first()).toHaveText('');
  await expect(page.locator('.creation-stat-reposts').first()).toHaveText('3');
  await expect(page.locator('.creation-stat-likes').first()).toHaveText('');
});

test('跨页完整读取，第二页失败和不一致响应不能被当作成功', async ({ page }) => {
  const source = (await (await page.request.get(base + '/books?pageSize=1')).json()) as {
    items: Record<string, unknown>[];
  };
  const seed = source.items[0];
  if (!seed) throw new Error('Expected a public book');
  const calls: number[] = [];
  let failSecond = false;
  let invalidTotal = false;
  await page.route(base + '/books?*', (route) => {
    const number = Number(new URL(route.request().url()).searchParams.get('page'));
    calls.push(number);
    if (number === 2 && failSecond) return route.fulfill({ status: 503, json: {} });
    return route.fulfill({
      json: {
        items: Array.from({ length: number === 1 ? 50 : 1 }, (_, index) => ({
          ...seed,
          id: 9000 + (number - 1) * 50 + index,
          title: 'Book ' + ((number - 1) * 50 + index),
        })),
        page: number,
        pageSize: 50,
        total: invalidTotal && number === 2 ? 52 : 51,
        totalPages: 2,
      },
    });
  });
  await page.goto(blog);
  await expect(page.locator('.book-library__card')).toHaveCount(51);
  expect(calls).toContain(2);
  await expect(
    page.locator('.book-library__meta-label').filter({ hasText: 'progress' }),
  ).toHaveCount(51);
  failSecond = true;
  await page.reload();
  await expect(page.locator('#hobbies')).toContainText('(503)');
  await expect(page.locator('.book-library__card')).toHaveCount(0);
  failSecond = false;
  invalidTotal = true;
  await page.locator('#hobbies').getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.locator('#hobbies')).toContainText('Content changed while loading');
  await expect(page.locator('.book-library__card')).toHaveCount(0);
  invalidTotal = false;
  await page.locator('#hobbies').getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.locator('.book-library__card')).toHaveCount(51);
});

test('照片失败与重试、深浅色图标和游戏时长保持真实接口行为', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const photos = (await (await page.request.get(base + '/photos?pageSize=1')).json()) as {
    items: { id: number; original: { url: string }; thumbnail: { url: string } }[];
  };
  const photo = photos.items[0];
  if (!photo) throw new Error('Expected a photo');
  await page.route(photo.original.url, (route) => route.abort());
  await page.route(photo.thumbnail.url, (route) => route.abort());
  await page.goto(blog);
  await page.locator('#photo-gallery').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-photo-id="' + photo.id + '"]').first()).toContainText(
    'Image unavailable',
  );
  await page
    .locator('[data-photo-id="' + photo.id + '"]')
    .first()
    .evaluate((el: HTMLButtonElement) => el.click());
  await expect(page.getByRole('dialog')).toContainText('Image unavailable');
  await page.unroute(photo.original.url);
  await page.unroute(photo.thumbnail.url);
  await page.getByRole('button', { name: 'Retry image' }).click();
  await expect(page.getByRole('dialog').locator('img')).toHaveAttribute('src', photo.original.url);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const social = (await (await page.request.get(base + '/social-links?pageSize=1')).json()) as {
    items: { icon: { url: string }; darkIcon: { url: string } }[];
  };
  const firstSocial = social.items[0];
  if (!firstSocial) throw new Error('Expected a public social link');
  for (const theme of ['light', 'dark']) {
    await page.evaluate((value) => {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(value);
    }, theme);
    const icon = page
      .locator('.sm-header-social-link')
      .first()
      .locator(theme === 'dark' ? '.social-icon--dark' : '.social-icon--light');
    await expect(icon).toBeVisible();
    await expect(icon).toHaveAttribute(
      'src',
      theme === 'dark' ? firstSocial.darkIcon.url : firstSocial.icon.url,
    );
  }
  const games = (await (await page.request.get(base + '/games?pageSize=50')).json()) as {
    items: {
      title: string;
      rating: number;
      playtimeHours: number;
      manualPlaytimeHours: number;
      steam: { playtimeMinutes: number } | null;
    }[];
  };
  const [firstGame, secondGame] = [...games.items].sort(
    (a, b) =>
      b.playtimeHours - a.playtimeHours ||
      b.rating - a.rating ||
      a.title.localeCompare(b.title, 'zh-Hans-CN'),
  );
  if (!firstGame || !secondGame) throw new Error('Expected two public games');
  for (const game of games.items)
    expect(game.playtimeHours).toBe(
      game.manualPlaytimeHours > 0
        ? game.manualPlaytimeHours
        : Math.floor((game.steam?.playtimeMinutes ?? 0) / 60),
    );
  await page.locator('.game-showcase').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Turn screen on', exact: true }).click();
  await expect(page.locator('.game-track-title').first()).toHaveText(firstGame.title);
  await page.getByRole('button', { name: 'Next game', exact: true }).click();
  await expect(page.locator('.game-track-title').first()).toHaveText(secondGame.title);
  await page.getByRole('button', { name: 'Previous game', exact: true }).click();
  await expect(page.locator('.game-track-title').first()).toHaveText(firstGame.title);
  expect(errors).toEqual([]);
});

test('游戏列表和上一首、下一首共用时长降序，支持点击选择及首尾循环', async ({ page }) => {
  const response = (await (await page.request.get(base + '/games?pageSize=1')).json()) as {
    items: Record<string, unknown>[];
  };
  const sample = response.items[0];
  if (!sample) throw new Error('Expected a game cover fixture');
  const items = [
    {
      ...sample,
      id: 101,
      title: 'Alpha zero',
      playtimeHours: 0,
      manualPlaytimeHours: 999,
      rating: 5,
      steam: null,
    },
    {
      ...sample,
      id: 102,
      title: 'Beta middle',
      playtimeHours: 60,
      manualPlaytimeHours: 999,
      rating: 5,
      steam: null,
    },
    {
      ...sample,
      id: 103,
      title: 'Zeta longest',
      playtimeHours: 120,
      manualPlaytimeHours: 0,
      rating: 0,
      steam: null,
    },
  ];
  await page.route(base + '/games?*', (route) =>
    route.fulfill({
      json: { items, page: 1, pageSize: 50, total: items.length, totalPages: 1 },
    }),
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto(blog);
    await page.locator('.game-showcase').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Turn screen on', exact: true }).click();
    const title = page.locator('.game-track-title').first();
    const next = page.getByRole('button', { name: 'Next game', exact: true });
    const previous = page.getByRole('button', { name: 'Previous game', exact: true });
    await expect(title).toHaveText('Zeta longest');
    await expect(page.locator('.game-time-row span').last()).toHaveText('180h');
    await next.click();
    await expect(title).toHaveText('Beta middle');
    await next.click();
    await expect(title).toHaveText('Alpha zero');
    await next.click();
    await expect(title).toHaveText('Zeta longest');
    await previous.click();
    await expect(title).toHaveText('Alpha zero');
    await page.getByRole('button', { name: 'Show game list', exact: true }).click();
    await expect(page.locator('.game-library-row strong')).toHaveText([
      'Zeta longest',
      'Beta middle',
    ]);
    await page.locator('.game-library-row').filter({ hasText: 'Zeta longest' }).click();
    await next.click();
    await expect(title).toHaveText('Beta middle');
    await previous.click();
    await expect(title).toHaveText('Zeta longest');
  }
  expect(errors).toEqual([]);
});
