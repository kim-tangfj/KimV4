//
// 模板管理 IPC 处理器
//

const { ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { withErrorHandler } = require('../utils/ipcErrorHandler');

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
  ipcMain.handle('template:load', () => {
    return withErrorHandler(async () => {
      if (fs.existsSync(templatesConfigPath)) {
        const data = fs.readFileSync(templatesConfigPath, 'utf8');
        const config = JSON.parse(data);
        return { success: true, config: config };
      } else {
        // 配置文件不存在，从默认文件加载
        try {
          if (fs.existsSync(defaultTemplatesPath)) {
            const defaultData = fs.readFileSync(defaultTemplatesPath, 'utf8');
            const defaultConfig = JSON.parse(defaultData);
            // 保存默认配置到用户数据目录
            fs.writeFileSync(templatesConfigPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
            console.log('已从默认文件加载模板配置');
            return { success: true, config: defaultConfig };
          }
        } catch (e) {
          console.warn('默认模板文件不存在，创建空配置:', e.message);
        }

        // 默认文件也不存在，返回空配置
        const emptyConfig = { templates: [], activeTemplateId: null };
        fs.writeFileSync(templatesConfigPath, JSON.stringify(emptyConfig, null, 2), 'utf8');
        return { success: true, config: emptyConfig };
      }
    }, '加载模板配置');
  });

  // 保存模板
  ipcMain.handle('template:save', (event, config) => {
    return withErrorHandler(async () => {
      fs.writeFileSync(templatesConfigPath, JSON.stringify(config, null, 2), 'utf8');
      return { success: true };
    }, '保存模板配置');
  });

  // 备份模板
  ipcMain.handle('template:backup', () => {
    return withErrorHandler(async () => {
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
    }, '备份模板配置');
  });

  // 恢复模板
  ipcMain.handle('template:restore', () => {
    return withErrorHandler(async () => {
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
    }, '恢复模板配置');
  });

  // 获取模板路径
  ipcMain.handle('template:getPath', () => {
    return withErrorHandler(async () => {
      return {
        success: true,
        path: configDir,
        filePath: templatesConfigPath
      };
    }, '获取模板路径');
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
