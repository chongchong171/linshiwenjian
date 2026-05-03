// 常量配置文件

// 云环境配置
module.exports = {
  // 云环境ID
  CLOUD_ENV_ID: 'plant-encyclopedia-8d9x10139590b',
  
  // 数据库集合名称
  DB_COLLECTIONS: {
    PLANTS: 'plants',
    USERS: 'users',
    RANKINGS: 'rankings',
    AI_CHAT: 'ai_chat',
  },
  
  // 存储配置
  STORAGE_PATHS: {
    PLANT_IMAGES: 'plant-images/',
    USER_IMAGES: 'user-images/',
  },
  
  // 缓存过期时间(毫秒)
  CACHE_EXPIRE: {
    SHORT: 5 * 60 * 1000,        // 5分钟
    MEDIUM: 30 * 60 * 1000,      // 30分钟
    LONG: 24 * 60 * 60 * 1000,   // 24小时
  },
  
  // 会员限制配置
  MEMBER_LIMITS: {
    FREE_AI_CHATS_PER_DAY: 10,
    FREE_PLANTS_LIMIT: 50,
  },
  
  // 植物养护周期(天)
  PLANT_CARE: {
    WATER_INTERVAL: 7,           // 浇水间隔
    FERTILIZER_INTERVAL: 30,     // 施肥间隔
  },
}
