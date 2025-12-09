-- 示例数据 - 可选导入
-- 这些是一些常用网站的示例数据，你可以选择导入或跳过

-- 搜索引擎
INSERT INTO sites (name, url, desc, category, logo) VALUES
  ('百度', 'https://www.baidu.com', '中国最大的搜索引擎', '搜索引擎', 'https://www.google.com/s2/favicons?sz=128&domain=baidu.com'),
  ('Google', 'https://www.google.com', '全球最大的搜索引擎', '搜索引擎', 'https://www.google.com/s2/favicons?sz=128&domain=google.com'),
  ('必应', 'https://www.bing.com', '微软搜索引擎', '搜索引擎', 'https://www.google.com/s2/favicons?sz=128&domain=bing.com');

-- 社交媒体
INSERT INTO sites (name, url, desc, category, logo) VALUES
  ('微博', 'https://weibo.com', '中国最大的社交媒体平台', '社交媒体', 'https://www.google.com/s2/favicons?sz=128&domain=weibo.com'),
  ('知乎', 'https://www.zhihu.com', '中文互联网问答社区', '社交媒体', 'https://www.google.com/s2/favicons?sz=128&domain=zhihu.com'),
  ('Twitter', 'https://twitter.com', '全球社交网络', '社交媒体', 'https://www.google.com/s2/favicons?sz=128&domain=twitter.com');

-- 视频娱乐
INSERT INTO sites (name, url, desc, category, logo) VALUES
  ('哔哩哔哩', 'https://www.bilibili.com', '年轻人的视频社区', '视频娱乐', 'https://www.google.com/s2/favicons?sz=128&domain=bilibili.com'),
  ('YouTube', 'https://www.youtube.com', '全球最大视频网站', '视频娱乐', 'https://www.google.com/s2/favicons?sz=128&domain=youtube.com'),
  ('抖音', 'https://www.douyin.com', '短视频平台', '视频娱乐', 'https://www.google.com/s2/favicons?sz=128&domain=douyin.com');

-- 购物网站
INSERT INTO sites (name, url, desc, category, logo) VALUES
  ('淘宝', 'https://www.taobao.com', '中国最大的网购平台', '购物网站', 'https://www.google.com/s2/favicons?sz=128&domain=taobao.com'),
  ('京东', 'https://www.jd.com', '综合网上商城', '购物网站', 'https://www.google.com/s2/favicons?sz=128&domain=jd.com'),
  ('亚马逊', 'https://www.amazon.com', '全球电商平台', '购物网站', 'https://www.google.com/s2/favicons?sz=128&domain=amazon.com');

-- 开发工具
INSERT INTO sites (name, url, desc, category, logo) VALUES
  ('GitHub', 'https://github.com', '代码托管平台', '开发工具', 'https://www.google.com/s2/favicons?sz=128&domain=github.com'),
  ('Stack Overflow', 'https://stackoverflow.com', '程序员问答社区', '开发工具', 'https://www.google.com/s2/favicons?sz=128&domain=stackoverflow.com'),
  ('MDN', 'https://developer.mozilla.org', 'Web开发文档', '开发工具', 'https://www.google.com/s2/favicons?sz=128&domain=developer.mozilla.org');

-- 在线工具
INSERT INTO sites (name, url, desc, category, logo) VALUES
  ('图片压缩', 'https://tinypng.com', '在线图片压缩工具', '在线工具', 'https://www.google.com/s2/favicons?sz=128&domain=tinypng.com'),
  ('JSON格式化', 'https://www.json.cn', 'JSON在线工具', '在线工具', 'https://www.google.com/s2/favicons?sz=128&domain=json.cn'),
  ('代码高亮', 'https://carbon.now.sh', '代码截图美化', '在线工具', 'https://www.google.com/s2/favicons?sz=128&domain=carbon.now.sh');

-- 学习资源
INSERT INTO sites (name, url, desc, category, logo) VALUES
  ('网易公开课', 'https://open.163.com', '免费在线课程', '学习资源', 'https://www.google.com/s2/favicons?sz=128&domain=open.163.com'),
  ('Coursera', 'https://www.coursera.org', '全球在线教育平台', '学习资源', 'https://www.google.com/s2/favicons?sz=128&domain=coursera.org'),
  ('慕课网', 'https://www.imooc.com', 'IT技能学习平台', '学习资源', 'https://www.google.com/s2/favicons?sz=128&domain=imooc.com');

