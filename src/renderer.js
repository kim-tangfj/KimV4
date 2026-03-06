//
// Kim 多级分镜提示词助手 - 渲染进程
//

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
    qianwen: ''
  },
  models: {
    deepseek: 'deepseek-chat',
    doubao: 'doubao-pro-4k',
    qianwen: 'qwen-turbo'
  },
  templates: [],
  activeTemplateId: null
};

// DOM 元素引用
const elements = {};

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  cacheDOMElements();
  initializeApp();
});

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

// 初始化应用
async function initializeApp() {
  useElectronAPI = !!(window.electronAPI);

  await loadSettings();
  setupEventListeners();
  loadProjects();
  applyTheme(currentTheme);
}

// 加载设置
async function loadSettings() {
  // 从 localStorage 加载基本设置（主题、API 配置等）
  const savedSettings = localStorage.getItem('kim_settings');
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings);
      // 只加载非模板相关的设置
      settings.storagePath = parsed.storagePath || settings.storagePath;
      settings.apiProvider = parsed.apiProvider || settings.apiProvider;
      settings.apiKeys = parsed.apiKeys || settings.apiKeys;
      settings.models = parsed.models || settings.models;
      settings.theme = parsed.theme || 'light';
      settings.autoSaveInterval = parsed.autoSaveInterval || 5;
      currentTheme = settings.theme;
    } catch (e) {
      console.error('加载设置失败:', e);
    }
  }

  // 从本地文件加载模板配置
  if (useElectronAPI) {
    try {
      const result = await window.electronAPI.loadTemplates();
      if (result.success && result.config) {
        if (result.config.templates && result.config.templates.length > 0) {
          settings.templates = result.config.templates;
          settings.activeTemplateId = result.config.activeTemplateId;
        } else {
          // 如果模板为空，使用默认模板
          settings.templates = [getDefaultTemplate()];
          settings.activeTemplateId = settings.templates[0].id;
        }
      } else {
        // 加载失败，使用默认模板
        settings.templates = [getDefaultTemplate()];
        settings.activeTemplateId = settings.templates[0].id;
      }
    } catch (e) {
      console.error('加载模板配置失败:', e);
      settings.templates = [getDefaultTemplate()];
      settings.activeTemplateId = settings.templates[0].id;
    }
  } else {
    // 浏览器环境，使用 localStorage
    if (!settings.templates || settings.templates.length === 0) {
      settings.templates = [getDefaultTemplate()];
      settings.activeTemplateId = settings.templates[0].id;
    }
  }

  // 填充设置表单
  if (elements.storagePathInput) {
    elements.storagePathInput.value = settings.storagePath || '文档/KimStoryboard';
  }
  if (elements.apiProviderSelect) {
    elements.apiProviderSelect.value = settings.apiProvider;
  }
  if (elements.deepseekApiKey) {
    elements.deepseekApiKey.value = settings.apiKeys.deepseek || '';
  }
  if (elements.doubaoApiKey) {
    elements.doubaoApiKey.value = settings.apiKeys.doubao || '';
  }
  if (elements.qianwenApiKey) {
    elements.qianwenApiKey.value = settings.apiKeys.qianwen || '';
  }
  if (elements.deepseekModel) {
    elements.deepseekModel.value = settings.models.deepseek || 'deepseek-chat';
  }
  if (elements.doubaoModel) {
    elements.doubaoModel.value = settings.models.doubao || 'doubao-pro-4k';
  }
  if (elements.qianwenModel) {
    elements.qianwenModel.value = settings.models.qianwen || 'qwen-turbo';
  }
}

// 获取默认模板
function getDefaultTemplate() {
  return {
    id: 'default_' + Date.now(),
    name: '默认分镜模板',
    description: '标准的视频分镜脚本模板',
    content: `你是一位专业的视频分镜脚本助手。请将以下剧本内容转换为结构化的 JSON 格式片段数据。

剧本内容：
{剧本内容}

重要约束：
1. 每个片段 (shot) 的总时长不能超过 15 秒
2. 片段内所有镜头 (scenes) 的时长相加不能超过 15 秒
3. 每个镜头的时长建议在 2-5 秒之间
4. 镜头描述要简洁明确，便于视觉化呈现
5. 必须包含景别和运镜信息
6. 【重要】对话台词格式要求：如果镜头中有多人对话，必须标明说话人，格式为：角色名："台词内容"
7. 【重要】时长分配要求：必须根据台词长度合理分配镜头时长，每个汉字约 0.3-0.5 秒朗读时间

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
          "dialogue": "台词内容",
          "emotion": "情绪氛围",
          "notes": "备注说明"
        }
      ]
    }
  ]
}

要求：
- 所有字段都要填写，没有内容的字段填空字符串""
- 确保每个镜头总时长≤15 秒
- 返回标准 JSON 格式，可直接解析`
  };
}

// 保存设置
function saveSettings() {
  settings.storagePath = elements.storagePathInput?.value || '';
  settings.apiProvider = elements.apiProviderSelect?.value || 'deepseek';
  settings.apiKeys.deepseek = elements.deepseekApiKey?.value || '';
  settings.apiKeys.doubao = elements.doubaoApiKey?.value || '';
  settings.apiKeys.qianwen = elements.qianwenApiKey?.value || '';
  settings.models.deepseek = elements.deepseekModel?.value || 'deepseek-chat';
  settings.models.doubao = elements.doubaoModel?.value || 'doubao-pro-4k';
  settings.models.qianwen = elements.qianwenModel?.value || 'qwen-turbo';
  settings.theme = currentTheme;
  settings.autoSaveInterval = parseInt(elements.autoSaveInterval?.value) || 5;
  
  localStorage.setItem('kim_settings', JSON.stringify(settings));
  showUpdateNotification();
}

// 设置事件监听器
function setupEventListeners() {
  // 初始化面板拖拽
  initPanelResizers();

  // 主界面按钮
  if (elements.newProjectBtn) {
    elements.newProjectBtn.addEventListener('click', showNewProjectModal);
  }
  if (elements.refreshProjectsBtn) {
    elements.refreshProjectsBtn.addEventListener('click', loadProjects);
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
    elements.copyPromptBtn.addEventListener('click', copyPromptToClipboard);
  }
  if (elements.exportPromptBtn) {
    elements.exportPromptBtn.addEventListener('click', exportPrompt);
  }
  if (elements.clearPromptBtn) {
    elements.clearPromptBtn.addEventListener('click', clearPrompt);
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
    elements.viewToggleBtn.addEventListener('click', toggleSceneView);
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
      saveSettings();
      hideSettingsModal();
    });
  }
  if (elements.cancelSettingsBtn) {
    elements.cancelSettingsBtn.addEventListener('click', hideSettingsModal);
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
      applyTheme(theme);
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
    });
  }
  
  // 测试连接按钮
  if (elements.testDeepseekBtn) {
    elements.testDeepseekBtn.addEventListener('click', () => testApiConnection('deepseek'));
  }
  if (elements.testDoubaoBtn) {
    elements.testDoubaoBtn.addEventListener('click', () => testApiConnection('doubao'));
  }
  if (elements.testQianwenBtn) {
    elements.testQianwenBtn.addEventListener('click', () => testApiConnection('qianwen'));
  }
  
  // 切换 API Key 可见性
  if (elements.toggleDeepseekKey) {
    elements.toggleDeepseekKey.addEventListener('click', () => toggleApiKeyVisibility(elements.deepseekApiKey));
  }
  if (elements.toggleDoubaoKey) {
    elements.toggleDoubaoKey.addEventListener('click', () => toggleApiKeyVisibility(elements.doubaoApiKey));
  }
  if (elements.toggleQianwenKey) {
    elements.toggleQianwenKey.addEventListener('click', () => toggleApiKeyVisibility(elements.qianwenApiKey));
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
    window.electronAPI.onSettingsOpen(() => showSettingsModal());
    window.electronAPI.onThemeToggle(() => toggleTheme());
    window.electronAPI.onTemplateLibraryOpen(() => showTemplateLibraryModal());
    window.electronAPI.onCustomOptionsOpen(() => showCustomOptionsModal());
  }

  // 模态框背景点击关闭
  if (elements.settingsModal) {
    elements.settingsModal.addEventListener('click', (e) => {
      if (e.target === elements.settingsModal) hideSettingsModal();
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
  
  // AI 生成模式事件
  if (elements.generatePromptBtn) {
    elements.generatePromptBtn.addEventListener('click', generatePromptFromAI);
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
    elements.manageCustomOptionsBtn.addEventListener('click', showCustomOptionsModal);
  }
  if (elements.backupOptionsBtn) {
    elements.backupOptionsBtn.addEventListener('click', backupOptions);
  }
  if (elements.restoreOptionsBtn) {
    elements.restoreOptionsBtn.addEventListener('click', restoreOptions);
  }
  if (elements.openOptionsFolderBtn) {
    elements.openOptionsFolderBtn.addEventListener('click', openOptionsFolder);
  }
  if (elements.closeCustomOptionsBtn) {
    elements.closeCustomOptionsBtn.addEventListener('click', hideCustomOptionsModal);
  }
  if (elements.closeCustomOptionsModalBtn) {
    elements.closeCustomOptionsModalBtn.addEventListener('click', hideCustomOptionsModal);
  }
  if (elements.addCustomOptionBtn) {
    elements.addCustomOptionBtn.addEventListener('click', showAddCustomOptionForm);
  }
  if (elements.refreshCustomOptionsBtn) {
    elements.refreshCustomOptionsBtn.addEventListener('click', () => loadCustomOptionsList('all'));
  }
  // 分栏按钮事件
  if (elements.refreshBuiltinBtn) {
    elements.refreshBuiltinBtn.addEventListener('click', () => loadCustomOptionsList('all'));
  }
  if (elements.addCustomOptionColumnBtn) {
    elements.addCustomOptionColumnBtn.addEventListener('click', showAddCustomOptionForm);
  }
  if (elements.refreshCustomColumnBtn) {
    elements.refreshCustomColumnBtn.addEventListener('click', () => loadCustomOptionsList('all'));
  }
  if (elements.saveCustomOptionBtn) {
    elements.saveCustomOptionBtn.addEventListener('click', saveCustomOption);
  }
  if (elements.cancelCustomOptionBtn) {
    elements.cancelCustomOptionBtn.addEventListener('click', hideCustomOptionForm);
  }
  if (elements.customOptionsGroupFilter) {
    elements.customOptionsGroupFilter.addEventListener('change', () => {
      loadCustomOptionsList(elements.customOptionsGroupFilter.value);
    });
  }

  // 编辑弹窗事件绑定
  if (elements.closeCustomOptionEditBtn) {
    elements.closeCustomOptionEditBtn.addEventListener('click', hideCustomOptionEditModal);
  }
  if (elements.saveCustomOptionEditBtn) {
    elements.saveCustomOptionEditBtn.addEventListener('click', saveCustomOptionEdit);
  }
  if (elements.cancelCustomOptionEditBtn) {
    elements.cancelCustomOptionEditBtn.addEventListener('click', hideCustomOptionEditModal);
  }
}

// 应用主题
function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
  currentTheme = theme;
}

// 切换主题
function toggleTheme() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(currentTheme);
  
  elements.themeToggleBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === currentTheme);
  });
  
  localStorage.setItem('kim_settings', JSON.stringify({ ...settings, theme: currentTheme }));
}

// 切换 API Key 可见性
function toggleApiKeyVisibility(input) {
  if (input.type === 'password') {
    input.type = 'text';
  } else {
    input.type = 'password';
  }
}

// 测试 API 连接
async function testApiConnection(provider) {
  if (!useElectronAPI) {
    alert('请在 Electron 环境中使用此功能');
    return;
  }

  // 直接从 DOM 获取 API Key，确保获取到最新输入的值
  let apiKey, model;
  if (provider === 'deepseek') {
    apiKey = elements.deepseekApiKey?.value.trim() || '';
    model = elements.deepseekModel?.value.trim() || 'deepseek-chat';
  } else if (provider === 'doubao') {
    apiKey = elements.doubaoApiKey?.value.trim() || '';
    model = elements.doubaoModel?.value.trim() || 'doubao-pro-4k';
  } else if (provider === 'qianwen') {
    apiKey = elements.qianwenApiKey?.value.trim() || '';
    model = elements.qianwenModel?.value.trim() || 'qwen-turbo';
  }

  if (!apiKey) {
    alert('请先输入 API Key');
    return;
  }

  showLoading('正在测试连接...');

  try {
    const result = await window.electronAPI.testApiConnection(provider, apiKey, model);
    const statusEl = document.getElementById(`${provider}-status`);

    if (result.success) {
      if (statusEl) {
        statusEl.textContent = '✓ 连接成功';
        statusEl.className = 'connection-status success';
      }
    } else {
      if (statusEl) {
        statusEl.textContent = '✗ 连接失败：' + result.error;
        statusEl.className = 'connection-status error';
      }
    }
  } catch (error) {
    const statusEl = document.getElementById(`${provider}-status`);
    if (statusEl) {
      statusEl.textContent = '✗ 连接失败：' + error.message;
      statusEl.className = 'connection-status error';
    }
  } finally {
    hideLoading();
  }
}

// 检查 API 状态
function checkApiStatus() {
  const provider = elements.aiProvider?.value || 'deepseek';
  const apiKey = settings.apiKeys[provider];
  const statusEl = elements.aiApiStatus;
  
  if (!apiKey) {
    if (statusEl) {
      statusEl.textContent = '未配置 API Key';
      statusEl.className = 'status-value error';
    }
    return false;
  }
  
  if (statusEl) {
    statusEl.textContent = '已配置';
    statusEl.className = 'status-value success';
  }
  return true;
}

// 显示加载覆盖层
function showLoading(text) {
  if (elements.loadingOverlay) {
    elements.loadingText.textContent = text || '正在处理...';
    elements.loadingOverlay.style.display = 'flex';
  }
}

// 隐藏加载覆盖层
function hideLoading() {
  if (elements.loadingOverlay) {
    elements.loadingOverlay.style.display = 'none';
  }
}

// 显示设置面板
function showSettingsModal() {
  if (!elements.settingsModal) return;

  // 更新当前主题按钮状态
  elements.themeToggleBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === currentTheme);
  });
  
  // 显示当前选择的提供商配置
  const provider = elements.apiProviderSelect?.value || 'deepseek';
  if (elements.deepseekConfig) elements.deepseekConfig.style.display = provider === 'deepseek' ? 'block' : 'none';
  if (elements.doubaoConfig) elements.doubaoConfig.style.display = provider === 'doubao' ? 'block' : 'none';
  if (elements.qianwenConfig) elements.qianwenConfig.style.display = provider === 'qianwen' ? 'block' : 'none';
  
  // 显示模板存储路径
  showTemplateStoragePath();

  elements.settingsModal.style.display = 'flex';
}

// 隐藏设置面板
function hideSettingsModal() {
  if (elements.settingsModal) {
    elements.settingsModal.style.display = 'none';
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
          await loadProjects();
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
        showSettingsModal();
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
            await loadProjects();
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

// 显示输入错误提示（不阻塞）
function showInputError(input, message) {
  if (!input) return;

  // 聚焦到输入框
  input.focus();

  // 添加错误样式
  input.style.borderColor = '#d32f2f';
  input.style.backgroundColor = '#ffebee';

  // 检查是否已存在错误提示
  const existingError = input.parentElement.querySelector('.input-error-message');
  if (existingError) {
    existingError.remove();
  }

  // 创建错误提示（显示在输入框下方）
  const errorDiv = document.createElement('div');
  errorDiv.className = 'input-error-message';
  errorDiv.textContent = message;
  errorDiv.style.cssText = `
    color: #d32f2f;
    font-size: 12px;
    margin-top: 4px;
    padding: 4px 0;
  `;

  input.parentElement.appendChild(errorDiv);

  // 2 秒后移除
  setTimeout(() => {
    input.style.borderColor = '';
    input.style.backgroundColor = '';
    if (errorDiv.parentNode) {
      errorDiv.parentNode.removeChild(errorDiv);
    }
  }, 2000);
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

// 保存设置到本地存储
function saveSettingsToStorage() {
  // 保存基本设置到 localStorage
  const basicSettings = {
    storagePath: settings.storagePath,
    apiProvider: settings.apiProvider,
    apiKeys: settings.apiKeys,
    models: settings.models,
    theme: currentTheme,
    autoSaveInterval: settings.autoSaveInterval
  };
  localStorage.setItem('kim_settings', JSON.stringify(basicSettings));
  
  // 保存模板配置到本地文件
  if (useElectronAPI) {
    const templateConfig = {
      templates: settings.templates,
      activeTemplateId: settings.activeTemplateId
    };
    window.electronAPI.saveTemplates(templateConfig).then(result => {
      if (!result.success) {
        console.error('保存模板配置失败:', result.error);
      }
    });
  }
}

// ========== AI 生成提示词 ==========

// 生成提示词并调用 AI
async function generatePromptFromAI() {
  const script = elements.aiProjectScript?.value.trim();
  const provider = elements.aiProvider?.value || 'deepseek';

  if (!script) {
    showInputError(elements.aiProjectScript, '请输入项目剧本内容');
    return;
  }

  const apiKey = settings.apiKeys[provider];
  
  if (!apiKey) {
    alert('请先在设置中配置 API Key');
    showSettingsModal();
    return;
  }

  // 获取激活的模板
  const activeTemplate = settings.templates.find(t => t.id === settings.activeTemplateId);
  const template = activeTemplate || getDefaultTemplate();

  // 替换 {剧本内容} 占位符
  const prompt = template.content.replace('{剧本内容}', script);

  // 显示加载状态
  if (elements.generatePromptBtn) {
    elements.generatePromptBtn.disabled = true;
    elements.generatePromptBtn.textContent = '生成中...';
  }

  try {
    const result = await window.electronAPI.callLlmApi(provider, apiKey, settings.models[provider], prompt);

    if (result.success) {
      // 提取 JSON 数据
      let jsonData;
      try {
        const jsonMatch = result.content.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          jsonData = JSON.parse(jsonMatch[0]);
        } else {
          jsonData = JSON.parse(result.content);
        }

        // 格式化 JSON 并显示到预览框
        if (elements.aiResponsePreview) {
          elements.aiResponsePreview.value = JSON.stringify(jsonData, null, 2);
        } else {
          console.error('Preview element not found');
        }

        showUpdateNotification();
      } catch (e) {
        console.error('JSON parse error:', e);
        // 如果解析失败，显示原始返回
        if (elements.aiResponsePreview) {
          elements.aiResponsePreview.value = result.content;
        }
        alert('AI 返回的数据格式可能有误，请检查预览内容');
      }
    } else {
      alert('AI 调用失败：' + result.error);
    }
  } catch (error) {
    console.error('API call error:', error);
    alert('AI 调用失败：' + error.message);
  } finally {
    if (elements.generatePromptBtn) {
      elements.generatePromptBtn.disabled = false;
      elements.generatePromptBtn.textContent = '✨ 生成提示词';
    }
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

// ========== 自定义选项管理 ==========

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

  // 按使用次数排序（降序）
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
        await showShotProperties(appState.currentShot);
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

// 备份自定义选项
async function backupOptions() {
  if (!useElectronAPI) {
    alert('请在 Electron 环境中使用此功能');
    return;
  }
  
  const result = await window.electronAPI.backupOptions();
  if (result.success) {
    alert('选项备份成功！\n文件已保存到：' + result.filePath);
  } else if (!result.canceled) {
    alert('备份失败：' + result.error);
  }
}

// 恢复自定义选项
async function restoreOptions() {
  if (!useElectronAPI) {
    alert('请在 Electron 环境中使用此功能');
    return;
  }

  const confirmed = await showConfirm('恢复选项将覆盖当前的自定义选项配置，确定继续吗？');
  if (!confirmed) {
    return;
  }

  const result = await window.electronAPI.restoreOptions();
  if (result.success) {
    showToast('选项恢复成功！请重新打开管理窗口以查看恢复的选项。');
    hideCustomOptionsModal();
  } else if (!result.canceled) {
    showToast('恢复失败：' + result.error);
  }
}

// 打开选项文件夹
async function openOptionsFolder() {
  if (!useElectronAPI) {
    alert('请在 Electron 环境中使用此功能');
    return;
  }

  try {
    await window.electronAPI.openOptionsFolder();
  } catch (error) {
    alert('打开文件夹失败：' + error.message);
  }
}

// 设置选项提示监听 - 使用 appState 而不是闭包变量
function setupOptionHintListeners() {
  const hintMap = {
    'shotStyle': 'shotStyleHint',
    'shotMood': 'shotMoodHint',
    'shotMusicStyle': 'shotMusicStyleHint',
    'shotSoundEffect': 'shotSoundEffectHint'
  };

  Object.entries(hintMap).forEach(([selectId, hintId]) => {
    const select = document.getElementById(selectId);
    const hint = document.getElementById(hintId);
    if (select && hint) {
      select.addEventListener('change', () => {
        const selectedOption = select.options[select.selectedIndex];
        const description = selectedOption.dataset.description || '选择该项';
        hint.textContent = description;
        // 触发自动保存
        autoSaveShotProperties();
      });
    }
  });
}

// 设置镜头选项提示监听 - 使用 appState 而不是闭包变量
function setupSceneOptionHintListeners() {
  const hintMap = {
    'sceneShotType': 'sceneShotTypeHint',
    'sceneAngle': 'sceneAngleHint',
    'sceneCamera': 'sceneCameraHint'
  };

  Object.entries(hintMap).forEach(([selectId, hintId]) => {
    const select = document.getElementById(selectId);
    const hint = document.getElementById(hintId);
    if (select && hint) {
      select.addEventListener('change', () => {
        const selectedOption = select.options[select.selectedIndex];
        const description = selectedOption.dataset.description || '选择该项';
        hint.textContent = description;
        // 触发自动保存
        autoSaveSceneProperties();
      });
    }
  });
}

// 设置添加选项按钮事件 - 使用 appState 而不是闭包变量
function setupAddOptionButtons() {
  document.querySelectorAll('.add-option-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const field = btn.dataset.field;
      const group = btn.dataset.group;
      showQuickAddOptionModal(group, field);
    });
  });
}

// 显示快速添加选项弹窗 - 使用 appState 而不是闭包变量
async function showQuickAddOptionModal(group, field, defaultValue = '') {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="modal-content quick-add-modal">
      <div class="modal-header">
        <h3>添加"${group}"新选项</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>类型</label>
          <input type="text" id="quick-option-type" placeholder="如：写实风格、清新治愈">
        </div>
        <div class="form-group">
          <label>风格名称</label>
          <input type="text" id="quick-option-style" placeholder="如：照片写实、日系清新" value="${defaultValue}">
        </div>
        <div class="form-group">
          <label>描述</label>
          <textarea id="quick-option-description" rows="3" placeholder="描述该选项的特点"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="form-btn primary" id="quick-add-save">保存</button>
        <button class="form-btn" onclick="this.closest('.modal').remove()">取消</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const saveBtn = modal.querySelector('#quick-add-save');
  saveBtn.addEventListener('click', async () => {
    const type = document.getElementById('quick-option-type').value.trim();
    const style = document.getElementById('quick-option-style').value.trim();
    const description = document.getElementById('quick-option-description').value.trim();

    if (!type || !style || !description) {
      alert('请填写所有必填字段');
      return;
    }

    try {
      const result = await window.electronAPI.addCustomOption({ group, type, style, description });
      if (result.success) {
        // 使用 appState 判断当前是片段还是镜头
        if (appState.currentScene) {
          await showSceneProperties(appState.currentScene);
        } else if (appState.currentShot) {
          await showShotProperties(appState.currentShot);
        }
        modal.remove();
        showUpdateNotification();
      } else {
        alert('添加失败：' + result.error);
      }
    } catch (error) {
      console.error('添加选项失败:', error);
      alert('添加失败：' + error.message);
    }
  });
}

// 显示模板存储路径
async function showTemplateStoragePath() {
  if (!useElectronAPI) {
    return;
  }

  try {
    const result = await window.electronAPI.getTemplatesPath();
    if (result.success && elements.templateStoragePath) {
      // 显示文件夹路径
      elements.templateStoragePath.value = result.path;
    }
  } catch (error) {
    console.error('获取模板路径失败:', error);
  }
}

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
        await loadProjects();
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

// ========== 项目加载和渲染 ==========

async function loadProjects() {
  if (useElectronAPI) {
    try {
      // 使用设置中的存储路径
      const result = await window.electronAPI.listProjects(settings.storagePath || '');
      if (result.success) {
        appState.projects = result.projects;
        window.renderProjectList(appState.projects, elements, selectProject, (project, e) => {
          window.showProjectContextMenu(project, e, selectProject, deleteCurrentProject, window.openProjectFolderByProject);
        }, (project, e) => {
          window.showProjectStatusMenu(project, e, updateProjectStatus);
        });
        console.log('项目加载成功，数量:', result.projects.length);
      } else {
        console.error('项目加载失败:', result.error);
        appState.projects = [];
        window.renderProjectList([], elements, selectProject, () => {}, () => {});
      }
    } catch (error) {
      console.error('加载项目异常:', error);
      appState.projects = [];
      window.renderProjectList([], elements, selectProject, () => {}, () => {});
    }
  } else {
    const savedProjects = localStorage.getItem('kim_projects');
    if (savedProjects) {
      appState.projects = JSON.parse(savedProjects);
    } else {
      appState.projects = [];
    }
    // 使用模块中的 renderProjectList 函数
    window.renderProjectList(appState.projects, elements, selectProject, (project, e) => {
      window.showProjectContextMenu(project, e, selectProject, deleteCurrentProject, window.openProjectFolderByProject);
    }, (project, e) => {
      window.showProjectStatusMenu(project, e, updateProjectStatus);
    });
  }
}

// 项目管理函数已移至 src/utils/projectList.js

async function selectProject(project) {
  appState.currentProject = project;
  appState.currentShot = null;
  appState.currentScene = null;

  // 使用模块中的 updateProjectSelection 函数
  if (window.updateProjectSelection) {
    window.updateProjectSelection(elements, project.id);
  }

  if (elements.newShotBtn) elements.newShotBtn.disabled = false;
  if (elements.deleteShotBtn) elements.deleteShotBtn.disabled = false;

  if (useElectronAPI && project.projectDir) {
    try {
      const result = await window.electronAPI.loadProject(project.projectDir);
      if (result.success) {
        appState.projectData = result.projectJson;
        renderShotList(result.projectJson.shots || []);
      } else {
        renderShotList(project.shots || []);
      }
    } catch (error) {
      console.error('加载项目数据失败:', error);
      renderShotList(project.shots || []);
    }
  } else {
    renderShotList(project.shots || []);
  }

  renderSceneList([]);

  // 清空提示词预览
  if (elements.promptPreview) {
    elements.promptPreview.innerHTML = '<div class="placeholder-text">请选择片段</div>';
  }

  // 清空属性栏
  if (elements.propertyForm) {
    elements.propertyForm.innerHTML = '<div class="placeholder-text">请选择片段或镜头以编辑属性</div>';
  }

  // 重置底部面板标题
  if (elements.bottomPanelTitle) {
    elements.bottomPanelTitle.textContent = '属性';
  }

  // 清空素材库
  renderAssetsList([]);
}

// ========== 片段管理 ==========

function renderShotList(shots) {
  if (!elements.shotList) return;

  elements.shotList.innerHTML = '';

  if (!shots || shots.length === 0) {
    elements.shotList.innerHTML = '<div class="placeholder-text">暂无片段，点击 + 新建</div>';
    if (elements.deleteShotBtn) elements.deleteShotBtn.disabled = true;
    return;
  }

  shots.forEach((shot, index) => {
    // 确保片段对象有 id 属性（如果没有则生成并保存）
    if (!shot.id) {
      shot.id = Date.now() + index;
      console.log('生成片段 ID:', shot.id, '名称:', shot.name);
    }
    
    const shotElement = document.createElement('div');
    shotElement.className = 'list-item';
    shotElement.dataset.id = shot.id;
    
    const statusText = getStatusText(shot.status || 'draft');
    shotElement.innerHTML = `
      <div class="list-item-content">
        <div class="list-item-title">${shot.name}</div>
        <div class="list-item-subtitle">
          ${shot.duration || 0}s • ${shot.aspectRatio || '16:9'} • ${shot.scenes ? shot.scenes.length : 0} 个镜头
        </div>
      </div>
      <span class="status-tag status-${shot.status || 'draft'}">${statusText}</span>
    `;

    // 片段卡片点击 - 传递原始 shot 对象
    shotElement.addEventListener('click', (e) => {
      if (e.target.classList.contains('status-tag')) {
        return;
      }
      selectShot(shot);
    });

    // 状态标签点击 - 传递原始 shot 对象
    const statusTag = shotElement.querySelector('.status-tag');
    if (statusTag) {
      statusTag.addEventListener('click', (e) => {
        e.stopPropagation();
        showShotStatusMenu(shot, e);
      });
    }

    elements.shotList.appendChild(shotElement);
  });

  if (elements.deleteShotBtn) elements.deleteShotBtn.disabled = false;
}

async function selectShot(shot) {
  // 关键修复：切换片段时清除待处理的自动保存
  if (shotSaveTimeout) {
    clearTimeout(shotSaveTimeout);
    shotSaveTimeout = null;
    savingShotId = null;
    console.log('[selectShot] 清除待处理的自动保存');
  }

  if (useElectronAPI && appState.currentProject.projectDir) {
    // 从 project.json 中读取最新的片段数据
    try {
      const loadResult = await window.electronAPI.loadProject(appState.currentProject.projectDir);
      if (loadResult.success) {
        const latestShot = loadResult.projectJson.shots?.find(s => s.id === shot.id);
        if (latestShot) {
          appState.currentShot = latestShot;
        }
      }
    } catch (error) {
      console.error('加载最新片段数据失败:', error);
      appState.currentShot = shot;
    }
  } else {
    appState.currentShot = shot;
  }

  // 移除所有片段选中状态（保留项目选中状态）
  document.querySelectorAll('#shot-list .list-item').forEach(item => {
    item.classList.remove('selected');
  });

  // 设置当前片段选中状态（转换为字符串比较）
  const shotItem = Array.from(document.querySelectorAll('#shot-list .list-item'))
    .find(item => item.dataset.id === String(shot.id));
  if (shotItem) {
    shotItem.classList.add('selected');
  }

  if (elements.newSceneBtn) elements.newSceneBtn.disabled = false;
  if (elements.deleteSceneBtn) elements.deleteSceneBtn.disabled = false;

  renderSceneList(appState.currentShot.scenes || []);
  updatePromptPreview();
  showShotProperties(appState.currentShot);
}

async function createNewShot() {
  if (!appState.currentProject) {
    alert('请先选择一个项目');
    return;
  }
  
  const shotName = prompt('请输入片段名称:');
  if (!shotName) return;
  
  const newShot = {
    id: Date.now(),
    name: shotName,
    description: '',
    duration: 10,
    notes: '',
    status: 'draft',
    aspectRatio: appState.currentProject.aspectRatio || '16:9',
    style: '默认风格',
    mood: '默认情绪',
    musicStyle: '',
    soundEffects: '',
    scenes: []
  };
  
  if (useElectronAPI && appState.currentProject.projectDir) {
    try {
      const loadResult = await window.electronAPI.loadProject(appState.currentProject.projectDir);
      if (!loadResult.success) {
        alert('加载项目失败：' + loadResult.error);
        return;
      }
      
      loadResult.projectJson.shots = loadResult.projectJson.shots || [];
      loadResult.projectJson.shots.push(newShot);
      
      const saveResult = await window.electronAPI.saveProject(appState.currentProject.projectDir, loadResult.projectJson);
      if (saveResult.success) {
        await selectProject(appState.currentProject);
        showUpdateNotification();
      } else {
        alert('保存失败：' + saveResult.error);
      }
    } catch (error) {
      console.error('创建片段异常:', error);
      alert('创建片段失败：' + error.message);
    }
  }
}

async function deleteSelectedShot() {
  if (!appState.currentShot) {
    alert('请先选择一个片段');
    return;
  }

  const confirmed = await showConfirm(`确定要删除片段 "${appState.currentShot.name}" 吗？`);
  if (!confirmed) return;
  
  if (useElectronAPI && appState.currentProject.projectDir) {
    try {
      const loadResult = await window.electronAPI.loadProject(appState.currentProject.projectDir);
      if (!loadResult.success) return;
      
      loadResult.projectJson.shots = (loadResult.projectJson.shots || []).filter(
        s => s.id !== appState.currentShot.id
      );
      
      const saveResult = await window.electronAPI.saveProject(
        appState.currentProject.projectDir,
        loadResult.projectJson
      );
      
      if (saveResult.success) {
        appState.currentShot = null;
        appState.currentScene = null;
        await selectProject(appState.currentProject);
        renderSceneList([]);
      }
    } catch (error) {
      console.error('删除片段异常:', error);
      alert('删除片段失败：' + error.message);
    }
  }
}

// ========== 镜头管理 ==========

function renderSceneList(scenes) {
  if (!elements.sceneList) return;

  elements.sceneList.innerHTML = '';

  if (!scenes || scenes.length === 0) {
    elements.sceneList.innerHTML = '<div class="placeholder-text">暂无镜头，点击 + 新建</div>';
    return;
  }

  scenes.forEach((scene, index) => {
    const sceneElement = document.createElement('div');
    sceneElement.className = 'list-item';
    
    // 确保 ID 存在，没有则生成
    if (!scene.id) {
      scene.id = Date.now() + index;
    }
    sceneElement.dataset.id = scene.id;

    // 生成镜头编号（如果没有 serialNumber，使用序号）
    const sceneNumber = scene.serialNumber || `镜头${index + 1}`;

    sceneElement.innerHTML = `
      <div class="list-item-content">
        <div class="list-item-title">${sceneNumber} | ${scene.name}</div>
        <div class="list-item-subtitle">
          ${scene.shotType} • ${scene.angle} • ${scene.duration}s
        </div>
      </div>
    `;
    sceneElement.addEventListener('click', async () => { await selectScene(scene); });
    elements.sceneList.appendChild(sceneElement);
  });
}

async function selectScene(scene) {
  // 关键修复：切换镜头时清除待处理的自动保存
  if (sceneSaveTimeout) {
    clearTimeout(sceneSaveTimeout);
    sceneSaveTimeout = null;
    savingSceneId = null;
    console.log('[selectScene] 清除待处理的自动保存');
  }

  if (useElectronAPI && appState.currentProject.projectDir && appState.currentShot) {
    // 从 project.json 中读取最新的镜头数据
    try {
      const loadResult = await window.electronAPI.loadProject(appState.currentProject.projectDir);
      if (loadResult.success) {
        const latestShot = loadResult.projectJson.shots?.find(s => s.id === appState.currentShot.id);
        if (latestShot && latestShot.scenes) {
          const latestScene = latestShot.scenes.find(s => s.id === scene.id);
          if (latestScene) {
            appState.currentScene = latestScene;
          }
        }
      }
    } catch (error) {
      console.error('加载最新镜头数据失败:', error);
      appState.currentScene = scene;
    }
  } else {
    appState.currentScene = scene;
  }

  appState.currentScene = appState.currentScene || scene;

  // 移除所有镜头选中状态
  document.querySelectorAll('#scene-list .list-item').forEach(item => {
    item.classList.remove('selected');
  });

  // 设置当前镜头选中状态（转换为字符串比较）
  const sceneItem = Array.from(document.querySelectorAll('#scene-list .list-item'))
    .find(item => item.dataset.id === String(scene.id));
  if (sceneItem) {
    sceneItem.classList.add('selected');
  }

  if (elements.copyPromptBtn) elements.copyPromptBtn.disabled = false;
  if (elements.exportPromptBtn) elements.exportPromptBtn.disabled = false;
  if (elements.clearPromptBtn) elements.clearPromptBtn.disabled = false;

  updatePromptPreview();
  showSceneProperties(appState.currentScene);
}

async function createNewScene() {
  if (!appState.currentShot) {
    alert('请先选择一个片段');
    return;
  }
  
  const sceneName = prompt('请输入镜头名称:');
  if (!sceneName) return;
  
  const newScene = {
    id: Date.now(),
    serialNumber: `scene_${Date.now()}`,
    name: sceneName,
    shotType: '特写',
    angle: '平视',
    content: '',
    duration: 2,
    camera: '固定镜头',
    notes: '',
    dialogue: '',
    emotion: '普通',
    storyboard: '',
    enabled: true
  };
  
  if (useElectronAPI && appState.currentProject.projectDir) {
    try {
      const loadResult = await window.electronAPI.loadProject(appState.currentProject.projectDir);
      if (!loadResult.success) return;
      
      const shot = loadResult.projectJson.shots?.find(s => s.id === appState.currentShot.id);
      if (shot) {
        shot.scenes = shot.scenes || [];
        shot.scenes.push(newScene);
        
        const saveResult = await window.electronAPI.saveProject(
          appState.currentProject.projectDir,
          loadResult.projectJson
        );
        
        if (saveResult.success) {
          await selectProject(appState.currentProject);
          showUpdateNotification();
        }
      }
    } catch (error) {
      console.error('创建镜头异常:', error);
    }
  }
}

async function deleteSelectedScene() {
  if (!appState.currentScene) {
    alert('请先选择一个镜头');
    return;
  }

  const confirmed = await showConfirm(`确定要删除镜头 "${appState.currentScene.name}" 吗？`);
  if (!confirmed) return;
  
  if (useElectronAPI && appState.currentProject.projectDir) {
    try {
      const loadResult = await window.electronAPI.loadProject(appState.currentProject.projectDir);
      if (!loadResult.success) return;
      
      const shot = loadResult.projectJson.shots?.find(s => s.id === appState.currentShot.id);
      if (shot && shot.scenes) {
        shot.scenes = shot.scenes.filter(s => s.id !== appState.currentScene.id);
        
        const saveResult = await window.electronAPI.saveProject(
          appState.currentProject.projectDir,
          loadResult.projectJson
        );
        
        if (saveResult.success) {
          appState.currentScene = null;
          await selectProject(appState.currentProject);
        }
      }
    } catch (error) {
      console.error('删除镜头异常:', error);
    }
  }
}

// ========== 提示词 ==========

// 提示词生成函数（按 defualt-prompt.md 模板）
function generateScenePrompt(scene, index, cumulativeTime) {
  if (!scene) return '';
  
  const shotType = scene.shotType || '';
  const angle = scene.angle || '';
  const camera = scene.camera || '';
  const content = scene.content || '';
  const emotion = scene.emotion || '';
  const dialogue = scene.dialogue || '';
  const notes = scene.notes || '';
  
  // 计算镜头时间
  const duration = scene.duration || 2;
  const startTime = cumulativeTime;
  const endTime = cumulativeTime + duration;
  const timeRange = `${startTime}-${endTime}秒`;
  
  // 格式：## 镜头 1\n**0-1 秒**：[特写、俯视、固定镜头]，内容...（情绪）
  let prompt = `## 镜头${index + 1}\n**${timeRange}**：`;
  
  if (shotType || angle || camera) {
    prompt += `[${[shotType, angle, camera].filter(Boolean).join('、')}]，`;
  }
  
  prompt += content;
  
  if (emotion) {
    prompt += `（${emotion}）`;
  }
  
  if (dialogue) {
    prompt += `\n【对白】${dialogue}`;
  }
  
  if (notes) {
    prompt += `\n【其他备注】${notes}`;
  }
  
  return prompt;
}

function generateShotPrompt(shot) {
  if (!shot) return '';

  // 片段头部信息
  let prompt = '';
  
  // **风格**：风格，情绪氛围
  if (shot.style || shot.mood) {
    prompt += `**风格**：${shot.style || ''}${shot.mood ? `，${shot.mood}` : ''}\n\n`;
  }
  
  // **时长**：视频时长（秒）
  if (shot.duration) {
    prompt += `**时长**：${shot.duration}秒\n\n`;
  }
  
  // **画幅**：画幅比例
  if (shot.aspectRatio) {
    prompt += `**画幅**：${shot.aspectRatio}\n\n`;
  }
  
  // **角色**：角色
  if (shot.characters) {
    prompt += `**角色**：${shot.characters}\n\n`;
  }
  
  // **场景**：场景设定
  if (shot.sceneSetting) {
    prompt += `**场景**：${shot.sceneSetting}\n\n`;
  }
  
  // **片段描述**：片段描述
  if (shot.description) {
    prompt += `**片段描述**：${shot.description}\n\n`;
  }
  
  // **声音**：对白 + 配乐风格 + 音效需求
  const soundParts = [];
  if (shot.musicStyle) soundParts.push(shot.musicStyle);
  if (shot.soundEffect) soundParts.push(shot.soundEffect);
  if (soundParts.length > 0) {
    prompt += `**声音**：对白 + ${soundParts.join(' + ')}\n\n`;
  }
  
  // **参考**：图片参考，视频参考，音频参考
  const refs = [];
  if (shot.imageRef) refs.push(shot.imageRef);
  if (shot.videoRef) refs.push(shot.videoRef);
  if (shot.audioRef) refs.push(shot.audioRef);
  if (refs.length > 0) {
    prompt += `**参考**：${refs.join('，')}\n\n`;
  }
  
  // 自定义提示词部分
  if (shot.customPrompt) {
    prompt += `${shot.customPrompt}\n\n`;
  }
  
  // 镜头列表
  const scenes = shot.scenes || [];
  const enabledScenes = scenes.filter(scene => scene.enabled !== false);
  
  if (enabledScenes.length > 0) {
    prompt += '---\n# 镜头\n\n';
    
    let cumulativeTime = 0;
    enabledScenes.forEach((scene, index) => {
      prompt += generateScenePrompt(scene, index, cumulativeTime);
      cumulativeTime += scene.duration || 2;
      prompt += '\n\n';
    });
  }
  
  return prompt.trim();
}

function generateProjectPrompt(project, getStatusText) {
  if (!project) return '';

  const shotsPrompt = (project.shots || [])
    .map(shot => generateShotPrompt(shot))
    .join('\n\n---\n\n');

  const statusText = getStatusText ? getStatusText(project.status || 'draft') : project.status || 'draft';

  return `【项目名称】${project.name} 【状态】${statusText} 【默认画幅】${project.aspectRatio}\n\n${shotsPrompt}`;
}

function renderPromptWithHighlight(prompt) {
  if (!prompt) return '';

  const keywords = [
    '风格', '时长', '画幅', '角色', '场景', '片段描述',
    '情绪', '配乐', '音效', '声音', '图片参考', '视频参考', '音频参考',
    '镜头', '对白'
  ];

  let highlighted = prompt;
  keywords.forEach(keyword => {
    const regex = new RegExp(`(\\*\\*${keyword}\\*\\*)`, 'g');
    highlighted = highlighted.replace(regex, '<span class="prompt-tag">$1</span>');
  });
  
  highlighted = highlighted.replace(/(---)/g, '<span class="prompt-separator">$1</span>');
  highlighted = highlighted.replace(/(\d+-\d+ 秒)/g, '<span class="prompt-scene-time">$1</span>');
  highlighted = highlighted.replace(/(## 镜头\d+)/g, '<span class="prompt-scene-title">$1</span>');

  return `<div class="prompt-content">${highlighted}</div>`;
}

function updatePromptPreview() {
  if (!elements.promptPreview) return;

  let prompt = '';

  // 无论选中片段还是镜头，都显示片段级提示词
  if (appState.currentShot) {
    prompt = generateShotPrompt(appState.currentShot);
  } else if (appState.currentProject) {
    prompt = generateProjectPrompt(appState.currentProject, getStatusText);
  } else {
    elements.promptPreview.innerHTML = '<div class="placeholder-text">请选中项目 > 片段 > 镜头，自动生成提示词</div>';
    return;
  }

  elements.promptPreview.innerHTML = renderPromptWithHighlight(prompt);
}

// ========== 属性面板 ==========

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

// 显示片段属性表单（两列布局）
async function showShotProperties(shot) {
  if (!elements.propertyForm) return;

  // 更新底部面板标题
  if (elements.bottomPanelTitle) {
    elements.bottomPanelTitle.textContent = `${shot.name || '片段'} 属性`;
  }

  // 加载自定义选项
  const styleOptions = await loadOptionsByGroup('风格');
  const moodOptions = await loadOptionsByGroup('情绪氛围');
  const ratioOptions = [
    { style: '16:9', description: '横屏视频，适合 YouTube、B 站等平台' },
    { style: '9:16', description: '竖屏视频，适合抖音、快手、Reels 等平台' },
    { style: '1:1', description: '正方形视频，适合 Instagram 等社交平台' },
    { style: '4:3', description: '传统电视比例' },
    { style: '3:4', description: '竖版照片比例' }
  ];
  const musicOptions = await loadOptionsByGroup('配乐风格');
  const soundOptions = await loadOptionsByGroup('音效');

  elements.propertyForm.innerHTML = `
    <div class="shot-properties-grid shot-properties-2cols">
      <!-- 第一列 -->
      <div class="property-column">
        <h4 class="property-section-title">基本信息</h4>
        <div class="form-group">
          <label for="shotName">片段名称</label>
          <input type="text" id="shotName" value="${shot.name || ''}" placeholder="输入片段名称" data-autosave="true">
        </div>
        <div class="form-group">
          <label for="shotDescription">片段描述</label>
          <textarea id="shotDescription" rows="3" placeholder="输入片段描述" data-autosave="true">${shot.description || ''}</textarea>
        </div>
        
        <h4 class="property-section-title" style="margin-top: 16px;">角色与场景</h4>
        <div class="form-group">
          <label for="shotCharacters">角色</label>
          <textarea id="shotCharacters" rows="2" placeholder="描述角色信息" data-autosave="true">${shot.characters || ''}</textarea>
        </div>
        <div class="form-group">
          <label for="shotSceneSetting">场景设定</label>
          <input type="text" id="shotSceneSetting" value="${shot.sceneSetting || ''}" placeholder="如：室内演播室" data-autosave="true">
        </div>
        
        <h4 class="property-section-title" style="margin-top: 16px;">参考素材</h4>
        <div class="form-group">
          <label for="shotImageRef">图片参考（≤9 张）</label>
          <textarea id="shotImageRef" rows="2" placeholder="例如：@图片 1 作为首帧" data-autosave="true">${shot.imageRef || ''}</textarea>
        </div>
        <div class="form-group">
          <label for="shotVideoRef">视频参考（≤3 个）</label>
          <textarea id="shotVideoRef" rows="2" placeholder="例如：@视频 1 作为参考运镜" data-autosave="true">${shot.videoRef || ''}</textarea>
        </div>
        <div class="form-group">
          <label for="shotAudioRef">音频参考（≤3 个）</label>
          <textarea id="shotAudioRef" rows="2" placeholder="例如：@音频 1 作为整体配乐" data-autosave="true">${shot.audioRef || ''}</textarea>
        </div>
        <small class="setting-hint" style="color: #f59e0b;">！最多 12 个文件，视频/音频总时长≤15 秒</small>
      </div>

      <!-- 第二列 -->
      <div class="property-column">
        <h4 class="property-section-title">风格设定</h4>
        <div class="form-group">
          <label for="shotStyle">
            风格
            <button type="button" class="icon-btn small add-option-btn" data-field="shotStyle" data-group="风格" title="添加新选项">+</button>
          </label>
          <select id="shotStyle" data-autosave="true">
            <option value="">请选择风格</option>
            ${styleOptions.map(opt => `
              <option value="${opt.style}" ${shot.style === opt.style ? 'selected' : ''} 
                data-description="${opt.description || ''}">
                ${opt.style} - ${opt.type}
              </option>
            `).join('')}
          </select>
          <small class="setting-hint" id="shotStyleHint">${styleOptions.find(o => o.style === shot.style)?.description || '选择风格'}</small>
        </div>
        <div class="form-group">
          <label for="shotMood">
            情绪氛围
            <button type="button" class="icon-btn small add-option-btn" data-field="shotMood" data-group="情绪氛围" title="添加新选项">+</button>
          </label>
          <select id="shotMood" data-autosave="true">
            <option value="">请选择情绪氛围</option>
            ${moodOptions.map(opt => `
              <option value="${opt.style}" ${shot.mood === opt.style ? 'selected' : ''}
                data-description="${opt.description || ''}">
                ${opt.style} - ${opt.type}
              </option>
            `).join('')}
          </select>
          <small class="setting-hint" id="shotMoodHint">${moodOptions.find(o => o.style === shot.mood)?.description || '选择情绪'}</small>
        </div>
        
        <h4 class="property-section-title" style="margin-top: 16px;">视频参数</h4>
        <div class="form-group">
          <label for="shotAspectRatio">画幅比例</label>
          <select id="shotAspectRatio" data-autosave="true">
            <option value="">请选择画幅</option>
            ${ratioOptions.map(opt => `
              <option value="${opt.style}" ${shot.aspectRatio === opt.style ? 'selected' : ''}
                data-description="${opt.description || ''}">
                ${opt.style}
              </option>
            `).join('')}
          </select>
          <small class="setting-hint" id="shotAspectRatioHint">${ratioOptions.find(o => o.style === shot.aspectRatio)?.description || '选择画幅'}</small>
        </div>
        <div class="form-group">
          <label for="shotDuration">视频时长（秒）</label>
          <input type="number" id="shotDuration" value="${shot.duration || 10}" min="1" max="15" step="0.5" data-autosave="true">
          <small class="setting-hint">每个片段最长 15 秒</small>
        </div>
        
        <h4 class="property-section-title" style="margin-top: 16px;">声音设计</h4>
        <div class="form-group">
          <label for="shotMusicStyle">
            配乐风格
            <button type="button" class="icon-btn small add-option-btn" data-field="shotMusicStyle" data-group="配乐风格" title="添加新选项">+</button>
          </label>
          <select id="shotMusicStyle" data-autosave="true">
            <option value="">请选择配乐风格</option>
            ${musicOptions.map(opt => `
              <option value="${opt.style}" ${shot.musicStyle === opt.style ? 'selected' : ''}
                data-description="${opt.description || ''}">
                ${opt.style} - ${opt.type}
              </option>
            `).join('')}
          </select>
          <small class="setting-hint" id="shotMusicStyleHint">${musicOptions.find(o => o.style === shot.musicStyle)?.description || '选择配乐'}</small>
        </div>
        <div class="form-group">
          <label for="shotSoundEffect">
            音效需求
            <button type="button" class="icon-btn small add-option-btn" data-field="shotSoundEffect" data-group="音效" title="添加新选项">+</button>
          </label>
          <select id="shotSoundEffect" data-autosave="true">
            <option value="">请选择音效</option>
            ${soundOptions.map(opt => `
              <option value="${opt.style}" ${shot.soundEffect === opt.style ? 'selected' : ''}
                data-description="${opt.description || ''}">
                ${opt.style} - ${opt.type}
              </option>
            `).join('')}
          </select>
          <small class="setting-hint" id="shotSoundEffectHint">${soundOptions.find(o => o.style === shot.soundEffect)?.description || '选择音效'}</small>
        </div>
        
        <h4 class="property-section-title" style="margin-top: 16px;">自定义提示词</h4>
        <div class="form-group">
          <label for="shotCustomPrompt">补充提示词</label>
          <textarea id="shotCustomPrompt" rows="3" placeholder="输入额外的提示词或要求" data-autosave="true">${shot.customPrompt || ''}</textarea>
        </div>
      </div>
    </div>
  `;

  // 为所有输入框添加失焦自动保存 - 不再传递闭包变量
  document.querySelectorAll('#property-form [data-autosave="true"]').forEach(input => {
    input.addEventListener('blur', autoSaveShotProperties);
  });

  // 为选项下拉框添加变化时更新提示 - 不再传递闭包变量
  setupOptionHintListeners();

  // 绑定添加选项按钮事件 - 不再传递闭包变量
  setupAddOptionButtons();
}

// 自动保存片段属性 - 使用 appState.currentShot 而不是闭包变量
let shotSaveTimeout = null;
let savingShotId = null; // 正在保存的片段 ID

function autoSaveShotProperties() {
  if (shotSaveTimeout) clearTimeout(shotSaveTimeout);
  // 记录当前要保存的片段 ID
  savingShotId = appState.currentShot?.id;
  shotSaveTimeout = setTimeout(async () => {
    await saveShotProperties(true);
  }, 500);
}

async function saveShotProperties(isAutoSave = false) {
  // 使用 appState 中的当前片段，而不是闭包变量
  const shot = appState.currentShot;
  if (!shot) return;

  // 关键修复：检查在保存过程中是否切换了片段
  if (savingShotId !== shot.id) {
    console.log('[saveShotProperties] 片段已切换，取消保存', savingShotId, '->', shot.id);
    return;
  }

  // 关键修复：检查表单元素是否存在，如果不存在说明已切换到镜头或其他地方
  const nameElement = document.getElementById('shotName');
  if (!nameElement) {
    console.log('[saveShotProperties] 表单元素不存在，可能已切换，取消保存');
    return;
  }

  const name = nameElement?.value;
  const description = document.getElementById('shotDescription')?.value;
  const style = document.getElementById('shotStyle')?.value;
  const mood = document.getElementById('shotMood')?.value;
  const characters = document.getElementById('shotCharacters')?.value;
  const sceneSetting = document.getElementById('shotSceneSetting')?.value;
  const aspectRatio = document.getElementById('shotAspectRatio')?.value;
  const duration = parseInt(document.getElementById('shotDuration')?.value) || 10;
  const musicStyle = document.getElementById('shotMusicStyle')?.value;
  const soundEffect = document.getElementById('shotSoundEffect')?.value;
  const imageRef = document.getElementById('shotImageRef')?.value;
  const videoRef = document.getElementById('shotVideoRef')?.value;
  const audioRef = document.getElementById('shotAudioRef')?.value;
  const customPrompt = document.getElementById('shotCustomPrompt')?.value;

  if (useElectronAPI && appState.currentProject.projectDir) {
    try {
      const loadResult = await window.electronAPI.loadProject(appState.currentProject.projectDir);
      if (!loadResult.success) return;

      // 使用 shot.id 查找正确的片段
      const shotIndex = loadResult.projectJson.shots?.findIndex(s => s.id === shot.id);
      if (shotIndex === -1) {
        console.error('保存片段失败：找不到片段 ID', shot.id);
        return;
      }

      const oldShot = loadResult.projectJson.shots[shotIndex];

      // 检查选项是否变更，如果变更则增加使用次数
      if (style && oldShot && style !== oldShot.style) {
        const styleOptions = await loadOptionsByGroup('风格');
        const selectedOption = styleOptions.find(opt => opt.style === style);
        if (selectedOption && !selectedOption.builtin) {
          await window.electronAPI.incrementOptionUsage(selectedOption.id);
        }
      }
      if (mood && oldShot && mood !== oldShot.mood) {
        const moodOptions = await loadOptionsByGroup('情绪氛围');
        const selectedOption = moodOptions.find(opt => opt.style === mood);
        if (selectedOption && !selectedOption.builtin) {
          await window.electronAPI.incrementOptionUsage(selectedOption.id);
        }
      }
      if (musicStyle && oldShot && musicStyle !== oldShot.musicStyle) {
        const musicOptions = await loadOptionsByGroup('配乐风格');
        const selectedOption = musicOptions.find(opt => opt.style === musicStyle);
        if (selectedOption && !selectedOption.builtin) {
          await window.electronAPI.incrementOptionUsage(selectedOption.id);
        }
      }
      if (soundEffect && oldShot && soundEffect !== oldShot.soundEffect) {
        const soundOptions = await loadOptionsByGroup('音效');
        const selectedOption = soundOptions.find(opt => opt.style === soundEffect);
        if (selectedOption && !selectedOption.builtin) {
          await window.electronAPI.incrementOptionUsage(selectedOption.id);
        }
      }

      loadResult.projectJson.shots[shotIndex] = {
        ...loadResult.projectJson.shots[shotIndex],
        name: name || '',
        description: description || '',
        style: style || '',
        mood: mood || '',
        characters: characters !== undefined && characters !== '' ? characters : (oldShot.characters || ''),
        sceneSetting: sceneSetting !== undefined && sceneSetting !== '' ? sceneSetting : (oldShot.sceneSetting || ''),
        aspectRatio: aspectRatio || '',
        duration: duration || 10,
        musicStyle: musicStyle !== undefined && musicStyle !== '' ? musicStyle : (oldShot.musicStyle || ''),
        soundEffect: soundEffect !== undefined && soundEffect !== '' ? soundEffect : (oldShot.soundEffect || ''),
        imageRef: imageRef !== undefined && imageRef !== '' ? imageRef : (oldShot.imageRef || ''),
        videoRef: videoRef !== undefined && videoRef !== '' ? videoRef : (oldShot.videoRef || ''),
        audioRef: audioRef !== undefined && audioRef !== '' ? audioRef : (oldShot.audioRef || ''),
        customPrompt: customPrompt !== undefined && customPrompt !== '' ? customPrompt : (oldShot.customPrompt || ''),
        updatedAt: new Date().toISOString()
      };

      const saveResult = await window.electronAPI.saveProject(
        appState.currentProject.projectDir,
        loadResult.projectJson
      );

      if (saveResult.success) {
        // 更新 appState 中的 currentShot 引用为最新数据
        appState.currentShot = loadResult.projectJson.shots[shotIndex];
        if (elements.bottomPanelTitle) {
          elements.bottomPanelTitle.textContent = `${name || '片段'} 属性`;
        }
        updatePromptPreview();
        // 重新渲染片段列表，更新片段名称等信息
        renderShotList(loadResult.projectJson.shots || []);
        // 重新设置选中状态
        const shotItem = document.querySelector(`#shot-list .list-item[data-id="${shot.id}"]`);
        if (shotItem) {
          shotItem.classList.add('selected');
        }
        // 自动保存时也显示提示
        showUpdateNotification();
      }
    } catch (error) {
      console.error('保存片段属性异常:', error);
    }
  }
}

// 显示镜头属性表单（两列布局）
async function showSceneProperties(scene) {
  if (!elements.propertyForm) return;

  // 更新底部面板标题
  if (elements.bottomPanelTitle) {
    elements.bottomPanelTitle.textContent = `${scene.name || '镜头'} 属性`;
  }

  // 加载自定义选项
  const shotTypeOptions = await loadOptionsByGroup('景别');
  const angleOptions = await loadOptionsByGroup('镜头角度');
  const cameraOptions = await loadOptionsByGroup('运镜');

  elements.propertyForm.innerHTML = `
    <div class="shot-properties-grid shot-properties-2cols">
      <!-- 第一列：基本信息 -->
      <div class="property-column">
        <h4 class="property-section-title">基本信息</h4>
        <div class="form-group">
          <label for="sceneName">镜头名称</label>
          <input type="text" id="sceneName" value="${scene.name || ''}" placeholder="输入镜头名称" data-autosave="true">
        </div>
        <div class="form-group">
          <label for="sceneImage">分镜图片</label>
          <textarea id="sceneImage" rows="2" placeholder="点击上传或拖放图片，支持多张图片" data-autosave="true">${scene.image || ''}</textarea>
          <small class="setting-hint">支持上传和拖放图片</small>
        </div>
        
        <h4 class="property-section-title" style="margin-top: 16px;">镜头信息</h4>
        <div class="form-group">
          <label for="sceneShotType">
            景别
            <button type="button" class="icon-btn small add-option-btn" data-field="sceneShotType" data-group="景别" title="添加新选项">+</button>
          </label>
          <select id="sceneShotType" data-autosave="true">
            <option value="">请选择景别</option>
            ${shotTypeOptions.map(opt => `
              <option value="${opt.style}" ${scene.shotType === opt.style ? 'selected' : ''}
                data-description="${opt.description || ''}">
                ${opt.style} - ${opt.type}
              </option>
            `).join('')}
          </select>
          <small class="setting-hint" id="sceneShotTypeHint">${shotTypeOptions.find(o => o.style === scene.shotType)?.description || '选择景别'}</small>
        </div>
        <div class="form-group">
          <label for="sceneAngle">
            镜头角度
            <button type="button" class="icon-btn small add-option-btn" data-field="sceneAngle" data-group="镜头角度" title="添加新选项">+</button>
          </label>
          <select id="sceneAngle" data-autosave="true">
            <option value="">请选择镜头角度</option>
            ${angleOptions.map(opt => `
              <option value="${opt.style}" ${scene.angle === opt.style ? 'selected' : ''}
                data-description="${opt.description || ''}">
                ${opt.style} - ${opt.type}
              </option>
            `).join('')}
          </select>
          <small class="setting-hint" id="sceneAngleHint">${angleOptions.find(o => o.style === scene.angle)?.description || '选择镜头角度'}</small>
        </div>
        <div class="form-group">
          <label for="sceneCamera">
            运镜方式
            <button type="button" class="icon-btn small add-option-btn" data-field="sceneCamera" data-group="运镜" title="添加新选项">+</button>
          </label>
          <select id="sceneCamera" data-autosave="true">
            <option value="">请选择运镜方式</option>
            ${cameraOptions.map(opt => `
              <option value="${opt.style}" ${scene.camera === opt.style ? 'selected' : ''}
                data-description="${opt.description || ''}">
                ${opt.style} - ${opt.type}
              </option>
            `).join('')}
          </select>
          <small class="setting-hint" id="sceneCameraHint">${cameraOptions.find(o => o.style === scene.camera)?.description || '选择运镜方式'}</small>
        </div>
      </div>

      <!-- 第二列：详细信息 -->
      <div class="property-column">
        <h4 class="property-section-title">镜头信息</h4>
        <div class="form-group">
          <label for="sceneDuration">时长（秒）</label>
          <input type="number" id="sceneDuration" value="${scene.duration || 2}" min="1" step="0.5" data-autosave="true">
        </div>
        <div class="form-group">
          <label for="sceneContent">内容描述</label>
          <textarea id="sceneContent" rows="4" placeholder="输入镜头内容描述" data-autosave="true">${scene.content || ''}</textarea>
        </div>
        <div class="form-group">
          <label for="sceneDialogue">对白内容</label>
          <textarea id="sceneDialogue" rows="3" placeholder="输入台词或旁白" data-autosave="true">${scene.dialogue || ''}</textarea>
        </div>
        <div class="form-group">
          <label for="sceneEmotion">情绪描述</label>
          <input type="text" id="sceneEmotion" value="${scene.emotion || ''}" placeholder="如：紧张、温馨、悲伤" data-autosave="true">
        </div>
        <div class="form-group">
          <label for="sceneNotes">其他备注</label>
          <textarea id="sceneNotes" rows="3" placeholder="输入备注信息" data-autosave="true">${scene.notes || ''}</textarea>
        </div>
      </div>
    </div>
  `;

  // 为所有输入框添加失焦自动保存 - 不再传递闭包变量
  document.querySelectorAll('#property-form [data-autosave="true"]').forEach(input => {
    input.addEventListener('blur', autoSaveSceneProperties);
  });

  // 为选项下拉框添加变化时更新提示 - 不再传递闭包变量
  setupSceneOptionHintListeners();

  // 绑定添加选项按钮事件 - 不再传递闭包变量
  setupAddOptionButtons();
}

// 自动保存镜头属性 - 使用 appState.currentScene 而不是闭包变量
let sceneSaveTimeout = null;
let savingSceneId = null; // 正在保存的镜头 ID

function autoSaveSceneProperties() {
  if (sceneSaveTimeout) clearTimeout(sceneSaveTimeout);
  // 记录当前要保存的镜头 ID
  savingSceneId = appState.currentScene?.id;
  sceneSaveTimeout = setTimeout(async () => {
    await saveSceneProperties(true);
  }, 500);
}

async function saveSceneProperties(isAutoSave = false) {
  // 使用 appState 中的当前镜头，而不是闭包变量
  const scene = appState.currentScene;
  const currentShot = appState.currentShot;
  if (!scene || !currentShot) return;

  // 关键修复：检查在保存过程中是否切换了镜头
  if (savingSceneId !== scene.id) {
    console.log('[saveSceneProperties] 镜头已切换，取消保存', savingSceneId, '->', scene.id);
    return;
  }

  // 关键修复：检查表单元素是否存在，如果不存在说明已切换到片段或其他地方
  const nameElement = document.getElementById('sceneName');
  if (!nameElement) {
    console.log('[saveSceneProperties] 表单元素不存在，可能已切换，取消保存');
    return;
  }

  const name = nameElement?.value;
  const image = document.getElementById('sceneImage')?.value;
  const shotType = document.getElementById('sceneShotType')?.value;
  const angle = document.getElementById('sceneAngle')?.value;
  const camera = document.getElementById('sceneCamera')?.value;
  const duration = parseInt(document.getElementById('sceneDuration')?.value) || 2;
  const content = document.getElementById('sceneContent')?.value;
  const dialogue = document.getElementById('sceneDialogue')?.value;
  const emotion = document.getElementById('sceneEmotion')?.value;
  const notes = document.getElementById('sceneNotes')?.value;

  if (useElectronAPI && appState.currentProject.projectDir) {
    try {
      const loadResult = await window.electronAPI.loadProject(appState.currentProject.projectDir);
      if (!loadResult.success) return;

      // 查找当前片段
      const shot = loadResult.projectJson.shots?.find(s => s.id === currentShot.id);
      if (!shot || !shot.scenes) {
        console.error('保存镜头失败：找不到片段', currentShot.id);
        return;
      }

      // 使用 scene.id 查找正确的镜头
      const sceneIndex = shot.scenes.findIndex(s => s.id === scene.id);
      if (sceneIndex === -1) {
        console.error('保存镜头失败：找不到镜头 ID', scene.id);
        return;
      }

      const oldScene = shot.scenes[sceneIndex];

      // 检查选项是否变更，如果变更则增加使用次数
      if (shotType && oldScene && shotType !== oldScene.shotType) {
        const shotTypeOptions = await loadOptionsByGroup('景别');
        const selectedOption = shotTypeOptions.find(opt => opt.style === shotType);
        if (selectedOption && !selectedOption.builtin) {
          await window.electronAPI.incrementOptionUsage(selectedOption.id);
        }
      }
      if (angle && oldScene && angle !== oldScene.angle) {
        const angleOptions = await loadOptionsByGroup('镜头角度');
        const selectedOption = angleOptions.find(opt => opt.style === angle);
        if (selectedOption && !selectedOption.builtin) {
          await window.electronAPI.incrementOptionUsage(selectedOption.id);
        }
      }
      if (camera && oldScene && camera !== oldScene.camera) {
        const cameraOptions = await loadOptionsByGroup('运镜');
        const selectedOption = cameraOptions.find(opt => opt.style === camera);
        if (selectedOption && !selectedOption.builtin) {
          await window.electronAPI.incrementOptionUsage(selectedOption.id);
        }
      }

      shot.scenes[sceneIndex] = {
        ...shot.scenes[sceneIndex],
        name: name || '',
        image: image !== undefined && image !== '' ? image : (oldScene.image || ''),
        shotType: shotType || '',
        angle: angle || '',
        camera: camera || '',
        duration: duration || 2,
        content: content || '',
        dialogue: dialogue || '',
        emotion: emotion || '',
        notes: notes || '',
        updatedAt: new Date().toISOString()
      };

      const saveResult = await window.electronAPI.saveProject(
        appState.currentProject.projectDir,
        loadResult.projectJson
      );

      if (saveResult.success) {
        // 更新 appState 中的 currentScene 引用为最新数据
        appState.currentScene = shot.scenes[sceneIndex];
        // 同时更新 currentShot，确保提示词生成使用最新数据
        appState.currentShot = shot;
        if (elements.bottomPanelTitle) {
          elements.bottomPanelTitle.textContent = `${name || '镜头'} 属性`;
        }
        updatePromptPreview();
        // 重新渲染镜头列表，更新镜头名称等信息
        renderSceneList(shot.scenes || []);
        // 重新设置选中状态
        const sceneItem = document.querySelector(`#scene-list .list-item[data-id="${scene.id}"]`);
        if (sceneItem) {
          sceneItem.classList.add('selected');
        }
        // 自动保存时也显示提示
        showUpdateNotification();
      }
    } catch (error) {
      console.error('保存镜头属性异常:', error);
    }
  }
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

function copyPromptToClipboard() {
  const prompt = elements.promptPreview?.textContent;
  if (prompt) {
    navigator.clipboard.writeText(prompt).then(() => {
      showUpdateNotification();
    });
  }
}

function exportPrompt() {
  const prompt = elements.promptPreview?.textContent;
  if (prompt) {
    const blob = new Blob([prompt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

function clearPrompt() {
  if (elements.promptPreview) {
    elements.promptPreview.innerHTML = '<div class="placeholder-text">请选中项目 > 片段 > 镜头，自动生成提示词</div>';
  }
}

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

// 显示项目右键菜单
function showProjectContextMenu(project, event) {
  const menu = document.getElementById('project-context-menu');
  if (menu) {
    menu.remove();
    return;
  }

  const contextMenu = document.createElement('div');
  contextMenu.id = 'project-context-menu';
  contextMenu.className = 'context-menu';
  contextMenu.innerHTML = `
    <div class="context-menu-item" id="project-context-modify">修改项目</div>
    <div class="context-menu-item" id="project-context-delete">删除项目</div>
    <div class="context-menu-item" id="project-context-open-folder">打开资源文件管理器</div>
  `;

  // 菜单位置：鼠标点击位置
  contextMenu.style.position = 'fixed';
  contextMenu.style.top = `${event.clientY}px`;
  contextMenu.style.left = `${event.clientX}px`;
  contextMenu.style.zIndex = '1001';
  contextMenu.style.minWidth = '180px';

  // 菜单项点击事件
  contextMenu.addEventListener('click', (e) => {
    const target = e.target;
    if (target.id === 'project-context-modify') {
      if (project) {
        alert('修改项目功能待实现');
      }
    } else if (target.id === 'project-context-delete') {
      if (project) {
        appState.currentProject = project;
        deleteCurrentProject();
      }
    } else if (target.id === 'project-context-open-folder') {
      if (project) {
        openProjectFolderByProject(project);
      }
    }
    contextMenu.remove();
  });

  // 点击其他地方关闭菜单
  setTimeout(() => {
    document.addEventListener('click', function closeMenu(ev) {
      if (!contextMenu.contains(ev.target)) {
        contextMenu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
  }, 100);

  document.body.appendChild(contextMenu);
}

// 打开项目文件夹（通过项目对象）
function openProjectFolderByProject(project) {
  if (!project || !project.projectDir) {
    alert('项目目录不存在');
    return;
  }
  if (useElectronAPI) {
    try {
      window.electronAPI.openPath(project.projectDir);
    } catch (error) {
      console.error('打开文件夹失败:', error);
      alert('打开文件夹失败：' + error.message);
    }
  }
}

// 显示项目状态菜单
function showProjectStatusMenu(project, event) {
  const menu = document.getElementById('project-status-menu');
  if (menu) {
    menu.remove();
    return;
  }

  const statuses = [
    { value: 'draft', label: '草稿' },
    { value: 'processing', label: '进行中' },
    { value: 'completed', label: '已完成' },
    { value: 'cancelled', label: '已取消' }
  ];

  const contextMenu = document.createElement('div');
  contextMenu.id = 'project-status-menu';
  contextMenu.className = 'context-menu';
  contextMenu.innerHTML = `
    <div class="context-menu-item" data-status="draft" ${project.status === 'draft' ? 'style="font-weight:bold;"' : ''}>草稿</div>
    <div class="context-menu-item" data-status="processing" ${project.status === 'processing' ? 'style="font-weight:bold;"' : ''}>进行中</div>
    <div class="context-menu-item" data-status="completed" ${project.status === 'completed' ? 'style="font-weight:bold;"' : ''}>已完成</div>
    <div class="context-menu-item" data-status="cancelled" ${project.status === 'cancelled' ? 'style="font-weight:bold;"' : ''}>已取消</div>
  `;

  // 菜单位置：鼠标点击位置
  contextMenu.style.position = 'fixed';
  contextMenu.style.top = `${event.clientY}px`;
  contextMenu.style.left = `${event.clientX}px`;
  contextMenu.style.zIndex = '1001';
  contextMenu.style.minWidth = '100px';

  contextMenu.addEventListener('click', (e) => {
    const status = e.target.dataset.status;
    if (status) {
      updateProjectStatus(project, status);
    }
    contextMenu.remove();
  });

  // 点击其他地方关闭菜单
  setTimeout(() => {
    document.addEventListener('click', function closeMenu(ev) {
      if (!contextMenu.contains(ev.target)) {
        contextMenu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
  }, 100);

  document.body.appendChild(contextMenu);
}

// 显示片段状态菜单
function showShotStatusMenu(shot, event) {
  const menu = document.getElementById('shot-status-menu');
  if (menu) {
    menu.remove();
    return;
  }

  const statuses = [
    { value: 'draft', label: '草稿' },
    { value: 'processing', label: '进行中' },
    { value: 'completed', label: '已完成' },
    { value: 'cancelled', label: '已取消' }
  ];

  const contextMenu = document.createElement('div');
  contextMenu.id = 'shot-status-menu';
  contextMenu.className = 'context-menu';
  contextMenu.innerHTML = `
    <div class="context-menu-item" data-status="draft" ${shot.status === 'draft' ? 'style="font-weight:bold;"' : ''}>草稿</div>
    <div class="context-menu-item" data-status="processing" ${shot.status === 'processing' ? 'style="font-weight:bold;"' : ''}>进行中</div>
    <div class="context-menu-item" data-status="completed" ${shot.status === 'completed' ? 'style="font-weight:bold;"' : ''}>已完成</div>
    <div class="context-menu-item" data-status="cancelled" ${shot.status === 'cancelled' ? 'style="font-weight:bold;"' : ''}>已取消</div>
  `;

  // 菜单位置：鼠标点击位置
  contextMenu.style.position = 'fixed';
  contextMenu.style.top = `${event.clientY}px`;
  contextMenu.style.left = `${event.clientX}px`;
  contextMenu.style.zIndex = '1001';
  contextMenu.style.minWidth = '100px';

  contextMenu.addEventListener('click', (e) => {
    const status = e.target.dataset.status;
    if (status) {
      updateShotStatus(shot, status);
    }
    contextMenu.remove();
  });

  // 点击其他地方关闭菜单
  setTimeout(() => {
    document.addEventListener('click', function closeMenu(ev) {
      if (!contextMenu.contains(ev.target)) {
        contextMenu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
  }, 100);

  document.body.appendChild(contextMenu);
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

// 更新片段状态 - 保留在 renderer.js 中（属于片段管理）
async function updateShotStatus(shot, newStatus) {
  if (!useElectronAPI) {
    alert('请在 Electron 环境中使用此功能');
    return;
  }
  
  if (!appState.currentProject || !appState.currentProject.projectDir) {
    alert('项目目录不存在，请先选择项目');
    return;
  }
  
  // 检查 shot 对象是否有 id，没有则生成
  if (!shot.id) {
    shot.id = Date.now();
    console.log('生成片段 ID:', shot.id);
  }
  
  try {
    const loadResult = await window.electronAPI.loadProject(appState.currentProject.projectDir);
    if (!loadResult.success) {
      alert('加载项目失败：' + loadResult.error);
      return;
    }

    // 找到片段并更新状态（使用 shot.id 查找）
    let shotIndex = loadResult.projectJson.shots?.findIndex(s => s.id === shot.id);
    
    // 如果没找到，尝试通过名称匹配（兼容旧数据）
    if (shotIndex === -1 && shot.name) {
      shotIndex = loadResult.projectJson.shots?.findIndex(s => s.name === shot.name);
      console.log('通过名称匹配片段:', shot.name, '索引:', shotIndex);
    }
    
    if (shotIndex === -1) {
      console.error('片段未找到:shot.id:', shot.id, 'shot.name:', shot.name);
      console.error('可用片段:', loadResult.projectJson.shots?.map(s => ({ id: s.id, name: s.name })));
      alert('片段未找到，请检查数据一致性');
      return;
    }
    
    // 更新片段 ID（如果之前没有）和状态
    loadResult.projectJson.shots[shotIndex].id = shot.id;
    loadResult.projectJson.shots[shotIndex].status = newStatus;
    loadResult.projectJson.project.updatedAt = new Date().toISOString();

    const saveResult = await window.electronAPI.saveProject(
      appState.currentProject.projectDir,
      loadResult.projectJson
    );

    if (saveResult.success) {
      // 更新本地状态
      shot.status = newStatus;
      // 重新渲染片段列表
      renderShotList(loadResult.projectJson.shots || []);
      showUpdateNotification();
    } else {
      alert('保存失败：' + saveResult.error);
    }
  } catch (error) {
    console.error('更新片段状态异常:', error);
    alert('更新状态失败：' + error.message);
  }
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
    showToast,
    showConfirm
  );
}

// ========== 面板拖拽 ==========

let isResizing = false;
let currentResizer = null;
let startX = 0;
let startWidth = 0;
let currentPanel = null;

// 初始化面板拖拽
function initPanelResizers() {
  const resizers = document.querySelectorAll('.panel-resizer');
  resizers.forEach(resizer => {
    resizer.addEventListener('mousedown', (e) => {
      isResizing = true;
      currentResizer = resizer;
      currentPanel = resizer.dataset.panel;
      startX = e.pageX;
      
      const panel = resizer.parentElement;
      startWidth = panel.offsetWidth;
      
      resizer.classList.add('resizing');
      
      document.addEventListener('mousemove', handleResizerMouseMove);
      document.addEventListener('mouseup', handleResizerMouseUp);
      
      e.preventDefault();
    });
  });
}

// 处理拖拽移动
function handleResizerMouseMove(e) {
  if (!isResizing || !currentResizer) return;
  
  const diff = e.pageX - startX;
  const panel = currentResizer.parentElement;
  const newWidth = startWidth + diff;
  
  // 根据面板类型设置最小/最大宽度
  const constraints = getPanelConstraints(currentPanel);
  const constrainedWidth = Math.max(constraints.min, Math.min(constraints.max, newWidth));
  
  panel.style.width = `${constrainedWidth}px`;
  panel.style.flex = 'none';
}

// 处理拖拽结束
function handleResizerMouseUp() {
  isResizing = false;
  if (currentResizer) {
    currentResizer.classList.remove('resizing');
  }
  currentResizer = null;
  currentPanel = null;
  
  document.removeEventListener('mousemove', handleResizerMouseMove);
  document.removeEventListener('mouseup', handleResizerMouseUp);
}

// 获取面板约束
function getPanelConstraints(panelType) {
  const constraints = {
    project: { min: 150, max: 500 },
    shot: { min: 200, max: 600 },
    scene: { min: 250, max: 700 }
  };
  return constraints[panelType] || { min: 150, max: 500 };
}

// ========== 工具函数 ==========

// 自定义 Toast 提示（替代 alert）
function showToast(message, duration = 2000) {
  const toast = document.getElementById('toast-notification');
  const toastMessage = document.getElementById('toast-message');
  if (!toast || !toastMessage) return;

  toastMessage.textContent = message;
  toast.style.display = 'block';

  setTimeout(() => {
    toast.style.display = 'none';
  }, duration);
}

// 自定义确认对话框（替代 confirm）
function showConfirm(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirm-modal');
    const confirmMessage = document.getElementById('confirm-message');
    const okBtn = document.getElementById('confirm-ok-btn');
    const cancelBtn = document.getElementById('confirm-cancel-btn');

    if (!modal || !confirmMessage || !okBtn || !cancelBtn) {
      resolve(false);
      return;
    }

    confirmMessage.textContent = message;
    modal.style.display = 'flex';

    // 移除旧的事件监听器
    const newOkBtn = okBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOkBtn, okBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    // 添加新的事件监听器
    newOkBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      resolve(true);
    });

    newCancelBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      resolve(false);
    });

    // 点击背景关闭
    modal.addEventListener('click', function closeOnBackdrop(e) {
      if (e.target === modal) {
        modal.style.display = 'none';
        modal.removeEventListener('click', closeOnBackdrop);
        resolve(false);
      }
    });
  });
}

// 替换 toggleSceneView 函数，使用 Toast 替代 alert
function toggleSceneView() {
  showToast('视图切换功能待实现');
}

// 全局替换 alert 和 confirm
const originalAlert = window.alert;
const originalConfirm = window.confirm;

window.alert = function(message) {
  showToast(message);
};

// 获取状态文本
function getStatusText(status) {
  const statusMap = {
    draft: '草稿',
    processing: '进行中',
    completed: '已完成',
    cancelled: '已取消'
  };
  return statusMap[status] || status;
}

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

// ========== 全局变量暴露（供模块使用）==========
// 注意：必须在 initializeApp 之后调用，确保 useElectronAPI 已更新
function exposeGlobals() {
  window.useElectronAPI = useElectronAPI;
  window.elements = elements;
  window.appState = appState;
}

// 在 initializeApp 中调用暴露
const originalInitializeApp = initializeApp;
initializeApp = async function() {
  await originalInitializeApp();
  exposeGlobals();
  console.log('[initializeApp] 全局变量已暴露，useElectronAPI:', useElectronAPI);
};
