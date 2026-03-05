//
// 原生菜单定义
//

const { Menu, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// 日志窗口引用
let logWindows = [];

// 设置原生菜单
function setMainMenu(mainWindow) {
  const template = [
    {
      label: '文件',
      submenu: [
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload' },
        { role: 'forcereload' },
        { role: 'toggledevtools' },
        { type: 'separator' },
        {
          label: '切换深色/浅色主题',
          click: () => {
            mainWindow.webContents.send('toggle-theme');
          }
        },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: '系统',
      submenu: [
        {
          label: '设置',
          click: () => {
            mainWindow.webContents.send('open-settings');
          },
          accelerator: 'CmdOrCtrl+,'
        },
        {
          label: '模板库管理',
          click: () => {
            mainWindow.webContents.send('open-template-library');
          },
          accelerator: 'CmdOrCtrl+T'
        },
        { type: 'separator' },
        {
          label: '日志',
          submenu: [
            {
              label: '开发日志',
              click: () => {
                openLogWindow('dev');
              }
            },
            {
              label: '更新日志',
              click: () => {
                openLogWindow('update');
              }
            }
          ]
        },
        { type: 'separator' },
        {
          label: '自定义选项',
          enabled: false,
          toolTip: '功能开发中...'
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 打开日志窗口
function openLogWindow(type) {
  const logWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    title: type === 'dev' ? '开发日志' : '更新日志',
    frame: true,
    hasShadow: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // 移除菜单栏
  logWindow.removeMenu();

  // 清理关闭的窗口
  logWindow.on('closed', () => {
    logWindows = logWindows.filter(win => win !== logWindow);
  });

  logWindows.push(logWindow);

  const userDataPath = require('electron').app.getPath('userData');
  const logPath = path.join(userDataPath, 'logs', `${type}-log.md`);

  // 如果日志文件不存在，创建空文件
  if (!fs.existsSync(logPath)) {
    const logDir = path.dirname(logPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const initialContent = type === 'dev'
      ? '# 开发日志\n\n记录每次开发迭代的需求和处理内容。\n\n---\n\n'
      : '# 更新日志\n\n记录每次版本更新的内容。\n\n---\n\n';
    fs.writeFileSync(logPath, initialContent, 'utf8');
  }

  // 读取日志内容
  const logContent = fs.readFileSync(logPath, 'utf8');

  // 渲染 Markdown
  const renderedContent = renderMarkdown(logContent);

  // 创建 HTML 页面
  const htmlContent = createLogWindowHTML(type, renderedContent);

  logWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));
}

// 简单的 Markdown 渲染
function renderMarkdown(md) {
  let html = md;
  
  // 转义 HTML 特殊字符
  html = html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  // 标题（按顺序处理，避免冲突）
  html = html.replace(/^### (.+)$/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gim, '<h1>$1</h1>');
  
  // 分隔线
  html = html.replace(/^---+$/gim, '<hr>');
  
  // 列表项
  html = html.replace(/^- \[x\] (.+)$/gim, '<li class="checked">✓ $1</li>');
  html = html.replace(/^- \[ \] (.+)$/gim, '<li class="unchecked">○ $1</li>');
  
  // 换行（保留段落结构）
  const lines = html.split('\n');
  const processedLines = [];
  let inParagraph = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === '') {
      if (inParagraph) {
        processedLines.push('</p>');
        inParagraph = false;
      }
      processedLines.push('<br>');
    } else if (line.startsWith('<h') || line.startsWith('<hr') || line.startsWith('<li')) {
      if (inParagraph) {
        processedLines.push('</p>');
        inParagraph = false;
      }
      processedLines.push(line);
    } else {
      if (!inParagraph) {
        processedLines.push('<p>');
        inParagraph = true;
      }
      processedLines.push(line);
    }
  }
  
  if (inParagraph) {
    processedLines.push('</p>');
  }
  
  return processedLines.join('\n');
}

// 创建日志窗口 HTML
function createLogWindowHTML(type, content) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${type === 'dev' ? '开发日志' : '更新日志'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Microsoft YaHei', sans-serif;
      line-height: 1.8;
      padding: 25px;
      background: #1e1e1e;
      color: #e0e0e0;
      overflow-y: auto;
    }
    .log-container { max-width: 900px; margin: 0 auto; }
    h1 {
      color: #fff;
      font-size: 24px;
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 2px solid #4a9eff;
    }
    h2 {
      color: #fff;
      font-size: 18px;
      margin-top: 25px;
      margin-bottom: 12px;
      padding-left: 10px;
      border-left: 3px solid #4a9eff;
    }
    h3 { color: #fff; font-size: 15px; margin-top: 20px; margin-bottom: 8px; opacity: 0.9; }
    p { margin-bottom: 10px; color: #d0d0d0; }
    ul, ol { margin-left: 25px; margin-bottom: 10px; }
    li { margin-bottom: 5px; }
    li.checked { color: #4caf50; }
    li.unchecked { color: #ff9800; }
    hr { border: none; border-top: 1px solid #404040; margin: 25px 0; }
    .hint { color: #888; font-style: italic; font-size: 13px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="log-container">
    ${content}
  </div>
  <p class="hint">💡 提示：日志文件位于用户数据目录，可直接用文本编辑器修改</p>
</body>
</html>`;
}

// 初始化日志文件
function initializeLogFiles() {
  const { app } = require('electron');
  const userDataPath = app.getPath('userData');
  const logsDir = path.join(userDataPath, 'logs');
  
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  // 开发日志
  const devLogPath = path.join(logsDir, 'dev-log.md');
  if (!fs.existsSync(devLogPath)) {
    const workDevLogPath = path.join(__dirname, '../../../work/dev-log.md');
    if (fs.existsSync(workDevLogPath)) {
      fs.copyFileSync(workDevLogPath, devLogPath);
    } else {
      fs.writeFileSync(devLogPath, '# 开发日志\n\n记录每次开发迭代的需求和处理内容。\n\n---\n\n', 'utf8');
    }
  }

  // 更新日志
  const updateLogPath = path.join(logsDir, 'update-log.md');
  if (!fs.existsSync(updateLogPath)) {
    const workUpdateLogPath = path.join(__dirname, '../../../work/update-log.md');
    if (fs.existsSync(workUpdateLogPath)) {
      fs.copyFileSync(workUpdateLogPath, updateLogPath);
    } else {
      fs.writeFileSync(updateLogPath, '# 更新日志\n\n记录每次版本更新的内容。\n\n---\n\n', 'utf8');
    }
  }
}

module.exports = {
  setMainMenu,
  initializeLogFiles
};
