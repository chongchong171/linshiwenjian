// pages/game/game.js
const { GameEngine } = require('../../utils/game-engine');
const app = getApp();

Page({
  data: {
    currentLevel: 1,
    currentTheme: 1,
    themeName: '',
    cards: [],
    isGameOver: false,
    isLevelComplete: false,
    isAnimating: false,
    elapsedTime: 0,
    moveCount: 0,
    comboCount: 0,
    maxCombo: 0,
    eliminatedCount: 0,
    totalCards: 0,
    progress: 0,
    showFailModal: false,
    showPassModal: false,
    failMsg: '',
    passTime: '',
    getCard: null,
    showCombo: false,
    mode: 'normal',
    dragCardId: null,
    dragStartX: 0,
    dragStartY: 0,
  },

  engine: null,
  comboTimer: null,

  onLoad(options) {
    this.mode = options.mode || 'normal';
    this.engine = new GameEngine();
    this.setupCallbacks();
    this.initGame();
  },

  async initGame() {
    wx.showLoading({ title: '加载中...' });
    try {
      const theme = app.getTodayTheme();
      const level = this.mode === 'daily' ? 2 : 1;
      await this.engine.init(level, theme);
      this.setData({
        currentLevel: level,
        currentTheme: theme,
        themeName: this.getThemeName(theme),
      });
      wx.hideLoading();
    } catch (e) {
      console.error('初始化游戏失败', e);
      wx.hideLoading();
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  setupCallbacks() {
    this.engine.onStateChange = (state) => {
      this.setData({
        cards: state.cards,
        isGameOver: state.isGameOver,
        isLevelComplete: state.isLevelComplete,
        isAnimating: state.isAnimating,
        elapsedTime: state.elapsedTime,
        moveCount: state.moveCount,
        comboCount: state.comboCount,
        maxCombo: state.maxCombo,
        eliminatedCount: state.eliminatedCount,
        totalCards: state.totalCards,
        progress: state.progress,
      });
    };

    this.engine.onVictory = (passTime) => {
      this.onVictory(passTime);
    };

    this.engine.onFailure = () => {
      this.onFailure();
    };

    this.engine.onElimination = (cards) => {
      wx.vibrateShort({ type: 'medium' });
      if (this.engine.comboCount > 1) {
        this.showComboEffect(this.engine.comboCount);
      }
    };
  },

  onTouchStart(e) {
    const cardId = e.currentTarget.dataset.id;
    const card = this.engine.cards.find(c => c.id === cardId);
    if (!card || card.status !== 2) return;
    this.setData({
      dragCardId: cardId,
      dragStartX: e.touches[0].clientX,
      dragStartY: e.touches[0].clientY,
    });
  },

  onTouchEnd(e) {
    const { dragCardId, dragStartX, dragStartY } = this.data;
    if (!dragCardId) return;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const dx = endX - dragStartX;
    const dy = endY - dragStartY;
    const minDrag = 30;

    if (Math.abs(dx) < minDrag && Math.abs(dy) < minDrag) {
      this.setData({ dragCardId: null });
      return;
    }

    let direction;
    if (Math.abs(dx) > Math.abs(dy)) {
      direction = dx > 0 ? 'right' : 'left';
    } else {
      direction = dy > 0 ? 'down' : 'up';
    }

    this.engine.onDragTo(dragCardId, direction);
    this.setData({ dragCardId: null });
  },

  onUseItem(e) {
    const itemType = e.currentTarget.dataset.type;
    const useCount = this.getUseCount(itemType);
    if (useCount >= 1) {
      wx.showToast({ title: '次数用完了', icon: 'none' });
      return;
    }
    this.executeItem(itemType);
  },

  executeItem(itemType) {
    switch (itemType) {
      case 'magnify':
        this.useMagnify();
        break;
      case 'herbicide':
        this.useHerbicide();
        break;
      case 'shuffle':
        this.useShuffle();
        break;
    }
    const key = `item_${itemType}`;
    const count = (wx.getStorageSync(key) || 0) + 1;
    wx.setStorageSync(key, count);
  },

  useMagnify() {
    const activeCards = this.engine.getActiveCards();
    const typeGroups = {};
    activeCards.forEach(card => {
      if (!typeGroups[card.type]) typeGroups[card.type] = [];
      typeGroups[card.type].push(card);
    });
    let highlighted = [];
    for (const cards of Object.values(typeGroups)) {
      if (cards.length >= 2) {
        highlighted = highlighted.concat(cards.slice(0, 2));
        if (highlighted.length >= 6) break;
      }
    }
    this.setData({
      cards: this.data.cards.map(c => ({
        ...c,
        highlighted: highlighted.some(h => h.id === c.id),
      })),
    });
    setTimeout(() => {
      this.setData({
        cards: this.data.cards.map(c => ({ ...c, highlighted: false })),
      });
    }, 3000);
  },

  useHerbicide() {
    const coveredCards = this.engine.cards.filter(c => c.status === 1);
    const toRemove = coveredCards.slice(0, 3);
    toRemove.forEach(card => {
      card.status = 0;
      this.engine.eliminatedCount++;
    });
    this.engine.updateCoverage();
    this.engine.notifyStateChange();
  },

  useShuffle() {
    const activeCards = this.engine.cards.filter(c => c.status !== 0);
    const types = activeCards.map(c => c.type);
    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }
    activeCards.forEach((card, i) => {
      card.type = types[i];
    });
    this.engine.updateCoverage();
    this.engine.notifyStateChange();
  },

  onVictory(passTime) {
    const stats = app.globalData.stats;
    stats.totalPass++;
    stats.totalPlants += this.engine.eliminatedCount;
    wx.setStorageSync('lglz_stats', stats);
    const card = this.getPlantCard();
    this.setData({
      passTime: this.formatTime(passTime),
      getCard: card,
      showPassModal: true,
    });
  },

  onFailure() {
    const msgs = ['就差一点！🌿', '被植物打败了？', '再来一次！', '不服？再来！'];
    const msg = msgs[Math.floor(Math.random() * msgs.length)];
    this.setData({ failMsg: msg, showFailModal: true });
  },

  onRestart() {
    this.setData({
      showFailModal: false,
      showPassModal: false,
    });
    this.engine.reset();
    this.initGame();
  },

  onBackHome() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  onShareAppMessage() {
    const { themeName } = this.data;
    return {
      title: `${themeName} - 绿了个植，第二关通关率不到 5%，你敢来挑战吗？`,
      path: '/pages/index/index?share=invite',
    };
  },

  getThemeName(themeId) {
    const names = {
      1: '多肉花园', 2: '热带雨林', 3: '阳台花卉',
      4: '中草药圃', 5: '沙漠植物', 6: '水生植物', 7: '盲盒主题',
    };
    return names[themeId] || '未知主题';
  },

  getUseCount(itemType) {
    return wx.getStorageSync(`item_${itemType}`) || 0;
  },

  getPlantCard() {
    const themeConfig = THEME_CONFIGS?.find(t => t.id === this.data.currentTheme);
    if (!themeConfig) return null;
    const plant = themeConfig.plantTypes[Math.floor(Math.random() * themeConfig.plantTypes.length)];
    const rarity = Math.random() < 0.1 ? 3 : Math.random() < 0.4 ? 2 : 1;
    return { plant, rarity };
  },

  showComboEffect(combo) {
    if (this.comboTimer) clearTimeout(this.comboTimer);
    this.setData({ showCombo: true, comboCount: combo });
    this.comboTimer = setTimeout(() => {
      this.setData({ showCombo: false });
    }, 1000);
  },

  formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  },

  stopProp() {},

  onUnload() {
    if (this.engine) this.engine.stopTimer();
    if (this.comboTimer) clearTimeout(this.comboTimer);
  },
});
