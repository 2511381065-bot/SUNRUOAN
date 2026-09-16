/* ============================================================
 * studio.js —— 可视化工坊逻辑
 * 左侧表单编辑 + 右侧 iframe 实时预览 + 保存/还原 + 撤销/重做
 * + JSON 导入导出 + 打包部署。数据实时写入 preview key，
 * 正式「保存」才写入站点 key，实现「改动预览」与「正式保存」分离。
 * ============================================================ */
(function () {
  "use strict";

  // ---------- 状态 ----------
  // 编辑基准：预览键保存的是「最近一次编辑」状态（每次改动即写入），比正式键 / 服务器更新。
  // 开工坊时优先取预览键，避免用户最新的未保存改动（如上传的图片）被覆盖丢失。
  var data = (function () {
    try {
      if (localStorage.getItem("portfolio_preview_v1")) return Store.loadPreview();
    } catch (e) {}
    return Store.load();
  })();
  var savedData = Store.load();      // 最近一次「保存」的基准（正式键）
  var history = [JSON.parse(JSON.stringify(data))];
  var hisIndex = 0;
  var commitTimer = null;

  var form = document.getElementById("sForm");
  var frame = document.getElementById("previewFrame");
  var statusEl = document.getElementById("sStatus");

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // ---------- 路径读写 ----------
  function setPath(obj, path, val) {
    var parts = path.split(".");
    var cur = obj;
    for (var i = 0; i < parts.length - 1; i++) {
      if (cur == null) return;
      cur = cur[parts[i]];
    }
    if (cur != null) cur[parts[parts.length - 1]] = val;
  }
  function getPath(obj, path) {
    var parts = path.split(".");
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return "";
      cur = cur[parts[i]];
    }
    return cur;
  }

  // ---------- 表单元素构造 ----------
  function fld(label, inner) {
    return '<label class="fld"><span>' + label + "</span>" + inner + "</label>";
  }
  function inputText(path, val, label) {
    return fld(label, '<input type="text" data-path="' + path + '" value="' + esc(val) + '" />');
  }
  function inputArea(path, val, label) {
    return fld(label, '<textarea data-path="' + path + '">' + esc(val) + "</textarea>");
  }
  function inputColor(path, val, label) {
    return fld(label, '<input type="color" data-path="' + path + '" value="' + esc(val) + '" />');
  }
  function inputRange(path, val, label, min, max) {
    return fld(label,
      '<input type="range" data-path="' + path + '" data-type="number" min="' + min + '" max="' + max + '" step="' + (max - min) / 100 + '" value="' + esc(val) + '" />' +
      '<span class="range-val" data-ref="' + path + '">' + esc(val) + "</span>");
  }
  function inputSelect(path, val, options, label) {
    var opts = options.map(function (o) {
      return '<option value="' + esc(o.v) + '"' + (String(o.v) === String(val) ? " selected" : "") + ">" + esc(o.l) + "</option>";
    }).join("");
    return fld(label, '<select data-path="' + path + '">' + opts + "</select>");
  }
  // 图片地址 + 本地上传按钮（上传转 base64 回填）
  function inputImage(path, val, label) {
    return fld(label,
      '<div class="img-row">' +
      '<input type="text" data-path="' + path + '" value="' + esc(val) + '" />' +
      '<button type="button" class="mini-btn upload" data-upload="' + path + '">上传</button>' +
      "</div>");
  }

  // ---------- 各页签表单 ----------
  function sec(id, html) { return '<div class="fsec" data-sec="' + id + '">' + html + "</div>"; }
  function secTitle(text, extra) {
    return "<h4>" + esc(text) + (extra || "") + "</h4>";
  }

  function renderGlobal() {
    var h = [];
    h.push(inputText("meta.name", data.meta.name, "姓名"));
    h.push(inputText("meta.logo", data.meta.logo, "Logo 文字"));
    h.push(inputText("meta.role", data.meta.role, "身份头衔"));
    h.push(inputText("meta.siteTitle", data.meta.siteTitle, "页面标题(title)"));

    var tplOpts = SiteConfig.templateIds.map(function (id) {
      return { v: id, l: SiteConfig.templates[id].name };
    });
    h.push(inputSelect("theme", data.theme, tplOpts, "外观模板"));
    h.push(inputSelect("particle.style", data.particle.style, [
      { v: "network", l: "连线网络" }, { v: "stars", l: "星点悬浮" },
      { v: "matrix", l: "矩阵/代码雨" }, { v: "starfield", l: "星空互动" }
    ], "粒子动效风格"));
    h.push(inputColor("themeOverrides.--accent", data.themeOverrides["--accent"] || "#ffffff", "强调色(局部微调)"));
    h.push(inputSelect("settings.imgMaxLen", data.settings.imgMaxLen, [
      { v: 800, l: "小图 · 800px" }, { v: 1280, l: "标清 · 1280px" },
      { v: 1600, l: "高清 · 1600px" }, { v: 1920, l: "全高清 · 1920px" },
      { v: 2560, l: "超清 · 2560px" }
    ], "图片最大边(上传自动压缩)"));
    h.push(inputRange("settings.imgQuality", data.settings.imgQuality, "压缩质量", 0.5, 1));
    return sec("global", secTitle("全局设置") + h.join(""));
  }

  function renderHero() {
    var hr = data.hero;
    var h = [];
    h.push(inputText("hero.tagline", hr.tagline, "顶部小标签"));
    h.push(inputText("hero.title", hr.title, "主标题"));
    h.push(inputText("hero.titleAccent", hr.titleAccent, "主标题(强调)"));
    h.push(inputArea("hero.subtitle", hr.subtitle, "副标题/简介"));
    h.push(inputSelect("hero.bgType", hr.bgType, [{ v: "video", l: "视频背景" }, { v: "image", l: "图片背景" }], "背景类型"));
    h.push(inputText("hero.bgSrc", hr.bgSrc, "背景视频地址(mp4)"));
    h.push(inputImage("hero.bgPoster", hr.bgPoster, "背景封面/图片地址"));
    hr.cta.forEach(function (c, i) {
      h.push(secTitle("按钮 " + (i + 1), '<button class="mini-btn" data-del="hero.cta" data-idx="' + i + '">删除</button>'));
      h.push(inputText("hero.cta." + i + ".label", c.label, "按钮文字"));
      h.push(inputText("hero.cta." + i + ".href", c.href, "跳转链接(如 #/portfolio)"));
    });
    h.push('<button class="mini-btn add" data-add="hero.cta">+ 新增按钮</button>');
    return sec("hero", secTitle("首页 Hero") + h.join(""));
  }

  function renderPortfolio() {
    var list = data.portfolio.items;
    var h = [];
    h.push(inputSelect("portfolio.layout", data.portfolio.layout, [{ v: "grid", l: "卡片网格" }], "布局"));
    list.forEach(function (it, i) {
      h.push(secTitle("作品 " + (i + 1) + " · " + it.title, '<button class="mini-btn" data-del="portfolio.items" data-idx="' + i + '">删除</button>'));
      h.push(inputText("portfolio.items." + i + ".title", it.title, "标题"));
      h.push(inputText("portfolio.items." + i + ".tag", it.tag, "标签"));
      h.push(inputSelect("portfolio.items." + i + ".category", it.category, data.portfolio.filters.map(function (f) { return { v: f, l: f }; }), "分类"));
      h.push(inputArea("portfolio.items." + i + ".desc", it.desc, "描述"));
      h.push(inputSelect("portfolio.items." + i + ".mediaType", it.mediaType, [{ v: "image", l: "图片" }, { v: "video", l: "视频" }], "媒体类型"));
      h.push(inputImage("portfolio.items." + i + ".src", it.src, "媒体地址(图片可上传，视频填URL)"));
      h.push(inputImage("portfolio.items." + i + ".poster", it.poster, "视频封面"));
      h.push(inputRange("portfolio.items." + i + ".style.opacity", it.style.opacity, "图片透明度", 0, 1));
      h.push(inputRange("portfolio.items." + i + ".style.radius", it.style.radius, "圆角", 0, 40));
    });
    h.push('<button class="mini-btn add" data-add="portfolio.items">+ 新增作品</button>');
    return sec("portfolio", secTitle("作品集") + h.join(""));
  }

  function renderProjects() {
    var list = data.projects.items;
    var h = [];
    list.forEach(function (it, i) {
      h.push(secTitle("项目 " + (i + 1) + " · " + it.title, '<button class="mini-btn" data-del="projects.items" data-idx="' + i + '">删除</button>'));
      h.push(inputText("projects.items." + i + ".title", it.title, "项目名称"));
      h.push(inputArea("projects.items." + i + ".intro", it.intro, "简介"));
      h.push(inputText("projects.items." + i + ".time", it.time, "时间"));
      h.push(inputText("projects.items." + i + ".tags", (it.tags || []).join(", "), "标签(逗号分隔)"));
    });
    h.push('<button class="mini-btn add" data-add="projects.items">+ 新增项目</button>');
    return sec("projects", secTitle("项目") + h.join(""));
  }

  function renderAbout() {
    var a = data.about;
    var h = [];
    h.push(inputImage("about.avatar", a.avatar, "头像地址"));
    h.push(inputArea("about.lead", a.lead, "引言"));
    h.push(inputArea("about.bio", a.bio, "简介"));
    h.push(inputText("about.goal", a.goal, "目标/定位"));
    a.focus.forEach(function (f, i) {
      h.push(secTitle("领域 " + (i + 1), '<button class="mini-btn" data-del="about.focus" data-idx="' + i + '">删除</button>'));
      h.push(inputText("about.focus." + i + ".k", f.k, "名称"));
      h.push(inputText("about.focus." + i + ".v", f.v, "说明"));
    });
    h.push('<button class="mini-btn add" data-add="about.focus">+ 新增领域</button>');
    return sec("about", secTitle("关于我") + h.join(""));
  }

  function renderSkills() {
    var list = data.skills.groups;
    var h = [];
    list.forEach(function (g, i) {
      h.push(secTitle("分组 " + (i + 1), '<button class="mini-btn" data-del="skills.groups" data-idx="' + i + '">删除</button>'));
      h.push(inputText("skills.groups." + i + ".name", g.name, "分组名"));
      h.push(inputText("skills.groups." + i + ".items", (g.items || []).map(function (x) { return x.label; }).join(", "), "技能(逗号分隔)"));
    });
    h.push('<button class="mini-btn add" data-add="skills.groups">+ 新增分组</button>');
    return sec("skills", secTitle("技能栈") + h.join(""));
  }

  function renderContact() {
    var c = data.contact;
    var h = [];
    h.push(inputText("contact.email", c.email, "邮箱"));
    c.socials.forEach(function (s, i) {
      h.push(secTitle("社交 " + (i + 1), '<button class="mini-btn" data-del="contact.socials" data-idx="' + i + '">删除</button>'));
      h.push(inputText("contact.socials." + i + ".label", s.label, "名称"));
      h.push(inputText("contact.socials." + i + ".icon", s.icon, "图标文字"));
      h.push(inputText("contact.socials." + i + ".href", s.href, "链接"));
    });
    h.push('<button class="mini-btn add" data-add="contact.socials">+ 新增社交</button>');
    return sec("contact", secTitle("联系我") + h.join(""));
  }

  var tabRenderers = {
    global: renderGlobal, hero: renderHero, portfolio: renderPortfolio,
    projects: renderProjects, about: renderAbout, skills: renderSkills, contact: renderContact
  };

  function renderForm() {
    var html = "";
    for (var k in tabRenderers) {
      html += tabRenderers[k]();
    }
    form.innerHTML = html;
    syncRangeVals();
  }

  function syncRangeVals() {
    var refs = form.querySelectorAll(".range-val");
    refs.forEach(function (el) {
      var path = el.getAttribute("data-ref");
      var input = form.querySelector('input[data-path="' + path + '"]');
      if (input) el.textContent = input.value;
    });
  }

  // ---------- 预览刷新 ----------
  function refreshPreview() {
    // 写入 preview key，然后重载 iframe 读取最新
    var ok = Store.savePreview(data);
    if (!ok) {
      toast("内容过大，本地存储写入失败，请压缩图片或改用外链地址");
    }
    frame.src = "index.html?preview=1&t=" + Date.now();
  }

  function commit() {
    // 历史快照（去重）
    var cur = JSON.stringify(data);
    if (history[hisIndex] !== cur) {
      history = history.slice(0, hisIndex + 1);
      history.push(cur);
      hisIndex = history.length - 1;
      if (history.length > 50) { history.shift(); hisIndex--; }
    }
    updateDirty();
    refreshPreview();
  }

  function scheduleCommit() {
    updateDirty();
    if (commitTimer) clearTimeout(commitTimer);
    commitTimer = setTimeout(commit, 250);
  }

  function updateDirty() {
    var dirty = JSON.stringify(data) !== JSON.stringify(savedData);
    statusEl.textContent = dirty ? "未保存的改动" : "已保存";
    statusEl.className = "s-status" + (dirty ? " dirty" : "");
    document.getElementById("btnUndo").disabled = hisIndex <= 0;
    document.getElementById("btnRedo").disabled = hisIndex >= history.length - 1;
  }

  // ---------- 数组增删 ----------
  function newItemFor(path) {
    var tpl = {
      "portfolio.items": { id: "p" + Date.now(), category: "全部", title: "新作品", tag: "标签", desc: "", mediaType: "image", src: "", poster: "", link: { label: "", href: "#" }, style: { opacity: 1, radius: 8 } },
      "projects.items": { id: "pr" + Date.now(), title: "新项目", intro: "", tags: [], time: "2026", link: { label: "", href: "#" } },
      "hero.cta": { label: "按钮", href: "#/portfolio" },
      "about.focus": { k: "领域", v: "说明" },
      "skills.groups": { name: "新分组", items: [{ label: "技能" }] },
      "contact.socials": { label: "链接", icon: "↗", href: "#" }
    };
    return JSON.parse(JSON.stringify(tpl[path]));
  }

  function doAdd(path) {
    var arr = getPath(data, path);
    if (!arr) return;
    arr.push(newItemFor(path));
    renderForm();
    commit();
  }
  function doDel(path, idx) {
    var arr = getPath(data, path);
    if (!arr) return;
    arr.splice(idx, 1);
    renderForm();
    commit();
  }

  function applyData(newData, keepHistory) {
    data = newData;
    if (!keepHistory) {
      history = [JSON.stringify(data)];
      hisIndex = 0;
    }
    renderForm();
    commit();
  }

  // ---------- 打包部署 ----------
  function packageSite() {
    var dataJson = JSON.stringify(data).replace(/</g, "\\u003c");
    var html = [
      "<!DOCTYPE html>",
      '<html lang="zh-CN">', "<head>",
      '<meta charset="UTF-8" />',
      '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
      "<title>" + esc(data.meta.siteTitle) + "</title>",
      '<link rel="stylesheet" href="css/style.css" />',
      "</head>", "<body>",
      '<canvas id="particles"></canvas>',
      '<div id="loader"><div class="l-name" id="lName">加载中</div></div>',
      '<div id="app">',
      '<header id="header">',
      '<a class="logo" href="#/home"><span id="logoName"></span><span>.</span></a>',
      '<button class="nav-toggle" id="navToggle" aria-label="菜单">☰</button>',
      '<nav id="nav"></nav>',
      "</header>",
      '<main id="view"></main>',
      "</div>",
      '<button id="toTop" aria-label="回到顶部">↑</button>',
      '<div class="lightbox" id="lightbox"><div class="lb-box">',
      '<div id="lbMedia"></div>',
      '<div class="lb-meta"><div><h3 id="lbTitle"></h3><p id="lbDesc"></p></div>',
      '<button class="lb-close" id="lbClose" aria-label="关闭">×</button></div>',
      "</div></div>",
      "<script>window.__SITE_DATA__ = " + dataJson + ";</" + "script>",
      '<script src="js/data.js"></' + "script>",
      '<script src="js/store.js"></' + "script>",
      '<script src="js/particles.js"></' + "script>",
      '<script src="js/renderer.js"></' + "script>",
      '<script src="js/main.js"></' + "script>",
      "</body></html>"
    ].join("\n");

    Store.downloadBlob(new Blob([html], { type: "text/html" }), "index.html");
    Store.downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), "site-data.json");
    toast("已导出 index.html + site-data.json，与其同级的 css/、js/ 目录一起上传即可部署");
  }

  // ---------- 轻提示 ----------
  var toastTimer = null;
  function toast(msg) {
    var el = document.getElementById("sToast") || createToast();
    el.textContent = msg;
    el.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2600);
  }
  function createToast() {
    var el = document.createElement("div");
    el.id = "sToast";
    document.body.appendChild(el);
    return el;
  }

  // ---------- 事件绑定 ----------
  var currentUploadPath = null;

  function onFieldChange(e) {
    var el = e.target;
    if (!el || !el.getAttribute) return;
    var path = el.getAttribute("data-path");
    if (!path) return;
    var type = el.getAttribute("data-type") || "text";
    var val = el.value;
    if (type === "number") val = parseFloat(val) || 0;
    if (path.indexOf(".tags") >= 0 && el.tagName === "INPUT") {
      val = val.split(/[,，、]/).map(function (s) { return s.trim(); }).filter(Boolean);
    }
    if (path.indexOf(".items") >= 0 && el.tagName === "INPUT" && path.endsWith(".items")) {
      // skills.groups.i.items → 转对象数组
      val = val.split(/[,，、]/).map(function (s) { return { label: s.trim() }; }).filter(function (x) { return x.label; });
    }
    setPath(data, path, val);
    scheduleCommit();
  }
  // select/range/color 等控件在部分浏览器只触发 change 不触发 input，故两个事件都监听
  form.addEventListener("input", onFieldChange);
  form.addEventListener("change", onFieldChange);

  form.addEventListener("click", function (e) {
    var t = e.target;
    if (t.hasAttribute("data-add")) { doAdd(t.getAttribute("data-add")); return; }
    if (t.hasAttribute("data-del")) { doDel(t.getAttribute("data-del"), parseInt(t.getAttribute("data-idx"), 10)); return; }
    if (t.hasAttribute("data-upload")) {
      currentUploadPath = t.getAttribute("data-upload");
      document.getElementById("imgFileInput").click();
      return;
    }
  });

  // 估算 base64 图片的实际字节大小（用于体积反馈）
  function fmtSize(base64) {
    var bytes = Math.round(base64.length * 0.75);
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + " MB";
    if (bytes >= 1024) return (bytes / 1024).toFixed(0) + " KB";
    return bytes + " B";
  }

  // 压缩图片为 jpeg base64，避免超出 localStorage 容量（约 5MB）
  function compressImage(dataUrl, maxLen, quality, cb) {
    var img = new Image();
    img.onload = function () {
      var w = img.naturalWidth || img.width;
      var h = img.naturalHeight || img.height;
      var scale = Math.min(1, maxLen / Math.max(w, h));
      var cw = Math.max(1, Math.round(w * scale));
      var ch = Math.max(1, Math.round(h * scale));
      var canvas = document.createElement("canvas");
      canvas.width = cw; canvas.height = ch;
      var ctx = canvas.getContext("2d");
      try {
        ctx.drawImage(img, 0, 0, cw, ch);
        cb(canvas.toDataURL("image/jpeg", quality));
      } catch (err) {
        cb(dataUrl);
      }
    };
    img.onerror = function () { cb(dataUrl); };
    img.src = dataUrl;
  }

  // 本地上传图片 → 打开裁剪弹窗（框选展示区域）→ 压缩 → base64 回填
  document.getElementById("imgFileInput").addEventListener("change", function (e) {
    var f = e.target.files[0];
    if (!f || !currentUploadPath) { e.target.value = ""; return; }
    var reader = new FileReader();
    reader.onload = function () { openCrop(reader.result); };
    reader.onerror = function () { toast("图片读取失败"); };
    reader.readAsDataURL(f);
    e.target.value = "";
  });

  // ---------- 图片裁剪（框选展示区域）----------
  var MIN_CROP = 40;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  var cropModal = document.getElementById("cropModal");
  var cropStage = document.getElementById("cropStage");
  var cropImg = document.getElementById("cropImg");
  var cropArea = document.getElementById("cropArea");
  var cropGrip = document.getElementById("cropGrip");
  var cropRatiosEl = document.getElementById("cropRatios");
  var cropPrevCanvas = document.getElementById("cropPrevCanvas");
  var cropUndoBtn = document.getElementById("cropUndo");
  var cropPreviewBtn = document.getElementById("cropPreview");

  var cropRatiosList = [
    { id: "free", label: "自由", r: null },
    { id: "1:1", label: "1:1", r: 1 },
    { id: "4:3", label: "4:3", r: 4 / 3 },
    { id: "3:4", label: "3:4", r: 3 / 4 },
    { id: "16:9", label: "16:9", r: 16 / 9 },
    { id: "9:16", label: "9:16", r: 9 / 16 },
    { id: "3:2", label: "3:2", r: 3 / 2 },
    { id: "2:3", label: "2:3", r: 2 / 3 }
  ];
  var cropRatio = null;
  var cropSrc = "";

  cropRatiosList.forEach(function (item) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "r" + (item.r === null ? " active" : "");
    b.textContent = item.label;
    b.addEventListener("click", function () {
      if (previewMode) exitPreview();
      snapshotArea();
      cropRatio = item.r;
      cropRatiosEl.querySelectorAll(".r").forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active");
      resetCropArea();
    });
    cropRatiosEl.appendChild(b);
  });

  function imgRect() {
    return {
      left: cropImg.offsetLeft, top: cropImg.offsetTop,
      width: cropImg.offsetWidth, height: cropImg.offsetHeight
    };
  }
  function setArea(l, t, w, h) {
    cropArea.style.left = l + "px";
    cropArea.style.top = t + "px";
    cropArea.style.width = w + "px";
    cropArea.style.height = h + "px";
  }
  function areaRect() {
    return { left: cropArea.offsetLeft, top: cropArea.offsetTop, width: cropArea.offsetWidth, height: cropArea.offsetHeight };
  }
  function resetCropArea() {
    var r = imgRect();
    var maxW = r.width, maxH = r.height, w, h;
    if (cropRatio) {
      if (maxW / maxH > cropRatio) { h = maxH; w = maxH * cropRatio; }
      else { w = maxW; h = maxW / cropRatio; }
    } else { w = maxW; h = maxH; }
    w *= 0.9; h *= 0.9;
    setArea(r.left + (maxW - w) / 2, r.top + (maxH - h) / 2, w, h);
  }
  function openCrop(dataUrl) {
    if (previewMode) exitPreview();
    cropSrc = dataUrl;
    cropRatio = null;
    cropUndoStack = [];
    cropUndoBtn.disabled = true;
    cropRatiosEl.querySelectorAll(".r").forEach(function (x, i) {
      x.classList.toggle("active", cropRatiosList[i].r === null);
    });
    cropImg.onload = function () {
      requestAnimationFrame(function () { resetCropArea(); });
    };
    cropImg.src = dataUrl;
    cropModal.classList.add("open");
  }
  function closeCrop() {
    cropModal.classList.remove("open");
    cropSrc = "";
  }

  // 拖拽移动 / 缩放
  var cropDrag = null;
  var cropDragStart = null;
  cropArea.addEventListener("mousedown", function (e) {
    if (e.button !== 0) return;
    cropDrag = "move";
    cropDragStart = { x: e.clientX, y: e.clientY, a: areaRect() };
    e.preventDefault();
  });
  cropGrip.addEventListener("mousedown", function (e) {
    if (e.button !== 0) return;
    cropDrag = "resize";
    cropDragStart = { x: e.clientX, y: e.clientY, a: areaRect() };
    e.preventDefault();
    e.stopPropagation();
  });
  document.addEventListener("mousemove", function (e) {
    if (!cropDrag) return;
    var r = imgRect();
    var dx = e.clientX - cropDragStart.x;
    var dy = e.clientY - cropDragStart.y;
    if (cropDrag === "move") {
      var l = clamp(cropDragStart.a.left + dx, r.left, r.left + r.width - cropDragStart.a.width);
      var t = clamp(cropDragStart.a.top + dy, r.top, r.top + r.height - cropDragStart.a.height);
      setArea(l, t, cropDragStart.a.width, cropDragStart.a.height);
    } else {
      var maxW = r.left + r.width - cropDragStart.a.left;
      var maxH = r.top + r.height - cropDragStart.a.top;
      var dw = clamp(cropDragStart.a.width + dx, MIN_CROP, maxW);
      var dh = clamp(cropDragStart.a.height + dy, MIN_CROP, maxH);
      if (cropRatio) {
        var R = cropRatio;
        if (dw / dh > R) { dh = dw / R; if (dh > maxH) { dh = maxH; dw = dh * R; } }
        else { dw = dh * R; if (dw > maxW) { dw = maxW; dh = dw / R; } }
        dw = clamp(dw, MIN_CROP, maxW); dh = clamp(dh, MIN_CROP, maxH);
      }
      setArea(cropDragStart.a.left, cropDragStart.a.top, dw, dh);
    }
  });
  document.addEventListener("mouseup", function () {
    if (cropDrag) {
      var now = areaRect();
      var a0 = cropDragStart.a;
      if (now.left !== a0.left || now.top !== a0.top || now.width !== a0.width || now.height !== a0.height) {
        cropUndoStack.push({ l: a0.left, t: a0.top, w: a0.width, h: a0.height });
        cropUndoBtn.disabled = false;
      }
    }
    cropDrag = null;
  });

  // 裁剪输出（再走统一的压缩流程回填）
  function finishCrop(baseData) {
    closeCrop();
    var maxLen = Number(data.settings && data.settings.imgMaxLen) || 1920;
    var q = Number(data.settings && data.settings.imgQuality);
    if (!(q >= 0.1 && q <= 1)) q = 0.82;
    compressImage(baseData, maxLen, q, function (compressed) {
      setPath(data, currentUploadPath, compressed);
      var field = form.querySelector('input[data-path="' + currentUploadPath + '"]');
      if (field) field.value = compressed;
      scheduleCommit();
      toast("已裁剪并压缩：" + fmtSize(baseData) + " → " + fmtSize(compressed));
    });
  }
  // 计算框选区在原始图片上的实际裁剪矩形
  function getCropNaturalRect() {
    var a = areaRect();
    var r = imgRect();
    var nw = cropImg.naturalWidth, nh = cropImg.naturalHeight;
    if (!nw || !nh || !r.width || !r.height) return null;
    var sx = clamp((a.left - r.left) / r.width * nw, 0, nw);
    var sy = clamp((a.top - r.top) / r.height * nh, 0, nh);
    var sw = clamp(a.width / r.width * nw, 1, nw - sx);
    var sh = clamp(a.height / r.height * nh, 1, nh - sy);
    return { sx: sx, sy: sy, sw: sw, sh: sh };
  }
  var cropUndoStack = [];
  function snapshotArea() {
    var a = areaRect();
    cropUndoStack.push({ l: a.left, t: a.top, w: a.width, h: a.height });
    cropUndoBtn.disabled = false;
  }
  function undoCrop() {
    if (previewMode) exitPreview();
    if (!cropUndoStack.length) return;
    var s = cropUndoStack.pop();
    setArea(s.l, s.t, s.w, s.h);
    cropUndoBtn.disabled = cropUndoStack.length === 0;
  }
  var previewMode = false;
  function showPreview() {
    var rect = getCropNaturalRect();
    if (!rect) return;
    cropPrevCanvas.width = Math.round(rect.sw);
    cropPrevCanvas.height = Math.round(rect.sh);
    var ctx = cropPrevCanvas.getContext("2d");
    ctx.drawImage(cropImg, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, cropPrevCanvas.width, cropPrevCanvas.height);
    cropImg.style.display = "none";
    cropArea.style.display = "none";
    cropPrevCanvas.style.display = "block";
    cropPreviewBtn.textContent = "返回编辑";
    previewMode = true;
  }
  function exitPreview() {
    cropPrevCanvas.style.display = "none";
    cropImg.style.display = "";
    cropArea.style.display = "";
    cropPreviewBtn.textContent = "预览";
    previewMode = false;
  }
  function confirmCrop() {
    var rect = getCropNaturalRect();
    if (!rect) { finishCrop(cropSrc); return; }
    var canvas = document.createElement("canvas");
    canvas.width = Math.round(rect.sw); canvas.height = Math.round(rect.sh);
    var ctx = canvas.getContext("2d");
    ctx.drawImage(cropImg, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, canvas.width, canvas.height);
    finishCrop(canvas.toDataURL("image/jpeg", 0.95));
  }

  document.getElementById("cropOk").addEventListener("click", confirmCrop);
  document.getElementById("cropSkip").addEventListener("click", function () { finishCrop(cropSrc); });
  document.getElementById("cropClose").addEventListener("click", closeCrop);
  cropUndoBtn.addEventListener("click", undoCrop);
  cropPreviewBtn.addEventListener("click", function () {
    if (previewMode) exitPreview(); else showPreview();
  });
  cropModal.addEventListener("click", function (e) { if (e.target === cropModal) closeCrop(); });

  // 顶部按钮
  document.getElementById("btnSave").addEventListener("click", function () {
    savedData = JSON.parse(JSON.stringify(data));
    Store.save(data); // 本地兜底（离线 / file:// 也能用）
    Store.saveToServer(data).then(function (r) {
      toast(r && r.ok ? "已保存到服务器 (data/site-data.json)" : "已在本地保存（服务器不可用）");
    }).catch(function () {
      toast("已在本地保存（服务器不可用）");
    });
    updateDirty();
  });
  document.getElementById("btnReset").addEventListener("click", function () {
    applyData(JSON.parse(JSON.stringify(savedData)), false);
    Store.savePreview(data);
    toast("已还原为上次保存的内容");
  });
  document.getElementById("btnUndo").addEventListener("click", function () {
    if (hisIndex <= 0) return;
    hisIndex--;
    data = JSON.parse(history[hisIndex]);
    renderForm();
    Store.savePreview(data);
    frame.src = "index.html?preview=1&t=" + Date.now();
    updateDirty();
  });
  document.getElementById("btnRedo").addEventListener("click", function () {
    if (hisIndex >= history.length - 1) return;
    hisIndex++;
    data = JSON.parse(history[hisIndex]);
    renderForm();
    Store.savePreview(data);
    frame.src = "index.html?preview=1&t=" + Date.now();
    updateDirty();
  });
  document.getElementById("btnExport").addEventListener("click", function () {
    Store.exportJSON(data);
    toast("已导出数据 JSON");
  });
  document.getElementById("btnImport").addEventListener("click", function () {
    document.getElementById("fileInput").click();
  });
  document.getElementById("fileInput").addEventListener("change", function (e) {
    var f = e.target.files[0];
    if (!f) return;
    Store.importJSON(f).then(function (d) {
      data = d; savedData = JSON.parse(JSON.stringify(d));
      applyData(data, false);
      toast("导入成功");
    }).catch(function () { toast("导入失败，文件格式有误"); });
    e.target.value = "";
  });
  document.getElementById("btnPackage").addEventListener("click", function () {
    // 先保存到服务器，再触发构建生成 dist/；服务器不可用时退回下载两文件
    Store.save(data);
    Store.saveToServer(data).then(function () {
      return Store.buildToServer();
    }).then(function (r) {
      if (r && r.ok) {
        toast("已生成 dist/ 目录，可上传任意服务器部署");
      } else {
        fallbackPackage();
      }
    }).catch(function () {
      fallbackPackage();
    });
  });

  function fallbackPackage() {
    packageSite();
    toast("未检测到 dev 服务，已改为下载 index.html + site-data.json");
  }

  // 页签切换
  document.querySelectorAll(".s-nav .tab").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".s-nav .tab").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      var tab = btn.getAttribute("data-tab");
      document.querySelectorAll(".fsec").forEach(function (s) {
        s.style.display = (s.getAttribute("data-sec") === tab) ? "" : "none";
      });
    });
  });

  // 设备预览切换
  document.querySelectorAll(".s-device .dev").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".s-device .dev").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      frame.style.width = btn.getAttribute("data-w");
    });
  });

  // ---------- 启动 ----------
  renderForm();
  // 先显示「全局」页签，其余隐藏
  document.querySelectorAll(".fsec").forEach(function (s) {
    if (s.getAttribute("data-sec") !== "global") s.style.display = "none";
  });
  Store.savePreview(data);
  updateDirty();

  // 本地已有数据时优先使用本地数据，避免启动时被服务器数据覆盖，
  // 导致「未同步到服务器的改动」（如上传的图片）丢失；仅当本地无数据时才从服务器加载。
  var hasLocalData = (function () {
    try {
      return !!localStorage.getItem("portfolio_site_v1") || !!localStorage.getItem("portfolio_preview_v1");
    } catch (e) { return false; }
  })();
  if (!hasLocalData) {
    Store.fetchServerData().then(function (serverData) {
      if (!serverData) return;
      data = serverData;
      savedData = JSON.parse(JSON.stringify(serverData));
      applyData(data, false);
      toast("已从服务器加载站点数据");
    }).catch(function () {
      // 非 dev 服务（如 file:// 直接打开）无法访问 /api/data，继续使用默认数据
    });
  }
})();