const { app, BrowserWindow, ipcMain, dialog, shell, Menu, net } = require('electron');
const path = require('path');
const fs = require('fs');

// 主窗口对象
let mainWindow;

// 项目数据缓存
let projectDataCache = new Map();

// 用户数据目录
const userDataPath = app.getPath('userData');
const configDir = path.join(userDataPath, 'config');
const templatesConfigPath = path.join(configDir, 'templates.json');

// 默认模板文件路径（assets 目录中的模板文件）
const defaultTemplatesPath = path.join(__dirname, '../assets/default-templates.json');

// 确保配置目录存在
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

// 初始化默认模板
function initializeDefaultTemplates() {
  try {
    // 如果模板配置文件不存在，从 assets 复制默认模板
    if (!fs.existsSync(templatesConfigPath)) {
      if (fs.existsSync(defaultTemplatesPath)) {
        // 复制默认模板文件
        fs.copyFileSync(defaultTemplatesPath, templatesConfigPath);
        console.log('已初始化默认模板配置');
      } else {
        // 如果 assets 中也没有模板文件，创建空配置
        const emptyConfig = {
          templates: [],
          activeTemplateId: null
        };
        fs.writeFileSync(templatesConfigPath, JSON.stringify(emptyConfig, null, 2), 'utf8');
        console.log('已创建空模板配置');
      }
    } else {
      console.log('模板配置文件已存在');
    }
  } catch (error) {
    console.error('初始化模板配置失败:', error);
  }
}

// 使用 net 模块发起 HTTP 请求
function makeApiRequest(url, options) {
  return new Promise((resolve, reject) => {
    // 使用 WHATWG URL API
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    
    const request = net.request({
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    });

    let responseData = '';

    request.on('response', (response) => {
      response.on('data', (chunk) => {
        responseData += chunk.toString();
      });

      response.on('end', () => {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve({
            ok: true,
            status: response.statusCode,
            json: () => Promise.resolve(JSON.parse(responseData)),
            text: () => Promise.resolve(responseData)
          });
        } else {
          resolve({
            ok: false,
            status: response.statusCode,
            text: () => Promise.resolve(responseData)
          });
        }
      });
    });

    request.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      request.write(options.body);
    }

    request.end();
  });
}

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
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');
  // mainWindow.webContents.openDevTools();

  setMainMenu();
}

// 设置原生菜单
function setMainMenu() {
  const template = [
    {
      label: '文件',
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
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 应用准备就绪时创建窗口
app.whenReady().then(() => {
  // 初始化默认模板
  initializeDefaultTemplates();
  
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 所有窗口关闭时退出应用（macOS 除外）
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// ========== 基础 IPC 通道 ==========

ipcMain.handle('dialog:openProject', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: '选择项目文件夹'
  });

  if (!result.canceled) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('fs:readFile', async (event, filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`读取文件失败：${filePath}`, error);
    throw error;
  }
});

ipcMain.handle('fs:writeFile', async (event, filePath, data) => {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, data, 'utf8');
    return true;
  } catch (error) {
    console.error(`写入文件失败：${filePath}`, error);
    throw error;
  }
});

ipcMain.handle('fs:exists', async (event, filePath) => {
  return fs.existsSync(filePath);
});

ipcMain.handle('shell:openPath', async (event, filePath) => {
  try {
    await shell.openPath(filePath);
    return true;
  } catch (error) {
    console.error(`打开路径失败：${filePath}`, error);
    throw error;
  }
});

// ========== 项目管理相关 IPC ==========

ipcMain.handle('project:create', async (event, projectData) => {
  try {
    const baseDir = projectData.baseDir || path.join(app.getPath('documents'), 'KimStoryboard');
    
    // 如果 projectData 已经有 project 结构，直接使用
    let projectInfo, shots, promptTemplates, selected, theme;
    
    if (projectData.project) {
      // 已经是完整的项目结构
      projectInfo = projectData.project;
      shots = projectData.shots || [];
      promptTemplates = projectData.promptTemplates || [];
      selected = projectData.selected || {};
      theme = projectData.theme || {};
    } else {
      // 旧的数据结构，需要转换
      projectInfo = {
        id: projectData.id,
        name: projectData.name,
        description: projectData.description || '',
        status: 'draft',
        aspectRatio: projectData.aspectRatio || '16:9',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        filePath: '',
        projectDir: '',
        rootAssetsDir: ''
      };
      shots = projectData.shots || [];
      promptTemplates = projectData.promptTemplates || [
        {
          id: 'default_shot',
          name: '默认片段提示词模板',
          content: '【片段名称】{name} 【总时长】{duration}秒 【画幅】{aspectRatio} 【风格】{style} 【情绪】{mood}\n{scenesPrompt}'
        }
      ];
      selected = projectData.selected || {
        projectId: projectData.id,
        shotId: null,
        sceneId: null
      };
      theme = projectData.theme || {
        currentTheme: 'light',
        light: {
          background: '#ffffff',
          text: '#333333',
          border: '#e0e0e0',
          icon: '#000000',
          hover: '#f0f0f0',
          selected: '#e8e8e8',
          promptHighlight: '#666666'
        },
        dark: {
          background: '#333333',
          text: '#e0e0e0',
          border: '#555555',
          icon: '#e0e0e0',
          hover: '#444444',
          selected: '#555555',
          promptHighlight: '#bbbbbb'
        }
      };
    }
    
    const projectDir = path.join(baseDir, `${projectInfo.name}_${Date.now()}`);
    const assetsDir = path.join(projectDir, 'assets');
    const imagesDir = path.join(assetsDir, 'images');
    const videosDir = path.join(assetsDir, 'videos');
    const audiosDir = path.join(assetsDir, 'audios');
    
    // 创建目录结构
    fs.mkdirSync(imagesDir, { recursive: true });
    fs.mkdirSync(videosDir, { recursive: true });
    fs.mkdirSync(audiosDir, { recursive: true });
    
    // 构建完整的 project.json
    const projectJson = {
      project: {
        ...projectInfo,
        filePath: path.join(projectDir, 'project.json'),
        projectDir: projectDir,
        rootAssetsDir: assetsDir
      },
      shots: shots,
      promptTemplates: promptTemplates,
      selected: selected,
      theme: theme
    };
    
    fs.writeFileSync(path.join(projectDir, 'project.json'), JSON.stringify(projectJson, null, 2), 'utf8');
    
    return {
      success: true,
      projectDir: projectDir,
      projectJson: projectJson
    };
  } catch (error) {
    console.error('创建项目失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('project:load', async (event, projectDir) => {
  try {
    const projectJsonPath = path.join(projectDir, 'project.json');
    if (!fs.existsSync(projectJsonPath)) {
      return {
        success: false,
        error: '项目文件不存在'
      };
    }
    
    const projectJson = JSON.parse(fs.readFileSync(projectJsonPath, 'utf8'));
    return {
      success: true,
      projectJson: projectJson
    };
  } catch (error) {
    console.error('加载项目失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('project:save', async (event, projectDir, projectJson) => {
  try {
    const projectJsonPath = path.join(projectDir, 'project.json');
    
    if (projectJson.project) {
      projectJson.project.updatedAt = new Date().toISOString();
    }
    
    fs.writeFileSync(projectJsonPath, JSON.stringify(projectJson, null, 2), 'utf8');
    
    return {
      success: true
    };
  } catch (error) {
    console.error('保存项目失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('project:list', async (event, baseDir) => {
  try {
    const dir = baseDir || path.join(app.getPath('documents'), 'KimStoryboard');
    console.log('项目列表 - 扫描目录:', dir);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log('项目列表 - 目录不存在，已创建');
      return {
        success: true,
        projects: []
      };
    }

    const items = fs.readdirSync(dir);
    console.log('项目列表 - 目录内容:', items);
    const projects = [];

    for (const item of items) {
      const itemPath = path.join(dir, item);
      if (fs.statSync(itemPath).isDirectory()) {
        const projectJsonPath = path.join(itemPath, 'project.json');
        if (fs.existsSync(projectJsonPath)) {
          try {
            const projectJson = JSON.parse(fs.readFileSync(projectJsonPath, 'utf8'));
            projects.push({
              id: projectJson.project?.id || item,
              name: projectJson.project?.name || item,
              description: projectJson.project?.description || '',
              status: projectJson.project?.status || 'draft',
              aspectRatio: projectJson.project?.aspectRatio || '16:9',
              createdAt: projectJson.project?.createdAt || '',
              updatedAt: projectJson.project?.updatedAt || '',
              filePath: projectJsonPath,
              projectDir: itemPath,
              rootAssetsDir: projectJson.project?.rootAssetsDir || path.join(itemPath, 'assets')
            });
          } catch (e) {
            console.error(`读取项目文件失败：${projectJsonPath}`, e);
          }
        }
      }
    }

    console.log('项目列表 - 找到项目数量:', projects.length);
    return {
      success: true,
      projects: projects
    };
  } catch (error) {
    console.error('获取项目列表失败:', error);
    return {
      success: false,
      error: error.message,
      projects: []
    };
  }
});

ipcMain.handle('project:delete', async (event, projectDir) => {
  try {
    if (!fs.existsSync(projectDir)) {
      return {
        success: false,
        error: '项目文件夹不存在'
      };
    }
    
    fs.rmSync(projectDir, { recursive: true, force: true });
    
    return {
      success: true
    };
  } catch (error) {
    console.error('删除项目失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('project:openFolder', async (event, projectDir) => {
  try {
    await shell.openPath(projectDir);
    return {
      success: true
    };
  } catch (error) {
    console.error('打开文件夹失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// 文件夹监测
let folderMonitorInterval = null;

ipcMain.handle('project:startMonitor', async (event, projectDirs) => {
  try {
    if (folderMonitorInterval) {
      clearInterval(folderMonitorInterval);
    }
    
    folderMonitorInterval = setInterval(() => {
      const changes = [];
      for (const dir of projectDirs) {
        const projectJsonPath = path.join(dir, 'project.json');
        if (!fs.existsSync(projectJsonPath)) {
          changes.push({
            projectDir: dir,
            status: 'missing',
            message: '项目文件丢失'
          });
        }
      }
      
      if (changes.length > 0 && mainWindow) {
        mainWindow.webContents.send('folder-monitor:changes', changes);
      }
    }, 30000);
    
    return { success: true };
  } catch (error) {
    console.error('启动文件夹监测失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('project:stopMonitor', async () => {
  if (folderMonitorInterval) {
    clearInterval(folderMonitorInterval);
    folderMonitorInterval = null;
  }

  return { success: true };
});

// ========== LLM API 调用 ==========

ipcMain.handle('api:testConnection', async (event, provider, apiKey, model) => {
  try {
    const config = getApiConfig(provider, apiKey);
    const url = `${config.baseUrl}/chat/completions`;

    const response = await makeApiRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || config.defaultModel,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10
      })
    });

    if (response.ok) {
      return { success: true };
    } else {
      const errorText = await response.text();
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.error('测试连接失败:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('api:callLlm', async (event, provider, apiKey, model, prompt) => {
  try {
    const config = getApiConfig(provider, apiKey);
    const url = `${config.baseUrl}/chat/completions`;

    const response = await makeApiRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || config.defaultModel,
        messages: [
          {
            role: 'system',
            content: 'You are a professional storyboard script assistant. Generate structured JSON data only, no other text.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        content: data.choices[0].message.content
      };
    } else {
      const errorText = await response.text();
      return { success: false, error: errorText };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

function getApiConfig(provider, apiKey) {
  const configs = {
    deepseek: {
      baseUrl: 'https://api.deepseek.com',
      defaultModel: 'deepseek-chat'
    },
    doubao: {
      baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
      defaultModel: 'doubao-pro-4k'
    },
    qianwen: {
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      defaultModel: 'qwen-turbo'
    }
  };

  return configs[provider] || configs.deepseek;
}

// ========== 模板配置管理 ==========

ipcMain.handle('template:load', async () => {
  try {
    if (fs.existsSync(templatesConfigPath)) {
      const data = fs.readFileSync(templatesConfigPath, 'utf8');
      const config = JSON.parse(data);
      return {
        success: true,
        config: config
      };
    } else {
      // 返回默认配置
      return {
        success: true,
        config: {
          templates: [],
          activeTemplateId: null
        }
      };
    }
  } catch (error) {
    console.error('加载模板配置失败:', error);
    return {
      success: false,
      error: error.message,
      config: {
        templates: [],
        activeTemplateId: null
      }
    };
  }
});

ipcMain.handle('template:save', async (event, config) => {
  try {
    fs.writeFileSync(templatesConfigPath, JSON.stringify(config, null, 2), 'utf8');
    return {
      success: true
    };
  } catch (error) {
    console.error('保存模板配置失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('template:backup', async () => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: '备份模板配置',
      defaultPath: 'templates-backup.json',
      filters: [
        { name: 'JSON Files', extensions: ['json'] }
      ]
    });

    if (!result.canceled && result.filePath) {
      let filePath = result.filePath;
      // 确保文件扩展名为.json
      if (!filePath.endsWith('.json')) {
        filePath += '.json';
      }
      
      if (fs.existsSync(templatesConfigPath)) {
        // 如果配置文件存在，直接复制
        fs.copyFileSync(templatesConfigPath, filePath);
      } else {
        // 如果配置文件不存在，创建默认的备份文件
        const defaultConfig = {
          templates: [],
          activeTemplateId: null
        };
        fs.writeFileSync(filePath, JSON.stringify(defaultConfig, null, 2), 'utf8');
      }
      return {
        success: true,
        filePath: filePath
      };
    }

    return {
      success: false,
      canceled: true
    };
  } catch (error) {
    console.error('备份模板配置失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('template:restore', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '恢复模板配置',
      properties: ['openFile'],
      filters: [
        { name: 'JSON Files', extensions: ['json'] }
      ]
    });

    if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
      const backupPath = result.filePaths[0];
      fs.copyFileSync(backupPath, templatesConfigPath);
      return {
        success: true
      };
    }

    return {
      success: false,
      canceled: true
    };
  } catch (error) {
    console.error('恢复模板配置失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('template:getPath', async () => {
  return {
    success: true,
    path: configDir, // 返回配置文件夹路径而不是文件路径
    filePath: templatesConfigPath // 同时返回文件路径供备份恢复使用
  };
});