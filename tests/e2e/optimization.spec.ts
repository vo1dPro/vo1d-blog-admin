import { expect, test } from '@playwright/test';
import { game, mockApi } from './mock-api';

test('游戏翻页复用完整列表，删除后重新读取排序和总数', async ({ page }) => {
  const state = await mockApi(page);
  state.data.games = Array.from({ length: 12 }, (_, index) => ({
    ...game,
    id: index + 1,
    title: `缓存游戏-${index + 1}`,
    playtimeHours: index + 1,
  }));
  let requests = 0;
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/admin/games' && request.method() === 'GET')
      requests++;
  });
  await page.goto('/games');
  await expect(page.getByText('缓存游戏-12', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '下一页', exact: true }).click();
  await expect(page.getByText('缓存游戏-1', { exact: true })).toBeVisible();
  expect(requests).toBe(1);
  await page.getByRole('button', { name: '上一页', exact: true }).click();
  await expect(page.getByText('缓存游戏-12', { exact: true })).toBeVisible();
  expect(requests).toBe(1);
  await page.getByRole('button', { name: '删除 缓存游戏-12', exact: true }).click();
  await page.getByRole('button', { name: '确认', exact: true }).click();
  await expect(page.getByText('缓存游戏-12', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: '分页' })).toContainText('共 11 条');
  expect(requests).toBe(2);
});

test('桌面模型接近游戏区域才加载，手机不请求模型', async ({ page }) => {
  test.setTimeout(90000);
  const models: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.endsWith('.glb')) models.push(request.url());
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173');
  await expect(page.locator('.game-showcase')).toBeAttached();
  expect(models).toHaveLength(0);
  await page.locator('.game-showcase').scrollIntoViewIfNeeded();
  await expect.poll(() => new Set(models).size).toBe(2);
  await expect(page.locator('.xbox-controller-stage.is-loaded')).toHaveCount(1);
  await expect(page.locator('.glock-model-stage.is-loaded')).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 844 });
  models.length = 0;
  await page.reload();
  await expect(page.locator('.game-showcase')).toBeAttached();
  await page.locator('.game-showcase').scrollIntoViewIfNeeded();
  await expect(page.locator('.xbox-controller-stage')).toHaveCount(0);
  await expect(page.locator('.glock-model-stage')).toHaveCount(0);
  expect(models).toHaveLength(0);
});
