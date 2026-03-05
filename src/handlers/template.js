//
// 模板管理 IPC 处理器
//

const { ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// 模板配置文件路径
const userDataPath = require('electron').app.getPath('userData');
const configDir = path.join(userDataPath, 'config');
const templatesConfigPath = path.join(configDir, 'templates.json');

// 默认模板文件路径
const defaultTemplatesPath = path.join(__dirname, '../../assets/default/default-templates.json');

// 确保配置目录存在
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

// 初始化模板管理 IPC
function initTemplateIPC() {
  // 加载模板
  ipcMain.handle('template:load', async () => {
    try {
      if (fs.existsSync(templatesConfigPath)) {
        const data = fs.readFileSync(templatesConfigPath, 'utf8');
        const config = JSON.parse(data);
        return { success: true, config: config };
      } else {
        return {
          success: true,
          config: { templates: [], activeTemplateId: null }
        };
      }
    } catch (error) {
      console.error('加载模板配置失败:', error);
      return {
        success: false,
        error: error.message,
        config: { templates: [], activeTemplateId: null }
      };
    }
  });

  // 保存模板
  ipcMain.handle('template:save', async (event, config) => {
    try {
      fs.writeFileSync(templatesConfigPath, JSON.stringify(config, null, 2), 'utf8');
      return { success: true };
    } catch (error) {
      console.error('保存模板配置失败:', error);
      return { success: false, error: error.message };
    }
  });

  // 备份模板
  ipcMain.handle('template:backup', async () => {
    try {
      const result = await dialog.showSaveDialog({
        title: '备份模板配置',
        defaultPath: 'templates-backup.json',
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
      });

      if (!result.canceled && result.filePath) {
        let filePath = result.filePath;
        if (!filePath.endsWith('.json')) {
          filePath += '.json';
        }

        if (fs.existsSync(templatesConfigPath)) {
          fs.copyFileSync(templatesConfigPath, filePath);
        } else {
          const defaultConfig = { templates: [], activeTemplateId: null };
          fs.writeFileSync(filePath, JSON.stringify(defaultConfig, null, 2), 'utf8');
        }
        return { success: true, filePath: filePath };
      }

      return { success: false, canceled: true };
    } catch (error) {
      console.error('备份模板配置失败:', error);
      return { success: false, error: error.message };
    }
  });

  // 恢复模板
  ipcMain.handle('template:restore', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: '恢复模板配置',
        properties: ['openFile'],
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
      });

      if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
        const backupPath = result.filePaths[0];
        fs.copyFileSync(backupPath, templatesConfigPath);
        return { success: true };
      }

      return { success: false, canceled: true };
    } catch (error) {
      console.error('恢复模板配置失败:', error);
      return { success: false, error: error.message };
    }
  });

  // 获取模板路径
  ipcMain.handle('template:getPath', async () => {
    return {
      success: true,
      path: configDir,
      filePath: templatesConfigPath
    };
  });
}

// 初始化默认模板
function initializeDefaultTemplates() {
  try {
    if (!fs.existsSync(templatesConfigPath)) {
      if (fs.existsSync(defaultTemplatesPath)) {
        fs.copyFileSync(defaultTemplatesPath, templatesConfigPath);
        console.log('已初始化默认模板配置');
      } else {
        const emptyConfig = { templates: [], activeTemplateId: null };
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

module.exports = {
  initTemplateIPC,
  initializeDefaultTemplates
};
