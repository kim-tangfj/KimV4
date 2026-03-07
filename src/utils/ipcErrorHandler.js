//
// IPC 错误处理工具
// 提供统一的 IPC 错误处理包装器
//

/**
 * 统一的 IPC 错误处理包装器
 * @param {Function} handler - IPC 处理函数
 * @param {string} operation - 操作描述（用于错误日志）
 * @returns {Promise<any>} - 处理结果
 */
async function withErrorHandler(handler, operation) {
  try {
    return await handler();
  } catch (error) {
    console.error(`[IPC 错误] ${operation}:`, error.message);
    
    // 返回统一的错误格式
    return {
      success: false,
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
}

/**
 * 验证 IPC 参数
 * @param {Object} params - 参数对象
 * @param {Array<string>} requiredFields - 必填字段列表
 * @throws {Error} - 参数验证失败时抛出错误
 */
function validateParams(params, requiredFields) {
  if (!params || typeof params !== 'object') {
    throw new Error('参数必须是对象');
  }
  
  for (const field of requiredFields) {
    if (params[field] === undefined || params[field] === null) {
      throw new Error(`缺少必填参数：${field}`);
    }
  }
}

/**
 * 安全的 JSON 解析
 * @param {string} jsonString - JSON 字符串
 * @returns {Object|null} - 解析结果，失败返回 null
 */
function safeJsonParse(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('[JSON 解析错误]:', error.message);
    return null;
  }
}

/**
 * 安全的文件操作包装器
 * @param {Function} fileOperation - 文件操作函数
 * @param {string} filePath - 文件路径
 * @param {string} operation - 操作类型（read/write/delete）
 * @returns {Promise<any>} - 操作结果
 */
async function withFileSafety(fileOperation, filePath, operation) {
  const fs = require('fs');
  const path = require('path');
  
  try {
    // 验证文件路径
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('无效的文件路径');
    }
    
    // 检查路径遍历攻击
    const normalizedPath = path.normalize(filePath);
    if (normalizedPath.includes('..')) {
      throw new Error('不允许的文件路径');
    }
    
    return await fileOperation();
  } catch (error) {
    console.error(`[文件操作错误] ${operation} ${filePath}:`, error.message);
    throw error;
  }
}

module.exports = {
  withErrorHandler,
  validateParams,
  safeJsonParse,
  withFileSafety
};
