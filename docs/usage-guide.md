# 三项目使用说明

更新：2026-09-08。以 [本次联动记录](current-integration.md) 和当前源码为准；旧 verification 文件及截图只代表历史版本。

## 项目与数据

根目录 工作区根目录，下设独立的 vo1d-blog、vo1d-blog-api、vo1d-blog-admin。

管理后台通过 /auth 和 /admin 接口使用 Cookie 会话，运行时不直连数据库或对象存储。博客通过 /site-profile、/articles、/categories、/tags、/books、/games、/photos、/skills、/social-links 展示公开内容。公开路径不带 /api 或项目级 /v1。

PostgreSQL 保存管理员、业务内容、媒体索引和 Steam 快照；MinIO 保存图片。Steam 密钥及同步逻辑仅在后端。游戏按 steamAppId 聚合分钟后统一取整；展示使用 playtimeHours，自定义值为 manualPlaytimeHours（保留原接口字段名）。自定义时长大于 0 时覆盖 Steam，填 0 使用 Steam；两者不会相加。博客总时长只累计各公开游戏的最终展示时长。

## 日常启动（已有数据）

每个终端先进入对应项目目录，然后执行：

    fnm env --shell powershell | Out-String | Invoke-Expression
    fnm use 24.20.0
    node --version
    pnpm --version
    pnpm exec node --version

两个 Node.js 版本都应为 24.20.0，pnpm 为 10.23.0。移动目录后依赖链接损坏，应按锁文件重新安装；不要复制 node_modules。

1. 后端目录：docker compose --profile app up -d。修改后端源码后用 docker compose --profile app up -d --build api。
2. 管理后台目录：pnpm dev，访问 http://localhost:5174。
3. 博客目录：pnpm dev，访问 http://localhost:5173。

后端 http://localhost:3100/health，文档 /docs 和 /docs-json；PostgreSQL 本机端口 5433，MinIO 为 9000/9001。本机 3000 被其他项目使用，不能作为博客后端地址。

本地后端开发可使用 pnpm start:dev，但先停止占用 3100 的 api 容器，保留 PostgreSQL 与 MinIO。不要同时启动两个后端争用端口。

已有 .env 不要覆盖。不要把 setup:local、admin:create 或完整 import:frontend 用作日常启动；完整导入会更新相同 ID 的内容。禁止重置数据库或删除 Docker 数据卷。

## 移动目录与启动恢复

本次恢复了后端 .env，修复旧 Docker 文件挂载、依赖链接及运行时版本，沿用原数据卷和配置。Compose 禁止为缺失的脚本挂载自动创建宿主路径。

再次移动项目时，保留 .env，从新目录创建容器以更新挂载，并沿用原命名数据卷。配置丢失时从自己的受保护备份或现有容器配置恢复原值；不能为旧数据卷生成新密码。不要公开完整 docker inspect 环境输出。

Vite 出现 504 Outdated Optimize Dep 时，停止旧服务后执行 pnpm dev --force；无需修改页面样式。

## 展示端规范与归档

博客请求按 src/services/<业务>/index.ts、model.ts 组织。原样式、动画、英文标签保留；空列表不回退静态数据，失败有明确状态和重试。

桌面归档：系统桌面目录下的 `博客联动备份-20260908-001721`。

- static-data-before.zip：原静态数组、原业务文案和图片。
- static-manifest.json、removed-media.json：校验和删除清单。
- source-before.zip：实施前的三项目源码。
- postgres-before.tar.gz、minio-before.tar.gz：实施前数据卷。包含私有数据，请妥善保存。

归档已经解压到 ..\.integration-work\static-import-source，供只读检查和隔离迁移测试使用；换机器后重新解压归档并改为实际路径。

后端目录只读检查：

    pnpm import:frontend -- --source "..\.integration-work\static-import-source" --check

不要对现有内容执行完整导入。

## 验证

- 博客：pnpm lint、pnpm build。
- 管理后台：pnpm typecheck、pnpm lint、pnpm test、pnpm build。
- 后端：pnpm typecheck、pnpm lint、pnpm test、pnpm build。
- 后台 pnpm test:e2e --project=browser：管理模拟异常及博客故障注入；三个服务须运行。
- 后台 pnpm test:e2e --project=live：真实后台保存、博客刷新、隐藏及恢复。

后端端到端测试显式连接 TEST_DATABASE_URL 的独立测试库，禁止使用内容库；静态迁移测试指定归档源：

    $env:FRONTEND_SOURCE_PATH='..\.integration-work\static-import-source'
    pnpm test:e2e

后台真实测试的临时管理员只用于测试，不影响既有管理员。测试记录明确编号，站点资料先保存原字段并在 finally 恢复，清理后核对原记录 ID。不要记录测试凭据。
