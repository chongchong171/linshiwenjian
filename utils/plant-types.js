/**
 * 绿了个植 - 核心类型定义
 * 
 * 微信小程序版本 - 使用 JavaScript
 */

/** 植物类型枚举 */
const PlantType = {
  NONE: 0,
  ROSE: 1,        // 玫瑰
  TULIP: 2,       // 郁金香
  SUNFLOWER: 3,   // 向日葵
  CACTUS: 4,      // 仙人掌
  FERN: 5,        // 蕨类
  BANYAN: 6,      // 芭蕉
  PUMPKIN: 7,     // 南瓜
  PLUM: 8,        // 梅花
  NARCISSUS: 9,   // 水仙
  PINE: 10        // 松树
};

/** 植物状态 */
const PlantState = {
  HIDDEN: 0,      // 隐藏（被遮挡）
  VISIBLE: 1,     // 可见
  PICKED: 2,      // 已拾取
  ELIMINATED: 3   // 已消除
};

/** 道具类型 */
const PowerUpType = {
  MAGNIFIER: 'magnifier',      // 放大镜
  WEEDKILLER: 'weedkiller',    // 除草剂
  SHUFFLE: 'shuffle',          // 洗牌
  REVIVE: 'revive'             // 复活
};

/** 关卡配置 */
const LevelConfigs = {
  1: {
    id: 1,
    name: '春日花园',
    theme: 'spring',
    difficulty: 2,
    layers: 2,
    gridSize: { rows: 5, cols: 5 },
    plantTypes: [PlantType.ROSE, PlantType.TULIP, PlantType.SUNFLOWER],
    targetScore: 100,
    movesLimit: 20
  },
  2: {
    id: 2,
    name: '热带雨林',
    theme: 'rainforest',
    difficulty: 3,
    layers: 3,
    gridSize: { rows: 6, cols: 6 },
    plantTypes: [PlantType.FERN, PlantType.BANYAN, PlantType.CACTUS],
    targetScore: 150,
    movesLimit: 25
  },
  3: {
    id: 3,
    name: '秋日丰收',
    theme: 'autumn',
    difficulty: 4,
    layers: 3,
    gridSize: { rows: 7, cols: 7 },
    plantTypes: [PlantType.PUMPKIN, PlantType.SUNFLOWER, PlantType.CACTUS],
    targetScore: 200,
    movesLimit: 30
  },
  4: {
    id: 4,
    name: '冬日温室',
    theme: 'winter',
    difficulty: 5,
    layers: 4,
    gridSize: { rows: 8, cols: 8 },
    plantTypes: [PlantType.PLUM, PlantType.NARCISSUS, PlantType.PINE],
    targetScore: 250,
    movesLimit: 35
  }
};

module.exports = {
  PlantType,
  PlantState,
  PowerUpType,
  LevelConfigs
};
