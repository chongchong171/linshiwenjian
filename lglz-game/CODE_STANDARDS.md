# 绿了个植 - 代码规范

## 一、项目结构

```
lglz-game/
├── assets/                    # 资源目录
│   ├── resources/            # 动态加载资源
│   └── scripts/              # TypeScript 脚本
│       ├── core/             # 核心逻辑
│       ├── ui/               # UI 组件
│       └── utils/            # 工具函数
├── cloud/                    # 云函数
├── components/               # 可复用组件
│   ├── card/                 # 卡牌组件
│   └── game/                 # 游戏组件
├── profile/                  # 项目配置
└── settings/                 # 设置文件
```

## 二、命名规范

### 1. 文件命名
- 组件文件：`PascalCase.ts`（如 `PlantCard.ts`）
- 工具文件：`camelCase.ts`（如 `matchFinder.ts`）
- 配置文件：`camelCase.ts`（如 `gameConfig.ts`）

### 2. 类命名
- 组件类：`PascalCase`（如 `PlantStackManager`）
- 工具类：`PascalCase`（如 `PlantMatchFinder`）
- 接口：`I` 前缀（如 `IPlantConfig`）

### 3. 变量/函数命名
- 变量：`camelCase`（如 `plantType`）
- 函数：`camelCase`（如 `findMatches()`）
- 常量：`UPPER_SNAKE_CASE`（如 `MAX_PLANT_TYPES`）

## 三、代码组织

### 1. 职责分离
| 模块 | 职责 |
|------|------|
| `PlantStackManager` | 多层堆叠布局管理 |
| `PlantMatchFinder` | 匹配查找算法 |
| `PlantSwipeHandler` | 滑动操作处理 |
| `PlantFallManager` | 植物下落管理 |
| `PowerUpManager` | 道具系统管理 |
| `LevelManager` | 关卡系统管理 |
| `RankManager` | 排行榜系统管理 |

### 2. 模块内聚
- 按业务领域划分模块
- 模块内自包含（组件 + 逻辑 + API + 类型）
- 通过 `index.ts` 统一管理公开导出

## 四、类型约束

- 所有 Props/参数/返回值必须有类型约束
- 禁止使用 `any` 类型
- 使用 `interface` 定义数据结构

## 五、错误处理

- 全局错误捕获
- 数据请求失败需有用户可见的提示和重试机制
- 不要吞掉错误（空 catch 块 = 定时炸弹）

## 六、性能优化

- 减少 setData 频率（合并多次 setData 为一次）
- 懒加载重型组件
- 避免在循环中使用条件渲染

## 七、注释规范

- 关键算法必须有详细注释
- 复杂逻辑需要说明原理
- 函数开头说明用途、参数、返回值

---

*文档创建时间：2026-05-04*
*基于小蚂蚁教程和微信小游戏开发规范整理*
