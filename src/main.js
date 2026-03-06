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
      // 禁用默认的键盘快捷键（如 Ctrl+R、F5 等）
      acceleratorWorksWhenHidden: false
    },
    // 禁用菜单栏（Windows/Linux）
    autoHideMenuBar: true
  });

  mainWindow.loadFile('index.html');
  //mainWindow.webContents.openDevTools();

  // 禁用所有键盘快捷键
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // 允许 F12 打开 DevTools
    if (input.key === 'F12') return;
    // 允许 Ctrl+Shift+I 打开 DevTools
    if (input.key === 'I' && input.control && input.shift) return;
    // 允许 Ctrl+C/V/X/A 等编辑快捷键
    if (input.control && ['C', 'V', 'X', 'A', 'Z', 'Y'].includes(input.key.toUpperCase())) return;
    // 允许箭头键、Tab、Enter 等导航键
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Escape'].includes(input.key)) return;
    // 允许字母、数字、符号键
    if (input.key.length === 1 && !input.control && !input.alt) return;
    // 阻止其他所有键
    // event.preventDefault();
  });

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
