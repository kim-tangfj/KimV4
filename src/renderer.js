//
// Kim 多级分镜提示词助手 - 渲染进程
//

/**  ======= 文件头注释和模块导入说明 开始 ======== */
// 提示词生成模块已移至 src/utils/promptGenerator.js
// 包含函数：generateScenePrompt, generateShotPrompt, generateProjectPrompt,
//          renderPromptWithHighlight, updatePromptPreview, copyPromptToClipboard,
//          exportPrompt, clearPrompt, generatePromptFromAI
// 设置管理模块已移至 src/utils/settings.js
// 包含函数：loadSettings, saveSettings, saveSettingsToStorage, applyTheme, toggleTheme,
//          toggleApiKeyVisibility, testApiConnection, checkApiStatus, showSettingsModal,
//          hideSettingsModal, showLoading, hideLoading, getDefaultTemplate, showTemplateStoragePath
// 自定义选项管理模块已移至 src/utils/customOptions.js
// 包含函数：showCustomOptionsModal, hideCustomOptionsModal, loadGroupFilter, loadCustomOptionsList,
//          renderBuiltinOptionsList, renderCustomOptionsList, showAddCustomOptionForm,
//          showEditCustomOptionForm, loadGroupFilterForEditForm, hideCustomOptionEditModal,
//          saveCustomOptionEdit, saveCustomOption, deleteCustomOption, hideCustomOptionForm
// UI 工具函数模块已移至 src/utils/uiHelpers.js
// 包含函数：showInputError, initPanelResizers, handleResizerMouseMove, handleResizerMouseUp,
//          getPanelConstraints, showToast, showConfirm, showCustomPrompt, showUpdateNotification
// 事件监听器模块已移至 src/utils/eventListeners.js
// 包含函数：setupEventListeners
// 模板库管理模块已移至 src/utils/templateLibrary.js
// 包含函数：showTemplateLibraryModal, hideTemplateLibraryModal, renderTemplateList, activateTemplate,
//          addNewTemplate, editTemplate, deleteTemplate, saveTemplate, showTemplateEditor,
//          hideTemplateEditor, cancelTemplateEdit, backupTemplates, restoreTemplates,
//          openTemplateFolder, copyTemplate
// 项目创建模块已移至 src/utils/projectCreator.js
// 包含函数：createProjectAI, createProjectManual, showNewProjectModal, hideNewProjectModal,
//          confirmCreateProject
/** ======= 文件头注释和模块导入说明 结束 ======== */


/**  ======= 全局变量定义 开始 ======== */
// 状态管理器已在 appStateManager.js 中初始化并导出到 window 对象
// 使用全局状态管理器访问状态（避免局部变量）：
// - window.appStateManager.getState() / setState()
// - window.getSettings() / setSettings()
// - window.getTheme() / setTheme()
// - window.appState / window.settings（向后兼容）
/** ======= 全局变量定义 结束 ======== */


/** ======= DOM 元素缓存 开始 ======== */
// DOM 元素引用
const elements = {};

// 缓存 DOM 元素
function cacheDOMElements() {
  // 主界面元素
  elements.projectList = document.getElementById('project-list');
  elements.shotList = document.getElementById('shot-list');
  elements.sceneList = document.getElementById('scene-list');
  elements.promptPreview = document.getElementById('prompt-preview');
  elements.propertyForm = document.getElementById('property-form');
  elements.bottomPanel = document.getElementById('bottom-panel');

  // 按钮
  elements.newProjectBtn = document.getElementById('new-project-btn');
  elements.refreshProjectsBtn = document.getElementById('refresh-projects-btn');
  elements.newShotBtn = document.getElementById('new-shot-btn');
  elements.deleteShotBtn = document.getElementById('delete-shot-btn');
  elements.newSceneBtn = document.getElementById('new-scene-btn');
  elements.deleteSceneBtn = document.getElementById('delete-scene-btn');
  elements.copyPromptBtn = document.getElementById('copy-prompt-btn');
  elements.exportPromptBtn = document.getElementById('export-prompt-btn');
  elements.clearPromptBtn = document.getElementById('clear-prompt-btn');
  elements.panelToggleBtn = document.getElementById('panel-toggle-btn');
  elements.panelToggleHeader = document.getElementById('panel-toggle-header');
  elements.viewToggleBtn = document.getElementById('view-toggle-btn');

  // 模态框
  elements.settingsModal = document.getElementById('settings-modal');
  elements.newProjectModal = document.getElementById('new-project-modal');
  elements.loadingOverlay = document.getElementById('loading-overlay');
  elements.loadingText = document.getElementById('loading-text');

  // 设置面板元素
  elements.closeSettingsBtn = document.getElementById('close-settings-btn');
  elements.saveSettingsBtn = document.getElementById('save-settings-btn');
  elements.cancelSettingsBtn = document.getElementById('cancel-settings-btn');
  elements.storagePathInput = document.getElementById('storage-path');
  elements.changePathBtn = document.getElementById('change-path-btn');
  elements.apiProviderSelect = document.getElementById('api-provider-select');
  elements.autoSaveInterval = document.getElementById('auto-save-interval');

  // 主题切换
  elements.themeToggleBtns = document.querySelectorAll('.theme-toggle-btn');

  // API 配置元素
  elements.deepseekConfig = document.getElementById('deepseek-config');
  elements.doubaoConfig = document.getElementById('doubao-config');
  elements.qianwenConfig = document.getElementById('qianwen-config');
  elements.ailianConfig = document.getElementById('ailian-config');

  // DeepSeek
  elements.deepseekApiKey = document.getElementById('deepseek-api-key');
  elements.deepseekModel = document.getElementById('deepseek-model');
  elements.testDeepseekBtn = document.getElementById('test-deepseek-btn');
  elements.deepseekStatus = document.getElementById('deepseek-status');
  elements.toggleDeepseekKey = document.getElementById('toggle-deepseek-key');

  // 豆包
  elements.doubaoApiKey = document.getElementById('doubao-api-key');
  elements.doubaoModel = document.getElementById('doubao-model');
  elements.testDoubaoBtn = document.getElementById('test-doubao-btn');
  elements.doubaoStatus = document.getElementById('doubao-status');
  elements.toggleDoubaoKey = document.getElementById('toggle-doubao-key');

  // 千问
  elements.qianwenApiKey = document.getElementById('qianwen-api-key');
  elements.qianwenModel = document.getElementById('qianwen-model');
  elements.testQianwenBtn = document.getElementById('test-qianwen-btn');
  elements.qianwenStatus = document.getElementById('qianwen-status');
  elements.toggleQianwenKey = document.getElementById('toggle-qianwen-key');

  // 阿里百炼
  elements.ailianApiKey = document.getElementById('ailian-api-key');
  elements.ailianModel = document.getElementById('ailian-model');
  elements.testAilianBtn = document.getElementById('test-ailian-btn');
  elements.ailianStatus = document.getElementById('ailian-status');
  elements.toggleAilianKey = document.getElementById('toggle-ailian-key');

  // 新建项目弹窗元素
  elements.closeNewProjectBtn = document.getElementById('close-new-project-btn');
  elements.createProjectBtn = document.getElementById('create-project-btn');
  elements.cancelNewProjectBtn = document.getElementById('cancel-new-project-btn');
  elements.modeTabs = document.querySelectorAll('.mode-tab');
  elements.manualMode = document.getElementById('manual-mode');
  elements.aiMode = document.getElementById('ai-mode');

  // 手动模式
  elements.manualProjectName = document.getElementById('manual-project-name');
  elements.manualProjectDesc = document.getElementById('manual-project-desc');
  elements.manualProjectRatio = document.getElementById('manual-project-ratio');
  elements.manualProjectScript = document.getElementById('manual-project-script');
  elements.manualProjectJson = document.getElementById('manual-project-json');
  elements.copyTemplateBtn = document.getElementById('copy-template-btn');

  // AI 模式
  elements.aiProjectName = document.getElementById('ai-project-name');
  elements.aiProjectDesc = document.getElementById('ai-project-desc');
  elements.aiProjectScript = document.getElementById('ai-project-script');
  elements.aiProjectRatio = document.getElementById('ai-project-ratio');
  elements.aiProvider = document.getElementById('ai-provider');
  elements.aiApiStatus = document.getElementById('ai-api-status');
  elements.generatePromptBtn = document.getElementById('generate-prompt-btn');
  elements.aiResponsePreview = document.getElementById('ai-response-preview');

  // 模板库管理
  elements.templateLibraryModal = document.getElementById('template-library-modal');
  elements.closeTemplateBtn = document.getElementById('close-template-btn');
  elements.closeTemplateLibBtn = document.getElementById('close-template-lib-btn');
  elements.addTemplateBtn = document.getElementById('add-template-btn');
  elements.saveTemplateBtn = document.getElementById('save-template-btn');
  elements.cancelTemplateBtn = document.getElementById('cancel-template-btn');
  elements.templateList = document.getElementById('template-list');
  elements.templateEditor = document.getElementById('template-editor');
  elements.templateName = document.getElementById('template-name');
  elements.templateDescription = document.getElementById('template-description');
  elements.templateContent = document.getElementById('template-content');

  // 模板数据管理
  elements.templateStoragePath = document.getElementById('template-storage-path');
  elements.openTemplateFolderBtn = document.getElementById('open-template-folder-btn');
  elements.backupTemplatesBtn = document.getElementById('backup-templates-btn');
  elements.restoreTemplatesBtn = document.getElementById('restore-templates-btn');

  // 自定义选项管理
  elements.manageCustomOptionsBtn = document.getElementById('manage-custom-options-btn');
  elements.backupOptionsBtn = document.getElementById('backup-options-btn');
  elements.restoreOptionsBtn = document.getElementById('restore-options-btn');
  elements.openOptionsFolderBtn = document.getElementById('open-options-folder-btn');
  elements.customOptionsModal = document.getElementById('custom-options-modal');
  elements.closeCustomOptionsBtn = document.getElementById('close-custom-options-btn');
  elements.closeCustomOptionsModalBtn = document.getElementById('close-custom-options-modal-btn');
  elements.addCustomOptionBtn = document.getElementById('add-custom-option-btn');
  elements.refreshCustomOptionsBtn = document.getElementById('refresh-custom-options-btn');
  elements.customOptionsGroupFilter = document.getElementById('custom-options-group-filter');
  elements.builtinOptionsList = document.getElementById('builtin-options-list');
  elements.customOptionsList = document.getElementById('custom-options-list');
  elements.builtinCount = document.getElementById('builtin-count');
  elements.customCount = document.getElementById('custom-count');
  elements.refreshBuiltinBtn = document.getElementById('refresh-builtin-btn');
  elements.addCustomOptionColumnBtn = document.getElementById('add-custom-option-column-btn');
  elements.refreshCustomColumnBtn = document.getElementById('refresh-custom-column-btn');
  elements.customOptionsEditor = document.getElementById('custom-options-editor');
  elements.saveCustomOptionBtn = document.getElementById('save-custom-option-btn');
  elements.cancelCustomOptionBtn = document.getElementById('cancel-custom-option-btn');
  elements.customOptionGroup = document.getElementById('custom-option-group');
  elements.customOptionType = document.getElementById('custom-option-type');
  elements.customOptionStyle = document.getElementById('custom-option-style');
  elements.customOptionDescription = document.getElementById('custom-option-description');
  elements.customOptionId = document.getElementById('custom-option-id');

  // 编辑自定义选项弹窗
  elements.customOptionEditModal = document.getElementById('custom-option-edit-modal');
  elements.customOptionEditTitle = document.getElementById('custom-option-edit-title');
  elements.closeCustomOptionEditBtn = document.getElementById('close-custom-option-edit-btn');
  elements.saveCustomOptionEditBtn = document.getElementById('save-custom-option-edit-btn');
  elements.cancelCustomOptionEditBtn = document.getElementById('cancel-custom-option-edit-btn');
  elements.editCustomOptionGroup = document.getElementById('edit-custom-option-group');
  elements.editCustomOptionGroupInput = document.getElementById('edit-custom-option-group-input');
  elements.editCustomOptionType = document.getElementById('edit-custom-option-type');
  elements.editCustomOptionStyle = document.getElementById('edit-custom-option-style');
  elements.editCustomOptionDescription = document.getElementById('edit-custom-option-description');
  elements.editCustomOptionId = document.getElementById('edit-custom-option-id');

  // 底部面板
  elements.assetsList = document.getElementById('assets-list');
  elements.assetsPanel = document.getElementById('assets-panel');
  elements.assetsPanelToggleBtn = document.getElementById('assets-panel-toggle-btn');
  elements.assetsPanelToggleHeader = document.getElementById('assets-panel-toggle-header');
  elements.assetsPanelUploadBtn = document.getElementById('assets-panel-upload-btn');
  elements.bottomPanelTitle = document.getElementById('bottom-panel-title');
  elements.panelToggleHeader = document.getElementById('panel-toggle-header');
  
  // 项目素材库侧边窗体
  elements.projectAssetsSidebar = document.getElementById('project-assets-sidebar');
}
/** ======= DOM 元素缓存 结束 ======== */


// ========== 全局错误处理 开始 ==========

// 用户友好错误消息映射
const RENDERER_ERROR_MESSAGES = {
  'EACCES': '权限不足，无法访问文件',
  'EPERM': '权限错误，操作被拒绝',
  'ENOENT': '文件或目录不存在',
  'ENOSPC': '磁盘空间不足',
  'NETWORK_ERROR': '网络连接失败，请检查网络设置',
  'TIMEOUT': '请求超时，请稍后重试',
  'API_KEY_INVALID': 'API Key 无效，请在设置中检查',
  'TEMPLATE_NOT_FOUND': '模板不存在，请重新选择',
  'PROJECT_NOT_FOUND': '项目不存在',
  'JSON_PARSE_ERROR': '数据格式错误，无法解析',
  'UNKNOWN_ERROR': '发生未知错误，请稍后重试'
};

// 获取用户友好的错误消息
window.getUserFriendlyMessage = function(error, defaultMsg = '操作失败，请稍后重试') {
  if (!error) return defaultMsg;
  if (typeof error === 'string') {
    for (const [code, message] of Object.entries(RENDERER_ERROR_MESSAGES)) {
      if (error.includes(code) || error.toLowerCase().includes(code.toLowerCase())) {
        return message;
      }
    }
    return error;
  }
  if (error.code && RENDERER_ERROR_MESSAGES[error.code]) {
    return RENDERER_ERROR_MESSAGES[error.code];
  }
  if (error.message) {
    for (const [code, message] of Object.entries(RENDERER_ERROR_MESSAGES)) {
      if (error.message.includes(code)) {
        return message;
      }
    }
    return error.message;
  }
  return defaultMsg;
};

// 渲染进程日志记录
window.logRendererError = function(source, message, error = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: 'error',
    source,
    message,
    errorCode: error?.code || null,
    errorDetails: error?.message || null
  };
  
  // 输出到控制台
  console.error(`[渲染进程] [${source}] ${message}`, error || '');
  
  // 通过 IPC 发送到主进程记录到文件
  if (window.electronAPI && window.electronAPI.logError) {
    window.electronAPI.logError(logEntry).catch(() => {});
  }
};

// 捕获未处理的 Promise 拒绝
window.addEventListener('unhandledrejection', (event) => {
  const errorMsg = event.reason?.message || '未知错误';
  console.error('[渲染进程] 未处理的 Promise 拒绝:', event.reason);
  
  // 记录日志
  window.logRendererError?.('unhandledrejection', '未处理的 Promise 拒绝：' + errorMsg, event.reason);
  
  // 显示错误提示
  if (window.showToast) {
    const friendlyMessage = window.getUserFriendlyMessage(event.reason, '操作失败：' + errorMsg);
    window.showToast(friendlyMessage, 'error');
  }
  // 阻止默认行为
  event.preventDefault();
});

// 捕获全局 JavaScript 错误
window.addEventListener('error', (event) => {
  console.error('[渲染进程] 全局错误:', event.error);
  
  // 记录日志
  window.logRendererError?.('global-error', '全局错误：' + event.message, event.error);
  
  // 显示错误提示
  if (window.showToast) {
    const friendlyMessage = window.getUserFriendlyMessage(event.error, '发生错误：' + event.message);
    window.showToast(friendlyMessage, 'error');
  }
  // 不阻止默认行为，让错误在控制台显示
});

// IPC 调用错误处理包装器
window.safeIpcCall = async function(ipcName, ...args) {
  try {
    if (!window.electronAPI || !window.electronAPI[ipcName]) {
      throw new Error(`IPC 方法不存在：${ipcName}`);
    }
    const result = await window.electronAPI[ipcName](...args);
    // 检查 IPC 返回的错误
    if (result && result.success === false) {
      // 使用用户友好的错误消息
      const friendlyError = window.getUserFriendlyMessage
        ? window.getUserFriendlyMessage(result.error, result.error)
        : result.error;
      throw new Error(friendlyError || '操作失败');
    }
    return result;
  } catch (error) {
    console.error(`[IPC 调用失败] ${ipcName}:`, error.message);
    // 显示用户友好的错误提示
    const friendlyMessage = window.getUserFriendlyMessage
      ? window.getUserFriendlyMessage(error, '操作失败')
      : error.message;
    if (window.showToast) {
      window.showToast(friendlyMessage, 'error');
    }
    throw error;
  }
};

// ========== 全局错误处理 结束 ==========


// ======= 应用初始化 开始 ========
// 状态管理器已自动同步到 window 对象
window.elements = elements;
window.electronAPI = window.electronAPI || null;

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  cacheDOMElements();
  initializeApp();
});

// 初始化应用
async function initializeApp() {
  // 从 window 对象读取（loadSettings 已经设置好了）
  // 使用状态管理器，避免局部变量
  window.setUseElectronAPI(!!(window.electronAPI));
  
  await window.loadSettings();
  
  // 从 window.settings 读取（loadSettings 已经设置好了）
  // 状态管理器已自动同步
  
  window.setSettings(window.settings);
  
  setupEventListeners();
  window.loadProjects();
  window.applyTheme(window.getTheme());
}
// ======= 应用初始化 结束 ========


// ======= 事件监听器设置 开始 ========
// 已移至 src/utils/eventListeners.js
// 使用 window.setupEventListeners()
// ======= 事件监听器设置 结束 ========


// ======= 项目管理功能 开始 ========
// 已移至 src/utils/projectCreator.js
// 使用 window.createProjectAI(), window.createProjectManual(), window.showNewProjectModal(),
//      window.hideNewProjectModal(), window.confirmCreateProject(), window.copyTemplate()
// ======= 项目管理功能 结束 ========

// 更新项目状态 - 使用模块中的 updateProjectStatus 函数
async function updateProjectStatus(project, newStatus) {
  await window.updateProjectStatus(
    project,
    newStatus,
    appState,
    useElectronAPI,
    loadProjects,
    showUpdateNotification
  );
}

// 删除当前项目 - 使用模块中的 deleteCurrentProject 函数
async function handleDeleteCurrentProject() {
  await window.deleteCurrentProject(
    elements,
    useElectronAPI,
    loadProjects,
    window.showToast,
    window.showConfirm
  );
}

async function openProjectFolder() {
  if (!appState.currentProject) {
    window.showToast('请先选择一个项目');
    return;
  }

  if (useElectronAPI && appState.currentProject.projectDir) {
    try {
      await window.electronAPI.openPath(appState.currentProject.projectDir);
    } catch (error) {
      console.error('打开文件夹异常:', error);
    }
  }
}
// ======= 项目管理功能 结束 ========


// ======= 模板库管理功能 开始 ========
// 已移至 src/utils/templateLibrary.js
// 使用 window.showTemplateLibraryModal(), window.hideTemplateLibraryModal(),
//      window.renderTemplateList(), window.activateTemplate(), window.addNewTemplate(),
//      window.editTemplate(), window.deleteTemplate(), window.saveTemplate(),
//      window.showTemplateEditor(), window.hideTemplateEditor(), window.cancelTemplateEdit(),
//      window.backupTemplates(), window.restoreTemplates(), window.openTemplateFolder()
// ======= 模板库管理功能 结束 ========


// ======= 自定义选项管理功能 开始 ========

// 加载指定组别的选项
async function loadOptionsByGroup(group) {
  if (!useElectronAPI) return [];
  try {
    const result = await window.electronAPI.getOptionsByGroup(group);
    return result.success ? (result.options || []) : [];
  } catch (error) {
    console.error(`加载${group}选项失败:`, error);
    return [];
  }
}
// ======= 自定义选项管理功能 结束 ========



// ======= 面板控制功能 开始 ========
function toggleBottomPanel() {
  if (elements.bottomPanel) {
    elements.bottomPanel.classList.toggle('collapsed');
  }
  if (elements.assetsPanel) {
    elements.assetsPanel.classList.toggle('collapsed');
  }
  const isCollapsed = elements.bottomPanel?.classList.contains('collapsed');
  if (elements.panelToggleBtn) {
    elements.panelToggleBtn.textContent = isCollapsed ? '▲' : '▼';
  }
}

function toggleBottomPanelByHeader(e) {
  if (e.target.classList.contains('icon-btn')) return;
  toggleBottomPanel();
}

function toggleAssetsPanelByHeader(e) {
  if (e.target.classList.contains('icon-btn')) return;
  toggleBottomPanel();
}
// ======= 面板控制功能 结束 ========



// ======= 全局变量导出 开始 ========
// 注意：必须在 initializeApp 之后调用，确保 useElectronAPI 已更新
function exposeGlobals() {
  // 导出 renderAssetsList - 素材库列表渲染（仅在 renderer.js 中定义）
  window.renderAssetsList = renderAssetsList;
}

// 在 initializeApp 中调用暴露
const originalInitializeApp = initializeApp;
initializeApp = async function() {
  await originalInitializeApp();
  exposeGlobals();
  
  // 初始化自动更新监听
  initUpdateListeners();
};
// ======= 全局变量导出 结束 ========

// ======= 自动更新监听 开始 ========
function initUpdateListeners() {
  if (!window.electronAPI) return;

  // 更新模态框元素
  let updateModal = null;

  window.electronAPI.onUpdateModalShow((data) => {
    // 创建模态框
    if (!updateModal) {
      updateModal = document.createElement('div');
      updateModal.id = 'update-modal';
      updateModal.className = 'update-modal';
      updateModal.innerHTML = `
        <div class="update-modal-content">
          <div class="update-modal-header">
            <h3>🔄 自动更新</h3>
          </div>
          <div class="update-modal-body">
            <div class="update-status" id="update-status">正在检查更新...</div>
            <div class="update-progress-container">
              <div class="update-progress-bar">
                <div class="update-progress-fill" id="update-progress-fill" style="width: 0%"></div>
              </div>
              <div class="update-progress-text" id="update-progress-text">0%</div>
            </div>
            <div class="update-info" id="update-info"></div>
          </div>
          <div class="update-modal-footer">
            <button class="update-modal-btn" id="update-cancel-btn" disabled>取消</button>
          </div>
        </div>
      `;
      document.body.appendChild(updateModal);
    }

    // 根据类型显示不同状态
    const statusEl = document.getElementById('update-status');
    const infoEl = document.getElementById('update-info');
    
    if (data.type === 'checking') {
      statusEl.textContent = '正在检查更新...';
      infoEl.textContent = '请稍候';
      document.getElementById('update-progress-fill').style.width = '0%';
      document.getElementById('update-progress-text').textContent = '0%';
    }

    // 显示模态框（添加激活类）
    updateModal.classList.add('active');
    // 禁用所有操作
    document.body.classList.add('update-lock');
  });

  window.electronAPI.onUpdateModalProgress((progress) => {
    if (!updateModal) return;
    
    const percent = Math.round(progress.percent);
    const statusEl = document.getElementById('update-status');
    const infoEl = document.getElementById('update-info');
    
    statusEl.textContent = '正在下载更新...';
    infoEl.textContent = `${(progress.bytesPerSecond / 1024 / 1024).toFixed(2)} MB/s`;
    document.getElementById('update-progress-fill').style.width = `${percent}%`;
    document.getElementById('update-progress-text').textContent = `${percent}%`;
  });

  window.electronAPI.onUpdateModalDownloaded((info) => {
    if (!updateModal) return;
    
    const statusEl = document.getElementById('update-status');
    const infoEl = document.getElementById('update-info');
    
    statusEl.textContent = '更新已下载完成！';
    infoEl.textContent = `版本 ${info.version}`;
    document.getElementById('update-progress-fill').style.width = '100%';
    document.getElementById('update-progress-text').textContent = '100%';
    
    // 启用安装按钮
    const cancelBtn = document.getElementById('update-cancel-btn');
    cancelBtn.textContent = '立即安装并重启';
    cancelBtn.disabled = false;
    cancelBtn.onclick = () => {
      window.electronAPI.installAndUpdate();
    };
  });

  window.electronAPI.onUpdateModalHide(() => {
    if (!updateModal) return;
    
    // 隐藏模态框
    updateModal.classList.remove('active');
    // 恢复操作
    document.body.classList.remove('update-lock');
    
    // 延迟移除 DOM（等待动画完成）
    setTimeout(() => {
      if (updateModal) {
        updateModal.remove();
        updateModal = null;
      }
    }, 300);
  });

  // 原有的监听器（保留用于兼容）
  window.electronAPI.onUpdateChecking(() => {
    console.log('[更新] 正在检查更新...');
  });

  window.electronAPI.onUpdateAvailable((info) => {
    console.log('[更新] 发现新版本:', info.version);
    // 更新模态框状态
    const updateModal = document.getElementById('update-modal');
    if (updateModal) {
      const statusEl = document.getElementById('update-status');
      const infoEl = document.getElementById('update-info');
      if (statusEl) statusEl.textContent = `发现新版本 ${info.version}`;
      if (infoEl) infoEl.textContent = '准备下载...';
    }
    
    // 短暂延迟后自动开始下载（不需要确认）
    setTimeout(() => {
      window.electronAPI.startUpdateDownload();
    }, 500);
  });

  window.electronAPI.onUpdateNotAvailable(() => {
    console.log('[更新] 已是最新版本');
    window.showToast('已是最新版本', 'success');
  });

  window.electronAPI.onUpdateDownloadProgress((progress) => {
    console.log('[更新] 下载进度:', progress.percent.toFixed(1) + '%');
  });

  window.electronAPI.onUpdateDownloaded((info) => {
    console.log('[更新] 更新已下载完成，版本:', info.version);
  });

  window.electronAPI.onUpdateError((error) => {
    console.error('[更新] 错误:', error);
    window.showToast('更新失败：' + (error.message || '未知错误'), 'error');
  });
}
// ======= 自动更新监听 结束 ========


// ======= 恢复出厂设置监听 开始 ========
// 监听菜单中的恢复出厂设置
window.electronAPI.onFactoryReset(async () => {
  const confirmed = await window.showConfirm(
    '恢复出厂设置',
    '确定要恢复出厂设置吗？\n\n此操作将清空：\n• 存储路径设置\n• API Keys\n• 模板配置\n• 自定义选项\n\n此操作不可撤销！',
    '确认重置',
    '取消'
  );

  if (!confirmed) return;

  try {
    const result = await window.electronAPI.factoryReset();
    if (result.success) {
      window.showToast('正在重置并重启应用...');
    } else if (result.canceled) {
      window.showToast('已取消重置');
    } else {
      window.showToast('重置失败：' + (result.error || '未知错误'));
    }
  } catch (error) {
    window.showToast('重置失败：' + error.message);
  }
});

// 监听执行重置（从主进程发送）
window.electronAPI.onFactoryResetExecute(() => {
  // 清空 localStorage
  localStorage.clear();
  console.log('[恢复出厂设置] localStorage 已清空');
});
// ======= 恢复出厂设置监听 结束 ========


// ======= 数据迁移监听 开始 ========
// 监听数据迁移完成（从主进程发送）
window.electronAPI.onDataMigrationComplete((data) => {
  if (data.success && data.migrated && data.migrated.length > 0) {
    // 显示迁移成功提示
    const migratedFiles = data.migrated.join('、');
    window.showToast(`数据已迁移：${migratedFiles}`);

    // 显示迁移详情对话框
    showMigrationDialog(data.migrated);
  } else if (!data.success) {
    window.showToast('数据迁移失败：' + (data.error || '未知错误'), 'error');
  }
});

// 显示迁移详情对话框
function showMigrationDialog(migratedFiles) {
  const dialog = document.createElement('div');
  dialog.className = 'migration-dialog';
  dialog.innerHTML = `
    <div class="migration-dialog-content">
      <div class="migration-dialog-header">
        <h3>📦 数据迁移完成</h3>
      </div>
      <div class="migration-dialog-body">
        <p>欢迎使用 Kim 分镜助手！</p>
        <p>检测到您是首次使用新版本，我们已将旧版本的配置数据迁移到新的存储位置：</p>
        <ul class="migration-list">
          ${migratedFiles.map(f => `<li>✅ ${f}</li>`).join('')}
        </ul>
        <p class="migration-hint">
          💡 新的配置文件存储在：<br>
          <code>文档/KimStoryboard/.config/</code>
        </p>
        <p class="migration-hint">
          这样即使将来更新应用版本，您的配置数据也不会丢失。
        </p>
      </div>
      <div class="migration-dialog-footer">
        <button class="btn btn-primary" onclick="this.closest('.migration-dialog').remove()">知道了</button>
      </div>
    </div>
  `;
  document.body.appendChild(dialog);

  // 添加样式
  const style = document.createElement('style');
  style.textContent = `
    .migration-dialog {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }
    .migration-dialog-content {
      background: var(--panel-bg);
      border-radius: 8px;
      padding: 0;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
    .migration-dialog-header {
      padding: 20px;
      border-bottom: 1px solid var(--border-color);
      background: var(--border-color);
      border-radius: 8px 8px 0 0;
    }
    .migration-dialog-header h3 {
      margin: 0;
      color: var(--text-color);
      font-size: 18px;
    }
    .migration-dialog-body {
      padding: 20px;
      color: var(--text-color);
      line-height: 1.8;
    }
    .migration-dialog-body p {
      margin-bottom: 12px;
    }
    .migration-list {
      background: var(--border-color);
      padding: 15px 20px;
      border-radius: 4px;
      margin: 10px 0;
      list-style: none;
    }
    .migration-list li {
      padding: 5px 0;
      color: var(--text-color);
    }
    .migration-hint {
      font-size: 12px;
      color: #888 !important;
      margin-top: 15px !important;
    }
    .migration-hint code {
      background: var(--border-color);
      padding: 2px 6px;
      border-radius: 3px;
      font-family: monospace;
      font-size: 11px;
    }
    .migration-dialog-footer {
      padding: 15px 20px;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: flex-end;
    }
    .btn {
      padding: 8px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    .btn-primary {
      background: #4a9eff;
      color: white;
    }
    .btn-primary:hover {
      background: #3a8eef;
    }
  `;
  document.head.appendChild(style);
}
// ======= 数据迁移监听 结束 ========


// ======= 素材库 开始 ========

// 渲染素材库列表（占位符）
// 注意：此函数仅在 renderer.js 中定义，已被 window.renderAssetsList 引用
function renderAssetsList(assets) {
  if (!elements.assetsList) return;

  elements.assetsList.innerHTML = '';

  if (!assets || assets.length === 0) {
    // 显示当前项目/片段的素材统计
    if (appState.currentProject) {
      const project = appState.currentProject;
      const shots = project.shots || [];
      const totalScenes = shots.reduce((sum, shot) => sum + (shot.scenes ? shot.scenes.length : 0), 0);

      elements.assetsList.innerHTML = `
        <div class="asset-item">
          <div class="asset-item-title">📁 项目信息</div>
          <div class="asset-item-subtitle">片段数：${shots.length}</div>
          <div class="asset-item-subtitle">镜头数：${totalScenes}</div>
        </div>
        <div class="asset-item">
          <div class="asset-item-title">📂 素材统计</div>
          <div class="asset-item-subtitle">图片：0</div>
          <div class="asset-item-subtitle">视频：0</div>
          <div class="asset-item-subtitle">音频：0</div>
        </div>
        <div class="placeholder-text" style="margin-top: 20px; font-size: 12px;">
          素材管理功能待实现
        </div>
      `;
    } else {
      elements.assetsList.innerHTML = '<div class="placeholder-text">请选择项目</div>';
    }
    return;
  }

  assets.forEach(asset => {
    const assetElement = document.createElement('div');
    assetElement.className = 'asset-item';
    assetElement.innerHTML = `
      <div class="asset-item-title">${asset.name || '未命名'}</div>
      <div class="asset-item-subtitle">${asset.type || 'unknown'} • ${asset.size || ''}</div>
    `;
    elements.assetsList.appendChild(assetElement);
  });
}
// ======= 素材库 结束 ========
