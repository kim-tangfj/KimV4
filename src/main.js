//
// Kim 多级分镜提示词助手 - 主进程
//

const { app, BrowserWindow } = require('electron');
const path = require('path');
const { logError, logInfo, cleanupOldLogs } = require('./utils/errorLogger');

// 导入处理器模块
const { initProjectIPC } = require('./handlers/project');
const { initApiIPC } = require('./handlers/api');
const { initTemplateIPC } = require('./handlers/template');
const { initOptionsIPC, initializeCustomOptions } = require('./handlers/options');

// 导入工具模块
const { setMainMenu, initializeLogFiles } = require('./utils/menu');
const { initializeDefaultTemplates } = require('./handlers/template');

// 主窗口对象
let mainWindow;

// ========== 全局错误处理 开始 ==========

// 捕获未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
  const errorMsg = reason?.message || String(reason);
  console.error('[主进程] 未处理的 Promise 拒绝:', errorMsg);
  // 记录到日志文件
  logError('main-process', '未处理的 Promise 拒绝', reason instanceof Error ? reason : new Error(errorMsg));
});

// 捕获未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('[主进程] 未捕获的异常:', error.message);
  // 记录日志
  logError('main-process', '未捕获的异常', error);
  
  // 如果是致命错误，通知用户并退出
  if (error.code === 'EACCES' || error.code === 'EPERM') {
    logError('main-process', '权限错误，应用将无法正常运行', error);
    app.quit();
  }
});

// 启动时清理旧日志
cleanupOldLogs(7);
logInfo('main-process', '应用启动');

// ========== 全局错误处理 结束 ==========

// 创建主窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      // 关键修复：启用 sandbox 模式
      sandbox: true,
      // 禁用 web 安全策略
      webSecurity: true,
      // 允许本地文件访问
      allowRunningInsecureContent: false
    }
  });

  mainWindow.loadFile('index.html');
  //mainWindow.webContents.openDevTools();

  // 设置原生菜单
  setMainMenu(mainWindow);
}

// 应用准备就绪时创建窗口
app.whenReady().then(() => {
  // 初始化日志文件
  initializeLogFiles();

  // 初始化默认模板
  initializeDefaultTemplates();
  
  // 初始化自定义选项
  initializeCustomOptions();

  // 初始化 IPC 处理器
  initProjectIPC(mainWindow);
  initApiIPC();
  initTemplateIPC();
  initOptionsIPC();

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 所有窗口关闭时退出应用（macOS 除外）
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// ========== 日志记录 IPC 处理器 ==========
const { ipcMain } = require('electron');

// 渲染进程错误日志记录
ipcMain.handle('log:error', async (event, logEntry) => {
  logError('renderer', logEntry.message, logEntry.errorDetails ? new Error(logEntry.errorDetails) : null, 'renderer');
  return { success: true };
});
