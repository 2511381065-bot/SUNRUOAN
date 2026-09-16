# 个人作品集展示网站

纯前端、零依赖的个人作品集站点，内置**可视化修改工坊**，支持实时预览、保存、一键打包部署。

## 快速开始

```bash
npm run dev      # 启动开发服务器 http://127.0.0.1:8123
npm run build    # 打包生成自包含的 dist/ 目录
```

- 前台（预览）：http://127.0.0.1:8123/index.html
- 工坊（可视化编辑）：http://127.0.0.1:8123/studio.html

## 目录结构

```
ABC/
├─ index.html             # 前台入口
├─ studio.html            # 可视化工坊入口
├─ js/
│  ├─ data.js             # 数据模型 + 默认内容 + 5 套外观模板
│  ├─ store.js            # 数据读取/保存（localStorage + 服务器 API）
│  ├─ particles.js        # Canvas 粒子背景引擎
│  ├─ renderer.js         # 前台渲染引擎
│  ├─ main.js             # 前台入口
│  └─ studio.js           # 工坊逻辑（含图片裁剪等）
├─ css/                   # style.css（前台）+ studio.css（工坊）
├─ data/site-data.json    # 站点内容数据（工坊保存后写回，跨浏览器共享）
├─ server.js              # 开发服务器 + /api/data /api/save /api/build
├─ scripts/build.js       # 打包脚本
├─ docs/                  # 需求文档、技术文档
└─ _archive/              # 归档的无关文件（贪吃蛇、旧计划等）
```

## 数据与部署

- 站点内容集中在 `data/site-data.json`，工坊保存后写回该文件，实现跨浏览器共享同一份内容。
- `npm run build` 生成自包含的 `dist/`（`index.html` 内联数据 + `css/` + `js/`），可直接部署到任意静态服务器。

## 文档

- 需求：`docs/需求文档.md`
- 技术方案：`docs/技术文档.md`
- 本机环境基线：`AGENTS.md`