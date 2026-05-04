// pages/home/home.js
Page({
  data: {
    videoSrc: 'cloud://cloud1-3gfc6ow0e18ee828.636c-cloud1-3gfc6ow0e18ee828-1416136067/去水印版.mp4' // 默认云存储
  },

  onLoad() {
    console.log('首页加载');
    
    // 直接从云存储获取视频
    if (wx.cloud) {
      this.getVideoFromCloud();
    } else {
      // 如果云环境未初始化，降级到本地
      console.log('云环境未初始化，使用本地视频');
      this.setData({ videoSrc: '/static/videos/home-intro.mp4' });
    }
  },

  /**
   * 从云存储获取视频
   */
  getVideoFromCloud() {
    const fileID = 'cloud://cloud1-3gfc6ow0e18ee828.636c-cloud1-3gfc6ow0e18ee828-1416136067/去水印版.mp4';
    
    console.log('尝试获取云存储视频:', fileID);
    console.log('当前云环境:', wx.cloud.config ? wx.cloud.config.env : '未初始化');
    
    wx.cloud.getTempFileURL({
      fileList: [fileID],
      success: res => {
        console.log('云存储响应:', res);
        if (res.fileList && res.fileList.length > 0 && res.fileList[0].tempFileURL) {
          const tempURL = res.fileList[0].tempFileURL;
          this.setData({ videoSrc: tempURL });
          console.log('✅ 视频加载成功:', tempURL);
        } else {
          console.log('❌ 云存储返回空结果，降级使用本地视频');
          this.setData({ videoSrc: '/static/videos/home-intro.mp4' });
        }
      },
      fail: err => {
        console.error('❌ 云存储获取失败，降级使用本地视频:', err);
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
    // 如果云存储视频失败，切换回本地视频
    if (this.data.videoSrc.startsWith('http')) {
      this.setData({ videoSrc: '/static/videos/home-intro.mp4' });
    }
  }
});
