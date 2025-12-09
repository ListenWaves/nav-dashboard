// 默认密码（仅在数据库没有配置时使用）
const DEFAULT_PASSWORD = "admin123";
const DEFAULT_TITLE = "我的导航站";
const BG_KV_KEY = "bg_image_base64";
// 说明：KV 单条上限 25MB，Workers 请求体实践上约 10MB，已应要求放宽至 25MB（大文件可能被平台拦截）
const MAX_BG_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export default {
async fetch(req, env, ctx) {
const url = new URL(req.url);
const db = env.DB;

// 获取存储的密码
async function getAdminPassword() {
  try {
    const result = await db.prepare("SELECT value FROM config WHERE key = 'admin_password'").first();
    return result ? result.value : DEFAULT_PASSWORD;
  } catch (e) {
    // 如果 config 表不存在，返回默认密码
    return DEFAULT_PASSWORD;
  }
}

// 验证密码
async function verifyPassword(password) {
  const storedPassword = await getAdminPassword();
  return password === storedPassword;
}

// 获取配置值
async function getConfigValue(key) {
  const row = await db.prepare("SELECT value FROM config WHERE key = ?").bind(key).first();
  return row ? row.value : "";
}

// 设置配置值
async function setConfigValue(key, value) {
  await db.prepare("INSERT OR REPLACE INTO config (key, value, updated_at) VALUES (?, ?, datetime('now'))")
    .bind(key, value)
    .run();
}

// 登录
if (url.pathname === "/api/login" && req.method === "POST") {
const { password } = await req.json();
const isValid = await verifyPassword(password);
return new Response(JSON.stringify({ ok: isValid }), {
headers: { "Content-Type": "application/json" }
});
}

// 获取全局配置（背景图等）
if (url.pathname === "/api/config" && req.method === "GET") {
  const bgUrl = await getConfigValue("bg_url");
  const bgType = await getConfigValue("bg_type");
  const bgContentType = await getConfigValue("bg_content_type");
  const siteTitle = (await getConfigValue("site_title")) || DEFAULT_TITLE;

  return Response.json({
    bg_url: bgUrl || "",
    bg_type: bgType || "",
    bg_content_type: bgContentType || "",
    site_title: siteTitle,
  });
}

// 设置背景图：支持 URL 或 base64（存 KV）
if (url.pathname === "/api/config/bg" && req.method === "POST") {
  const body = await req.json();
  const { password, url: bgUrl, base64, contentType } = body || {};

  // 简单校验管理员密码
  const ok = await verifyPassword(password || "");
  if (!ok) {
    return Response.json({ ok: false, message: "密码错误" }, { status: 401 });
  }

  // KV 绑定检查
  if (!env.BG) {
    return Response.json({ ok: false, message: "未配置 KV 绑定 BG" }, { status: 500 });
  }

  try {
    if (bgUrl) {
      await setConfigValue("bg_url", bgUrl);
      await setConfigValue("bg_type", "url");
      await setConfigValue("bg_content_type", "");
      return Response.json({ ok: true, message: "背景图已设置为 URL" });
    }

    if (base64) {
      // 粗略检查大小（base64 长度约为原始的 4/3）
      const estimatedSize = Math.ceil(base64.length * 3 / 4);
      if (estimatedSize > MAX_BG_FILE_SIZE) {
        return Response.json({ ok: false, message: "图片过大，请控制在 25MB 以内" }, { status: 400 });
      }

      // 存入 KV
      await env.BG.put(BG_KV_KEY, base64);
      await setConfigValue("bg_url", "/api/bg");
      await setConfigValue("bg_type", "kv");
      await setConfigValue("bg_content_type", contentType || "image/jpeg");
      return Response.json({ ok: true, message: "背景图已上传到 KV" });
    }

    return Response.json({ ok: false, message: "请提供 url 或 base64" }, { status: 400 });
  } catch (e) {
    return Response.json({ ok: false, message: "保存失败: " + e.message }, { status: 500 });
  }
}

// 设置站点标题
if (url.pathname === "/api/config/title" && req.method === "POST") {
  const body = await req.json();
  const { password, title } = body || {};
  const ok = await verifyPassword(password || "");
  if (!ok) return Response.json({ ok: false, message: "密码错误" }, { status: 401 });
  const newTitle = (title || "").trim();
  if (!newTitle) return Response.json({ ok: false, message: "标题不能为空" }, { status: 400 });
  await setConfigValue("site_title", newTitle);
  return Response.json({ ok: true, message: "标题已更新" });
}

// 读取 KV 背景图
if (url.pathname === "/api/bg") {
  if (!env.BG) return new Response("KV not configured", { status: 500 });
  const base64 = await env.BG.get(BG_KV_KEY);
  if (!base64) return new Response("Not found", { status: 404 });

  const ct = (await getConfigValue("bg_content_type")) || "image/jpeg";
  const bin = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  return new Response(bin, {
    headers: { "Content-Type": ct }
  });
}

// 分类：获取
if (url.pathname === "/api/categories" && req.method === "GET") {
  const rows = await db.prepare("SELECT id, name, icon, sort FROM categories ORDER BY sort ASC, id ASC").all();
  return Response.json(rows.results || []);
}

// 分类：新增
if (url.pathname === "/api/categories/add" && req.method === "POST") {
  const { name, icon } = await req.json();
  if (!name) return Response.json({ ok: false, message: "分类名必填" }, { status: 400 });
  const maxSort = await db.prepare("SELECT COALESCE(MAX(sort), 0) AS s FROM categories").first();
  await db.prepare("INSERT INTO categories (name, icon, sort) VALUES (?, ?, ?)").bind(name, icon || null, (maxSort?.s || 0) + 1).run();
  return Response.json({ ok: true });
}

// 分类：删除
if (url.pathname === "/api/categories/delete" && req.method === "POST") {
  const { id } = await req.json();
  if (!id) return Response.json({ ok: false, message: "缺少分类ID" }, { status: 400 });
  await db.prepare("DELETE FROM categories WHERE id = ?").bind(id).run();
  return Response.json({ ok: true });
}

// 分类：批量排序
if (url.pathname === "/api/categories/sort" && req.method === "POST") {
  const { orders } = await req.json();
  if (!Array.isArray(orders)) return Response.json({ ok: false, message: "orders 必须是数组" }, { status: 400 });
  const stmt = db.prepare("UPDATE categories SET sort = ? WHERE id = ?");
  for (const item of orders) {
    if (item.id == null || item.sort == null) continue;
    await stmt.bind(item.sort, item.id).run();
  }
  return Response.json({ ok: true });
}

// 修改密码
if (url.pathname === "/api/change-password" && req.method === "POST") {
const { oldPassword, newPassword } = await req.json();

// 验证旧密码
const isValid = await verifyPassword(oldPassword);
if (!isValid) {
  return Response.json({ ok: false, message: "旧密码错误" });
}

// 验证新密码格式
if (!newPassword || newPassword.length < 6) {
  return Response.json({ ok: false, message: "新密码至少6位" });
}

// 更新密码
try {
  await db.prepare(
    "INSERT OR REPLACE INTO config (key, value, updated_at) VALUES ('admin_password', ?, datetime('now'))"
  ).bind(newPassword).run();
  
  return Response.json({ ok: true, message: "密码修改成功" });
} catch (e) {
  return Response.json({ ok: false, message: "密码修改失败: " + e.message });
}
}

// 获取全部站点（主页使用）
if (url.pathname === "/api/sites") {
const sites = await db.prepare("SELECT * FROM sites").all();
return Response.json(sites.results);
}

// 管理后台 API - 添加站点
if (url.pathname === "/api/add" && req.method === "POST") {
const data = await req.json();
await db.prepare(
"INSERT INTO sites (name, url, desc, category, logo) VALUES (?, ?, ?, ?, ?)"
).bind(data.name, data.url, data.desc, data.category, getFavicon(data.url)).run();

return Response.json({ ok: true });
}

// 删除站点
if (url.pathname === "/api/delete" && req.method === "POST") {
const { id } = await req.json();
await db.prepare("DELETE FROM sites WHERE id = ?").bind(id).run();
return Response.json({ ok: true });
}

// 服务静态文件
try {
  return await env.ASSETS.fetch(req);
} catch (e) {
  // 如果静态文件不存在，返回 index.html（用于 SPA）
  if (url.pathname === "/" || !url.pathname.includes(".")) {
    const indexReq = new Request(new URL("/index.html", req.url), req);
    return await env.ASSETS.fetch(indexReq);
  }
  return new Response("Not found", { status: 404 });
}
}
};


// 自动获取 Logo
function getFavicon(url) {
const domain = new URL(url).hostname;
return `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
}