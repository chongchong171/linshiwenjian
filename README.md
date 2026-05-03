# 绿了个植 🌿

社交休闲消除小游戏 — 微信小程序

## 项目结构

```
├── app.js                    # 小程序入口
├── app.json                  # 全局配置
├── app.wxss                  # 全局样式
├── sitemap.json
├── project.config.json
│
├── pages/
│   ├── index/                # 首页（主菜单）
│   ├── game/                 # 游戏主页面
│   ├── garden/               # 我的花园
│   └── rank/                 # 排行榜
│
├── utils/
│   ├── game-engine.js        # 游戏核心引擎
│   └── card-generator.js     # 卡牌生成器
│
└── config/
    └── GameConfig.ts         # 全局配置（枚举、主题、关卡）
```

## 核心玩法

- **滑动相邻消除**：拖动植物到相邻空位，同一直线 2+ 个相同品种自动消除
- **每日主题**：7天7种主题（多肉花园、热带雨林、阳台花卉...）
- **断崖难度**：第一关闭眼过，第二关地狱级（通关率 3-5%）
- **虚拟花园**：通关收集植物卡片，建设自己的花园

## 技术栈

- 原生微信小程序
- JavaScript (ES6+)
- 微信云开发（复用 AI 植物管家）

## 开发

用微信开发者工具打开此目录即可运行。

## 文档

游戏设计方案：[飞书文档](https://feishu.cn/docx/DNtBdhPZloHmTxxVjS5cWEoBn4g)
