/**
 * 游戏全局配置
 * 
 * 规范：常量用大写+下划线，不可变配置用 Object.freeze
 */

// ========== 枚举 ==========

const PlantType = Object.freeze({
  NONE: 0,
  // 多肉花园
  XIANRENZHANG: 1,  // 仙人掌
  LUHUI: 2,          // 芦荟
  JINGTIAN: 3,       // 景天
  SHENGSHIHUA: 4,    // 生石花
  XIONGTONGZI: 5,    // 熊童子
  YULU: 6,           // 玉露
  // 热带雨林
  GUIBEIZHU: 7,      // 龟背竹
  LVLUO: 8,          // 绿萝
  JUELEI: 9,         // 蕨类
  QINYERONG: 10,     // 琴叶榕
  SANWEIKUI: 11,     // 散尾葵
  // 阳台花卉
  YUEJI: 12,         // 月季
  MOLIHUA: 13,       // 茉莉花
  TIANZHUKUI: 14,    // 天竺葵
  AIQIANNIU: 15,     // 矮牵牛
  ZHIZIHUA: 16,      // 栀子花
  // 中草药圃
  JINYINHUA: 17,     // 金银花
  GOUQI: 18,         // 枸杞
  HUANGQI: 19,       // 黄芪
  DANGGUI: 20,       // 当归
  JUHUA: 21,         // 菊花
  // 沙漠植物
  LONGSHELAN: 22,    // 龙舌兰
  HUYANG: 23,        // 胡杨
  SHAJI: 24,         // 沙棘
  // 水生植物
  HEHUA: 25,         // 荷花
  SHUILIAN: 26,      // 睡莲
  LUWEI: 27,         // 芦苇
  XIANGPU: 28,       // 香蒲
  SHUIHULU: 29,      // 水葫芦
});

const ThemeId = Object.freeze({
  SUROU_HUA_YUAN: 1,      // 多肉花园（周一）
  RE_DAI_YU_LIN: 2,     // 热带雨林（周二）
  YANG_TAI_HUA_HUI: 3,  // 阳台花卉（周三）
  ZHONG_CAO_YAO: 4,    // 中草药圃（周四）
  SHA_MO_ZHI_WU: 5,        // 沙漠植物（周五）
  SHUI_SHENG_ZHI_WU: 6,       // 水生植物（周六）
  MANG_HE: 7,         // 盲盒主题（周日）
});

const GameStage = Object.freeze({
  LEVEL1: 1,         // 第一关（入门）
  LEVEL2: 2,         // 第二关（地狱）
});

const Rarity = Object.freeze({
  COMMON: 1,         // 普通（60%）
  RARE: 2,           // 稀有（30%）
  LEGENDARY: 3,      // 传说（10%）
});

const ItemId = Object.freeze({
  MAGNIFY: 1,    // 放大镜
  HERBICIDE: 2,  // 除草剂
  SHUFFLE: 3,    // 洗牌
  REVIVE: 4,     // 复活
});

// ========== 主题配置 ==========

const THEME_CONFIGS = Object.freeze([
  {
    id: ThemeId.SUROU_HUA_YUAN,
    name: '多肉花园',
    dayOfWeek: 1,
    plantTypes: [
      PlantType.XIANRENZHANG, PlantType.LUHUI, PlantType.JINGTIAN,
      PlantType.SHENGSHIHUA, PlantType.XIONGTONGZI, PlantType.YULU,
    ],
    background: 'themes/surou-bg',
  },
  {
    id: ThemeId.RE_DAI_YU_LIN,
    name: '热带雨林',
    dayOfWeek: 2,
    plantTypes: [
      PlantType.GUIBEIZHU, PlantType.LVLUO, PlantType.JUELEI,
      PlantType.QINYERONG, PlantType.SANWEIKUI,
    ],
    background: 'themes/reiai-bg',
  },
  {
    id: ThemeId.YANG_TAI_HUA_HUI,
    name: '阳台花卉',
    dayOfWeek: 3,
    plantTypes: [
      PlantType.YUEJI, PlantType.MOLIHUA, PlantType.TIANZHUKUI,
      PlantType.AIQIANNIU, PlantType.ZHIZIHUA,
    ],
    background: 'themes/yantai-bg',
  },
  {
    id: ThemeId.ZHONG_CAO_YAO,
    name: '中草药圃',
    dayOfWeek: 4,
    plantTypes: [
      PlantType.JINYINHUA, PlantType.GOUQI, PlantType.HUANGQI,
      PlantType.DANGGUI, PlantType.JUHUA,
    ],
    background: 'themes/zhongcao-bg',
  },
  {
    id: ThemeId.SHA_MO_ZHI_WU,
    name: '沙漠植物',
    dayOfWeek: 5,
    plantTypes: [
      PlantType.LONGSHELAN, PlantType.XIANRENZHANG, PlantType.LUHUI,
      PlantType.HUYANG, PlantType.SHAJI,
    ],
    background: 'themes/shamo-bg',
  },
  {
    id: ThemeId.SHUI_SHENG_ZHI_WU,
    name: '水生植物',
    dayOfWeek: 6,
    plantTypes: [
      PlantType.HEHUA, PlantType.SHUILIAN, PlantType.LUWEI,
      PlantType.XIANGPU, PlantType.SHUIHULU,
    ],
    background: 'themes/shuisheng-bg',
  },
  {
    id: ThemeId.MANG_HE,
    name: '盲盒主题',
    dayOfWeek: 7,
    plantTypes: [
      // 盲盒：从所有主题中选取
      PlantType.XIANRENZHANG, PlantType.GUIBEIZHU, PlantType.YUEJI,
      PlantType.JINYINHUA, PlantType.LONGSHELAN, PlantType.HEHUA,
      PlantType.LVLUO, PlantType.MOLIHUA, PlantType.GOUQI,
    ],
    background: 'themes/manghe-bg',
  },
]);

// ========== 关卡参数 ==========

const LEVEL1_CONFIG = Object.freeze({
  stage: GameStage.LEVEL1,
  plantCount: 3,
  totalElements: 12,
  layers: [12],             // 单层
  gridCols: 4,
  gridRows: 3,
  maxMoves: 0,              // 0=不限
  timeLimit: 0,             // 0=不限时（秒）
  passRate: 1.0,
});

const LEVEL2_CONFIG = Object.freeze({
  stage: GameStage.LEVEL2,
  plantCount: 3,
  totalElements: 24,
  layers: [4, 8, 12],       // 3层
  gridCols: 6,
  gridRows: 4,
  maxMoves: 0,              // 0=不限
  timeLimit: 180,           // 3分钟限时
  passRate: 0.04,
});

// ========== 道具配置 ==========

const ITEM_CONFIGS = Object.freeze([
  { id: ItemId.MAGNIFY, name: '放大镜', icon: '🔍', desc: '高亮3对可匹配植物', maxPerLevel: 1 },
  { id: ItemId.HERBICIDE, name: '除草剂', icon: '🧪', desc: '清除3个随机障碍', maxPerLevel: 1 },
  { id: ItemId.SHUFFLE, name: '洗牌', icon: '🔄', desc: '重新打乱排列', maxPerLevel: 1 },
  { id: ItemId.REVIVE, name: '复活', icon: '💚', desc: '失败后继续', maxPerLevel: 1 },
]);

// ========== 动画 ==========

const ANIM_DURATION = Object.freeze({
  MOVE: 150,       // 移动动画（ms）
  ELIMINATE: 300,   // 消除动画
  FALL: 200,        // 下落动画
  CARD_FLIP: 500,   // 卡片翻转
  SHAKE: 400,       // 摇花盆
  WATER: 800,       // 浇水
});

// ========== 格子尺寸 ==========

const CELL_SIZE = 70;        // 格子宽高（px）
const CELL_GAP = 4;          // 格子间距（px）
const LAYER_OFFSET = 18;     // 层偏移（px）
const LAYER_SCALE = 0.92;    // 上层缩放

module.exports = {
  PlantType,
  ThemeId,
  GameStage,
  Rarity,
  ItemId,
  THEME_CONFIGS,
  LEVEL1_CONFIG,
  LEVEL2_CONFIG,
  ITEM_CONFIGS,
  ANIM_DURATION,
  CELL_SIZE,
  CELL_GAP,
  LAYER_OFFSET,
  LAYER_SCALE,
};
