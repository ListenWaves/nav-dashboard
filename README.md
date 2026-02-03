# 导航站（Cloudflare Workers + D1 + KV）

一个无框架的个人导航站：前台支持搜索/分类/拖拽，后台可管理站点、分类、背景图和站点标题，数据存储在 Cloudflare D1，静态资源由 Workers Assets 提供，背景图可用 KV 直传或 URL 外链。

## 功能概览
- 前台：磨砂玻璃风格、搜索、分类筛选、拖拽排序（仅前端视图）、背景图、站点标题。
- 后台：登录、站点增删、分类管理、背景图 URL/KV 上传、标题修改、密码修改。
- 数据：D1 存储 `sites`/`categories`/`config`，自动生成站点 favicon。

## 一键部署（GitHub Actions，推荐）

### 1. Fork 本仓库
点击右上角 `Fork`，把项目复制到你自己的 GitHub 账号下。

### 2. Cloudflare 准备（只做一次）
1. 创建 D1 数据库：`Workers & Pages` -> `D1` -> `Create database`。  
   记下 `Database ID`，数据库名建议用 `nav_db`（可自定义）。
2. 创建 KV 命名空间：`Workers & Pages` -> `KV` -> `Create namespace`。  
   记下 `Namespace ID`（背景图功能依赖 KV）。
3. 创建 API Token：`My Profile` -> `API Tokens` -> `Create Token`。  
   选择 `Edit Cloudflare Workers` 模板，确保有 D1/KV 权限。
4. 记下你的 `Account ID`：在 Cloudflare 控制台右侧可见。

### 3. 在 GitHub 添加 Secrets
进入你 fork 的仓库：`Settings` -> `Secrets and variables` -> `Actions` -> `New repository secret`，依次添加：
- `CF_API_TOKEN`：Cloudflare API Token
- `CF_ACCOUNT_ID`：Cloudflare Account ID
- `CF_DATABASE_ID`：D1 Database ID
- `CF_KV_ID`：KV Namespace ID

可选参数（不用也能部署）：
- `D1_NAME`：D1 数据库名，默认 `nav_db`
- `WRANGLER_NAME`：Worker 名称，默认 `nav-site`
- `COMPAT_DATE`：兼容日期，默认 `2024-01-01`

### 4. 触发部署
二选一，任选其一即可：
- 推送代码触发：在仓库根目录执行  
  ```bash
  git add .
  git commit -m "deploy"
  git push origin main
  ```
  推送后会自动触发 `Deploy to Cloudflare` 工作流。
- 手动触发：打开仓库 `Actions` -> 左侧选择 `Deploy to Cloudflare` -> 右侧点 `Run workflow`。

### 5. 查看部署结果与访问地址
1. 在 GitHub `Actions` 中看到绿色 ✅ 表示部署完成。
2. 去 Cloudflare 控制台：`Workers & Pages` -> `Overview`，找到你的 Worker（默认名 `nav-site`）。
3. 点进 Worker，在右侧可以看到默认访问域名，格式通常为：  
   `https://<你的worker名>.<你的子域>.workers.dev`

### 5. 自动初始化数据库
Actions 会自动执行 `schema.sql` 初始化表结构（幂等，可重复执行）。

## 管理后台
- 后台地址：`/admin.html`
- 默认密码：`admin123`（登录后请立即修改）

## 背景图与标题
- 背景图 URL：后台输入外链地址即可。
- 背景图 KV 上传：后台直接上传图片（≤25MB，建议 ≤10MB）。
- 站点标题：后台可直接修改。

## 本地开发（可选）
本地开发需要 `wrangler.toml`，可参考以下模板（把 ID 改成自己的）：
```toml
name = "nav-site"
main = "worker.js"
compatibility_date = "2024-01-01"

assets = { directory = "./public", binding = "ASSETS" }

[[d1_databases]]
binding = "DB"
database_name = "nav_db"
database_id = "替换为你的 D1 ID"

[[kv_namespaces]]
binding = "BG"
id = "替换为你的 KV ID"
```

然后执行：
```bash
npm install
npx wrangler dev
```

## 数据库操作（可选）
初始化或导入示例数据：
```bash
npx wrangler d1 execute nav_db --file=schema.sql
npx wrangler d1 execute nav_db --file=sample-data.sql
```

## 目录结构
```
.
├── worker.js            # Cloudflare Worker 入口
├── public/              # 前端静态文件
│   ├── index.html
│   ├── admin.html
│   ├── script.js
│   └── admin.js
├── schema.sql           # 数据库结构
├── sample-data.sql      # 示例数据
└── .github/workflows/   # 自动部署
```

## 绑定说明
- D1 绑定名：`DB`
- KV 绑定名：`BG`
- 静态资源绑定：`ASSETS`

## License
MIT

