/**
 * 绿了个植 - 道具管理器
 * 
 * 管理四种道具的使用逻辑
 * 借鉴羊了个羊三种道具的实现
 */

import { IPlantConfig, IPowerUpConfig, PlantState, PowerUpType } from './PlantTypes';
import { PlantStackManager } from './PlantStackManager';
import { PlantMatchFinder } from './PlantMatchFinder';

export class PowerUpManager {
  private stackManager: PlantStackManager;
  private matchFinder: PlantMatchFinder;
  private powerUps: Map<PowerUpType, IPowerUpConfig> = new Map();
  private onPowerUpUsed?: (type: PowerUpType) => void;
  private onHintShow?: (plants: IPlantConfig[]) => void;
  private onPlantRemoved?: (plant: IPlantConfig) => void;
  private onPlantsShuffled?: () => void;
  private onGameRevived?: () => void;

  constructor(
    stackManager: PlantStackManager,
    matchFinder: PlantMatchFinder,
    callbacks?: {
      onPowerUpUsed?: (type: PowerUpType) => void;
      onHintShow?: (plants: IPlantConfig[]) => void;
      onPlantRemoved?: (plant: IPlantConfig) => void;
      onPlantsShuffled?: () => void;
      onGameRevived?: () => void;
    }
  ) {
    this.stackManager = stackManager;
    this.matchFinder = matchFinder;
    
    if (callbacks) {
      this.onPowerUpUsed = callbacks.onPowerUpUsed;
      this.onHintShow = callbacks.onHintShow;
      this.onPlantRemoved = callbacks.onPlantRemoved;
      this.onPlantsShuffled = callbacks.onPlantsShuffled;
      this.onGameRevived = callbacks.onGameRevived;
    }
    
    // 初始化道具
    this.initPowerUps();
  }

  /**
   * 初始化道具
   */
  private initPowerUps(): void {
    this.powerUps.set(PowerUpType.MAGNifier, {
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
   * @param type 道具类型
   * @returns 道具配置
   */
  getPowerUp(type: PowerUpType): IPowerUpConfig | undefined {
    return this.powerUps.get(type);
  }

  /**
   * 使用道具
   * @param type 道具类型
   * @param plant 目标植物（可选）
   * @returns 是否成功使用
   */
  usePowerUp(type: PowerUpType, plant?: IPlantConfig): boolean {
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
   * @returns 是否成功
   */
  private useMagnifier(): boolean {
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
   * @param plant 目标植物
   * @returns 是否成功
   */
  private useWeedkiller(plant: IPlantConfig): boolean {
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
   * @returns 是否成功
   */
  private useShuffle(): boolean {
    const visiblePlants = this.stackManager.getVisiblePlants();
    
    if (visiblePlants.length < 2) return false;
    
    // 收集所有植物类型
    const types: number[] = [];
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
   * @returns 是否成功
   */
  private useRevive(): boolean {
    // 触发复活回调
    if (this.onGameRevived) {
      this.onGameRevived();
    }
    
    return true;
  }

  /**
   * 添加道具
   * @param type 道具类型
   * @param count 数量
   */
  addPowerUp(type: PowerUpType, count: number = 1): void {
    const powerUp = this.powerUps.get(type);
    if (powerUp) {
      powerUp.count += count;
    }
  }

  /**
   * 获取所有道具列表
   * @returns 道具列表
   */
  getAllPowerUps(): IPowerUpConfig[] {
    return Array.from(this.powerUps.values());
  }
}
