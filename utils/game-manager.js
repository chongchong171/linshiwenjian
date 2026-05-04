/**
 * 绿了个植 - 游戏管理器
 * 
 * 整合所有核心模块，管理游戏主流程
 */

const PlantStackManager = require('./plant-stack-manager');
const PlantMatchFinder = require('./plant-match-finder');
const PlantSwipeHandler = require('./plant-swipe-handler');
const PlantFallManager = require('./plant-fall-manager');
const PowerUpManager = require('./power-up-manager');
const LevelManager = require('./level-manager');
const { PlantType, PlantState, PowerUpType } = require('./plant-types');

class GameManager {
  constructor() {
    // 初始化管理器
    this.levelManager = new LevelManager();
    
    this.stackManager = new PlantStackManager((plant) => {
      this.onPlantStateChange(plant);
    });
    
    this.matchFinder = new PlantMatchFinder(this.stackManager);
    
    this.swipeHandler = new PlantSwipeHandler(
      this.stackManager,
      this.matchFinder,
      {
        onElimination: (plants) => this.handleElimination(plants)
      }
    );
    
    this.fallManager = new PlantFallManager(this.stackManager, {
      onChainElimination: (plants) => this.handleElimination(plants)
    });
    
    this.powerUpManager = new PowerUpManager(
      this.stackManager,
      this.matchFinder,
      {
        onHintShow: (plants) => this.showHint(plants)
      }
    );
    
    // 游戏状态
    this.score = 0;
    this.moves = 0;
    this.isGameOver = false;
    this.isPaused = false;
    
    // 回调函数
    this.onScoreChange = null;
    this.onMovesChange = null;
    this.onGameOver = null;
    this.onLevelComplete = null;
    this.onPlantEliminated = null;
  }

  /**
   * 初始化游戏
   * @param {number} levelId 关卡 ID
   */
  init(levelId) {
    try {
      // 获取关卡 ID（默认第 1 关）
      const targetLevelId = levelId || 1;
      
      // 开始关卡
      this.levelManager.startLevel(targetLevelId);
      const levelConfig = this.levelManager.getCurrentLevel();
      
      if (!levelConfig) {
        console.error('关卡配置不存在');
        return;
      }
      
      // 初始化堆叠布局
      this.stackManager.initLayers(levelConfig);
      
      // 随机生成植物类型
      this.generateRandomPlants(levelConfig);
      
      // 刷新所有植物状态
      this.stackManager.refreshAllPlants();
      
      // 重置游戏状态
      this.score = 0;
      this.moves = 0;
      this.isGameOver = false;
      this.isPaused = false;
      
      console.log('游戏初始化成功，关卡:', targetLevelId);
    } catch (error) {
      console.error('游戏初始化失败:', error);
      throw error;
    }
  }

  /**
   * 随机生成植物
   * @param {Object} levelConfig 关卡配置
   */
  generateRandomPlants(levelConfig) {
    const layers = this.stackManager.layers;
    
    for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
      const layer = layers[layerIndex];
      
      for (let row = 0; row < layer.length; row++) {
        for (let col = 0; col < layer[row].length; col++) {
          // 随机选择植物类型
          const randomType = levelConfig.plantTypes[
            Math.floor(Math.random() * levelConfig.plantTypes.length)
          ];
          
          this.stackManager.setPlantType(layerIndex, row, col, randomType);
        }
      }
    }
  }

  /**
   * 开始滑动
   * @param {Object} plant 起始植物
   */
  startSwipe(plant) {
    if (this.isGameOver || this.isPaused) return;
    
    this.swipeHandler.startSwipe(plant);
  }

  /**
   * 滑动移动
   * @param {Object} plant 当前植物
   */
  moveSwipe(plant) {
    if (this.isGameOver || this.isPaused) return;
    
    this.swipeHandler.moveSwipe(plant);
  }

  /**
   * 结束滑动
   */
  endSwipe() {
    if (this.isGameOver || this.isPaused) return;
    
    const action = this.swipeHandler.endSwipe();
    
    if (action.isValid) {
      this.moves++;
      if (this.onMovesChange) this.onMovesChange(this.moves);
      
      // 处理下落
      this.fallManager.handlePlantFall();
      
      // 检查连锁消除
      this.fallManager.executeFullFallAndChain(this.matchFinder);
      
      // 检查游戏结束
      this.checkGameOver();
    }
  }

  /**
   * 处理消除
   * @param {Array} plants 消除的植物列表
   */
  handleElimination(plants) {
    // 计算分数
    const earnedScore = plants.length * 10;
    this.score += earnedScore;
    if (this.onScoreChange) this.onScoreChange(this.score);
    
    // 触发消除回调
    if (this.onPlantEliminated) this.onPlantEliminated(plants);
    
    // 检查关卡完成
    if (this.levelManager.checkLevelComplete(this.score)) {
      if (this.onLevelComplete) this.onLevelComplete(this.score);
    }
  }

  /**
   * 检查游戏结束
   */
  checkGameOver() {
    // 检查是否还有可消除的植物
    const hasValidMatch = this.matchFinder.hasValidMatch();
    
    // 检查是否还有剩余植物
    const remainingCount = this.stackManager.getRemainingCount();
    
    if (!hasValidMatch && remainingCount > 0) {
      // 没有可消除的植物，但还有剩余植物，游戏结束
      this.isGameOver = true;
      if (this.onGameOver) this.onGameOver(this.score);
    } else if (remainingCount === 0) {
      // 所有植物消除完成，游戏胜利
      this.isGameOver = true;
      if (this.onLevelComplete) this.onLevelComplete(this.score);
    }
  }

  /**
   * 使用道具
   * @param {string} type 道具类型
   * @param {Object} plant 目标植物
   * @returns {boolean} 是否成功
   */
  usePowerUp(type, plant) {
    if (this.isGameOver || this.isPaused) return false;
    
    return this.powerUpManager.usePowerUp(type, plant);
  }

  /**
   * 显示提示
   * @param {Array} plants 提示的植物列表
   */
  showHint(plants) {
    console.log('提示：可消除的植物对', plants);
    // TODO: 实现提示 UI
  }

  /**
   * 植物状态变化回调
   * @param {Object} plant 植物配置
   */
  onPlantStateChange(plant) {
    // TODO: 更新 UI
  }

  /**
   * 暂停游戏
   */
  pause() {
    this.isPaused = true;
  }

  /**
   * 恢复游戏
   */
  resume() {
    this.isPaused = false;
  }

  /**
   * 重置游戏
   */
  reset() {
    this.init();
  }

  /**
   * 获取分数
   * @returns {number} 分数
   */
  getScore() {
    return this.score;
  }

  /**
   * 获取步数
   * @returns {number} 步数
   */
  getMoves() {
    return this.moves;
  }

  /**
   * 获取剩余植物数量
   * @returns {number} 剩余数量
   */
  getRemainingCount() {
    return this.stackManager.getRemainingCount();
  }

  /**
   * 设置回调函数
   */
  setCallbacks(callbacks) {
    this.onScoreChange = callbacks.onScoreChange || null;
    this.onMovesChange = callbacks.onMovesChange || null;
    this.onGameOver = callbacks.onGameOver || null;
    this.onLevelComplete = callbacks.onLevelComplete || null;
    this.onPlantEliminated = callbacks.onPlantEliminated || null;
  }
}

module.exports = GameManager;
