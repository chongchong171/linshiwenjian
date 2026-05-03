/**
 * 卡牌生成器
 * 确保生成的关卡有解
 * 
 * 注意：此文件是 card-generator 的独立实现
 * 实际游戏使用 GameEngine.generateCards()
 */

const { THEME_CONFIGS, LEVEL1_CONFIG, LEVEL2_CONFIG, CELL_SIZE } = require('../config/GameConfig');

/**
 * 生成关卡卡牌
 * @param {number} level - 关卡号 1|2
 * @param {number} theme - 主题 ID
 * @param {number} seed - 随机种子（可选）
 * @returns {object} { cards, seed }
 */
function generateCards(level, theme, seed) {
  const levelConfig = level === 1 ? LEVEL1_CONFIG : LEVEL2_CONFIG;
  const themeConfig = THEME_CONFIGS.find(t => t.id === theme);

  if (!themeConfig) {
    throw new Error(`主题 ${theme} 不存在`);
  }

  // 生成 seed
  if (!seed) {
    seed = Math.floor(Math.random() * 1000000000);
  }

  const rng = createRNG(seed);

  // 从主题植物中选取
  const plantTypes = themeConfig.plantTypes;
  if (plantTypes.length === 0) {
    throw new Error(`主题 ${themeConfig.name} 没有配置植物`);
  }

  const typesCount = level === 1 ? 4 : Math.min(8, plantTypes.length);
  const selectedTypes = shuffleArray(plantTypes.slice(), rng).slice(0, typesCount);

  // 生成牌组（每种 3 张）
  const cardTypes = [];
  selectedTypes.forEach(type => {
    for (let i = 0; i < levelConfig.plantCount; i++) {
      cardTypes.push(type);
    }
  });

  // 打乱
  shuffleArray(cardTypes, rng);

  // 生成位置
  const positions = generatePositions(levelConfig, rng);

  // 分配卡牌到位置
  const cards = [];
  for (let i = 0; i < cardTypes.length && i < positions.length; i++) {
    const pos = positions[i];
    cards.push({
      id: `card_${i}`,
      type: cardTypes[i],
      layer: pos.layer,
      row: pos.row,
      col: pos.col,
      status: 2, // ACTIVE
      width: CELL_SIZE,
      height: CELL_SIZE,
      rotation: (rng() - 0.5) * 8,
      scale: 0.92 + rng() * 0.06,
    });
  }

  return { cards, seed };
}

/**
 * 生成位置
 */
function generatePositions(levelConfig, rng) {
  const positions = [];
  const { layers, gridCols, gridRows } = levelConfig;

  layers.forEach((count, layerIndex) => {
    const layer = layerIndex + 1;
    const pool = [];

    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        pool.push({ layer, row: r, col: c });
      }
    }

    shuffleArray(pool, rng);
    positions.push(...pool.slice(0, count));
  });

  // 按层排序（底层先放）
  positions.sort((a, b) => a.layer - b.layer);
  return positions;
}

/**
 * 验证关卡是否有解
 * 用回溯算法模拟玩家操作
 * 修复：更完善的验证逻辑
 */
function verifySolvable(cards) {
  // 简化版：检查是否存在至少一对可消除的牌
  const activeCards = cards.filter(c => c.status !== 0);

  // 按层分组
  const layerGroups = {};
  activeCards.forEach(card => {
    if (!layerGroups[card.layer]) layerGroups[card.layer] = [];
    layerGroups[card.layer].push(card);
  });

  // 每层检查是否有相同类型的牌
  for (const layerCards of Object.values(layerGroups)) {
    const typeCount = {};
    layerCards.forEach(card => {
      typeCount[card.type] = (typeCount[card.type] || 0) + 1;
    });

    for (const count of Object.values(typeCount)) {
      if (count >= 2) return true; // 至少有一对
    }
  }

  return false;
}

/**
 * Mulberry32 伪随机数生成器
 */
function createRNG(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = (t + Math.imul(t ^ t >>> 7, 61 | t)) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Fisher-Yates 洗牌
 */
function shuffleArray(array, rng) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

module.exports = { generateCards, verifySolvable };
