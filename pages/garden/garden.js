// pages/garden/garden.js
Page({
  data: {
    garden: [],
    sections: [
      { id: 1, name: '🌵 多肉区', theme: 1 },
      { id: 2, name: '🌴 雨林区', theme: 2 },
      { id: 3, name: '🌸 花卉区', theme: 3 },
      { id: 4, name: '🌿 草药区', theme: 4 },
      { id: 5, name: '🏜️ 沙漠区', theme: 5 },
      { id: 6, name: '💧 水生区', theme: 6 },
    ],
  },

  onLoad() {
    this.loadGarden();
  },

  onShow() {
    this.loadGarden();
  },

  loadGarden() {
    const garden = wx.getStorageSync('lglz_garden') || [];
    this.setData({ garden });
  },

  /**
   * 查看植物详情
   */
  onViewPlant(e) {
    const plant = e.currentTarget.dataset.plant;
    wx.showToast({
      title: `${plant} - 养护指南开发中`,
      icon: 'none',
      duration: 2000,
    });
  },
});
