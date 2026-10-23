import { test, expect } from '@playwright/test';
import { createLiveAdmin, loginLiveAdmin } from './live-fixture';
test.use({ channel: 'msedge', viewport: { width: 1600, height: 1050 } });
test('layout workbench persists and drives visitor feed', async ({ page }) => {
  test.setTimeout(150000);
  const admin = createLiveAdmin();
  let original: unknown;
  let revision: number | undefined;
  const endpoint = 'http://localhost:3100/admin/creations/layout';
  try {
    await loginLiveAdmin(page, admin);
    const initial = await page.request.get(endpoint);
    expect(initial.status()).toBe(200);
    original = await initial.json();
    const feed = await (
      await page.request.get('http://localhost:3100/creations?page=1&pageSize=50')
    ).json();
    const chronological = feed.items.map(
      (p: { platform: string; id: string }) => `${p.platform}:${p.id}`,
    );
    const reversed = {
      ...(await initial.json()),
      entries: feed.items
        .map((p: { platform: string; id: string }) => ({
          id: `${p.platform}:${p.id}`,
          span: 1,
          height: null,
          categoryIds: [],
        }))
        .reverse(),
    };
    const seed = await page.request.put(endpoint, {
      headers: { Origin: 'http://localhost:5174' },
      data: reversed,
    });
    expect(seed.status()).toBe(200);
    revision = (await seed.json()).revision;
    await page.goto('/creations');
    await expect(page.locator('.editor-card').first()).toBeVisible();
    const id = await page.locator('.editor-card').first().getAttribute('data-cardid');
    expect(
      await page
        .locator('.editor-card')
        .evaluateAll((es) => es.map((e) => e.getAttribute('data-cardid'))),
    ).toEqual(chronological);
    await expect(page.getByLabel('拖动排序')).toHaveCount(0);
    const resizeCard = page.locator('.editor-card').nth(1);
    await resizeCard.getByLabel('调整卡片大小').scrollIntoViewIfNeeded();
    const resize = await resizeCard.getByLabel('调整卡片大小').boundingBox();
    if (!resize) throw new Error('Resize control missing');
    await page.mouse.move(resize.x + 5, resize.y + 5);
    await page.mouse.down();
    await page.mouse.move(resize.x + 5, resize.y + 65, { steps: 8 });
    await page.mouse.up();
    expect(await resizeCard.getAttribute('style')).toMatch(/height: \d+px/);
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: '放弃未保存修改' }).click();
    await page.locator('.editor-card').first().getByRole('button', { name: '编辑卡片' }).click();
    for (const name of ['验证技术', '验证生活']) {
      await page.getByLabel('新分类名称').fill(name);
      await page.getByRole('button', { name: '添加', exact: true }).click();
      await page.getByRole('checkbox', { name }).check();
    }
    await page.getByRole('button', { name: '宽幅', exact: true }).click();
    await page.locator('#card-height').fill('440');
    await page.getByRole('button', { name: '保存布局', exact: true }).click();
    await expect(page.getByText('已保存，访客页面刷新后生效')).toBeVisible();
    const saved = await (await page.request.get(endpoint)).json();
    revision = saved.revision;
    expect(saved.entries.find((e: { id: string }) => e.id === id).categoryIds).toHaveLength(2);
    await page.reload();
    await expect(page.getByRole('checkbox', { name: '验证技术' })).toBeChecked();
    const second = await page.context().newPage();
    await second.addInitScript(() => sessionStorage.setItem('vo1d-blog:opening-seen', '1'));
    await second.goto('http://localhost:5173/#blog');
    await expect(second.locator('.creation-card').first()).toBeVisible();
    expect(
      await second
        .locator('.creation-card')
        .evaluateAll((es) => es.map((e) => e.getAttribute('data-postid'))),
    ).toEqual(chronological);
    // Editor controls must not consume the saved card height or change post typography.
    const editorCard = page.locator('.editor-card').first();
    const visitorCard = second.locator('.creation-card').first();
    await expect(editorCard).toHaveCSS('height', '440px');
    await expect(visitorCard).toHaveCSS('height', '440px');
    for (const [selector, property] of [
      ['.creation-post', 'display'],
      ['.creation-post', 'padding-left'],
      ['.creation-body', 'font-size'],
      ['.creation-body', 'line-height'],
      ['.creation-avatar', 'width'],
    ] as const) {
      const expected = await editorCard
        .locator(selector)
        .first()
        .evaluate((el, prop) => getComputedStyle(el).getPropertyValue(prop), property);
      await expect(visitorCard.locator(selector).first()).toHaveCSS(property, expected);
    }
    for (const post of await second
      .locator('.creation-card-medium > .creation-card-content > .creation-post')
      .all()) {
      await expect(post).toHaveCSS('display', 'flex');
    }
    const tops = await second
      .locator('.creation-card')
      .evaluateAll((es) => es.map((e) => e.getBoundingClientRect().top));
    expect(tops.every((top, i) => i === 0 || top >= tops[i - 1]!)).toBe(true);
    for (const targetPage of [page, second]) {
      while (await targetPage.getByRole('button', { name: 'Show More', exact: true }).count()) {
        await targetPage.getByRole('button', { name: 'Show More', exact: true }).click();
      }
      const track = targetPage.locator('.creation-photo-track').first();
      await track.scrollIntoViewIfNeeded();
      const box = await track.boundingBox();
      if (!box) throw new Error('Photo track missing');
      const start = await track.evaluate((el) => el.scrollLeft);
      await targetPage.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.4);
      await targetPage.mouse.down();
      await targetPage.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.4, { steps: 12 });
      expect(await track.evaluate((el) => el.scrollLeft)).toBeGreaterThan(start + 20);
      await targetPage.mouse.up();
      await expect(targetPage.locator('.creation-dialog[open]')).toHaveCount(0);
      const previous = track.locator('..').getByRole('button', { name: '上一张照片' });
      await expect(previous).toBeEnabled();
      await previous.click();
      await expect.poll(() => track.evaluate((el) => el.scrollLeft)).toBeLessThan(2);
    }
    await second.getByRole('button', { name: '验证技术', exact: true }).click();
    await expect(second.locator('.creation-card')).toHaveCount(1);
    await expect(second.locator('.creation-card')).toHaveCSS('grid-column-start', 'span 8');
    await second.setViewportSize({ width: 900, height: 900 });
    expect(await second.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await second.setViewportSize({ width: 390, height: 844 });
    expect(await second.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await second.close();
    const response = await page.request.put(endpoint, {
      headers: { Origin: 'http://localhost:5174' },
      data: { ...saved, revision: saved.revision - 1 },
    });
    expect(response.status()).toBe(409);
    const invalid = await page.request.put(endpoint, {
      headers: { Origin: 'http://localhost:5174' },
      data: { ...saved, categories: [] },
    });
    expect(invalid.status()).toBe(400);
    await page.getByLabel('新分类名称').fill('未保存分类');
    await page.getByRole('button', { name: '添加', exact: true }).click();
    const rows = await (
      await page.request.get('http://localhost:3100/admin/creations?page=1&pageSize=1')
    ).json();
    // Existing upstream import is covered by the service suite. Stub only the remote-dependent import response here.
    await page.route('**/admin/creations/import-x', (r) => r.fulfill({ json: rows.items[0] }));
    await page.getByLabel('推文链接', { exact: true }).fill(rows.items[0].sourceUrl);
    await page.getByRole('button', { name: '导入推文', exact: true }).click();
    await expect(page.getByText('推文已导入。分类和布局调整后请点击保存布局。')).toBeVisible();
    await expect(page.getByRole('checkbox', { name: '未保存分类' })).toBeVisible();
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: '放弃未保存修改' }).click();
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: '../demo/creation-editor/integrated-desktop.png' });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: '../demo/creation-editor/integrated-mobile.png' });
    await page.setViewportSize({ width: 1600, height: 1050 });
    await page.evaluate(() => (document.documentElement.dataset.theme = 'dark'));
    await page.waitForTimeout(250);
    await page.screenshot({ path: '../demo/creation-editor/integrated-dark.png' });
  } finally {
    if (original && revision !== undefined) {
      const current = await (await page.request.get(endpoint)).json();
      if (current.revision === revision) {
        const restored = await page.request.put(endpoint, {
          headers: { Origin: 'http://localhost:5174' },
          data: { ...(original as object), revision },
        });
        expect(restored.status()).toBe(200);
      }
    }
    admin.cleanup();
  }
});
