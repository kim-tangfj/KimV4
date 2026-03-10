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

// ========== 单实例锁（防止多次启动）==========
// 请求单实例锁，如果返回 false 说明已经有实例在运行
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // 当前不是第一个实例，退出
  console.log('[主进程] 检测到已有实例在运行，退出当前进程');
  dialog.showErrorBox('Kim 分镜助手', '程序已经在运行中，请勿重复启动！\n\n如果需要在多个窗口中使用，请使用"文件 → 新建窗口"菜单。');
  app.exit(0);
} else {
  // 当前是第一个实例，监听其他实例的启动请求
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // 当有其他实例尝试启动时，聚焦到主窗口
    console.log('[主进程] 检测到第二个实例尝试启动，聚焦到主窗口');
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      mainWindow.show();
    }
  });
}

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
  // 检查并迁移旧数据（在初始化模板和选项之前）
  const migrationResult = migrateOldData();

  // 初始化日志文件
  initializeLogFiles();

  // 初始化默认模板
  initializeDefaultTemplates();

  // 初始化自定义选项
  initializeCustomOptions();

  // 如果有迁移数据，通知渲染进程
  if (migrationResult.needMigrate) {
    setTimeout(() => {
      mainWindow?.webContents?.send('data-migration-complete', migrationResult);
    }, 1000);
  }

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

// ========== 数据迁移 ==========
// 迁移旧版本数据到新路径
function migrateOldData() {
  const userDataManager = require('./utils/userDataManager');
  
  const migrationCheck = userDataManager.checkMigrationNeeded();
  
  if (migrationCheck.needMigrate) {
    console.log('[数据迁移] 发现旧数据，开始迁移...');
    const result = userDataManager.migrateData();
    if (result.success) {
      console.log('[数据迁移] 完成，迁移了:', result.migrated);
      return { needMigrate: true, migrated: result.migrated, success: true };
    } else {
      console.error('[数据迁移] 失败:', result.error);
      return { needMigrate: true, success: false, error: result.error };
    }
  }
  
  return { needMigrate: false };
}

// ========== 恢复出厂设置 IPC 处理器 ==========
ipcMain.handle('app:factoryReset', async (event) => {
  const { app, dialog } = require('electron');
  const userDataManager = require('./utils/userDataManager');

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

    // 使用 userDataManager 清除配置文件
    const result = userDataManager.clearAllConfig();
    
    if (!result.success) {
      return { success: false, error: result.error };
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
