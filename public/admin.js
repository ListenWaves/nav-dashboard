// 使用相对路径，自动适配你的域名
const API = "";

let isLogin = false;
let categories = [];
let currentTitle = "我的导航站";

// 登录
async function login() {
  const pwd = document.getElementById("password").value;
  
  if (!pwd) {
    alert("请输入密码！");
    return;
  }

  try {
    const res = await fetch(`${API}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ password: pwd })
    });

    const data = await res.json();

    if (data.ok) {
      isLogin = true;
      document.getElementById("loginBox").style.display = "none";
      document.getElementById("adminPanel").style.display = "block";
      loadConfig();
      loadCategories();
      loadData();
    } else {
      alert("❌ 密码错误！");
    }
  } catch (error) {
    console.error("登录失败:", error);
    alert("登录失败，请检查网络连接！");
  }
}

// 回车登录
document.addEventListener("DOMContentLoaded", () => {
  const pwdInput = document.getElementById("password");
  if (pwdInput) {
    pwdInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        login();
      }
    });
  }
});

// 读取配置（背景图）
async function loadConfig() {
  try {
    const res = await fetch(`${API}/api/config`);
    const cfg = await res.json();
    // 背景
    const preview = document.getElementById("bgPreview");
    if (cfg?.bg_url) {
      preview.style.display = "block";
      preview.style.backgroundImage = `url(${cfg.bg_url})`;
      document.getElementById("bgUrl").value = cfg.bg_url.startsWith("/api/bg") ? "" : cfg.bg_url;
      document.getElementById("bgStatus").textContent = cfg.bg_type === "kv" ? "当前：KV 背景图" : "当前：URL 背景图";
    } else {
      preview.style.display = "none";
      document.getElementById("bgStatus").textContent = "尚未设置背景图";
    }
    // 标题
    if (cfg?.site_title) {
      currentTitle = cfg.site_title;
      const titleInput = document.getElementById("siteTitle");
      if (titleInput) titleInput.value = currentTitle;
    }
  } catch (e) {
    console.warn("加载配置失败", e);
  }
}

// 保存背景图 URL
async function saveBgUrl() {
  const url = document.getElementById("bgUrl").value.trim();
  const password = document.getElementById("bgPassword").value.trim();
  if (!password) {
    alert("请输入管理员密码");
    return;
  }
  try {
    const res = await fetch(`${API}/api/config/bg`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, password })
    });
    const data = await res.json();
    alert(data.message || (data.ok ? "保存成功" : "保存失败"));
    if (data.ok) loadConfig();
  } catch (e) {
    alert("保存失败");
  }
}

// 上传背景图到 KV
async function uploadBgFile(event) {
  const file = event.target.files?.[0];
  const password = document.getElementById("bgPassword").value.trim();
  if (!file) return;
  if (!password) {
    alert("请输入管理员密码");
    return;
  }
  if (file.size > 25 * 1024 * 1024) {
    alert("图片过大，请控制在 25MB 以内");
    return;
  }
  const reader = new FileReader();
  reader.onload = async () => {
    const base64 = reader.result.split(",")[1];
    try {
      const res = await fetch(`${API}/api/config/bg`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64, contentType: file.type || "image/jpeg", password })
      });
      const data = await res.json();
      alert(data.message || (data.ok ? "上传成功" : "上传失败"));
      if (data.ok) loadConfig();
    } catch (e) {
      alert("上传失败");
    }
  };
  reader.readAsDataURL(file);
}

// 保存站点标题
async function saveSiteTitle() {
  const title = document.getElementById("siteTitle").value.trim();
  const password = document.getElementById("titlePassword").value.trim();
  if (!password) {
    alert("请输入管理员密码");
    return;
  }
  if (!title) {
    alert("标题不能为空");
    return;
  }
  try {
    const res = await fetch(`${API}/api/config/title`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, password })
    });
    const data = await res.json();
    alert(data.message || (data.ok ? "保存成功" : "保存失败"));
    if (data.ok) {
      currentTitle = title;
    }
  } catch (e) {
    alert("保存失败");
  }
}

// 加载分类列表
async function loadCategories() {
  try {
    const res = await fetch(`${API}/api/categories`);
    categories = await res.json();
    renderCategoryList();
  } catch (e) {
    console.error("加载分类失败:", e);
  }
}

function renderCategoryList() {
  const box = document.getElementById("catList");
  box.innerHTML = "";
  if (!categories.length) {
    box.innerHTML = "<p style='text-align:center; opacity:0.7;'>暂无分类</p>";
    return;
  }
  categories.forEach(cat => {
    const row = document.createElement("div");
    row.className = "item";
    row.innerHTML = `
      <p><strong>${cat.icon || "📁"} ${cat.name}</strong></p>
      <button onclick="deleteCategory(${cat.id})">删除</button>
    `;
    box.appendChild(row);
  });
}

// 添加分类
async function addCategory() {
  const name = document.getElementById("catName").value.trim();
  const icon = document.getElementById("catIcon").value.trim();
  if (!name) {
    alert("请输入分类名");
    return;
  }
  try {
    const res = await fetch(`${API}/api/categories/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, icon })
    });
    const data = await res.json();
    if (data.ok) {
      document.getElementById("catName").value = "";
      document.getElementById("catIcon").value = "";
      loadCategories();
    } else {
      alert(data.message || "添加失败");
    }
  } catch (e) {
    alert("添加失败");
  }
}

// 删除分类
async function deleteCategory(id) {
  if (!confirm("确认删除这个分类吗？")) return;
  try {
    const res = await fetch(`${API}/api/categories/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    const data = await res.json();
    if (data.ok) {
      loadCategories();
    } else {
      alert(data.message || "删除失败");
    }
  } catch (e) {
    alert("删除失败");
  }
}

// 加载数据
async function loadData() {
  try {
    const res = await fetch(`${API}/api/sites`);
    const list = await res.json();

    const box = document.getElementById("siteList");
    box.innerHTML = "";

    if (list.length === 0) {
      box.innerHTML = "<p style='text-align:center; opacity:0.7;'>暂无站点，快去添加第一个吧！</p>";
      return;
    }

    list.forEach(item => {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <p>
          <strong>${item.name}</strong><br>
          <small style="opacity:0.8">${item.url}</small><br>
          ${item.desc ? `<small>📝 ${item.desc}</small><br>` : ''}
          ${item.category ? `<small>📂 ${item.category}</small>` : ''}
        </p>
        <button onclick="deleteSite(${item.id})">🗑️ 删除</button>
      `;
      box.appendChild(div);
    });
  } catch (error) {
    console.error("加载数据失败:", error);
    alert("加载失败，请刷新重试！");
  }
}

// 添加站点
async function addSite() {
  const name = document.getElementById("name").value.trim();
  const url = document.getElementById("url").value.trim();
  const desc = document.getElementById("desc").value.trim();
  const category = document.getElementById("category").value.trim();

  // 验证必填项
  if (!name || !url) {
    alert("❌ 站点名称和网址为必填项！");
    return;
  }

  // 验证URL格式
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    alert("❌ 网址必须以 http:// 或 https:// 开头！");
    return;
  }

  const data = { name, url, desc, category };

  try {
    await fetch(`${API}/api/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    alert("✅ 添加成功！");
    
    // 清空表单
    document.getElementById("name").value = "";
    document.getElementById("url").value = "";
    document.getElementById("desc").value = "";
    document.getElementById("category").value = "";
    
    loadData();
  } catch (error) {
    console.error("添加失败:", error);
    alert("❌ 添加失败，请重试！");
  }
}

// 删除站点
async function deleteSite(id) {
  if (!confirm("⚠️ 确认删除这个站点吗？")) return;

  try {
    await fetch(`${API}/api/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id })
    });

    alert("✅ 删除成功");
    loadData();
  } catch (error) {
    console.error("删除失败:", error);
    alert("❌ 删除失败，请重试！");
  }
}

// 显示修改密码弹窗
function showChangePassword() {
  document.getElementById("passwordModal").style.display = "flex";
  // 清空输入框
  document.getElementById("oldPassword").value = "";
  document.getElementById("newPassword").value = "";
  document.getElementById("confirmPassword").value = "";
}

// 隐藏修改密码弹窗
function hideChangePassword() {
  document.getElementById("passwordModal").style.display = "none";
}

// 修改密码
async function changePassword() {
  const oldPassword = document.getElementById("oldPassword").value.trim();
  const newPassword = document.getElementById("newPassword").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();

  // 验证输入
  if (!oldPassword || !newPassword || !confirmPassword) {
    alert("❌ 请填写所有字段！");
    return;
  }

  if (newPassword.length < 6) {
    alert("❌ 新密码至少需要6位！");
    return;
  }

  if (newPassword !== confirmPassword) {
    alert("❌ 两次输入的新密码不一致！");
    return;
  }

  try {
    const res = await fetch(`${API}/api/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        oldPassword, 
        newPassword 
      })
    });

    const data = await res.json();

    if (data.ok) {
      alert("✅ " + (data.message || "密码修改成功！请牢记新密码"));
      hideChangePassword();
      // 5秒后跳转到登录页
      setTimeout(() => {
        alert("即将返回登录页面...");
        location.reload();
      }, 2000);
    } else {
      alert("❌ " + (data.message || "修改失败"));
    }
  } catch (error) {
    console.error("修改密码失败:", error);
    alert("❌ 修改密码失败，请重试！");
  }
}

// 点击弹窗外部关闭
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("passwordModal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        hideChangePassword();
      }
    });
  }
});
