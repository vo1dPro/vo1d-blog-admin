> 历史记录：目录、数据数量和验收结论对应当时版本。当前启动、归档源及验收请以 [2026-09-08 联动记录](current-integration.md) 为准。

# 实际契约与文档差异

本次读取本机后端源码、`/docs` 和 `/docs-json`。API（Application Programming Interface，应用程序编程接口）直接使用根路径，默认后端地址为 `http://localhost:3100`。

1. 后端 README / 契约部分示例仍为 3000；本次运行中服务为 3100。不添加 `/api` 或 `/v1`。
2. 管理文章实际返回 `bodyMarkdown`，不返回 `contentHtml`，没有后台预览接口。前端使用 React Markdown、`skipHtml` 和默认安全链接转换，不启用 `rehype-raw`，不使用 `dangerouslySetInnerHTML`。公共接口仅用于验收公开文章，不能预览草稿。
3. 管理文章列表 `ArticlesService.listAdmin` 实际按 `updatedAt DESC, id DESC`，公共列表按 `publishedAt DESC, id DESC`。后台提示最近修改顺序，无手动 reorder。
4. 上游 OpenAPI 将 `CreateArticleDto` / `UpdateArticleDto` 的 `publishedAt`、`seoTitle`、`seoDescription` 错标为 nullable object；源码分别为可空时间字符串 / 字符串。分类请求和响应 `iconKey` 同样错标；站点请求 `avatarMediaId` 错标为对象，实际为可空正整数。生成文件原样保留，适配文件单独修正。
5. openapi-typescript 默认将带 default 的属性生成为必填，即使是 PATCH。管理端不直接复用这种更新类型，而用独立可写 DTO（Data Transfer Object，数据传输对象）的 `Partial` 与变更字段提取。没有回传响应模型。
6. 认证真实身份字段是 `{ id, email }`；不依赖早期规划中的 `isActive`、`lastLoginAt`。
7. `manualPlaytimeHours` 是游戏手工存储值，写回字段为 `playtimeHours`。顶层响应 `playtimeHours` 可能派生自 Steam 分钟数。更新只提交改变的字段，因此只改评论时不会重新提交已失效的旧 Steam 关联。
8. 普通列表最大 50 项；分类、标签和媒体选择器遍历完整分页。Steam 选择器每页 50，提供明确下一页。只给文章发送已实现的 `q/category/tag`，其他列表只发送分页参数。
9. 图片大小检查在现有服务中可能返回 400；反向代理 / 请求体限制可能返回 413，两者均显示真实错误。普通封面限定 IMAGE，照片必须是不同的 PHOTO_ORIGINAL / PHOTO_THUMBNAIL。

现有接口足够完成后台，未修改后端业务代码或认证架构。可空字段元数据可作为独立后端文档修复任务处理。
