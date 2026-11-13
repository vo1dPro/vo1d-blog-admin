# 三项目使用说明

`vo1d-blog`（博客）、`vo1d-blog-api`（后端）、`vo1d-blog-admin`（管理后台）是放在同一目录下的三个独立项目。

| 项目            | 职责                           | 本机地址              |
| --------------- | ------------------------------ | --------------------- |
| vo1d-blog       | 展示、布局、动画，读取公开内容 | http://localhost:5173 |
| vo1d-blog-api   | 认证、业务、媒体、Steam 同步   | http://localhost:3100 |
| vo1d-blog-admin | 管理界面，通过后端操作内容     | http://localhost:5174 |

## 数据在哪里

- 管理后台通过 `/auth` 和 `/admin` 接口工作，使用 Cookie 会话，不直连数据库或对象存储。
- 博客读取 `/site-profile`、`/creations`、`/books`、`/games`、`/photos`、`/skills`、`/social-links`。接口直接在根路径，没有 `/api` 或 `/v1`。
- PostgreSQL 保存管理员、业务内容、媒体索引、图标二进制和 Steam 快照；MinIO 保存其余图片。两者都在 Docker 数据卷里（`vo1d-blog-api_postgres_data`、`vo1d-blog-api_minio_data`），**源码目录不是完整的网站备份**。
- Steam 密钥和同步逻辑只在后端。时长的合计规则见 [图标与 Steam 说明](icons-multi-steam.md)。

## 日常启动

每个终端先进入对应的项目目录并切到 Node.js 24：

```powershell
fnm env --shell powershell | Out-String | Invoke-Expression
fnm use 24.20.0
node --version
pnpm exec node --version
```

两个版本都应是 24.20.0，pnpm 为 10.23.0。

1. 后端目录：`docker compose --profile app up -d`。改过后端源码时用 `docker compose --profile app up -d --build api`。
2. 管理后台目录：`pnpm dev`。
3. 博客目录：`pnpm dev`。

后端健康检查是 `http://localhost:3100/health`，接口文档在 `/docs` 和 `/docs-json`；PostgreSQL 的本机端口是 5433，MinIO 是 9000 / 9001。

要用 `pnpm start:dev` 热重载开发后端时，先停掉占用 3100 的 api 容器，保留 PostgreSQL 和 MinIO。

## 不要做的事

- 不要覆盖已有的 `.env`。
- 不要把 `pnpm setup:local`、`pnpm admin:create` 当作日常启动步骤。
- 不要重置数据库，不要运行 `docker compose down -v`，不要删除 Docker 数据卷。

## 移动目录之后

保留 `.env`，在新目录重新创建容器以更新挂载，沿用原来的命名数据卷。依赖链接损坏时按锁文件重新安装，不要复制 `node_modules`。配置丢失时从自己的备份或现有容器配置恢复原值，不能给旧数据卷生成新密码；也不要公开完整的 `docker inspect` 环境输出。

Vite 出现 `504 Outdated Optimize Dep` 时，停止旧服务后执行 `pnpm dev --force`。

## 验证

- 博客：`pnpm lint`、`pnpm build`。
- 管理后台：`pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm build`。
- 后端：`pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm build`。
- 后台 `pnpm test:e2e --project=browser`：管理界面的模拟异常，以及博客的故障注入；三个服务都要在运行。
- 后台 `pnpm test:e2e --project=live`：真实后台保存、博客刷新、隐藏和恢复。
- 后端 `pnpm test:e2e`：连接 `TEST_DATABASE_URL` 指向的独立测试库，拒绝使用内容库。

后台真实测试创建的临时管理员和内容只用于测试，结束时清理并核对原记录。不要记录测试凭据。

2026-09-08 那次三项目联动的完整验收记录已归档在 [archive/2026-09-08-integration.md](archive/2026-09-08-integration.md)，其中的文章功能和数据数量都是当时的状态。
