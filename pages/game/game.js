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
    
    // 布局参数
    plantSize: 60,
    plantGap: 10,
    gridOffsetX: 30,
    gridOffsetY: 100
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
   */
  plantToData(plant) {
    const { plantSize, plantGap } = this.data;
    
    return {
      id: `${plant.position.layer}-${plant.position.row}-${plant.position.col}`,
      type: plant.type,
      layer: plant.position.layer,
      row: plant.position.row,
      col: plant.position.col,
      visible: plant.visible,
      state: plant.state,
      // 计算屏幕位置
      x: plant.position.col * (plantSize + plantGap) + plant.position.layer * 15,
      y: plant.position.row * (plantSize + plantGap) + plant.position.layer * 15,
      zIndex: plant.position.layer * 100 + plant.position.row * 10 + plant.position.col
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
   * 根据触摸坐标计算对应的植物
   */
  getPlantAtPosition(x, y) {
    const { plantSize, plantGap, gridOffsetX, gridOffsetY } = this.data;
    const { plants } = this.data;
    
    // 遍历所有可见植物，找到触摸位置对应的植物
    for (const plant of plants) {
      if (!plant.visible || plant.state === PlantState.ELIMINATED) continue;
      
      const plantLeft = gridOffsetX + plant.x;
      const plantTop = gridOffsetY + plant.y;
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
