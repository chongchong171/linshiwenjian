/**
 * 绿了个植 - 植物滑动处理器
 * 
 * 处理玩家的滑动操作，实现滑动相邻消除
 * 借鉴小蚂蚁连线消除游戏的滑动操作交互
 */

import { IPlantConfig, ISwipeAction, PlantState } from './PlantTypes';
import { PlantStackManager } from './PlantStackManager';
import { PlantMatchFinder } from './PlantMatchFinder';

export class PlantSwipeHandler {
  private stackManager: PlantStackManager;
  private matchFinder: PlantMatchFinder;
  private currentSwipe: IPlantConfig[] = [];
  private onStartSwipe?: (startPlant: IPlantConfig) => void;
  private onSwipeMove?: (plants: IPlantConfig[]) => void;
  private onEndSwipe?: (action: ISwipeAction) => void;
  private onElimination?: (plants: IPlantConfig[]) => void;

  constructor(
    stackManager: PlantStackManager,
    matchFinder: PlantMatchFinder,
    callbacks?: {
      onStartSwipe?: (startPlant: IPlantConfig) => void;
      onSwipeMove?: (plants: IPlantConfig[]) => void;
      onEndSwipe?: (action: ISwipeAction) => void;
      onElimination?: (plants: IPlantConfig[]) => void;
    }
  ) {
    this.stackManager = stackManager;
    this.matchFinder = matchFinder;
    
    if (callbacks) {
      this.onStartSwipe = callbacks.onStartSwipe;
      this.onSwipeMove = callbacks.onSwipeMove;
      this.onEndSwipe = callbacks.onEndSwipe;
      this.onElimination = callbacks.onElimination;
    }
  }

  /**
   * 开始滑动
   * @param plant 起始植物
   */
  startSwipe(plant: IPlantConfig): void {
    if (plant.state !== PlantState.VISIBLE) return;
    
    this.currentSwipe = [plant];
    
    if (this.onStartSwipe) {
      this.onStartSwipe(plant);
    }
  }

  /**
   * 滑动移动
   * @param plant 当前植物
   */
  moveSwipe(plant: IPlantConfig): void {
    if (this.currentSwipe.length === 0) return;
    if (plant.state !== PlantState.VISIBLE) return;
    
    const lastPlant = this.currentSwipe[this.currentSwipe.length - 1];
    
    // 检查是否是相邻植物
    if (!this.isAdjacent(lastPlant, plant)) return;
    
    // 检查是否是相同类型（第一个植物除外）
    if (this.currentSwipe.length > 1 && plant.type !== this.currentSwipe[0].type) return;
    
    // 检查是否已经在这条滑动路径中
    if (this.currentSwipe.includes(plant)) return;
    
    this.currentSwipe.push(plant);
    
    if (this.onSwipeMove) {
      this.onSwipeMove(this.currentSwipe);
    }
  }

  /**
   * 结束滑动
   * @returns 滑动操作结果
   */
  endSwipe(): ISwipeAction {
    const action: ISwipeAction = {
      startPlant: this.currentSwipe[0],
      endPlant: this.currentSwipe[this.currentSwipe.length - 1],
      isValid: false
    };
    
    // 检查是否满足消除条件（至少 2 个植物）
    if (this.currentSwipe.length >= 2) {
      // 检查所有植物是否类型相同
      const firstType = this.currentSwipe[0].type;
      const allSameType = this.currentSwipe.every(p => p.type === firstType);
      
      if (allSameType) {
        action.isValid = true;
        
        // 执行消除
        if (this.onElimination) {
          this.onElimination(this.currentSwipe);
        }
      }
    }
    
    if (this.onEndSwipe) {
      this.onEndSwipe(action);
    }
    
    // 清空滑动路径
    this.currentSwipe = [];
    
    return action;
  }

  /**
   * 取消滑动
   */
  cancelSwipe(): void {
    this.currentSwipe = [];
  }

  /**
   * 检查两个植物是否相邻
   * @param plant1 植物 1
   * @param plant2 植物 2
   * @returns 是否相邻
   */
  private isAdjacent(plant1: IPlantConfig, plant2: IPlantConfig): boolean {
    const { row: row1, col: col1 } = plant1.position;
    const { row: row2, col: col2 } = plant2.position;
    
    const rowDiff = Math.abs(row1 - row2);
    const colDiff = Math.abs(col1 - col2);
    
    // 相邻意味着行差和列差之和为 1（上下左右）
    return (rowDiff + colDiff) === 1;
  }

  /**
   * 获取当前滑动路径
   * @returns 滑动路径植物列表
   */
  getCurrentSwipePath(): IPlantConfig[] {
    return [...this.currentSwipe];
  }
}
