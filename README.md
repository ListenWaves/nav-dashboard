# 导航站（Cloudflare Workers）

一个无框架的个人导航站，支持拖拽排序、后台管理、可自定义背景（URL 或 KV），分类可增删。

## 功能
- 前台：拖拽卡片、搜索、分类筛选、自定义背景。
- 后台：登录、站点增删、密码修改、背景设置（URL/上传至 KV）、分类管理（增删、图标自定义）。

## 部署（GitHub Actions，推荐）
1. 在你的仓库添加 Secrets：
   - `CF_API_TOKEN`（含 Workers & D1 权限）
   - `CF_ACCOUNT_ID`
   - `CF_DATABASE_ID`（D1 ID）
   - `CF_KV_ID`（KV Namespace ID，用于背景）
2. Cloudflare 创建 D1、KV，复制 ID 填入上面 Secrets。
3. 工作流会自动执行 `schema.sql` 初始化表结构（幂等，可多次运行）。
4. 推送到 `main` 或在 Actions 手动运行，workflow 会动态生成 `wrangler.toml` 并部署。

## 本地开发
```bash
npm install
npx wrangler dev
```

## 数据库初始化
```bash
npx wrangler d1 execute nav_db --file=schema.sql
```

## 背景图片说明
- 上传到 KV 的图片：受 Workers 请求体限制，实际可行上限约 10MB（KV 单条 25MB，但请求体约 10MB），超过请改用 URL 模式或存储在 R2/图床。
- URL 模式：后台填入图片外链即可。

## 管理后台
- 路径：`/admin.html`
- 默认密码：`admin123`（请登录后立即修改）

## 环境与绑定
- D1 绑定名：`DB`
- KV 绑定名：`BG`
- 静态资源绑定：`ASSETS`

## License
MIT

