/* ============================================================
 * particles.js —— Canvas 背景粒子引擎（纯前端，无依赖）
 * 支持四类风格：network 连线 / stars 星点 / matrix 代码雨 / starfield 星空
 * 硬约束：不使用 ctx.roundRect 等新 API；变量全部初始化；异常兜底不白屏。
 * ============================================================ */
(function (global) {
  "use strict";

  var Particles = {
    _raf: null,
    _canvas: null,
    _ctx: null,
    _style: "network",
    _mouse: { x: -9999, y: -9999 },
    _nodes: [],
    _cols: [],
    _running: false,

    init: function (canvas, opts) {
      opts = opts || {};
      var style = opts.style || "network";
      var density = opts.density || "auto";
      var accent = opts.accent || "#c9a96a";
      var glow = opts.glow || "rgba(201,169,106,0.55)";

      try {
        this.destroy();
        this._canvas = canvas;
        this._ctx = canvas.getContext("2d");
        this._style = style;
        this._accent = accent;
        this._glow = glow;
        this._mouse = { x: -9999, y: -9999 };
        this._nodes = [];
        this._cols = [];
        this._running = false;

        this._resize();
        this._build(density);
        this._bind();
        this._start();
      } catch (e) {
        // 粒子引擎失败不影响站点主体渲染
        console.warn("粒子引擎初始化失败，已降级隐藏：", e);
        if (canvas) { canvas.style.display = "none"; }
      }
    },

    _build: function (density) {
      var w = this._canvas.width;
      var h = this._canvas.height;
      var area = w * h;
      var count = 0;

      if (this._style === "matrix") {
        // 代码雨：按列
        var fs = 16;
        var cols = Math.max(1, Math.floor(w / fs));
        if (density === "auto") {
          cols = Math.min(cols, Math.max(20, Math.floor(window.innerWidth / 22)));
        }
        this._cols = [];
        for (var i = 0; i < cols; i++) {
          this._cols.push({
            x: i * fs,
            y: Math.random() * h,
            speed: (Math.random() * 2 + 1.2) * (fs / 16),
            charIndex: Math.floor(Math.random() * 20)
          });
        }
        return;
      }

      // 星点/连线/星空
      if (density === "auto") {
        // 自适应：按面积与屏宽估算，低端/小屏自动降低
        var per = window.innerWidth < 768 ? 14000 : window.innerWidth < 1024 ? 10000 : 6500;
        count = Math.min(Math.floor(area / per), 180);
      } else if (density === "high") {
        count = 220;
      } else if (density === "low") {
        count = 40;
      } else {
        count = 90;
      }
      count = Math.max(20, count);

      this._nodes = [];
      for (var j = 0; j < count; j++) {
        this._nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: Math.random() * 1.6 + 0.5,
          alpha: Math.random() * 0.6 + 0.2,
          tw: Math.random() * Math.PI * 2
        });
      }
    },

    _resize: function () {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = window.innerWidth;
      var h = window.innerHeight;
      this._canvas.width = w * dpr;
      this._canvas.height = h * dpr;
      this._canvas.style.width = w + "px";
      this._canvas.style.height = h + "px";
      if (this._ctx) { this._ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
      this._w = w;
      this._h = h;
      this._dpr = dpr;
    },

    _bind: function () {
      var self = this;
      this._onResize = function () {
        self._resize();
        self._build(self._density || "auto");
      };
      this._onMouse = function (e) {
        self._mouse.x = e.clientX;
        self._mouse.y = e.clientY;
      };
      this._onLeave = function () {
        self._mouse.x = -9999;
        self._mouse.y = -9999;
      };
      this._onVis = function () {
        if (document.hidden) { self._pause(); } else { self._start(); }
      };
      window.addEventListener("resize", this._onResize);
      window.addEventListener("mousemove", this._onMouse);
      window.addEventListener("mouseout", this._onLeave);
      document.addEventListener("visibilitychange", this._onVis);
    },

    _start: function () {
      if (this._running) { return; }
      this._running = true;
      var self = this;
      var loop = function () {
        if (!self._running) { return; }
        self._tick();
        self._raf = requestAnimationFrame(loop);
      };
      this._raf = requestAnimationFrame(loop);
    },

    _pause: function () {
      this._running = false;
      if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    },

    _tick: function () {
      var ctx = this._ctx;
      if (!ctx) { return; }
      var w = this._w;
      var h = this._h;
      ctx.clearRect(0, 0, w, h);

      if (this._style === "matrix") {
        this._drawMatrix(ctx, w, h);
      } else if (this._style === "starfield") {
        this._drawStarfield(ctx, w, h);
      } else if (this._style === "network") {
        this._drawNetwork(ctx, w, h);
      } else {
        this._drawStars(ctx, w, h);
      }
    },

    _drawStars: function (ctx, w, h) {
      var nodes = this._nodes;
      for (var i = 0; i < nodes.length; i++) {
        var p = nodes[i];
        p.x += p.vx; p.y += p.vy; p.tw += 0.02;
        if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10; if (p.y > h + 10) p.y = -10;
        var a = p.alpha * (0.6 + 0.4 * Math.sin(p.tw));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255," + a.toFixed(3) + ")";
        ctx.fill();
      }
    },

    _drawNetwork: function (ctx, w, h) {
      var nodes = this._nodes;
      var linkDist = 110;
      for (var i = 0; i < nodes.length; i++) {
        var p = nodes[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10; if (p.y > h + 10) p.y = -10;
      }
      ctx.lineWidth = 1;
      for (var i2 = 0; i2 < nodes.length; i2++) {
        var a = nodes[i2];
        for (var j = i2 + 1; j < nodes.length; j++) {
          var b = nodes[j];
          var dx = a.x - b.x;
          var dy = a.y - b.y;
          var d = dx * dx + dy * dy;
          if (d < linkDist * linkDist) {
            var t = 1 - Math.sqrt(d) / linkDist;
            ctx.strokeStyle = "rgba(200,200,200," + (t * 0.35).toFixed(3) + ")";
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      // 鼠标作为额外节点
      var m = this._mouse;
      if (m.x > -9990) {
        for (var k = 0; k < nodes.length; k++) {
          var n = nodes[k];
          var dxm = m.x - n.x;
          var dym = m.y - n.y;
          var dm = dxm * dxm + dym * dym;
          if (dm < linkDist * linkDist) {
            var tm = 1 - Math.sqrt(dm) / linkDist;
            ctx.strokeStyle = "rgba(201,169,106," + (tm * 0.5).toFixed(3) + ")";
            ctx.beginPath();
            ctx.moveTo(m.x, m.y);
            ctx.lineTo(n.x, n.y);
            ctx.stroke();
          }
        }
      }
      for (var i3 = 0; i3 < nodes.length; i3++) {
        var q = nodes[i3];
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.r + 0.6, 0, Math.PI * 2);
        ctx.fillStyle = this._accent;
        ctx.fill();
      }
    },

    _drawStarfield: function (ctx, w, h) {
      var nodes = this._nodes;
      var m = this._mouse;
      var react = m.x > -9990;
      for (var i = 0; i < nodes.length; i++) {
        var p = nodes[i];
        if (react) {
          var dx = m.x - p.x;
          var dy = m.y - p.y;
          var d2 = dx * dx + dy * dy;
          if (d2 < 120 * 120 && d2 > 0.01) {
            var d = Math.sqrt(d2);
            var f = (120 - d) / 120 * 0.4;
            p.x -= dx / d * f;
            p.y -= dy / d * f;
          }
        }
        p.x += p.vx; p.y += p.vy; p.tw += 0.03;
        if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10; if (p.y > h + 10) p.y = -10;
        var a = p.alpha * (0.6 + 0.4 * Math.sin(p.tw));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(235,225,255," + a.toFixed(3) + ")";
        ctx.fill();
      }
    },

    _drawMatrix: function (ctx, w, h) {
      var chars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF";
      var fs = 16;
      ctx.font = fs + "px monospace";
      for (var i = 0; i < this._cols.length; i++) {
        var c = this._cols[i];
        c.charIndex = (c.charIndex + 1) % chars.length;
        var ch = chars.charAt(c.charIndex);
        var head = true;
        // 用渐隐的绿色绘制字符链尾
        for (var k = 0; k < 6; k++) {
          var yy = c.y - k * fs;
          if (yy < 0) continue;
          var alpha = head ? 1 : Math.max(0, 0.6 - k * 0.12);
          ctx.fillStyle = alpha > 0.4 ? "#d8ffe6" : "rgba(62,224,111," + alpha.toFixed(3) + ")";
          ctx.fillText(k === 0 ? ch : chars.charAt((c.charIndex - k + chars.length) % chars.length), c.x, yy);
        }
        c.y += c.speed;
        if (c.y > h + fs) { c.y = -fs * (Math.random() * 10); }
      }
    },

    destroy: function () {
      this._pause();
      if (this._onResize) window.removeEventListener("resize", this._onResize);
      if (this._onMouse) window.removeEventListener("mousemove", this._onMouse);
      if (this._onLeave) window.removeEventListener("mouseout", this._onLeave);
      if (this._onVis) document.removeEventListener("visibilitychange", this._onVis);
      this._canvas = null;
      this._ctx = null;
      this._nodes = [];
      this._cols = [];
    }
  };

  global.Particles = Particles;
})(window);