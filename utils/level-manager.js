/**
 * 绿了个植 - 关卡管理器
 * 
 * 管理关卡配置、进度保存、每日主题
 * 借鉴 1010 游戏关卡编辑器思路
 */

const { LevelConfigs } = require('./plant-types');

class LevelManager {
  constructor() {
    this.currentLevel = null;
    this.levelConfigs = LevelConfigs;
  }

  /**
   * 获取关卡配置
   * @param {number} levelId 关卡 ID
   * @returns {Object|undefined} 关卡配置
   */
  getLevelConfig(levelId) {
    return this.levelConfigs[levelId];
  }

  /**
   * 获取当前关卡
   * @returns {Object|null} 当前关卡配置
   */
  getCurrentLevel() {
    return this.currentLevel;
  }

  /**
   * 开始关卡
   * @param {number} levelId 关卡 ID
   * @returns {boolean} 是否成功开始
   */
  startLevel(levelId) {
    const config = this.getLevelConfig(levelId);
    
    if (!config) {
      console.error(`关卡 ${levelId} 不存在`);
      return false;
    }
    
    this.currentLevel = { ...config };
    
    // 保存进度
    this.saveProgress(levelId);
    
    return true;
  }

  /**
   * 获取每日主题关卡
   * @returns {number} 每日关卡 ID
   */
  getDailyLevelId() {
    // 基于日期计算每日关卡
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    // 循环使用关卡
    return (dayOfYear % Object.keys(this.levelConfigs).length) + 1;
  }

  /**
   * 保存进度
   * @param {number} levelId 关卡 ID
   */
  saveProgress(levelId) {
    try {
      wx.setStorageSync('currentLevel', levelId);
      wx.setStorageSync('lastPlayDate', new Date().toISOString());
    } catch (e) {
      console.error('保存进度失败:', e);
    }
  }

  /**
   * 加载进度
   * @returns {number|null} 上次玩的关卡 ID
   */
  loadProgress() {
    try {
      const levelId = wx.getStorageSync('currentLevel');
      return levelId || null;
    } catch (e) {
      console.error('加载进度失败:', e);
      return null;
    }
  }

  /**
   * 获取所有关卡列表
   * @returns {Array} 关卡列表
   */
  getAllLevels() {
    return Object.values(this.levelConfigs);
  }

  /**
   * 更新关卡分数
   * @param {number} score 分数
   */
  updateScore(score) {
    if (this.currentLevel) {
      this.currentLevel.targetScore = Math.max(this.currentLevel.targetScore, score);
      this.saveProgress(this.currentLevel.id);
    }
  }

  /**
   * 检查是否完成关卡
   * @param {number} score 当前分数
   * @returns {boolean} 是否完成
   */
  checkLevelComplete(score) {
    if (!this.currentLevel) return false;
    return score >= this.currentLevel.targetScore;
  }
}

module.exports = LevelManager;
