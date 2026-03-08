//
// 项目管理 IPC 处理器
//

const { ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { withErrorHandler, validateParams, withFileSafety } = require('../utils/ipcErrorHandler');

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

  // 通用文件选择对话框
  ipcMain.handle('dialog:showOpenDialog', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
  });

  // 文件系统 API
  ipcMain.handle('fs:readFile', async (event, filePath) => {
    return withFileSafety(async () => {
      return fs.readFileSync(filePath, 'utf8');
    }, filePath, '读取');
  });

  ipcMain.handle('fs:writeFile', async (event, filePath, data) => {
    return withFileSafety(async () => {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, data, 'utf8');
      return true;
    }, filePath, '写入');
  });

  ipcMain.handle('fs:exists', async (event, filePath) => {
    return fs.existsSync(filePath);
  });

  // 获取文件真实路径（用于 sandbox 模式下的 File 对象）
  ipcMain.handle('fs:getFilePaths', async (event, files) => {
    // 在 sandbox 模式下，File 对象没有 path 属性
    // 这个 API 暂时保留，用于未来扩展
    // 目前我们通过 dialog.showOpenDialog 获取真实路径
    return { success: false, error: '不支持的操作' };
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
    return withErrorHandler(async () => {
      // 验证参数：检查 projectData.project.name 或 projectData.name
      if (!projectData.project && !projectData.name) {
        throw new Error('缺少必填参数：name 或 project.name');
      }
      
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

      // 为所有片段和镜头生成唯一 ID（如果缺失）
      const timestamp = Date.now();
      if (shots && Array.isArray(shots)) {
        shots.forEach((shot, shotIndex) => {
          // 为片段生成 ID
          if (!shot.id) {
            shot.id = `shot_${timestamp}_${shotIndex}`;
            console.log('[创建项目] 为片段添加 ID:', shot.name || `片段${shotIndex}`, '->', shot.id);
          }
          // 为镜头生成 ID
          if (shot.scenes && Array.isArray(shot.scenes)) {
            shot.scenes.forEach((scene, sceneIndex) => {
              if (!scene.id) {
                scene.id = `scene_${timestamp}_${shotIndex}_${sceneIndex}`;
                console.log('[创建项目] 为镜头添加 ID:', scene.name || `镜头${sceneIndex}`, '->', scene.id);
              }
            });
          }
        });
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
    }, '创建项目');
  });

  ipcMain.handle('project:load', async (event, projectDir) => {
    return withErrorHandler(async () => {
      validateParams({ projectDir }, ['projectDir']);
      
      const projectJsonPath = path.join(projectDir, 'project.json');
      if (!fs.existsSync(projectJsonPath)) {
        return { success: false, error: '项目文件不存在' };
      }
      const projectJson = JSON.parse(fs.readFileSync(projectJsonPath, 'utf8'));
      return { success: true, projectJson: projectJson };
    }, '加载项目');
  });

  ipcMain.handle('project:save', async (event, projectDir, projectJson) => {
    return withErrorHandler(async () => {
      validateParams({ projectDir, projectJson }, ['projectDir', 'projectJson']);
      
      const projectJsonPath = path.join(projectDir, 'project.json');
      if (projectJson.project) {
        projectJson.project.updatedAt = new Date().toISOString();
      }
      fs.writeFileSync(projectJsonPath, JSON.stringify(projectJson, null, 2), 'utf8');
      return { success: true };
    }, '保存项目');
  });

  ipcMain.handle('project:list', async (event, baseDir) => {
    return withErrorHandler(async () => {
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
    }, '获取项目列表');
  });

  ipcMain.handle('project:delete', async (event, projectDir) => {
    return withErrorHandler(async () => {
      validateParams({ projectDir }, ['projectDir']);
      if (!fs.existsSync(projectDir)) {
        return { success: false, error: '项目文件夹不存在' };
      }
      fs.rmSync(projectDir, { recursive: true, force: true });
      return { success: true };
    }, '删除项目');
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

  // 上传素材到片段
  ipcMain.handle('project:uploadAsset', async (event, params) => {
    try {
      validateParams(params, ['projectDir', 'filePath', 'shotId']);

      const { projectDir, filePath, shotId } = params;

      // 检查源文件是否存在
      if (!fs.existsSync(filePath)) {
        return { success: false, error: '源文件不存在' };
      }

      // 确定素材类型
      const ext = path.extname(filePath).toLowerCase();
      let assetType = 'images';
      if (['.mp4', '.webm', '.ogg', '.mov', '.avi'].includes(ext)) {
        assetType = 'videos';
      } else if (['.mp3', '.wav', '.ogg', '.aac', '.flac'].includes(ext)) {
        assetType = 'audios';
      }

      // 目标目录
      const assetsDir = path.join(projectDir, 'assets', assetType);
      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
      }

      // 目标文件路径
      const fileName = path.basename(filePath);
      const targetPath = path.join(assetsDir, fileName);

      // 如果文件已存在，添加时间戳
      let finalTargetPath = targetPath;
      let counter = 1;
      while (fs.existsSync(finalTargetPath)) {
        const nameWithoutExt = path.basename(fileName, ext);
        finalTargetPath = path.join(assetsDir, `${nameWithoutExt}_${counter}${ext}`);
        counter++;
      }

      // 复制文件
      fs.copyFileSync(filePath, finalTargetPath);

      // 读取项目文件
      const projectJsonPath = path.join(projectDir, 'project.json');
      const projectData = JSON.parse(fs.readFileSync(projectJsonPath, 'utf8'));

      // 查找片段
      const shot = projectData.shots?.find(s => s.id === shotId);
      if (!shot) {
        // 删除已复制的文件
        fs.unlinkSync(finalTargetPath);
        return { success: false, error: '片段不存在' };
      }

      // 初始化素材库
      if (!shot.assets) {
        shot.assets = { images: [], videos: [], audios: [] };
      }

      // 添加素材记录
      const assetId = 'asset_' + assetType.slice(0, -1) + '_' + Date.now();
      const stats = fs.statSync(finalTargetPath);
      const asset = {
        id: assetId,
        name: path.basename(finalTargetPath),
        path: finalTargetPath,
        type: assetType.slice(0, -1),
        size: formatFileSize(stats.size),
        fileSize: stats.size
      };

      shot.assets[assetType].push(asset);

      // 保存项目
      fs.writeFileSync(projectJsonPath, JSON.stringify(projectData, null, 2), 'utf8');

      return { success: true, asset };
    } catch (error) {
      console.error('上传素材失败:', error);
      return { success: false, error: error.message };
    }
  });

  // 上传素材到项目素材库（不关联片段）
  ipcMain.handle('project:uploadAssetToProject', async (event, params) => {
    try {
      validateParams(params, ['projectDir', 'filePath']);

      const { projectDir, filePath, fileName } = params;

      // 检查源文件是否存在
      if (!fs.existsSync(filePath)) {
        return { success: false, error: '源文件不存在' };
      }

      // 确定素材类型
      const ext = path.extname(filePath).toLowerCase();
      let assetType = 'images';
      if (['.mp4', '.webm', '.ogg', '.mov', '.avi'].includes(ext)) {
        assetType = 'videos';
      } else if (['.mp3', '.wav', '.ogg', '.aac', '.flac'].includes(ext)) {
        assetType = 'audios';
      }

      // 目标目录
      const assetsDir = path.join(projectDir, 'assets', assetType);
      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
      }

      // 目标文件路径 - 使用原始文件名
      const originalFileName = fileName || path.basename(filePath);
      const targetPath = path.join(assetsDir, originalFileName);

      // 如果文件已存在，添加时间戳
      let finalTargetPath = targetPath;
      let counter = 1;
      while (fs.existsSync(finalTargetPath)) {
        const nameWithoutExt = path.basename(originalFileName, ext);
        finalTargetPath = path.join(assetsDir, `${nameWithoutExt}_${counter}${ext}`);
        counter++;
      }

      // 复制文件
      fs.copyFileSync(filePath, finalTargetPath);

      // 返回成功
      const stats = fs.statSync(finalTargetPath);
      return { 
        success: true, 
        asset: {
          id: 'asset_' + assetType.slice(0, -1) + '_' + Date.now(),
          name: path.basename(finalTargetPath),
          path: finalTargetPath,
          type: assetType.slice(0, -1),
          size: formatFileSize(stats.size),
          fileSize: stats.size
        }
      };
    } catch (error) {
      console.error('上传素材到项目失败:', error);
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

  // 获取项目素材列表
  ipcMain.handle('project:getAssets', async (event, projectDir) => {
    return withErrorHandler(async () => {
      validateParams({ projectDir }, ['projectDir']);

      const assetsDir = path.join(projectDir, 'assets');
      
      if (!fs.existsSync(assetsDir)) {
        return { success: true, assets: { images: [], videos: [], audios: [] } };
      }

      const assets = {
        images: [],
        videos: [],
        audios: []
      };

      // 读取图片
      const imagesDir = path.join(assetsDir, 'images');
      if (fs.existsSync(imagesDir)) {
        const files = fs.readdirSync(imagesDir);
        for (const file of files) {
          if (/\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(file)) {
            const filePath = path.join(imagesDir, file);
            const stats = fs.statSync(filePath);
            assets.images.push({
              id: 'asset_img_' + file.replace(/\.[^/.]+$/, ''),
              name: file,
              size: formatFileSize(stats.size),
              path: filePath,  // 使用绝对路径
              type: 'image',
              fileSize: stats.size
            });
          }
        }
      }

      // 读取视频
      const videosDir = path.join(assetsDir, 'videos');
      if (fs.existsSync(videosDir)) {
        const files = fs.readdirSync(videosDir);
        for (const file of files) {
          if (/\.(mp4|webm|ogg|mov|avi)$/i.test(file)) {
            const filePath = path.join(videosDir, file);
            const stats = fs.statSync(filePath);
            assets.videos.push({
              id: 'asset_vid_' + file.replace(/\.[^/.]+$/, ''),
              name: file,
              size: formatFileSize(stats.size),
              path: filePath,  // 使用绝对路径
              type: 'video',
              fileSize: stats.size
            });
          }
        }
      }

      // 读取音频
      const audiosDir = path.join(assetsDir, 'audios');
      if (fs.existsSync(audiosDir)) {
        const files = fs.readdirSync(audiosDir);
        for (const file of files) {
          if (/\.(mp3|wav|ogg|aac|flac)$/i.test(file)) {
            const filePath = path.join(audiosDir, file);
            const stats = fs.statSync(filePath);
            assets.audios.push({
              id: 'asset_aud_' + file.replace(/\.[^/.]+$/, ''),
              name: file,
              size: formatFileSize(stats.size),
              path: filePath,  // 使用绝对路径
              type: 'audio',
              fileSize: stats.size
            });
          }
        }
      }

      return { success: true, assets: assets };
    }, '获取项目素材列表');
  });
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
}

module.exports = { initProjectIPC };
