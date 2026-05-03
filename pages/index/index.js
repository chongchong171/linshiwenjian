// pages/index/index.js
const app = getApp();

Page({
  data: {
    themeId: 1,
    themeName: '',
    themeDesc: '',
    stats: {
      totalGames: 0,
      totalPass: 0,
      totalPlants: 0,
    },
    gardenCount: 0,
  },

  onLoad() {
    this.loadTheme();
    this.loadStats();
  },

  onShow() {
    this.loadTheme();
    this.loadStats();
  },

  loadTheme() {
    const themeId = app.getTodayTheme();
    const themes = {
      1: { name: '多肉花园', desc: '仙人掌、芦荟、生石花…' },
      2: { name: '热带雨林', desc: '龟背竹、绿萝、琴叶榕…' },
      3: { name: '阳台花卉', desc: '月季、茉莉、栀子花…' },
      4: { name: '中草药圃', desc: '金银花、枸杞、黄芪…' },
      5: { name: '沙漠植物', desc: '龙舌兰、胡杨、沙棘…' },
      6: { name: '水生植物', desc: '荷花、睡莲、芦苇…' },
      7: { name: '盲盒主题', desc: '每周轮换，惊喜不断！' },
    };
    const t = themes[themeId] || themes[1];
    this.setData({ themeId, themeName: t.name, themeDesc: t.desc });
  },

  loadStats() {
    const stats = wx.getStorageSync('lglz_stats') || {
      totalGames: 0,
      totalPass: 0,
      totalPlants: 0,
    };
    const garden = wx.getStorageSync('lglz_garden') || [];
    this.setData({ stats, gardenCount: garden.length });
  },

  /**
   * 开始游戏（第一关）
   */
  onStartGame() {
    wx.navigateTo({
      url: '/pages/game/game?mode=normal',
    });
  },

  /**
   * 每日挑战（第二关）
   */
  onStartDaily() {
    wx.navigateTo({
      url: '/pages/game/game?mode=daily',
    });
  },

  /**
   * 去花园
   */
  onGoGarden() {
    wx.navigateTo({
      url: '/pages/garden/garden',
    });
  },

  /**
   * 看排名
   */
  onGoRank() {
    wx.navigateTo({
      url: '/pages/rank/rank',
    });
  },

  onShareAppMessage() {
    return {
      title: '绿了个植 — 第二关通关率不到5%，你敢来挑战吗？',
      path: '/pages/index/index?share=invite',
    };
  },
});
