/**
 * 绿了个植 - 植物堆叠管理器
 * 
 * 严格遵循小蚂蚁教程系列1：堆叠牌的拾取
 * 核心：4位置检查法 + 提前跳出优化
 */

const { PlantType, PlantState } = require('./plant-types');

class PlantStackManager {
  constructor(onStateChange) {
    this.layers = [];
    this.onStateChange = onStateChange || null;
  }

  /**
   * 初始化多层布局
   */
  initLayers(config) {
    this.layers = [];
    const baseRows = config.gridSize.rows;
    const baseCols = config.gridSize.cols;
    
    for (let layerIndex = 0; layerIndex < config.layers; layerIndex++) {
      const layer = [];
      const rows = Math.max(1, baseRows - layerIndex * 2);
      const cols = Math.max(1, baseCols - layerIndex * 2);
      
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
   */
  getPlant(position) {
    const { layer, row, col } = position;
    if (!this.layers[layer] || !this.layers[layer][row]) return null;
    return this.layers[layer][row][col] || null;
  }

  /**
   * 检查植物是否可滑动（教程：可拾取）
   */
  canSwipe(plant) {
    return plant.state === PlantState.VISIBLE;
  }

  /**
   * 获取相邻植物
   */
  getAdjacentPlants(plant) {
    const adjacent = [];
    const { layer, row, col } = plant.position;
    const directions = [
      { row: -1, col: 0 }, { row: 1, col: 0 },
      { row: 0, col: -1 }, { row: 0, col: 1 }
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
   */
  isValidPosition(layer, row, col) {
    if (!this.layers[layer]) return false;
    if (row < 0 || col < 0) return false;
    if (!this.layers[layer][row]) return false;
    return col < this.layers[layer][row].length;
  }

  /**
   * 刷新植物状态
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
   * 检查植物是否被遮挡（⭐ 教程核心算法）
   * 已知第一层某张牌的行列号 (r, c)，需要检查第二层表格中以下四个位置是否有牌：
   * (r, c), (r+1, c), (r, c-1), (r+1, c-1)
   * 关键优化：一旦发现任何一个位置有牌压住，就立即停止检查
   */
  isBlocked(plant) {
    const { layer, row, col } = plant.position;
    if (layer === 0) return false;

    const upperLayer = layer - 1;
    if (!this.layers[upperLayer]) return false;

    // 教程核心规律：检查上层四个对应位置
    const positions = [
      { r: row, c: col },
      { r: row + 1, c: col },
      { r: row, c: col - 1 },
      { r: row + 1, c: col - 1 }
    ];

    for (const pos of positions) {
      // 边界检查：超出表格边界视为无牌
      if (pos.r < 0 || pos.c < 0) continue;
      if (!this.layers[upperLayer][pos.r] || pos.c >= this.layers[upperLayer][pos.r].length) continue;

      const upperPlant = this.layers[upperLayer][pos.r][pos.c];
      // 关键优化：发现一个有牌立即跳出
      if (upperPlant && upperPlant.type !== PlantType.NONE && upperPlant.state !== PlantState.ELIMINATED) {
        return true;
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
   * 消除植物（从堆叠区移除）
   */
  eliminatePlant(plant) {
    if (plant.state === PlantState.ELIMINATED) return;
    plant.state = PlantState.ELIMINATED;
    plant.visible = false;
    this.refreshAllPlants();
  }

  /**
   * 恢复植物（道具：撤回一步）
   * 将植物从卡槽放回堆叠区原位
   */
  restorePlant(plant) {
    if (!plant || !plant.position) return false;
    
    const { layer, row, col } = plant.position;
    if (!this.layers[layer] || !this.layers[layer][row]) return false;
    
    const targetPlant = this.layers[layer][row][col];
    if (!targetPlant) return false;
    
    // 恢复植物状态
    targetPlant.type = plant.type;
    targetPlant.state = PlantState.HIDDEN;
    targetPlant.visible = false;
    
    // 刷新所有植物状态
    this.refreshAllPlants();
    
    return true;
  }

  /**
   * 获取所有可见植物
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

  /**
   * 统计卡牌总数（用于验证%3==0）
   */
  getTotalCount() {
    let count = 0;
    for (const layer of this.layers) {
      for (const row of layer) {
        for (const plant of row) {
          if (plant.type !== PlantType.NONE) count++;
        }
      }
    }
    return count;
  }
}

module.exports = PlantStackManager;
