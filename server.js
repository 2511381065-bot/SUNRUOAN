/* ============================================================
 * server.js —— 开发服务器（npm run dev）
 * 1) 静态文件服务（index.html / studio.html / css / js）
 * 2) JSON API 实现「任意浏览器编辑 → 保存到服务器 → 构建部署」：
 *    GET  /api/data   读取 data/site-data.json（跨浏览器共享的数据）
 *    POST /api/save   把工坊改动写回 data/site-data.json
 *    POST /api/build  触发 scripts/build.js 生成 dist/
 * 零第三方依赖，Node 内置模块实现。
 * ============================================================ */
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { spawnSync } = require("child_process");

const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, "data", "site-data.json");
const PORT = process.env.PORT || 8123;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (e) {
    // 文件缺失/损坏则回退默认数据
    const code = fs.readFileSync(path.join(ROOT, "js", "data.js"), "utf8");
    const sandbox = { window: {} };
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);
    return sandbox.window.SiteConfig.getDefaultData();
  }
}

function writeData(data) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

function sendJSON(res, status, obj) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(obj));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://" + (req.headers.host || "localhost"));
  let pathname = decodeURIComponent(url.pathname);

  // ---------- API ----------
  if (pathname === "/api/data") {
    if (req.method === "GET") return sendJSON(res, 200, readData());
    return sendJSON(res, 405, { ok: false, error: "method not allowed" });
  }

  if (pathname === "/api/save") {
    if (req.method !== "POST") return sendJSON(res, 405, { ok: false, error: "method not allowed" });
    let body = "";
    req.on("data", (c) => { body += c; });
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        if (!data || typeof data !== "object") throw new Error("无效数据");
        writeData(data);
        sendJSON(res, 200, { ok: true, bytes: body.length });
      } catch (e) {
        sendJSON(res, 400, { ok: false, error: String(e) });
      }
    });
    return;
  }

  if (pathname === "/api/build") {
    if (req.method !== "POST") return sendJSON(res, 405, { ok: false, error: "method not allowed" });
    try {
      const r = spawnSync(process.execPath, [path.join(ROOT, "scripts", "build.js")], { encoding: "utf8" });
      sendJSON(res, r.status === 0 ? 200 : 500, {
        ok: r.status === 0,
        output: (r.stdout || "") + (r.stderr || "")
      });
    } catch (e) {
      sendJSON(res, 500, { ok: false, error: String(e) });
    }
    return;
  }

  // ---------- 静态文件 ----------
  if (pathname === "/") pathname = "/index.html";
  const rel = pathname.replace(/^\/+/, "");
  const fp = path.normalize(path.join(ROOT, rel));
  if (!fp.startsWith(ROOT)) return sendJSON(res, 403, { ok: false, error: "forbidden" });

  fs.readFile(fp, (err, buf) => {
    if (err) return sendJSON(res, 404, { ok: false, error: "not found" });
    res.statusCode = 200;
    res.setHeader("Content-Type", MIME[path.extname(fp).toLowerCase()] || "application/octet-stream");
    // 开发阶段禁用缓存，确保改动的 js/css 即时生效
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.end(buf);
  });
});

server.listen(PORT, () => {
  console.log("开发服务器已启动： http://127.0.0.1:" + PORT);
  console.log("  前台    http://127.0.0.1:" + PORT + "/index.html");
  console.log("  工坊    http://127.0.0.1:" + PORT + "/studio.html");
  console.log("  构建    npm run build   (或工坊内点「打包部署」)");
});