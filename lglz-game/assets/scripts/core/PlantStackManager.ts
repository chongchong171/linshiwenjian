/**
 * 绿了个植 - 植物堆叠管理器
 * 
 * 负责多层堆叠布局管理、状态刷新、遮挡判断
 * 借鉴羊了个羊堆叠牌拾取逻辑
 */

import { IPlantConfig, IPlantPosition, PlantState, PlantType } from './PlantTypes';

export class PlantStackManager {
  private layers: IPlantConfig[][][] = [];
  private onStateChange?: (plant: IPlantConfig) => void;

  constructor(onStateChange?: (plant: IPlantConfig) => void) {
    this.onStateChange = onStateChange;
  }

  /**
   * 初始化多层布局
   * @param config 关卡配置
   */
  initLayers(config: any): void {
    this.layers = [];
    
    for (let layerIndex = 0; layerIndex < config.layers; layerIndex++) {
      const layer: IPlantConfig[][] = [];
      const rows = config.gridSize.rows - layerIndex;
      const cols = config.gridSize.cols - layerIndex;
      
      for (let row = 0; row < rows; row++) {
        const rowPlants: IPlantConfig[] = [];
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
   * @param layer 层级
   * @param row 行号
   * @param col 列号
   * @param type 植物类型
   */
  setPlantType(layer: number, row: number, col: number, type: PlantType): void {
    if (!this.layers[layer] || !this.layers[layer][row]) return;
    
    const plant = this.layers[layer][row][col];
    if (plant) {
      plant.type = type;
      this.refreshPlantState(plant);
    }
  }

  /**
   * 获取植物配置
   * @param position 位置信息
   * @returns 植物配置
   */
  getPlant(position: IPlantPosition): IPlantConfig | null {
    const { layer, row, col } = position;
    if (!this.layers[layer] || !this.layers[layer][row]) return null;
    return this.layers[layer][row][col] || null;
  }

  /**
   * 检查植物是否可滑动
   * @param plant 植物配置
   * @returns 是否可滑动
   */
  canSwipe(plant: IPlantConfig): boolean {
    if (plant.state !== PlantState.VISIBLE) return false;
    
    // 检查是否有相邻的相同类型植物
    const adjacent = this.getAdjacentPlants(plant);
    return adjacent.some(adj => adj.type === plant.type && adj.state === PlantState.VISIBLE);
  }

  /**
   * 获取相邻植物
   * @param plant 植物配置
   * @returns 相邻植物列表
   */
  getAdjacentPlants(plant: IPlantConfig): IPlantConfig[] {
    const adjacent: IPlantConfig[] = [];
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
   * @param layer 层级
   * @param row 行号
   * @param col 列号
   * @returns 是否有效
   */
  private isValidPosition(layer: number, row: number, col: number): boolean {
    if (!this.layers[layer]) return false;
    if (row < 0 || col < 0) return false;
    if (!this.layers[layer][row]) return false;
    return col < this.layers[layer][row].length;
  }

  /**
   * 刷新植物状态
   * @param plant 植物配置
   */
  refreshPlantState(plant: IPlantConfig): void {
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
   * @param plant 植物配置
   * @returns 是否被遮挡
   */
  private isBlocked(plant: IPlantConfig): boolean {
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
  refreshAllPlants(): void {
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
   * @param plant 植物配置
   */
  eliminatePlant(plant: IPlantConfig): void {
    if (plant.state === PlantState.ELIMINATED) return;
    
    plant.state = PlantState.ELIMINATED;
    plant.visible = false;
    
    // 刷新所有植物状态（因为消除后可能有新的植物变为可见）
    this.refreshAllPlants();
  }

  /**
   * 获取所有可见植物
   * @returns 可见植物列表
   */
  getVisiblePlants(): IPlantConfig[] {
    const visible: IPlantConfig[] = [];
    
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
   * @returns 剩余数量
   */
  getRemainingCount(): number {
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
