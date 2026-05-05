/**
 * 绿了个植 - 卡牌槽管理器
 * 
 * 严格遵循小蚂蚁教程系列3：卡牌拾取和消除
 * 核心：7 格卡槽 + 标记位置插入法 + 三消检查
 */

const { PlantType, PlantState } = require('./plant-types');

class SlotManager {
  constructor(options = {}) {
    this.maxSlots = options.maxSlots || 7; // 卡槽最大容量
    this.slots = []; // 卡槽中的植物列表 [{type, position, id}]
    this.slotTypes = []; // 卡槽中植物的类型列表（与 slots 一一对应）
    this.onSlotChange = options.onSlotChange || null; // 卡槽变化回调
    this.onElimination = options.onElimination || null; // 消除回调
    this.onGameOver = options.onGameOver || null; // 游戏结束回调
    this.onLevelComplete = options.onLevelComplete || null; // 关卡完成回调
    this.onRemainingChange = options.onRemainingChange || null; // 剩余数量变化回调
    
    this.currentInsertPos = -1; // 当前插入位置
    this.currentEliminatePos = -1; // 当前消除位置
    this.eliminateType = PlantType.NONE; // 需要消除的类型
  }

  /**
   * 初始化卡槽
   */
  init() {
    this.slots = [];
    this.slotTypes = [];
    this.currentInsertPos = -1;
    this.currentEliminatePos = -1;
    this.eliminateType = PlantType.NONE;
  }

  /**
   * 获取卡槽中植物数量
   */
  getSlotCount() {
    return this.slots.length;
  }

  /**
   * 检查卡槽是否已满
   */
  isFull() {
    return this.slots.length >= this.maxSlots;
  }

  /**
   * 插入植物到卡槽（⭐ 教程核心算法：标记位置法）
   * 
   * 三种情况：
   * 1. 卡槽中没有相同牌 → 追加到末尾
   * 2. 卡槽中有一个相同牌 → 插入到相同牌后面
   * 3. 卡槽中有两个相同牌 → 插入后触发消除
   * 
   * @param {Object} plant 植物配置 {type, position, id}
   * @returns {Object} 插入结果 {success, position, eliminated}
   */
  insertPlant(plant) {
    if (this.isFull()) {
      // 卡槽已满，游戏失败
      if (this.onGameOver) {
        this.onGameOver('slot_full');
      }
      return { success: false, reason: 'slot_full' };
    }

    // 标记位置法：遍历卡槽，找到最后一个与插入牌类型相同的位置
    let markPos = 0; // 默认值 0
    
    for (let i = 0; i < this.slotTypes.length; i++) {
      if (this.slotTypes[i] === plant.type) {
        markPos = i + 1; // 更新为当前位置 +1（因为插入位置是标记位置 +1）
      }
    }

    // 确定插入位置
    let insertPos;
    if (markPos > 0) {
      // 卡槽中存在相同类型的牌，插入到标记位置
      insertPos = markPos;
    } else {
      // 卡槽中没有相同类型的牌，插入到末尾
      insertPos = this.slotTypes.length;
    }

    // 插入植物到卡槽
    const slotPlant = {
      type: plant.type,
      position: plant.position,
      id: plant.id,
      slotIndex: insertPos
    };

    // 在插入位置插入
    this.slots.splice(insertPos, 0, slotPlant);
    this.slotTypes.splice(insertPos, 0, plant.type);

    // 记录插入位置
    this.currentInsertPos = insertPos;

    // 触发卡槽变化回调
    if (this.onSlotChange) {
      this.onSlotChange(this.slots);
    }

    // 检查是否可以消除
    const eliminated = this.checkAndEliminate();

    // 检查是否全部消除完成
    if (!eliminated && this.slots.length === 0) {
      // 这里不会触发，因为刚插入了一个植物
    }

    return {
      success: true,
      position: insertPos,
      eliminated: eliminated
    };
  }

  /**
   * 检查并执行消除（⭐ 教程核心算法：三消检查）
   * 
   * 关键特性：同一时刻最多只能消除一组三张相同的牌
   * 
   * @returns {boolean} 是否执行了消除
   */
  checkAndEliminate() {
    const count = this.slotTypes.length;
    
    // 前置判断：不足 3 张牌不可能消除
    if (count <= 2) return false;

    // 遍历检查（只需要遍历到倒数第三个元素）
    for (let i = 0; i <= count - 3; i++) {
      const checkType = this.slotTypes[i];
      let matchCount = 1;

      // 检查位置 i+1 和 i+2
      if (i + 1 < count && this.slotTypes[i + 1] === checkType) {
        matchCount++;
      }
      if (i + 2 < count && this.slotTypes[i + 2] === checkType) {
        matchCount++;
      }

      // 如果匹配数量 >= 3，执行消除
      if (matchCount >= 3) {
        // 记录消除信息
        this.eliminateType = checkType;
        this.currentEliminatePos = i;

        // 从列表中删除三项
        this.slots.splice(i, 3);
        this.slotTypes.splice(i, 3);

        // 触发消除回调
        if (this.onElimination) {
          this.onElimination(checkType, i);
        }

        // 触发卡槽变化回调
        if (this.onSlotChange) {
          this.onSlotChange(this.slots);
        }

        // 检查是否全部消除完成（胜利条件）
        if (this.slots.length === 0) {
          if (this.onLevelComplete) {
            this.onLevelComplete();
          }
        }

        return true;
      }
    }

    return false;
  }

  /**
   * 获取卡槽中所有植物
   */
  getSlots() {
    return [...this.slots];
  }

  /**
   * 获取卡槽中植物类型列表
   */
  getSlotTypes() {
    return [...this.slotTypes];
  }

  /**
   * 检查是否还有可消除的组合
   */
  hasValidMatch() {
    const count = this.slotTypes.length;
    if (count < 3) return false;

    for (let i = 0; i <= count - 3; i++) {
      if (this.slotTypes[i] === this.slotTypes[i + 1] && 
          this.slotTypes[i] === this.slotTypes[i + 2]) {
        return true;
      }
    }
    return false;
  }

  /**
   * 道具：移出三张牌
   * 将卡槽前 N 张牌移到暂存区（最多 3 张）
   * @returns {Array} 移出的植物列表
   */
  removeTopPlants() {
    const removeCount = Math.min(3, this.slots.length);
    if (removeCount === 0) return [];

    const removed = this.slots.slice(0, removeCount);
    const removedTypes = this.slotTypes.slice(0, removeCount);

    // 从卡槽中删除
    this.slots.splice(0, removeCount);
    this.slotTypes.splice(0, removeCount);

    // 触发卡槽变化回调
    if (this.onSlotChange) {
      this.onSlotChange(this.slots);
    }

    return removed;
  }

  /**
   * 道具：将暂存的植物放回卡槽
   * @param {Array} plants 暂存的植物列表
   */
  returnPlants(plants) {
    if (!plants || plants.length === 0) return;

    for (const plant of plants) {
      // 使用标记位置法插入
      let markPos = 0;
      for (let i = 0; i < this.slotTypes.length; i++) {
        if (this.slotTypes[i] === plant.type) {
          markPos = i + 1;
        }
      }

      let insertPos = markPos > 0 ? markPos : this.slotTypes.length;

      this.slots.splice(insertPos, 0, plant);
      this.slotTypes.splice(insertPos, 0, plant.type);
    }

    // 触发卡槽变化回调
    if (this.onSlotChange) {
      this.onSlotChange(this.slots);
    }

    // 检查消除
    this.checkAndEliminate();
  }

  /**
   * 道具：撤回最后一步
   * @returns {Object|null} 最后插入的植物，如果没有则返回 null
   */
  undoLastInsert() {
    if (this.slots.length === 0) return null;

    // 获取最后插入的植物（卡槽末尾）
    const lastPlant = this.slots[this.slots.length - 1];
    
    // 从卡槽中删除
    this.slots.pop();
    this.slotTypes.pop();

    // 触发卡槽变化回调
    if (this.onSlotChange) {
      this.onSlotChange(this.slots);
    }

    return lastPlant;
  }

  /**
   * 道具：随机打乱卡槽中的植物
   */
  shuffleSlots() {
    if (this.slots.length <= 1) return;

    // Fisher-Yates 洗牌算法
    for (let i = this.slots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.slots[i], this.slots[j]] = [this.slots[j], this.slots[i]];
      [this.slotTypes[i], this.slotTypes[j]] = [this.slotTypes[j], this.slotTypes[i]];
    }

    // 触发卡槽变化回调
    if (this.onSlotChange) {
      this.onSlotChange(this.slots);
    }

    // 检查消除
    this.checkAndEliminate();
  }
}

module.exports = SlotManager;
