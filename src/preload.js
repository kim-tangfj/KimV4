const { contextBridge, ipcRenderer } = require('electron');

// 暴露 API 到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 对话框 API
  openProjectDialog: () => ipcRenderer.invoke('dialog:openProject'),
  
  // 文件系统 API
  readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath, data) => ipcRenderer.invoke('fs:writeFile', filePath, data),
  fileExists: (filePath) => ipcRenderer.invoke('fs:exists', filePath),
  
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
  
  // LLM API
  testApiConnection: (provider, apiKey, model) => ipcRenderer.invoke('api:testConnection', provider, apiKey, model),
  callLlmApi: (provider, apiKey, model, prompt) => ipcRenderer.invoke('api:callLlm', provider, apiKey, model, prompt),
  
  // 模板 API
  loadTemplates: () => ipcRenderer.invoke('template:load'),
  saveTemplates: (config) => ipcRenderer.invoke('template:save', config),
  backupTemplates: () => ipcRenderer.invoke('template:backup'),
  restoreTemplates: () => ipcRenderer.invoke('template:restore'),
  getTemplatesPath: () => ipcRenderer.invoke('template:getPath'),
  
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
  }
});
