# vo1d-blog 三项目使用说明

核对日期：2026-09-06。适用目录：`D:\Code_Project\vo1d-blog`、`D:\Code_Project\vo1d-blog-api`、`D:\Code_Project\vo1d-blog-admin`。

本文根据三个项目的当前源码、配置、导入脚本及本机运行中的后端核对整理。数据库数量是核对时的快照，后续编辑或 Steam 同步会使其变化。

## 1. 当前完成到哪一步

**主要业务数据已导入后端，管理后台和博客所有目标业务模块均已接入。完整验收和修改文件见 [联动交付说明](full-integration.md)。**

2026-09-06 后续更新：已迁移技能和社交图标，已配置三个 Steam 账号并汇总时长。操作与验证见 [图标与多账号说明](icons-multi-steam.md)。

后台保存站点资料、文章、分类标签、书籍、照片、技能、社交链接和游戏后，刷新博客即可读取最新公开内容。草稿、归档、未到发布时间的文章及隐藏分类下的文章不会公开。

| 项目              | 职责                                                                        | 当前数据来源                                      | 本地访问地址                           |
| ----------------- | --------------------------------------------------------------------------- | ------------------------------------------------- | -------------------------------------- |
| `vo1d-blog`       | 面向访客的博客展示页面，React + Vite                                        | 后端全部公开业务内容；前端布局、动画和临时状态              | [博客](http://localhost:5173)          |
| `vo1d-blog-api`   | API（Application Programming Interface，应用程序编程接口），NestJS + Prisma | PostgreSQL 数据库、MinIO 对象存储、Steam 同步快照 | [接口文档](http://localhost:3100/docs) |
| `vo1d-blog-admin` | 独立中文内容管理后台，React + Vite                                          | 通过后端 `/admin/...` 和 `/auth/...` 接口读写     | [管理后台](http://localhost:5174)      |

当前数据流：

```text
vo1d-blog/src/data + 部分组件文案 + 业务图片
          │ 首次显式导入（不会持续同步）
          ▼
PostgreSQL（内容、媒体索引） + MinIO（图片文件）
          ▲
          │ vo1d-blog-api 读写
          ▼
vo1d-blog-admin（管理界面）

Steam → vo1d-blog-api 定期同步 → PostgreSQL 快照

vo1d-blog 页面 → 公共接口 → 全部公开业务内容与媒体 URL
```

后端日常运行不依赖博客源码目录；只有执行 `import:frontend` 或 `import:icons` 时需要该目录。管理后台运行时不直接连接数据库或对象存储管理接口。

## 2. 已迁移至后端的数据

下面的“已迁移”表示已有后端存储、接口和导入数据，**不表示博客组件已改为读取接口**。业务内容条目数与原导入基线一致，媒体增加了图标；本次未逐字段比较历史后台编辑与原始静态数据。

| 数据           | 博客原始位置（相对于 `vo1d-blog`）                                       | 后端表 / 存储               | 当前数量  | 后台管理位置          |
| -------------- | ------------------------------------------------------------------------ | --------------------------- | --------- | --------------------- |
| 站点资料       | `HeroSection`、`BlogPostSidebar`、`SkillsSection`、`AppFooter` 组件      | `site_profiles`             | 1         | 站点资料              |
| 文章           | `src/data/articles.ts` 的 `articles`                                     | `articles`                  | 6         | 文章                  |
| 分类           | `src/data/articles.ts` 的 `categories`                                   | `categories`                | 6         | 分类                  |
| 标签及文章关联 | 从文章 `tags` 去重提取                                                   | `tags`、`article_tags`      | 11 个标签 | 标签 / 文章编辑       |
| 书籍           | `src/data/books.ts`                                                      | `books`                     | 3         | 书籍                  |
| 游戏           | `src/data/games.ts`                                                      | `games`                     | 47        | 游戏                  |
| 照片信息       | `src/data/photos.ts`                                                     | `photos`                    | 10        | 照片                  |
| 技能信息       | `src/data/skills.ts`                                                     | `skills`                    | 24        | 技能                  |
| 社交链接       | `src/data/socials.ts`                                                    | `social_links`              | 3         | 社交链接              |
| 业务图片       | `public/images` 中被上述内容引用的图片；文章封面列表在 `src/lib/blog.ts` | `media_assets` + MinIO 对象 | 76        | 媒体库 / 各内容编辑页 |

### 2.1 各类数据具体迁移了什么

- **站点资料**：显示名称 `displayName`、身份介绍 `role`、首页标题前缀 `heroTitlePrefix`、首页说明 `heroDescription`、学习文案 `learningNote`、页脚文案 `footerMessage`。后端另支持头像关联 `avatarMediaId`，但原始导入没有上传头像；原博客侧栏使用的是人物图标。
- **文章**：标题、摘要、正文、分类、标签、发布日期和封面。原 `content: string[]` 转换为 `bodyMarkdown`；公共详情接口提供清理后的 `contentHtml`。初始导入设置为 `PUBLISHED`，生成 `article-原编号` 形式的 slug（地址标识）及预计阅读分钟数；搜索引擎相关字段 `seoTitle`、`seoDescription` 初始为空，后续可在后台维护。
- **分类和标签**：分类名称、键、图标键、顺序；标签及文章关联。`all` 分类保留用于兼容聚合展示，公共文章请求 `category=all` 表示全部文章。
- **书籍**：标题、作者、封面、强调色、来源名称及链接、阅读顺序、阅读进度和日期。原 `readingTime` 映射为 `lastReadAt`；`sourceName=xx`、`sourceUrl=#` 转为空值。
- **游戏**：标题、封面、平台、个人评分、手工时长、喜爱等级和评论。评分及小时数的 `0` 保留；没有填写的平台为空；“暂无评价”转为空。喜爱等级范围是 0～5。
- **照片**：标题、说明、替代文本、展示图与缩略图关联。源数据没有拍摄时间，因此 `capturedAt` 初始为空，可在后台补充。
- **技能和社交链接**：名称、链接、平台或图标键等业务信息；顺序和可见性由后端保存。图标文件已迁移到后端媒体，后台支持上传与替换通用和深色版本，接口返回 icon / darkIcon。
- **顺序和可见性**：分类、书籍、游戏、照片、技能、社交链接支持后端保存。文章使用发布状态控制公开，标签没有独立可见性开关。

### 2.2 图片迁移范围

原始内容的 76 个媒体记录由以下部分组成：文章封面 6 + 书籍封面 3 + 游戏封面 47 + 照片展示图 10 + 原有照片缩略图 10。

图片经过校验与重新编码后保存为 WebP 对象。**数据库保存对象键、格式、大小、尺寸、替代文本及业务关联；图片二进制保存在 MinIO，不在数据库内。** 当前媒体访问基址是 `http://localhost:9000/vo1d-media`。

图标迁移另增加 34 个媒体对象，当前完整媒体基线为 110；原始内容导入不包含图标。

导入器按文章编号 1～6 绑定 `thumbnails` 中的封面，不复用原前端运行时可能错位的封面索引计算；同时显式处理六个旧游戏图片文件名差异。它只导入被引用的业务图片，不会把整个 `public` 目录搬到对象存储。

原博客数组仍保留；110 个已迁移原始媒体已移至桌面归档，详见 [原始资源归档](../../vo1d-blog/README.md#原始资源归档)。需要检查迁移源时，使用归档路径作为 --source；全部目标业务模块运行时已使用后端。原站点文案另存于 src/data/site-profile.ts，导入器兼容读取。迁移也不会把后台新上传的图片反向写入博客的 `public/images`。

### 2.3 后端新增的数据能力

以下是后端新增能力，不是从原静态数组迁移来的数据：

| 数据           | 存储与用途                                                                      |
| -------------- | ------------------------------------------------------------------------------- |
| 管理员         | `admin_users`，保存管理员及密码哈希；没有默认账号                               |
| 登录会话       | `admin_sessions`，保存会话令牌哈希；浏览器通过 HttpOnly Cookie 携带会话         |
| 登录限流       | `login_throttles`，限制重复登录尝试                                             |
| Steam 游戏快照 | `steam_games`，保存游戏标识、名称、累计分钟、近两周分钟、最后游玩时间和同步时间 |
| Steam 同步状态 | `steam_sync_states`，保存成功时间、错误码、下次同步时间等                       |

初次核对时为单账号 54 条快照、12 个游戏关联。后续已扩展三个账号，本次库数量为 54 / 22 / 36，按 App ID 合并为 103 个游戏，47 个博客条目中有 32 个关联；后续数量以后台状态为准。

## 3. 未迁移至后端的内容

其中一部分是有意保留在前端的界面资源和状态，另一部分是尚未实现的业务能力。

| 内容                                               | 当前所在位置 / 行为                                                | 后端现状                                                           |
| -------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| 分类图标的图形资源                                 | 组件图标映射                                                       | 仍使用本地映射；技能与社交图标已迁移                               |
| 页脚手势图片                                       | `public/images/footer`                                             | 未导入；页脚文案已导入                                             |
| Apple 风格装饰图片                                 | `public/images/apple-icons`、`GameMusicPlayer` 内图形              | 未导入                                                             |
| 三维模型                                           | `public/models/xbox.glb`、`public/models/ghost-protocol-glock.glb` | 未导入                                                             |
| 布局、动画、光标、平滑滚动、取色逻辑               | 各前端组件和样式文件                                               | 仍由前端代码维护                                                   |
| 导航、区块标题等界面文案             | `App`、`BlogPostSidebar` 等组件                                    | 未提供通用菜单管理；文章目录来自接口 toc，站点资料仅包含上一节列出的字段 |
| 主题偏好                                           | 浏览器 `localStorage`                                              | 不跨设备同步                                                       |
| 游戏临时喜欢状态、当前项、切换模式、筛选与排序选择 | React 组件状态，例如 `GameMusicPlayer` 的 `likedIds`               | 不持久化到后端；临时喜欢状态不等于站长编辑的 `likeLevel`           |
| 社交链接悬浮截图                                   | `SocialLinkPreview` 通过图片地址访问 Microlink                     | 未建立本项目的截图代理、截图存储或截图管理接口                     |
| 访客账号、评论、持久化点赞收藏、访问统计、订阅     | 无相应完整业务实现                                                 | 当前后端没有这些模块；游戏评论字段是站长评价，不是访客评论系统     |

业务内容通过后台维护，刷新博客查看；布局和交互仍修改前端代码。不要把导入脚本当作双向同步工具。

## 4. 环境与端口

### 4.1 运行环境

后端和管理后台要求 Node.js `>=24.15.0 <25`，项目 `.node-version` 为 `24.20.0`，pnpm 为 `10.23.0`。博客当前没有在 `package.json` 声明 Node 版本范围，启动它时也可在终端选择相同的 Node 24，减少工具链差异；不需要修改博客依赖版本。

本机使用 fnm 管理 Node。每个新开的 PowerShell 终端先执行：

```powershell
fnm env --shell powershell | Out-String | Invoke-Expression
fnm use 24.20.0
node --version
pnpm --version
```

若尚未安装此 Node 版本，先执行 `fnm install 24.20.0`。其他 Node 管理工具用户切换到相同版本即可。pnpm 尚未配置时，在已切换 Node 的终端执行：

```powershell
corepack enable
corepack prepare pnpm@10.23.0 --activate
```

启动后端基础设施还需要 Docker Desktop，使用 Linux 容器引擎。三个项目分别安装依赖，不是一个共享安装命令的工作区。

### 4.2 本文统一使用的本地配置

| 服务           | 宿主机端口 | 说明                                                                  |
| -------------- | ---------- | --------------------------------------------------------------------- |
| 博客展示端     | 5173       | 本文启动命令显式固定端口；原 `vite.config.ts` 未固定                  |
| 管理后台       | 5174       | `vite.config.ts` 固定，端口占用直接报错                               |
| 后端           | 3100       | 当前 `.env` 的 `PORT=3100`；容器内部仍为 3000                         |
| PostgreSQL     | 5433       | 宿主映射至容器内部 5432                                               |
| MinIO 图片服务 | 9000       | 图片地址依赖此服务                                                    |
| MinIO 控制台   | 9001       | [对象存储控制台](http://localhost:9001)，使用后端本地配置中的管理凭据 |

**端口易混点：** 后端 `.env.example` 和 `setup:local` 生成的默认值是 `PORT=3000`；当前这台机器已配置为 `3100`。新环境按下文将其改为 3100；如选择 3000，管理后台的 `VITE_API_BASE_URL`、允许来源和访问命令也要一起改。

后端 `.env` 中核对以下非敏感配置，保留文件内其他数据库、存储及密钥配置：

```dotenv
PORT=3100
FRONTEND_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:3100
MEDIA_PUBLIC_BASE_URL=http://localhost:9000/vo1d-media
```

`FRONTEND_ORIGINS` 配置 CORS（Cross-Origin Resource Sharing，跨源资源共享）允许来源，必须精确匹配协议、主机名及端口，不加尾斜杠。本地统一使用 `localhost`，避免与 `127.0.0.1` 混用造成来源或 Cookie 不匹配。

## 5. 首次初始化后端（新环境才需要）

本机已经有业务数据和运行中的后端。日常使用直接看第 6 节；不要为启动项目重新导入数据或重建管理员。

### 5.1 安装并生成本地配置

在已切换到 Node 24 的 PowerShell 中执行：

```powershell
Set-Location D:\Code_Project\vo1d-blog-api
pnpm install --frozen-lockfile
pnpm setup:local
```

`setup:local` 仅在 `.env` 不存在时生成随机本地数据库、对象存储密码等配置，不覆盖已有文件，也不创建管理员。生成后先按第 4.2 节修改端口和允许来源。不要直接用仍带占位值的 `.env.example` 启动。

### 5.2 启动数据库和对象存储，应用数据库结构

继续在后端目录执行：

```powershell
docker compose up -d postgres minio minio-init
docker compose ps --all
pnpm prisma:generate
pnpm prisma:migrate:deploy
pnpm prisma:migrate:status
```

等待 `postgres`、`minio` 健康，`minio-init` 以 `Exited (0)` 完成后执行迁移。`minio-init` 是一次性初始化服务，退出成功属于正常情况。

`prisma:migrate:deploy` 创建或更新数据库结构，**不导入博客内容**；`prisma:generate` 生成后端依赖的数据库客户端。`minio-init` 创建媒体 bucket（存储桶）并设置图片公开下载。

### 5.3 检查并导入原博客内容

先执行只读检查：

```powershell
pnpm import:frontend -- --source "D:\Code_Project\vo1d-blog" --check
```

`--check` 检查源数据结构及图片文件路径，不连接数据库写数据、不上传图片；它不代表对象存储连通性或全部图片解码已验证。

仅在首次导入，或已经明确需要用原始内容刷新现有数据时，执行：

```powershell
pnpm import:frontend -- --source "D:\Code_Project\vo1d-blog"
```

基础内容导入后，再执行图标迁移：

```powershell
pnpm import:icons -- --source "D:\Code_Project\vo1d-blog" --check
pnpm import:icons -- --source "D:\Code_Project\vo1d-blog"
```

这是针对当前原始数据集的迁移器，代码固定校验 6 篇文章、6 个分类、3 本书、47 个游戏、10 张照片、24 项技能和 3 个社交链接，不是任意数量内容的通用同步器。

重复导入会按原编号更新已有业务记录，包括正文、状态、顺序、可见性等导入字段，可能覆盖后台编辑；已有引用媒体会复用，不会随源图片变化自动替换。应在备份后、停止同时编辑的维护窗口中使用，日常增删改请用后台。

### 5.4 创建管理员

在后端目录的交互式 PowerShell 终端执行：

```powershell
pnpm admin:create
```

按提示输入邮箱，再输入两次隐藏密码（8～32 字符）。没有默认账号或公开注册。若邮箱已经存在，输入 `RESET` 会重置密码、激活账号并撤销旧会话；已有账号正常登录即可。

不要把实际密码写进命令参数、脚本或本文。之后按第 6 节选择后端运行方式，再启动两个前端。

## 6. 日常启动三个项目

### 6.1 后端方式 A：Docker 运行（当前本机方式）

Docker Desktop 启动后，在后端目录执行：

```powershell
Set-Location D:\Code_Project\vo1d-blog-api
docker compose --profile app up -d
docker compose ps --all
```

接口位于 [http://localhost:3100/docs](http://localhost:3100/docs)。首次启动之前必须完成第 5 节；Compose 的应用容器**不会自动执行数据库迁移和内容导入**。

若后端代码或依赖有变化，需要重新构建：

```powershell
docker compose --profile app up -d --build
```

若更新包含 `prisma/migrations` 新迁移，先在宿主机后端目录执行 `pnpm prisma:migrate:deploy`，再启动新版本。修改 `.env` 后重新执行 `up -d` 让 Compose 应用新配置。

### 6.2 后端方式 B：宿主机开发，自动重新编译

需要修改后端代码时使用此方式。它与方式 A 二选一，避免两个后端争用 3100 端口。

```powershell
Set-Location D:\Code_Project\vo1d-blog-api
docker compose --profile app stop api
docker compose up -d postgres minio minio-init
pnpm start:dev
```

数据库和对象存储继续使用 Docker；后端在当前终端运行，关闭终端或按 `Ctrl+C` 停止。尚未初始化的新环境先执行第 5 节。

如果希望在宿主机运行编译结果，用下面两条代替 `pnpm start:dev`：

```powershell
pnpm build
pnpm start
```

`pnpm start` 在启动时加载本地 `.env`；`pnpm start:prod` 需要外部注入环境变量，不应直接当成本地启动命令。

### 6.3 管理后台

另开一个 PowerShell，切换 Node 24 后执行：

```powershell
Set-Location D:\Code_Project\vo1d-blog-admin
pnpm install --frozen-lockfile
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
pnpm dev
```

已有依赖且锁文件未变化时可省略安装。后台 `.env` 应包含：

```dotenv
VITE_API_BASE_URL=http://localhost:3100
```

打开 [http://localhost:5174](http://localhost:5174)，使用后端创建的管理员登录。此地址不加 `/api` 或 `/v1`。后台通过 `credentials: 'include'` 携带 HttpOnly Cookie；无需手工复制身份令牌。

修改后台 `.env` 后重启 `pnpm dev`；部署已构建版本时需重新构建，因为 Vite 在构建时写入环境变量。

### 6.4 博客展示端

再开一个 PowerShell，切换 Node 24 后执行：

```powershell
Set-Location D:\Code_Project\vo1d-blog
pnpm install --frozen-lockfile
pnpm dev --host localhost --port 5173 --strictPort
```

打开 [博客](http://localhost:5173)。所有业务模块默认连接 3100，可在博客 .env 设置 VITE_API_BASE_URL；后端不可用时显示错误和重试，不用静态数组代替。社交悬浮截图依赖外部网络。

显式固定 5173 是为了避免 Vite 自动换到 5174，与管理后台冲突。普通 `pnpm dev` 也存在，但没有上述端口保护。

### 6.5 停止服务

两个前端以及宿主机后端分别在各自终端按 `Ctrl+C`。Docker 后端及基础设施在后端目录停止：

```powershell
Set-Location D:\Code_Project\vo1d-blog-api
docker compose --profile app stop
```

正常停止会保留 PostgreSQL 与 MinIO 数据卷。不要使用 `docker compose down -v` 作为日常停止命令，它会删除这些数据卷。

## 7. 管理后台如何使用

| 任务         | 操作和生效规则                                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| 修改个人介绍 | “站点资料”中编辑首页、身份、学习和页脚文案；头像从媒体库选择或清空                                                              |
| 发布文章     | “文章”中新建或编辑，填写正文、分类、封面、标签等并保存；公开要求状态为 `PUBLISHED` 且发布时间已到，草稿和归档不会由公共接口返回 |
| 预览文章     | 编辑页提供 Markdown 本地预览；公共文章详情的 `contentHtml` 才是后端实际清理后的输出，两者实现不同                               |
| 管理书籍     | 设置阅读进度、来源、时间及顺序；不确定的可空字段保持空值                                                                        |
| 管理游戏     | 编辑个人评分、手工时长、喜爱等级、评论和可见性；Steam 关联单独选择，不会代写个人评价                                            |
| 管理照片     | 使用专用照片上传生成展示图 / 缩略图配对，或选择已上传的对应媒体，再保存照片资料                                                 |
| 上传素材     | 媒体库支持普通图片和照片上传；默认允许 JPEG、PNG、WebP，最大 10 MiB（约 10.49 MB），最终以后端校验为准                          |
| 排序与隐藏   | 分类、书籍、游戏、照片、技能、社交链接提供全局排序和可见性；排序一次最多提交 500 条，更多记录用编辑页排序值                     |

上传素材和保存业务记录是两个步骤。取消编辑不会自动删除已上传图片，可在媒体库复用或删除。被业务记录引用的媒体删除时会返回 409；需先修改引用。

日期时间按浏览器本机时区填写，保存为 UTC（Coordinated Universal Time，协调世界时）。空值、`0`、`false` 含义不同，不要用“没有填写”替代有效的零值。

保存后在后台列表核对，再刷新博客相应区块；文章可直接打开 /blog/数字ID 或 /blog/slug。书籍默认顺序遵循后台排序，访客选择的排序仅在当前页面生效。

## 8. Steam 同步使用

新环境默认停用 Steam。多账号在**后端** .env 配置 STEAM_ACCOUNTS，格式见 [多账号说明](icons-multi-steam.md)。旧 STEAM_API_KEY / STEAM_ID 仍兼容；多账号配置非空时优先使用它。共同启用项如下：

```dotenv
STEAM_SYNC_ENABLED=true
STEAM_SYNC_INTERVAL_SECONDS=300
STEAM_REQUEST_TIMEOUT_MS=15000
```

密钥只保存在后端环境中，不填入后台或博客的 `VITE_*` 变量。配置完成后重启宿主机后端，或重新执行 Compose `up -d`。

1. 进入后台“Steam 同步”，检查启用状态、库可见性和最近成功时间。
2. 根据需要点击手动同步；受冷却约束，429 表示需等待。
3. 在游戏编辑页选择对应 Steam 游戏，或检查后使用唯一同名关联。中文译名或不同版本不保证自动匹配。
4. 需要解除关联时在游戏编辑页清空 Steam 关联。

默认约每 300 秒同步，不是实时在线状态。失败可保留旧快照；公共响应的 `stale` 表示快照过期。禁用同步、解除关联或库不可见时，公开时长回退到手工值。

时长字段区别：数据库 `games.playtimeHours` 是手工小时；接口将它另以 `manualPlaytimeHours` 返回。接口顶层 `playtimeHours` 在有可用关联快照时取所有可用账号累计分钟之和，再向下取整后的小时；后台编辑手工值时以 `manualPlaytimeHours` 为初始值，再按接口契约提交 `playtimeHours`。

同步不会自动把 Steam 库全部发布成博客游戏，不覆盖封面、个人评分、评论、喜爱等级和排序。新增博客游戏仍需在后台创建。

代理相关的宿主机 / 容器差异及完整规则见后端 [Steam 接入文档](../../vo1d-blog-api/docs/steam-integration.md)。

## 9. 常见问题和验证命令

### 9.1 快速检查后端

在 PowerShell 执行以下只读请求：

```powershell
curl.exe -i http://localhost:3100/health
curl.exe -i "http://localhost:3100/articles?page=1&pageSize=6"
curl.exe -i "http://localhost:3100/games?page=1&pageSize=50"
curl.exe -i http://localhost:3100/admin/articles
```

前三条预期为 200；健康检查应包含 `status: ok`、`database: up`。最后一条没有登录 Cookie，预期 401，是访问控制正常的表现。

完整接口见 [Swagger 文档](http://localhost:3100/docs)；OpenAPI（开放接口描述规范）文档位于 [docs-json](http://localhost:3100/docs-json)。公共路径直接是 `/articles`、`/games`、`/site-profile` 等，不设 `/api` 或项目版本前缀。

列表返回 `{ items, page, pageSize, total, totalPages }`，默认每页 10 条、最大 50 条。判断是否导入完整应看 `total`，而非只看第一页 `items.length`。站点资料接口返回单个对象。

### 9.2 常见现象

| 现象                                | 原因和处理                                                                                                     |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 后台保存成功，博客没变化            | 检查实际请求、公开状态、分类可见性、发布时间及媒体 URL；刷新并排除代理缓存，不要重导入                                               |
| 后台无法连接服务                    | 先查 `/health`、Docker 状态，再查 3100 / 3000 是否一致及 `VITE_API_BASE_URL`                                   |
| 登录或保存返回 403                  | 检查 `FRONTEND_ORIGINS` 是否精确包含当前后台地址，统一 `localhost`，修改后重启后端                             |
| 后台接口返回 401                    | 会话不存在、过期或已撤销，重新登录；不存在默认登录密码                                                         |
| 登录 / Steam 操作返回 429           | 遇到限流或同步冷却，等待页面提示的时间                                                                         |
| 图片显示失败                        | 检查 MinIO 健康、对象存在性和 `MEDIA_PUBLIC_BASE_URL`；迁移到服务器后不能继续使用浏览器自身的 `localhost:9000` |
| 图片能显示，游戏封面取色失败        | 还要检查图片域名允许跨源读取像素；后端接口 CORS 正常不代表图片服务配置正确                                     |
| 没有站点资料，接口返回 404          | 新数据库只执行了结构迁移，尚未完成原始内容导入；当前站点资料编辑接口不能创建缺失的单例                         |
| 端口占用                            | 检查是否同时启动容器后端和宿主机后端，或已有 Vite 实例；停止重复实例再启动                                     |
| Node 已显示 24，pnpm 却报告 Node 20 | 本机 `pnpm.ps1` 可能仍绑定旧 Node，按下一段使用当前 Node 运行 Corepack 入口                                    |

本机已存在的 Corepack 兼容调用方式如下，在需要执行命令的项目目录运行；其他机器使用自己的实际安装路径：

```powershell
node 'C:\nvm4w\nodejs\node_modules\corepack\dist\pnpm.js' install --frozen-lockfile
```

随后把任意 `pnpm <命令>` 替换为 `node 'C:\nvm4w\nodejs\node_modules\corepack\dist\pnpm.js' <命令>`。不要通过关闭 `engine-strict` 绕过 Node 要求。

### 9.3 项目检查与构建命令

在对应项目目录执行，不要混用脚本：

| 项目目录                          | 静态检查                      | 测试                                            | 构建 / 本地预览                                                             |
| --------------------------------- | ----------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------- |
| `D:\Code_Project\vo1d-blog`       | `pnpm lint`                   | 当前没有 `test` 脚本                            | `pnpm build`；然后 `pnpm preview --host localhost --port 5173 --strictPort` |
| `D:\Code_Project\vo1d-blog-api`   | `pnpm lint`、`pnpm typecheck` | `pnpm test`；有测试基础设施时 `pnpm test:e2e`   | `pnpm build`；然后 `pnpm start`                                             |
| `D:\Code_Project\vo1d-blog-admin` | `pnpm lint`、`pnpm typecheck` | `pnpm test`；按既有测试说明运行 `pnpm test:e2e` | `pnpm build`；然后 `pnpm preview`，端口 5174                                |

`test:e2e` 是 E2E（End-to-End，端到端）测试。后端测试要求专用 `TEST_DATABASE_URL`、PostgreSQL 和 MinIO，不能使用业务库代替测试库。管理后台完整测试包括模拟场景和真实后端场景，默认需要本机 Chrome 及开发后端容器；详见当前项目 [README](../README.md) 与 [验收说明](verification.md)。这些不是日常启动步骤。

前端 `preview` 用于检查构建结果，不是正式生产服务器。两个前端正式部署 `dist` 静态产物，配置页面路由回退至 `index.html`；后台部署说明见 [deployment.md](deployment.md)。数据库与 MinIO 都包含实际业务数据，备份时应同时保留数据库和媒体对象。

## 10. 后续接入博客的边界

技能、社交链接和游戏已接入；其余模块逐步替换静态读取，保留布局、模型、动画和交互状态：

| 博客模块                       | 对应公共接口                                         |
| ------------------------------ | ---------------------------------------------------- |
| 首页介绍 / 侧栏身份 / 页脚文案 | `/site-profile`                                      |
| 技能 / 社交链接                | `/skills`、`/social-links`                           |
| 书籍 / 游戏 / 照片             | `/books`、`/games`、`/photos`                        |
| 文章列表 / 分类 / 标签         | `/articles`、`/categories`、`/tags`                  |
| 文章详情 / 相关文章            | `/articles/:slugOrId`、`/articles/:slugOrId/related` |

接入需处理分页、加载中、空数据、请求失败、取消重试和可空字段；图片改用接口的 `cover.url`、`original.url`、`thumbnail.url`，正文使用后端的 `contentHtml`，保留旧数字文章地址。只有相应模块验证完成后才能移除它的静态业务数据。

当前接口响应仍声明 `max-age=60, stale-while-revalidate=300`；博客请求统一使用 `cache: no-store`，刷新时直接重新读取，前台每 60 秒及重新获得焦点时更新。背景失败可保留上次内容并明确提示错误；详情返回 401/403/404 时清除旧内容。部署代理如强制忽略请求缓存指令，应核对代理配置。详见 [完整联动](full-integration.md)。

## 11. 初次文档核对范围（历史记录）

以下保留初次编写时的只读核对历史；本次完整实施、真实浏览器与隔离测试结果见 [联动验收](full-integration.md)。

2026-09-06 本次实际执行：

- 阅读三个项目的 `package.json`、启动配置、组件数据引用、后端模型、服务和导入脚本。
- 执行导入器 `--check`，源数据及 76 个媒体路径检查通过，无写入。
- 使用数据库只读事务统计本文列出的业务表、媒体表、Steam 表及已关联游戏数量。
- 检查 Docker：后端、PostgreSQL、MinIO 均健康，初始化容器正常结束。
- 请求全部九类公共内容端点、健康检查及接口文档，均返回 200；未登录管理端点返回 401。
- 对一个后端返回的游戏封面地址进行只读请求，返回 200；这是抽样检查，未检查全部存储对象。
- 对后台来源 `http://localhost:5174` 发起跨源预检，返回 204，并允许该精确来源及凭据。

初次只整理说明时，没有重新执行依赖安装、数据库结构迁移、实际内容导入、管理员创建、Steam 手动同步，也未重新启动三个项目或运行它们的完整构建、测试和浏览器登录流程。以上启动流程依据当前脚本整理；只读接口检查不等于完整联调验收。

主要源码依据：后端 `scripts/frontend-source.ts`、`scripts/import-frontend.ts`、`scripts/setup-local.ts`、`prisma/schema.prisma`、`docker-compose.yml`；后台 `src/api/client.ts`、`src/features`；博客 `src/data`、`src/lib/blog.ts`、`src/components`。初次说明整理未修改业务代码；后续图标和多账号功能已更新三个项目及本地后端配置。
