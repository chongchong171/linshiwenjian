/**
 * 绿了个植 - 游戏管理器
 * 
 * 严格遵循小蚂蚁教程系列1-4：堆叠拾取 + 随机生成 + 卡槽消除 + 道具
 * 整合所有核心模块，管理游戏主流程
 */

const PlantStackManager = require('./plant-stack-manager');
const SlotManager = require('./slot-manager');
const { PlantType, PlantState, PowerUpType } = require('./plant-types');
const LevelManager = require('./level-manager');

class GameManager {
  constructor() {
    // 初始化管理器
    this.levelManager = new LevelManager();
    
    this.stackManager = new PlantStackManager((plant) => {
      this.onPlantStateChange(plant);
    });
    
    this.slotManager = new SlotManager({
      maxSlots: 7,
      onSlotChange: (slots) => this.onSlotChange(slots),
      onElimination: (type, pos) => this.onElimination(type, pos),
      onGameOver: (reason) => this.onGameOver(reason),
      onLevelComplete: () => this.onLevelComplete(),
      onRemainingChange: (count) => this.onRemainingChange(count)
    });
    
    // 游戏状态
    this.score = 0;
    this.moves = 0;
    this.isGameOver = false;
    this.isPaused = false;
    this.remainingCount = 0;
    
    // 回调函数
    this.onScoreChange = null;
    this.onMovesChange = null;
    this.onGameOver = null;
    this.onLevelComplete = null;
    this.onPlantEliminated = null;
    this.onSlotChange = null;
    this.onRemainingChange = null;
    this.onPlantStateChange = null;
    this.onTempPlantsChange = null;
  }

  /**
   * 初始化游戏
   * @param {number} levelId 关卡 ID
   */
  init(levelId) {
    try {
      // 获取关卡 ID（默认第 1 关）
      const targetLevelId = levelId || 1;
      
      // 开始关卡
      this.levelManager.startLevel(targetLevelId);
      const levelConfig = this.levelManager.getCurrentLevel();
      
      if (!levelConfig) {
        console.error('关卡配置不存在');
        return;
      }
      
      // 初始化堆叠布局
      this.stackManager.initLayers(levelConfig);
      
      // 随机生成植物类型（保证可通关）
      this.generatePassablePlants(levelConfig);
      
      // 刷新所有植物状态
      this.stackManager.refreshAllPlants();
      
      // 初始化卡槽
      this.slotManager.init();
      
      // 重置游戏状态
      this.score = 0;
      this.moves = 0;
      this.isGameOver = false;
      this.isPaused = false;
      this.remainingCount = this.stackManager.getRemainingCount();
      
      console.log('游戏初始化成功，关卡:', targetLevelId, '剩余植物:', this.remainingCount);
      
      // 触发回调
      if (this.onScoreChange) this.onScoreChange(this.score);
      if (this.onMovesChange) this.onMovesChange(this.moves);
      if (this.onRemainingChange) this.onRemainingChange(this.remainingCount);
      if (this.onSlotChange) this.onSlotChange([]);
      
    } catch (error) {
      console.error('游戏初始化失败:', error);
      throw error;
    }
  }

  /**
   * 随机生成植物（⭐ 教程系列2：保证可通关）
   * 
   * 算法：
   * 1. 统计卡牌总数
   * 2. 验证总数 % 3 == 0
   * 3. 随机抽取 N 种类型
   * 4. 按类型生成，每种 3 张，循环直到凑满总数
   * 5. 随机打乱序列
   * 6. 按顺序分配给每个卡牌位置
   */
  generatePassablePlants(levelConfig) {
    // 1. 统计卡牌总数
    const totalCount = this.stackManager.getTotalCount();
    console.log('卡牌总数:', totalCount);
    
    // 2. 验证总数是否为 3 的倍数
    if (totalCount % 3 !== 0) {
      console.warn('警告：卡牌总数不是 3 的倍数，可能无法通关！');
    }
    
    // 3. 随机抽取类型（从可用类型中抽取，数量根据总数决定）
    const typeCount = Math.min(levelConfig.plantTypes.length, Math.ceil(totalCount / 3));
    const selectedTypes = this.shuffleArray([...levelConfig.plantTypes]).slice(0, typeCount);
    console.log('选择的植物类型:', selectedTypes);
    
    // 4. 按类型生成，每种 3 张，循环直到凑满总数
    const typeList = [];
    let typeIndex = 0;
    
    while (typeList.length < totalCount) {
      const type = selectedTypes[typeIndex % selectedTypes.length];
      // 每次添加 3 张相同类型
      typeList.push(type, type, type);
      typeIndex++;
    }
    
    // 5. 随机打乱序列
    this.shuffleArray(typeList);
    console.log('生成的类型序列（前 10 个）:', typeList.slice(0, 10));
    
    // 6. 按顺序分配给每个卡牌位置
    let typeIndex2 = 0;
    for (let layerIndex = 0; layerIndex < this.stackManager.layers.length; layerIndex++) {
      const layer = this.stackManager.layers[layerIndex];
      for (let row = 0; row < layer.length; row++) {
        for (let col = 0; col < layer[row].length; col++) {
          if (typeIndex2 < typeList.length) {
            this.stackManager.setPlantType(layerIndex, row, col, typeList[typeIndex2]);
            typeIndex2++;
          }
        }
      }
    }
  }

  /**
   * 随机打乱数组（Fisher-Yates 算法）
   */
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * 点击植物（教程：拾取卡牌）
   * @param {Object} plant 植物配置
   */
  clickPlant(plant) {
    if (this.isGameOver || this.isPaused) return;
    
    // 检查植物是否可见（可拾取）
    if (!plant.visible || plant.state === PlantState.ELIMINATED) {
      console.log('植物不可拾取:', plant.id);
      return;
    }
    
    // 检查卡槽是否已满
    if (this.slotManager.isFull()) {
      console.log('卡槽已满，无法拾取');
      return;
    }
    
    // 从堆叠区移除植物
    this.stackManager.eliminatePlant(plant);
    
    // 插入到卡槽
    const result = this.slotManager.insertPlant({
      type: plant.type,
      position: plant.position,
      id: plant.id
    });
    
    if (result.success) {
      this.moves++;
      if (this.onMovesChange) this.onMovesChange(this.moves);
      
      // 计算分数
      const earnedScore = result.eliminated ? 30 : 10;
      this.score += earnedScore;
      if (this.onScoreChange) this.onScoreChange(this.score);
      
      console.log('植物拾取成功，插入位置:', result.position, '是否消除:', result.eliminated);
    } else {
      console.log('植物拾取失败:', result.reason);
    }
  }

  /**
   * 消除回调
   */
  onElimination(type, pos) {
    console.log('消除发生，类型:', type, '位置:', pos);
    if (this.onPlantEliminated) {
      this.onPlantEliminated(type, pos);
    }
  }

  /**
   * 卡槽变化回调
   */
  onSlotChange(slots) {
    if (this.onSlotChange) {
      this.onSlotChange(slots);
    }
  }

  /**
   * 游戏结束回调
   */
  onGameOver(reason) {
    this.isGameOver = true;
    console.log('游戏结束，原因:', reason);
    if (this.onGameOver) {
      this.onGameOver(reason);
    }
  }

  /**
   * 关卡完成回调
   */
  onLevelComplete() {
    this.isGameOver = true;
    console.log('关卡完成！');
    if (this.onLevelComplete) {
      this.onLevelComplete(this.score);
    }
  }

  /**
   * 剩余数量变化回调
   */
  onRemainingChange(count) {
    this.remainingCount = count;
    if (this.onRemainingChange) {
      this.onRemainingChange(count);
    }
  }

  /**
   * 植物状态变化回调
   */
  onPlantStateChange(plant) {
    // TODO: 更新 UI
  }

  /**
   * 使用道具
   */
  usePowerUp(type) {
    if (this.isGameOver || this.isPaused) return false;
    
    switch (type) {
      case PowerUpType.MAGNIFIER:
        return this.useMagnifier();
      case PowerUpType.WEEDKILLER:
        return this.useWeedkiller();
      case PowerUpType.SHUFFLE:
        return this.useShuffle();
      case PowerUpType.REVIVE:
        return this.useRevive();
      default:
        return false;
    }
  }

  /**
   * 道具：移出三张牌
   * 将卡槽前 3 张牌移到暂存区，点击可放回
   */
  useMagnifier() {
    if (this.slotManager.getSlotCount() === 0) {
      console.log('卡槽为空，无法移出');
      return false;
    }

    // 从卡槽移出前 3 张牌
    const removed = this.slotManager.removeTopPlants();
    
    if (removed.length > 0) {
      // 暂存移出的植物
      this.tempRemovedPlants = removed;
      
      // 触发 UI 更新
      if (this.onTempPlantsChange) {
        this.onTempPlantsChange(removed);
      }
      
      console.log('移出三张牌成功，数量:', removed.length);
      return true;
    }
    
    return false;
  }

  /**
   * 将暂存的植物放回卡槽
   */
  returnTempPlants() {
    if (!this.tempRemovedPlants || this.tempRemovedPlants.length === 0) return;

    this.slotManager.returnPlants(this.tempRemovedPlants);
    this.tempRemovedPlants = null;
    
    // 触发 UI 更新
    if (this.onTempPlantsChange) {
      this.onTempPlantsChange([]);
    }
    
    console.log('暂存植物已放回卡槽');
  }

  /**
   * 道具：撤回一步
   * 将最后拾取的牌从卡槽退回原位
   */
  useWeedkiller() {
    // 获取最后插入的植物
    const lastPlant = this.slotManager.undoLastInsert();
    
    if (lastPlant) {
      // 将植物放回堆叠区
      this.stackManager.restorePlant(lastPlant);
      this.stackManager.refreshAllPlants();
      
      // 触发 UI 更新
      if (this.onSlotChange) {
        this.onSlotChange(this.slotManager.getSlots());
      }
      
      console.log('撤回一步成功，类型:', lastPlant.type);
      return true;
    }
    
    console.log('卡槽为空，无法撤回');
    return false;
  }

  /**
   * 道具：随机打乱
   * 随机打乱所有剩余牌位置（堆叠区 + 卡槽区）
   */
  useShuffle() {
    // 打乱卡槽中的植物
    this.slotManager.shuffleSlots();
    
    // 打乱堆叠区植物位置
    this.shuffleStackPlants();
    
    // 触发 UI 更新
    if (this.onSlotChange) {
      this.onSlotChange(this.slotManager.getSlots());
    }
    
    console.log('随机打乱成功');
    return true;
  }

  /**
   * 打乱堆叠区植物位置
   */
  shuffleStackPlants() {
    const allPlants = [];
    const positions = [];
    
    // 收集所有植物和位置
    for (let layerIndex = 0; layerIndex < this.stackManager.layers.length; layerIndex++) {
      const layer = this.stackManager.layers[layerIndex];
      for (let row = 0; row < layer.length; row++) {
        for (let col = 0; col < layer[row].length; col++) {
          const plant = layer[row][col];
          if (plant.type !== PlantType.NONE) {
            allPlants.push({
              type: plant.type,
              position: { ...plant.position },
              state: plant.state,
              visible: plant.visible
            });
            positions.push({ layer: layerIndex, row, col });
          }
        }
      }
    }
    
    // 随机打乱植物数组
    this.shuffleArray(allPlants);
    
    // 重新分配位置
    for (let i = 0; i < allPlants.length; i++) {
      const pos = positions[i];
      const plant = allPlants[i];
      
      if (this.stackManager.layers[pos.layer] && 
          this.stackManager.layers[pos.layer][pos.row] && 
          this.stackManager.layers[pos.layer][pos.row][pos.col]) {
        
        const targetPlant = this.stackManager.layers[pos.layer][pos.row][pos.col];
        targetPlant.type = plant.type;
        targetPlant.position = pos;
        targetPlant.state = PlantState.HIDDEN;
        targetPlant.visible = false;
      }
    }
    
    // 刷新所有植物状态
    this.stackManager.refreshAllPlants();
  }

  /**
   * 道具：复活
   * 游戏结束后继续
   */
  useRevive() {
    if (!this.isGameOver) {
      console.log('游戏未结束，无法复活');
      return false;
    }

    // 重置游戏结束状态
    this.isGameOver = false;
    
    // 清空卡槽
    this.slotManager.init();
    
    // 刷新所有植物状态
    this.stackManager.refreshAllPlants();
    
    // 触发 UI 更新
    if (this.onSlotChange) {
      this.onSlotChange(this.slotManager.getSlots());
    }
    if (this.onRemainingChange) {
      this.onRemainingChange(this.stackManager.getRemainingCount());
    }
    
    console.log('复活成功，游戏继续');
    return true;
  }

  /**
   * 获取所有植物数据（用于 UI 渲染）
   */
  getAllPlants() {
    const layers = this.stackManager.layers;
    const allPlants = [];
    
    for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
      const layer = layers[layerIndex];
      for (let row = 0; row < layer.length; row++) {
        for (let col = 0; col < layer[row].length; col++) {
          const plant = layer[row][col];
          if (plant.type !== PlantType.NONE) {
            allPlants.push(this.plantToData(plant));
          }
        }
      }
    }
    
    return allPlants;
  }

  /**
   * 植物数据转换
   */
  plantToData(plant) {
    const plantSize = 60;
    const plantGap = 5;
    const layerOffset = 12;
    const gridOffsetX = 25;
    const gridOffsetY = 110;
    
    const { layer, row, col } = plant.position;
    const x = gridOffsetX + col * (plantSize + plantGap);
    const y = gridOffsetY + row * (plantSize + plantGap) - layer * layerOffset;
    const zIndex = (layer + 1) * 100;
    
    return {
      id: `${layer}-${row}-${col}`,
      type: plant.type,
      layer: layer,
      row: row,
      col: col,
      visible: plant.visible,
      state: plant.state,
      x: x,
      y: y,
      zIndex: zIndex
    };
  }

  /**
   * 设置回调函数
   */
  setCallbacks(callbacks) {
    this.onScoreChange = callbacks.onScoreChange || null;
    this.onMovesChange = callbacks.onMovesChange || null;
    this.onGameOver = callbacks.onGameOver || null;
    this.onLevelComplete = callbacks.onLevelComplete || null;
    this.onPlantEliminated = callbacks.onPlantEliminated || null;
    this.onSlotChange = callbacks.onSlotChange || null;
    this.onRemainingChange = callbacks.onRemainingChange || null;
    this.onPlantStateChange = callbacks.onPlantStateChange || null;
    this.onTempPlantsChange = callbacks.onTempPlantsChange || null;
  }

  /**
   * 暂停游戏
   */
  pause() {
    this.isPaused = true;
  }

  /**
   * 恢复游戏
   */
  resume() {
    this.isPaused = false;
  }

  /**
   * 重置游戏
   */
  reset() {
    this.init();
  }

  /**
   * 获取剩余植物数量
   */
  getRemainingCount() {
    return this.stackManager.getRemainingCount();
  }
}

module.exports = GameManager;
