// 枚举配置文件

// 日志级别
const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
}

// 请求状态
const RequestStatus = {
  SUCCESS: 'success',
  FAILED: 'failed',
  TIMEOUT: 'timeout',
}

// 植物状态
const PlantStatus = {
  HEALTHY: 'healthy',
  NEEDS_WATER: 'needs_water',
  NEEDS_FERTILIZER: 'needs_fertilizer',
  NEEDS_SUNLIGHT: 'needs_sunlight',
}

// 用户类型
const UserType = {
  FREE: 'free',
  VIP: 'vip',
  PREMIUM: 'premium',
}

// 云函数名称
const CloudFunctions = {
  IDENTIFY_PLANT: 'identifyPlant',
  GET_CARE_GUIDE: 'getCareGuide',
  SAVE_RANKING: 'saveRanking',
  GET_RANKINGS: 'getRankings',
}

module.exports = {
  LogLevel,
  RequestStatus,
  PlantStatus,
  UserType,
  CloudFunctions,
}
