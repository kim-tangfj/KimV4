//
// 自定义选项管理 IPC 处理器
//

const { ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// 用户数据目录
const userDataPath = require('electron').app.getPath('userData');
const configDir = path.join(userDataPath, 'config');
const customOptionsPath = path.join(configDir, 'options-custom.json');

// 内置选项文件路径
const defaultOptionsPath = path.join(__dirname, '../../assets/default/options.json');

// 确保配置目录存在
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

// 初始化自定义选项文件
function initializeCustomOptions() {
  if (!fs.existsSync(customOptionsPath)) {
    const emptyConfig = {
      version: '1.0',
      customOptions: []
    };
    fs.writeFileSync(customOptionsPath, JSON.stringify(emptyConfig, null, 2), 'utf8');
    console.log('已创建自定义选项配置文件');
  }
}

// 加载内置选项
function loadDefaultOptions() {
  try {
    if (fs.existsSync(defaultOptionsPath)) {
      const data = fs.readFileSync(defaultOptionsPath, 'utf8');
      const options = JSON.parse(data);
      // 标记为内置选项
      return options.map(opt => ({ ...opt, builtin: true }));
    }
  } catch (error) {
    console.error('加载内置选项失败:', error);
  }
  return [];
}

// 加载自定义选项
function loadCustomOptions() {
  try {
    if (fs.existsSync(customOptionsPath)) {
      const data = fs.readFileSync(customOptionsPath, 'utf8');
      const config = JSON.parse(data);
      // 标记为自定义选项，确保有 usageCount 字段
      return (config.customOptions || []).map(opt => ({ 
        ...opt, 
        builtin: false,
        usageCount: opt.usageCount || 0 
      }));
    }
  } catch (error) {
    console.error('加载自定义选项失败:', error);
  }
  return [];
}

// 保存自定义选项
function saveCustomOptions(customOptions) {
  try {
    const config = {
      version: '1.0',
      customOptions: customOptions
    };
    fs.writeFileSync(customOptionsPath, JSON.stringify(config, null, 2), 'utf8');
    return { success: true };
  } catch (error) {
    console.error('保存自定义选项失败:', error);
    return { success: false, error: error.message };
  }
}

// 获取所有选项（内置 + 自定义）
function getAllOptions() {
  const defaultOptions = loadDefaultOptions();
  const customOptions = loadCustomOptions();
  return [...defaultOptions, ...customOptions];
}

// 按组别获取选项
function getOptionsByGroup(group) {
  const allOptions = getAllOptions();
  return allOptions.filter(opt => opt.group === group);
}

// 获取所有组别
function getAllGroups() {
  const allOptions = getAllOptions();
  const groups = [...new Set(allOptions.map(opt => opt.group))];
  return groups;
}

// 初始化 IPC
function initOptionsIPC() {
  // 获取所有选项
  ipcMain.handle('options:getAll', async () => {
    try {
      const options = getAllOptions();
      return { success: true, options };
    } catch (error) {
      return { success: false, error: error.message, options: [] };
    }
  });

  // 按组别获取选项
  ipcMain.handle('options:getByGroup', async (event, group) => {
    try {
      const options = getOptionsByGroup(group);
      return { success: true, options };
    } catch (error) {
      return { success: false, error: error.message, options: [] };
    }
  });

  // 获取所有组别
  ipcMain.handle('options:getGroups', async () => {
    try {
      const groups = getAllGroups();
      return { success: true, groups };
    } catch (error) {
      return { success: false, error: error.message, groups: [] };
    }
  });

  // 添加自定义选项
  ipcMain.handle('options:addCustom', async (event, option) => {
    try {
      const customOptions = loadCustomOptions();
      
      // 生成 ID
      option.id = 'custom_' + Date.now();
      option.builtin = false;
      
      customOptions.push(option);
      
      const result = saveCustomOptions(customOptions);
      if (result.success) {
        return { success: true, option };
      } else {
        return result;
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 删除自定义选项
  ipcMain.handle('options:deleteCustom', async (event, optionId) => {
    try {
      const customOptions = loadCustomOptions();
      const filtered = customOptions.filter(opt => opt.id !== optionId);
      
      const result = saveCustomOptions(filtered);
      if (result.success) {
        return { success: true };
      } else {
        return result;
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 更新自定义选项
  ipcMain.handle('options:updateCustom', async (event, optionId, updates) => {
    try {
      const customOptions = loadCustomOptions();
      const index = customOptions.findIndex(opt => opt.id === optionId);

      if (index === -1) {
        return { success: false, error: '选项不存在' };
      }

      // 不允许修改 builtin 字段
      delete updates.builtin;
      delete updates.id;

      customOptions[index] = { ...customOptions[index], ...updates };

      const result = saveCustomOptions(customOptions);
      if (result.success) {
        return { success: true, option: customOptions[index] };
      } else {
        return result;
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 增加选项使用次数
  ipcMain.handle('options:incrementUsage', async (event, optionId) => {
    try {
      const customOptions = loadCustomOptions();
      const index = customOptions.findIndex(opt => opt.id === optionId);

      if (index === -1) {
        return { success: false, error: '选项不存在' };
      }

      customOptions[index].usageCount = (customOptions[index].usageCount || 0) + 1;

      const result = saveCustomOptions(customOptions);
      if (result.success) {
        return { success: true, usageCount: customOptions[index].usageCount };
      } else {
        return result;
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 检查选项是否被使用
  ipcMain.handle('options:checkUsage', async (event, optionId) => {
    try {
      const customOptions = loadCustomOptions();
      const option = customOptions.find(opt => opt.id === optionId);
      
      if (!option) {
        return { success: false, error: '选项不存在' };
      }

      return { 
        success: true, 
        usageCount: option.usageCount || 0,
        style: option.style,
        type: option.type
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 获取自定义选项列表
  ipcMain.handle('options:getCustomList', async () => {
    try {
      const customOptions = loadCustomOptions();
      return { success: true, options: customOptions };
    } catch (error) {
      return { success: false, error: error.message, options: [] };
    }
  });

  // 备份自定义选项
  ipcMain.handle('options:backup', async () => {
    try {
      const result = await dialog.showSaveDialog({
        title: '备份自定义选项',
        defaultPath: 'options-backup.json',
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
      });

      if (!result.canceled && result.filePath) {
        let filePath = result.filePath;
        if (!filePath.endsWith('.json')) {
          filePath += '.json';
        }

        if (fs.existsSync(customOptionsPath)) {
          fs.copyFileSync(customOptionsPath, filePath);
        } else {
          const emptyConfig = { version: '1.0', customOptions: [] };
          fs.writeFileSync(filePath, JSON.stringify(emptyConfig, null, 2), 'utf8');
        }
        return { success: true, filePath };
      }

      return { success: false, canceled: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 恢复自定义选项
  ipcMain.handle('options:restore', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: '恢复自定义选项',
        properties: ['openFile'],
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
      });

      if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
        const backupPath = result.filePaths[0];
        fs.copyFileSync(backupPath, customOptionsPath);
        return { success: true };
      }

      return { success: false, canceled: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 打开自定义选项文件夹
  ipcMain.handle('options:openFolder', async () => {
    try {
      const { shell } = require('electron');
      await shell.openPath(configDir);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

module.exports = {
  initOptionsIPC,
  initializeCustomOptions,
  loadDefaultOptions,
  loadCustomOptions,
  getAllOptions,
  getOptionsByGroup,
  getAllGroups
};
