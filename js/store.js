/* ============================================================
 * store.js —— 站点数据的读取 / 保存 / 导入 / 导出
 * 纯前端：localStorage 持久化 + JSON 文件导入导出。
 * ============================================================ */
(function (global) {
  "use strict";

  var KEY = "portfolio_site_v1";
  var PREVIEW_KEY = "portfolio_preview_v1";

  function _load(key) {
    var data = SiteConfig.getDefaultData();
    try {
      var raw = localStorage.getItem(key);
      if (raw) {
        var parsed = JSON.parse(raw);
        // 浅合并：缺失的顶层字段回到默认，避免旧数据结构升级后崩溃
        data = Object.assign(data, parsed);
      }
    } catch (e) {
      // 解析失败则回退默认，绝不白屏
      data = SiteConfig.getDefaultData();
    }
    return data;
  }

  function load() { return _load(KEY); }
  function loadPreview() { return _load(PREVIEW_KEY); }

  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn("保存失败（可能是隐私模式或容量满）：", e);
      return false;
    }
  }
  function savePreview(data) {
    try {
      localStorage.setItem(PREVIEW_KEY, JSON.stringify(data));
      return true;
    } catch (e) { return false; }
  }

  function reset() {
    try { localStorage.removeItem(KEY); } catch (e) {}
    return SiteConfig.getDefaultData();
  }

  function exportJSON(data) {
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    downloadBlob(blob, "portfolio-site-data.json");
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 150);
  }

  function importJSON(file) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () {
        try {
          var parsed = JSON.parse(fr.result);
          resolve(Object.assign(SiteConfig.getDefaultData(), parsed));
        } catch (e) {
          reject(e);
        }
      };
      fr.onerror = function () { reject(fr.error); };
      fr.readAsText(file);
    });
  }

  // ---------- 服务器 API（配合 npm run dev 的 server.js，实现跨浏览器共享数据）----------
  function fetchServerData() {
    return fetch("/api/data", { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }
  function saveToServer(data) {
    return fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).then(function (r) { return r.json(); });
  }
  function buildToServer() {
    return fetch("/api/build", { method: "POST" }).then(function (r) { return r.json(); });
  }

  global.Store = {
    load: load,
    loadPreview: loadPreview,
    save: save,
    savePreview: savePreview,
    reset: reset,
    exportJSON: exportJSON,
    importJSON: importJSON,
    downloadBlob: downloadBlob,
    fetchServerData: fetchServerData,
    saveToServer: saveToServer,
    buildToServer: buildToServer
  };
})(window);