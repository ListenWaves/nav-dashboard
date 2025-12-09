-- 导航站数据库初始化脚本
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

-- 插入默认密码（首次安装时）
INSERT OR IGNORE INTO config (key, value) VALUES ('admin_password', 'admin123');

-- 背景图配置（可选）：url 或 KV 存储标识
INSERT OR IGNORE INTO config (key, value) VALUES ('bg_url', '');
INSERT OR IGNORE INTO config (key, value) VALUES ('bg_type', ''); -- url / kv
INSERT OR IGNORE INTO config (key, value) VALUES ('bg_content_type', '');

-- 分类表
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  icon TEXT,
  sort INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 预置分类
INSERT OR IGNORE INTO categories (name, icon, sort) VALUES
  ('搜索引擎', '🔍', 1),
  ('开发工具', '⚙️', 2),
  ('视频娱乐', '🎬', 3),
  ('社交媒体', '💬', 4),
  ('工具', '🔧', 5);

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_category ON sites(category);
CREATE INDEX IF NOT EXISTS idx_name ON sites(name);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories(sort);