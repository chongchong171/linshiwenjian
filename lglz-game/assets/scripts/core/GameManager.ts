/**
 * 绿了个植 - 游戏管理器
 * 
 * 整合所有核心模块，管理游戏主流程
 */

import { IPlantConfig, PlantType, PlantState, PowerUpType } from './PlantTypes';
import { PlantStackManager } from './PlantStackManager';
import { PlantMatchFinder } from './PlantMatchFinder';
import { PlantSwipeHandler } from './PlantSwipeHandler';
import { PlantFallManager } from './PlantFallManager';
import { PowerUpManager } from './PowerUpManager';
import { LevelManager } from './LevelManager';

export class GameManager {
  private stackManager: PlantStackManager;
  private matchFinder: PlantMatchFinder;
  private swipeHandler: PlantSwipeHandler;
  private fallManager: PlantFallManager;
  private powerUpManager: PowerUpManager;
  private levelManager: LevelManager;
  
  private score: number = 0;
  private moves: number = 0;
  private isGameOver: boolean = false;
  private isPaused: boolean = false;

  // 回调函数
  private onScoreChange?: (score: number) => void;
  private onMovesChange?: (moves: number) => void;
  private onGameOver?: (score: number) => void;
  private onLevelComplete?: (score: number) => void;
  private onPlantEliminated?: (plants: IPlantConfig[]) => void;

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
  }

  /**
   * 初始化游戏
   * @param levelId 关卡 ID
   */
  init(levelId?: number): void {
    // 获取关卡 ID（默认每日关卡）
    const targetLevelId = levelId || this.levelManager.getDailyLevelId();
    
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
  }

  /**
   * 随机生成植物
   * @param levelConfig 关卡配置
   */
  private generateRandomPlants(levelConfig: any): void {
    const layers = this.stackManager['layers'];
    
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
   * @param plant 起始植物
   */
  startSwipe(plant: IPlantConfig): void {
    if (this.isGameOver || this.isPaused) return;
    
    this.swipeHandler.startSwipe(plant);
  }

  /**
   * 滑动移动
   * @param plant 当前植物
   */
  moveSwipe(plant: IPlantConfig): void {
    if (this.isGameOver || this.isPaused) return;
    
    this.swipeHandler.moveSwipe(plant);
  }

  /**
   * 结束滑动
   */
  endSwipe(): void {
    if (this.isGameOver || this.isPaused) return;
    
    const action = this.swipeHandler.endSwipe();
    
    if (action.isValid) {
      this.moves++;
      this.onMovesChange?.(this.moves);
      
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
   * @param plants 消除的植物列表
   */
  private handleElimination(plants: IPlantConfig[]): void {
    // 计算分数
    const earnedScore = plants.length * 10;
    this.score += earnedScore;
    this.onScoreChange?.(this.score);
    
    // 触发消除回调
    this.onPlantEliminated?.(plants);
    
    // 检查关卡完成
    if (this.levelManager.checkLevelComplete(this.score)) {
      this.onLevelComplete?.(this.score);
    }
  }

  /**
   * 检查游戏结束
   */
  private checkGameOver(): void {
    // 检查是否还有可消除的植物
    const hasValidMatch = this.matchFinder.hasValidMatch();
    
    // 检查是否还有剩余植物
    const remainingCount = this.stackManager.getRemainingCount();
    
    if (!hasValidMatch && remainingCount > 0) {
      // 没有可消除的植物，但还有剩余植物，游戏结束
      this.isGameOver = true;
      this.onGameOver?.(this.score);
    } else if (remainingCount === 0) {
      // 所有植物消除完成，游戏胜利
      this.isGameOver = true;
      this.onLevelComplete?.(this.score);
    }
  }

  /**
   * 使用道具
   * @param type 道具类型
   * @param plant 目标植物
   * @returns 是否成功
   */
  usePowerUp(type: PowerUpType, plant?: IPlantConfig): boolean {
    if (this.isGameOver || this.isPaused) return false;
    
    return this.powerUpManager.usePowerUp(type, plant);
  }

  /**
   * 显示提示
   * @param plants 提示的植物列表
   */
  private showHint(plants: IPlantConfig[]): void {
    console.log('提示：可消除的植物对', plants);
    // TODO: 实现提示 UI
  }

  /**
   * 植物状态变化回调
   * @param plant 植物配置
   */
  private onPlantStateChange(plant: IPlantConfig): void {
    // TODO: 更新 UI
  }

  /**
   * 暂停游戏
   */
  pause(): void {
    this.isPaused = true;
  }

  /**
   * 恢复游戏
   */
  resume(): void {
    this.isPaused = false;
  }

  /**
   * 重置游戏
   */
  reset(): void {
    this.init();
  }

  /**
   * 获取分数
   * @returns 分数
   */
  getScore(): number {
    return this.score;
  }

  /**
   * 获取步数
   * @returns 步数
   */
  getMoves(): number {
    return this.moves;
  }

  /**
   * 获取剩余植物数量
   * @returns 剩余数量
   */
  getRemainingCount(): number {
    return this.stackManager.getRemainingCount();
  }

  /**
   * 设置回调函数
   */
  setCallbacks(callbacks: {
    onScoreChange?: (score: number) => void;
    onMovesChange?: (moves: number) => void;
    onGameOver?: (score: number) => void;
    onLevelComplete?: (score: number) => void;
    onPlantEliminated?: (plants: IPlantConfig[]) => void;
  }): void {
    Object.assign(this, callbacks);
  }
}
