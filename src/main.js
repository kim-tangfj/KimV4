//
// Kim 多级分镜提示词助手 - 主进程
//

const { app, BrowserWindow } = require('electron');
const path = require('path');

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
  console.error('[主进程] 未处理的 Promise 拒绝:', reason);
  // 记录到日志文件
  try {
    const fs = require('fs');
    const logPath = path.join(app.getPath('userData'), 'logs', 'main-process-error.log');
    const logDir = path.dirname(logPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] unhandledRejection: ${reason}\n\n`);
  } catch (e) {
    console.error('记录日志失败:', e);
  }
});

// 捕获未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('[主进程] 未捕获的异常:', error);
  // 记录到日志文件
  try {
    const fs = require('fs');
    const logPath = path.join(app.getPath('userData'), 'logs', 'main-process-error.log');
    const logDir = path.dirname(logPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] uncaughtException: ${error.stack}\n\n`);
  } catch (e) {
    console.error('记录日志失败:', e);
  }
  
  // 如果是致命错误，通知用户并退出
  if (error.code === 'EACCES' || error.code === 'EPERM') {
    console.error('[主进程] 权限错误，应用将无法正常运行');
    app.quit();
  }
});

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
