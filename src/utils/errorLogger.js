//
// 错误日志工具
// 提供统一的日志记录功能
//

const fs = require('fs');
const path = require('path');

// 日志目录
let logDir = null;

/**
 * 获取日志目录路径
 * @returns {string} 日志目录路径
 */
function getLogDir() {
  if (!logDir) {
    const { app } = require('electron');
    logDir = path.join(app.getPath('userData'), 'logs');
    // 确保日志目录存在
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }
  return logDir;
}

/**
 * 获取日志文件路径
 * @param {string} type - 日志类型（main-process, renderer, ipc, error）
 * @returns {string} 日志文件路径
 */
function getLogFilePath(type) {
  const logDir = getLogDir();
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return path.join(logDir, `${type}-${date}.log`);
}

/**
 * 格式化日志消息
 * @param {string} level - 日志级别（error, warn, info）
 * @param {string} source - 日志来源（模块名）
 * @param {string} message - 日志消息
 * @param {Error} [error] - 错误对象（可选）
 * @returns {string} 格式化后的日志消息
 */
function formatLogMessage(level, source, message, error = null) {
  const timestamp = new Date().toISOString();
  let logMessage = `[${timestamp}] [${level.toUpperCase()}] [${source}] ${message}`;
  
  if (error) {
    logMessage += `\n  错误代码：${error.code || 'UNKNOWN'}`;
    logMessage += `\n  错误详情：${error.message}`;
    // 仅开发环境记录堆栈跟踪
    if (process.env.NODE_ENV === 'development' && error.stack) {
      logMessage += `\n  堆栈跟踪:\n${error.stack}`;
    }
  }
  
  return logMessage + '\n\n';
}

/**
 * 写入日志文件
 * @param {string} filePath - 日志文件路径
 * @param {string} message - 日志消息
 */
function writeLogFile(filePath, message) {
  try {
    fs.appendFileSync(filePath, message, 'utf8');
  } catch (error) {
    console.error('写入日志文件失败:', error);
  }
}

/**
 * 记录错误日志
 * @param {string} source - 日志来源（模块名）
 * @param {string} message - 错误消息
 * @param {Error} [error] - 错误对象
 * @param {string} [type] - 日志类型（main-process, renderer, ipc）
 */
function logError(source, message, error = null, type = 'error') {
  const logFilePath = getLogFilePath(type);
  const logMessage = formatLogMessage('error', source, message, error);
  
  // 写入日志文件
  writeLogFile(logFilePath, logMessage);
  
  // 开发环境下输出到控制台
  if (process.env.NODE_ENV === 'development') {
    console.error(logMessage);
  }
}

/**
 * 记录警告日志
 * @param {string} source - 日志来源
 * @param {string} message - 警告消息
 */
function logWarn(source, message) {
  const logFilePath = getLogFilePath('warn');
  const logMessage = formatLogMessage('warn', source, message);
  writeLogFile(logFilePath, logMessage);
}

/**
 * 记录信息日志
 * @param {string} source - 日志来源
 * @param {string} message - 信息消息
 */
function logInfo(source, message) {
  const logFilePath = getLogFilePath('info');
  const logMessage = formatLogMessage('info', source, message);
  writeLogFile(logFilePath, logMessage);
}

/**
 * 获取日志文件列表
 * @returns {Array<string>} 日志文件列表
 */
function getLogFiles() {
  const logDir = getLogDir();
  if (!fs.existsSync(logDir)) {
    return [];
  }
  return fs.readdirSync(logDir).filter(file => file.endsWith('.log'));
}

/**
 * 清理旧日志文件（保留最近 7 天）
 */
function cleanupOldLogs(daysToKeep = 7) {
  const logDir = getLogDir();
  if (!fs.existsSync(logDir)) {
    return;
  }
  
  const now = Date.now();
  const maxAge = daysToKeep * 24 * 60 * 60 * 1000;
  
  try {
    const files = fs.readdirSync(logDir);
    for (const file of files) {
      if (!file.endsWith('.log')) continue;
      
      const filePath = path.join(logDir, file);
      const stats = fs.statSync(filePath);
      const age = now - stats.mtimeMs;
      
      if (age > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`已删除旧日志文件：${file}`);
      }
    }
  } catch (error) {
    console.error('清理日志文件失败:', error);
  }
}

module.exports = {
  getLogDir,
  getLogFilePath,
  logError,
  logWarn,
  logInfo,
  getLogFiles,
  cleanupOldLogs
};
