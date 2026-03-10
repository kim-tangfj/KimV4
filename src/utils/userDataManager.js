//
// Kim 多级分镜提示词助手 - 用户数据管理模块
//

const path = require('path');
const fs = require('fs');
const { app } = require('electron');

let _documentsPath;
let _userBasePath;
let _configDir;
let _logsDir;
let _oldUserDataPath;
let _initialized = false;

function initializePaths() {
  if (_initialized) return;
  
  try {
    _documentsPath = app.getPath('documents');
    _userBasePath = path.join(_documentsPath, 'KimStoryboard');
    _configDir = path.join(_userBasePath, '.config');
    _logsDir = path.join(_userBasePath, 'logs');
    _oldUserDataPath = app.getPath('userData');

    if (!fs.existsSync(_configDir)) {
      fs.mkdirSync(_configDir, { recursive: true });
    }
    if (!fs.existsSync(_logsDir)) {
      fs.mkdirSync(_logsDir, { recursive: true });
    }
    
    _initialized = true;
    console.log('[userDataManager] 路径初始化完成:', _configDir);
  } catch (error) {
    console.error('[userDataManager] 路径初始化失败:', error);
  }
}

// 确保路径已初始化（懒加载）
function ensureInitialized() {
  if (!_initialized) {
    initializePaths();
  }
}

module.exports = {
  getUserBasePath: () => { ensureInitialized(); return _userBasePath; },
  getConfigDir: () => { ensureInitialized(); return _configDir; },
  getLogsDir: () => { ensureInitialized(); return _logsDir; },
  getTemplatesConfigPath: () => { ensureInitialized(); return path.join(_configDir, 'templates.json'); },
  getOptionsConfigPath: () => { ensureInitialized(); return path.join(_configDir, 'options.json'); },
  getCustomOptionsConfigPath: () => { ensureInitialized(); return path.join(_configDir, 'options-custom.json'); },
  getOldUserDataPath: () => { ensureInitialized(); return _oldUserDataPath; },
  getOldConfigDir: () => { ensureInitialized(); return path.join(_oldUserDataPath, 'config'); },

  checkMigrationNeeded: () => {
    ensureInitialized();
    const oldConfigDir = path.join(_oldUserDataPath, 'config');
    const filesToMigrate = [];

    // 检查模板配置
    const templatesConfig = path.join(oldConfigDir, 'templates.json');
    if (fs.existsSync(templatesConfig)) {
      const newTemplatesConfig = path.join(_configDir, 'templates.json');
      if (!fs.existsSync(newTemplatesConfig)) {
        filesToMigrate.push('templates.json');
      }
    }

    // 检查内置选项
    const optionsConfig = path.join(oldConfigDir, 'options.json');
    if (fs.existsSync(optionsConfig)) {
      const newOptionsConfig = path.join(_configDir, 'options.json');
      if (!fs.existsSync(newOptionsConfig)) {
        filesToMigrate.push('options.json');
      }
    }

    // 检查自定义选项
    const customOptionsConfig = path.join(oldConfigDir, 'options-custom.json');
    if (fs.existsSync(customOptionsConfig)) {
      const newCustomOptionsConfig = path.join(_configDir, 'options-custom.json');
      if (!fs.existsSync(newCustomOptionsConfig)) {
        filesToMigrate.push('options-custom.json');
      }
    }

    return { needMigrate: filesToMigrate.length > 0, files: filesToMigrate };
  },

  migrateData: () => {
    ensureInitialized();
    const oldConfigDir = path.join(_oldUserDataPath, 'config');
    const migrated = [];
    const defaultTemplatesPath = path.join(__dirname, '../../assets/default/default-templates.json');

    try {
      if (!fs.existsSync(_configDir)) {
        fs.mkdirSync(_configDir, { recursive: true });
      }

      // 迁移模板配置：对比旧模板与默认模板的内容，如果不同则使用新的默认模板
      const oldTemplates = path.join(oldConfigDir, 'templates.json');
      const newTemplates = path.join(_configDir, 'templates.json');
      
      if (fs.existsSync(oldTemplates) && !fs.existsSync(newTemplates)) {
        // 读取旧模板和默认模板进行对比
        const oldTemplatesContent = fs.readFileSync(oldTemplates, 'utf8');
        let shouldUseDefault = false;
        
        try {
          if (fs.existsSync(defaultTemplatesPath)) {
            const defaultTemplatesContent = fs.readFileSync(defaultTemplatesPath, 'utf8');
            
            // 对比模板内容（使用 JSON 序列化后对比）
            const oldTemplatesData = JSON.parse(oldTemplatesContent);
            const defaultTemplatesData = JSON.parse(defaultTemplatesContent);
            
            // 序列化模板数组内容进行对比（忽略格式差异）
            const oldTemplatesStr = JSON.stringify(oldTemplatesData.templates.sort((a, b) => a.id.localeCompare(b.id)));
            const defaultTemplatesStr = JSON.stringify(defaultTemplatesData.templates.sort((a, b) => a.id.localeCompare(b.id)));
            
            // 如果模板内容不同，说明默认模板有更新，使用新的默认模板
            if (oldTemplatesStr !== defaultTemplatesStr) {
              shouldUseDefault = true;
              console.log('[userDataManager] 检测到默认模板内容有更新，使用新版本模板');
            } else {
              // 模板内容相同，迁移旧模板（保留用户可能的自定义修改）
              console.log('[userDataManager] 模板内容一致，迁移旧模板');
            }
          } else {
            // 默认模板文件不存在，迁移旧模板
            console.warn('[userDataManager] 默认模板文件不存在，迁移旧模板');
          }
        } catch (e) {
          // 解析失败时使用默认模板
          console.warn('[userDataManager] 模板对比失败，使用默认模板:', e.message);
          shouldUseDefault = true;
        }
        
        if (shouldUseDefault && fs.existsSync(defaultTemplatesPath)) {
          // 使用新的默认模板
          fs.copyFileSync(defaultTemplatesPath, newTemplates);
          migrated.push('templates.json (default)');
        } else {
          // 迁移旧模板
          fs.copyFileSync(oldTemplates, newTemplates);
          migrated.push('templates.json');
        }
      }

      // 迁移内置选项
      const oldOptions = path.join(oldConfigDir, 'options.json');
      const newOptions = path.join(_configDir, 'options.json');
      if (fs.existsSync(oldOptions) && !fs.existsSync(newOptions)) {
        fs.copyFileSync(oldOptions, newOptions);
        migrated.push('options.json');
      }

      // 迁移自定义选项
      const oldCustomOptions = path.join(oldConfigDir, 'options-custom.json');
      const newCustomOptions = path.join(_configDir, 'options-custom.json');
      if (fs.existsSync(oldCustomOptions) && !fs.existsSync(newCustomOptions)) {
        fs.copyFileSync(oldCustomOptions, newCustomOptions);
        migrated.push('options-custom.json');
      }

      return { success: true, migrated };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  clearAllConfig: () => {
    ensureInitialized();
    try {
      const templatesConfig = path.join(_configDir, 'templates.json');
      const optionsConfig = path.join(_configDir, 'options.json');

      if (fs.existsSync(templatesConfig)) fs.unlinkSync(templatesConfig);
      if (fs.existsSync(optionsConfig)) fs.unlinkSync(optionsConfig);
      if (fs.existsSync(_logsDir)) fs.rmSync(_logsDir, { recursive: true, force: true });
      fs.mkdirSync(_logsDir, { recursive: true });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getUserDataInfo: () => ({
    userBasePath: _userBasePath,
    configDir: _configDir,
    logsDir: _logsDir,
    oldUserDataPath: _oldUserDataPath
  })
};
