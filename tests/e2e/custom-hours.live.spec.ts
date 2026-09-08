import { test, expect, type APIRequestContext } from '@playwright/test';
import { createLiveAdmin } from './live-fixture';
import type { Game } from '../../src/api/types';
import type { Page } from '../../src/api/client';

const base = 'http://localhost:3100';
const origin = { Origin: 'http://localhost:5174' };

async function games(request: APIRequestContext, path: string): Promise<Game[]> {
  const result: Game[] = [];
  for (let page = 1; ; page++) {
    const response = await request.get(`${base}${path}?page=${page}&pageSize=50`);
    expect(response.status()).toBe(200);
    const data = (await response.json()) as Page<Game>;
    result.push(...data.items);
    if (page >= data.totalPages) return result;
  }
}

test('真实后台：自定义覆盖 Steam，清零恢复，总时长与排序使用最终值', async ({ page, context }) => {
  test.setTimeout(90000);
  const admin = createLiveAdmin();
  let original: Game | undefined;
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await page.goto('/login');
    await page.getByLabel('邮箱', { exact: true }).fill(admin.email);
    await page.getByLabel('密码', { exact: true }).fill(admin.password);
    await page.getByRole('button', { name: '进入工作台' }).click();
    await expect(page).not.toHaveURL(/login/);
    const initial = await games(context.request, '/admin/games');
    original = initial.find(
      (game) => game.isVisible && game.steam && game.steam.playtimeMinutes > 120,
    );
    if (!original) throw new Error('Expected a visible linked game with a Steam snapshot');
    const selected = original;
    const custom = Math.max(...initial.map((game) => game.playtimeHours)) + 100;

    for (const hours of [custom, 0]) {
      await page.goto(`/games/${selected.id}`);
      const input = page.getByLabel('自定义时长（小时）', { exact: true });
      await expect(input).toHaveValue(
        String(hours === custom ? selected.manualPlaytimeHours : custom),
      );
      await input.fill(String(hours));
      const saved = page.waitForResponse(
        (response) =>
          response.url() === `${base}/admin/games/${selected.id}` &&
          response.request().method() === 'PATCH',
      );
      await page.getByRole('button', { name: '保存更改', exact: true }).click();
      const response = await saved;
      expect(response.status()).toBe(200);
      const edited = (await response.json()) as Game;
      expect(edited.manualPlaytimeHours).toBe(hours);
      expect(edited.playtimeHours).toBe(
        hours > 0 ? hours : Math.floor((edited.steam?.playtimeMinutes ?? 0) / 60),
      );
      expect(edited.steamAppId).toBe(selected.steamAppId);

      await page.goto('/games');
      const adminGames = await games(context.request, '/admin/games');
      adminGames.sort(
        (a, b) => b.playtimeHours - a.playtimeHours || a.sortOrder - b.sortOrder || a.id - b.id,
      );
      await expect(page.locator('tbody tr').first()).toContainText(adminGames[0]!.title);
      const published = await games(context.request, '/games');
      const total = published.reduce((sum, game) => sum + game.playtimeHours, 0);
      expect(published.find((game) => game.id === selected.id)?.playtimeHours).toBe(
        edited.playtimeHours,
      );
      const ordered = published.toSorted(
        (a, b) =>
          b.playtimeHours - a.playtimeHours ||
          b.rating - a.rating ||
          a.title.localeCompare(b.title, 'zh-Hans-CN'),
      );
      for (const viewport of [
        { width: 1440, height: 1000 },
        { width: 390, height: 844 },
      ]) {
        await page.setViewportSize(viewport);
        await page.goto('http://localhost:5173');
        await page.locator('.game-showcase').scrollIntoViewIfNeeded();
        await page.getByRole('button', { name: 'Turn screen on', exact: true }).click();
        await expect(page.locator('.game-track-title').first()).toHaveText(ordered[0]!.title);
        await expect(page.locator('.game-time-row span').first()).toHaveText(
          `${ordered[0]!.playtimeHours}h`,
        );
        await expect(page.locator('.game-time-row span').last()).toHaveText(`${total}h`);
        await page.getByRole('button', { name: 'Next game', exact: true }).click();
        await expect(page.locator('.game-track-title').first()).toHaveText(ordered[1]!.title);
      }
    }
    expect(errors).toEqual([]);
  } finally {
    try {
      if (original) {
        const restored = await context.request.patch(`${base}/admin/games/${original.id}`, {
          headers: origin,
          data: { playtimeHours: original.manualPlaytimeHours },
        });
        expect(restored.status()).toBe(200);
      }
    } finally {
      admin.cleanup();
    }
  }
});
