/* ============================================================
 * data.js —— 站点数据模型、默认内容、5 套外观模板
 * 纯前端：所有内容由本文件的默认数据驱动，工坊可修改并持久化。
 * ============================================================ */
(function (global) {
  "use strict";

  // 图片占位生成器（统一走官方文生图接口，SDXL 风格）
  var IMG =
    "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=" +
    "dark%20cinematic%20abstract%20gold%20particles%20premium";

  // ---- 默认站点内容 ----
  var defaultData = {
    meta: {
      siteTitle: "林晓 · 视觉设计师",
      name: "林晓",
      logo: "林晓",
      role: "视觉设计师 / 动态影像"
    },
    theme: "carbon-gold",          // 当前模板 id
    themeOverrides: {              // 局部微调（叠加在模板变量之上）
      "--accent": "#c9a96a"
    },
    particle: { style: "network", density: "auto" },
    settings: { imgQuality: 0.82, imgMaxLen: 1920 },   // 图片上传自动压缩参数

    nav: [
      { id: "home", label: "首页" },
      { id: "portfolio", label: "作品集" },
      { id: "projects", label: "项目" },
      { id: "about", label: "关于我" },
      { id: "skills", label: "技能栈" },
      { id: "contact", label: "联系我" }
    ],

    hero: {
      tagline: "视觉设计师 & 动态影像",
      title: "以光影与色彩",
      titleAccent: "雕刻品牌",
      subtitle:
        "你好，我是林晓。我将品牌视觉、界面设计与动态影像融合，结合 AI 工具，为每一个品牌打造有质感、有温度的作品。",
      bgType: "video", // video | image
      bgSrc: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      bgPoster:
        "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=dark%20cinematic%20abstract%20motion%20blur%20gold%20particles%20premium&image_size=landscape_16_9",
      cta: [
        { label: "查看作品", href: "#/portfolio" },
        { label: "联系我", href: "#/contact" }
      ]
    },

    portfolio: {
      layout: "grid",
      filters: ["全部", "影视", "AI", "产品"],
      items: [
        {
          id: "p1", category: "影视", title: "品牌动态影像", tag: "动态 / MG",
          desc: "为品牌发布会制作的动态标识与开场短片。",
          mediaType: "video",
          src: "https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
          poster:
            "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cinematic%20animated%20film%20still%20dramatic%20gold%20dark&image_size=landscape_16_9",
          link: { label: "观看", href: "#" },
          style: { opacity: 1, radius: 8 }
        },
        {
          id: "p2", category: "产品", title: "品牌识别系统", tag: "品牌视觉",
          desc: "某生活方式品牌的完整 VI 视觉识别。",
          mediaType: "image",
          src:
            "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=minimalist%20brand%20identity%20design%20logo%20stationery%20mockup%20beige%20black&image_size=square",
          poster: "",
          link: { label: "详情", href: "#" },
          style: { opacity: 1, radius: 8 }
        },
        {
          id: "p3", category: "AI", title: "AI 生成概念图", tag: "AI 视觉",
          desc: "Stable Diffusion 提示词工程系列概念图。",
          mediaType: "image",
          src:
            "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=futuristic%20ai%20neural%20network%20abstract%20gold%20dark%20concept%20art&image_size=square",
          poster: "",
          link: { label: "详情", href: "#" },
          style: { opacity: 1, radius: 8 }
        },
        {
          id: "p4", category: "影视", title: "系列海报", tag: "海报",
          desc: "瑞士风格排版为核心的音乐节系列海报。",
          mediaType: "image",
          src:
            "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=swiss%20style%20poster%20series%20bold%20typography%20red%20black%20white&image_size=landscape_16_9",
          poster: "",
          link: { label: "详情", href: "#" },
          style: { opacity: 1, radius: 8 }
        },
        {
          id: "p5", category: "影视", title: "短片作品", tag: "影像",
          desc: "一支配色克制、情绪浓郁的短片片段。",
          mediaType: "video",
          src: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          poster:
            "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=moody%20cinematic%20film%20frame%20warm%20light%20abstract&image_size=square",
          link: { label: "观看", href: "#" },
          style: { opacity: 1, radius: 8 }
        },
        {
          id: "p6", category: "产品", title: "网页设计", tag: "网页",
          desc: "品牌官网首页的设计与视觉规范。",
          mediaType: "image",
          src:
            "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20website%20landing%20page%20design%20mockup%20dark%20clean&image_size=square",
          poster: "",
          link: { label: "详情", href: "#" },
          style: { opacity: 1, radius: 8 }
        }
      ]
    },

    projects: {
      layout: "grid",
      items: [
        {
          id: "pr1", title: "「光影」品牌升级", intro: "为某高端家居品牌完成的品牌视觉升级与官网搭建。",
          tags: ["品牌视觉", "网页"], time: "2025", link: { label: "查看", href: "#" }
        },
        {
          id: "pr2", title: "AI 影像实验室", intro: "探索 AIGC 在动态影像与概念设计中的工作流。",
          tags: ["AI", "影像"], time: "2025", link: { label: "查看", href: "#" }
        },
        {
          id: "pr3", title: "移动端产品设计", intro: "极简生活方式 App 的界面、交互与设计系统。",
          tags: ["UI", "产品"], time: "2024", link: { label: "查看", href: "#" }
        },
        {
          id: "pr4", title: "音乐节视觉系统", intro: "音乐节整体视觉与系列海报的主创设计。",
          tags: ["海报", "品牌"], time: "2024", link: { label: "查看", href: "#" }
        }
      ]
    },

    about: {
      avatar:
        "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=minimal%20portrait%20photography%20professional%20dark%20gold%20tone&image_size=square",
      lead: "我相信，真正高级的设计不是堆砌，而是克制与精准——用最少的语言，传递最强的情绪。",
      bio:
        "过去 6 年，我与品牌、科技与消费领域的客户合作，完成从品牌识别、包装、网页到动态短片的全链路视觉输出。我的作品横跨静态与动态两个维度，并积极引入 AI 工具提升创作效率与想象力。",
      focus: [
        { k: "品牌视觉", v: "Logo、VI 系统、视觉规范" },
        { k: "界面设计", v: "网页、App、交互原型" },
        { k: "动态影像", v: "动态标识、广告短片、MG 动画" },
        { k: "AI 创作", v: "AIGC 概念、提示词工程" }
      ],
      goal: "让每个品牌在屏幕上「活」起来。"
    },

    skills: {
      groups: [
        {
          name: "设计", items: [
            { label: "Photoshop" }, { label: "Illustrator" },
            { label: "Figma" }, { label: "Sketch" }
          ]
        },
        {
          name: "动画", items: [
            { label: "After Effects" }, { label: "Cinema 4D" }, { label: "Blender" }
          ]
        },
        {
          name: "AI 工具", items: [
            { label: "Stable Diffusion" }, { label: "Midjourney" }, { label: "ChatGPT" }
          ]
        },
        {
          name: "前端", items: [
            { label: "HTML" }, { label: "CSS" }, { label: "JavaScript" }
          ]
        }
      ]
    },

    contact: {
      email: "hello@example.com",
      socials: [
        { label: "Behance", icon: "Be", href: "#" },
        { label: "站酷", icon: "Z", href: "#" },
        { label: "Bilibili", icon: "Bi", href: "#" },
        { label: "小红书", icon: "RED", href: "#" },
        { label: "微信", icon: "We", href: "#" }
      ]
    }
  };

  // ---- 5 套外观模板：CSS 变量 + 默认粒子风格 ----
  var templates = {
    "carbon-gold": {
      name: "碳黑金",
      particle: "network",
      vars: {
        "--bg": "#0c0c0e", "--bg-2": "#131316", "--card": "#19191d",
        "--line": "rgba(255,255,255,0.09)", "--text": "#ece9e2",
        "--muted": "#9b978e", "--accent": "#c9a96a", "--accent-2": "#a8844a",
        "--glow": "rgba(201,169,106,0.55)"
      }
    },
    "deep-blue": {
      name: "深蓝科技",
      particle: "stars",
      vars: {
        "--bg": "#050a14", "--bg-2": "#0a1428", "--card": "#0d1b33",
        "--line": "rgba(120,170,255,0.14)", "--text": "#e6efff",
        "--muted": "#7f9cc7", "--accent": "#4da3ff", "--accent-2": "#2f7fe0",
        "--glow": "rgba(77,163,255,0.6)"
      }
    },
    "matrix": {
      name: "黑绿矩阵",
      particle: "matrix",
      vars: {
        "--bg": "#030604", "--bg-2": "#07130a", "--card": "#0a1a0e",
        "--line": "rgba(80,230,140,0.16)", "--text": "#d8ffe6",
        "--muted": "#6f9f7f", "--accent": "#3ee06f", "--accent-2": "#1faf4e",
        "--glow": "rgba(62,224,111,0.55)"
      }
    },
    "starlight": {
      name: "星空黑金",
      particle: "starfield",
      vars: {
        "--bg": "#08060f", "--bg-2": "#100c1d", "--card": "#16102b",
        "--line": "rgba(190,160,255,0.14)", "--text": "#efe9ff",
        "--muted": "#9387b8", "--accent": "#d4b36a", "--accent-2": "#b58ce0",
        "--glow": "rgba(212,179,106,0.55)"
      }
    },
    "minimal-light": {
      name: "浅色商务灰",
      particle: "stars",
      vars: {
        "--bg": "#f4f5f7", "--bg-2": "#ffffff", "--card": "#ffffff",
        "--line": "rgba(0,0,0,0.08)", "--text": "#1a1c20",
        "--muted": "#6b7280", "--accent": "#3b82f6", "--accent-2": "#1d4ed8",
        "--glow": "rgba(59,130,246,0.35)"
      }
    }
  };

  function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

  function getDefaultData() { return deepClone(defaultData); }

  global.SiteConfig = {
    IMG: IMG,
    getDefaultData: getDefaultData,
    templates: templates,
    templateIds: Object.keys(templates)
  };
})(window);