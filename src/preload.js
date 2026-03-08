const { contextBridge, ipcRenderer } = require('electron');

// 暴露 API 到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 对话框 API
  openProjectDialog: () => ipcRenderer.invoke('dialog:openProject'),
  showOpenDialog: (options) => ipcRenderer.invoke('dialog:showOpenDialog', options),

  // 文件系统 API
  readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath, data) => ipcRenderer.invoke('fs:writeFile', filePath, data),
  fileExists: (filePath) => ipcRenderer.invoke('fs:exists', filePath),
  getFilePaths: (files) => ipcRenderer.invoke('fs:getFilePaths', files),
  // 保存拖放文件（sandbox 模式专用）
  saveDroppedFile: (fileName, fileData, projectDir, assetType) => ipcRenderer.invoke('fs:saveDroppedFile', fileName, fileData, projectDir, assetType),

  // Shell API
  openPath: (filePath) => ipcRenderer.invoke('shell:openPath', filePath),
  
  // 项目 API
  createProject: (projectData) => ipcRenderer.invoke('project:create', projectData),
  loadProject: (projectDir) => ipcRenderer.invoke('project:load', projectDir),
  saveProject: (projectDir, projectJson) => ipcRenderer.invoke('project:save', projectDir, projectJson),
  listProjects: (baseDir) => ipcRenderer.invoke('project:list', baseDir),
  deleteProject: (projectDir) => ipcRenderer.invoke('project:delete', projectDir),
  openFolder: (projectDir) => ipcRenderer.invoke('project:openFolder', projectDir),
  startMonitor: (projectDirs) => ipcRenderer.invoke('project:startMonitor', projectDirs),
  stopMonitor: () => ipcRenderer.invoke('project:stopMonitor'),
  getAssets: (projectDir) => ipcRenderer.invoke('project:getAssets', projectDir),
  uploadAsset: (params) => ipcRenderer.invoke('project:uploadAsset', params),
  uploadAssetToProject: (params) => ipcRenderer.invoke('project:uploadAssetToProject', params),
  
  // LLM API
  testApiConnection: (provider, apiKey, model) => ipcRenderer.invoke('api:testConnection', provider, apiKey, model),
  callLlmApi: (provider, apiKey, model, prompt) => ipcRenderer.invoke('api:callLlm', provider, apiKey, model, prompt),
  
  // 模板 API
  loadTemplates: () => ipcRenderer.invoke('template:load'),
  saveTemplates: (config) => ipcRenderer.invoke('template:save', config),
  backupTemplates: () => ipcRenderer.invoke('template:backup'),
  restoreTemplates: () => ipcRenderer.invoke('template:restore'),
  getTemplatesPath: () => ipcRenderer.invoke('template:getPath'),

  // 自定义选项 API
  getAllOptions: () => ipcRenderer.invoke('options:getAll'),
  getOptionsByGroup: (group) => ipcRenderer.invoke('options:getByGroup', group),
  getGroups: () => ipcRenderer.invoke('options:getGroups'),
  addCustomOption: (option) => ipcRenderer.invoke('options:addCustom', option),
  deleteCustomOption: (optionId) => ipcRenderer.invoke('options:deleteCustom', optionId),
  updateCustomOption: (optionId, updates) => ipcRenderer.invoke('options:updateCustom', optionId, updates),
  getCustomList: () => ipcRenderer.invoke('options:getCustomList'),
  backupOptions: () => ipcRenderer.invoke('options:backup'),
  restoreOptions: () => ipcRenderer.invoke('options:restore'),
  openOptionsFolder: () => ipcRenderer.invoke('options:openFolder'),
  // 选项使用统计
  updateOptionUsage: (optionId, delta) => ipcRenderer.invoke('options:updateUsage', optionId, delta),
  batchUpdateOptionUsage: (updates) => ipcRenderer.invoke('options:batchUpdateUsage', updates),
  checkOptionUsage: (optionId) => ipcRenderer.invoke('options:checkUsage', optionId),
  
  // 监听来自主进程的消息
  onSettingsOpen: (callback) => {
    ipcRenderer.on('open-settings', callback);
  },
  onThemeToggle: (callback) => {
    ipcRenderer.on('toggle-theme', callback);
  },
  onFolderMonitorChanges: (callback) => {
    ipcRenderer.on('folder-monitor:changes', (event, changes) => callback(changes));
  },
  onTemplateLibraryOpen: (callback) => {
    ipcRenderer.on('open-template-library', callback);
  },
  onCustomOptionsOpen: (callback) => {
    ipcRenderer.on('open-custom-options', callback);
  },

  // 日志记录 API
  logError: (logEntry) => ipcRenderer.invoke('log:error', logEntry)
});
