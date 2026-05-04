/**
 * 绿了个植 - 植物滑动处理器
 * 
 * 处理玩家的滑动操作，实现滑动相邻消除
 * 借鉴小蚂蚁连线消除游戏的滑动操作交互
 */

const { PlantState } = require('./plant-types');

class PlantSwipeHandler {
  constructor(stackManager, matchFinder, callbacks) {
    this.stackManager = stackManager;
    this.matchFinder = matchFinder;
    this.currentSwipe = [];
    this.onStartSwipe = callbacks?.onStartSwipe || null;
    this.onSwipeMove = callbacks?.onSwipeMove || null;
    this.onEndSwipe = callbacks?.onEndSwipe || null;
    this.onElimination = callbacks?.onElimination || null;
  }

  /**
   * 开始滑动
   * @param {Object} plant 起始植物
   */
  startSwipe(plant) {
    if (plant.state !== PlantState.VISIBLE) return;
    
    this.currentSwipe = [plant];
    
    if (this.onStartSwipe) {
      this.onStartSwipe(plant);
    }
  }

  /**
   * 滑动移动
   * @param {Object} plant 当前植物
   */
  moveSwipe(plant) {
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
   * @returns {Object} 滑动操作结果
   */
  endSwipe() {
    const action = {
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
  cancelSwipe() {
    this.currentSwipe = [];
  }

  /**
   * 检查两个植物是否相邻
   * @param {Object} plant1 植物 1
   * @param {Object} plant2 植物 2
   * @returns {boolean} 是否相邻
   */
  isAdjacent(plant1, plant2) {
    const { row: row1, col: col1 } = plant1.position;
    const { row: row2, col: col2 } = plant2.position;
    
    const rowDiff = Math.abs(row1 - row2);
    const colDiff = Math.abs(col1 - col2);
    
    // 相邻意味着行差和列差之和为 1（上下左右）
    return (rowDiff + colDiff) === 1;
  }

  /**
   * 获取当前滑动路径
   * @returns {Array} 滑动路径植物列表
   */
  getCurrentSwipePath() {
    return [...this.currentSwipe];
  }
}

module.exports = PlantSwipeHandler;
