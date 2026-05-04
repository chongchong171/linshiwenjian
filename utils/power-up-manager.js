/**
 * 绿了个植 - 道具管理器
 * 
 * 管理四种道具的使用逻辑
 * 借鉴羊了个羊三种道具的实现
 */

const { PowerUpType, PlantState } = require('./plant-types');

class PowerUpManager {
  constructor(stackManager, matchFinder, callbacks) {
    this.stackManager = stackManager;
    this.matchFinder = matchFinder;
    this.powerUps = new Map();
    this.onPowerUpUsed = callbacks?.onPowerUpUsed || null;
    this.onHintShow = callbacks?.onHintShow || null;
    this.onPlantRemoved = callbacks?.onPlantRemoved || null;
    this.onPlantsShuffled = callbacks?.onPlantsShuffled || null;
    this.onGameRevived = callbacks?.onGameRevived || null;
    
    // 初始化道具
    this.initPowerUps();
  }

  /**
   * 初始化道具
   */
  initPowerUps() {
    this.powerUps.set(PowerUpType.MAGNIFIER, {
      type: PowerUpType.MAGNIFIER,
      name: '放大镜',
      description: '提示可消除的植物对',
      count: 3
    });
    
    this.powerUps.set(PowerUpType.WEEDKILLER, {
      type: PowerUpType.WEEDKILLER,
      name: '除草剂',
      description: '消除指定位置的植物',
      count: 2
    });
    
    this.powerUps.set(PowerUpType.SHUFFLE, {
      type: PowerUpType.SHUFFLE,
      name: '洗牌',
      description: '随机打乱所有植物位置',
      count: 1
    });
    
    this.powerUps.set(PowerUpType.REVIVE, {
      type: PowerUpType.REVIVE,
      name: '复活',
      description: '游戏失败后继续',
      count: 1
    });
  }

  /**
   * 获取道具配置
   * @param {string} type 道具类型
   * @returns {Object|undefined} 道具配置
   */
  getPowerUp(type) {
    return this.powerUps.get(type);
  }

  /**
   * 使用道具
   * @param {string} type 道具类型
   * @param {Object} plant 目标植物（可选）
   * @returns {boolean} 是否成功使用
   */
  usePowerUp(type, plant) {
    const powerUp = this.powerUps.get(type);
    
    if (!powerUp || powerUp.count <= 0) {
      console.warn(`道具 ${powerUp?.name} 数量不足`);
      return false;
    }
    
    // 减少道具数量
    powerUp.count--;
    
    // 触发使用回调
    if (this.onPowerUpUsed) {
      this.onPowerUpUsed(type);
    }
    
    // 根据道具类型执行不同逻辑
    switch (type) {
      case PowerUpType.MAGNIFIER:
        return this.useMagnifier();
      
      case PowerUpType.WEEDKILLER:
        return plant ? this.useWeedkiller(plant) : false;
      
      case PowerUpType.SHUFFLE:
        return this.useShuffle();
      
      case PowerUpType.REVIVE:
        return this.useRevive();
      
      default:
        return false;
    }
  }

  /**
   * 使用放大镜：提示可消除的植物对
   * @returns {boolean} 是否成功
   */
  useMagnifier() {
    const matches = this.matchFinder.findAnyMatch();
    
    if (matches && matches.length >= 2) {
      // 触发提示回调
      if (this.onHintShow) {
        this.onHintShow(matches);
      }
      return true;
    }
    
    return false;
  }

  /**
   * 使用除草剂：消除指定位置的植物
   * @param {Object} plant 目标植物
   * @returns {boolean} 是否成功
   */
  useWeedkiller(plant) {
    if (plant.state === PlantState.ELIMINATED) return false;
    
    // 消除植物
    this.stackManager.eliminatePlant(plant);
    
    // 触发移除回调
    if (this.onPlantRemoved) {
      this.onPlantRemoved(plant);
    }
    
    return true;
  }

  /**
   * 使用洗牌：随机打乱所有植物位置
   * @returns {boolean} 是否成功
   */
  useShuffle() {
    const visiblePlants = this.stackManager.getVisiblePlants();
    
    if (visiblePlants.length < 2) return false;
    
    // 收集所有植物类型
    const types = [];
    for (const plant of visiblePlants) {
      types.push(plant.type);
    }
    
    // 随机打乱类型数组
    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }
    
    // 重新分配类型
    for (let i = 0; i < visiblePlants.length; i++) {
      visiblePlants[i].type = types[i];
    }
    
    // 触发洗牌回调
    if (this.onPlantsShuffled) {
      this.onPlantsShuffled();
    }
    
    return true;
  }

  /**
   * 使用复活：游戏失败后继续
   * @returns {boolean} 是否成功
   */
  useRevive() {
    // 触发复活回调
    if (this.onGameRevived) {
      this.onGameRevived();
    }
    
    return true;
  }

  /**
   * 添加道具
   * @param {string} type 道具类型
   * @param {number} count 数量
   */
  addPowerUp(type, count = 1) {
    const powerUp = this.powerUps.get(type);
    if (powerUp) {
      powerUp.count += count;
    }
  }

  /**
   * 获取所有道具列表
   * @returns {Array} 道具列表
   */
  getAllPowerUps() {
    return Array.from(this.powerUps.values());
  }
}

module.exports = PowerUpManager;
