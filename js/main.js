/* ============================================================
 * main.js —— 前台入口
 * 加载站点数据（localStorage 或默认）并初始化渲染引擎。
 * ============================================================ */
(function () {
  "use strict";

  function initSite(data) {
    document.title = (data.meta && data.meta.siteTitle) || "个人作品集";
    var lname = document.getElementById("lName");
    if (lname) { lname.textContent = (data.meta && data.meta.name) || "加载中"; }
    Renderer.init(data);
  }

  function boot() {
    var isPreview = /[?&]preview=1/.test(location.search);
    // 打包部署版：内联的 __SITE_DATA__ 优先于本地存储，实现内容固化
    var data = window.__SITE_DATA__ || (isPreview ? Store.loadPreview() : Store.load());
    initSite(data);

    // 非打包、非预览：从服务器读取跨浏览器共享数据（任意浏览器打开同一份已保存内容）
    if (!window.__SITE_DATA__ && !isPreview) {
      Store.fetchServerData().then(function (serverData) {
        if (serverData) initSite(serverData);
      }).catch(function () {
        // 无 dev 服务（如 file:// 直接打开）时继续使用本地数据
      });
    }

    window.addEventListener("load", function () {
      setTimeout(function () {
        var loader = document.getElementById("loader");
        if (loader) loader.classList.add("done");
      }, 400);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();