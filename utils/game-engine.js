/**
 * 绿了个植 — 游戏核心引擎
 * 
 * 核心玩法：滑动相邻消除
 * - 拖动一个植物到相邻空位
 * - 两个及以上相同品种在同一直线上相连 → 自动消除
 * - 上方植物自动下落填补空位
 * - 全部消除 → 通关
 */

const {
  THEME_CONFIGS,
  LEVEL1_CONFIG,
  LEVEL2_CONFIG,
  CELL_SIZE,
  CELL_GAP,
  LAYER_OFFSET,
  LAYER_SCALE,
} = require('../config/GameConfig');

// ========== 卡牌状态 ==========

const CardStatus = Object.freeze({
  HIDDEN: 0,      // 已消除
  COVERED: 1,     // 被覆盖（不可交互）
  ACTIVE: 2,      // 可交互
  DRAGGING: 3,    // 拖动中
  ANIMATING: 4,   // 动画中
});

// ========== 游戏引擎 ==========

class GameEngine {
  constructor() {
    this.currentLevel = 1;
    this.currentTheme = 1;
    this.cards = [];           // 场上所有卡牌
    this.grid = null;          // 网格状态
    this.isGameOver = false;
    this.isLevelComplete = false;
    this.isAnimating = false;
    this.elapsedTime = 0;
    this.timer = null;
    this.startTime = 0;
    this.moveCount = 0;
    this.comboCount = 0;
    this.maxCombo = 0;
    this.eliminatedCount = 0;
    this.totalCards = 0;
    this.mapSeed = 0;
    this.timeLimit = 0;        // 关卡限时（秒）

    // 回调
    this.onStateChange = null;
    this.onElimination = null;
    this.onVictory = null;
    this.onFailure = null;
  }

  /**
   * 初始化游戏
   * @param {number} level - 关卡 1|2
   * @param {number} theme - 主题 ID
   * @param {number} seed - 随机种子（可选，用于每日挑战）
   */
  async init(level, theme, seed) {
    this.currentLevel = level;
    this.currentTheme = theme;
    this.reset();

    const levelConfig = level === 1 ? LEVEL1_CONFIG : LEVEL2_CONFIG;
    const themeConfig = THEME_CONFIGS.find(t => t.id === theme);

    if (!themeConfig) {
      console.error(`主题 ${theme} 不存在`);
      return;
    }

    // 生成种子：每日挑战用日期做 seed，普通模式随机
    if (!seed) {
      if (level === 2) {
        // 每日挑战：使用日期作为 seed，保证所有人同一局
        const d = new Date();
        seed = parseInt(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`);
      } else {
        seed = Math.floor(Math.random() * 1000000000);
      }
    }
    this.mapSeed = seed;

    // 设置时间限制
    this.timeLimit = levelConfig.timeLimit || 0;

    // 生成卡牌
    const result = this.generateCards(levelConfig, themeConfig, seed);
    this.cards = result.cards;
    this.totalCards = this.cards.length;

    // 初始化网格
    this.initGrid(levelConfig);

    // 放置卡牌到网格
    this.placeCardsToGrid(result.placements);

    // 计算覆盖状态
    this.updateCoverage();

    // 开始计时
    this.startTimer();

    this.notifyStateChange();
  }

  /**
   * 重置游戏
   */
  reset() {
    this.cards = [];
    this.grid = null;
    this.isGameOver = false;
    this.isLevelComplete = false;
    this.isAnimating = false;
    this.elapsedTime = 0;
    this.moveCount = 0;
    this.comboCount = 0;
    this.maxCombo = 0;
    this.eliminatedCount = 0;
    this.totalCards = 0;
    this.mapSeed = 0;
    this.timeLimit = 0;
    this.stopTimer();
  }

  /**
   * 生成卡牌（确保有解）
   */
  generateCards(levelConfig, themeConfig, seed) {
    const rng = this.createRNG(seed);

    // 从主题植物中选取
    const plantTypes = themeConfig.plantTypes;
    if (plantTypes.length === 0) {
      console.error(`主题 ${themeConfig.name} 没有配置植物`);
      return { cards: [], placements: [] };
    }

    const typesPerLevel = this.currentLevel === 1 ? 4 : Math.min(8, plantTypes.length);
    const selectedTypes = this.shuffleArray(plantTypes.slice(), rng).slice(0, typesPerLevel);

    // 生成牌组（每种 3 张）
    const cardTypes = [];
    selectedTypes.forEach(type => {
      for (let i = 0; i < levelConfig.plantCount; i++) {
        cardTypes.push(type);
      }
    });

    // 打乱
    this.shuffleArray(cardTypes, rng);

    // 生成位置
    const placements = this.generatePlacements(levelConfig, rng);

    // 分配类型到位置
    const cards = [];
    for (let i = 0; i < cardTypes.length; i++) {
      const pos = placements[i];
      cards.push({
        id: `card_${i}`,
        type: cardTypes[i],
        layer: pos.layer,
        row: pos.row,
        col: pos.col,
        status: CardStatus.ACTIVE,
        width: CELL_SIZE,
        height: CELL_SIZE,
        rotation: (rng() - 0.5) * 8,
        scale: LAYER_SCALE + (rng() * 0.05),
      });
    }

    return { cards, placements };
  }

  /**
   * 生成位置（按层分配）
   */
  generatePlacements(levelConfig, rng) {
    const placements = [];
    const { layers, gridCols, gridRows } = levelConfig;

    // 每层的位置池
    layers.forEach((count, layerIndex) => {
      const layer = layerIndex + 1;
      const pool = [];

      for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
          pool.push({ layer, row: r, col: c });
        }
      }

      // 打乱后取需要的数量
      this.shuffleArray(pool, rng);
      const selected = pool.slice(0, count);
      placements.push(...selected);
    });

    // 按层排序（底层先放）
    placements.sort((a, b) => a.layer - b.layer);

    return placements;
  }

  /**
   * 初始化网格
   */
  initGrid(levelConfig) {
    const { gridCols, gridRows, layers } = levelConfig;
    const maxLayer = layers.length;

    // grid[layer][row][col] = cardId | null
    this.grid = [];
    for (let l = 0; l < maxLayer; l++) {
      this.grid[l] = [];
      for (let r = 0; r < gridRows; r++) {
        this.grid[l][r] = [];
        for (let c = 0; c < gridCols; c++) {
          this.grid[l][r][c] = null;
        }
      }
    }
  }

  /**
   * 放置卡牌到网格
   */
  placeCardsToGrid(placements) {
    placements.forEach((pos, i) => {
      const card = this.cards[i];
      if (card && this.grid[pos.layer - 1]) {
        this.grid[pos.layer - 1][pos.row][pos.col] = card.id;
      }
    });
  }

  /**
   * 更新覆盖状态
   */
  updateCoverage() {
    this.cards.forEach(card => {
      if (card.status === CardStatus.HIDDEN) return;

      const isCovered = this.isCardCovered(card);
      card.status = isCovered ? CardStatus.COVERED : CardStatus.ACTIVE;
    });
  }

  /**
   * 判断卡牌是否被覆盖
   */
  isCardCovered(card) {
    // 最顶层不会被覆盖
    if (card.layer >= this.grid.length) return false;

    // 检查上层是否有牌覆盖它
    for (let l = card.layer; l < this.grid.length; l++) {
      for (let r = 0; r < this.grid[l].length; r++) {
        for (let c = 0; c < this.grid[l][r].length; c++) {
          const upperCardId = this.grid[l][r][c];
          if (!upperCardId) continue;

          const upperCard = this.cards.find(c => c.id === upperCardId);
          if (!upperCard || upperCard.status === CardStatus.HIDDEN) continue;

          // 判断是否覆盖（简化版：相邻即覆盖）
          if (this.isOverlapping(upperCard, card)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * 判断两张牌是否重叠
   */
  isOverlapping(upper, lower) {
    const rowDiff = Math.abs(upper.row - lower.row);
    const colDiff = Math.abs(upper.col - lower.col);
    return rowDiff <= 1 && colDiff <= 1;
  }

  /**
   * 拖动卡牌到相邻空位
   * @param {string} cardId - 被拖动的卡牌 ID
   * @param {string} direction - 方向 'up'|'down'|'left'|'right'
   */
  onDragTo(cardId, direction) {
    if (this.isGameOver || this.isLevelComplete || this.isAnimating) {
      return { success: false, reason: 'game_not_active' };
    }

    const card = this.cards.find(c => c.id === cardId);
    if (!card) {
      return { success: false, reason: 'card_not_found' };
    }

    // 检查是否可交互
    if (card.status !== CardStatus.ACTIVE) {
      return { success: false, reason: 'card_not_active' };
    }

    // 计算目标位置
    const targetPos = this.getAdjacentPos(card, direction);
    if (!targetPos) {
      return { success: false, reason: 'out_of_bounds' };
    }

    // 检查目标位置是否为空
    const targetLayer = this.grid[targetPos.layer];
    if (!targetLayer || targetLayer[targetPos.row][targetPos.col] !== null) {
      return { success: false, reason: 'target_not_empty' };
    }

    // 执行移动
    this.moveCard(card, targetPos);
    this.moveCount++;

    // 检查消除
    const eliminated = this.checkElimination();
    if (eliminated.length > 0) {
      this.comboCount++;
      if (this.comboCount > this.maxCombo) {
        this.maxCombo = this.comboCount;
      }
      this.eliminateCards(eliminated);

      // 下落填补
      this.applyGravity();

      // 重新计算覆盖
      this.updateCoverage();
    } else {
      this.comboCount = 0;
    }

    // 检查胜利
    if (this.checkVictory()) {
      this.isLevelComplete = true;
      this.stopTimer();
      if (this.onVictory) {
        this.onVictory(this.elapsedTime);
      }
    }

    this.notifyStateChange();

    return {
      success: true,
      eliminated: eliminated,
      combo: this.comboCount,
    };
  }

  /**
   * 获取相邻位置
   */
  getAdjacentPos(card, direction) {
    const { layer, row, col } = card;
    const maxLayer = this.grid.length - 1;
    const maxRow = this.grid[layer].length - 1;
    const maxCol = this.grid[layer][0].length - 1;

    switch (direction) {
      case 'up':    return layer > 0 ? { layer: layer - 1, row, col } : null;
      case 'down':  return layer < maxLayer ? { layer: layer + 1, row, col } : null;
      case 'left':  return col > 0 ? { layer, row, col: col - 1 } : null;
      case 'right': return col < maxCol ? { layer, row, col: col + 1 } : null;
      default: return null;
    }
  }

  /**
   * 移动卡牌到目标位置
   */
  moveCard(card, targetPos) {
    // 从原位置移除
    this.grid[card.layer][card.row][card.col] = null;

    // 更新卡牌位置
    card.layer = targetPos.layer;
    card.row = targetPos.row;
    card.col = targetPos.col;

    // 放置到新位置
    this.grid[targetPos.layer][targetPos.row][targetPos.col] = card.id;
  }

  /**
   * 检查消除（同一直线上 2+ 个相同类型且相邻）
   * 修复：只消除相邻的牌，不是同行/同列所有相同类型
   */
  checkElimination() {
    const activeCards = this.cards.filter(
      c => c.status !== CardStatus.HIDDEN && c.status !== CardStatus.COVERED
    );

    // 按层分组
    const layerGroups = {};
    activeCards.forEach(card => {
      if (!layerGroups[card.layer]) {
        layerGroups[card.layer] = [];
      }
      layerGroups[card.layer].push(card);
    });

    const toEliminate = new Set();

    // 每层内检查同行和同列的相邻匹配
    Object.values(layerGroups).forEach(layerCards => {
      // 检查同行
      const rowGroups = {};
      layerCards.forEach(card => {
        const key = `${card.row}`;
        if (!rowGroups[key]) rowGroups[key] = [];
        rowGroups[key].push(card);
      });

      Object.values(rowGroups).forEach(rowCards => {
        // 按列排序，找相邻的相同类型
        rowCards.sort((a, b) => a.col - b.col);
        this.findAdjacentMatches(rowCards, toEliminate);
      });

      // 检查同列
      const colGroups = {};
      layerCards.forEach(card => {
        const key = `${card.col}`;
        if (!colGroups[key]) colGroups[key] = [];
        colGroups[key].push(card);
      });

      Object.values(colGroups).forEach(colCards => {
        // 按行排序，找相邻的相同类型
        colCards.sort((a, b) => a.row - b.row);
        this.findAdjacentMatches(colCards, toEliminate);
      });
    });

    return this.cards.filter(c => toEliminate.has(c.id));
  }

  /**
   * 在排序好的卡牌组中找相邻的相同类型（2+ 个连续）
   */
  findAdjacentMatches(sortedCards, toEliminate) {
    if (sortedCards.length < 2) return;

    let start = 0;
    for (let i = 1; i <= sortedCards.length; i++) {
      // 当到达末尾或类型不同时，检查前面的连续段
      if (i === sortedCards.length || sortedCards[i].type !== sortedCards[i - 1].type) {
        const groupLength = i - start;
        if (groupLength >= 2) {
          // 检查是否真的相邻（位置连续）
          for (let j = start; j < i; j++) {
            toEliminate.add(sortedCards[j].id);
          }
        }
        start = i;
      }
    }
  }

  /**
   * 消除卡牌
   */
  eliminateCards(cards) {
    cards.forEach(card => {
      card.status = CardStatus.HIDDEN;
      this.grid[card.layer][card.row][card.col] = null;
    });

    if (this.onElimination) {
      this.onElimination(cards);
    }
  }

  /**
   * 下落填补（递归处理多层掉落）
   * 修复：递归执行直到没有牌可以继续下落
   */
  applyGravity() {
    const maxLayer = this.grid.length - 1;
    let moved = true;

    // 递归执行直到没有牌可以继续下落
    while (moved) {
      moved = false;

      // 从上层往下层掉落
      for (let l = 0; l < maxLayer; l++) {
        for (let r = 0; r < this.grid[l].length; r++) {
          for (let c = 0; c < this.grid[l][r].length; c++) {
            const cardId = this.grid[l][r][c];
            if (!cardId) continue;

            const card = this.cards.find(c => c.id === cardId);
            if (!card || card.status === CardStatus.HIDDEN) continue;

            // 检查下方是否有空位
            const belowCardId = this.grid[l + 1][r][c];
            if (!belowCardId) {
              // 掉落到下层
              this.grid[l][r][c] = null;
              this.grid[l + 1][r][c] = cardId;
              card.layer = l + 1;
              moved = true;
            }
          }
        }
      }
    }
  }

  /**
   * 检查是否胜利
   */
  checkVictory() {
    const remaining = this.cards.filter(
      c => c.status !== CardStatus.HIDDEN
    );
    return remaining.length === 0;
  }

  /**
   * 获取可交互的卡牌
   */
  getActiveCards() {
    return this.cards.filter(c => c.status === CardStatus.ACTIVE);
  }

  /**
   * 获取屏幕坐标
   */
  getScreenPos(card) {
    const centerX = 187.5; // 375 / 2
    const centerY = 250;

    const layerOffsetX = card.layer * LAYER_OFFSET;
    const layerOffsetY = card.layer * LAYER_OFFSET * 0.6;

    const x = centerX + (card.col - 2) * (CELL_SIZE + CELL_GAP) - layerOffsetX;
    const y = centerY + (card.row - 1.5) * (CELL_SIZE + CELL_GAP) + layerOffsetY;

    return { x, y };
  }

  /**
   * 获取游戏状态（用于 UI 渲染）
   */
  getState() {
    return {
      currentLevel: this.currentLevel,
      currentTheme: this.currentTheme,
      cards: this.cards.map(c => ({
        ...c,
        screenPos: this.getScreenPos(c),
        isActive: c.status === CardStatus.ACTIVE,
      })),
      isGameOver: this.isGameOver,
      isLevelComplete: this.isLevelComplete,
      isAnimating: this.isAnimating,
      elapsedTime: this.elapsedTime,
      moveCount: this.moveCount,
      comboCount: this.comboCount,
      maxCombo: this.maxCombo,
      eliminatedCount: this.eliminatedCount,
      totalCards: this.totalCards,
      progress: this.totalCards > 0 ? this.eliminatedCount / this.totalCards : 0,
      mapSeed: this.mapSeed,
      timeLimit: this.timeLimit,
      remainingTime: this.timeLimit > 0 ? Math.max(0, this.timeLimit - this.elapsedTime) : 0,
    };
  }

  /**
   * 通知状态变化
   */
  notifyStateChange() {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }
  }

  /**
   * 计时器
   * 修复：添加超时判定
   */
  startTimer() {
    this.startTime = Date.now();
    this.timer = setInterval(() => {
      this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);

      // 检查是否超时
      if (this.timeLimit > 0 && this.elapsedTime >= this.timeLimit) {
        this.stopTimer();
        if (!this.isLevelComplete && !this.isGameOver) {
          this.isGameOver = true;
          if (this.onFailure) {
            this.onFailure('time_out');
          }
        }
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * 伪随机数生成器（Mulberry32）
   */
  createRNG(seed) {
    let s = seed | 0;
    return () => {
      s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ s >>> 15, 1 | s);
      t = (t + Math.imul(t ^ t >>> 7, 61 | t)) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /**
   * Fisher-Yates 洗牌
   */
  shuffleArray(array, rng) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

module.exports = { GameEngine, CardStatus };
