// 使用相对路径，自动适配你的域名
const API = "";

let allSites = [];
let currentFilter = null;
let categoriesFromServer = [];
let siteTitle = "我的导航站";

function getSafeHttpUrl(value) {
  try {
    const parsed = new URL(value);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch (e) {
    return "";
  }
  return "";
}

// 初始化
document.addEventListener("DOMContentLoaded", async () => {
  await loadConfig();
  await loadCategories();
  await loadSites();
  document.getElementById("search").addEventListener("input", filterSites);
});

// 加载配置（背景图等）
async function loadConfig() {
  try {
    const res = await fetch(`${API}/api/config`);
    const cfg = await res.json();
    if (cfg?.bg_url) {
      document.body.style.backgroundImage = `url(${cfg.bg_url})`;
    }
    if (cfg?.site_title) {
      siteTitle = cfg.site_title;
      document.title = siteTitle;
      const titleEl = document.querySelector("h1");
      if (titleEl) titleEl.textContent = siteTitle;
    }
  } catch (err) {
    console.warn("加载配置失败", err);
  }
}

// 加载分类（后台管理的分类表）
async function loadCategories() {
  try {
    const res = await fetch(`${API}/api/categories`);
    categoriesFromServer = await res.json();
    // 动态注入后端配置的图标
    categoriesFromServer.forEach(c => {
      if (c.icon) {
        categoryIcons[c.name] = c.icon;
      }
    });
    renderCategories(categoriesFromServer.map(c => c.name));
  } catch (e) {
    console.warn("加载分类失败，回退到站点去重", e);
  }
}

// 加载站点
async function loadSites() {
  try {
    const res = await fetch(`${API}/api/sites`);
    allSites = await res.json();
    renderSites(allSites);
    // 如果未能从接口获取分类，则用站点去重兜底
    if (!categoriesFromServer?.length) {
      renderCategories(allSites.map(s => s.category).filter(Boolean));
    }
  } catch (error) {
    console.error("加载站点失败:", error);
  }
}

// 渲染站点卡片（支持拖拽）
function renderSites(sites) {
  const container = document.getElementById("cards");
  container.innerHTML = "";

  sites.forEach((site, index) => {
    const card = document.createElement("div");
    card.className = "card";
    card.draggable = true;
    card.dataset.index = index;

    const title = document.createElement("h3");
    if (site.logo) {
      const logoUrl = getSafeHttpUrl(site.logo);
      if (logoUrl) {
        const img = document.createElement("img");
        img.src = logoUrl;
        img.className = "logo";
        img.alt = site.name || "";
        img.onerror = () => { img.style.display = "none"; };
        title.appendChild(img);
      }
    }
    const nameNode = document.createTextNode(site.name || "");
    title.appendChild(nameNode);

    const desc = document.createElement("p");
    desc.textContent = site.desc || "暂无描述";

    card.appendChild(title);
    card.appendChild(desc);

    if (site.category) {
      const tag = document.createElement("span");
      tag.className = "category-tag";
      tag.textContent = site.category;
      card.appendChild(tag);
    }
    
    // 点击打开链接
    card.addEventListener('click', (e) => {
      if (!card.classList.contains('dragging')) {
        const safeUrl = getSafeHttpUrl(site.url);
        if (safeUrl) window.open(safeUrl, "_blank", "noopener");
      }
    });
    
    // 拖拽功能
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    card.addEventListener('dragover', handleDragOver);
    card.addEventListener('drop', handleDrop);
    
    container.appendChild(card);
  });
}

// 拖拽开始
let draggedElement = null;

function handleDragStart(e) {
  draggedElement = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
  this.classList.remove('dragging');
  // 移除所有悬停效果
  document.querySelectorAll('.card').forEach(card => {
    card.classList.remove('drag-over');
  });
  draggedElement = null;
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = 'move';
  
  // 自动避让效果
  if (draggedElement && this !== draggedElement) {
    const allCards = [...document.querySelectorAll('.card:not(.dragging)')];
    const targetIndex = allCards.indexOf(this);
    
    if (targetIndex !== -1) {
      // 添加悬停效果
      allCards.forEach(card => card.classList.remove('drag-over'));
      this.classList.add('drag-over');
    }
  }
  
  return false;
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  
  // 移除所有悬停效果
  document.querySelectorAll('.card').forEach(card => {
    card.classList.remove('drag-over');
  });
  
  if (draggedElement !== this) {
    const allCards = [...document.querySelectorAll('.card')];
    const draggedIndex = allCards.indexOf(draggedElement);
    const targetIndex = allCards.indexOf(this);
    
    // 交换数组中的位置
    const currentSites = currentFilter 
      ? allSites.filter(s => s.category === currentFilter)
      : allSites;
    
    [currentSites[draggedIndex], currentSites[targetIndex]] = 
    [currentSites[targetIndex], currentSites[draggedIndex]];
    
    renderSites(currentSites);
  }
  
  return false;
}

// 分类图标映射
const categoryIcons = {
  '全部': '📚',
  '搜索引擎': '🔍',
  '搜索': '🔍',
  '开发工具': '⚙️',
  '开发': '⚙️',
  '视频娱乐': '🎬',
  '视频': '🎬',
  '娱乐': '🎮',
  '社交媒体': '💬',
  '社交': '💬',
  '购物': '🛒',
  '购物网站': '🛒',
  '学习': '📖',
  '学习资源': '📖',
  '工具': '🔧',
  '在线工具': '🔧',
  '新闻': '📰',
  '资讯': '📰'
};

// 获取分类图标
function getCategoryIcon(category) {
  return categoryIcons[category] || '📁';
}

// 渲染分类按钮
function renderCategories(categoryList) {
  const categories = [...new Set(categoryList.filter(Boolean))];
  const box = document.getElementById("categories");

  box.innerHTML = "<button onclick='filterByCategory(null)'>📚 全部</button>";

  categories.forEach(cat => {
    const btn = document.createElement("button");
    const icon = getCategoryIcon(cat);
    btn.textContent = `${icon} ${cat}`;
    btn.onclick = () => filterByCategory(cat);
    box.appendChild(btn);
  });
}

// 分类过滤
function filterByCategory(cat) {
  currentFilter = cat;
  if (!cat) return renderSites(allSites);
  renderSites(allSites.filter(s => s.category === cat));
}

// 搜索过滤
function filterSites() {
  const key = document.getElementById("search").value.toLowerCase();
  const filtered = allSites.filter(s =>
    s.name.toLowerCase().includes(key) ||
    s.desc?.toLowerCase().includes(key) ||
    s.category?.toLowerCase().includes(key)
  );
  renderSites(filtered);
}
