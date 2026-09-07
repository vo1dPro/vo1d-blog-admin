import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

// Run with both local frontends and the API available. Only performs public reads.
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
  const publicGames = await (await fetch('http://localhost:3100/games?pageSize=50')).json();
  const apex = publicGames.items.find((game) => game.title === 'Apex Legends');
  if (!apex?.steam) throw new Error('Expected an associated Apex game in the local fixture');
  expect(apex.steam.accountBreakdown).toHaveLength(3);
  expect(apex.steam.playtimeMinutes).toBe(
    apex.steam.accountBreakdown.reduce((sum, account) => sum + account.playtimeMinutes, 0),
  );
  expect(apex.playtimeHours).toBe(Math.floor(apex.steam.playtimeMinutes / 60));
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.locator('#skills canvas').waitFor();
  await page.locator('#skills').scrollIntoViewIfNeeded();
  await expect(page.locator('#skills p[aria-label] span[aria-hidden]').last()).toHaveCSS(
    'opacity',
    '1',
  );
  await page.locator('#skills').screenshot({ path: 'docs/screenshots/blog-skills.png' });
  await page.locator('.game-showcase').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Turn screen on', exact: true }).click();
  await expect
    .poll(() =>
      page.locator('.game-player-shell').evaluate((el) => getComputedStyle(el, '::after').opacity),
    )
    .toBe('0');
  for (let index = 0; index < publicGames.items.length; index++) {
    if ((await page.locator('.game-track-title').first().textContent()).includes('Apex')) break;
    await page.getByRole('button', { name: 'Next game', exact: true }).click();
  }
  await expect(page.locator('.game-track-title').first()).toHaveText('Apex Legends');
  await expect(
    page.locator('.game-showcase').getByText(`${apex.playtimeHours}h`, { exact: true }),
  ).toBeVisible();
  await page.locator('.game-showcase').screenshot({ path: 'docs/screenshots/blog-games.png' });
  expect(requests.some((url) => url.includes('/media/icons/import/'))).toBe(true);
  const resources = [
    ...new Set(
      requests
        .filter((url) => url.startsWith('http://localhost:3100/'))
        .map((url) => new URL(url).pathname),
    ),
  ];
  expect(resources).toEqual(expect.arrayContaining(['/skills', '/games', '/social-links']));
  const iconResponse = await page.request.get(
    requests.find((url) => url.includes('/media/icons/import/')),
    { headers: { Origin: 'http://localhost:5173' } },
  );
  expect(iconResponse.status()).toBe(200);
  expect(iconResponse.headers()['access-control-allow-origin']).toBe('http://localhost:5173');
  const skills = await (await fetch('http://localhost:3100/skills?pageSize=50')).json();
  for (const theme of ['light', 'dark']) {
    await page.evaluate((value) => {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(value);
    }, theme);
    const themed = skills.items.find((skill) => skill.icon && skill.darkIcon);
    if (!themed) throw new Error('Expected a skill with both theme variants');
    const url = theme === 'dark' ? themed.darkIcon.url : themed.icon.url;
    await expect.poll(() => requests.includes(url)).toBe(true);
  }
  const canvasReadback = await page.evaluate(
    async (urls) => {
      for (const url of urls) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = url;
        await img.decode();
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        const context = canvas.getContext('2d');
        context.drawImage(img, 0, 0, 1, 1);
        context.getImageData(0, 0, 1, 1);
      }
      return true;
    },
    [requests.find((url) => url.includes('/media/icons/import/')), apex.cover.url],
  );
  expect(canvasReadback).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#skills').screenshot({ path: 'docs/screenshots/blog-skills-mobile.png' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.route('http://localhost:3100/games?*', (route) =>
    route.fulfill({ json: { items: [], page: 1, pageSize: 50, total: 0, totalPages: 0 } }),
  );
  await page.reload();
  await expect(page.locator('#hobbies').getByText('暂无公开内容。')).toBeVisible();
  await expect(page.locator('.game-showcase')).toHaveCount(0);
  await page.unroute('http://localhost:3100/games?*');
  await page.route('http://localhost:3100/games?*', (route) =>
    route.fulfill({ status: 503, json: { message: 'Temporarily unavailable' } }),
  );
  await page.reload();
  await expect(page.locator('#hobbies').getByRole('button', { name: '重试' })).toBeVisible();
  await page.unroute('http://localhost:3100/games?*');
  await page.locator('#hobbies').getByRole('button', { name: '重试' }).click();
  await expect(page.locator('.game-track-title').first()).toBeVisible();
  // Final screenshots use the restored real content, without temporary fixtures.
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('http://localhost:5173');
  await expect(page.locator('.book-library__card').first()).toBeVisible();
  await page.locator('#home').screenshot({ path: 'docs/screenshots/final-home.png' });
  await page.locator('.book-library').scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      page
        .locator('.book-library__cover')
        .evaluateAll((images) => images.every((img) => img.complete && img.naturalWidth > 0)),
    )
    .toBe(true);
  await page.locator('.book-library__cover').evaluateAll(async (images) => {
    await Promise.all(images.map((img) => img.decode()));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.locator('.book-library').screenshot({ path: 'docs/screenshots/final-books.png' });
  await page.locator('#blog').screenshot({ path: 'docs/screenshots/final-blog.png' });
  await page.locator('#photo-gallery').screenshot({ path: 'docs/screenshots/final-photos.png' });
  const articles = await (await fetch('http://localhost:3100/articles?pageSize=1')).json();
  if (articles.items.length) {
    await page.goto(`http://localhost:5173/blog/${articles.items[0].id}`);
    await expect(page.locator('.article-content')).toBeVisible();
    await page
      .locator('.page-shell')
      .screenshot({ path: 'docs/screenshots/final-article-desktop.png' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page
      .locator('.page-shell')
      .screenshot({ path: 'docs/screenshots/final-article-mobile.png' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.evaluate(() =>
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }),
  );
  await expect
    .poll(() =>
      page
        .locator('[data-footer-social-icon]')
        .first()
        .evaluate((el) => getComputedStyle(el).opacity),
    )
    .toBe('1');
  await page
    .locator('.animated-footer')
    .screenshot({ path: 'docs/screenshots/final-footer-mobile.png' });
  expect(errors).toEqual([]);
  const result = {
    checkedAt: new Date().toISOString(),
    resources,
    apexHours: apex.playtimeHours,
    apexMinutes: apex.steam.playtimeMinutes,
    accountCount: apex.steam.accountBreakdown.length,
    canvasReadback,
    iconThemes: ['light', 'dark'],
    emptyAndRetry: true,
    mobileOverflow: false,
    errors,
  };
  await writeFile('docs/blog-content-verification.json', JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));
} finally {
  await browser.close();
}
