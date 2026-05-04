// pages/home/home.js
Page({
  data: {
    videoSrc: '' // 云存储视频路径
  },

  onLoad() {
    console.log('首页加载');
    
    // 初始化云开发并获取视频
    if (wx.cloud) {
      this.getVideoFromCloud();
    }
  },

  /**
   * 从云存储获取视频
   */
  getVideoFromCloud() {
    const fileID = 'cloud://cloud1-3gfc6ow0e18ee828.636c-cloud1-3gfc6ow0e18ee828-1416136067/去水印版.mp4';
    
    console.log('开始获取云存储视频:', fileID);
    
    wx.cloud.getTempFileURL({
      fileList: [fileID],
      success: res => {
        console.log('云存储响应:', res);
        if (res.fileList && res.fileList.length > 0) {
          const tempURL = res.fileList[0].tempFileURL;
          this.setData({ videoSrc: tempURL });
          console.log('视频加载成功:', tempURL);
        } else {
          console.error('云存储返回空结果');
          this.setData({ videoSrc: '/static/videos/home-intro.mp4' });
        }
      },
      fail: err => {
        console.error('获取视频失败:', err);
        // 降级方案：使用本地视频
        this.setData({ videoSrc: '/static/videos/home-intro.mp4' });
      }
    });
  },

  /**
   * 开始游戏
   */
  onStartGame() {
    wx.navigateTo({
      url: '/pages/game/game'
    });
  },

  onVideoError(e) {
    console.error('视频播放错误:', e);
    wx.showToast({ title: '视频加载失败', icon: 'none' });
  }
});
