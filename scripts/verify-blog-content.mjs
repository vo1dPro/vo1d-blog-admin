import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

// Public reads only. Content, icon URLs and account counts come from the current API.
const api = (process.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3100').replace(/\/+$/, '');
const blog = (process.env.BLOG_BASE_URL ?? 'http://localhost:5173').replace(/\/+$/, '');
async function read(path) {
  const response = await fetch(api + path, {
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Public request failed: ${path} (${response.status})`);
  return response.json();
}
async function allPages(path) {
  const first = await read(`${path}?page=1&pageSize=50`);
  const items = [...first.items];
  for (let page = 2; page <= first.totalPages; page++) {
    const next = await read(`${path}?page=${page}&pageSize=50`);
    expect(next.total).toBe(first.total);
    expect(next.page).toBe(page);
    items.push(...next.items);
  }
  expect(items.length).toBe(first.total);
  expect(new Set(items.map((item) => item.id)).size).toBe(first.total);
  return items;
}
const [games, skills, socials, articles] = await Promise.all(
  ['/games', '/skills', '/social-links', '/articles'].map(allPages),
);
for (const game of games) {
  const minutes = game.steam?.playtimeMinutes ?? 0;
  if (game.steam)
    expect(minutes).toBe(
      game.steam.accountBreakdown.reduce((sum, account) => sum + account.playtimeMinutes, 0),
    );
  expect(game.playtimeHours).toBe(
    game.manualPlaytimeHours > 0 ? game.manualPlaytimeHours : Math.floor(minutes / 60),
  );
}
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
});
const errors = [];
const requests = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('request', (request) => requests.push(request.url()));
try {
  await mkdir('docs/screenshots', { recursive: true });
  await page.goto(blog);
  await expect(page.locator('[data-content-state="loading"]')).toHaveCount(0);
  await expect(page.locator('[data-content-state="error"]')).toHaveCount(0);
  const rows = [...skills, ...socials];
  const iconUrls = [
    ...new Set(rows.flatMap((row) => [row.icon?.url, row.darkIcon?.url]).filter(Boolean)),
  ];
  for (const url of iconUrls) {
    const response = await page.request.get(url, { headers: { Origin: new URL(blog).origin } });
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toMatch(/^image\//);
    expect(response.headers()['access-control-allow-origin']).toBe(new URL(blog).origin);
  }
  if (skills.length) {
    await page.locator('#skills').scrollIntoViewIfNeeded();
    await page.locator('#skills canvas').waitFor();
    for (const theme of ['light', 'dark']) {
      await page.evaluate((value) => {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(value);
      }, theme);
      const sample = skills.find((skill) => skill.icon && skill.darkIcon);
      if (sample)
        await expect
          .poll(() => requests.includes((theme === 'dark' ? sample.darkIcon : sample.icon).url))
          .toBe(true);
    }
  }
  if (games.length) {
    const first = [...games].sort(
      (a, b) =>
        b.playtimeHours - a.playtimeHours ||
        b.rating - a.rating ||
        a.title.localeCompare(b.title, 'zh-Hans-CN'),
    )[0];
    await page.locator('.game-showcase').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Turn screen on', exact: true }).click();
    await expect(page.locator('.game-track-title').first()).toHaveText(first.title);
    await expect(
      page.locator('.game-showcase').getByText(`${first.playtimeHours}h`, { exact: true }),
    ).toBeVisible();
    await page.locator('.game-showcase').screenshot({ path: 'docs/screenshots/blog-games.png' });
  }
  const imageUrls = [iconUrls[0], games[0]?.cover.url].filter(Boolean);
  const canvasReadback = await page.evaluate(async (urls) => {
    for (const url of urls) {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.src = url;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0, 1, 1);
      context.getImageData(0, 0, 1, 1);
    }
    return true;
  }, imageUrls);
  const pattern = api + '/games?*';
  await page.route(pattern, (route) =>
    route.fulfill({ json: { items: [], page: 1, pageSize: 50, total: 0, totalPages: 0 } }),
  );
  await page.reload();
  await expect(page.getByText('No games to display.', { exact: true })).toBeVisible();
  await expect(page.locator('.game-showcase')).toHaveCount(0);
  await page.unroute(pattern);
  await page.route(pattern, (route) => route.fulfill({ status: 503, json: {} }));
  await page.reload();
  await expect(page.locator('#hobbies')).toContainText('(503)');
  await page.unroute(pattern);
  await page.locator('#hobbies').getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.locator('#hobbies [data-content-state="error"]')).toHaveCount(0);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.goto(blog);
    await expect(page.locator('[data-content-state="loading"]')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.locator('#home').screenshot({ path: `docs/screenshots/home-${width}.png` });
    if (articles.length) {
      const article = await read(`/articles/${articles[0].id}`);
      await page.goto(`${blog}/blog/${article.id}`);
      await expect(page.locator('.article-content')).toBeVisible();
      await expect(page.locator('main')).toHaveCount(1);
      await expect(page).toHaveTitle(article.seoTitle ?? article.title);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        'content',
        article.seoDescription ?? article.summary,
      );
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page
        .locator('.page-shell')
        .screenshot({ path: `docs/screenshots/article-${width}.png` });
    }
  }
  expect(errors).toEqual([]);
  const result = {
    checkedAt: new Date().toISOString(),
    gameCount: games.length,
    checkedIcons: iconUrls.length,
    checkedArticles: articles.length ? 1 : 0,
    canvasReadback,
    emptyAndRetry: true,
    errors,
  };
  await writeFile('docs/blog-content-verification.json', JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));
} finally {
  await browser.close();
}
