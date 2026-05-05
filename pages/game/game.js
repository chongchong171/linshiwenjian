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
    
    // 卡槽数据（7 格）
    slots: [],
    slotCount: 7,
    
    // UI 状态
    showGameOver: false,
    showLevelComplete: false,
    
    // 道具数量
    powerUps: {
      magnifier: 3,
      weedkiller: 2,
      shuffle: 1,
      revive: 1
    },
    
    // 暂存植物（移出三张牌）
    tempPlants: []
  },

  gameManager: null,

  onLoad() {
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
    console.log('开始初始化游戏...');
    
    try {
      this.gameManager.init();
      
      const levelConfig = this.gameManager.levelManager.getCurrentLevel();
      
      console.log('关卡配置:', levelConfig);
      
      this.setData({
        currentLevel: levelConfig.id,
        themeName: levelConfig.name,
        score: 0,
        moves: 0,
        remainingCount: this.gameManager.getRemainingCount(),
        isGameOver: false,
        isLevelComplete: false,
        showGameOver: false,
        showLevelComplete: false,
        slots: [],
        tempPlants: []
      });
      
      this.updatePlantData();
      console.log('游戏初始化完成');
    } catch (error) {
      console.error('初始化游戏失败:', error);
      wx.showToast({ title: '初始化失败', icon: 'none' });
    }
  },

  /**
   * 设置回调函数
   */
  setupCallbacks() {
    this.gameManager.setCallbacks({
      onScoreChange: (score) => this.setData({ score }),
      onMovesChange: (moves) => this.setData({ moves }),
      onGameOver: (reason) => {
        console.log('游戏结束，原因:', reason);
        this.setData({ 
          isGameOver: true,
          showGameOver: true 
        });
        wx.showToast({ title: reason === 'slot_full' ? '卡槽已满，游戏结束' : '游戏结束', icon: 'none' });
      },
      onLevelComplete: (score) => {
        console.log('关卡完成！');
        this.setData({ 
          isLevelComplete: true,
          showLevelComplete: true 
        });
        wx.showToast({ title: '关卡完成！', icon: 'success' });
      },
      onPlantEliminated: (type, pos) => {
        console.log('植物消除，类型:', type, '位置:', pos);
      },
      onSlotChange: (slots) => {
        this.setData({ slots: slots });
      },
      onRemainingChange: (count) => {
        this.setData({ remainingCount: count });
      },
      onTempPlantsChange: (tempPlants) => {
        this.setData({ tempPlants: tempPlants });
      }
    });
  },

  /**
   * 更新植物数据
   */
  updatePlantData() {
    const allPlants = this.gameManager.getAllPlants();
    
    this.setData({
      plants: allPlants,
      remainingCount: this.gameManager.getRemainingCount(),
      tempPlants: this.gameManager.tempRemovedPlants || []
    });
  },

  /**
   * 点击植物（拾取）
   */
  onTapPlant(event) {
    if (this.data.isGameOver || this.data.isLevelComplete) return;
    
    const plantId = event.currentTarget.dataset.plantId;
    const plant = this.data.plants.find(p => p.id === plantId);
    
    if (plant) {
      if (plant.visible) {
        console.log('点击植物:', plant.id, '类型:', plant.type);
        this.gameManager.clickPlant(plant);
        this.updatePlantData();
      } else {
        // 被遮挡植物 - 抖动动画
        this.shakePlant(plantId);
      }
    }
  },

  /**
   * 植物抖动动画
   */
  shakePlant(plantId) {
    const plants = this.data.plants.map(p => {
      if (p.id === plantId) {
        return { ...p, shake: true };
      }
      return p;
    });
    this.setData({ plants });
    
    // 500ms 后移除抖动状态
    setTimeout(() => {
      const updatedPlants = this.data.plants.map(p => {
        if (p.id === plantId) {
          return { ...p, shake: false };
        }
        return p;
      });
      this.setData({ plants: updatedPlants });
    }, 500);
  },

  /**
   * 点击暂存的植物（放回卡槽）
   */
  onTapTempPlant(event) {
    if (this.data.isGameOver || this.data.isLevelComplete) return;
    
    const index = event.currentTarget.dataset.index;
    
    // 从暂存区放回卡槽
    const tempPlants = [...this.data.tempPlants];
    const plant = tempPlants[index];
    
    if (plant) {
      this.gameManager.slotManager.insertPlant(plant);
      tempPlants.splice(index, 1);
      this.setData({ tempPlants });
      this.updatePlantData();
    }
  },

  /**
   * 使用道具
   */
  onUsePowerUp(event) {
    const type = event.currentTarget.dataset.type;
    
    if (this.data.isGameOver && type !== 'revive') return;
    if (this.data.isLevelComplete) return;
    
    const powerUps = { ...this.data.powerUps };
    
    if (powerUps[type] <= 0) {
      wx.showToast({ title: '道具数量不足', icon: 'none' });
      return;
    }
    
    const success = this.gameManager.usePowerUp(type);
    
    if (success) {
      powerUps[type]--;
      this.setData({ powerUps });
      
      // 特殊处理：复活道具
      if (type === 'revive') {
        this.setData({ showGameOver: false, isGameOver: false });
        wx.showToast({ title: '复活成功', icon: 'success' });
      } else {
        wx.showToast({ title: '道具使用成功', icon: 'success' });
      }
      
      // 更新 UI
      this.updatePlantData();
    } else {
      wx.showToast({ title: '道具使用失败', icon: 'none' });
    }
  },

  /**
   * 使用道具
   */
  onUsePowerUp(event) {
    const type = event.currentTarget.dataset.type;
    
    if (this.data.isGameOver && type !== 'revive') return;
    if (this.data.isLevelComplete) return;
    
    const powerUps = { ...this.data.powerUps };
    
    if (powerUps[type] <= 0) {
      wx.showToast({ title: '道具数量不足', icon: 'none' });
      return;
    }
    
    const success = this.gameManager.usePowerUp(type);
    
    if (success) {
      powerUps[type]--;
      this.setData({ powerUps });
      
      // 特殊处理：复活道具
      if (type === 'revive') {
        this.setData({ showGameOver: false, isGameOver: false });
        wx.showToast({ title: '复活成功', icon: 'success' });
      } else {
        wx.showToast({ title: '道具使用成功', icon: 'success' });
      }
      
      // 更新 UI
      this.updatePlantData();
    } else {
      wx.showToast({ title: '道具使用失败', icon: 'none' });
    }
  },

  /**
   * 点击暂存的植物（放回卡槽）
   */
  onTapTempPlant(event) {
    const index = event.currentTarget.dataset.index;
    
    if (this.data.isGameOver || this.data.isLevelComplete) return;
    
    this.gameManager.returnTempPlants();
    this.updatePlantData();
  },

  /**
   * 重新开始
   */
  onRestart() {
    this.setData({ showGameOver: false, showLevelComplete: false });
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
    
    this.setData({ showLevelComplete: false });
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
    this.gameManager = null;
  }
});
