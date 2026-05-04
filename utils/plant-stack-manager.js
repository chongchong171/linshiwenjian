/**
 * 绿了个植 - 植物堆叠管理器
 * 
 * 负责多层堆叠布局管理、状态刷新、遮挡判断
 * 借鉴羊了个羊堆叠牌拾取逻辑
 */

const { PlantType, PlantState } = require('./plant-types');

class PlantStackManager {
  constructor(onStateChange) {
    this.layers = [];
    this.onStateChange = onStateChange || null;
  }

  /**
   * 初始化多层布局
   * @param {Object} config 关卡配置
   */
  initLayers(config) {
    this.layers = [];
    
    for (let layerIndex = 0; layerIndex < config.layers; layerIndex++) {
      const layer = [];
      const rows = config.gridSize.rows - layerIndex;
      const cols = config.gridSize.cols - layerIndex;
      
      for (let row = 0; row < rows; row++) {
        const rowPlants = [];
        for (let col = 0; col < cols; col++) {
          rowPlants.push({
            type: PlantType.NONE,
            position: { layer: layerIndex, row, col },
            state: PlantState.HIDDEN,
            visible: false
          });
        }
        layer.push(rowPlants);
      }
      this.layers.push(layer);
    }
  }

  /**
   * 设置植物类型
   * @param {number} layer 层级
   * @param {number} row 行号
   * @param {number} col 列号
   * @param {number} type 植物类型
   */
  setPlantType(layer, row, col, type) {
    if (!this.layers[layer] || !this.layers[layer][row]) return;
    
    const plant = this.layers[layer][row][col];
    if (plant) {
      plant.type = type;
      this.refreshPlantState(plant);
    }
  }

  /**
   * 获取植物配置
   * @param {Object} position 位置信息
   * @returns {Object|null} 植物配置
   */
  getPlant(position) {
    const { layer, row, col } = position;
    if (!this.layers[layer] || !this.layers[layer][row]) return null;
    return this.layers[layer][row][col] || null;
  }

  /**
   * 检查植物是否可滑动
   * @param {Object} plant 植物配置
   * @returns {boolean} 是否可滑动
   */
  canSwipe(plant) {
    if (plant.state !== PlantState.VISIBLE) return false;
    
    // 检查是否有相邻的相同类型植物
    const adjacent = this.getAdjacentPlants(plant);
    return adjacent.some(adj => adj.type === plant.type && adj.state === PlantState.VISIBLE);
  }

  /**
   * 获取相邻植物
   * @param {Object} plant 植物配置
   * @returns {Array} 相邻植物列表
   */
  getAdjacentPlants(plant) {
    const adjacent = [];
    const { layer, row, col } = plant.position;
    
    const directions = [
      { row: -1, col: 0 },
      { row: 1, col: 0 },
      { row: 0, col: -1 },
      { row: 0, col: 1 }
    ];
    
    for (const dir of directions) {
      const newRow = row + dir.row;
      const newCol = col + dir.col;
      
      if (this.isValidPosition(layer, newRow, newCol)) {
        const adjacentPlant = this.layers[layer][newRow][newCol];
        if (adjacentPlant && adjacentPlant.state !== PlantState.ELIMINATED) {
          adjacent.push(adjacentPlant);
        }
      }
    }
    
    return adjacent;
  }

  /**
   * 检查位置是否有效
   * @param {number} layer 层级
   * @param {number} row 行号
   * @param {number} col 列号
   * @returns {boolean} 是否有效
   */
  isValidPosition(layer, row, col) {
    if (!this.layers[layer]) return false;
    if (row < 0 || col < 0) return false;
    if (!this.layers[layer][row]) return false;
    return col < this.layers[layer][row].length;
  }

  /**
   * 刷新植物状态
   * @param {Object} plant 植物配置
   */
  refreshPlantState(plant) {
    if (plant.state === PlantState.ELIMINATED) return;
    
    const isBlocked = this.isBlocked(plant);
    const wasVisible = plant.visible;
    
    plant.visible = !isBlocked;
    plant.state = isBlocked ? PlantState.HIDDEN : PlantState.VISIBLE;
    
    if (wasVisible !== plant.visible && this.onStateChange) {
      this.onStateChange(plant);
    }
  }

  /**
   * 检查植物是否被遮挡
   * @param {Object} plant 植物配置
   * @returns {boolean} 是否被遮挡
   */
  isBlocked(plant) {
    const { layer, row, col } = plant.position;
    
    // 检查上层是否有植物遮挡
    for (let upperLayer = layer - 1; upperLayer >= 0; upperLayer--) {
      if (!this.layers[upperLayer]) continue;
      
      // 上层植物遮挡范围是当前植物位置的 2x2 区域
      const upperRow = Math.floor(row / 2);
      const upperCol = Math.floor(col / 2);
      
      if (this.isValidPosition(upperLayer, upperRow, upperCol)) {
        const upperPlant = this.layers[upperLayer][upperRow][upperCol];
        if (upperPlant && upperPlant.state !== PlantState.ELIMINATED) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * 刷新所有植物状态
   */
  refreshAllPlants() {
    for (const layer of this.layers) {
      for (const row of layer) {
        for (const plant of row) {
          if (plant.type !== PlantType.NONE) {
            this.refreshPlantState(plant);
          }
        }
      }
    }
  }

  /**
   * 消除植物
   * @param {Object} plant 植物配置
   */
  eliminatePlant(plant) {
    if (plant.state === PlantState.ELIMINATED) return;
    
    plant.state = PlantState.ELIMINATED;
    plant.visible = false;
    
    // 刷新所有植物状态
    this.refreshAllPlants();
  }

  /**
   * 获取所有可见植物
   * @returns {Array} 可见植物列表
   */
  getVisiblePlants() {
    const visible = [];
    
    for (const layer of this.layers) {
      for (const row of layer) {
        for (const plant of row) {
          if (plant.visible && plant.state !== PlantState.ELIMINATED) {
            visible.push(plant);
          }
        }
      }
    }
    
    return visible;
  }

  /**
   * 获取剩余植物数量
   * @returns {number} 剩余数量
   */
  getRemainingCount() {
    let count = 0;
    
    for (const layer of this.layers) {
      for (const row of layer) {
        for (const plant of row) {
          if (plant.type !== PlantType.NONE && plant.state !== PlantState.ELIMINATED) {
            count++;
          }
        }
      }
    }
    
    return count;
  }
}

module.exports = PlantStackManager;
