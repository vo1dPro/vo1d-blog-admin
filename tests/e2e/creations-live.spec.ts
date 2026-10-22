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
    await page.goto('/creations');
    await expect(page.locator('.editor-card').first()).toBeVisible();
    const id = await page.locator('.editor-card').first().getAttribute('data-cardid');
    const handle = await page.locator('.editor-card').first().getByLabel('拖动排序').boundingBox();
    const target = await page.locator('.editor-card').nth(1).boundingBox();
    if (!handle || !target) throw new Error('Drag controls missing');
    await page.mouse.move(handle.x + 8, handle.y + 8);
    await page.mouse.down();
    await page.mouse.move(target.x + 50, target.y + 65, { steps: 10 });
    await page.mouse.up();
    expect(await page.locator('.editor-card').first().getAttribute('data-cardid')).not.toBe(id);
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: '放弃未保存修改' }).click();
    const resizeCard=page.locator('.editor-card').nth(1);
    await resizeCard.getByLabel('调整卡片大小').scrollIntoViewIfNeeded();
    const resize=await resizeCard.getByLabel('调整卡片大小').boundingBox();if(!resize)throw new Error('Resize control missing');
    await page.mouse.move(resize.x+5,resize.y+5);await page.mouse.down();await page.mouse.move(resize.x+5,resize.y+65,{steps:8});await page.mouse.up();
    expect(await resizeCard.getAttribute('style')).toMatch(/height: \d+px/);
    page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'放弃未保存修改'}).click();await page.locator('.editor-card').first().getByRole('button',{name:'编辑卡片'}).click();
    for (const name of ['验证技术', '验证生活']) {
      await page.getByLabel('新分类名称').fill(name);
      await page.getByRole('button', { name: '添加', exact: true }).click();
      await page.getByRole('checkbox', { name }).check();
    }
    await page.getByRole('button', { name: '宽幅', exact: true }).click();
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
