//
// Kim 多级分镜提示词助手 - 状态管理模块
// 统一管理系统状态，避免 window 对象和局部变量不同步
//

/**
 * 状态管理器类
 * 提供单一数据源，所有模块通过 getState 访问状态
 */
class AppStateManager {
  constructor() {
    // 应用数据状态
    this.state = {
      projects: [],
      currentProject: null,
      currentShot: null,
      currentScene: null,
      projectData: null
    };

    // 设置
    this.settings = {
      storagePath: '',
      apiProvider: 'deepseek',
      apiKeys: {
        deepseek: '',
        doubao: '',
        qianwen: '',
        ailian: ''
      },
      models: {
        deepseek: 'deepseek-chat',
        doubao: 'doubao-pro-4k',
        qianwen: 'qwen3.5-plus',
        ailian: 'qwen3.5-plus'
      },
      templates: [],
      activeTemplateId: null
    };

    // 主题
    this.currentTheme = 'light';

    // Electron API 标志
    this.useElectronAPI = false;

    // 自动保存相关状态
    this.shotSaveTimeout = null;
    this.savingShotId = null;
    this.sceneSaveTimeout = null;
    this.savingSceneId = null;

    // 面板拖拽相关状态
    this.isResizing = false;
    this.currentResizer = null;
    this.startX = 0;
    this.startWidth = 0;
    this.currentPanel = null;
  }

  // ========== 应用状态管理 ==========

  /**
   * 获取应用状态
   * @returns {Object} 应用状态对象
   */
  getState() {
    return this.state;
  }

  /**
   * 设置应用状态
   * @param {Object} newState - 新状态
   */
  setState(newState) {
    this.state = { ...this.state, ...newState };
    // 同步到 window 对象（保持向后兼容）
    window.appState = this.state;
  }

  /**
   * 更新应用状态的某个属性
   * @param {string} key - 状态键名
   * @param {any} value - 新值
   */
  updateState(key, value) {
    this.state[key] = value;
    window.appState = this.state;
  }

  // ========== 设置管理 ==========

  /**
   * 获取设置
   * @returns {Object} 设置对象
   */
  getSettings() {
    return this.settings;
  }

  /**
   * 设置设置
   * @param {Object} newSettings - 新设置
   */
  setSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    // 同步到 window 对象（保持向后兼容）
    window.settings = this.settings;
  }

  /**
   * 更新设置的某个属性
   * @param {string} key - 设置键名
   * @param {any} value - 新值
   */
  updateSetting(key, value) {
    this.settings[key] = value;
    window.settings = this.settings;
  }

  /**
   * 更新嵌套设置（如 apiKeys.deepseek）
   * @param {string} path - 路径（如 'apiKeys.deepseek'）
   * @param {any} value - 新值
   */
  updateNestedSetting(path, value) {
    const keys = path.split('.');
    let current = this.settings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    window.settings = this.settings;
  }

  // ========== 主题管理 ==========

  /**
   * 获取当前主题
   * @returns {string} 当前主题
   */
  getTheme() {
    return this.currentTheme;
  }

  /**
   * 设置当前主题
   * @param {string} theme - 新主题
   */
  setTheme(theme) {
    this.currentTheme = theme;
    window.currentTheme = theme;
  }

  // ========== Electron API 标志 ==========

  /**
   * 获取 Electron API 标志
   * @returns {boolean} 是否使用 Electron API
   */
  getUseElectronAPI() {
    return this.useElectronAPI;
  }

  /**
   * 设置 Electron API 标志
   * @param {boolean} value - 是否使用
   */
  setUseElectronAPI(value) {
    this.useElectronAPI = value;
    window.useElectronAPI = value;
  }

  // ========== 自动保存状态 ==========

  /**
   * 设置片段保存超时
   * @param {any} timeout - 超时 ID
   */
  setShotSaveTimeout(timeout) {
    this.shotSaveTimeout = timeout;
    window.shotSaveTimeout = timeout;
  }

  /**
   * 设置正在保存的片段 ID
   * @param {string|null} id - 片段 ID
   */
  setSavingShotId(id) {
    this.savingShotId = id;
    window.savingShotId = id;
  }

  /**
   * 设置镜头保存超时
   * @param {any} timeout - 超时 ID
   */
  setSceneSaveTimeout(timeout) {
    this.sceneSaveTimeout = timeout;
    window.sceneSaveTimeout = timeout;
  }

  /**
   * 设置正在保存的镜头 ID
   * @param {string|null} id - 镜头 ID
   */
  setSavingSceneId(id) {
    this.savingSceneId = id;
    window.savingSceneId = id;
  }

  // ========== 面板拖拽状态 ==========

  /**
   * 设置拖拽状态
   * @param {Object} dragState - 拖拽状态对象
   */
  setDragState(dragState) {
    this.isResizing = dragState.isResizing;
    this.currentResizer = dragState.currentResizer;
    this.startX = dragState.startX;
    this.startWidth = dragState.startWidth;
    this.currentPanel = dragState.currentPanel;
    
    window.isResizing = dragState.isResizing;
    window.currentResizer = dragState.currentResizer;
    window.currentPanel = dragState.currentPanel;
  }

  // ========== 初始化 ==========

  /**
   * 初始化状态管理器
   * 将所有状态同步到 window 对象
   */
  init() {
    window.appState = this.state;
    window.settings = this.settings;
    window.currentTheme = this.currentTheme;
    window.useElectronAPI = this.useElectronAPI;
    window.shotSaveTimeout = this.shotSaveTimeout;
    window.savingShotId = this.savingShotId;
    window.sceneSaveTimeout = this.sceneSaveTimeout;
    window.savingSceneId = this.savingSceneId;
  }

  /**
   * 从 window 对象加载状态（向后兼容）
   */
  loadFromWindow() {
    if (window.appState) {
      this.state = window.appState;
    }
    if (window.settings) {
      this.settings = window.settings;
    }
    if (window.currentTheme) {
      this.currentTheme = window.currentTheme;
    }
    if (window.useElectronAPI !== undefined) {
      this.useElectronAPI = window.useElectronAPI;
    }
  }
}

// 检查是否已存在实例，避免重复声明
if (!window.appStateManagerInstance) {
  // 创建全局状态管理器实例
  window.appStateManagerInstance = new AppStateManager();
}

// 导出到 window 对象
window.appStateManager = window.appStateManagerInstance;

// 提供便捷的访问函数
window.getState = () => window.appStateManager.getState();
window.setState = (newState) => window.appStateManager.setState(newState);
window.updateState = (key, value) => window.appStateManager.updateState(key, value);
window.getSettings = () => window.appStateManager.getSettings();
window.setSettings = (newSettings) => window.appStateManager.setSettings(newSettings);
window.updateSetting = (key, value) => window.appStateManager.updateSetting(key, value);
window.updateNestedSetting = (path, value) => window.appStateManager.updateNestedSetting(path, value);
window.getTheme = () => window.appStateManager.getTheme();
window.setTheme = (theme) => window.appStateManager.setTheme(theme);
window.getUseElectronAPI = () => window.appStateManager.getUseElectronAPI();
window.setUseElectronAPI = (value) => window.appStateManager.setUseElectronAPI(value);
