# 绿了个植 - 微信小游戏

## 项目简介

《绿了个植》是一款社交休闲消除小游戏，结合了滑动相邻消除和多层堆叠玩法。

## 技术栈

- **游戏引擎：** Cocos Creator 3.8+
- **编程语言：** TypeScript
- **后端服务：** 微信云开发
- **平台：** 微信小程序/小游戏

## 项目结构

```
lglz-game/
├── assets/                    # 资源目录
│   ├── resources/            # 动态加载资源
│   └── scripts/              # TypeScript 脚本
│       ├── core/             # 核心逻辑
│       │   ├── PlantTypes.ts          # 类型定义
│       │   ├── PlantStackManager.ts   # 堆叠管理器
│       │   ├── PlantMatchFinder.ts    # 匹配查找器
│       │   ├── PlantSwipeHandler.ts   # 滑动处理器
│       │   ├── PlantFallManager.ts    # 下落管理器
│       │   ├── PowerUpManager.ts      # 道具管理器
│       │   ├── LevelManager.ts        # 关卡管理器
│       │   ├── GameManager.ts         # 游戏管理器
│       │   └── index.ts               # 模块导出
│       ├── ui/               # UI 组件
│       │   └── GameScene.ts           # 游戏场景
│       └── utils/            # 工具函数
├── cloud/                    # 云函数
├── components/               # 可复用组件
├── profile/                  # 项目配置
├── settings/                 # 设置文件
├── project.json              # 项目配置
├── CODE_STANDARDS.md         # 代码规范
└── README.md                 # 项目说明
```

## 核心玩法

### 1. 滑动相邻消除
- 玩家在花盆中滑动相邻的相同植物
- 滑动后直线连接，2+ 植物消除
- 消除后上方植物下落填补空位
- 连锁消除机制

### 2. 多层堆叠布局
- 多层植物堆叠在花盆中
- 上层植物遮挡下层植物
- 消除上层后，下层植物可见
- 数据表格抽象管理状态

### 3. 道具系统
- **放大镜：** 提示可消除的植物对
- **除草剂：** 消除指定位置的植物
- **洗牌：** 随机打乱所有植物位置
- **复活：** 游戏失败后继续

### 4. 关卡系统
- 每日主题场景切换
- 难度递增的关卡设计
- 关卡进度保存

## 快速开始

### 环境要求
- Cocos Creator 3.8+
- 微信开发者工具
- Node.js 14+

### 运行步骤

1. **打开项目**
   - 使用 Cocos Creator 打开 `lglz-game` 目录
   - 等待资源加载完成

2. **预览游戏**
   - 点击 Cocos Creator 菜单 → 预览
   - 或使用微信开发者工具预览

3. **构建发布**
   - 点击 Cocos Creator 菜单 → 构建发布
   - 选择微信小游戏平台
   - 使用微信开发者工具上传

## 代码规范

详见 [CODE_STANDARDS.md](./CODE_STANDARDS.md)

## 开发进度

- [x] 核心类型定义
- [x] 多层堆叠布局管理
- [x] 匹配查找算法
- [x] 滑动操作处理
- [x] 植物下落管理
- [x] 道具系统
- [x] 关卡系统
- [x] 游戏管理器
- [ ] UI 组件完善
- [ ] 云开发集成
- [ ] 排行榜系统
- [ ] 虚拟花园系统

## 参考资料

- [小蚂蚁教你做游戏 - 羊了个羊教程](https://developers.weixin.qq.com/community/develop/article/doc/00062006da0c306d56aed159e56813)
- [小蚂蚁教你做游戏 - 三消查找算法](https://developers.weixin.qq.com/community/minigame/article/doc/0000ca542f827860ff4ec82f256813)
- [微信小游戏云开发文档](https://developers.weixin.qq.com/minigame/dev/wxcloud/)

## 许可证

MIT License

## 更新日志

### v1.0.0 (2026-05-04)
- 初始版本
- 实现核心玩法
- 实现道具系统
- 实现关卡系统
