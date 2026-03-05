//
// 项目管理 IPC 处理器
//

const { ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// 项目数据缓存
let projectDataCache = new Map();

// 文件夹监测定时器
let folderMonitorInterval = null;

// 初始化项目管理 IPC
function initProjectIPC(mainWindow) {
  // 对话框 API
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

  // 文件系统 API
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

  // Shell API
  ipcMain.handle('shell:openPath', async (event, filePath) => {
    try {
      await shell.openPath(filePath);
      return true;
    } catch (error) {
      console.error(`打开路径失败：${filePath}`, error);
      throw error;
    }
  });

  // 项目 API
  ipcMain.handle('project:create', async (event, projectData) => {
    try {
      const baseDir = projectData.baseDir || path.join(require('electron').app.getPath('documents'), 'KimStoryboard');

      let projectInfo, shots, promptTemplates, selected, theme;

      if (projectData.project) {
        projectInfo = projectData.project;
        shots = projectData.shots || [];
        promptTemplates = projectData.promptTemplates || [];
        selected = projectData.selected || {};
        theme = projectData.theme || {};
      } else {
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
        promptTemplates = projectData.promptTemplates || [{
          id: 'default_shot',
          name: '默认片段提示词模板',
          content: '【片段名称】{name} 【总时长】{duration}秒 【画幅】{aspectRatio} 【风格】{style} 【情绪】{mood}\n{scenesPrompt}'
        }];
        selected = projectData.selected || { projectId: projectData.id, shotId: null, sceneId: null };
        theme = projectData.theme || {
          currentTheme: 'light',
          light: { background: '#ffffff', text: '#333333', border: '#e0e0e0', icon: '#000000', hover: '#f0f0f0', selected: '#e8e8e8', promptHighlight: '#666666' },
          dark: { background: '#333333', text: '#e0e0e0', border: '#555555', icon: '#e0e0e0', hover: '#444444', selected: '#555555', promptHighlight: '#bbbbbb' }
        };
      }

      const projectDir = path.join(baseDir, `${projectInfo.name}_${Date.now()}`);
      const assetsDir = path.join(projectDir, 'assets');
      const imagesDir = path.join(assetsDir, 'images');
      const videosDir = path.join(assetsDir, 'videos');
      const audiosDir = path.join(assetsDir, 'audios');

      fs.mkdirSync(imagesDir, { recursive: true });
      fs.mkdirSync(videosDir, { recursive: true });
      fs.mkdirSync(audiosDir, { recursive: true });

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

      return { success: true, projectDir: projectDir, projectJson: projectJson };
    } catch (error) {
      console.error('创建项目失败:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('project:load', async (event, projectDir) => {
    try {
      const projectJsonPath = path.join(projectDir, 'project.json');
      if (!fs.existsSync(projectJsonPath)) {
        return { success: false, error: '项目文件不存在' };
      }
      const projectJson = JSON.parse(fs.readFileSync(projectJsonPath, 'utf8'));
      return { success: true, projectJson: projectJson };
    } catch (error) {
      console.error('加载项目失败:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('project:save', async (event, projectDir, projectJson) => {
    try {
      const projectJsonPath = path.join(projectDir, 'project.json');
      if (projectJson.project) {
        projectJson.project.updatedAt = new Date().toISOString();
      }
      fs.writeFileSync(projectJsonPath, JSON.stringify(projectJson, null, 2), 'utf8');
      return { success: true };
    } catch (error) {
      console.error('保存项目失败:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('project:list', async (event, baseDir) => {
    try {
      const dir = baseDir || path.join(require('electron').app.getPath('documents'), 'KimStoryboard');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        return { success: true, projects: [] };
      }

      const items = fs.readdirSync(dir);
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

      return { success: true, projects: projects };
    } catch (error) {
      console.error('获取项目列表失败:', error);
      return { success: false, error: error.message, projects: [] };
    }
  });

  ipcMain.handle('project:delete', async (event, projectDir) => {
    try {
      if (!fs.existsSync(projectDir)) {
        return { success: false, error: '项目文件夹不存在' };
      }
      fs.rmSync(projectDir, { recursive: true, force: true });
      return { success: true };
    } catch (error) {
      console.error('删除项目失败:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('project:openFolder', async (event, projectDir) => {
    try {
      await shell.openPath(projectDir);
      return { success: true };
    } catch (error) {
      console.error('打开文件夹失败:', error);
      return { success: false, error: error.message };
    }
  });

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
            changes.push({ projectDir: dir, status: 'missing', message: '项目文件丢失' });
          }
        }

        if (changes.length > 0 && mainWindow) {
          mainWindow.webContents.send('folder-monitor:changes', changes);
        }
      }, 30000);

      return { success: true };
    } catch (error) {
      console.error('启动文件夹监测失败:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('project:stopMonitor', async () => {
    if (folderMonitorInterval) {
      clearInterval(folderMonitorInterval);
      folderMonitorInterval = null;
    }
    return { success: true };
  });
}

module.exports = { initProjectIPC };
