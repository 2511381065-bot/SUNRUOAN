/* ============================================================
 * scripts/build.js —— 构建打包脚本（npm run build）
 * 读取 data/site-data.json（保存后的站点数据），生成完整的
 * dist/ 目录：index.html(内联数据) + site-data.json + css/ + js/。
 * dist/ 是自包含的，可上传到任意静态服务器部署。
 * ============================================================ */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "dist");
const DATA_FILE = path.join(ROOT, "data", "site-data.json");

// 读取站点数据：优先 data/site-data.json，缺失则回退默认数据
function readData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    } catch (e) {
      console.warn("data/site-data.json 解析失败，回退默认数据：", e.message);
    }
  }
  const code = fs.readFileSync(path.join(ROOT, "js", "data.js"), "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.window.SiteConfig.getDefaultData();
}

const data = readData();
const dataJson = JSON.stringify(data).replace(/</g, "\\u003c");
const siteTitle = (data.meta && data.meta.siteTitle) || "个人作品集";

// 清空并重建 dist
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, "css"), { recursive: true });
fs.mkdirSync(path.join(OUT, "js"), { recursive: true });

// 数据 JSON（同时保留一份便于迁移 / 二次导入）
fs.writeFileSync(path.join(OUT, "site-data.json"), JSON.stringify(data, null, 2), "utf8");

// 生成入口 index.html：内联 __SITE_DATA__，优先级高于 localStorage
const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${siteTitle}</title>
<link rel="stylesheet" href="css/style.css" />
</head>
<body>
<canvas id="particles"></canvas>
<div id="loader"><div class="l-name" id="lName">加载中</div></div>
<div id="app">
<header id="header">
<a class="logo" href="#/home"><span id="logoName"></span><span>.</span></a>
<button class="nav-toggle" id="navToggle" aria-label="菜单">☰</button>
<nav id="nav"></nav>
</header>
<main id="view"></main>
</div>
<button id="toTop" aria-label="回到顶部">↑</button>
<div class="lightbox" id="lightbox"><div class="lb-box">
<div id="lbMedia"></div>
<div class="lb-meta"><div><h3 id="lbTitle"></h3><p id="lbDesc"></p></div>
<button class="lb-close" id="lbClose" aria-label="关闭">×</button></div>
</div></div>
<script>window.__SITE_DATA__ = ${dataJson};</script>
<script src="js/data.js"></script>
<script src="js/store.js"></script>
<script src="js/particles.js"></script>
<script src="js/renderer.js"></script>
<script src="js/main.js"></script>
</body>
</html>`;

fs.writeFileSync(path.join(OUT, "index.html"), html, "utf8");

// 复制静态资源
fs.cpSync(path.join(ROOT, "css"), path.join(OUT, "css"), { recursive: true });
fs.cpSync(path.join(ROOT, "js"), path.join(OUT, "js"), { recursive: true });

console.log("构建完成 → " + OUT);
console.log("  index.html      " + fs.statSync(path.join(OUT, "index.html")).size + " bytes");
console.log("  site-data.json  " + fs.statSync(path.join(OUT, "site-data.json")).size + " bytes");
console.log("  css/ js/ 已复制");