// pages/rank/rank.js
Page({
  data: {
    ranks: [],
    myRank: null,
    date: '',
  },

  onLoad() {
    this.loadRank();
  },

  onShow() {
    this.loadRank();
  },

  loadRank() {
    const date = this.getTodayStr();
    this.setData({ date });

    // 模拟数据（实际应从云数据库获取）
    const mockRanks = [
      { rank: 1, name: '植物大师', time: '1:23', props: 0 },
      { rank: 2, name: '绿手指', time: '1:45', props: 1 },
      { rank: 3, name: '花仙子', time: '2:01', props: 1 },
      { rank: 4, name: '草药师', time: '2:18', props: 2 },
      { rank: 5, name: '叶行者', time: '2:35', props: 2 },
      { rank: 6, name: '根猎人', time: '2:52', props: 3 },
      { rank: 7, name: '种子达人', time: '3:10', props: 3 },
      { rank: 8, name: '花粉收集者', time: '3:28', props: 3 },
      { rank: 9, name: '光合作用', time: '3:45', props: 4 },
      { rank: 10, name: '叶绿素', time: '4:02', props: 4 },
    ];

    this.setData({ ranks: mockRanks });
  },

  getTodayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },
});
