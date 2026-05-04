/**
 * 绿了个植 - 核心类型定义
 * 
 * 所有游戏相关的数据结构定义
 */

/** 植物类型枚举 */
export enum PlantType {
  NONE = 0,
  ROSE = 1,        // 玫瑰
  TULIP = 2,       // 郁金香
  SUNFLOWER = 3,   // 向日葵
  CACTUS = 4,      // 仙人掌
  FERN = 5,        // 蕨类
  BANYAN = 6,      // 芭蕉
  PUMPKIN = 7,     // 南瓜
  PLUM = 8,        // 梅花
  NARCISSUS = 9,   // 水仙
  PINE = 10        // 松树
}

/** 植物状态 */
export enum PlantState {
  HIDDEN = 0,      // 隐藏（被遮挡）
  VISIBLE = 1,     // 可见
  PICKED = 2,      // 已拾取
  ELIMINATED = 3   // 已消除
}

/** 植物位置信息 */
export interface IPlantPosition {
  layer: number;   // 层级
  row: number;     // 行号
  col: number;     // 列号
}

/** 植物配置 */
export interface IPlantConfig {
  type: PlantType;
  position: IPlantPosition;
  state: PlantState;
  visible: boolean;
}

/** 关卡配置 */
export interface ILevelConfig {
  id: number;
  name: string;
  theme: string;
  difficulty: number;
  layers: number;
  gridSize: { rows: number; cols: number };
  plantTypes: PlantType[];
  targetScore: number;
  movesLimit: number;
  powerUps: string[];
}

/** 匹配结果 */
export interface IMatchResult {
  plants: IPlantConfig[];
  count: number;
  isEliminated: boolean;
}

/** 滑动操作 */
export interface ISwipeAction {
  startPlant: IPlantConfig;
  endPlant: IPlantConfig;
  isValid: boolean;
}

/** 道具类型 */
export enum PowerUpType {
  MAGNIFIER = 'magnifier',      // 放大镜
  WEEDKILLER = 'weedkiller',    // 除草剂
  SHUFFLE = 'shuffle',          // 洗牌
  REVIVE = 'revive'             // 复活
}

/** 道具配置 */
export interface IPowerUpConfig {
  type: PowerUpType;
  name: string;
  description: string;
  count: number;
}
