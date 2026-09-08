# vo1d-blog-admin

独立中文内容管理后台，使用 React 19、Vite 8、TypeScript strict。通过现有后端根路径接口管理内容，运行时不访问数据库或对象存储管理接口。

三个项目的职责、启动及数据边界见 [当前使用说明](docs/usage-guide.md)，本次验证见 [2026-09-08 联动记录](docs/current-integration.md)。

## 本地运行

准备上传 Gitee 或首次上线，请先阅读 [上传仓库与首次上线](docs/release-guide.md)，其中包含隐私处理、源码导出、数据迁移和服务器准备步骤。

在 `vo1d-blog-admin` 执行：

```powershell
fnm env --shell powershell | Out-String | Invoke-Expression
fnm use 24.20.0
node --version
pnpm install --frozen-lockfile
if (!(Test-Path .env)) { Copy-Item .env.example .env }
pnpm dev
```

Node.js 必须为 24；pnpm 锁定 10.23.0。开发端口固定为 **5174**，占用时直接报错。访问 [管理后台](http://localhost:5174)，后端为 [http://localhost:3100](http://localhost:3100/docs)。已有 `.env` 时不要覆盖它。

本机原 pnpm PowerShell shim 可能仍绑定 Node 20，即使 `fnm use` 已切换。若出现此现象，在当前终端用已经切到 24 的 `node` 调用现有 Corepack 入口：

```powershell
node 'C:\nvm4w\nodejs\node_modules\corepack\dist\pnpm.js' install --frozen-lockfile
node 'C:\nvm4w\nodejs\node_modules\corepack\dist\pnpm.js' dev
```

这是本机 shim 兼容方式；不关闭 `engine-strict`，不修改其他项目的 Node 版本。

## 登录与配置

```dotenv
VITE_API_BASE_URL=http://localhost:3100
```

后端 `FRONTEND_ORIGINS` 精确包含 `http://localhost:5174`，无尾斜杠；浏览器自动设置 Origin。当前本机已经允许该来源。所有请求带 `credentials: 'include'`，使用 HttpOnly Cookie 会话，不保存浏览器可读身份令牌。只有主题偏好写入 localStorage。

没有默认管理员，也不提供注册。使用已有管理员登录；没有账号时由你在**后端目录的交互终端**执行 `pnpm admin:create` 设置邮箱和隐藏密码。已有账号不要选择 RESET，除非你确定要重置。真实密码不要写入代码、脚本参数或文档。

## 页面与能力

| 页面            | 功能                                                                                                     |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| 登录 / 概览     | 启动确认会话、内部返回地址、退出清缓存；真实内容数量、最近编辑、Steam 状态                               |
| 站点资料        | 单例资料、首页和页脚文案、头像选择 / 清空                                                                |
| 文章            | 增删改查、分页、服务端搜索 / 分类 / 标签过滤、Markdown 编辑与安全预览、草稿 / 发布 / 归档、定时公开、SEO |
| 分类 / 标签     | 唯一字段校验、分类可见性和图标、删除影响提示                                                             |
| 书籍            | 封面、来源、阅读进度和本地时间、阅读顺序、可见性                                                         |
| 游戏            | 个人评分、手工时长、喜爱等级、评论、Steam 关联 / 解除、只读快照                                          |
| 照片            | 专用成对上传、复用展示图和缩略图、替代文本和拍摄时间                                                     |
| 技能 / 社交链接 | 通用 / 深色图标上传与媒体选择、排序、可见性                                                              |
| 媒体库          | 分页、IMAGE / PHOTO 上传、失败重试、复用、引用中删除冲突                                                 |
| Steam 同步      | 状态轮询、库分页、冷却提示、手动同步、确认后唯一同名关联                                                 |

分类、书籍、游戏、照片、技能、社交链接提供键盘可用的全局排序弹窗，先获取完整集合再提交；最多 500 条一次原子保存。超过该限制明确提示使用编辑页的排序值，不拆成可能部分成功的批次。文章管理列表按后端实际的最近修改时间排列，标签按名称排列。

失败保留输入；保存防重复；未保存离开触发确认；浏览器刷新 / 关闭使用原生离开提醒。编辑只提交变化的可写字段，空可空字段转 null，保留 0 和 false。时间按本机时区输入，保存为 UTC（Coordinated Universal Time，协调世界时）ISO 字符串。

图片上传和业务保存分为两步。取消表单不会自动删除已上传素材，提示用户在媒体库复用或明确删除；服务端 409 表示仍被引用，不提供虚假引用数量。默认允许 JPEG、PNG、WebP，最大 10 MiB，后端限制为最终依据。

## 工程组织

```text
src/api/          自动生成类型、契约适配、统一请求和查询缓存
src/auth/         会话与登录保护
src/app/          路由、导航、桌面与窄屏布局
src/components/   原生控件、确认弹窗、共享编辑与列表机制
src/features/     各业务页面、专用表单和校验模型
src/lib/          时间转换、可写字段差异、地址和基础校验
public/icons/     兼容图标资源；技能与社交使用后端媒体
scripts/          OpenAPI 类型生成
tests/unit/       请求、校验、空值、安全预览等单元测试
tests/e2e/        浏览器模拟异常测试与真实后端联调
docs/             契约差异、部署、验收和真实截图
```

`src/api/generated.ts` 不手改；运行 `pnpm api:generate` 从 `/docs-json` 重新生成，同时保存原始快照。上游可空字段元数据问题在 `src/api/types.ts` 独立适配，见 [契约差异](docs/contract-notes.md)。

## 依赖选择

全部依赖锁定精确版本。React Router 8.3.1 管理路由及离开阻止；TanStack Query 5.102.8 管理可取消查询与缓存；Zod 4.5.4 校验各业务表单；React Markdown 10.1.0 与 remark-gfm 4.0.1 生成安全预览；Lucide 提供已有视觉语言的图标。基础控件用原生 HTML（Hypertext Markup Language，超文本标记语言）和共享样式，没有再引入完整组件库或表单状态库。

React / React DOM 为 19.2.8，符合 Router 的 `>=19.2.7`；Vite 8.2.2 和 React 插件 6.1.1 相容。TypeScript 5.9.3 满足 openapi-typescript 7.13.0 的 `^5.x` 和 typescript-eslint 8.69.0 的 `<6.1`。保持 strict，无 `any`，没有修改博客前端版本。Vitest 4.1.11、Playwright 1.63.0 分别提供单元与真实 Chrome 测试，Prettier 3.9.6 统一源码排版。

核对来源：[Vite 运行要求](https://vite.dev/guide/)、[TanStack Query 安装](https://tanstack.com/query/latest/docs/framework/react/installation)、[React Markdown 安全与兼容说明](https://github.com/remarkjs/react-markdown)、各包 [npm 官方注册表](https://registry.npmjs.org)。轻量替代是手写路由和缓存，但会增加会话失效、请求竞态、表单离开保护的维护成本，故使用以上少量专用依赖。

## 验证命令

在后台根目录使用 Node 24 执行：

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

端到端测试使用本机 Chrome；没有 Chrome 可安装浏览器后将 `playwright.config.ts` 的 `channel` 改为可用渠道。`pnpm test:e2e --project=browser` 运行模拟错误分支；`pnpm test:e2e --project=live` 连接本机真实 3100 后端。默认完整命令两类都执行，不静默跳过真实联调。前端由测试启动到 5174，或复用已经启动的同项目服务。

真实测试要求现有本地开发后端容器 `vo1d-blog-api-api-1` 正常运行（可用 `E2E_BACKEND_CONTAINER` 指定）。测试在容器内复用后端自身环境和 Prisma，为一次测试创建随机临时管理员；不会读取后端 `.env` 文件或把数据库连接信息带入后台。仅测试代码使用该夹具，生产前端没有数据库依赖。随机密码只在进程内存和标准输入中传递，不保存会话文件、视频或 trace。生产模式明确拒绝执行。

真实测试使用显式创建并记录编号的临时内容、临时管理员和媒体；站点单例测试暂存原字段并在 finally 中通过后端恢复，结束按引用顺序清理，核对原始编号集合和所有已有游戏的可写字段。不会重导入数据、重置已有管理员、触发真实全库同名关联。Steam 同步冷却和全局排序失败在模拟浏览器测试覆盖；真实排序仅提交临时技能或书籍记录。

详细实测见 [验收记录](docs/verification.md)。静态部署见 [部署说明](docs/deployment.md)，博客展示端后续工作见 [接入事项](docs/blog-follow-up.md)。

完整浏览器套件还需要博客已运行于 5173；`tests/e2e/integration.live.spec.ts` 验证真实后台到博客的保存、媒体、发布撤回及路由，`blog-states.spec.ts` 为补充故障注入。
