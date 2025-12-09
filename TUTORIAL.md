# 🎓 超详细小白教程 - 从零开始

> 这是一份专门为编程新手准备的详细教程，每一步都有详细说明和截图提示。

---

## 📋 目录

1. [前置准备](#前置准备)
2. [Cloudflare 设置](#cloudflare-设置)
3. [GitHub 设置](#github-设置)
4. [本地代码准备](#本地代码准备)
5. [上传到 GitHub](#上传到-github)
6. [配置自动部署](#配置自动部署)
7. [访问你的网站](#访问你的网站)
8. [日常使用](#日常使用)

---

## 前置准备

### 需要准备的东西：

- ✅ 一个电子邮箱（用于注册 Cloudflare 和 GitHub）
- ✅ 一台能上网的电脑
- ✅ 30分钟的时间
- ❌ **不需要**服务器
- ❌ **不需要**域名（Cloudflare 免费提供）
- ❌ **不需要**花钱

### 需要的工具：

1. **浏览器**（Chrome、Edge、Firefox 都可以）
2. **文本编辑器**（推荐 VS Code，下载地址：https://code.visualstudio.com/）
3. **Git 工具**（用于上传代码）

---

## Cloudflare 设置

### 步骤 1：注册 Cloudflare 账号

1. **打开浏览器**，访问：https://www.cloudflare.com/
2. 点击右上角 **Sign Up**（或者中文界面的"注册"）
3. 填写信息：
   ```
   邮箱：你的邮箱地址
   密码：设置一个安全的密码（至少8位，包含字母和数字）
   ```
4. 点击 **Create Account**（创建账户）
5. **查看你的邮箱**，找到 Cloudflare 发来的验证邮件
6. 点击邮件中的 **Verify Email**（验证邮箱）按钮
7. 验证成功后会跳转回 Cloudflare

✅ **完成标志**：能够登录 Cloudflare 控制台

---

### 步骤 2：创建 D1 数据库

**什么是 D1？**
D1 是 Cloudflare 提供的免费云数据库，用来存储你添加的所有网站信息。

**操作步骤：**

1. 登录 Cloudflare 后，在左侧菜单找到 **Workers & Pages**
   - 如果没看到，点击左上角的菜单图标（三条横线）
   
2. 在页面上方找到 **D1** 标签，点击它
   
3. 点击 **Create Database** 按钮（蓝色大按钮）
   
4. 填写数据库名称：
   ```
   Database name: nav_db
   ```
   > 💡 提示：必须是这个名字，不要改！
   
5. 点击 **Create** 按钮

6. **重要！记录数据库 ID：**
   - 创建成功后，你会看到数据库详情页
   - 找到 **Database ID**（通常在页面顶部）
   - 它看起来像这样：`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - **复制这个 ID，保存到记事本**（后面会用到）

✅ **完成标志**：能看到 nav_db 数据库，并且保存了 Database ID

---

### 步骤 3：初始化数据库表

**什么是数据库表？**
就像 Excel 表格一样，我们需要创建两个表格：
- `sites` 表：存储网站信息
- `config` 表：存储配置信息（如管理员密码）

**操作步骤：**

1. 在 D1 数据库详情页，点击 **Console** 标签（控制台）
   
2. 你会看到一个输入框，这是 SQL 命令行

3. **复制下面的代码**，粘贴到输入框中：

```sql
-- 创建站点表
CREATE TABLE IF NOT EXISTS sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  desc TEXT,
  category TEXT,
  logo TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建配置表（存储密码等配置）
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认密码
INSERT OR IGNORE INTO config (key, value) VALUES ('admin_password', 'admin123');

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_category ON sites(category);
CREATE INDEX IF NOT EXISTS idx_name ON sites(name);
```

4. 点击 **Execute** 按钮（或按 Ctrl+Enter）

5. 如果看到 **"Success"** 或 **"Query executed successfully"**，说明成功了

> 💡 **说明**：默认密码是 `admin123`，登录后可以在后台直接修改

6. **（可选）添加测试数据**，让网站一开始就有内容：

在同一个控制台中继续执行：

```sql
INSERT INTO sites (name, url, desc, category, logo) VALUES
  ('百度', 'https://www.baidu.com', '中国最大的搜索引擎', '搜索引擎', 'https://www.google.com/s2/favicons?sz=128&domain=baidu.com'),
  ('Google', 'https://www.google.com', '全球最大的搜索引擎', '搜索引擎', 'https://www.google.com/s2/favicons?sz=128&domain=google.com'),
  ('GitHub', 'https://github.com', '代码托管平台', '开发工具', 'https://www.google.com/s2/favicons?sz=128&domain=github.com'),
  ('哔哩哔哩', 'https://www.bilibili.com', '年轻人的视频网站', '视频娱乐', 'https://www.google.com/s2/favicons?sz=128&domain=bilibili.com'),
  ('知乎', 'https://www.zhihu.com', '中文互联网问答社区', '社交媒体', 'https://www.google.com/s2/favicons?sz=128&domain=zhihu.com');
```

> 💡 **提示**：你也可以使用项目中的 `sample-data.sql` 文件，包含更多示例数据

✅ **完成标志**：执行成功，没有报错

---

### 步骤 4：获取 API Token

**什么是 API Token？**
这是一个密钥，让 GitHub 有权限帮你部署代码到 Cloudflare。

**操作步骤：**

1. 点击右上角的**头像**
2. 选择 **My Profile**（我的资料）
3. 左侧菜单点击 **API Tokens**
4. 点击 **Create Token** 按钮
5. 找到 **Edit Cloudflare Workers** 这个模板
6. 点击右边的 **Use template** 按钮
7. 配置权限（默认就好，不需要改）：
   - Account Resources：选择你的账号
   - Zone Resources：选择 "All zones"
8. 拉到页面底部，点击 **Continue to summary**
9. 再点击 **Create Token**
10. **重要！立即复制显示的 Token**
    - 这个 Token 只显示一次！
    - 复制后保存到记事本
    - 如果关闭了页面没复制，就要重新创建

✅ **完成标志**：Token 已保存（看起来像一串随机字符）

---

### 步骤 5：获取 Account ID

**什么是 Account ID？**
你的 Cloudflare 账号的唯一标识符。

**操作步骤：**

1. 回到 Cloudflare 首页（点击左上角 Logo）
2. 点击左侧菜单 **Workers & Pages**
3. 在页面右侧，你会看到 **Account ID**
4. 点击复制按钮，保存到记事本

✅ **完成标志**：Account ID 已保存

---

**Cloudflare 部分到此结束！**

现在你手上应该有：
- ✅ D1 Database ID
- ✅ API Token
- ✅ Account ID

这三个东西一定要保存好，后面会用到！

---

## GitHub 设置

### 步骤 6：注册/登录 GitHub

1. 访问 https://github.com/
2. 如果没有账号：
   - 点击 **Sign Up**
   - 填写邮箱、密码、用户名
   - 完成人机验证
   - 验证邮箱
3. 如果有账号：直接 **Sign In** 登录

✅ **完成标志**：能看到 GitHub 主页

---

### 步骤 7：创建新仓库

**什么是仓库（Repository）？**
就是存放代码的地方，类似于云盘文件夹。

**操作步骤：**

1. 点击右上角的 **+** 号
2. 选择 **New repository**（新建仓库）
3. 填写仓库信息：
   ```
   Repository name: nav-dashboard
   （或者你喜欢的其他名字，只能用英文、数字、短横线）
   
   Description: 个人导航站
   （可选，随便写或不写）
   
   Public / Private: 随便选
   （Public 是公开的，别人能看到；Private 是私有的）
   ```
4. ❌ **不要勾选** "Add a README file"
5. ❌ **不要选择** .gitignore 和 License（我们代码里已经有了）
6. 点击 **Create repository** 按钮

✅ **完成标志**：看到仓库页面，上面有提示如何上传代码

---

## 本地代码准备

### 步骤 8：下载项目代码

有两种方式：

**方式 A：从 GitHub 下载（如果已经有人分享了）**

1. 访问原项目地址
2. 点击绿色的 **Code** 按钮
3. 选择 **Download ZIP**
4. 解压到一个你能找到的文件夹

**方式 B：使用当前文件夹（如果你已经有代码）**

直接使用你电脑上这个项目文件夹。

✅ **完成标志**：能看到项目文件夹，里面有这些文件：
```
nav-project/
├── public/
│   ├── index.html
│   ├── admin.html
│   ├── style.css
│   ├── script.js
│   └── ...
├── worker.js
├── wrangler.toml
├── schema.sql
└── README.md
```

---

### 步骤 9：修改配置文件

**9.1 修改 wrangler.toml**

1. 用文本编辑器打开 `wrangler.toml` 文件
2. 找到这一行：
   ```toml
   id = "<你的D1 ID>"
   ```
3. 把 `<你的D1 ID>` 替换成你在**步骤2**保存的 Database ID
4. 修改后像这样：
   ```toml
   id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
   ```
5. 保存文件（Ctrl+S）

**9.2 修改管理员密码（推荐部署后在后台修改）**

> 💡 **最佳实践**：不需要修改代码，部署完成后在后台直接修改密码更方便安全！

**如果你想在部署前修改默认密码**，在执行步骤 3 的数据库初始化 SQL 时，把这一行：

```sql
INSERT OR IGNORE INTO config (key, value) VALUES ('admin_password', 'admin123');
```

改成：

```sql
INSERT OR IGNORE INTO config (key, value) VALUES ('admin_password', '你的密码');
```

**但我们更推荐**：
1. 先用默认密码 `admin123` 完成部署
2. 部署成功后登录后台
3. 点击 "🔐 修改密码" 按钮修改
4. 无需修改任何代码，更安全方便

**9.3 替换背景图（可选）**

1. 准备一张你喜欢的图片（建议尺寸 1920x1080 或更大）
2. 重命名为 `bg.jpg`
3. 替换 `public/bg.jpg` 文件

✅ **完成标志**：配置文件已修改并保存

---

## 上传到 GitHub

### 步骤 10：安装 Git

**Windows 系统：**

1. 下载 Git：https://git-scm.com/download/win
2. 运行安装程序，一路点 "Next"（默认选项就行）
3. 安装完成后，右键桌面空白处，应该能看到 "Git Bash Here"

**Mac 系统：**

1. 打开终端（Terminal）
2. 输入 `git --version`
3. 如果没安装，会自动提示安装，点"安装"

**Linux 系统：**

```bash
sudo apt update
sudo apt install git
```

✅ **完成标志**：在命令行输入 `git --version` 能看到版本号

---

### 步骤 11：配置 Git

**打开命令行：**
- Windows：在项目文件夹空白处，按住 Shift + 右键，选择"在此处打开 PowerShell 窗口"或"Git Bash Here"
- Mac/Linux：打开终端，`cd` 到项目文件夹

**输入以下命令：**

```bash
# 设置你的用户名（替换成你的 GitHub 用户名）
git config --global user.name "YourGitHubUsername"

# 设置你的邮箱（替换成你的邮箱）
git config --global user.email "your.email@example.com"
```

按回车执行，没有输出就是成功了。

✅ **完成标志**：命令执行成功，没有报错

---

### 步骤 12：上传代码到 GitHub

**在项目文件夹中，依次输入以下命令：**

```bash
# 1. 初始化 Git 仓库
git init
```
> 看到 "Initialized empty Git repository" 就对了

```bash
# 2. 添加所有文件到暂存区
git add .
```
> 没有输出是正常的

```bash
# 3. 提交到本地仓库
git commit -m "Initial commit"
```
> 看到一堆文件名就对了

```bash
# 4. 关联远程仓库（替换成你的仓库地址！）
git remote add origin https://github.com/你的用户名/nav-dashboard.git
```
> 注意：替换 `你的用户名` 和 `nav-dashboard` 为你的实际仓库地址

```bash
# 5. 设置主分支
git branch -M main
```

```bash
# 6. 推送到 GitHub
git push -u origin main
```

**如果提示输入用户名和密码：**

- **用户名**：你的 GitHub 用户名
- **密码**：不是你的登录密码！而是 Personal Access Token

**如何获取 Personal Access Token：**

1. 登录 GitHub
2. 点击右上角头像 → Settings
3. 左侧菜单最底部 → Developer settings
4. 左侧 → Personal access tokens → Tokens (classic)
5. 点击 Generate new token → Generate new token (classic)
6. 填写：
   - Note: 随便写，如 "nav project"
   - Expiration: 选择过期时间（建议 90 days）
   - 勾选权限：✅ repo（勾第一个，下面会全选）
7. 点击底部 Generate token
8. **复制生成的 Token**（只显示一次！）
9. 粘贴作为密码使用

✅ **完成标志**：在 GitHub 仓库页面刷新，能看到所有文件

---

## 配置自动部署

### 步骤 13：添加 GitHub Secrets

**什么是 Secrets？**
存储敏感信息（如密码、密钥）的地方，不会被别人看到。

**操作步骤：**

1. 在 GitHub 仓库页面，点击 **Settings**（设置）
2. 左侧菜单找到 **Secrets and variables** → **Actions**
3. 点击 **New repository secret** 按钮

**添加第 1 个 Secret：**
```
Name: CF_API_TOKEN
Secret: 粘贴你的 Cloudflare API Token（步骤4保存的）
```
点击 **Add secret**

**添加第 2 个 Secret：**
```
Name: CF_ACCOUNT_ID
Secret: 粘贴你的 Cloudflare Account ID（步骤5保存的）
```
点击 **Add secret**

**添加第 3 个 Secret：**
```
Name: CF_DATABASE_ID
Secret: 粘贴你的 D1 Database ID（步骤2保存的）
```
点击 **Add secret**

✅ **完成标志**：能看到 3 个 Secrets，名字分别是 CF_API_TOKEN、CF_ACCOUNT_ID、CF_DATABASE_ID

---

### 步骤 14：触发自动部署

**方式 1：推送代码触发（已经完成）**

你在步骤 12 推送代码时，已经自动触发了部署。

**方式 2：手动触发**

1. 在 GitHub 仓库页面，点击 **Actions**
2. 左侧选择 **Deploy to Cloudflare**
3. 右侧点击 **Run workflow** → **Run workflow**

**查看部署状态：**

1. 在 Actions 页面，你会看到一个正在运行的任务（黄色圆圈转圈）
2. 等待 1-2 分钟
3. 变成绿色的 ✅ 就是成功了
4. 如果是红色的 ❌：
   - 点进去查看日志
   - 通常是 Secrets 配置错误
   - 检查 3 个 Secrets 是否正确

✅ **完成标志**：部署成功，绿色的 ✅

---

## 访问你的网站

### 步骤 15：获取网站地址

1. 回到 Cloudflare 控制台
2. 点击 **Workers & Pages**
3. 找到你的 Worker（名字应该是 `nav-site`）
4. 点击进去
5. 你会看到 **Preview** 网址，类似于：
   ```
   https://nav-site.你的用户名.workers.dev
   ```
6. 点击这个链接，或者复制到浏览器打开

✅ **完成标志**：能看到你的导航站首页

---

### 步骤 16：访问后台管理

在网址后面加上 `/admin.html`：

```
https://nav-site.你的用户名.workers.dev/admin.html
```

输入密码登录（默认：`admin123`）

> 💡 **重要提示**：首次登录后，请立即点击 "🔐 修改密码" 修改默认密码！

✅ **完成标志**：能登录后台，看到管理面板

---

## 日常使用

### 如何添加网站？

1. 访问后台：`你的网址/admin.html`
2. 登录
3. 填写表单：
   - **名称**：网站的名字，如"百度"
   - **URL**：完整网址，必须包含 `https://`，如 `https://www.baidu.com`
   - **描述**：可选，如"中国最大的搜索引擎"
   - **分类**：可选，如"搜索引擎"、"视频网站"、"工具"
4. 点击"添加站点"
5. 刷新首页，就能看到新添加的网站了

### 如何删除网站？

1. 在后台管理页面的"站点列表"
2. 找到要删除的网站
3. 点击"删除"按钮
4. 确认删除

### 如何修改管理员密码？🔐

**重要！首次登录后请立即修改密码！**

1. 登录后台管理页面
2. 点击页面上方的 **"🔐 修改密码"** 按钮
3. 弹出修改密码窗口
4. 填写信息：
   - **旧密码**：输入当前密码（首次为 `admin123`）
   - **新密码**：输入新密码（至少6位）
   - **确认新密码**：再次输入新密码
5. 点击 **"✅ 确认修改"**
6. 修改成功后会自动跳转到登录页
7. 使用新密码重新登录

**密码要求：**
- ✅ 至少 6 位
- ✅ 推荐 12-16 位
- ✅ 包含大小写字母、数字、特殊字符更安全

**忘记密码怎么办？**

在 Cloudflare D1 数据库控制台执行：
```sql
UPDATE config SET value = 'admin123' WHERE key = 'admin_password';
```
然后使用 `admin123` 登录，登录后立即修改密码。

### 如何更换背景图？

1. 准备一张图片，重命名为 `bg.jpg`
2. 放到项目的 `public/` 文件夹
3. 在命令行中：
   ```bash
   git add public/bg.jpg
   git commit -m "Update background image"
   git push
   ```
4. 等待自动部署（1-2分钟）
5. 刷新网页，背景就换了

> 默认初始背景图为 `public/bg.jpg`。如果不上传、不填 URL，前端会使用这个默认图。

### 使用 KV 上传背景图（后台）

> 适合不想改代码、希望后台直接更换背景；受平台限制，建议控制在 10~25MB 以内（KV 单条 25MB，但 Workers 请求体实践上约 10MB，过大可能被平台拦截）。

步骤：
1. 确认已在 Cloudflare 创建 KV namespace，并在 Secrets 中填好 `CF_KV_ID`（已在 workflow 中使用 BG 绑定）。  
2. 访问后台 `/admin.html`，登录。  
3. 在“前端背景图”区域：  
   - 方式 A：填写图片外链 URL，输入管理员密码，点击“保存背景图 URL”。  
   - 方式 B：点击“上传图片（KV）”，选择本地图片（≤25MB，推荐 ≤10MB 更稳妥），输入管理员密码，上传。  
4. 成功后会显示当前背景来源（URL 或 KV）以及预览。前台自动应用最新背景。  

提示：
- URL 模式最稳健，几乎不限大小。  
- KV 模式方便直接上传，但若大于 ~10MB 可能因 Workers 体积限制上传失败；超过 25MB 会被直接拒绝。  
- 随时可以再次上传/保存，后一次会覆盖前一次。  

### 如何修改标题？

1. 编辑 `public/index.html`
2. 找到第 6 行和第 14 行，修改标题文字
3. 保存后推送到 GitHub：
   ```bash
   git add .
   git commit -m "Update title"
   git push
   ```

### 如何更新代码？

当原作者更新代码后，你想同步更新：

```bash
# 添加原仓库为上游
git remote add upstream https://github.com/原作者/nav-dashboard.git

# 拉取更新
git fetch upstream
git merge upstream/main

# 推送到你的仓库
git push origin main
```

---

## 🎉 恭喜你！

你已经成功：
- ✅ 搭建了自己的导航站
- ✅ 学会了基本的 Git 操作
- ✅ 了解了 Cloudflare Workers 部署
- ✅ 拥有了一个完全属于自己的项目

---

## ❓ 遇到问题？

### 1. 部署失败

**检查：**
- GitHub Secrets 是否正确
- wrangler.toml 里的 database_id 是否填写
- D1 数据库是否创建

### 2. 网站打不开

**尝试：**
- 等待 5 分钟，Workers 需要时间生效
- 清除浏览器缓存
- 检查 Cloudflare Workers 状态

### 3. 后台登录失败

**可能原因：**
- 密码输入错误
- 数据库配置问题

**解决方法：**

方式一：在 D1 控制台查看密码
```sql
SELECT * FROM config WHERE key = 'admin_password';
```

方式二：重置密码为默认值
```sql
UPDATE config SET value = 'admin123' WHERE key = 'admin_password';
```

然后使用 `admin123` 登录。

### 4. 忘记密码怎么办？

1. 登录 Cloudflare 控制台
2. 进入 D1 数据库 → nav_db → Console
3. 执行 SQL：
   ```sql
   UPDATE config SET value = 'admin123' WHERE key = 'admin_password';
   ```
4. 使用 `admin123` 登录
5. 登录后立即在后台修改新密码

### 5. 修改密码后无法登录？

**可能原因：**
- 新密码记错了
- 浏览器缓存问题

**解决方法：**
- 清除浏览器缓存（Ctrl + Shift + Delete）
- 按照上面的方法重置密码
- 确保密码没有多余的空格

### 6. 还是不行？

**寻求帮助：**
- 查看 GitHub Actions 日志找错误
- 在项目 GitHub 仓库提 Issue
- 搜索报错信息

---

## 📚 继续学习

完成这个项目后，你可以：

- 学习 HTML/CSS/JavaScript 改进界面
- 学习 SQL 添加更多数据表
- 学习 Cloudflare Workers API 添加新功能
- 自己做更多项目练习

**推荐学习资源：**
- MDN Web Docs（学 HTML/CSS/JS）
- Cloudflare Workers 官方文档
- Git 官方教程

---

**祝你玩得开心！🎈**

有任何问题欢迎在 Issues 中提问！

