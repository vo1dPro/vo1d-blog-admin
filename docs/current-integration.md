# 当前三项目联动记录

验收日期：2026-09-08（Asia/Hong_Kong）。以本文件、当前源码和带时间戳的本次验证结果为准。旧文档中的“全部接入”不作为本次依据。

## 结果与目录

三个项目放在同一工作区目录下。三个项目保持独立：

| 项目            | 职责                                 | 当前本地地址          |
| --------------- | ------------------------------------ | --------------------- |
| vo1d-blog       | React 展示、布局、动画、公开内容读取 | http://localhost:5173 |
| vo1d-blog-api   | NestJS 认证、业务、媒体、Steam 同步  | http://localhost:3100 |
| vo1d-blog-admin | React 管理界面，通过后端操作内容     | http://localhost:5174 |

管理后台 → 后端 → PostgreSQL / MinIO；展示端 → 后端公开接口；Steam → 后端 → 数据库快照 → 游戏展示。公开路径保持根路径，无 `/api` 或项目级 `/v1`。文档为 `/docs`、`/docs-json`。

首次盘点时仅展示端有 Git 历史；2026-09-08 收尾重新检查，三个目录的 `git rev-parse --show-toplevel` 都已返回各自目录，均已有提交。工作期间新增的提交和现有后台编辑均予以保留，没有重置版本历史。

## 后台无法运行的原因与修复

PostgreSQL 容器仍挂载移动前目录下的初始化脚本，退出后使健康检查返回 503、公开业务接口返回 500。后端 `.env` 丢失，部分依赖链接也仍指向旧的导出目录。

- 从既有容器配置恢复本地环境值，沿用原数据库、MinIO、会话配置和 3 个 Steam 账号；不输出凭据，不重建原管理员。
- 从当前目录重新创建 PostgreSQL、初始化辅助容器和 API，保留 `vo1d-blog-api_postgres_data`、`vo1d-blog-api_minio_data`。
- `docker-compose.yml` 的脚本挂载改用长格式并设置 `create_host_path: false`，避免路径不存在时自动创建错误目录。
- 后端 `.env.example`、`scripts/setup-local.ts`、Compose 本地默认端口统一为 3100；容器内部仍为 3000。已有 `.env` 不覆盖。
- 重装损坏的后端依赖，按锁文件运行；三个目录均验证 Node.js 24.20.0、pnpm 10.23.0，且 `pnpm exec node --version` 同样为 24.20.0。
- 重启后出现过 Vite `504 Outdated Optimize Dep`，停止旧展示端服务、用 `--force` 重新优化后恢复；属于缓存故障，未调整界面样式。

当前 MinIO 容器的历史 Compose 标签仍含旧目录，但其运行只依赖命名卷，没有旧宿主路径挂载；当前 Compose 启动已验证通过。旧 verification、历史截图和历史说明内的旧目录保留为历史记录，并添加提示。它们不是运行时依赖。

## 业务接入与文件

展示端公共请求统一位于 `src/services/client.ts`，公共模型为 `src/services/model.ts`。每个业务都有 `src/services/<业务>/index.ts` 和 `model.ts`，没有恢复旧的 `src/lib/public-content.ts`。

| 业务       | 原数据源 / 位置                                            | 公开接口                              | 后台页面                    | 当前接入位置                                                                |
| ---------- | ---------------------------------------------------------- | ------------------------------------- | --------------------------- | --------------------------------------------------------------------------- |
| 站点资料   | Hero、Skills、Footer 等组件内业务文案                      | `/site-profile`                       | `/site-profile`             | SiteContentProvider、HeroSection、SkillsSection、AppFooter、BlogPostSidebar |
| 文章       | `src/data/articles.ts`、`src/lib/blog.ts` 本地数组和封面表 | `/articles`、`/articles/:slugOrId`    | `/articles`                 | BlogSection、ArticleRoute、BlogPostPage、FinderArticleReader                |
| 相关文章   | 本地文章筛选                                               | `/articles/:slugOrId/related?limit=3` | 由文章分类标签管理          | ReadMoreSection                                                             |
| 分类、标签 | 文章数组中的分类标签                                       | `/categories`、`/tags`                | `/categories`、`/tags`      | articles 服务的完整目录、既有文章筛选；分类图标映射仍在前端                 |
| 书籍       | `src/data/books.ts`                                        | `/books`                              | `/books`                    | HobbiesSection → BookLibrary                                                |
| 游戏       | `src/data/games.ts`                                        | `/games`                              | `/games`、`/steam`          | HobbiesSection → GameMusicPlayer                                            |
| 照片       | `src/data/photos.ts`                                       | `/photos`                             | `/photos`                   | PhotoVelocityGallery、PhotoDetailDialog                                     |
| 技能       | `src/data/skills.ts`                                       | `/skills`                             | `/skills`                   | SkillsSection，使用 icon / darkIcon 媒体                                    |
| 社交链接   | `src/data/socials.ts`                                      | `/social-links`                       | `/social-links`             | App / StaggeredMenu、AppFooter、SocialIconLink                              |
| 业务媒体   | `public/images` 中本地业务图片                             | 上述接口的媒体对象 URL                | `/media` 及各编辑器素材选择 | 封面、原图、缩略图、头像和深浅主题图标                                      |

主要公共组件与状态文件：`src/hooks/usePublicQuery.ts`、`src/hooks/site-content-context.ts`、`src/components/QueryContent/index.tsx`、`SiteContentProvider`、`ArticleRoute`、`ArticleBody`。`src/types/index.ts` 复用业务模型；`src/lib/blog.ts` 只保留格式化、路径和真实字段辅助逻辑。

按用户补充要求，`GameMusicPlayer/index.tsx` 先将游戏按 `playtimeHours` 降序排列，列表、初始项、列表选择及上一首 / 下一首使用同一数组。相同时长保留评分降序、名称排序规则，首尾循环保持原交互。`tests/e2e/blog-states.spec.ts` 新增与字母顺序相反的数据，覆盖桌面和手机切换、选择及循环。后台 `index.html` 及 `public/favicon.jpg` 复用现有博客站点图标，修复标签页图标 404。

后台沿用 `src/api/client.ts` 的 `credentials: include`、Cookie 会话、204 和错误处理。未引入新业务依赖、评论、访客账号或持久化点赞系统。

## 接口与状态规则

- 列表按后端分页元数据逐页读取，每页 50；校验页号、总量、总页数及重复 ID。第二页失败或列表中途变化显示可重试错误，不展示不完整结果。现有筛选和页面布局保持原样。
- 公共请求 `credentials: omit`、`cache: no-store`，刷新看到当前内容；15 秒超时。`usePublicQuery` 取消卸载请求，按请求标识隔离迟到结果。
- 明确区分加载、成功、空列表、错误。成功空列表不回退静态数据；失败不假装为空；429 按 `Retry-After` 等待再重试。
- 映射保留 `0`、`false`、`null`；日期缺失不生成虚构日期。业务图片使用后端地址，照片加载失败提供明确提示和重试。
- 书籍公开条件 `isVisible=true`，默认 `sortOrder → readingOrder → id`；游戏、照片、技能和社交按后端公开可见性及排序返回。前端保留既有手动排序和搜索交互。
- 文章须 `PUBLISHED`、发布时间不为空且不晚于当前时间、所属分类可见。列表按发布时间和 ID 倒序；草稿、归档、未来发布、隐藏分类下文章返回 404。数字 ID 链接保留，同时支持 slug。
- 后台编辑 `bodyMarkdown`；展示端仅渲染后端清理的 `contentHtml`，使用真实封面、分类、标签、阅读时长、目录和 SEO 字段。相关文章使用独立接口。
- Finder 阅读组件也已接入详情服务，并通过独立浏览器挂载检查。当前 App 没有挂载 Finder 入口，本次不增加入口或改变现有导航。

## Steam 边界修复

3 个账号配置和快照保留；同一 `steamAppId` 按账号去重，累计分钟后统一 `floor(totalMinutes / 60)`。浏览器只使用后端 `playtimeHours`，自定义字段为 `manualPlaytimeHours`（保留原接口字段名）。自定义大于 0 时覆盖 Steam 时长，0 使用 Steam；无快照且自定义为 0 时显示 0。总时长只累计各公开游戏的最终 `playtimeHours`，不再额外叠加 Steam 或自定义值。

收尾发现原实现会在 `PRIVATE_LIBRARY` / `UNAUTHORIZED` 后排除旧账号快照，导致已关联游戏展示时长下降。修改 `src/steam/steam.service.ts`、`steam-aggregate.ts`：已关联游戏继续采用仍在配置中的账号最近成功快照，返回 `stale` / `incomplete`；从未成功的账号、已移除配置和已确认不再拥有的游戏不计入。新关联和管理端可选游戏库仍要求当前可见的快照。

补充 `src/steam/steam-aggregate.spec.ts`、`test/api.e2e-spec.ts`，覆盖鉴权/私密失败、分钟合计后取整、公共及管理游戏响应、禁止新建无效关联。真实账号的失败场景未主动触发，使用模拟上游和独立测试库验证。

## 数据与归档

归档目录：系统桌面目录下的 `博客联动备份-20260908-001721`。

| 文件                                            | 内容                                                               |
| ----------------------------------------------- | ------------------------------------------------------------------ |
| `static-data-before.zip`                        | 原静态数据、业务图片和原文案组件                                   |
| `static-manifest.json`                          | 134 个原静态数据 / 图片条目的 SHA-256 校验值，已逐项核对压缩包内容 |
| `removed-media.json`                            | 115 个已移除的业务及未使用图片清单                                 |
| `source-before.zip`                             | 实施前的三个项目源码                                               |
| `postgres-before.tar.gz`、`minio-before.tar.gz` | 实施前原数据卷归档                                                 |

已移除 6 个静态业务源文件及其导入。前端保留装饰图片、主题、布局图标和三维模型。归档解压源位于根目录 `.integration-work/static-import-source`；只读 `import:frontend --check` 已通过，明确返回未写入。未对内容库执行完整导入。

2026-09-08 10:05 的只读快照：管理员 1、文章 6、分类 6、标签 11、书籍 3、游戏 47、照片 10、技能 23、社交 4、媒体索引 / 对象各 112、Steam 快照 112、同步状态 3。112 个对象大小与索引一致，全部匿名 HEAD 200 且允许 localhost:5173 跨域读取。原管理员身份、密码哈希及启用状态校验一致；未重建原管理员。

32 个公开游戏关联 Steam，逐项对照数据库汇总分钟、展示取整、自定义时长，无重复 App ID。数据库迁移状态已核对，既有 4 份迁移均已应用，没有重置内容库。

真实联调以每项测试开始前的数据为基线，临时内容 / 素材 / 测试身份在 finally 清理，恢复站点资料并核对原 ID。工作期间的其他编辑保持当前状态：与最早归档相比，游戏平台字段已有变化；收尾读取期间 Chrome 技能先不公开、随后不再存在，因此当前为 23 项。没有依据旧归档擅自恢复这些编辑。数量是时间点记录，不能当作今后固定值。

## 实际验证

| 项目 / 检查                                                   | 结果                                                                                                                                                |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 展示端 `pnpm lint`、`pnpm build`                              | 通过；构建保留大于 500 kB 的分块提示                                                                                                                |
| 后台 `pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm build` | 通过；31 项单元测试                                                                                                                                 |
| 后端 `pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm build` | 通过；127 项单元测试                                                                                                                                |
| 后端 `pnpm test:e2e`                                          | 通过；独立 `vo1d_blog_test` 中 50 项测试                                                                                                            |
| 后台 `pnpm test:e2e --project=browser`                        | 12 项管理界面测试通过；4 项博客异常测试最初受 Vite 缓存 504 影响，修复缓存后单独重跑全部通过，新增游戏顺序回归后，博客 5 项再次全部通过，合计 17 项 |
| 后台 `pnpm test:e2e --project=live`                           | 3 项真实浏览器联动通过，临时数据已恢复                                                                                                              |
| Finder 临时浏览器挂载                                         | 真实正文、切换、503、重试、卸载通过，无页面异常；未添加应用入口                                                                                     |
| 样式回归                                                      | 7 个原有 CSS 文件 SHA-256 完全相同；1440×1000 / 390×844 下书本字体、颜色、尺寸、author / progress 与修改前一致                                      |
| 媒体 / 布局                                                   | 书籍图片逐项解码成功；桌面和手机深浅主题截图通过，无横向溢出；照片错误与重试通过                                                                    |

真实联动覆盖：后台保存资料 / 头像；书籍创建、编辑、换图、0 进度、空日期、排序、隐藏；照片原图和缩略图更换、详情、Escape、隐藏删除；文章草稿发布撤回归档、隐藏分类、未来发布时间、数字 / slug 详情、清理后的正文和目录、3 篇相关文章；52 条真实临时文章跨两页读取并使用原标签筛选。公开列表故障注入覆盖加载、空、失败、重试、204、429、迟到响应及分页错误。

社交悬浮预览已实际打开、关闭并核对目标链接，第三方截图加载成功，控制台与网络无异常。最新后端容器从当前源码构建并启动，公开列表、文章详情和管理登录重新检查通过；未登录的 `/auth/me` 返回 401 是正常会话检查。

证据：最终页面与游戏顺序（本地文件 `final-browser-verification.json`，不随仓库发布）、悬浮预览（本地文件 `preview-verification.json`，不随仓库发布）、真实联动（本地文件 `full-integration-verification.json`，不随仓库发布）、后台联动（本地文件 `live-verification.json`，不随仓库发布）、数据和媒体（本地文件 `current-integration-verification.json`，不随仓库发布）、Finder（本地文件 `finder-verification.json`，不随仓库发布）、样式（本地文件 `style-verification.json`，不随仓库发布）。本次书籍截图为 `docs/screenshots/current-books-*`，游戏排序截图为 `docs/screenshots/current-game-playtime-order.png`。

未运行：生产部署、异机备份恢复演练、真实 Steam 账号断网/鉴权破坏测试、全站所有动画的逐帧像素比较。未将这些项目宣称为通过。

日常启动命令、隔离测试命令及环境保护要求见 [usage-guide.md](usage-guide.md)。

## 2026-09-08 自定义时长验收

后台已将“手工时长”改为“自定义时长”，并显示覆盖规则：大于 0 覆盖 Steam（允许低于 Steam），0 使用 Steam；无快照且自定义为 0 时展示 0。保留原接口字段名和数据库结构。公开播放器及后台排序均使用最终展示时长，总时长不重复叠加。

本轮读取全部管理列表，确认 47 款游戏的自定义值均为 0；读取时已经全部为 0，因此没有重复批量写入。未创建时长备份。真实浏览器临时填写正数、保存并刷新博客后，桌面和手机的游戏时长、总时长、排序和下一首均正确，测试后已恢复 0。最终 47 款公开游戏合计 3214 小时，这是验收时点值，会随 Steam 同步或后续自定义编辑变化。公开页面控制台错误和失败网络响应均为 0。

本轮实际运行：后端 typecheck、lint、127 项单元测试、独立测试库 52 项端到端测试及 build 全通过；后台 typecheck、lint、31 项单元测试及 build 全通过；12 项管理界面、5 项博客状态与排序测试、1 项新增自定义时长真实联调全部通过。新后端镜像已构建启动，接口描述和后台生成类型已更新。

新增回归文件：`tests/e2e/custom-hours.live.spec.ts`。本轮未修改博客组件或样式；博客 lint/build 和原有 3 项完整真实联调本轮未运行，前表中的对应记录属于此前验收。
