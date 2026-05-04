// pages/home/home.js
Page({
  data: {
    // 首页数据
  },

  onLoad() {
    console.log('首页加载');
  },

  /**
   * 开始游戏
   */
  onStartGame() {
    wx.navigateTo({
      url: '/pages/game/game'
    });
  }
});
