//
// 用户友好错误消息
// 将技术错误代码转换为用户友好的中文消息
//

// 错误代码映射表
const ERROR_MESSAGES = {
  // 文件系统错误
  'EACCES': '权限不足，无法访问文件',
  'EPERM': '权限错误，操作被拒绝',
  'ENOENT': '文件或目录不存在',
  'ENOSPC': '磁盘空间不足',
  'EEXIST': '文件已存在',
  'ENOTDIR': '路径不是目录',
  'EISDIR': '路径是目录，不是文件',
  'EBUSY': '文件正在使用中',
  
  // 网络错误
  'NETWORK_ERROR': '网络连接失败，请检查网络设置',
  'TIMEOUT': '请求超时，请稍后重试',
  'ECONNREFUSED': '无法连接到服务器',
  'ECONNRESET': '连接被重置',
  'ENOTFOUND': '无法找到服务器',
  
  // API 相关错误
  'API_KEY_INVALID': 'API Key 无效，请在设置中检查',
  'API_KEY_MISSING': '缺少 API Key',
  'API_QUOTA_EXCEEDED': 'API 配额已用尽',
  'API_RATE_LIMIT': '请求过于频繁，请稍后重试',
  
  // 模板相关错误
  'TEMPLATE_NOT_FOUND': '模板不存在，请重新选择',
  'TEMPLATE_INVALID': '模板格式错误',
  'TEMPLATE_LOAD_FAILED': '模板加载失败',
  
  // 项目相关错误
  'PROJECT_NOT_FOUND': '项目不存在',
  'PROJECT_LOAD_FAILED': '项目加载失败',
  'PROJECT_SAVE_FAILED': '项目保存失败',
  'PROJECT_CREATE_FAILED': '项目创建失败',
  'PROJECT_DELETE_FAILED': '项目删除失败',
  
  // 选项相关错误
  'OPTION_NOT_FOUND': '选项不存在',
  'OPTION_INVALID': '选项格式错误',
  
  // JSON 相关错误
  'JSON_PARSE_ERROR': '数据格式错误，无法解析',
  'JSON_INVALID': '无效的 JSON 数据',
  
  // 通用错误
  'UNKNOWN_ERROR': '发生未知错误，请稍后重试',
  'OPERATION_FAILED': '操作失败',
  'INVALID_PARAMETER': '参数无效',
  'MISSING_PARAMETER': '缺少必填参数'
};

/**
 * 获取用户友好的错误消息
 * @param {Error|string} error - 错误对象或消息
 * @param {string} defaultMsg - 默认消息（当错误代码不在映射表中时使用）
 * @returns {string} 用户友好的错误消息
 */
function getUserFriendlyMessage(error, defaultMsg = '操作失败，请稍后重试') {
  if (!error) return defaultMsg;
  
  // 如果是字符串，直接返回（已经处理过）
  if (typeof error === 'string') {
    // 检查是否包含错误代码
    for (const [code, message] of Object.entries(ERROR_MESSAGES)) {
      if (error.includes(code) || error.toLowerCase().includes(code.toLowerCase())) {
        return message;
      }
    }
    return error;
  }
  
  // 如果是 Error 对象
  if (error.code && ERROR_MESSAGES[error.code]) {
    return ERROR_MESSAGES[error.code];
  }
  
  if (error.message) {
    // 检查消息中是否包含已知错误代码
    for (const [code, message] of Object.entries(ERROR_MESSAGES)) {
      if (error.message.includes(code)) {
        return message;
      }
    }
    return error.message;
  }
  
  return defaultMsg;
}

/**
 * 获取错误代码
 * @param {Error|string} error - 错误对象或消息
 * @returns {string|null} 错误代码
 */
function getErrorCode(error) {
  if (!error) return null;
  
  if (typeof error === 'string') {
    for (const code of Object.keys(ERROR_MESSAGES)) {
      if (error.includes(code)) {
        return code;
      }
    }
    return null;
  }
  
  return error.code || null;
}

/**
 * 添加错误消息到映射表
 * @param {string} code - 错误代码
 * @param {string} message - 用户友好的消息
 */
function registerErrorMessage(code, message) {
  ERROR_MESSAGES[code] = message;
}

module.exports = {
  ERROR_MESSAGES,
  getUserFriendlyMessage,
  getErrorCode,
  registerErrorMessage
};
