// 常量配置文件 - 绿了个植

// 云环境配置
module.exports = {
  // 云环境ID（绿了个植的云环境）
  CLOUD_ENV_ID: 'cloud1-3gfc6ow0e18ee828',
  
  // 数据库集合名称
  DB_COLLECTIONS: {
    GAMES: 'games',
    USERS: 'users',
    RANKINGS: 'rankings',
  },
  
  // 存储配置
  STORAGE_PATHS: {
    GAME_IMAGES: 'game-images/',
    USER_IMAGES: 'user-images/',
  },
  
  // 缓存过期时间 (毫秒)
  CACHE_EXPIRE: {
    SHORT: 5 * 60 * 1000,        // 5 分钟
    MEDIUM: 30 * 60 * 1000,      // 30 分钟
    LONG: 24 * 60 * 60 * 1000,   // 24 小时
  },
}
