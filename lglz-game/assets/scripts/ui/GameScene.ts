/**
 * 绿了个植 - 游戏场景组件
 * 
 * Cocos Creator 主场景组件，负责 UI 交互和游戏流程控制
 */

import { _decorator, Component, Node, Vec2, Touch, EventTouch } from 'cc';
import { GameManager } from '../core';

const { ccclass, property } = _decorator;

@ccclass('GameScene')
export class GameScene extends Component {
  @property(Node)
  private gameContainer: Node = null;
  
  @property(Node)
  private scoreLabel: Node = null;
  
  @property(Node)
  private movesLabel: Node = null;
  
  @property(Node)
  private gameOverPanel: Node = null;
  
  @property(Node)
  private levelCompletePanel: Node = null;
  
  private gameManager: GameManager = null;

  onLoad() {
    // 初始化游戏管理器
    this.gameManager = new GameManager();
    
    // 设置回调函数
    this.gameManager.setCallbacks({
      onScoreChange: (score) => this.updateScoreUI(score),
      onMovesChange: (moves) => this.updateMovesUI(moves),
      onGameOver: (score) => this.showGameOver(score),
      onLevelComplete: (score) => this.showLevelComplete(score),
      onPlantEliminated: (plants) => this.onPlantEliminated(plants)
    });
    
    // 初始化游戏
    this.gameManager.init();
    
    // 创建植物 UI
    this.createPlantUI();
    
    // 注册触摸事件
    this.registerTouchEvents();
  }

  /**
   * 创建植物 UI
   */
  private createPlantUI(): void {
    // TODO: 根据游戏管理器中的植物配置创建 UI
    // 这里需要动态创建植物节点并设置位置
  }

  /**
   * 注册触摸事件
   */
  private registerTouchEvents(): void {
    this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
  }

  /**
   * 触摸开始
   */
  private onTouchStart(event: EventTouch): void {
    const touchLoc = event.getLocation();
    const plant = this.getPlantAtPosition(touchLoc);
    
    if (plant) {
      this.gameManager.startSwipe(plant);
    }
  }

  /**
   * 触摸移动
   */
  private onTouchMove(event: EventTouch): void {
    const touchLoc = event.getLocation();
    const plant = this.getPlantAtPosition(touchLoc);
    
    if (plant) {
      this.gameManager.moveSwipe(plant);
    }
  }

  /**
   * 触摸结束
   */
  private onTouchEnd(event: EventTouch): void {
    this.gameManager.endSwipe();
  }

  /**
   * 获取指定位置的植物
   */
  private getPlantAtPosition(position: Vec2): any {
    // TODO: 根据位置查找对应的植物
    return null;
  }

  /**
   * 植物消除回调
   */
  private onPlantEliminated(plants: any[]): void {
    // TODO: 播放消除动画
    console.log('植物消除:', plants.length, '个');
  }

  /**
   * 更新分数 UI
   */
  private updateScoreUI(score: number): void {
    if (this.scoreLabel) {
      // TODO: 更新分数标签
      console.log('分数:', score);
    }
  }

  /**
   * 更新步数 UI
   */
  private updateMovesUI(moves: number): void {
    if (this.movesLabel) {
      // TODO: 更新步数标签
      console.log('步数:', moves);
    }
  }

  /**
   * 显示游戏结束
   */
  private showGameOver(score: number): void {
    if (this.gameOverPanel) {
      this.gameOverPanel.active = true;
      // TODO: 更新游戏结束 UI
    }
  }

  /**
   * 显示关卡完成
   */
  private showLevelComplete(score: number): void {
    if (this.levelCompletePanel) {
      this.levelCompletePanel.active = true;
      // TODO: 更新关卡完成 UI
    }
  }

  /**
   * 使用道具
   */
  public usePowerUp(powerUpType: string): void {
    // TODO: 实现道具使用
  }

  /**
   * 暂停游戏
   */
  public pauseGame(): void {
    this.gameManager.pause();
  }

  /**
   * 恢复游戏
   */
  public resumeGame(): void {
    this.gameManager.resume();
  }

  /**
   * 重置游戏
   */
  public resetGame(): void {
    this.gameManager.reset();
  }

  onDestroy() {
    // 清理事件监听
    this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
  }
}
