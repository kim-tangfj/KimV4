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

function initializePaths() {
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
}

initializePaths();

module.exports = {
  getUserBasePath: () => _userBasePath,
  getConfigDir: () => _configDir,
  getLogsDir: () => _logsDir,
  getTemplatesConfigPath: () => path.join(_configDir, 'templates.json'),
  getOptionsConfigPath: () => path.join(_configDir, 'options.json'),
  getOldUserDataPath: () => _oldUserDataPath,
  getOldConfigDir: () => path.join(_oldUserDataPath, 'config'),

  checkMigrationNeeded: () => {
    const oldConfigDir = path.join(_oldUserDataPath, 'config');
    const filesToMigrate = [];
    const templatesConfig = path.join(oldConfigDir, 'templates.json');
    const optionsConfig = path.join(oldConfigDir, 'options.json');

    if (fs.existsSync(templatesConfig)) {
      const newTemplatesConfig = path.join(_configDir, 'templates.json');
      if (!fs.existsSync(newTemplatesConfig)) {
        filesToMigrate.push('templates.json');
      }
    }

    if (fs.existsSync(optionsConfig)) {
      const newOptionsConfig = path.join(_configDir, 'options.json');
      if (!fs.existsSync(newOptionsConfig)) {
        filesToMigrate.push('options.json');
      }
    }

    return { needMigrate: filesToMigrate.length > 0, files: filesToMigrate };
  },

  migrateData: () => {
    const oldConfigDir = path.join(_oldUserDataPath, 'config');
    const migrated = [];

    try {
      if (!fs.existsSync(_configDir)) {
        fs.mkdirSync(_configDir, { recursive: true });
      }

      const oldTemplates = path.join(oldConfigDir, 'templates.json');
      const newTemplates = path.join(_configDir, 'templates.json');
      if (fs.existsSync(oldTemplates) && !fs.existsSync(newTemplates)) {
        fs.copyFileSync(oldTemplates, newTemplates);
        migrated.push('templates.json');
      }

      const oldOptions = path.join(oldConfigDir, 'options.json');
      const newOptions = path.join(_configDir, 'options.json');
      if (fs.existsSync(oldOptions) && !fs.existsSync(newOptions)) {
        fs.copyFileSync(oldOptions, newOptions);
        migrated.push('options.json');
      }

      return { success: true, migrated };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  clearAllConfig: () => {
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
