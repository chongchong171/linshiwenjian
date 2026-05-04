/**
 * 绿了个植 - 植物匹配查找器
 * 
 * 核心算法：递归查找相邻相同植物
 * 借鉴小蚂蚁三消查找算法和连线消除游戏
 */

import { IPlantConfig, IMatchResult, PlantState } from './PlantTypes';
import { PlantStackManager } from './PlantStackManager';

export class PlantMatchFinder {
  private stackManager: PlantStackManager;
  private visited: Set<string> = new Set();

  constructor(stackManager: PlantStackManager) {
    this.stackManager = stackManager;
  }

  /**
   * 查找从起始植物开始的所有匹配植物
   * 使用递归查找算法（借鉴小蚂蚁教程）
   * 
   * @param startPlant 起始植物
   * @returns 匹配结果
   */
  findMatches(startPlant: IPlantConfig): IMatchResult {
    this.visited.clear();
    const matches: IPlantConfig[] = [];
    
    // 递归查找函数（借鉴小蚂蚁教程的递归查找算法）
    const dfs = (plant: IPlantConfig) => {
      // 生成唯一键值
      const key = `${plant.position.layer}-${plant.position.row}-${plant.position.col}`;
      
      // 如果已经访问过，直接返回
      if (this.visited.has(key)) return;
      this.visited.add(key);
      
      // 添加到匹配列表
      matches.push(plant);
      
      // 查找相邻位置（借鉴小蚂蚁教程：左、上、右、下四个方向）
      const directions = [
        { row: -1, col: 0 },  // 上
        { row: 1, col: 0 },   // 下
        { row: 0, col: -1 },  // 左
        { row: 0, col: 1 }    // 右
      ];
      
      for (const dir of directions) {
        const adjacent = this.getAdjacentPlant(plant, dir.row, dir.col);
        
        // 如果相邻植物存在、类型相同、且可见，则继续递归查找
        if (adjacent && 
            adjacent.type === startPlant.type && 
            adjacent.state === PlantState.VISIBLE) {
          dfs(adjacent);
        }
      }
    };
    
    // 从起始植物开始递归查找
    dfs(startPlant);
    
    // 判断是否满足消除条件（至少 2 个相同植物）
    const isEliminated = matches.length >= 2;
    
    return {
      plants: matches,
      count: matches.length,
      isEliminated
    };
  }

  /**
   * 获取相邻植物
   * @param plant 当前植物
   * @param rowOffset 行偏移
   * @param colOffset 列偏移
   * @returns 相邻植物
   */
  private getAdjacentPlant(plant: IPlantConfig, rowOffset: number, colOffset: number): IPlantConfig | null {
    const { layer, row, col } = plant.position;
    const newRow = row + rowOffset;
    const newCol = col + colOffset;
    
    return this.stackManager.getPlant({ layer, row: newRow, col: newCol });
  }

  /**
   * 查找任意可消除的植物对
   * @returns 可消除的植物对
   */
  findAnyMatch(): IPlantConfig[] | null {
    const visiblePlants = this.stackManager.getVisiblePlants();
    
    for (const plant of visiblePlants) {
      this.visited.clear();
      const result = this.findMatches(plant);
      
      if (result.isEliminated) {
        return result.plants;
      }
    }
    
    return null;
  }

  /**
   * 检查是否存在可消除的植物
   * @returns 是否存在
   */
  hasValidMatch(): boolean {
    return this.findAnyMatch() !== null;
  }

  /**
   * 执行消除操作
   * @param matches 匹配的植物列表
   * @returns 消除的植物数量
   */
  executeElimination(matches: IPlantConfig[]): number {
    let eliminatedCount = 0;
    
    for (const plant of matches) {
      this.stackManager.eliminatePlant(plant);
      eliminatedCount++;
    }
    
    return eliminatedCount;
  }

  /**
   * 检查滑动操作是否有效
   * @param startPlant 起始植物
   * @param endPlant 结束植物
   * @returns 是否有效
   */
  isValidSwipe(startPlant: IPlantConfig, endPlant: IPlantConfig): boolean {
    // 必须是相同类型
    if (startPlant.type !== endPlant.type) return false;
    
    // 必须都可见
    if (startPlant.state !== PlantState.VISIBLE || endPlant.state !== PlantState.VISIBLE) return false;
    
    // 必须是相邻位置
    if (!this.isAdjacent(startPlant, endPlant)) return false;
    
    return true;
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
}
