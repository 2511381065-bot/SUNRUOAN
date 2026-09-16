/* ============================================================
 * renderer.js —— 前台渲染引擎
 * 负责：应用模板/主题、hash 多页路由、各页面渲染、灯箱、动效。
 * 数据来自 Store.load()，实现「数据驱动 + 模板换肤」分离。
 * ============================================================ */
(function (global) {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // 图片加载失败时的占位兜底（避免裂图）
  var FALLBACK_IMG = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">' +
    '<rect width="100%" height="100%" fill="#19191d"/>' +
    '<text x="50%" y="50%" fill="#c9a96a" font-size="26" text-anchor="middle" font-family="sans-serif" letter-spacing="4">作品</text>' +
    "</svg>"
  );

  // 当前路由 id（默认 home）
  function currentRoute() {
    var h = location.hash.replace(/^#\/?/, "");
    var map = ["home", "portfolio", "projects", "about", "skills", "contact"];
    return map.indexOf(h) >= 0 ? h : "home";
  }

  var pageRenderers = {
    // ---------- 首页 / Hero ----------
    home: function (d) {
      var h = d.hero || {};
      var isVideo = h.bgType === "video" && h.bgSrc;
      var media = isVideo
        ? '<video id="heroVideo" autoplay muted loop playsinline preload="auto" poster="' + esc(h.bgPoster) + '">' +
          '<source src="' + esc(h.bgSrc) + '" type="video/mp4" /></video>' +
          '<img id="heroPoster" src="' + esc(h.bgPoster) + '" alt="" style="display:none;" />'
        : '<img src="' + esc(h.bgPoster || h.bgSrc) + '" alt="" data-hero-bg />';

      var ctas = (h.cta || []).map(function (c) {
        var ghost = c.href && c.href.indexOf("contact") >= 0 ? " ghost" : "";
        return '<a class="hero-cta' + ghost + '" href="' + esc(c.href || "#") + '">' + esc(c.label) + "</a>";
      }).join("");

      return '<section class="hero view">' +
        '<div class="hero-media">' + media + "</div>" +
        '<div class="hero-overlay"></div>' +
        '<div class="hero-content">' +
        '<div class="hero-tag">' + esc(h.tagline) + "</div>" +
        "<h1>" + esc(h.title) + "<br /><em>" + esc(h.titleAccent) + "</em></h1>" +
        '<p class="hero-sub">' + esc(h.subtitle) + "</p>" +
        '<div class="hero-ctas">' + ctas + "</div>" +
        "</div></section>";
    },

    // ---------- 作品集 ----------
    portfolio: function (d) {
      var p = d.portfolio || {};
      var filters = (p.filters || []).map(function (f) {
        return '<button class="filter-btn" data-f="' + esc(f) + '">' + esc(f) + "</button>";
      }).join("");
      var cards = (p.items || []).map(function (it) {
        return cardHtml(it);
      }).join("");
      return '<section class="page-section">' +
        '<div class="sec-head reveal"><div class="sec-index">01 — 精选作品</div><h2>作品集</h2></div>' +
        '<div class="filters reveal">' + filters + "</div>" +
        '<div class="grid" id="workGrid">' + cards + "</div></section>";
    },

    // ---------- 项目 ----------
    projects: function (d) {
      var items = (d.projects && d.projects.items) || [];
      var cards = items.map(function (it) {
        var tags = (it.tags || []).map(function (t) {
          return "<span>" + esc(t) + "</span>";
        }).join("");
        return '<div class="proj reveal">' +
          '<div class="time">' + esc(it.time) + "</div>" +
          "<h3>" + esc(it.title) + "</h3>" +
          "<p>" + esc(it.intro) + "</p>" +
          '<div class="tags">' + tags + "</div></div>";
      }).join("");
      return '<section class="page-section">' +
        '<div class="sec-head reveal"><div class="sec-index">02 — 项目经历</div><h2>项目</h2></div>' +
        '<div class="grid">' + cards + "</div></section>";
    },

    // ---------- 关于我 ----------
    about: function (d) {
      var a = d.about || {};
      var focus = (a.focus || []).map(function (f) {
        return "<li><strong>" + esc(f.k) + "</strong>" + esc(f.v) + "</li>";
      }).join("");
      return '<section class="page-section">' +
        '<div class="sec-head reveal"><div class="sec-index">03 — 关于</div><h2>关于我</h2></div>' +
        '<div class="about-grid">' +
        '<div class="reveal">' +
        '<img class="about-avatar" src="' + esc(a.avatar) + '" alt="头像" />' +
        '<p class="lead">' + esc(a.lead) + "</p>" +
        "<p>" + esc(a.bio) + "</p>" +
        '<div class="about-goal">— ' + esc(a.goal) + "</div>" +
        "</div>" +
        '<div class="about-meta reveal"><h3>专注领域</h3><ul>' + focus + "</ul></div>" +
        "</div></section>";
    },

    // ---------- 技能栈 ----------
    skills: function (d) {
      var groups = (d.skills && d.skills.groups) || [];
      var html = groups.map(function (g) {
        var tags = (g.items || []).map(function (i) {
          return "<span>" + esc(i.label) + "</span>";
        }).join("");
        return '<div class="skill-group reveal"><h3>' + esc(g.name) + '</h3><div class="skill-tags">' + tags + "</div></div>";
      }).join("");
      return '<section class="page-section">' +
        '<div class="sec-head reveal"><div class="sec-index">04 — 技能</div><h2>技能栈</h2></div>' +
        '<div class="skills-groups">' + html + "</div></section>";
    },

    // ---------- 联系我 ----------
    contact: function (d) {
      var c = d.contact || {};
      var m = d.meta || {};
      var links = (c.socials || []).map(function (s) {
        return '<a href="' + esc(s.href || "#") + '" target="_blank" rel="noopener">' +
          '<span>' + esc(s.icon) + "</span>" + esc(s.label) + "</a>";
      }).join("");
      return '<section class="page-section page-foot">' +
        '<div class="sec-head reveal"><div class="sec-index">05 — 联系</div><h2>合作洽谈</h2></div>' +
        '<div class="contact-email reveal"><a href="mailto:' + esc(c.email) + '">' + esc(c.email) + "</a></div>" +
        '<div class="contact-links reveal">' + links + "</div>" +
        '<div class="copyright reveal">© 2026 ' + esc(m.name) + " · 保留所有权利</div>" +
        "</section>";
    }
  };

  function cardHtml(it) {
    var style = "opacity:" + ((it.style && it.style.opacity) || 1) + ";border-radius:" + ((it.style && it.style.radius) || 8) + "px;";
    var isVideo = it.mediaType === "video";
    var media = isVideo
      ? '<div class="media"><video muted loop playsinline preload="metadata" poster="' + esc(it.poster) + '">' +
        '<source src="' + esc(it.src) + '" type="video/mp4" /></video></div>' +
        '<div class="play-icon"></div><div class="badge">VIDEO</div>'
      : '<div class="media"><img src="' + esc(it.src) + '" alt="' + esc(it.title) + '" loading="lazy" /></div>';
    return '<div class="work reveal" style="' + style + '" data-id="' + esc(it.id) + '">' +
      media +
      '<div class="shade"></div>' +
      '<div class="work-info"><div class="tag">' + esc(it.tag) + "</div><h3>" + esc(it.title) + '</h3><p>' + esc(it.desc) + "</p></div>" +
      "</div>";
  }

  // ===== 灯箱 =====
  function setupLightbox(data) {
    var lb = document.getElementById("lightbox");
    var lbMedia = document.getElementById("lbMedia");
    var lbTitle = document.getElementById("lbTitle");
    var lbDesc = document.getElementById("lbDesc");
    var activeVideo = null;

    function open(it) {
      lbTitle.textContent = it.title || "";
      lbDesc.textContent = (it.desc || "") + " · " + (it.tag || "");
      if (it.mediaType === "video") {
        lbMedia.innerHTML = '<video src="' + esc(it.src) + '" controls autoplay playsinline poster="' + esc(it.poster) + '"></video>';
        activeVideo = lbMedia.querySelector("video");
      } else {
        lbMedia.innerHTML = '<img src="' + esc(it.src) + '" alt="' + esc(it.title) + '" />';
      }
      lb.classList.add("open");
      document.body.style.overflow = "hidden";
    }
    function close() {
      if (activeVideo) { try { activeVideo.pause(); } catch (e) {} activeVideo = null; }
      lb.classList.remove("open");
      document.body.style.overflow = "";
    }
    document.getElementById("lbClose").addEventListener("click", close);
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });

    return { open: open, close: close };
  }

  // ===== 主题应用 =====
  function applyTheme(data) {
    var tpl = SiteConfig.templates[data.theme] || SiteConfig.templates["carbon-gold"];
    var root = document.documentElement;
    var vars = tpl.vars;
    for (var k in vars) {
      root.style.setProperty(k, vars[k]);
    }
    var over = data.themeOverrides || {};
    for (var k2 in over) {
      if (over[k2]) root.style.setProperty(k2, over[k2]);
    }
    // 粒子
    var style = (data.particle && data.particle.style) || tpl.particle || "network";
    var density = (data.particle && data.particle.density) || "auto";
    var canvas = document.getElementById("particles");
    if (canvas) {
      Particles.init(canvas, {
        style: style,
        density: density,
        accent: vars["--accent"] || "#c9a96a",
        glow: vars["--glow"] || "rgba(201,169,106,0.55)"
      });
    }
  }

  // ===== 导航 =====
  function buildNav(data, route) {
    var nav = document.getElementById("nav");
    var logo = document.getElementById("logoName");
    if (logo) { logo.textContent = (data.meta && data.meta.logo) || ""; }
    nav.innerHTML = (data.nav || []).map(function (n) {
      return '<a href="#/' + n.id + '" data-route="' + n.id + '" class="' + (n.id === route ? "active" : "") + '">' + esc(n.label) + "</a>";
    }).join("");
  }

  // ===== 渲染主流程 =====
  function render(data) {
    var route = currentRoute();
    var fn = pageRenderers[route] || pageRenderers.home;
    var view = document.getElementById("view");
    try {
      view.innerHTML = fn(data);
    } catch (e) {
      view.innerHTML = '<div class="page-section"><p>渲染失败：' + esc(e.message) + "</p></div>";
      console.error(e);
    }
    buildNav(data, route);
    afterRender(data);
  }

  function afterRender(data) {
    var route = currentRoute();
    setupReveal();

    if (route === "home") {
      var bgVideo = document.getElementById("heroVideo");
      var bgPoster = document.getElementById("heroPoster");
      if (bgVideo) {
        bgVideo.addEventListener("error", function () {
          bgVideo.style.display = "none";
          if (bgPoster) bgPoster.style.display = "block";
        });
      }
    }

    if (route === "portfolio") {
      setupPortfolioInteractions(data);
    }
  }

  function setupReveal() {
    var els = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
        });
      }, { threshold: 0.12 });
      els.forEach(function (el) { io.observe(el); });
    } else {
      els.forEach(function (el) { el.classList.add("in"); });
    }
  }

  function setupPortfolioInteractions(data) {
    var items = (data.portfolio && data.portfolio.items) || [];
    var byId = {};
    items.forEach(function (it) { byId[it.id] = it; });

    var lightbox = Renderer.lightbox;

    var cards = document.querySelectorAll("#workGrid .work");
    cards.forEach(function (card) {
      var v = card.querySelector("video");
      if (v) {
        card.addEventListener("mouseenter", function () { v.play().catch(function () {}); });
        card.addEventListener("mouseleave", function () { v.pause(); v.currentTime = 0; });
      }
      card.addEventListener("click", function () {
        var it = byId[card.getAttribute("data-id")];
        if (it && lightbox) lightbox.open(it);
      });
    });

    // 分类筛选
    var btns = document.querySelectorAll(".filter-btn");
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        btns.forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        var f = b.getAttribute("data-f");
        cards.forEach(function (card) {
          var it = byId[card.getAttribute("data-id")];
          var show = (f === "全部") || (it && it.category === f);
          card.style.display = show ? "" : "none";
        });
      });
    });
    // 初始化「全部」高亮
    if (btns.length) btns[0].classList.add("active");
  }

  // ===== 全局交互绑定 =====
  var currentData = null;
  var globalBound = false;
  function bindGlobal(data) {
    if (globalBound) return;
    globalBound = true;
    var header = document.getElementById("header");
    window.addEventListener("scroll", function () {
      header.classList.toggle("scrolled", window.scrollY > 40);
      document.getElementById("toTop").classList.toggle("show", window.scrollY > 300);
    }, { passive: true });

    document.getElementById("toTop").addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    var navToggle = document.getElementById("navToggle");
    var nav = document.getElementById("nav");
    navToggle.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") nav.classList.remove("open");
    });

    window.addEventListener("hashchange", function () {
      render(currentData);
      window.scrollTo(0, 0);
    });

    // 图片加载失败统一点位：捕获阶段监听，裂图替换为占位
    document.addEventListener("error", function (e) {
      var t = e.target;
      if (t && t.tagName === "IMG" && !t.getAttribute("data-fb")) {
        t.setAttribute("data-fb", "1");
        t.src = FALLBACK_IMG;
      }
    }, true);
  }

  var Renderer = {
    lightbox: null,
    init: function (data) {
      try {
        currentData = data;
        applyTheme(data);
        bindGlobal(data);
        if (!this.lightbox) this.lightbox = setupLightbox(data);
        render(data);
      } catch (e) {
        console.error("初始化失败：", e);
        var view = document.getElementById("view");
        if (view) view.innerHTML = '<div class="page-section"><p>站点初始化失败，请检查控制台。</p></div>';
      }
    }
  };

  global.Renderer = Renderer;
})(window);