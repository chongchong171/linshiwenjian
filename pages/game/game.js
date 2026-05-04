// pages/game/game.js
const GameManager = require('../../utils/game-manager');
const { PlantType, PlantState, PowerUpType } = require('../../utils/plant-types');

Page({
  data: {
    // 游戏状态
    score: 0,
    moves: 0,
    remainingCount: 0,
    isGameOver: false,
    isLevelComplete: false,
    currentLevel: 1,
    themeName: '',
    
    // 植物数据
    plants: [],
    visiblePlants: [],
    
    // UI 状态
    showGameOver: false,
    showLevelComplete: false,
    hintPlants: [],
    
    // 道具数量
    powerUps: {
      magnifier: 3,
      weedkiller: 2,
      shuffle: 1,
      revive: 1
    },
    
    // 触摸相关
    touchStartPos: null,
    currentSwipePath: [],
    isSwiping: false,
    
    // 布局参数（rpx 单位）
    plantSize: 80,      // 植物大小
    plantGap: 5,        // 植物间距
    layerOffset: 15,    // 每层偏移量（实现堆叠效果）
    gridOffsetX: 40,    // 网格 X 偏移
    gridOffsetY: 120    // 网格 Y 偏移
  },

  gameManager: null,
  systemInfo: null,

  onLoad(options) {
    // 获取系统信息
    this.systemInfo = wx.getSystemInfoSync();
    
    // 初始化游戏管理器
    this.gameManager = new GameManager();
    
    // 设置回调函数
    this.setupCallbacks();
    
    // 初始化游戏
    this.initGame();
  },

  /**
   * 初始化游戏
   */
  initGame() {
    wx.showLoading({ title: '加载中...' });
    
    try {
      // 初始化游戏
      this.gameManager.init();
      
      // 获取关卡配置
      const levelConfig = this.gameManager.levelManager.getCurrentLevel();
      
      // 更新 UI
      this.setData({
        currentLevel: levelConfig.id,
        themeName: levelConfig.name,
        score: 0,
        moves: 0,
        remainingCount: this.gameManager.getRemainingCount(),
        isGameOver: false,
        isLevelComplete: false,
        showGameOver: false,
        showLevelComplete: false
      });
      
      // 更新植物数据
      this.updatePlantData();
      
      wx.hideLoading();
    } catch (error) {
      console.error('初始化游戏失败:', error);
      wx.hideLoading();
      wx.showToast({ title: '初始化失败', icon: 'none' });
    }
  },

  /**
   * 设置回调函数
   */
  setupCallbacks() {
    this.gameManager.setCallbacks({
      onScoreChange: (score) => {
        this.setData({ score });
      },
      onMovesChange: (moves) => {
        this.setData({ moves });
      },
      onGameOver: (score) => {
        this.setData({ 
          isGameOver: true,
          showGameOver: true 
        });
        wx.showToast({ title: '游戏结束', icon: 'none' });
      },
      onLevelComplete: (score) => {
        this.setData({ 
          isLevelComplete: true,
          showLevelComplete: true 
        });
        wx.showToast({ title: '关卡完成！', icon: 'success' });
      },
      onPlantEliminated: (plants) => {
        this.updatePlantData();
      }
    });
  },

  /**
   * 更新植物数据
   */
  updatePlantData() {
    const visiblePlants = this.gameManager.stackManager.getVisiblePlants();
    const allPlants = this.getAllPlants();
    
    this.setData({
      plants: allPlants,
      visiblePlants: visiblePlants.map(p => this.plantToData(p)),
      remainingCount: this.gameManager.getRemainingCount()
    });
  },

  /**
   * 获取所有植物数据
   */
  getAllPlants() {
    const layers = this.gameManager.stackManager.layers;
    const allPlants = [];
    
    for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
      const layer = layers[layerIndex];
      for (let row = 0; row < layer.length; row++) {
        for (let col = 0; col < layer[row].length; col++) {
          const plant = layer[row][col];
          if (plant.type !== PlantType.NONE) {
            allPlants.push(this.plantToData(plant));
          }
        }
      }
    }
    
    return allPlants;
  },

  /**
   * 植物数据转换
   * 关键：计算堆叠位置，实现多层堆叠效果
   */
  plantToData(plant) {
    const { plantSize, plantGap, layerOffset, gridOffsetX, gridOffsetY } = this.data;
    const { layer, row, col } = plant.position;
    
    // 计算屏幕位置（实现堆叠效果）
    // 每层向上偏移 layerOffset，形成堆叠
    const x = gridOffsetX + col * (plantSize + plantGap) - layer * layerOffset;
    const y = gridOffsetY + row * (plantSize + plantGap) - layer * layerOffset;
    
    // z-index 确保上层植物显示在下层之上
    const zIndex = layer * 1000 + row * 10 + col;
    
    return {
      id: `${plant.position.layer}-${plant.position.row}-${plant.position.col}`,
      type: plant.type,
      layer: layer,
      row: row,
      col: col,
      visible: plant.visible,
      state: plant.state,
      x: x,
      y: y,
      zIndex: zIndex
    };
  },

  /**
   * 触摸开始
   */
  onTouchStart(event) {
    if (this.data.isGameOver || this.data.isLevelComplete) return;
    
    const touch = event.touches[0];
    const plant = this.getPlantAtPosition(touch.clientX, touch.clientY);
    
    if (plant) {
      this.setData({
        touchStartPos: { x: touch.clientX, y: touch.clientY },
        isSwiping: true,
        currentSwipePath: [plant]
      });
      
      const managerPlant = this.data.plants.find(p => p.id === plant.id);
      if (managerPlant) {
        this.gameManager.startSwipe(managerPlant);
      }
    }
  },

  /**
   * 触摸移动
   */
  onTouchMove(event) {
    if (!this.data.isSwiping) return;
    
    const touch = event.touches[0];
    const plant = this.getPlantAtPosition(touch.clientX, touch.clientY);
    
    if (plant) {
      const currentPath = [...this.data.currentSwipePath];
      if (!currentPath.find(p => p.id === plant.id)) {
        currentPath.push(plant);
        this.setData({ currentSwipePath: currentPath });
        
        const managerPlant = this.data.plants.find(p => p.id === plant.id);
        if (managerPlant) {
          this.gameManager.moveSwipe(managerPlant);
        }
      }
    }
  },

  /**
   * 触摸结束
   */
  onTouchEnd(event) {
    if (!this.data.isSwiping) return;
    
    this.gameManager.endSwipe();
    
    this.setData({
      isSwiping: false,
      currentSwipePath: [],
      touchStartPos: null
    });
  },

  /**
   * 获取指定位置的植物
   * 根据触摸坐标计算对应的植物（从上层到下层查找）
   */
  getPlantAtPosition(x, y) {
    const { plantSize, gridOffsetX, gridOffsetY } = this.data;
    const { plants } = this.data;
    
    // 从上层到下层查找（优先匹配上层植物）
    const sortedPlants = [...plants].sort((a, b) => b.zIndex - a.zIndex);
    
    for (const plant of sortedPlants) {
      if (!plant.visible || plant.state === PlantState.ELIMINATED) continue;
      
      const plantLeft = plant.x;
      const plantTop = plant.y;
      const plantRight = plantLeft + plantSize;
      const plantBottom = plantTop + plantSize;
      
      // 检查触摸点是否在植物范围内
      if (x >= plantLeft && x <= plantRight && y >= plantTop && y <= plantBottom) {
        return plant;
      }
    }
    
    return null;
  },

  /**
   * 使用道具
   */
  onUsePowerUp(event) {
    const type = event.currentTarget.dataset.type;
    
    if (this.data.isGameOver || this.data.isLevelComplete) return;
    
    const success = this.gameManager.usePowerUp(type);
    
    if (success) {
      // 更新道具数量
      const powerUps = { ...this.data.powerUps };
      powerUps[type]--;
      this.setData({ powerUps });
      
      // 更新植物数据
      this.updatePlantData();
      
      wx.showToast({ title: '道具使用成功', icon: 'success' });
    } else {
      wx.showToast({ title: '道具数量不足', icon: 'none' });
    }
  },

  /**
   * 重新开始
   */
  onRestart() {
    this.setData({
      showGameOver: false,
      showLevelComplete: false
    });
    
    this.initGame();
  },

  /**
   * 下一关
   */
  onNextLevel() {
    const nextLevel = this.data.currentLevel + 1;
    
    if (nextLevel > 4) {
      wx.showToast({ title: '恭喜通关！', icon: 'success' });
      return;
    }
    
    this.setData({
      showLevelComplete: false
    });
    
    this.gameManager.init(nextLevel);
    this.updatePlantData();
  },

  /**
   * 分享游戏
   */
  onShareAppMessage() {
    return {
      title: '绿了个植 - 来挑战我的分数！',
      path: '/pages/game/game'
    };
  },

  onUnload() {
    // 清理资源
    this.gameManager = null;
  }
});
