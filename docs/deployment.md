# 静态部署

后台部署到 `https://admin.example.com`，后端使用同站点 `https://api.example.com`。在构建环境设置：

```dotenv
VITE_API_BASE_URL=https://api.example.com
```

执行 `pnpm install --frozen-lockfile`、`pnpm build`，发布 `dist/`。环境变量在构建时写入，修改后需要重新构建。后端仅允许精确来源：

```dotenv
FRONTEND_ORIGINS=https://example.com,https://admin.example.com
```

配置 HTTPS（Hypertext Transfer Protocol Secure，安全超文本传输协议），生产后端启用 Secure、HttpOnly、SameSite=Lax、Path=/ 和 host-only Cookie。无需扩大 Cookie Domain 或使用通配符 CORS（Cross-Origin Resource Sharing，跨源资源共享）。

Nginx 静态站点示例，证书路径按部署环境配置：

```nginx
server {
    listen 443 ssl;
    server_name admin.example.com;
    root /srv/vo1d-blog-admin/dist;
    index index.html;
    ssl_certificate /etc/letsencrypt/live/admin.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.example.com/privkey.pem;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;
    add_header X-Frame-Options DENY always;
    location /assets/ {
        try_files $uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }
}
```

前端是 SPA（Single-Page Application，单页应用），必须配置深层路由回退，例如刷新 `/articles/123` 仍返回 `index.html`。后端通过独立域名直接调用，不由静态后台代理媒体文件；图像使用后端返回的公开媒体 URL。服务端验证来源和会话，前端路由保护只改善体验。

部署后验证登录、刷新深层页面、上传、退出、过期会话、头像及封面读取，以及桌面 / 窄屏主题。当前交付只完成本地运行与验证，未部署示例生产域名。
