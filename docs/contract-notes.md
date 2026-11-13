# 接口契约的注意点

后台类型由 `pnpm api:generate` 从后端 `/docs-json` 生成到 `src/api/generated.ts`，不手改。下面是生成结果与后端实际行为不一致、或容易用错的地方，适配集中在 `src/api/types.ts`。

1. **可空字段的元数据不准**：后端 OpenAPI 把部分可空的基本类型标成了对象，例如站点资料请求的 `avatarMediaId`，实际是可空的正整数。生成文件保持原样，在适配文件里单独修正。
2. **带默认值的属性被生成为必填**：openapi-typescript 默认如此，PATCH 的更新类型也受影响。后台不直接复用生成的更新类型，而是对可写 DTO 取 `Partial`，只提交有变化的字段，也不会把响应模型原样回传。
3. **游戏时长有两个字段**：`manualPlaytimeHours` 是手工存储的值，写回时的字段名是 `playtimeHours`；响应顶层的 `playtimeHours` 可能来自 Steam 分钟数的换算。只改评论时不会重新提交 Steam 关联。
4. **分页**：普通列表每页最多 50 条，媒体选择器会遍历全部分页；Steam 选择器每页 50 条并提供下一页。列表请求只带分页参数。
5. **上传大小**：图片超限时后端返回 400，反向代理的请求体限制可能返回 413，后台对两者都显示真实错误。普通封面必须是 `IMAGE`，照片必须是成对的 `PHOTO_ORIGINAL` / `PHOTO_THUMBNAIL`。
6. **会话身份**：`/auth/me` 返回 `{ id, email }`。
7. **创作动态**：`/creations` 和 `/admin/creations` 的响应没有 DTO，不在生成类型里，由 `src/features/creations/parse.ts` 在运行时校验。

接口直接使用根路径，没有 `/api` 或 `/v1`；本机后端地址是 `http://localhost:3100`。
