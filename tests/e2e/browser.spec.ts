import { test, expect } from '@playwright/test';
import { mockApi, respond, medium, tinyPng } from './mock-api';
test('登录失败、成功返回内部页面、退出与路由保护', async ({ page }) => {
  await mockApi(page, false);
  await page.goto('/games');
  await expect(page).toHaveURL(/login\?returnTo/);
  await page.getByLabel('邮箱', { exact: true }).fill('fail@example.test');
  await page.getByLabel('密码', { exact: true }).fill('test-password-value');
  await page.getByRole('button', { name: '进入工作台' }).click();
  await expect(page.getByRole('alert')).toContainText('邮箱或密码错误');
  await page.getByLabel('邮箱', { exact: true }).fill('admin@example.test');
  await page.getByRole('button', { name: '进入工作台' }).click();
  await expect(page).toHaveURL('/games');
  await page.getByRole('button', { name: '退出登录', exact: true }).click();
  await page.getByRole('button', { name: '确认', exact: true }).click();
  await expect(page).toHaveURL(/login/);
  await expect(page.getByRole('navigation', { name: '工作台导航' })).toHaveCount(0);
});
test('会话失效清除后台，禁止外部登录跳转', async ({ page }) => {
  const state = await mockApi(page);
  await page.goto('/games');
  await expect(page.getByRole('heading', { name: '游戏' })).toBeVisible();
  await expect(page.getByText('测试游戏', { exact: true })).toBeVisible();
  state.expired = true;
  await page.getByRole('link', { name: '书籍', exact: true }).click();
  await expect(page).toHaveURL(/login/);
  await expect(page.getByText('测试游戏', { exact: true })).toHaveCount(0);
  state.expired = false;
  state.authenticated = false;
  await page.goto('/login?returnTo=https://evil.example');
  await page.getByLabel('邮箱', { exact: true }).fill('a@example.test');
  await page.getByLabel('密码', { exact: true }).fill('testing-only-password');
  await page.getByRole('button', { name: '进入工作台' }).click();
  await expect(page).toHaveURL('/');
});
test('列表分页、空状态、失败与重试', async ({ page }) => {
  const state = await mockApi(page);
  state.data.skills = Array.from({ length: 12 }, (_, index) => ({
    id: index + 1,
    name: `技能-${index + 1}`,
    iconKey: 'custom',
    sortOrder: index,
    isVisible: true,
  }));
  await page.goto('/skills');
  await page.getByRole('button', { name: '下一页', exact: true }).click();
  await expect(page.getByText('技能-12', { exact: true })).toBeVisible();
  await expect(page.getByText('技能-1', { exact: true })).toHaveCount(0);
  await page.route('**/admin/books?**', (route) =>
    respond(route, { message: 'temporarily unavailable' }, 503),
  );
  await page.goto('/books');
  await expect(page.getByRole('alert')).toContainText('服务暂时不可用');
  await page.unroute('**/admin/books?**');
  await page.getByRole('button', { name: '重试', exact: true }).click();
  await expect(page.getByText('没有匹配的记录')).toBeVisible();
});
test('创建、409 保留输入、编辑与删除 204', async ({ page }) => {
  const state = await mockApi(page);
  await page.goto('/skills/new');
  await page.getByLabel('技能名称', { exact: true }).fill('新的技能');
  await page.route('**/admin/skills', async (route) => {
    if (route.request().method() === 'POST')
      await respond(route, { message: 'name already exists' }, 409);
    else await route.fallback();
  });
  await page.getByRole('button', { name: '创建并保存' }).click();
  await expect(page.getByRole('alert')).toContainText('name already exists');
  await expect(page.getByLabel('技能名称', { exact: true })).toHaveValue('新的技能');
  await page.unroute('**/admin/skills');
  await page.getByRole('button', { name: '创建并保存' }).click();
  await expect(page).toHaveURL(/\/skills\/101$/);
  await page.getByLabel('技能名称', { exact: true }).fill('更新技能');
  await page.getByRole('button', { name: '保存更改' }).click();
  await expect(page.getByRole('status')).toContainText('保存成功');
  expect(state.writes.at(-1)?.body).toEqual({ name: '更新技能' });
  await page.getByRole('button', { name: '返回列表' }).click();
  await page.getByRole('button', { name: '删除 更新技能' }).click();
  await expect(page.getByRole('dialog')).toContainText('已上传图片仍保留在媒体库');
  await page.getByRole('button', { name: '确认', exact: true }).click();
  await expect(page.getByText('更新技能', { exact: true })).toHaveCount(0);
});
test('未保存提醒', async ({ page }) => {
  await mockApi(page);
  await page.goto('/games/1');
  await page.getByLabel('游戏标题', { exact: true }).fill('未保存的标题');
  await page.getByRole('link', { name: '书籍', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('未保存更改');
  await page.getByRole('button', { name: '取消', exact: true }).last().click();
  await expect(page).toHaveURL('/games/1');
});
test('媒体选择器加载多页', async ({ page }) => {
  const state = await mockApi(page);
  state.data.media = Array.from({ length: 51 }, (_, i) => ({ ...medium, id: i + 1 }));
  await page.goto('/books/new');
  await page.getByRole('button', { name: '选择封面' }).click();
  await expect(page.getByRole('button', { name: '选择素材 51', exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: '选择素材 51', exact: true }).click();
  await expect(page.getByText('素材 #51', { exact: true })).toBeVisible();
});
test('Steam 关联翻页、解除关联、自定义时长与只读字段保护', async ({ page }) => {
  const state = await mockApi(page);
  await page.goto('/games/1');
  await expect(page.getByLabel('自定义时长（小时）')).toHaveValue('7');
  await page.getByRole('button', { name: '选择 Steam 游戏' }).click();
  await page.getByRole('button', { name: '下一页', exact: true }).click();
  await page.getByRole('button', { name: /第二页 Steam 游戏/ }).click();
  await page.getByLabel('自定义时长（小时）').fill('0');
  await page.getByRole('button', { name: '保存更改' }).click();
  await expect(page.getByRole('status')).toContainText('保存成功');
  expect(state.writes.at(-1)?.body).toEqual({ playtimeHours: 0, steamAppId: 999 });
  await page.getByRole('button', { name: '解除关联', exact: true }).click();
  await page.getByRole('button', { name: '保存更改' }).click();
  await expect.poll(() => state.writes.at(-1)?.body).toEqual({ steamAppId: null });
});
test('全局排序包含后续页，失败恢复并可重试保存', async ({ page }) => {
  const state = await mockApi(page);
  state.data.skills = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    name: `技能${i + 1}`,
    iconKey: 'custom',
    sortOrder: i,
    isVisible: true,
  }));
  await page.goto('/skills');
  await page.getByRole('button', { name: '调整顺序' }).click();
  await expect(page.getByRole('dialog').getByText('12. 技能12')).toBeVisible();
  await page.getByRole('button', { name: '下移 1', exact: true }).click();
  await page.route('**/admin/skills/reorder', (route) =>
    respond(route, { message: 'conflict' }, 409),
  );
  await page.getByRole('button', { name: '保存顺序' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible();
  await expect(page.getByRole('dialog').locator('li').first()).toContainText('技能1');
  await page.unroute('**/admin/skills/reorder');
  await page.getByRole('button', { name: '下移 1', exact: true }).click();
  await page.getByRole('button', { name: '保存顺序' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect((state.writes.at(-1)?.body.items as unknown[]).length).toBe(12);
});
test('Steam 429 刷新服务端冷却，不自动重复同步', async ({ page }) => {
  await mockApi(page);
  let attempts = 0;
  await page.route('**/admin/steam/sync', (route) => {
    attempts++;
    return respond(route, { message: 'cooling down; inspect nextSyncAt' }, 429);
  });
  await page.goto('/steam');
  await expect(page.getByRole('button', { name: '立即同步' })).toBeEnabled();
  await page.route('**/admin/steam/status', (route) =>
    respond(route, {
      enabled: true,
      syncing: false,
      steamId: 'test',
      gameCount: 51,
      intervalSeconds: 300,
      libraryVisible: true,
      lastSuccessAt: null,
      nextSyncAt: '2099-01-01T00:00:00Z',
      lastErrorCode: null,
    }),
  );
  await page.getByRole('button', { name: '立即同步' }).click();
  await expect(page.getByRole('alert')).toContainText('冷却');
  await expect(page.getByRole('button', { name: '立即同步' })).toBeDisabled();
  expect(attempts).toBe(1);
});
test('桌面、窄屏、主题与键盘导航', async ({ page }) => {
  await mockApi(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '概览', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '切换深色主题' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: '展开导航' })).toBeVisible();
  await page.getByRole('button', { name: '展开导航' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('link', { name: '照片', exact: true })).toBeVisible();
  await page.getByRole('link', { name: '照片', exact: true }).click();
  await expect(page.getByRole('heading', { name: /^照片/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('上传失败重试、照片两个编号与引用删除提示', async ({ page }) => {
  await mockApi(page);
  let uploads = 0;
  await page.route('**/admin/media/images', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fallback();
      return;
    }
    uploads++;
    if (uploads === 1) await respond(route, { message: 'storage unavailable' }, 503);
    else
      await respond(
        route,
        {
          original: { ...medium, id: 70, kind: 'PHOTO_ORIGINAL' },
          thumbnail: { ...medium, id: 71, kind: 'PHOTO_THUMBNAIL' },
        },
        201,
      );
  });
  await page.goto('/photos/new');
  await page.getByLabel('选择图片文件', { exact: true }).setInputFiles({
    name: 'sample.png',
    mimeType: 'image/png',
    buffer: Buffer.from(tinyPng, 'base64'),
  });
  await page.getByRole('button', { name: '开始上传' }).click();
  await expect(page.getByRole('alert')).toContainText('服务暂时不可用');
  await page.getByRole('button', { name: '重试上传' }).click();
  await expect(page.getByRole('status')).toContainText('展示图 #70 · 缩略图 #71');
  expect(uploads).toBe(2);
  await page.getByRole('link', { name: '媒体库', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('已上传素材仍保留在媒体库');
  await page.getByRole('dialog').getByRole('button', { name: '确认', exact: true }).click();
  await page.route('**/admin/media/1', (route) =>
    respond(route, { message: 'Media asset is still referenced' }, 409),
  );
  await page.getByRole('button', { name: '删除素材 1', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: '确认', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('仍被引用');
});

test('站点单例字段与技能、社交专用表单验证', async ({ page }) => {
  const state = await mockApi(page);
  await page.goto('/site-profile');
  await expect(page.getByRole('button', { name: /新建站点|删除站点/ })).toHaveCount(0);
  await page.getByLabel('显示名', { exact: true }).fill('修改显示名');
  await page.getByRole('button', { name: '保存更改' }).click();
  await expect(page.getByRole('status')).toContainText('保存成功');
  await page.goto('/skills/new');
  await page.getByLabel('技能名称', { exact: true }).fill('新技能');
  await page.getByRole('button', { name: '选择浅色背景图标 / 通用', exact: true }).click();
  await expect(page.getByRole('dialog').locator('.media-option img').first()).toHaveCSS(
    'background-color',
    'rgb(255, 255, 255)',
  );
  await page.getByRole('button', { name: '选择素材 1', exact: true }).click();
  await page.getByRole('button', { name: '选择深色背景图标（可选）', exact: true }).click();
  await expect(page.getByRole('dialog').locator('.media-option img').first()).toHaveCSS(
    'background-color',
    'rgb(17, 17, 17)',
  );
  await page.getByRole('button', { name: '选择素材 1', exact: true }).click();
  for (const theme of ['light', 'dark']) {
    await page.evaluate((value) => {
      document.documentElement.dataset.theme = value;
    }, theme);
    await expect(page.locator('[data-icon-background="light"] .media-selection img')).toHaveCSS(
      'background-color',
      'rgb(255, 255, 255)',
    );
    await expect(page.locator('[data-icon-background="dark"] .media-selection img')).toHaveCSS(
      'background-color',
      'rgb(17, 17, 17)',
    );
  }
  await page.getByLabel('公开展示', { exact: true }).uncheck();
  await page.getByRole('button', { name: '创建并保存' }).click();
  await expect(page).toHaveURL(/\/skills\/101$/);
  expect(state.writes.at(-1)?.body).toMatchObject({
    name: '新技能',
    iconKey: 'custom',
    iconMediaId: 1,
    darkIconMediaId: 1,
    isVisible: false,
    sortOrder: 0,
  });
  await page.goto('/social-links/new');
  await page.getByLabel('名称', { exact: true }).fill('主页');
  await page.getByLabel('平台标识', { exact: true }).fill('github');
  await page.getByLabel('链接地址', { exact: true }).fill('https://example.com');
  await page.getByRole('button', { name: '选择浅色背景图标 / 通用', exact: true }).click();
  await page.getByRole('button', { name: '选择素材 1', exact: true }).click();
  await page.getByRole('button', { name: '创建并保存' }).click();
  await expect(page).toHaveURL(/\/social-links\/100$/);
  expect(state.writes.at(-1)?.body).toMatchObject({
    platform: 'github',
    url: 'https://example.com',
  });
});
