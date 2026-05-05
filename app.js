// app.js
App({
  globalData: {
    // 游戏版本
    version: '1.0.0',
    // 云环境 ID（绿了个植的云环境）
    cloudEnv: 'cloud1-3gfc6ow0e18ee828',
    // 用户数据
    userId: '',
    // 游戏统计
    stats: {
      totalGames: 0,
      totalPass: 0,
      totalPlants: 0,
    },
  },

  onLaunch() {
    this.initCloud();
    this.initUser();
  },

  initCloud() {
    if (wx.cloud) {
      wx.cloud.init({
        env: this.globalData.cloudEnv,
        traceUser: false,
      });
    }
  },

  initUser() {
    const userId = wx.getStorageSync('lglz_userId');
    if (userId) {
      this.globalData.userId = userId;
    } else {
      this.globalData.userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      wx.setStorageSync('lglz_userId', this.globalData.userId);
    }
  },

  /**
   * 获取今日主题
   */
  getTodayTheme() {
    const day = new Date().getDay(); // 0=周日
    const themeMap = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 0: 7 };
    return themeMap[day] || 1;
  },

  /**
   * 获取今日日期字符串 YYYYMMDD
   */
  getTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  },
});
