//
// Kim 多级分镜提示词助手 - 主进程
//

const { app, BrowserWindow, ipcMain, dialog, safeStorage } = require('electron');
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

// 自动更新
const { autoUpdater } = require('electron-updater');

// 主窗口对象
let mainWindow;

// ========== 自动更新配置 ==========

// 配置更新源
autoUpdater.autoDownload = false; // 不自动下载
autoUpdater.autoInstallOnAppQuit = true; // 退出时自动安装

// 开发环境禁用自动更新
if (!app.isPackaged) {
  console.log('[主进程] 开发环境，禁用自动更新');
  autoUpdater.autoDownload = false;
  autoUpdater.allowPrerelease = true; // 允许预发布版本
}

// 检查更新
function checkForUpdates() {
  if (!app.isPackaged) {
    console.log('[主进程] 开发环境，跳过更新检查');
    return;
  }
  console.log('[主进程] 开始检查更新...');
  autoUpdater.checkForUpdates();
}

// 监听更新事件
autoUpdater.on('checking-for-update', () => {
  console.log('正在检查更新...');
  mainWindow?.webContents?.send('update-checking');
  // 显示模态框，禁用操作
  mainWindow?.webContents?.send('update-modal-show', { type: 'checking' });
});

autoUpdater.on('update-available', (info) => {
  console.log('发现新版本:', info.version);
  mainWindow?.webContents?.send('update-available', info);
});

autoUpdater.on('update-not-available', () => {
  console.log('已是最新版本');
  mainWindow?.webContents?.send('update-not-available');
  // 隐藏模态框
  mainWindow?.webContents?.send('update-modal-hide');
});

autoUpdater.on('download-progress', (progressObj) => {
  console.log('下载进度:', progressObj.percent);
  mainWindow?.webContents?.send('update-download-progress', progressObj);
  // 更新模态框进度
  mainWindow?.webContents?.send('update-modal-progress', progressObj);
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('更新已下载，准备安装');
  mainWindow?.webContents?.send('update-downloaded', info);
  // 更新模态框状态
  mainWindow?.webContents?.send('update-modal-downloaded', info);
});

autoUpdater.on('error', (err) => {
  console.error('更新失败:', err);
  mainWindow?.webContents?.send('update-error', err);
  // 隐藏模态框
  mainWindow?.webContents?.send('update-modal-hide');
});

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

  // 初始化更新 IPC 处理器
  initUpdateIPC();

  createWindow();

  // 延迟检查更新（5 秒后）
  setTimeout(checkForUpdates, 5000);

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 所有窗口关闭时退出应用（macOS 除外）
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// ========== 日志记录 IPC 处理器 ==========

// 渲染进程错误日志记录
ipcMain.handle('log:error', async (event, logEntry) => {
  logError('renderer', logEntry.message, logEntry.errorDetails ? new Error(logEntry.errorDetails) : null, 'renderer');
  return { success: true };
});

// 获取默认存储路径
ipcMain.handle('app:getDefaultStoragePath', async () => {
  try {
    const documentsPath = app.getPath('documents');
    const defaultPath = path.join(documentsPath, 'KimStoryboard');
    return { success: true, path: defaultPath };
  } catch (error) {
    console.error('获取文档目录失败:', error);
    return { success: false, error: error.message };
  }
});

// ========== 加密存储 IPC 处理器 ==========
// 加密 API Key（使用系统级加密存储）
ipcMain.handle('crypto:encrypt', async (event, plainText) => {
  try {
    if (!plainText) {
      return { success: true, encrypted: '' };
    }
    const encrypted = safeStorage.encryptString(plainText);
    // 将 Buffer 转换为 Base64 字符串以便存储
    return { success: true, encrypted: encrypted.toString('base64') };
  } catch (error) {
    console.error('加密失败:', error);
    return { success: false, error: error.message };
  }
});

// 解密 API Key
ipcMain.handle('crypto:decrypt', async (event, encryptedBase64) => {
  try {
    if (!encryptedBase64) {
      return { success: true, decrypted: '' };
    }
    const encryptedBuffer = Buffer.from(encryptedBase64, 'base64');
    const decrypted = safeStorage.decryptString(encryptedBuffer);
    return { success: true, decrypted: decrypted };
  } catch (error) {
    console.error('解密失败:', error);
    return { success: false, error: error.message };
  }
});

// ========== 恢复出厂设置 IPC 处理器 ==========
ipcMain.handle('app:factoryReset', async (event) => {
  const { app, dialog } = require('electron');
  const fs = require('fs');
  
  try {
    // 显示确认对话框
    const { response } = await dialog.showMessageBox(mainWindow, {
      type: 'warning',
      buttons: ['确认重置', '取消'],
      defaultId: 1,
      title: '恢复出厂设置',
      message: '确定要恢复出厂设置吗？',
      detail: '此操作将清空所有用户设置（包括存储路径、API Keys、模板配置、自定义选项等），应用将重启。此操作不可撤销！',
      cancelId: 1
    });

    if (response !== 0) {
      return { success: false, canceled: true };
    }

    // 清除 localStorage（通过渲染进程）
    mainWindow?.webContents?.send('factory-reset-execute');

    // 删除配置文件
    const userDataPath = app.getPath('userData');
    const configDir = path.join(userDataPath, 'config');
    
    // 删除模板配置
    const templatesConfigPath = path.join(configDir, 'templates.json');
    if (fs.existsSync(templatesConfigPath)) {
      fs.unlinkSync(templatesConfigPath);
      console.log('[恢复出厂设置] 已删除模板配置:', templatesConfigPath);
    }

    // 删除自定义选项配置
    const optionsConfigPath = path.join(configDir, 'options.json');
    if (fs.existsSync(optionsConfigPath)) {
      fs.unlinkSync(optionsConfigPath);
      console.log('[恢复出厂设置] 已删除自定义选项配置:', optionsConfigPath);
    }

    // 删除日志目录
    const logsDir = path.join(userDataPath, 'logs');
    if (fs.existsSync(logsDir)) {
      fs.rmSync(logsDir, { recursive: true, force: true });
      console.log('[恢复出厂设置] 已删除日志目录:', logsDir);
    }

    console.log('[恢复出厂设置] 完成，准备重启应用');

    // 延迟重启应用
    setTimeout(() => {
      app.relaunch();
      app.exit(0);
    }, 1000);

    return { success: true };
  } catch (error) {
    console.error('[恢复出厂设置] 失败:', error);
    return { success: false, error: error.message };
  }
});

// ========== 自动更新 IPC 处理器 ==========
function initUpdateIPC() {
  // 检查更新
  ipcMain.handle('update:check', () => {
    checkForUpdates();
  });

  // 开始下载更新
  ipcMain.handle('update:start-download', () => {
    console.log('[更新] 开始下载更新');
    autoUpdater.downloadUpdate();
  });

  // 安装并重启
  ipcMain.handle('update:install-and-restart', () => {
    console.log('[更新] 安装并重启');
    autoUpdater.quitAndInstall(false, true);
  });
}
