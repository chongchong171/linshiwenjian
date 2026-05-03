// pages/game/game.js
const { GameEngine } = require('../../utils/game-engine');
const { THEME_CONFIGS } = require('../../config/GameConfig');
const app = getApp();

Page({
  data: {
    // 游戏状态
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
    formattedTime: '0:00',
    remainingTime: 0,
    timeLimit: 0,

    // UI
    showFailModal: false,
    showPassModal: false,
    showItemModal: false,
    selectedItem: '',
    failMsg: '',
    passRank: null,
    passTime: '',
    getCard: null,

    // 模式
    mode: 'normal', // normal | daily

    // 拖动
    dragCardId: null,
    dragStartX: 0,
    dragStartY: 0,
  },

  engine: null,
  audioCtx: null,

  onLoad(options) {
    this.mode = options.mode || 'normal';
    this.engine = new GameEngine();
    this.setupCallbacks();
    this.initGame();
  },

  /**
   * 初始化游戏
   */
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

  /**
   * 设置引擎回调
   */
  setupCallbacks() {
    this.engine.onStateChange = (state) => {
      // 修复：合并多次 setData 为一次，减少渲染频率
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
        formattedTime: this.formatTime(state.elapsedTime),
        remainingTime: state.remainingTime,
        timeLimit: state.timeLimit,
      });
    };

    this.engine.onVictory = (passTime) => {
      this.onVictory(passTime);
    };

    this.engine.onFailure = (reason) => {
      this.onFailure(reason);
    };

    this.engine.onElimination = (cards) => {
      this.playSound('eliminate');
      // 连击提示
      if (this.engine.comboCount > 1) {
        this.showComboTip(this.engine.comboCount);
      }
    };
  },

  /**
   * 触摸开始（拖动卡牌）
   */
  onTouchStart(e) {
    const cardId = e.currentTarget.dataset.id;
    const card = this.engine.cards.find(c => c.id === cardId);

    if (!card || card.status !== 2) return; // 2 = ACTIVE

    this.setData({
      dragCardId: cardId,
      dragStartX: e.touches[0].clientX,
      dragStartY: e.touches[0].clientY,
    });
  },

  /**
   * 触摸结束（判断拖动方向）
   */
  onTouchEnd(e) {
    const { dragCardId, dragStartX, dragStartY } = this.data;
    if (!dragCardId) return;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;

    const dx = endX - dragStartX;
    const dy = endY - dragStartY;

    // 最小拖动距离
    const minDrag = 30;
    if (Math.abs(dx) < minDrag && Math.abs(dy) < minDrag) {
      // 短按 = 选中，不做处理
      this.setData({ dragCardId: null });
      return;
    }

    // 判断方向
    let direction;
    if (Math.abs(dx) > Math.abs(dy)) {
      direction = dx > 0 ? 'right' : 'left';
    } else {
      direction = dy > 0 ? 'down' : 'up';
    }

    const result = this.engine.onDragTo(dragCardId, direction);

    if (result.success) {
      this.playSound('move');
      if (result.eliminated && result.eliminated.length > 0) {
        this.playSound('eliminate');
      }
    }

    this.setData({ dragCardId: null });
  },

  /**
   * 使用道具
   */
  onUseItem(e) {
    const itemType = e.currentTarget.dataset.type;

    // 检查使用次数
    const useCount = this.getUseCount(itemType);
    const maxPerLevel = this.getMaxPerLevel(itemType);
    if (useCount >= maxPerLevel) {
      // 需要看广告
      this.setData({
        showItemModal: true,
        selectedItem: itemType,
      });
      return;
    }

    this.executeItem(itemType);
  },

  /**
   * 确认看广告获取道具
   */
  confirmWatchAd() {
    this.setData({ showItemModal: false });

    // TODO: 接入微信激励视频广告
    // 模拟广告播放
    wx.showLoading({ title: '广告播放中...' });
    setTimeout(() => {
      wx.hideLoading();
      this.executeItem(this.data.selectedItem);
      wx.showToast({ title: '道具已使用', icon: 'success' });
    }, 1000);
  },

  /**
   * 执行道具效果
   */
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
      case 'revive':
        this.useRevive();
        break;
    }

    // 记录使用次数
    const key = `item_${itemType}`;
    const count = (wx.getStorageSync(key) || 0) + 1;
    wx.setStorageSync(key, count);
  },

  /**
   * 放大镜：高亮可匹配的牌
   */
  useMagnify() {
    const activeCards = this.engine.getActiveCards();
    const typeGroups = {};

    activeCards.forEach(card => {
      if (!typeGroups[card.type]) typeGroups[card.type] = [];
      typeGroups[card.type].push(card);
    });

    // 找到有 2+ 张的类型
    let highlighted = [];
    for (const cards of Object.values(typeGroups)) {
      if (cards.length >= 2) {
        highlighted = highlighted.concat(cards.slice(0, 2));
        if (highlighted.length >= 6) break; // 最多高亮 3 对
      }
    }

    // 高亮显示
    this.setData({
      cards: this.data.cards.map(c => ({
        ...c,
        highlighted: highlighted.some(h => h.id === c.id),
      })),
    });

    // 3秒后取消高亮
    setTimeout(() => {
      this.setData({
        cards: this.data.cards.map(c => ({ ...c, highlighted: false })),
      });
    }, 3000);
  },

  /**
   * 除草剂：清除 3 个随机障碍牌
   */
  useHerbicide() {
    const coveredCards = this.engine.cards.filter(c => c.status === 1); // 1 = COVERED
    const toRemove = coveredCards.slice(0, 3);

    toRemove.forEach(card => {
      card.status = 0; // HIDDEN
      this.engine.eliminatedCount++;
    });

    this.engine.updateCoverage();
    this.engine.notifyStateChange();
  },

  /**
   * 洗牌：重新打乱场上卡牌
   */
  useShuffle() {
    const activeCards = this.engine.cards.filter(c => c.status !== 0);
    const types = activeCards.map(c => c.type);

    // 打乱类型
    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }

    // 重新分配
    activeCards.forEach((card, i) => {
      card.type = types[i];
    });

    this.engine.updateCoverage();
    this.engine.notifyStateChange();
  },

  /**
   * 复活：失败后继续
   */
  useRevive() {
    this.setData({ showFailModal: false, isGameOver: false });
    this.engine.isGameOver = false;
    this.engine.startTimer();
  },

  /**
   * 通关处理
   */
  onVictory(passTime) {
    this.playSound('victory');

    // 更新统计
    const stats = wx.getStorageSync('lglz_stats') || { totalGames: 0, totalPass: 0, totalPlants: 0 };
    stats.totalGames++;
    stats.totalPass++;
    stats.totalPlants += this.engine.eliminatedCount;
    wx.setStorageSync('lglz_stats', stats);

    // 获取植物卡片
    const card = this.getPlantCard();

    // 保存到花园
    if (card) {
      this.saveToGarden(card);
    }

    this.setData({
      passRank: Math.floor(Math.random() * 100) + 1,
      passTime: this.formatTime(passTime),
      getCard: card,
      showPassModal: true,
    });
  },

  /**
   * 失败处理
   * 修复：添加失败原因处理
   */
  onFailure(reason) {
    this.playSound('fail');

    const msgs = [
      '就差一点！🌿',
      '被植物打败了？',
      '再来一次！',
      `差 ${this.engine.totalCards - this.engine.eliminatedCount} 株就通关了`,
      '不服？再来！',
    ];
    
    let msg;
    if (reason === 'time_out') {
      msg = '时间到！⏰';
    } else {
      msg = msgs[Math.floor(Math.random() * msgs.length)];
    }

    this.setData({
      failMsg: msg,
      showFailModal: true,
    });
  },

  /**
   * 重新开始
   */
  onRestart() {
    this.setData({
      showFailModal: false,
      showPassModal: false,
    });
    this.engine.reset();
    this.initGame();
  },

  /**
   * 返回首页
   */
  onBackHome() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  /**
   * 分享
   */
  onShareAppMessage() {
    const { currentTheme, themeName, passRank } = this.data;
    return {
      title: `${themeName} - 绿了个植，第二关通关率不到 5%，你敢来挑战吗？`,
      path: '/pages/index/index?share=invite',
    };
  },

  // ========== 辅助方法 ==========

  getThemeName(themeId) {
    const names = {
      1: '多肉花园',
      2: '热带雨林',
      3: '阳台花卉',
      4: '中草药圃',
      5: '沙漠植物',
      6: '水生植物',
      7: '盲盒主题',
    };
    return names[themeId] || '未知主题';
  },

  getUseCount(itemType) {
    return wx.getStorageSync(`item_${itemType}`) || 0;
  },

  getMaxPerLevel(itemType) {
    return 1; // 每局限 1 次
  },

  getPlantCard() {
    // 随机获得一张植物卡片
    const themeConfig = THEME_CONFIGS.find(t => t.id === this.data.currentTheme);
    if (!themeConfig) return null;

    const plant = themeConfig.plantTypes[Math.floor(Math.random() * themeConfig.plantTypes.length)];
    const rarity = Math.random() < 0.1 ? 3 : Math.random() < 0.4 ? 2 : 1;

    return { plant, rarity };
  },

  /**
   * 保存植物到花园
   */
  saveToGarden(card) {
    // 从本地存储读取花园数据
    let garden = wx.getStorageSync('lglz_garden') || [];

    // 检查是否已经收集过这株植物
    const exists = garden.find(p => p.plant === card.plant && p.rarity === card.rarity);
    if (!exists) {
      // 添加新植物,包含获得时间
      garden.push({
        plant: card.plant,
        rarity: card.rarity,
        obtainedAt: new Date().getTime(),
        source: this.data.mode === 'daily' ? '每日挑战' : '普通模式',
      });

      // 保存回本地存储
      wx.setStorageSync('lglz_garden', garden);
    }
  },

  showComboTip(combo) {
    wx.showToast({
      title: `${combo} 连击！🔥`,
      icon: 'none',
      duration: 800,
    });
  },

  formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  },

  playSound(type) {
    // TODO: 接入音效
    // const audio = wx.createInnerAudioContext();
    // audio.src = `/assets/audio/sfx/${type}.mp3`;
    // audio.play();
  },

  /**
   * 阻止滚动穿透
   * 修复：添加缺失的 stopProp 函数
   */
  /**
   * 取消道具弹窗
   */
  onCancelItem() {
    this.setData({ showItemModal: false });
  },

  stopProp() {
    // 空函数，用于 catchtouchmove 阻止弹窗外的滚动
  },

  onUnload() {
    if (this.engine) {
      this.engine.stopTimer();
    }
  },
});
