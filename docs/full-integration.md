> 历史记录：本文记录回溯前版本，不代表当前验收结果。当前状态见 [2026-09-08 联动记录](current-integration.md)。

# 三项目完整联动交付

更新：2026-09-07。项目位于同一工作区目录下。三个项目保持独立，没有重新搭建、合并目录或增加依赖。

## 关系与联动范围

```text
管理员 → vo1d-blog-admin:5174 → 后端 /auth、/admin → PostgreSQL / MinIO
访客   → vo1d-blog:5173       → 后端公共根路径接口 → 公开内容和媒体地址
Steam  → 后端定期逐账号同步 → 按账号存快照 → 按 steamAppId 汇总 → /games
```

后端地址为 `http://localhost:3100`，容器内部端口仍为 3000。数据库保存内容和媒体引用，MinIO 保存图片。两个前端都不直接连接数据库；后台使用 HttpOnly Cookie，公共请求使用 `credentials: omit`。

| 模块       | 后台入口         | 后端存储和接口                                               | 博客读取位置                                                         | 状态       |
| ---------- | ---------------- | ------------------------------------------------------------ | -------------------------------------------------------------------- | ---------- |
| 站点资料   | 站点资料         | `site_profiles`、`/site-profile`                             | App 共享资料；HeroSection、SkillsSection、AppFooter、BlogPostSidebar | 已接通     |
| 书籍       | 书籍、媒体库     | `books`、`/books`                                            | HobbiesSection → BookLibrary                                         | 已接通     |
| 照片       | 照片、媒体库     | `photos`、`/photos`                                          | PhotoVelocityGallery → PhotoDetailDialog                             | 已接通     |
| 文章       | 文章、媒体库     | `articles`、`/articles`、详情与 related                      | BlogSection、App、BlogPostPage、ReadMoreSection                      | 已接通     |
| 分类、标签 | 分类、标签       | `categories`、`tags`、`article_tags`，`/categories`、`/tags` | BlogSection 分类和标签筛选                                           | 已接通     |
| 技能       | 技能、媒体库     | `skills`、`/skills`                                          | SkillsSection → IconCloud                                            | 保留并回归 |
| 社交链接   | 社交链接、媒体库 | `social_links`、`/social-links`                              | App 导航、AppFooter                                                  | 保留并回归 |
| 游戏       | 游戏、Steam      | `games`、`steam_games`、`steam_sync_states`，`/games`        | HobbiesSection → GameMusicPlayer                                     | 保留并回归 |

文章公开条件以 `ArticlesService` 为准：`PUBLISHED`、发布时间不为空且已到、分类可见。草稿、归档、未来发布和隐藏分类下的文章不会出现在公开列表、详情或相关文章中。列表与详情使用同一 `cover.url`；后台编辑 `bodyMarkdown`，博客只渲染后端清理后的 `contentHtml`，目录使用 `toc`。没有标题的正文显示无章节目录，不伪造章节。

保留 `/blog/数字ID`，也支持 `/blog/slug`；直接打开和前进后退都可用。分类、标签和页码写入地址查询参数。文章按服务端每页 6 项读取；其他集合按 `totalPages` 获取全部分页。相关文章只展示后端按 `limit=3` 返回的推荐窗口。

原标签数量徽标保留：独立读取所有公开文章摘要来计算当前分类内的标签数量，不把当前页的六项当作全部文章。大量文章时这部分会增加摘要请求量，后续可由后端提供聚合计数再优化；当前不增加接口或依赖。

书架默认顺序遵循后台 `sortOrder`，原阅读顺序、进度、书名和最近阅读排序保留；空日期不造日期，空来源不造链接，`0%` 正常显示。照片使用 `original.url` 和 `thumbnail.url`；后台换图后刷新使用新地址，正在打开的照片被隐藏或删除后，下一次公开刷新会关闭弹窗并恢复焦点。

## 主要修改文件

相对于各项目根目录：

| 项目   | 文件                                                                                                   | 用途                                                                   |
| ------ | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| 博客   | `.node-version`                                                                                        | 统一 Node.js 24.20.0                                                   |
| 博客   | `src/lib/public-content.ts`、`src/lib/site-profile.ts`                                                 | 扩展原请求层和公共类型，共享站点资料；取消、超时、状态、刷新与缓存处理 |
| 博客   | `src/App.tsx`、`src/lib/blog.ts`                                                                       | 异步文章详情、数字和 slug 路径；封面统一读取接口                       |
| 博客   | `HeroSection`、`SkillsSection`、`AppFooter`、`BlogPostSidebar`                                         | 首页、学习、页脚、作者资料和头像接入                                   |
| 博客   | `HobbiesSection`、`BookLibrary`、`src/types/index.ts`                                                  | 书籍接口、默认排序、可空来源和日期                                     |
| 博客   | `PhotoVelocityGallery`、`PhotoDetailDialog`、`ContentImage`                                            | 照片公开集合、换图、失效选中项、图片失败占位                           |
| 博客   | `BlogSection`、`BlogPostPage`、`BlogPrimitives`、`ReadMoreSection`                                     | 分类标签、分页、正文、目录、相关文章与正文样式                         |
| 博客   | `src/data/site-profile.ts`                                                                             | 原站点文案迁移快照，不作为运行时回退数据                               |
| 后端   | `scripts/frontend-source.ts`                                                                           | 导入器兼容独立站点文案快照，保留旧组件提取能力                         |
| 后台   | `tests/e2e/integration.live.spec.ts`、`blog-states.spec.ts`、`live-fixture.ts`、`playwright.config.ts` | 真实联动、补充故障注入和数据恢复                                       |
| 后台   | `scripts/verify-blog-content.mjs`                                                                      | 真实亮屏、三账号分钟核对、主题图标及媒体画布跨域                       |
| 三项目 | README 与接入说明                                                                                      | 更新当前范围、启动和验收说明                                           |

本次没有修改后端公共业务接口、数据库结构、Steam 汇总算法或后台认证方式；无需为本次代码运行数据库迁移。后端导入器只做兼容修复，未执行内容导入。

## 日常启动顺序

每个终端进入相应目录后，确认以下两个命令均显示 `v24.20.0`：

```powershell
node --version
pnpm exec node --version
```

本机已有 fnm 与 `.node-version` 自动切换；如果终端没有启用自动切换，先执行 `fnm env --shell powershell | Out-String | Invoke-Expression` 和 `fnm use 24.20.0`。

1. 启动 Docker Desktop，在后端目录执行：

```powershell
Set-Location ..\vo1d-blog-api
docker compose --profile app up -d
docker compose ps --all
```

复用已有数据库、媒体卷和管理员。不要为日常启动重跑 `import:frontend`、创建管理员或删除卷。后端源码变动时才需要重新构建镜像；宿主开发模式用 `pnpm start:dev`，与容器应用二选一，避免争用 3100。

2. 在后台终端执行：

```powershell
Set-Location ..\vo1d-blog-admin
pnpm dev
```

3. 在博客终端执行：

```powershell
Set-Location ..\vo1d-blog
pnpm dev --host localhost --port 5173 --strictPort
```

访问 [博客](http://localhost:5173)、[后台](http://localhost:5174)、[接口文档](http://localhost:3100/docs) 和 [机器可读契约](http://localhost:3100/docs-json)。新环境安装依赖使用各项目的 `pnpm install --frozen-lockfile`；已有依赖不需要每次重装。

两个前端的非敏感配置均为 `VITE_API_BASE_URL=http://localhost:3100`；已有环境文件不要覆盖。后端跨域来源精确包含 `http://localhost:5173` 和 `http://localhost:5174`。MinIO 图片域需要独立允许博客来源，普通图片可显示不等于画布像素可读取。

## 后台修改后如何查看

在后台保存成功后，刷新博客对应区块。文章可直接打开数字地址；要公开，必须满足文章状态、发布时间和分类可见性条件。照片和书籍等内容需勾选公开展示。上传图片后还要保存业务表单，单独上传不等于已更换引用。

博客请求统一使用 `cache: no-store`，刷新后重新向接口获取；可见页面每 60 秒及重新获得焦点时刷新。请求失败显示错误和重试，成功空列表保持空；背景网络失败可保留旧内容并提示错误，明确 401/403/404 时清除旧详情。接口本身仍声明公开缓存，如部署层强制缓存，需检查代理是否遵循请求缓存指令。

## 验证与证据

实际结果：2026-09-06 后端类型、静态检查、构建、125 项单元测试与 49 项隔离测试全部通过，后台 31 项单元测试通过。2026-09-07 三项目 Node 与 pnpm 内 Node 均核对为 24.20.0，两个前端类型、静态检查和构建通过；完整 17 项浏览器测试通过，随后补回标签计数后的 3 项相关浏览器回归也全部通过。只读公共内容脚本通过，实际完成播放器亮屏、三账号分钟求和、图标深浅切换及跨域画布像素读取。最终截图另检查了恢复后真实内容。

各项目使用实际已有命令：

| 目录 | 命令                                                                      | 验证范围                                                  |
| ---- | ------------------------------------------------------------------------- | --------------------------------------------------------- |
| 博客 | `pnpm exec tsc -b`、`pnpm lint`、`pnpm build`                             | 类型、静态检查、生产构建                                  |
| 后台 | `pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm build`                  | 类型、静态检查、31 项单元测试、构建                       |
| 后端 | `pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm test:e2e`、`pnpm build` | 类型、静态检查、125 项单元测试、49 项隔离数据库测试、构建 |
| 后台 | `pnpm test:e2e`                                                           | 管理后台浏览器测试、真实联动及补充故障注入                |
| 后台 | `node scripts/verify-blog-content.mjs`                                    | 真实公共接口、播放器亮屏、三账号汇总、主题、画布跨域      |

博客没有 `pnpm test` 脚本；浏览器覆盖复用后台已有 Playwright，无新增测试依赖。整套浏览器测试要求两个前端和后端运行；真实用例通过本地开发后端容器临时创建测试身份，凭据只留在内存和标准输入，结束删除。站点单例先记录原字段，在 finally 中由后端恢复；只清理明确记录的临时编号，保留原管理员和业务记录。隔离数据库测试只使用已有 `TEST_DATABASE_URL` 指向的测试库。

- 本地 `full-integration-verification.json`：资料、书籍、照片、文章、分页和数据恢复。
- 本地 `blog-content-verification.json`：真实读取资源、当前 Steam 分钟、亮屏、主题图标和跨域像素读取。
- 本地 `live-verification.json`：管理流程、原记录保留和会话清理。

这些原始验收记录可能包含真实账号或运行数据，与 `docs/screenshots/` 一并由 `.gitignore` 排除，不随仓库发布；以上名称均相对于本文所在目录。

截图保存在 `docs/screenshots`，包括桌面／移动端、深浅主题、书架、技能球和亮屏播放器。部分联动截图包含临时验证记录，测试结束已清理。

空数据、503、429、204、图片失败、跨页集合及迟到响应通过独立故障注入覆盖；真实保存、媒体、发布撤回和路由流程使用本机真实接口，没有用模拟结果代替真实联动。

## 保留在前端的内容与限制

主题、布局、动画、分类图标映射、页脚手势、Apple 装饰、三维模型、播放器状态、筛选排序状态、访客临时喜欢和社交悬浮截图仍由前端维护。没有新增访客账号、评论、持久化喜欢、统计或任意网址代理。原静态数组保留；110 个已迁移原始媒体已于 2026-09-07 移至桌面归档，详见 [原始资源归档](../../vo1d-blog/README.md#原始资源归档)。归档附有迁移数组副本及校验清单；后台编辑不会反向写入这些文件。

本地联动范围已实现。生产部署、域名和代理环境未运行验收；生产静态站点需将 `/blog/*` 回退到 `index.html`，媒体跨域按部署来源配置。博客构建仍有原有的大分块提醒，社交悬浮截图仍依赖外部网络。Steam 为定期快照，可能出现 `stale` 或 `incomplete`，按账号准确分钟相加后取整，小时数不得硬编码。
