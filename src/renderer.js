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
/** ======= 文件头注释和模块导入说明 结束 ======== */


/**  ======= 全局变量定义 开始 ======== */
// 应用数据状态
let appState = {
  projects: [],
  currentProject: null,
  currentShot: null,
  currentScene: null,
  projectData: null
};
let currentTheme = 'light';
let useElectronAPI = false;
let settings = {
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

// 自动保存相关全局变量
window.shotSaveTimeout = null;
window.savingShotId = null;
window.sceneSaveTimeout = null;
window.savingSceneId = null;

// 面板拖拽相关全局变量
let isResizing = false;
let currentResizer = null;
let startX = 0;
let startWidth = 0;
let currentPanel = null;
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
  elements.bottomPanelTitle = document.getElementById('bottom-panel-title');
  elements.panelToggleHeader = document.getElementById('panel-toggle-header');
}
/** ======= DOM 元素缓存 结束 ======== */


// ======= 应用初始化 开始 ========
// 导出全局变量供模块使用
window.appState = appState;
window.elements = elements;
window.useElectronAPI = useElectronAPI;
window.electronAPI = window.electronAPI || null;

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  cacheDOMElements();
  initializeApp();
});

// 初始化应用
async function initializeApp() {
  useElectronAPI = !!(window.electronAPI);

  await window.loadSettings();

  // 从 window.settings 读取（loadSettings 已经设置好了）
  // 同步到局部 settings 变量，保持代码兼容
  settings = window.settings;

  window.useElectronAPI = useElectronAPI;
  window.elements = elements;
  window.appState = appState;

  setupEventListeners();
  window.loadProjects();
  window.applyTheme(window.currentTheme);
}
// ======= 应用初始化 结束 ========


// ======= 事件监听器设置 开始 ========
// 设置事件监听器
function setupEventListeners() {
  // 初始化面板拖拽
  initPanelResizers();

  // 主界面按钮
  if (elements.newProjectBtn) {
    elements.newProjectBtn.addEventListener('click', showNewProjectModal);
  }
  if (elements.refreshProjectsBtn) {
    elements.refreshProjectsBtn.addEventListener('click', window.loadProjects);
  }
  if (elements.newShotBtn) {
    elements.newShotBtn.addEventListener('click', createNewShot);
  }
  if (elements.deleteShotBtn) {
    elements.deleteShotBtn.addEventListener('click', deleteSelectedShot);
  }
  if (elements.newSceneBtn) {
    elements.newSceneBtn.addEventListener('click', createNewScene);
  }
  if (elements.deleteSceneBtn) {
    elements.deleteSceneBtn.addEventListener('click', deleteSelectedScene);
  }
  if (elements.copyPromptBtn) {
    elements.copyPromptBtn.addEventListener('click', () => window.copyPromptToClipboard());
  }
  if (elements.exportPromptBtn) {
    elements.exportPromptBtn.addEventListener('click', () => window.exportPrompt());
  }
  if (elements.clearPromptBtn) {
    elements.clearPromptBtn.addEventListener('click', () => window.clearPrompt());
  }
  if (elements.panelToggleBtn) {
    elements.panelToggleBtn.addEventListener('click', toggleBottomPanel);
  }
  if (elements.panelToggleHeader) {
    elements.panelToggleHeader.addEventListener('click', toggleBottomPanelByHeader);
  }
  if (elements.assetsPanelToggleBtn) {
    elements.assetsPanelToggleBtn.addEventListener('click', toggleBottomPanel);
  }
  if (elements.assetsPanelToggleHeader) {
    elements.assetsPanelToggleHeader.addEventListener('click', toggleAssetsPanelByHeader);
  }
  if (elements.viewToggleBtn) {
    elements.viewToggleBtn.addEventListener('click', () => window.showToast('视图切换功能待实现'));
  }

  // 模态框按钮
  if (elements.closeSettingsBtn) {
    elements.closeSettingsBtn.addEventListener('click', hideSettingsModal);
  }
  if (elements.closeNewProjectBtn) {
    elements.closeNewProjectBtn.addEventListener('click', hideNewProjectModal);
  }
  if (elements.saveSettingsBtn) {
    elements.saveSettingsBtn.addEventListener('click', () => {
      window.saveSettings();
      window.hideSettingsModal();
    });
  }
  if (elements.cancelSettingsBtn) {
    elements.cancelSettingsBtn.addEventListener('click', window.hideSettingsModal);
  }
  if (elements.createProjectBtn) {
    elements.createProjectBtn.addEventListener('click', confirmCreateProject);
  }
  if (elements.cancelNewProjectBtn) {
    elements.cancelNewProjectBtn.addEventListener('click', hideNewProjectModal);
  }

  // 主题切换
  elements.themeToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      currentTheme = theme;
      window.applyTheme(theme);
      elements.themeToggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // 更改存储路径
  if (elements.changePathBtn) {
    elements.changePathBtn.addEventListener('click', async () => {
      if (useElectronAPI) {
        const path = await window.electronAPI.openProjectDialog();
        if (path) {
          elements.storagePathInput.value = path;
        }
      }
    });
  }

  // API 提供商切换
  if (elements.apiProviderSelect) {
    elements.apiProviderSelect.addEventListener('change', (e) => {
      const provider = e.target.value;
      if (elements.deepseekConfig) elements.deepseekConfig.style.display = provider === 'deepseek' ? 'block' : 'none';
      if (elements.doubaoConfig) elements.doubaoConfig.style.display = provider === 'doubao' ? 'block' : 'none';
      if (elements.qianwenConfig) elements.qianwenConfig.style.display = provider === 'qianwen' ? 'block' : 'none';
      if (elements.ailianConfig) elements.ailianConfig.style.display = provider === 'ailian' ? 'block' : 'none';
    });
  }

  // 测试连接按钮
  if (elements.testDeepseekBtn) {
    elements.testDeepseekBtn.addEventListener('click', () => window.testApiConnection('deepseek'));
  }
  if (elements.testDoubaoBtn) {
    elements.testDoubaoBtn.addEventListener('click', () => window.testApiConnection('doubao'));
  }
  if (elements.testQianwenBtn) {
    elements.testQianwenBtn.addEventListener('click', () => window.testApiConnection('qianwen'));
  }
  if (elements.testAilianBtn) {
    elements.testAilianBtn.addEventListener('click', () => window.testApiConnection('ailian'));
  }

  // 切换 API Key 可见性
  if (elements.toggleDeepseekKey) {
    elements.toggleDeepseekKey.addEventListener('click', () => window.toggleApiKeyVisibility(elements.deepseekApiKey));
  }
  if (elements.toggleDoubaoKey) {
    elements.toggleDoubaoKey.addEventListener('click', () => window.toggleApiKeyVisibility(elements.doubaoApiKey));
  }
  if (elements.toggleQianwenKey) {
    elements.toggleQianwenKey.addEventListener('click', () => window.toggleApiKeyVisibility(elements.qianwenApiKey));
  }
  if (elements.toggleAilianKey) {
    elements.toggleAilianKey.addEventListener('click', () => window.toggleApiKeyVisibility(elements.ailianApiKey));
  }
  // 模式切换
  elements.modeTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.stopPropagation();
      const mode = tab.dataset.mode;

      // 移除所有 tab 的 active 状态
      elements.modeTabs.forEach(t => t.classList.remove('active'));
      // 添加当前 tab 的 active 状态
      tab.classList.add('active');

      // 切换内容区域
      if (elements.manualMode) elements.manualMode.classList.remove('active');
      if (elements.aiMode) elements.aiMode.classList.remove('active');

      if (mode === 'manual') {
        if (elements.manualMode) elements.manualMode.classList.add('active');
      } else {
        if (elements.aiMode) elements.aiMode.classList.add('active');
        checkApiStatus();
      }
    });
  });

  // 复制模板按钮
  if (elements.copyTemplateBtn) {
    elements.copyTemplateBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      copyTemplate();
    });
  }

  // Electron API 事件监听
  if (window.electronAPI) {
    window.electronAPI.onSettingsOpen(() => window.showSettingsModal());
    window.electronAPI.onThemeToggle(() => window.toggleTheme());
    window.electronAPI.onTemplateLibraryOpen(() => showTemplateLibraryModal());
    window.electronAPI.onCustomOptionsOpen(() => window.showCustomOptionsModal());
  }

  // 模态框背景点击关闭
  if (elements.settingsModal) {
    elements.settingsModal.addEventListener('click', (e) => {
      if (e.target === elements.settingsModal) window.hideSettingsModal();
    });
  }
  if (elements.newProjectModal) {
    elements.newProjectModal.addEventListener('click', (e) => {
      if (e.target === elements.newProjectModal) hideNewProjectModal();
    });
  }
  if (elements.templateLibraryModal) {
    elements.templateLibraryModal.addEventListener('click', (e) => {
      if (e.target === elements.templateLibraryModal) hideTemplateLibraryModal();
    });
  }

  // 模板库事件监听
  if (elements.closeTemplateBtn) {
    elements.closeTemplateBtn.addEventListener('click', hideTemplateLibraryModal);
  }
  if (elements.closeTemplateLibBtn) {
    elements.closeTemplateLibBtn.addEventListener('click', hideTemplateLibraryModal);
  }
  if (elements.addTemplateBtn) {
    elements.addTemplateBtn.addEventListener('click', addNewTemplate);
  }
  if (elements.saveTemplateBtn) {
    elements.saveTemplateBtn.addEventListener('click', saveTemplate);
  }
  if (elements.cancelTemplateBtn) {
    elements.cancelTemplateBtn.addEventListener('click', cancelTemplateEdit);
  }

  // AI 生成提示词事件
  if (elements.generatePromptBtn) {
    elements.generatePromptBtn.addEventListener('click', () => window.generatePromptFromAI());
  }

  // 模板数据管理事件
  if (elements.backupTemplatesBtn) {
    elements.backupTemplatesBtn.addEventListener('click', backupTemplates);
  }
  if (elements.restoreTemplatesBtn) {
    elements.restoreTemplatesBtn.addEventListener('click', restoreTemplates);
  }
  if (elements.openTemplateFolderBtn) {
    elements.openTemplateFolderBtn.addEventListener('click', openTemplateFolder);
  }

  // 自定义选项管理事件
  if (elements.manageCustomOptionsBtn) {
    elements.manageCustomOptionsBtn.addEventListener('click', () => window.showCustomOptionsModal());
  }
  if (elements.closeCustomOptionsBtn) {
    elements.closeCustomOptionsBtn.addEventListener('click', () => window.hideCustomOptionsModal());
  }
  if (elements.closeCustomOptionsModalBtn) {
    elements.closeCustomOptionsModalBtn.addEventListener('click', () => window.hideCustomOptionsModal());
  }
  if (elements.addCustomOptionBtn) {
    elements.addCustomOptionBtn.addEventListener('click', () => window.showAddCustomOptionForm());
  }
  if (elements.refreshCustomOptionsBtn) {
    elements.refreshCustomOptionsBtn.addEventListener('click', () => window.loadCustomOptionsList('all'));
  }
  // 分栏按钮事件
  if (elements.refreshBuiltinBtn) {
    elements.refreshBuiltinBtn.addEventListener('click', () => window.loadCustomOptionsList('all'));
  }
  if (elements.addCustomOptionColumnBtn) {
    elements.addCustomOptionColumnBtn.addEventListener('click', () => window.showAddCustomOptionForm());
  }
  if (elements.refreshCustomColumnBtn) {
    elements.refreshCustomColumnBtn.addEventListener('click', () => window.loadCustomOptionsList('all'));
  }
  if (elements.saveCustomOptionBtn) {
    elements.saveCustomOptionBtn.addEventListener('click', () => window.saveCustomOption());
  }
  if (elements.cancelCustomOptionBtn) {
    elements.cancelCustomOptionBtn.addEventListener('click', () => window.hideCustomOptionForm());
  }
  if (elements.customOptionsGroupFilter) {
    elements.customOptionsGroupFilter.addEventListener('change', () => {
      window.loadCustomOptionsList(elements.customOptionsGroupFilter.value);
    });
  }

  // 编辑弹窗事件绑定
  if (elements.closeCustomOptionEditBtn) {
    elements.closeCustomOptionEditBtn.addEventListener('click', () => window.hideCustomOptionEditModal());
  }
  if (elements.saveCustomOptionEditBtn) {
    elements.saveCustomOptionEditBtn.addEventListener('click', () => window.saveCustomOptionEdit());
  }
  if (elements.cancelCustomOptionEditBtn) {
    elements.cancelCustomOptionEditBtn.addEventListener('click', () => window.hideCustomOptionEditModal());
  }
}
// ======= 事件监听器设置 结束 ========


// ======= 项目管理功能 开始 ========
// AI 创建项目（使用预览的数据）
async function createProjectAI() {
  const name = elements.aiProjectName?.value.trim();
  const description = elements.aiProjectDesc?.value.trim();
  const ratio = elements.aiProjectRatio?.value || '16:9';

  // 检查是否有预览数据
  const previewData = elements.aiResponsePreview?.value.trim();

  if (!name) {
    showInputError(elements.aiProjectName, '请输入项目名称');
    return;
  }

  if (!previewData) {
    alert('请先生成提示词并获取 AI 返回数据');
    return;
  }

  // 解析预览数据
  let jsonData;
  try {
    jsonData = JSON.parse(previewData);
  } catch (e) {
    alert('预览数据格式错误：' + e.message);
    return;
  }

  hideNewProjectModal();

  if (useElectronAPI) {
    try {
      // 组合项目数据
      const projectData = {
        project: {
          id: `proj_${Date.now()}`,
          name: name,
          description: description || jsonData.project?.description || '',
          status: 'draft',
          aspectRatio: ratio,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        shots: jsonData.shots || [],
        promptTemplates: [
          {
            id: 'default_shot',
            name: '默认片段提示词模板',
            content: '【片段名称】{name} 【总时长】{duration}秒 【画幅】{aspectRatio} 【风格】{style} 【情绪】{mood}\n{scenesPrompt}'
          }
        ],
        selected: {
          projectId: `proj_${Date.now()}`,
          shotId: null,
          sceneId: null
        },
        theme: {
          currentTheme: 'light',
          light: {
            background: '#ffffff',
            text: '#333333',
            border: '#e0e0e0',
            icon: '#000000',
            hover: '#f0f0f0',
            selected: '#e8e8e8',
            promptHighlight: '#666666'
          },
          dark: {
            background: '#333333',
            text: '#e0e0e0',
            border: '#555555',
            icon: '#e0e0e0',
            hover: '#444444',
            selected: '#555555',
            promptHighlight: '#bbbbbb'
          }
        }
      };

      const result = await window.electronAPI.createProject({
        ...projectData,
        baseDir: settings.storagePath || ''
      });
      if (result.success) {
        await window.loadProjects();
        showUpdateNotification();
      } else {
        alert('创建项目失败：' + result.error);
      }
    } catch (error) {
      console.error('创建项目异常:', error);
      alert('创建项目失败：' + error.message);
    }
  }
}

// 显示新建项目弹窗
function showNewProjectModal() {
  if (!elements.newProjectModal) return;

  // 关键修复：确保 loading-overlay 已隐藏（z-index=3000 会覆盖模态框）
  if (elements.loadingOverlay) {
    elements.loadingOverlay.style.display = 'none';
  }

  // 清空输入
  if (elements.manualProjectName) elements.manualProjectName.value = '';
  if (elements.manualProjectDesc) elements.manualProjectDesc.value = '';
  if (elements.manualProjectRatio) elements.manualProjectRatio.value = '16:9';
  if (elements.manualProjectJson) elements.manualProjectJson.value = '';
  if (elements.aiProjectName) elements.aiProjectName.value = '';
  if (elements.aiProjectDesc) elements.aiProjectDesc.value = '';
  if (elements.aiProjectRatio) elements.aiProjectRatio.value = '16:9';
  if (elements.aiProjectScript) elements.aiProjectScript.value = '';
  if (elements.aiProvider) elements.aiProvider.value = settings.apiProvider || 'deepseek';
  if (elements.aiApiStatus) elements.aiApiStatus.textContent = '';
  if (elements.aiResponsePreview) elements.aiResponsePreview.value = '';

  // 切换到手动模式 - 直接操作样式，避免触发事件
  elements.manualMode?.classList.add('active');
  elements.aiMode?.classList.remove('active');

  // 更新 tab 样式
  elements.modeTabs.forEach(tab => {
    if (tab.dataset.mode === 'manual') {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // 显示模态框
  elements.newProjectModal.style.display = 'flex';

  // 关键修复：强制重绘模态框内容，解决点击无反应问题
  const modalContent = elements.newProjectModal.querySelector('.modal-content');
  if (modalContent) {
    modalContent.style.display = 'none';
    void modalContent.offsetHeight;
    modalContent.style.display = '';
  }

  // 清除可能存在的错误提示
  document.querySelectorAll('.input-error-message').forEach(el => el.remove());
  document.querySelectorAll('#new-project-modal input, #new-project-modal textarea').forEach(el => {
    el.style.borderColor = '';
    el.style.backgroundColor = '';
  });

  // 聚焦到项目名称输入框
  if (elements.manualProjectName) {
    elements.manualProjectName.focus();
    // 设置可交互样式
    elements.manualProjectName.style.pointerEvents = 'auto';
    elements.manualProjectName.style.cursor = 'text';
  }
}

// 隐藏新建项目弹窗
function hideNewProjectModal() {
  if (elements.newProjectModal) {
    elements.newProjectModal.style.display = 'none';
  }
}

// 确认创建项目
async function confirmCreateProject() {
  const activeMode = document.querySelector('.mode-tab.active')?.dataset.mode;

  if (activeMode === 'manual') {
    await createProjectManual();
  } else {
    await createProjectAI();
  }
}

// 手动创建项目
async function createProjectManual() {
  const name = elements.manualProjectName?.value.trim();
  const description = elements.manualProjectDesc?.value.trim();
  const ratio = elements.manualProjectRatio?.value || '16:9';
  const script = elements.manualProjectScript?.value.trim();
  const jsonStr = elements.manualProjectJson?.value.trim();

  if (!name) {
    showInputError(elements.manualProjectName, '请输入项目名称');
    return;
  }

  if (!script && !jsonStr) {
    showInputError(elements.manualProjectScript, '请输入项目剧本或结构化 JSON 数据（二选一）');
    return;
  }

  // 如果有 JSON 数据，直接使用
  if (jsonStr) {
    let jsonData;
    try {
      jsonData = JSON.parse(jsonStr);
    } catch (e) {
      showInputError(elements.manualProjectJson, 'JSON 格式错误：' + e.message);
      return;
    }

    hideNewProjectModal();

    if (useElectronAPI) {
      try {
        // 组合项目数据
        const projectData = {
          project: {
            id: `proj_${Date.now()}`,
            name: name,
            description: description || jsonData.project?.description || '',
            status: 'draft',
            aspectRatio: ratio,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          shots: jsonData.shots || [],
          promptTemplates: [
            {
              id: 'default_shot',
              name: '默认片段提示词模板',
              content: '【片段名称】{name} 【总时长】{duration}秒 【画幅】{aspectRatio} 【风格】{style} 【情绪】{mood}\n{scenesPrompt}'
            }
          ],
          selected: {
            projectId: `proj_${Date.now()}`,
            shotId: null,
            sceneId: null
          },
          theme: {
            currentTheme: 'light',
            light: {
              background: '#ffffff',
              text: '#333333',
              border: '#e0e0e0',
              icon: '#000000',
              hover: '#f0f0f0',
              selected: '#e8e8e8',
              promptHighlight: '#666666'
            },
            dark: {
              background: '#333333',
              text: '#e0e0e0',
              border: '#555555',
              icon: '#e0e0e0',
              hover: '#444444',
              selected: '#555555',
              promptHighlight: '#bbbbbb'
            }
          }
        };

        const result = await window.electronAPI.createProject({
          ...projectData,
          baseDir: settings.storagePath || ''
        });
        if (result.success) {
          await window.loadProjects();
          showUpdateNotification();
        } else {
          alert('创建项目失败：' + result.error);
        }
      } catch (error) {
        console.error('创建项目异常:', error);
        alert('创建项目失败：' + error.message);
      }
    }
    return;
  }

  // 如果有剧本数据，使用 AI 生成
  if (script) {
    hideNewProjectModal();
    showLoading('正在生成结构化数据...');

    try {
      const provider = settings.apiProvider || 'deepseek';
      const apiKey = settings.apiKeys[provider];
      const model = settings.models[provider];

      if (!apiKey) {
        hideLoading();
        alert('请先在设置中配置 API Key');
        window.showSettingsModal();
        return;
      }

      const prompt = buildPromptFromTemplate(script);

      const result = await window.electronAPI.callLlmApi(provider, apiKey, model, prompt);

      if (result.success) {
        let jsonData;
        try {
          const jsonMatch = result.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            jsonData = JSON.parse(jsonMatch[0]);
          } else {
            jsonData = JSON.parse(result.content);
          }

          const projectData = {
            id: `proj_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
            name: name,
            description: description,
            aspectRatio: ratio,
            ...jsonData
          };

          const createResult = await window.electronAPI.createProject(projectData);
          if (createResult.success) {
            await window.loadProjects();
            showUpdateNotification();
          } else {
            alert('创建项目失败：' + createResult.error);
          }
        } catch (e) {
          alert('AI 返回的数据格式错误：' + e.message);
        }
      } else {
        alert('AI 调用失败：' + result.error);
      }
    } catch (error) {
      console.error('AI 调用异常:', error);
      alert('AI 调用失败：' + error.message);
    } finally {
      hideLoading();
    }
    return;
  }
}

// 构建提示词模板
function buildPromptFromTemplate(script) {
  return `你是一位专业的视频分镜脚本助手。请将以下剧本内容转换为结构化的 JSON 格式片段数据。

剧本内容：
${script}

重要约束：
1. 每个片段 (shot) 的总时长不能超过 15 秒
2. 片段内所有镜头 (scenes) 的时长相加不能超过 15 秒
3. 每个镜头的时长建议在 2-5 秒之间
4. 镜头描述要简洁明确，便于视觉化呈现
5. 必须包含景别和运镜信息
6. 【重要】对话台词格式要求：如果镜头中有多人对话，必须标明说话人，格式为：角色名："台词内容"。例如：张三："你好吗？" 李四："我很好，谢谢！"
7. 【重要】时长分配要求：必须根据台词长度合理分配镜头时长。一般情况下，每个汉字需要约 0.3-0.5 秒的朗读时间，请确保 duration 足够角色说完所有台词

景别选项（shotType）：
- 特写 (Close-up)
- 近景 (Medium Close-up)
- 中景 (Medium Shot)
- 全景 (Full Shot)
- 远景 (Long Shot)
- 大远景 (Extreme Long Shot)

镜头角度（angle）：
- 平视 (Eye Level)
- 俯视 (High Angle)
- 仰视 (Low Angle)
- 过肩 (Over the Shoulder)
- 鸟瞰 (Bird's Eye View)
- 倾斜 (Dutch Angle)

运镜方式（camera）：
- 固定镜头 (Static)
- 推镜头 (Push In)
- 拉镜头 (Pull Out)
- 摇镜头 (Pan)
- 跟镜头 (Follow)
- 升降镜头 (Crane)
- 环绕镜头 (Orbit)
- 手持镜头 (Handheld)

请严格按照以下 JSON 格式返回数据（只返回 JSON，不要其他说明文字）：

{
  "project": {
    "name": "项目名称",
    "description": "项目描述",
    "aspectRatio": "16:9",
    "status": "draft"
  },
  "shots": [
    {
      "name": "片段名称",
      "description": "片段描述",
      "duration": 10,
      "aspectRatio": "16:9",
      "style": "风格",
      "mood": "情绪",
      "scenes": [
        {
          "name": "镜头描述",
          "shotType": "中景",
          "angle": "平视",
          "camera": "推镜头",
          "content": "详细的画面内容描述",
          "duration": 5,
          "dialogue": "张三：\\"你好，很高兴见到你！\\"",
          "emotion": "情绪氛围",
          "notes": "备注说明"
        }
      ]
    }
  ]
}

要求：
- 镜头名称要简洁有力
- 片段描述 (name) 要具体可视化
- 景别 (shotType) 必须从上述选项中选择
- 镜头角度 (angle) 必须从上述选项中选择
- 运镜 (camera) 必须从上述选项中选择
- 内容 (content) 要详细描述画面
- 时长分配要合理，特别注意：
  * 如果有台词，请计算台词字数，按每个汉字 0.3-0.5 秒估算朗读时间
  * duration 必须大于等于台词朗读所需时间
  * 例如：20 个字的台词至少需要 6-10 秒的 duration
- 对话台词 (dialogue) 格式：
  * 单人台词：直接写台词内容
  * 多人对话：必须标明说话人，格式为 角色名："台词" 角色名："台词"
  * 示例：张三："你好吗？" 李四："我很好！"
- 确保每个镜头总时长≤15 秒
- 返回标准 JSON 格式，可直接解析
- 所有字段都要填写，没有内容的字段填空字符串""`;
}

// 复制模板（使用激活的模板）
function copyTemplate() {
  const scriptContent = elements.manualProjectScript?.value.trim() || elements.aiProjectScript?.value.trim() || '';

  if (!scriptContent) {
    alert('请先输入项目剧本内容');
    if (elements.manualProjectScript) elements.manualProjectScript.focus();
    return;
  }

  // 获取激活的模板
  const activeTemplate = settings.templates.find(t => t.id === settings.activeTemplateId);
  const template = activeTemplate || getDefaultTemplate();

  // 替换 {剧本内容} 占位符
  const finalTemplate = template.content.replace('{剧本内容}', scriptContent);

  navigator.clipboard.writeText(finalTemplate).then(() => {
    const btn = elements.copyTemplateBtn;
    const originalText = btn.textContent;
    btn.textContent = '✓ 已复制';
    setTimeout(() => {
      btn.textContent = originalText;
    }, 2000);
  }).catch(err => {
    console.error('复制失败:', err);
    alert('复制失败，请手动复制');
  });
}

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
async function deleteCurrentProject() {
  await window.deleteCurrentProject(
    appState,
    elements,
    useElectronAPI,
    loadProjects,
    renderShotList,
    renderSceneList,
    window.showToast,
    window.showConfirm
  );
}

async function openProjectFolder() {
  if (!appState.currentProject) {
    alert('请先选择一个项目');
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
// ========== 模板库管理 ==========

// 显示模板库面板
function showTemplateLibraryModal() {
  if (!elements.templateLibraryModal) return;
  renderTemplateList();
  elements.templateLibraryModal.style.display = 'flex';
}

// 隐藏模板库面板
function hideTemplateLibraryModal() {
  if (elements.templateLibraryModal) {
    elements.templateLibraryModal.style.display = 'none';
    hideTemplateEditor();
  }
}

// 渲染模板列表
function renderTemplateList() {
  if (!elements.templateList) return;

  elements.templateList.innerHTML = '';

  if (settings.templates.length === 0) {
    elements.templateList.innerHTML = '<div class="placeholder-text">暂无模板，点击"+ 添加模板"创建</div>';
    return;
  }

  settings.templates.forEach(template => {
    const item = document.createElement('div');
    item.className = 'template-item';
    if (template.id === settings.activeTemplateId) {
      item.classList.add('active');
    }

    item.innerHTML = `
      <div class="template-item-info">
        <div class="template-item-name">${template.name}</div>
        <div class="template-item-desc">${template.description || ''}</div>
      </div>
      <div class="template-item-actions">
        <button class="form-btn small-btn template-activate-btn" data-id="${template.id}">
          ${template.id === settings.activeTemplateId ? '✓ 已激活' : '激活'}
        </button>
        <button class="form-btn small-btn template-edit-btn" data-id="${template.id}">编辑</button>
        <button class="form-btn small-btn template-delete-btn" data-id="${template.id}">删除</button>
      </div>
    `;

    elements.templateList.appendChild(item);
  });

  // 绑定事件
  document.querySelectorAll('.template-activate-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      activateTemplate(btn.dataset.id);
    });
  });

  document.querySelectorAll('.template-edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      editTemplate(btn.dataset.id);
    });
  });

  document.querySelectorAll('.template-delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await deleteTemplate(btn.dataset.id);
    });
  });
}

// 激活模板
function activateTemplate(templateId) {
  settings.activeTemplateId = templateId;
  saveSettingsToStorage();
  renderTemplateList();
  showUpdateNotification();
}

// 添加新模板
function addNewTemplate() {
  showTemplateEditor();
  // 清空编辑器
  if (elements.templateName) elements.templateName.value = '';
  if (elements.templateDescription) elements.templateDescription.value = '';
  if (elements.templateContent) elements.templateContent.value = '';
  elements.saveTemplateBtn.dataset.mode = 'add';
}

// 编辑模板
function editTemplate(templateId) {
  const template = settings.templates.find(t => t.id === templateId);
  if (!template) return;

  showTemplateEditor();
  if (elements.templateName) elements.templateName.value = template.name;
  if (elements.templateDescription) elements.templateDescription.value = template.description || '';
  if (elements.templateContent) elements.templateContent.value = template.content;
  elements.saveTemplateBtn.dataset.mode = 'edit';
  elements.saveTemplateBtn.dataset.id = templateId;
}

// 删除模板
async function deleteTemplate(templateId) {
  const template = settings.templates.find(t => t.id === templateId);
  if (!template) return;

  const confirmed = await showConfirm(`确定要删除模板 "${template.name}" 吗？`);
  if (!confirmed) return;

  settings.templates = settings.templates.filter(t => t.id !== templateId);

  // 如果删除的是激活的模板，激活第一个模板
  if (settings.activeTemplateId === templateId) {
    settings.activeTemplateId = settings.templates.length > 0 ? settings.templates[0].id : null;
  }

  saveSettingsToStorage();
  renderTemplateList();
}

// 保存模板
function saveTemplate() {
  const name = elements.templateName?.value.trim();
  const description = elements.templateDescription?.value.trim();
  const content = elements.templateContent?.value.trim();
  const mode = elements.saveTemplateBtn.dataset.mode;

  if (!name) {
    alert('请输入模板名称');
    elements.templateName?.focus();
    return;
  }

  if (!content) {
    alert('请输入模板内容');
    elements.templateContent?.focus();
    return;
  }

  if (mode === 'add') {
    // 添加新模板
    const newTemplate = {
      id: 'template_' + Date.now(),
      name: name,
      description: description,
      content: content
    };
    settings.templates.push(newTemplate);
    settings.activeTemplateId = newTemplate.id;
  } else if (mode === 'edit') {
    // 编辑现有模板
    const templateId = elements.saveTemplateBtn.dataset.id;
    const template = settings.templates.find(t => t.id === templateId);
    if (template) {
      template.name = name;
      template.description = description;
      template.content = content;
    }
  }

  saveSettingsToStorage();
  hideTemplateEditor();
  renderTemplateList();
  showUpdateNotification();
}

// 取消编辑
function cancelTemplateEdit() {
  hideTemplateEditor();
}

// 显示模板编辑器
function showTemplateEditor() {
  if (elements.templateEditor) {
    elements.templateEditor.style.display = 'block';
  }
  if (elements.saveTemplateBtn) {
    elements.saveTemplateBtn.style.display = 'inline-block';
  }
  if (elements.cancelTemplateBtn) {
    elements.cancelTemplateBtn.style.display = 'inline-block';
  }
}

// 隐藏模板编辑器
function hideTemplateEditor() {
  if (elements.templateEditor) {
    elements.templateEditor.style.display = 'none';
  }
  if (elements.saveTemplateBtn) {
    elements.saveTemplateBtn.style.display = 'none';
  }
  if (elements.cancelTemplateBtn) {
    elements.cancelTemplateBtn.style.display = 'none';
  }
}

// 备份模板
async function backupTemplates() {
  if (!useElectronAPI) {
    alert('请在 Electron 环境中使用此功能');
    return;
  }

  const result = await window.electronAPI.backupTemplates();
  if (result.success) {
    alert('模板备份成功！\n文件已保存到：' + result.filePath);
  } else if (!result.canceled) {
    alert('备份失败：' + result.error);
  }
}

// 恢复模板
async function restoreTemplates() {
  if (!useElectronAPI) {
    alert('请在 Electron 环境中使用此功能');
    return;
  }

  const confirmed = await showConfirm('恢复模板将覆盖当前的模板配置，确定继续吗？');
  if (!confirmed) {
    return;
  }

  const result = await window.electronAPI.restoreTemplates();
  if (result.success) {
    showToast('模板恢复成功！请重启应用以加载恢复的模板。');
  } else if (!result.canceled) {
    showToast('恢复失败：' + result.error);
  }
}

// 打开模板文件夹
async function openTemplateFolder() {
  if (!useElectronAPI) {
    alert('请在 Electron 环境中使用此功能');
    return;
  }

  try {
    const result = await window.electronAPI.getTemplatesPath();
    if (result.success) {
      await window.electronAPI.openPath(result.path);
    }
  } catch (error) {
    alert('打开文件夹失败：' + error.message);
  }
}
// ======= 模板库管理功能 结束 ========


// ======= 自定义选项管理功能（已迁移，保留注释）开始 ========
// ========== 自定义选项管理 ==========
// 【已迁移至 src/utils/customOptions.js】
// 包含函数：showCustomOptionsModal, hideCustomOptionsModal, loadGroupFilter, loadCustomOptionsList,
// renderBuiltinOptionsList, renderCustomOptionsList, showAddCustomOptionForm, showEditCustomOptionForm,
// loadGroupFilterForEditForm, hideCustomOptionEditModal, saveCustomOptionEdit, saveCustomOption,
// deleteCustomOption, hideCustomOptionForm

/* === 已注释 - 函数已迁移至 customOptions.js ===

// 显示自定义选项管理弹窗
async function showCustomOptionsModal() {
  if (!elements.customOptionsModal) return;

  // 加载组别筛选器
  await loadGroupFilter();

  // 加载自定义选项列表
  await loadCustomOptionsList();

  elements.customOptionsModal.style.display = 'flex';
}

// 隐藏自定义选项管理弹窗
function hideCustomOptionsModal() {
  if (elements.customOptionsModal) {
    elements.customOptionsModal.style.display = 'none';
  }
}

// 加载组别筛选器
async function loadGroupFilter() {
  if (!useElectronAPI || !elements.customOptionsGroupFilter) return;

  try {
    const result = await window.electronAPI.getGroups();
    if (result.success && result.groups) {
      // 保留"全部组别"选项
      elements.customOptionsGroupFilter.innerHTML = '<option value="all">全部组别</option>';

      // 添加所有组别
      result.groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group;
        option.textContent = group;
        elements.customOptionsGroupFilter.appendChild(option);
      });
    }
  } catch (error) {
    console.error('加载组别失败:', error);
  }
}

// 加载自定义选项列表（两栏显示）
async function loadCustomOptionsList(filterGroup = 'all') {
  if (!useElectronAPI) return;

  const builtinList = elements.builtinOptionsList;
  const customList = elements.customOptionsList;

  if (!builtinList || !customList) return;

  builtinList.innerHTML = '<div class="placeholder-text">加载中...</div>';
  customList.innerHTML = '<div class="placeholder-text">加载中...</div>';

  try {
    const result = await window.electronAPI.getAllOptions();
    if (result.success && result.options) {
      let options = result.options;

      // 按组别筛选
      if (filterGroup !== 'all') {
        options = options.filter(opt => opt.group === filterGroup);
      }

      // 分离内置选项和自定义选项
      const builtinOptions = options.filter(opt => opt.builtin);
      const customOptions = options.filter(opt => !opt.builtin);

      // 更新数量统计
      if (elements.builtinCount) {
        elements.builtinCount.textContent = builtinOptions.length;
      }
      if (elements.customCount) {
        elements.customCount.textContent = customOptions.length;
      }

      // 渲染内置选项列表
      renderBuiltinOptionsList(builtinOptions);

      // 渲染自定义选项列表
      renderCustomOptionsList(customOptions);
    } else {
      builtinList.innerHTML = '<div class="placeholder-text">加载失败</div>';
      customList.innerHTML = '<div class="placeholder-text">加载失败</div>';
    }
  } catch (error) {
    console.error('加载选项列表失败:', error);
    builtinList.innerHTML = '<div class="placeholder-text">加载失败</div>';
    customList.innerHTML = '<div class="placeholder-text">加载失败</div>';
  }
}

// 渲染内置选项列表
function renderBuiltinOptionsList(options) {
  const builtinList = elements.builtinOptionsList;
  if (!builtinList) return;

  if (options.length === 0) {
    builtinList.innerHTML = '<div class="placeholder-text">暂无内置选项</div>';
    return;
  }

  builtinList.innerHTML = '';

  options.forEach(option => {
    const itemElement = document.createElement('div');
    itemElement.className = 'custom-option-item builtin';

    itemElement.innerHTML = `
      <div class="custom-option-item-info">
        <div class="custom-option-item-header">
          <span class="custom-option-group-tag">${option.group}</span>
          <span class="custom-option-item-title">${option.type} - ${option.style}</span>
        </div>
        <div class="custom-option-item-subtitle">${option.description || ''}</div>
      </div>
    `;

    builtinList.appendChild(itemElement);
  });
}

// 渲染自定义选项列表
function renderCustomOptionsList(options) {
  const customList = elements.customOptionsList;
  if (!customList) return;

  if (options.length === 0) {
    customList.innerHTML = '<div class="placeholder-text">暂无自定义选项</div>';
    return;
  }

  // 按使用次数排序降序）
  const sortedOptions = [...options].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));

  customList.innerHTML = '';

  sortedOptions.forEach(option => {
    const itemElement = document.createElement('div');
    itemElement.className = 'custom-option-item';

    const usageBadge = option.usageCount > 0
      ? `<span class="usage-count-badge" title="使用次数">${option.usageCount}次</span>`
      : '';

    itemElement.innerHTML = `
      <div class="custom-option-item-info">
        <div class="custom-option-item-header">
          <span class="custom-option-group-tag">${option.group}</span>
          <span class="custom-option-item-title">${option.type} - ${option.style}</span>
          ${usageBadge}
        </div>
        <div class="custom-option-item-subtitle">${option.description || ''}</div>
      </div>
      <div class="custom-option-item-actions">
        <button class="icon-btn small edit-option-btn" data-id="${option.id}" title="编辑">✎</button>
        <button class="icon-btn small delete-option-btn" data-id="${option.id}" title="删除">×</button>
      </div>
    `;

    // 绑定编辑按钮事件
    const editBtn = itemElement.querySelector('.edit-option-btn');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showEditCustomOptionForm(option);
      });
    }

    // 绑定删除按钮事件
    const deleteBtn = itemElement.querySelector('.delete-option-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteCustomOption(option.id);
      });
    }

    customList.appendChild(itemElement);
  });
}

// 显示添加自定义选项表单（弹窗）
async function showAddCustomOptionForm() {
  if (!elements.customOptionEditModal) return;

  // 设置标题
  if (elements.customOptionEditTitle) {
    elements.customOptionEditTitle.textContent = '添加自定义选项';
  }

  // 清空表单
  if (elements.editCustomOptionId) elements.editCustomOptionId.value = '';
  if (elements.editCustomOptionGroup) elements.editCustomOptionGroup.value = '';
  if (elements.editCustomOptionType) elements.editCustomOptionType.value = '';
  if (elements.editCustomOptionStyle) elements.editCustomOptionStyle.value = '';
  if (elements.editCustomOptionDescription) elements.editCustomOptionDescription.value = '';

  // 动态加载组别列表
  await loadGroupFilterForEditForm();

  // 显示下拉框，隐藏输入框
  if (elements.editCustomOptionGroup) elements.editCustomOptionGroup.style.display = 'block';
  if (elements.editCustomOptionGroupInput) elements.editCustomOptionGroupInput.style.display = 'none';

  // 显示弹窗
  elements.customOptionEditModal.style.display = 'flex';
}

// 显示编辑自定义选项表单（弹窗）
async function showEditCustomOptionForm(option) {
  if (!elements.customOptionEditModal) return;

  // 设置标题
  if (elements.customOptionEditTitle) {
    elements.customOptionEditTitle.textContent = '编辑自定义选项';
  }

  // 填充表单数据
  if (elements.editCustomOptionId) elements.editCustomOptionId.value = option.id;
  if (elements.editCustomOptionType) elements.editCustomOptionType.value = option.type;
  if (elements.editCustomOptionStyle) elements.editCustomOptionStyle.value = option.style;
  if (elements.editCustomOptionDescription) elements.editCustomOptionDescription.value = option.description;

  // 动态加载组别列表
  await loadGroupFilterForEditForm();

  // 设置组别值（必须在加载组别列表后）
  if (elements.editCustomOptionGroup) {
    elements.editCustomOptionGroup.value = option.group;
  }

  // 显示下拉框，隐藏输入框
  if (elements.editCustomOptionGroup) elements.editCustomOptionGroup.style.display = 'block';
  if (elements.editCustomOptionGroupInput) elements.editCustomOptionGroupInput.style.display = 'none';

  // 显示弹窗
  elements.customOptionEditModal.style.display = 'flex';
}

// 加载组别下拉框（编辑表单用）
async function loadGroupFilterForEditForm() {
  if (!useElectronAPI || !elements.editCustomOptionGroup) return;

  try {
    const result = await window.electronAPI.getGroups();
    if (result.success && result.groups) {
      // 清空选项
      elements.editCustomOptionGroup.innerHTML = '<option value="">请选择组别</option>';
      elements.editCustomOptionGroup.innerHTML += '<option value="__new__">-- 新建组别 --</option>';

      // 添加所有组别
      result.groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group;
        option.textContent = group;
        elements.editCustomOptionGroup.appendChild(option);
      });

      // 添加切换逻辑
      elements.editCustomOptionGroup.onchange = () => {
        if (elements.editCustomOptionGroup.value === '__new__') {
          // 选择"新建组别"，显示输入框
          elements.editCustomOptionGroup.style.display = 'none';
          elements.editCustomOptionGroupInput.style.display = 'block';
          elements.editCustomOptionGroupInput.value = '';
          elements.editCustomOptionGroupInput.focus();
        }
      };
    }
  } catch (error) {
    console.error('加载组别失败:', error);
  }
}

// 隐藏自定义选项编辑弹窗
function hideCustomOptionEditModal() {
  if (elements.customOptionEditModal) {
    elements.customOptionEditModal.style.display = 'none';
  }
}

// 保存自定义选项编辑（弹窗版）
async function saveCustomOptionEdit() {
  if (!useElectronAPI) {
    alert('请在 Electron 环境中使用此功能');
    return;
  }

  const optionId = elements.editCustomOptionId?.value;

  // 获取组别值（下拉框或输入框）
  let group = elements.editCustomOptionGroup?.value;
  if (elements.editCustomOptionGroupInput && elements.editCustomOptionGroupInput.style.display !== 'none') {
    group = elements.editCustomOptionGroupInput.value.trim();
  }

  const type = elements.editCustomOptionType?.value;
  const style = elements.editCustomOptionStyle?.value;
  const description = elements.editCustomOptionDescription?.value;

  if (!group || !type || !style || !description) {
    alert('请填写所有必填字段');
    return;
  }

  try {
    const optionData = { group, type, style, description };

    let result;
    if (optionId) {
      // 更新
      result = await window.electronAPI.updateCustomOption(optionId, optionData);
    } else {
      // 新增
      result = await window.electronAPI.addCustomOption(optionData);
    }

    if (result.success) {
      hideCustomOptionEditModal();
      await loadCustomOptionsList();
      await loadGroupFilter();
      showUpdateNotification();
    } else {
      alert('保存失败：' + result.error);
    }
  } catch (error) {
    console.error('保存选项失败:', error);
    alert('保存失败：' + error.message);
  }
}

// 保存自定义选项
async function saveCustomOption() {
  if (!useElectronAPI) {
    alert('请在 Electron 环境中使用此功能');
    return;
  }

  const optionId = elements.customOptionId?.value;
  const group = elements.customOptionGroup?.value;
  const type = elements.customOptionType?.value;
  const style = elements.customOptionStyle?.value;
  const description = elements.customOptionDescription?.value;

  if (!group || !type || !style || !description) {
    alert('请填写所有必填字段');
    return;
  }

  try {
    const optionData = { group, type, style, description };

    let result;
    if (optionId) {
      // 更新
      result = await window.electronAPI.updateCustomOption(optionId, optionData);
    } else {
      // 新增
      result = await window.electronAPI.addCustomOption(optionData);
    }

    if (result.success) {
      hideCustomOptionForm();
      await loadCustomOptionsList();
      showUpdateNotification();
    } else {
      alert('保存失败：' + result.error);
    }
  } catch (error) {
    console.error('保存选项失败:', error);
    alert('保存失败：' + error.message);
  }
}

// 删除自定义选项
async function deleteCustomOption(optionId) {
  if (!useElectronAPI) {
    alert('请在 Electron 环境中使用此功能');
    return;
  }

  try {
    // 先检查使用情况
    const usageResult = await window.electronAPI.checkOptionUsage(optionId);
    if (!usageResult.success) {
      alert('检查失败：' + usageResult.error);
      return;
    }

    if (usageResult.usageCount > 0) {
      // 选项正在被使用，不允许删除
      alert(
        `该选项已被使用 ${usageResult.usageCount} 次，无法删除。\n\n` +
        `请先到片段或镜头中修改使用该选项的内容，然后再尝试删除。`
      );
      return;
    }

    // 未被使用，简单确认
    const confirmed = await showConfirm('确定要删除该自定义选项吗？');
    if (!confirmed) {
      return;
    }

    const result = await window.electronAPI.deleteCustomOption(optionId);
    if (result.success) {
      await loadCustomOptionsList();
      await loadGroupFilter();

      // 刷新当前片段属性表单的选项
      if (appState.currentShot) {
        await window.showShotProperties(appState.currentShot);
      }

      showUpdateNotification();
    } else {
      showToast('删除失败：' + result.error);
    }
  } catch (error) {
    console.error('删除选项失败:', error);
    alert('删除失败：' + error.message);
  }
}

=== 已注释结束 === */

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
// ======= 自定义选项管理功能（已迁移，保留注释）结束 ========



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
// ========== 全局变量暴露（供模块使用）==========
// 注意：必须在 initializeApp 之后调用，确保 useElectronAPI 已更新
function exposeGlobals() {
  window.showToast = showToast;
  window.showConfirm = showConfirm;
  window.loadOptionsByGroup = loadOptionsByGroup;
  window.showUpdateNotification = showUpdateNotification;
  window.showCustomPrompt = showCustomPrompt;
}

// 在 initializeApp 中调用暴露
const originalInitializeApp = initializeApp;
initializeApp = async function() {
  await originalInitializeApp();
  exposeGlobals();
};
// ======= 全局变量导出 结束 ========


// ======= 重复和未使用的代码区域 开始 ========
// 渲染素材库列表
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

function showUpdateNotification() {
  const notification = document.createElement('div');
  notification.textContent = '已更新';
  notification.style.position = 'fixed';
  notification.style.top = '10px';
  notification.style.right = '10px';
  notification.style.backgroundColor = '#333';
  notification.style.color = '#fff';
  notification.style.padding = '8px 16px';
  notification.style.borderRadius = '4px';
  notification.style.zIndex = '3000';
  notification.style.opacity = '0';
  notification.style.transition = 'opacity 0.3s';

  document.body.appendChild(notification);

  setTimeout(() => { notification.style.opacity = '1'; }, 10);
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => { document.body.removeChild(notification); }, 300);
  }, 2000);
}

/**
 * 显示自定义输入框（替代系统 prompt）
 * @param {string} message - 提示信息
 * @param {string} title - 标题
 * @returns {Promise<string>} 用户输入的内容
 */
async function showCustomPrompt(message, title = '输入') {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 3000;
    `;

    const modal = document.createElement('div');
    modal.className = 'modal-content';
    modal.style.cssText = `
      background: var(--bg-color, #fff);
      border-radius: 8px;
      padding: 24px;
      min-width: 400px;
      max-width: 500px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;

    modal.innerHTML = `
      <h3 style="margin: 0 0 16px 0; font-size: 18px; color: var(--text-color, #333);">${title}</h3>
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 8px; color: var(--text-color, #333);">${message}</label>
        <input type="text" id="custom-prompt-input" style="
          width: 100%;
          padding: 8px 12px;
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: 4px;
          font-size: 14px;
          box-sizing: border-box;
        " placeholder="请输入...">
      </div>
      <div style="display: flex; justify-content: flex-end; gap: 8px;">
        <button id="custom-prompt-cancel" style="
          padding: 8px 16px;
          border: 1px solid var(--border-color, #e0e0e0);
          background: var(--bg-color, #fff);
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          color: var(--text-color, #333);
        ">取消</button>
        <button id="custom-prompt-confirm" style="
          padding: 8px 16px;
          border: none;
          background: #007bff;
          color: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        ">确定</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const input = document.getElementById('custom-prompt-input');
    const confirmBtn = document.getElementById('custom-prompt-confirm');
    const cancelBtn = document.getElementById('custom-prompt-cancel');

    // 聚焦输入框
    setTimeout(() => input.focus(), 10);

    // 确定按钮
    confirmBtn.addEventListener('click', () => {
      const value = input.value.trim();
      overlay.remove();
      resolve(value);
    });

    // 取消按钮
    cancelBtn.addEventListener('click', () => {
      overlay.remove();
      resolve('');
    });

    // Enter 键确认
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const value = input.value.trim();
        overlay.remove();
        resolve(value);
      }
    });

    // 点击遮罩关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
        resolve('');
      }
    });
  });
}
// ======= 重复和未使用的代码区域 结束 ========
