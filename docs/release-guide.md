# 上传仓库与首次上线

检查日期：2026-09-07。适用于相邻的 `vo1d-blog`、`vo1d-blog-api`、`vo1d-blog-admin` 三个独立项目。本次完成源码隐私处理和本地构建；尚未购买服务器、配置域名、迁移线上数据或部署。

## 1. 先分清代码与数据

| 内容                                         | 当前所在位置                                              | 是否上传 Gitee           |
| -------------------------------------------- | --------------------------------------------------------- | ------------------------ |
| 博客、后台、后端源码与依赖锁文件             | 三个项目目录                                              | 是                       |
| 环境配置模板                                 | 各项目 `.env.example`                                     | 是，只有占位值及公开地址 |
| 后端真实密钥、数据库密码、Steam 账号配置     | 后端 `.env`                                               | 否，单独保管             |
| 文章、后台编辑、管理员、媒体引用、Steam 快照 | PostgreSQL 数据卷                                         | 否，单独备份及迁移       |
| 后台上传的图片和图标                         | MinIO 数据卷                                              | 否，单独备份及迁移       |
| 验收原始记录、截图、浏览器登录数据           | `docs/*verification.json`、`docs/screenshots/`、`tmp/` 等 | 否                       |
| 依赖、构建产物、日志、本地工具缓存           | `node_modules/`、`dist/`、日志等                          | 否                       |
| 旧 Git 历史                                  | 博客 `.git/`                                              | 本次上传副本不携带       |

当前实际存在 `vo1d-blog-api_postgres_data` 和 `vo1d-blog-api_minio_data` 两个 Docker 数据卷。**三个源码文件夹不是完整的网站备份。** 历史原始图片已移出源码；后台后续上传的图片也不在历史归档中。上线应迁移当前数据库和当前媒体，而不是重新执行历史导入来重建网站。

## 2. 本次隐私处理

- 三个 `.gitignore` 已补齐环境文件、密钥文件、日志、依赖缓存、浏览器登录状态、备份和运行数据的排除规则；保留 `.env.example`、锁文件、数据库结构迁移脚本。
- 后端 `.dockerignore` 同步排除本地密钥、日志、备份和工具目录，避免带入容器构建上下文。
- 后台 `docs/live-verification.json` 中的三个真实 Steam 账号标识与其他原始验收记录、截图一起排除。原文件继续保留在本机，不再作为公开仓库文件。
- 博客 README 中包含 Windows 用户名的路径改为系统桌面目录的通用写法。
- 博客旧提交包含个人作者邮箱，历史上下文还包含本机用户路径。本次导出当前文件，不复制 `.git/`，也不改写原项目历史或现有暂存区。
- 博客本来用于公开展示的昵称和社交链接予以保留；公开仓库会公开这些内容。若不希望公开，应在上传前匿名化。

检查覆盖当前源码、文档和配置，匹配本地真实凭据与常见密钥格式，并抽查 Git 历史文本；不能据此保证未来新增文件没有敏感信息。测试中的虚构账号、随机生成的测试密码，以及本地初始化脚本中的固定存储用户名不是实际密码。

`.gitignore` 只约束 Git 的文件选择，不能保护手工拖拽上传、压缩包、已经跟踪的文件或旧提交。**本次优先从生成的上传副本上传，不要直接打包原始三个目录，也不要从旧博客仓库直接推送完整历史。**

## 3. 生成和上传干净副本

已经提供无第三方依赖的 `scripts/export-source.mjs`。后续源码更新后，在 `vo1d-blog-admin` 目录执行：

```powershell
node scripts/export-source.mjs
```

脚本要求本机已安装 Git，默认在三个项目的上一级目录创建带时间戳的 `gitee-upload-*` 文件夹；按各自 `.gitignore` 导出当前文件，保留三个独立目录，不复制旧 `.git/`。目标目录已存在会拒绝覆盖。脚本仅做文件筛选，新增源码仍需检查是否硬编码了秘密。

在 Gitee 创建三个空仓库，建议先设为私有，不自动生成 README。分别在副本的对应项目目录执行下列命令，替换占位值；不要在原博客目录执行这组初始化命令：

```powershell
git init -b main
git config user.name "你的公开提交昵称"
git config user.email "你愿意公开的提交邮箱"
git add .
git diff --cached --name-only
git diff --cached --stat
git commit -m "Initial source import"
git remote add origin https://gitee.com/你的账号/对应仓库.git
git push -u origin main
```

邮箱会写入提交元数据，私有仓库将来转公开时也会公开。若 Gitee 账号设置提供隐私提交邮箱，可以使用该邮箱。密码或访问令牌交给凭据管理器，不要写进远程地址或源代码。三个仓库拉取后建议继续保持相邻目录，方便跨项目文档引用和本地脚本使用。

本次没有创建远程仓库、提交或推送。你应在副本中初始化和提交；原博客已有的暂存改动仍由你决定如何处理。

## 4. 没有服务器时，先买什么

对于个人博客，建议先使用一台 Linux 云服务器承载博客静态文件、后台静态文件、后端和 PostgreSQL；媒体可以继续用同机 MinIO，也可以使用提供 S3（Simple Storage Service，简单存储服务）兼容接口的托管对象存储。无需一开始购买三台服务器。

资源起点可按 **2 个处理器核心、4 GB 内存、约 60 GB 系统盘** 评估，这是结合当前服务数量给出的规划建议，不是实测容量保证。图片总量、并发访问和构建时内存决定是否扩容；比较续费价格、出口带宽、月流量、备份费用，先短期试运行再决定年付。

还需要一个域名，规划如下，所有 `example.com` 都要替换为实际域名：

| 域名                | 用途                                                            |
| ------------------- | --------------------------------------------------------------- |
| `example.com`       | 博客静态站点                                                    |
| `admin.example.com` | 后台静态站点                                                    |
| `api.example.com`   | 后端 API（Application Programming Interface，应用程序编程接口） |
| `media.example.com` | 图片等公开媒体                                                  |

服务器地域取舍：使用中国内地服务器对外提供网站需要办理 ICP（Internet Content Provider，互联网信息服务）备案；香港等内地以外服务器通常不要求工信部 ICP 备案，但内地访问速度需自行测试，若使用内地 CDN（Content Delivery Network，内容分发网络）还需核对对应要求。参见[阿里云备案说明](https://help.aliyun.com/en/icp-filing/basic-icp-service/support/for-the-record-process-faq)。具体购买与接入条件以服务商当前说明为准。

Gitee 用来保存和拉取源码。后端 Node.js 进程、PostgreSQL 和媒体存储仍需要运行环境，上传源码本身不会让这套网站上线。

## 5. 购买后按这个顺序上线

1. 创建 Linux 服务器，安装 Git、Docker Engine 与 Compose 插件。若服务器直接构建前端，还需按项目 `.node-version` 安装 Node.js 24.20.0、pnpm 10.23.0；分别核对 `node --version` 与 `pnpm exec node --version`。
2. 将博客、后台、接口域名解析到服务器公网地址；媒体域名根据 MinIO 或托管对象存储的配置设置。开放网站的 80/443 端口，SSH（Secure Shell，安全外壳）管理端口限制来源。数据库、MinIO 控制台及后端内部端口不直接公开。
3. 拉取三个仓库，单独在服务器创建后端 `.env`。生成新的生产数据库密码、存储凭据与 `IP_HASH_SECRET`，不要沿用开发密码；真实配置不提交仓库。
4. 在本机暂停后台写入与自动同步后，取得一致的 PostgreSQL 逻辑备份和 MinIO 对象备份，私下传到服务器。在新建的目标数据库和媒体存储恢复，保留媒体对象键。核对文章、管理员、媒体引用与对象数量，抽样检查图片。备份含隐私，必须存放在仓库之外。**不要运行 `docker compose down -v`，也不要删除本机数据卷。**
5. 根据部署拓扑准备生产 Compose 配置：沿用后端 Dockerfile，设置生产变量、健康检查、持久卷和私有网络。现有 `docker-compose.yml` 是本地集成配置，含测试库、开发来源及 MinIO 根账号初始化，不能不加调整就认定是生产配置。生产应用使用仅限媒体 bucket 必要权限的存储账号。
6. 在后端对应版本的构建/迁移环境执行 `pnpm prisma:migrate:deploy`，再启动后端。若通过 Docker 运行迁移，可使用 Dockerfile 的 `migration` 构建阶段；最终 `runtime` 镜像不含完整迁移工具。已恢复的管理员直接使用，只有空库才需要 `pnpm admin:create`；维护脚本应在有完整工具的环境运行。
7. 两个前端分别设置生产接口地址后构建，将各自 `dist/` 放入独立静态站点目录。用 Nginx 或 Caddy 分发静态文件、代理接口、配置 HTTPS（Hypertext Transfer Protocol Secure，安全超文本传输协议）。Caddy 可自动申请和续期证书，前提是域名解析和网络条件正确，见[官方说明](https://caddyserver.com/docs/automatic-https)。静态站点根目录只能指向 `dist/`，不要指向包含 `.env` 的项目根目录。
8. 进行线上登录、上传、发布、图片读取及移动端验收。确认数据库和媒体定期备份，并做一次恢复验证后再正式切换访问入口。

当前没有服务器或实际域名，上述是实施路线。生产 Compose、反向代理配置、实际备份恢复和线上验收尚未执行，应在地域、域名及媒体存储方案确定后落地。

## 6. 本项目上线时最容易配错的地方

两个前端在各自目录新建被忽略的 `.env.production`：

```dotenv
VITE_API_BASE_URL=https://api.example.com
```

然后分别执行：

```powershell
pnpm install --frozen-lockfile
pnpm build
```

`VITE_` 变量会进入浏览器构建产物，只能放公开地址，不能放后端秘密；修改后必须重新构建。`pnpm dev` 和 `pnpm preview` 只用于开发与检查，正式站点由静态文件服务器提供服务。

后端至少需要调整下列变量，其余字段参照 `.env.example`：

```dotenv
NODE_ENV=production
FRONTEND_ORIGINS=https://example.com,https://admin.example.com
MEDIA_PUBLIC_BASE_URL=https://media.example.com
```

- 后台与接口使用同一主域名下的 HTTPS 子域名，以符合已有 `SameSite=Lax` Cookie 会话方案。`FRONTEND_ORIGINS` 必须是精确来源，不带末尾斜杠、路径或通配符；启用 `www` 时也要添加实际来源。
- 接口路径是 `/articles`、`/auth/login` 等根路径。代理时保留原路径，不凭空增加 `/api` 或 `/v1`。
- 只在一个可信反向代理后、且代理覆盖客户端伪造的转发头时设置 `TRUST_PROXY=true`。代理请求大小限制要容纳默认 10 MB 图片以及上传表单开销，例如设置为 12 MB。
- 博客 `/blog/123`、后台 `/articles/123` 等深层路径需要回退到对应 `index.html`，见[后台静态部署示例](deployment.md)。
- 迁移媒体保留对象键，后端通过 `MEDIA_PUBLIC_BASE_URL` 拼接新地址。该变量应指向“对象键之前”的完整公开前缀；例如代理 MinIO 路径不改写时可能需要 `https://media.example.com/桶名`。S3 接口地址与公开图片地址职责不同。
- 图片读取要允许博客来源的 CORS（Cross-Origin Resource Sharing，跨源资源共享），否则可能出现图片能显示、封面取色却失败的情况。
- Steam 密钥只配后端，并从目标服务器实际验证上游连通性。开发机代理地址不可直接搬到服务器。
- 首次上线不能照搬旧的完整 `import:frontend` 命令：历史媒体已移出源码，且完整导入可能覆盖后台编辑。优先迁移当前数据。

## 7. 验收清单

- 三项目 `pnpm build` 成功；本次在 Node.js 24.20.0 下已执行并通过。博客仍有较大 JavaScript 分块提示，属于后续加载性能优化项。
- `https://api.example.com/health` 返回成功；未登录访问 `/admin/articles` 返回 401。
- 登录、刷新、退出、会话失效符合预期；Cookie 的 Secure、HttpOnly 和 SameSite 设置正确。
- 上传新图、修改文章、发布后，博客刷新可见；原有图片与媒体也可读取。
- 博客和后台深层链接直接打开、刷新都正常；手机布局与主题正常。
- 后端公共接口不暴露草稿、管理员资料或凭据；敏感运行记录不进入静态站点目录。
- 备份同时包含数据库及媒体，测试恢复后仍可正常读取关联资源。

隐私扫描和构建通过不等于线上验收完成；服务器网络、证书、数据迁移和真实域名会话仍需上线阶段验证。
