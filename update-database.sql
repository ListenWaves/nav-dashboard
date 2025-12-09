-- 数据库更新脚本 - 添加密码管理功能
-- 如果你的数据库已经创建，运行这个脚本来更新

-- 创建配置表（如果不存在）
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认密码（如果不存在）
INSERT OR IGNORE INTO config (key, value) VALUES ('admin_password', 'admin123');

-- 查询当前密码（验证）
SELECT * FROM config WHERE key = 'admin_password';

