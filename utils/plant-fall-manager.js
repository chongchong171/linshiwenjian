/**
 * 绿了个植 - 植物下落管理器
 * 
 * 处理消除后植物下落填补空位的逻辑
 * 借鉴小蚂蚁消除游戏中图标下落的原理和实现
 */

const { PlantType, PlantState } = require('./plant-types');

class PlantFallManager {
  constructor(stackManager, callbacks) {
    this.stackManager = stackManager;
    this.onPlantFall = callbacks?.onPlantFall || null;
    this.onChainElimination = callbacks?.onChainElimination || null;
  }

  /**
   * 处理植物下落
   * 消除后，上方植物下落填补空位
   */
  handlePlantFall() {
    const layers = this.stackManager.layers;
    
    // 从下往上遍历每一层
    for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
      const layer = layers[layerIndex];
      
      // 遍历每一列
      for (let col = 0; col < layer[0].length; col++) {
        this.handleColumnFall(layer, col);
      }
    }
    
    // 刷新所有植物状态
    this.stackManager.refreshAllPlants();
  }

  /**
   * 处理单列植物下落
   * @param {Array} layer 层级
   * @param {number} col 列号
   */
  handleColumnFall(layer, col) {
    const rows = layer.length;
    let writePos = rows - 1;
    
    // 从下往上遍历
    for (let row = rows - 1; row >= 0; row--) {
      const plant = layer[row][col];
      
      // 如果植物未被消除，移动到 writePos 位置
      if (plant.type !== PlantType.NONE && plant.state !== PlantState.ELIMINATED) {
        if (writePos !== row) {
          // 移动植物
          layer[writePos][col] = plant;
          layer[row][col] = this.createEmptyPlant(row, col);
          
          // 更新植物位置
          plant.position.row = writePos;
          
          // 触发下落回调
          if (this.onPlantFall) {
            this.onPlantFall(plant, writePos, col);
          }
        }
        writePos--;
      }
    }
    
    // 填充剩余位置为空植物
    for (let row = writePos; row >= 0; row--) {
      layer[row][col] = this.createEmptyPlant(row, col);
    }
  }

  /**
   * 创建空植物
   * @param {number} row 行号
   * @param {number} col 列号
   * @returns {Object} 空植物配置
   */
  createEmptyPlant(row, col) {
    return {
      type: PlantType.NONE,
      position: { layer: 0, row, col },
      state: PlantState.HIDDEN,
      visible: false
    };
  }

  /**
   * 检查连锁消除
   * 下落完成后，检查是否有新的匹配
   * @param {Object} matchFinder 匹配查找器
   * @returns {Array|null} 连锁消除的植物列表
   */
  checkChainElimination(matchFinder) {
    const visiblePlants = this.stackManager.getVisiblePlants();
    
    for (const plant of visiblePlants) {
      const result = matchFinder.findMatches(plant);
      
      if (result.isEliminated) {
        // 触发连锁消除回调
        if (this.onChainElimination) {
          this.onChainElimination(result.plants);
        }
        
        return result.plants;
      }
    }
    
    return null;
  }

  /**
   * 执行完整的下落和连锁消除流程
   * @param {Object} matchFinder 匹配查找器
   * @returns {number} 消除的植物总数
   */
  executeFullFallAndChain(matchFinder) {
    let totalEliminated = 0;
    
    // 处理下落
    this.handlePlantFall();
    
    // 检查连锁消除
    let chainPlants = this.checkChainElimination(matchFinder);
    
    while (chainPlants) {
      // 执行连锁消除
      for (const plant of chainPlants) {
        this.stackManager.eliminatePlant(plant);
        totalEliminated++;
      }
      
      // 再次处理下落
      this.handlePlantFall();
      
      // 继续检查连锁消除
      chainPlants = this.checkChainElimination(matchFinder);
    }
    
    return totalEliminated;
  }
}

module.exports = PlantFallManager;
