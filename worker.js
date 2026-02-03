// 默认密码（仅在数据库没有配置时使用）
const DEFAULT_PASSWORD = "admin123";
const DEFAULT_TITLE = "我的导航站";
const BG_KV_KEY = "bg_image_base64";
// 说明：KV 单条上限 25MB，Workers 请求体实践上约 10MB，已应要求放宽至 25MB（大文件可能被平台拦截）
const MAX_BG_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const PASSWORD_HASH_PREFIX = "pbkdf2$";
const PBKDF2_ITERATIONS = 100000;

export default {
async fetch(req, env, ctx) {
const url = new URL(req.url);
const db = env.DB;

function buildSecurityHeaders(contentType) {
  const headers = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "X-Frame-Options": "DENY",
    "Content-Security-Policy": "default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
  };
  if (contentType) headers["Content-Type"] = contentType;
  return headers;
}

function withSecurityHeaders(response, contentType) {
  const headers = new Headers(response.headers);
  const security = buildSecurityHeaders(contentType);
  Object.entries(security).forEach(([key, value]) => {
    if (!headers.has(key)) headers.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function jsonResponse(data, status = 200) {
  const res = new Response(JSON.stringify(data), {
    status,
    headers: buildSecurityHeaders("application/json")
  });
  return res;
}

function textToBytes(text) {
  return new TextEncoder().encode(text);
}

function bytesToBase64(bytes) {
  let binary = "";
  bytes.forEach(b => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

async function hashPassword(password, saltBytes, iterations = PBKDF2_ITERATIONS) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    textToBytes(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBytes, iterations, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return bytesToBase64(new Uint8Array(bits));
}

async function encodePassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await hashPassword(password, salt);
  return `${PASSWORD_HASH_PREFIX}${PBKDF2_ITERATIONS}$${bytesToBase64(salt)}$${hash}`;
}

async function parseAndVerifyPassword(password, stored) {
  if (!stored || !stored.startsWith(PASSWORD_HASH_PREFIX)) {
    return password === stored;
  }
  const parts = stored.split("$");
  if (parts.length !== 4) return false;
  const iterations = Number(parts[1]);
  const salt = base64ToBytes(parts[2]);
  const expected = base64ToBytes(parts[3]);
  if (!iterations || !salt.length || !expected.length) return false;
  const computed = base64ToBytes(await hashPassword(password, salt, iterations));
  return timingSafeEqual(expected, computed);
}

async function issueSession() {
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = bytesToBase64(tokenBytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  const expiresAt = Date.now() + SESSION_TTL_MS;
  await setConfigValue("admin_token", token);
  await setConfigValue("admin_token_expiry", String(expiresAt));
  return { token, expiresAt };
}

async function getSession() {
  const token = await getConfigValue("admin_token");
  const expiry = Number(await getConfigValue("admin_token_expiry"));
  return { token, expiry };
}

async function requireAuth(req) {
  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return false;
  const token = auth.slice("Bearer ".length);
  const session = await getSession();
  if (!session.token || session.token !== token) return false;
  if (!session.expiry || session.expiry < Date.now()) return false;
  return true;
}

function isValidHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (e) {
    return false;
  }
}

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
  const ok = await parseAndVerifyPassword(password, storedPassword);
  if (ok && storedPassword && !storedPassword.startsWith(PASSWORD_HASH_PREFIX)) {
    await setConfigValue("admin_password", await encodePassword(password));
  }
  return ok;
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
  if (!isValid) {
    return jsonResponse({ ok: false, message: "密码错误" }, 401);
  }
  const session = await issueSession();
  return jsonResponse({ ok: true, token: session.token, expiresAt: session.expiresAt });
}

// 获取全局配置（背景图等）
if (url.pathname === "/api/config" && req.method === "GET") {
  const bgUrl = await getConfigValue("bg_url");
  const bgType = await getConfigValue("bg_type");
  const bgContentType = await getConfigValue("bg_content_type");
  const siteTitle = (await getConfigValue("site_title")) || DEFAULT_TITLE;

  return jsonResponse({
    bg_url: bgUrl || "",
    bg_type: bgType || "",
    bg_content_type: bgContentType || "",
    site_title: siteTitle,
  });
}

// 设置背景图：支持 URL 或 base64（存 KV）
if (url.pathname === "/api/config/bg" && req.method === "POST") {
  const body = await req.json();
  const { url: bgUrl, base64, contentType } = body || {};
  const authed = await requireAuth(req);
  if (!authed) {
    return jsonResponse({ ok: false, message: "未登录" }, 401);
  }

  // KV 绑定检查
  if (!env.BG) {
    return Response.json({ ok: false, message: "未配置 KV 绑定 BG" }, { status: 500 });
  }

  try {
    if (bgUrl) {
      if (!isValidHttpUrl(bgUrl)) {
        return jsonResponse({ ok: false, message: "背景图 URL 必须为 http/https" }, 400);
      }
      await setConfigValue("bg_url", bgUrl);
      await setConfigValue("bg_type", "url");
      await setConfigValue("bg_content_type", "");
      return jsonResponse({ ok: true, message: "背景图已设置为 URL" });
    }

    if (base64) {
      // 粗略检查大小（base64 长度约为原始的 4/3）
      const estimatedSize = Math.ceil(base64.length * 3 / 4);
      if (estimatedSize > MAX_BG_FILE_SIZE) {
        return jsonResponse({ ok: false, message: "图片过大，请控制在 25MB 以内" }, 400);
      }

      // 存入 KV
      await env.BG.put(BG_KV_KEY, base64);
      await setConfigValue("bg_url", "/api/bg");
      await setConfigValue("bg_type", "kv");
      await setConfigValue("bg_content_type", contentType || "image/jpeg");
      return jsonResponse({ ok: true, message: "背景图已上传到 KV" });
    }

    return jsonResponse({ ok: false, message: "请提供 url 或 base64" }, 400);
  } catch (e) {
    return jsonResponse({ ok: false, message: "保存失败: " + e.message }, 500);
  }
}

// 设置站点标题
if (url.pathname === "/api/config/title" && req.method === "POST") {
  const body = await req.json();
  const { title } = body || {};
  const authed = await requireAuth(req);
  if (!authed) return jsonResponse({ ok: false, message: "未登录" }, 401);
  const newTitle = (title || "").trim();
  if (!newTitle) return jsonResponse({ ok: false, message: "标题不能为空" }, 400);
  await setConfigValue("site_title", newTitle);
  return jsonResponse({ ok: true, message: "标题已更新" });
}

// 读取 KV 背景图
if (url.pathname === "/api/bg") {
  if (!env.BG) return withSecurityHeaders(new Response("KV not configured", { status: 500 }), "text/plain");
  const base64 = await env.BG.get(BG_KV_KEY);
  if (!base64) return withSecurityHeaders(new Response("Not found", { status: 404 }), "text/plain");

  const ct = (await getConfigValue("bg_content_type")) || "image/jpeg";
  const bin = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const res = new Response(bin, {
    headers: { "Content-Type": ct }
  });
  return withSecurityHeaders(res, ct);
}

// 分类：获取
if (url.pathname === "/api/categories" && req.method === "GET") {
  const rows = await db.prepare("SELECT id, name, icon, sort FROM categories ORDER BY sort ASC, id ASC").all();
  return jsonResponse(rows.results || []);
}

// 分类：新增
if (url.pathname === "/api/categories/add" && req.method === "POST") {
  const authed = await requireAuth(req);
  if (!authed) return jsonResponse({ ok: false, message: "未登录" }, 401);
  const { name, icon } = await req.json();
  if (!name) return jsonResponse({ ok: false, message: "分类名必填" }, 400);
  const maxSort = await db.prepare("SELECT COALESCE(MAX(sort), 0) AS s FROM categories").first();
  await db.prepare("INSERT INTO categories (name, icon, sort) VALUES (?, ?, ?)").bind(name, icon || null, (maxSort?.s || 0) + 1).run();
  return jsonResponse({ ok: true });
}

// 分类：删除
if (url.pathname === "/api/categories/delete" && req.method === "POST") {
  const authed = await requireAuth(req);
  if (!authed) return jsonResponse({ ok: false, message: "未登录" }, 401);
  const { id } = await req.json();
  if (!id) return jsonResponse({ ok: false, message: "缺少分类ID" }, 400);
  await db.prepare("DELETE FROM categories WHERE id = ?").bind(id).run();
  return jsonResponse({ ok: true });
}

// 分类：批量排序
if (url.pathname === "/api/categories/sort" && req.method === "POST") {
  const authed = await requireAuth(req);
  if (!authed) return jsonResponse({ ok: false, message: "未登录" }, 401);
  const { orders } = await req.json();
  if (!Array.isArray(orders)) return jsonResponse({ ok: false, message: "orders 必须是数组" }, 400);
  const stmt = db.prepare("UPDATE categories SET sort = ? WHERE id = ?");
  for (const item of orders) {
    if (item.id == null || item.sort == null) continue;
    await stmt.bind(item.sort, item.id).run();
  }
  return jsonResponse({ ok: true });
}

// 修改密码
if (url.pathname === "/api/change-password" && req.method === "POST") {
const { oldPassword, newPassword } = await req.json();
const authed = await requireAuth(req);
if (!authed) return jsonResponse({ ok: false, message: "未登录" }, 401);

// 验证旧密码
const isValid = await verifyPassword(oldPassword);
if (!isValid) {
  return jsonResponse({ ok: false, message: "旧密码错误" }, 400);
}

// 验证新密码格式
if (!newPassword || newPassword.length < 6) {
  return jsonResponse({ ok: false, message: "新密码至少6位" }, 400);
}

// 更新密码
try {
  await setConfigValue("admin_password", await encodePassword(newPassword));
  const session = await issueSession();
  return jsonResponse({ ok: true, message: "密码修改成功", token: session.token, expiresAt: session.expiresAt });
} catch (e) {
  return jsonResponse({ ok: false, message: "密码修改失败: " + e.message }, 500);
}
}

// 获取全部站点（主页使用）
if (url.pathname === "/api/sites") {
const sites = await db.prepare("SELECT * FROM sites").all();
return jsonResponse(sites.results);
}

// 管理后台 API - 添加站点
if (url.pathname === "/api/add" && req.method === "POST") {
const authed = await requireAuth(req);
if (!authed) return jsonResponse({ ok: false, message: "未登录" }, 401);
const data = await req.json();
if (!data?.name || !data?.url) return jsonResponse({ ok: false, message: "站点名称和网址为必填项" }, 400);
if (!isValidHttpUrl(data.url)) return jsonResponse({ ok: false, message: "网址必须为 http/https" }, 400);
await db.prepare(
"INSERT INTO sites (name, url, desc, category, logo) VALUES (?, ?, ?, ?, ?)"
).bind(data.name, data.url, data.desc, data.category, getFavicon(data.url)).run();

return jsonResponse({ ok: true });
}

// 删除站点
if (url.pathname === "/api/delete" && req.method === "POST") {
const authed = await requireAuth(req);
if (!authed) return jsonResponse({ ok: false, message: "未登录" }, 401);
const { id } = await req.json();
await db.prepare("DELETE FROM sites WHERE id = ?").bind(id).run();
return jsonResponse({ ok: true });
}

// 服务静态文件
try {
  const assetRes = await env.ASSETS.fetch(req);
  return withSecurityHeaders(assetRes, assetRes.headers.get("Content-Type") || undefined);
} catch (e) {
  // 如果静态文件不存在，返回 index.html（用于 SPA）
  if (url.pathname === "/" || !url.pathname.includes(".")) {
    const indexReq = new Request(new URL("/index.html", req.url), req);
    const indexRes = await env.ASSETS.fetch(indexReq);
    return withSecurityHeaders(indexRes, indexRes.headers.get("Content-Type") || "text/html");
  }
  return withSecurityHeaders(new Response("Not found", { status: 404 }), "text/plain");
}
}
};


// 自动获取 Logo
function getFavicon(url) {
try {
  const domain = new URL(url).hostname;
  return `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
} catch (e) {
  return "";
}
}