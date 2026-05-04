/**
 * 绿了个植 - 关卡管理器
 * 
 * 管理关卡配置、进度保存、每日主题
 * 借鉴 1010 游戏关卡编辑器思路
 */

import { ILevelConfig, PlantType } from './PlantTypes';

export class LevelManager {
  private currentLevel: ILevelConfig | null = null;
  private levelConfigs: Map<number, ILevelConfig> = new Map();
  private currentDay: number = 0;

  constructor() {
    this.initLevelConfigs();
  }

  /**
   * 初始化关卡配置
   */
  private initLevelConfigs(): void {
    // 春日花园主题
    this.levelConfigs.set(1, {
      id: 1,
      name: '春日花园',
      theme: 'spring',
      difficulty: 2,
      layers: 2,
      gridSize: { rows: 5, cols: 5 },
      plantTypes: [PlantType.ROSE, PlantType.TULIP, PlantType.SUNFLOWER],
      targetScore: 100,
      movesLimit: 20,
      powerUps: ['magnifier', 'weedkiller']
    });

    // 热带雨林主题
    this.levelConfigs.set(2, {
      id: 2,
      name: '热带雨林',
      theme: 'rainforest',
      difficulty: 3,
      layers: 3,
      gridSize: { rows: 6, cols: 6 },
      plantTypes: [PlantType.FERN, PlantType.BANYAN, PlantType.CACTUS],
      targetScore: 150,
      movesLimit: 25,
      powerUps: ['magnifier', 'weedkiller', 'shuffle']
    });

    // 秋日丰收主题
    this.levelConfigs.set(3, {
      id: 3,
      name: '秋日丰收',
      theme: 'autumn',
      difficulty: 4,
      layers: 3,
      gridSize: { rows: 7, cols: 7 },
      plantTypes: [PlantType.PUMPKIN, PlantType.SUNFLOWER, PlantType.CACTUS],
      targetScore: 200,
      movesLimit: 30,
      powerUps: ['magnifier', 'weedkiller', 'shuffle', 'revive']
    });

    // 冬日温室主题
    this.levelConfigs.set(4, {
      id: 4,
      name: '冬日温室',
      theme: 'winter',
      difficulty: 5,
      layers: 4,
      gridSize: { rows: 8, cols: 8 },
      plantTypes: [PlantType.PLUM, PlantType.NARCISSUS, PlantType.PINE],
      targetScore: 250,
      movesLimit: 35,
      powerUps: ['magnifier', 'weedkiller', 'shuffle', 'revive']
    });
  }

  /**
   * 获取关卡配置
   * @param levelId 关卡 ID
   * @returns 关卡配置
   */
  getLevelConfig(levelId: number): ILevelConfig | undefined {
    return this.levelConfigs.get(levelId);
  }

  /**
   * 获取当前关卡
   * @returns 当前关卡配置
   */
  getCurrentLevel(): ILevelConfig | null {
    return this.currentLevel;
  }

  /**
   * 开始关卡
   * @param levelId 关卡 ID
   * @returns 是否成功开始
   */
  startLevel(levelId: number): boolean {
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
   * @returns 每日关卡 ID
   */
  getDailyLevelId(): number {
    // 基于日期计算每日关卡
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    // 循环使用关卡
    return (dayOfYear % this.levelConfigs.size) + 1;
  }

  /**
   * 保存进度
   * @param levelId 关卡 ID
   */
  private saveProgress(levelId: number): void {
    try {
      wx.setStorageSync('currentLevel', levelId);
      wx.setStorageSync('lastPlayDate', new Date().toISOString());
    } catch (e) {
      console.error('保存进度失败:', e);
    }
  }

  /**
   * 加载进度
   * @returns 上次玩的关卡 ID
   */
  loadProgress(): number | null {
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
   * @returns 关卡列表
   */
  getAllLevels(): ILevelConfig[] {
    return Array.from(this.levelConfigs.values());
  }

  /**
   * 更新关卡分数
   * @param score 分数
   */
  updateScore(score: number): void {
    if (this.currentLevel) {
      this.currentLevel.targetScore = Math.max(this.currentLevel.targetScore, score);
      this.saveProgress(this.currentLevel.id);
    }
  }

  /**
   * 检查是否完成关卡
   * @param score 当前分数
   * @returns 是否完成
   */
  checkLevelComplete(score: number): boolean {
    if (!this.currentLevel) return false;
    return score >= this.currentLevel.targetScore;
  }
}
