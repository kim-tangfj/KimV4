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
  elements.projectMenuBtn = document.getElementById('project-menu-btn');
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
  elements.customOptionsList = document.getElementById('custom-options-list');
  elements.customOptionsEditor = document.getElementById('custom-options-editor');
  elements.saveCustomOptionBtn = document.getElementById('save-custom-option-btn');
  elements.cancelCustomOptionBtn = document.getElementById('cancel-custom-option-btn');
  elements.customOptionGroup = document.getElementById('custom-option-group');
  elements.customOptionType = document.getElementById('custom-option-type');
  elements.customOptionStyle = document.getElementById('custom-option-style');
  elements.customOptionDescription = document.getElementById('custom-option-description');
  elements.customOptionId = document.getElementById('custom-option-id');

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
  if (elements.projectMenuBtn) {
    elements.projectMenuBtn.addEventListener('click', showProjectMenu);
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
    elements.refreshCustomOptionsBtn.addEventListener('click', loadCustomOptionsList);
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

  // 清空输入
  if (elements.manualProjectName) elements.manualProjectName.value = '';
  if (elements.manualProjectDesc) elements.manualProjectDesc.value = '';
  if (elements.manualProjectRatio) elements.manualProjectRatio.value = '16:9';
  if (elements.manualProjectJson) elements.manualProjectJson.value = '';
  if (elements.aiProjectName) elements.aiProjectName.value = '';
  if (elements.aiProjectDesc) elements.aiProjectDesc.value = '';
  if (elements.aiProjectRatio) elements.aiProjectRatio.value = '16:9';

  // 切换到手动模式
  elements.modeTabs.forEach(tab => {
    tab.classList.remove('active');
  });
  if (elements.modeTabs.length > 0) {
    elements.modeTabs[0].classList.add('active'); // 手动模式是第一个
  }
  if (elements.manualMode) elements.manualMode.classList.add('active');
  if (elements.aiMode) elements.aiMode.classList.remove('active');

  elements.newProjectModal.style.display = 'flex';

  setTimeout(() => {
    if (elements.manualProjectName) elements.manualProjectName.focus();
  }, 100);
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
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTemplate(btn.dataset.id);
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
function deleteTemplate(templateId) {
  const template = settings.templates.find(t => t.id === templateId);
  if (!template) return;
  
  if (!confirm(`确定要删除模板 "${template.name}" 吗？`)) return;
  
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
  
  if (!confirm('恢复模板将覆盖当前的模板配置，确定继续吗？')) {
    return;
  }
  
  const result = await window.electronAPI.restoreTemplates();
  if (result.success) {
    alert('模板恢复成功！请重启应用以加载恢复的模板。');
  } else if (!result.canceled) {
    alert('恢复失败：' + result.error);
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
  hideCustomOptionForm();
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

// 加载自定义选项列表
async function loadCustomOptionsList(filterGroup = 'all') {
  if (!useElectronAPI || !elements.customOptionsList) return;
  
  elements.customOptionsList.innerHTML = '<div class="placeholder-text">加载中...</div>';
  
  try {
    const result = await window.electronAPI.getAllOptions();
    if (result.success && result.options) {
      let options = result.options;
      
      // 按组别筛选
      if (filterGroup !== 'all') {
        options = options.filter(opt => opt.group === filterGroup);
      }
      
      if (options.length === 0) {
        elements.customOptionsList.innerHTML = '<div class="placeholder-text">暂无选项</div>';
        return;
      }
      
      elements.customOptionsList.innerHTML = '';
      
      options.forEach(option => {
        const itemElement = document.createElement('div');
        itemElement.className = 'custom-option-item' + (option.builtin ? ' builtin' : '');
        
        itemElement.innerHTML = `
          <div class="custom-option-item-info">
            <div class="custom-option-item-header">
              <span class="custom-option-group-tag">${option.group}</span>
              <span class="custom-option-item-title">${option.type} - ${option.style}</span>
              ${option.builtin ? '<span style="font-size:11px;color:#888;">(系统)</span>' : ''}
            </div>
            <div class="custom-option-item-subtitle">${option.description || ''}</div>
          </div>
          ${!option.builtin ? `
            <div class="custom-option-item-actions">
              <button class="form-btn small-btn edit-option-btn" data-id="${option.id}">编辑</button>
              <button class="form-btn small-btn delete-option-btn" data-id="${option.id}">删除</button>
            </div>
          ` : ''}
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
        
        elements.customOptionsList.appendChild(itemElement);
      });
    }
  } catch (error) {
    console.error('加载选项列表失败:', error);
    elements.customOptionsList.innerHTML = '<div class="placeholder-text">加载失败</div>';
  }
}

// 显示添加自定义选项表单
function showAddCustomOptionForm() {
  if (elements.customOptionsEditor) {
    elements.customOptionsEditor.style.display = 'block';
  }
  if (elements.saveCustomOptionBtn) {
    elements.saveCustomOptionBtn.style.display = 'inline-block';
  }
  if (elements.cancelCustomOptionBtn) {
    elements.cancelCustomOptionBtn.style.display = 'inline-block';
  }
  
  // 清空表单
  if (elements.customOptionId) elements.customOptionId.value = '';
  if (elements.customOptionGroup) elements.customOptionGroup.value = '';
  if (elements.customOptionType) elements.customOptionType.value = '';
  if (elements.customOptionStyle) elements.customOptionStyle.value = '';
  if (elements.customOptionDescription) elements.customOptionDescription.value = '';
}

// 显示编辑自定义选项表单
function showEditCustomOptionForm(option) {
  showAddCustomOptionForm();
  
  // 填充表单数据
  if (elements.customOptionId) elements.customOptionId.value = option.id;
  if (elements.customOptionGroup) elements.customOptionGroup.value = option.group;
  if (elements.customOptionType) elements.customOptionType.value = option.type;
  if (elements.customOptionStyle) elements.customOptionStyle.value = option.style;
  if (elements.customOptionDescription) elements.customOptionDescription.value = option.description;
}

// 隐藏自定义选项表单
function hideCustomOptionForm() {
  if (elements.customOptionsEditor) {
    elements.customOptionsEditor.style.display = 'none';
  }
  if (elements.saveCustomOptionBtn) {
    elements.saveCustomOptionBtn.style.display = 'none';
  }
  if (elements.cancelCustomOptionBtn) {
    elements.cancelCustomOptionBtn.style.display = 'none';
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
  
  if (!confirm('确定要删除该自定义选项吗？')) {
    return;
  }
  
  try {
    const result = await window.electronAPI.deleteCustomOption(optionId);
    if (result.success) {
      await loadCustomOptionsList();
      showUpdateNotification();
    } else {
      alert('删除失败：' + result.error);
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
  
  if (!confirm('恢复选项将覆盖当前的自定义选项配置，确定继续吗？')) {
    return;
  }
  
  const result = await window.electronAPI.restoreOptions();
  if (result.success) {
    alert('选项恢复成功！请重新打开管理窗口以查看恢复的选项。');
    hideCustomOptionsModal();
  } else if (!result.canceled) {
    alert('恢复失败：' + result.error);
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
        renderProjectList(appState.projects);
        console.log('项目加载成功，数量:', result.projects.length);
      } else {
        console.error('项目加载失败:', result.error);
        appState.projects = [];
        renderProjectList([]);
      }
    } catch (error) {
      console.error('加载项目异常:', error);
      appState.projects = [];
      renderProjectList([]);
    }
  } else {
    const savedProjects = localStorage.getItem('kim_projects');
    if (savedProjects) {
      appState.projects = JSON.parse(savedProjects);
    } else {
      appState.projects = [];
    }
    renderProjectList(appState.projects);
  }
}

function renderProjectList(projects) {
  if (!elements.projectList) return;

  elements.projectList.innerHTML = '';

  if (projects.length === 0) {
    elements.projectList.innerHTML = '<div class="placeholder-text">暂无项目，点击菜单新建</div>';
    return;
  }

  projects.forEach(project => {
    const projectElement = document.createElement('div');
    projectElement.className = 'list-item';
    projectElement.dataset.id = project.id;
    const statusText = getStatusText(project.status || 'draft');
    projectElement.innerHTML = `
      <div class="list-item-content">
        <div class="list-item-title">${project.name}</div>
        <div class="list-item-subtitle">
          ${(project.description || '').substring(0, 30)}${(project.description || '').length > 30 ? '...' : ''}
        </div>
      </div>
      <span class="status-tag status-${project.status || 'draft'}" data-project-id="${project.id}" data-status="${project.status || 'draft'}">${statusText}</span>
    `;

    // 项目卡片点击
    projectElement.addEventListener('click', (e) => {
      // 如果点击的是状态标签，不触发项目选择
      if (e.target.classList.contains('status-tag')) {
        return;
      }
      selectProject(project);
    });

    // 状态标签点击
    const statusTag = projectElement.querySelector('.status-tag');
    if (statusTag) {
      statusTag.addEventListener('click', (e) => {
        e.stopPropagation();
        showProjectStatusMenu(project, e);
      });
    }

    elements.projectList.appendChild(projectElement);
  });
}

async function selectProject(project) {
  appState.currentProject = project;
  appState.currentShot = null;
  appState.currentScene = null;

  document.querySelectorAll('#project-list .list-item').forEach(item => {
    item.classList.remove('selected');
  });
  document.querySelector(`#project-list .list-item[data-id="${project.id}"]`)?.classList.add('selected');

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
  appState.currentShot = shot;

  // 移除项目列表的选中状态
  document.querySelectorAll('#project-list .list-item').forEach(item => {
    item.classList.remove('selected');
  });
  
  // 移除所有片段选中状态
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

  renderSceneList(shot.scenes || []);
  updatePromptPreview();
  showShotProperties(shot);
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
  
  if (!confirm(`确定要删除片段 "${appState.currentShot.name}" 吗？`)) return;
  
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
    sceneElement.addEventListener('click', () => selectScene(scene));
    elements.sceneList.appendChild(sceneElement);
  });
}

function selectScene(scene) {
  appState.currentScene = scene;

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
  showSceneProperties(scene);
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
  
  if (!confirm(`确定要删除镜头 "${appState.currentScene.name}" 吗？`)) return;
  
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

function updatePromptPreview() {
  if (!elements.promptPreview) return;
  
  let prompt = '';
  
  if (appState.currentScene) {
    prompt = generateScenePrompt(appState.currentScene);
  } else if (appState.currentShot) {
    prompt = generateShotPrompt(appState.currentShot);
  } else if (appState.currentProject) {
    prompt = generateProjectPrompt(appState.currentProject);
  } else {
    elements.promptPreview.innerHTML = '<div class="placeholder-text">请选中项目 > 片段 > 镜头，自动���成提示词</div>';
    return;
  }
  
  elements.promptPreview.innerHTML = renderPromptWithHighlight(prompt);
}

function generateScenePrompt(scene) {
  if (!scene) return '';
  return `【镜头类型】${scene.shotType} 【拍摄角度】${scene.angle} 【时长】${scene.duration}秒 【情绪】${scene.emotion} 【内容】${scene.content}`;
}

function generateShotPrompt(shot) {
  if (!shot) return '';
  
  const scenesPrompt = (shot.scenes || [])
    .filter(scene => scene.enabled !== false)
    .map(scene => generateScenePrompt(scene))
    .join('\n\n');
  
  return `【片段名称】${shot.name} 【总时长���${shot.duration}秒 【画幅】${shot.aspectRatio} 【风格】${shot.style} 【情绪】${shot.mood}\n\n${scenesPrompt}`;
}

function generateProjectPrompt(project) {
  if (!project) return '';
  
  const shotsPrompt = (project.shots || [])
    .map(shot => generateShotPrompt(shot))
    .join('\n\n---\n\n');
  
  return `【项目名称】${project.name} 【状态】${getStatusText(project.status)} 【默认画幅】${project.aspectRatio}\n\n${shotsPrompt}`;
}

function renderPromptWithHighlight(prompt) {
  if (!prompt) return prompt;
  
  const keywords = ['镜头类型', '拍��角度', '时长', '情绪', '内容', '片段名称', '总��长', '画�����', '风格', '项目名称', '状态', '默认��幅'];
  
  let highlighted = prompt;
  keywords.forEach(keyword => {
    const regex = new RegExp(`(\\【${keyword}\\】)`, 'g');
    highlighted = highlighted.replace(regex, '<span class="prompt-tag">$1</span>');
  });
  highlighted = highlighted.replace(/(---)/g, '<span class="prompt-separator">$1</span>');
  highlighted = highlighted.replace(/(\\d+ 秒)/g, '<span class="prompt-value">$1</span>');
  
  return `<div class="prompt-content">${highlighted}</div>`;
}

// ========== 属性面板 ==========

function showShotProperties(shot) {
  if (!elements.propertyForm) return;

  // 更新底部面板标题
  if (elements.bottomPanelTitle) {
    elements.bottomPanelTitle.textContent = `${shot.name || '片段'} 属性`;
  }

  elements.propertyForm.innerHTML = `
    <div class="form-group">
      <label for="shotName">片段名称</label>
      <input type="text" id="shotName" value="${shot.name || ''}" placeholder="输入片段名称" data-autosave="true">
    </div>
    <div class="form-group">
      <label for="shotDuration">时长（秒）</label>
      <input type="number" id="shotDuration" value="${shot.duration || 10}" min="1" step="0.5" data-autosave="true">
    </div>
    <div class="form-group">
      <label for="shotStyle">风格</label>
      <input type="text" id="shotStyle" value="${shot.style || ''}" placeholder="如：简约清新、科技感" data-autosave="true">
    </div>
    <div class="form-group">
      <label for="shotMood">情绪</label>
      <input type="text" id="shotMood" value="${shot.mood || ''}" placeholder="如：舒缓、治愈、紧张" data-autosave="true">
    </div>
    <div class="form-group">
      <label for="shotDescription">描述</label>
      <textarea id="shotDescription" rows="3" placeholder="输入片段描述" data-autosave="true">${shot.description || ''}</textarea>
    </div>
    <div class="form-group">
      <label for="shotAspectRatio">画幅</label>
      <select id="shotAspectRatio" data-autosave="true">
        <option value="16:9" ${shot.aspectRatio === '16:9' ? 'selected' : ''}>16:9（横屏）</option>
        <option value="9:16" ${shot.aspectRatio === '9:16' ? 'selected' : ''}>9:16（竖屏）</option>
        <option value="1:1" ${shot.aspectRatio === '1:1' ? 'selected' : ''}>1:1（正方形）</option>
        <option value="4:3" ${shot.aspectRatio === '4:3' ? 'selected' : ''}>4:3（传统）</option>
        <option value="3:4" ${shot.aspectRatio === '3:4' ? 'selected' : ''}>3:4（竖版）</option>
      </select>
    </div>
    <div class="form-group">
      <label for="shotMusicStyle">音乐风格</label>
      <input type="text" id="shotMusicStyle" value="${shot.musicStyle || ''}" placeholder="如：轻快、悲伤、悬疑" data-autosave="true">
    </div>
    <div class="form-group">
      <label for="shotSoundEffect">音效</label>
      <input type="text" id="shotSoundEffect" value="${shot.soundEffect || ''}" placeholder="如：风声、雨声、爆炸声" data-autosave="true">
    </div>
    <div class="form-group">
      <label for="shotNotes">备注</label>
      <textarea id="shotNotes" rows="2" placeholder="输入备注信息" data-autosave="true">${shot.notes || ''}</textarea>
    </div>
  `;

  // 为所有输入框添加失焦自动保存
  document.querySelectorAll('#property-form [data-autosave="true"]').forEach(input => {
    input.addEventListener('blur', () => autoSaveShotProperties(shot));
  });
}

// 自动保存片段属性
let shotSaveTimeout = null;
function autoSaveShotProperties(shot) {
  if (shotSaveTimeout) clearTimeout(shotSaveTimeout);
  shotSaveTimeout = setTimeout(async () => {
    await saveShotProperties(shot, true);
  }, 500);
}

async function saveShotProperties(shot, isAutoSave = false) {
  const name = document.getElementById('shotName')?.value;
  const duration = parseInt(document.getElementById('shotDuration')?.value) || 10;
  const style = document.getElementById('shotStyle')?.value;
  const mood = document.getElementById('shotMood')?.value;
  const description = document.getElementById('shotDescription')?.value;
  const aspectRatio = document.getElementById('shotAspectRatio')?.value;
  const musicStyle = document.getElementById('shotMusicStyle')?.value;
  const soundEffect = document.getElementById('shotSoundEffect')?.value;
  const notes = document.getElementById('shotNotes')?.value;

  if (useElectronAPI && appState.currentProject.projectDir) {
    try {
      const loadResult = await window.electronAPI.loadProject(appState.currentProject.projectDir);
      if (!loadResult.success) return;

      const shotIndex = loadResult.projectJson.shots?.findIndex(s => s.id === shot.id);
      if (shotIndex !== -1) {
        loadResult.projectJson.shots[shotIndex] = {
          ...loadResult.projectJson.shots[shotIndex],
          name,
          duration,
          style,
          mood,
          description,
          aspectRatio,
          musicStyle,
          soundEffect,
          notes,
          updatedAt: new Date().toISOString()
        };

        const saveResult = await window.electronAPI.saveProject(
          appState.currentProject.projectDir,
          loadResult.projectJson
        );

        if (saveResult.success) {
          appState.currentShot = {
            ...shot,
            name,
            duration,
            style,
            mood,
            description,
            aspectRatio,
            musicStyle,
            soundEffect,
            notes
          };
          // 更新标题
          if (elements.bottomPanelTitle) {
            elements.bottomPanelTitle.textContent = `${name || '片段'} 属性`;
          }
          updatePromptPreview();
          if (!isAutoSave) {
            showUpdateNotification();
          }
        }
      }
    } catch (error) {
      console.error('保存片段属性异常:', error);
    }
  }
}

function showSceneProperties(scene) {
  if (!elements.propertyForm) return;

  // 更新底部面板标题
  if (elements.bottomPanelTitle) {
    elements.bottomPanelTitle.textContent = `${scene.name || '镜头'} 属性`;
  }

  elements.propertyForm.innerHTML = `
    <div class="form-group">
      <label for="sceneName">镜头名称</label>
      <input type="text" id="sceneName" value="${scene.name || ''}" placeholder="输入镜头名称" data-autosave="true">
    </div>
    <div class="form-group">
      <label for="sceneShotType">镜头类型</label>
      <select id="sceneShotType" data-autosave="true">
        <option value="" ${!scene.shotType ? 'selected' : ''}>请选择</option>
        <option value="特写" ${scene.shotType === '特写' ? 'selected' : ''}>特写</option>
        <option value="近景" ${scene.shotType === '近景' ? 'selected' : ''}>近景</option>
        <option value="中景" ${scene.shotType === '中景' ? 'selected' : ''}>中景</option>
        <option value="全景" ${scene.shotType === '全景' ? 'selected' : ''}>全景</option>
        <option value="远景" ${scene.shotType === '远景' ? 'selected' : ''}>远景</option>
        <option value="大远景" ${scene.shotType === '大远景' ? 'selected' : ''}>大远景</option>
        <option value="中近景" ${scene.shotType === '中近景' ? 'selected' : ''}>中近景</option>
        <option value="中远景" ${scene.shotType === '中远景' ? 'selected' : ''}>中远景</option>
      </select>
    </div>
    <div class="form-group">
      <label for="sceneAngle">拍摄角度</label>
      <select id="sceneAngle" data-autosave="true">
        <option value="" ${!scene.angle ? 'selected' : ''}>请选择</option>
        <option value="平视" ${scene.angle === '平视' ? 'selected' : ''}>平视</option>
        <option value="俯视" ${scene.angle === '俯视' ? 'selected' : ''}>俯视</option>
        <option value="仰视" ${scene.angle === '仰视' ? 'selected' : ''}>仰视</option>
        <option value="低角度" ${scene.angle === '低角度' ? 'selected' : ''}>低角度</option>
        <option value="高角度" ${scene.angle === '高角度' ? 'selected' : ''}>高角度</option>
        <option value="鸟瞰" ${scene.angle === '鸟瞰' ? 'selected' : ''}>鸟瞰</option>
        <option value="虫视" ${scene.angle === '虫视' ? 'selected' : ''}>虫视</option>
        <option value="过肩" ${scene.angle === '过肩' ? 'selected' : ''}>过肩</option>
      </select>
    </div>
    <div class="form-group">
      <label for="sceneCamera">运镜方式</label>
      <select id="sceneCamera" data-autosave="true">
        <option value="" ${!scene.camera ? 'selected' : ''}>请选择</option>
        <option value="固定" ${scene.camera === '固定' ? 'selected' : ''}>固定</option>
        <option value="推" ${scene.camera === '推' ? 'selected' : ''}>推（Dolly In）</option>
        <option value="拉" ${scene.camera === '拉' ? 'selected' : ''}>拉（Dolly Out）</option>
        <option value="摇" ${scene.camera === '摇' ? 'selected' : ''}>摇（Pan）</option>
        <option value="移" ${scene.camera === '移' ? 'selected' : ''}>移（Truck）</option>
        <option value="跟" ${scene.camera === '跟' ? 'selected' : ''}>跟（Follow）</option>
        <option value="升" ${scene.camera === '升' ? 'selected' : ''}>升（Pedestal Up）</option>
        <option value="降" ${scene.camera === '降' ? 'selected' : ''}>降（Pedestal Down）</option>
        <option value="变焦" ${scene.camera === '变焦' ? 'selected' : ''}>变焦（Zoom）</option>
        <option value="环绕" ${scene.camera === '环绕' ? 'selected' : ''}>环绕（Arc）</option>
        <option value="手持" ${scene.camera === '手持' ? 'selected' : ''}>手持</option>
      </select>
    </div>
    <div class="form-group">
      <label for="sceneDuration">时长（秒）</label>
      <input type="number" id="sceneDuration" value="${scene.duration || 2}" min="1" step="0.5" data-autosave="true">
    </div>
    <div class="form-group">
      <label for="sceneContent">内容</label>
      <textarea id="sceneContent" rows="3" placeholder="输入镜头内容描述" data-autosave="true">${scene.content || ''}</textarea>
    </div>
    <div class="form-group">
      <label for="sceneDialogue">台词/旁白</label>
      <textarea id="sceneDialogue" rows="2" placeholder="输入台词或旁白" data-autosave="true">${scene.dialogue || ''}</textarea>
    </div>
    <div class="form-group">
      <label for="sceneEmotion">情绪</label>
      <input type="text" id="sceneEmotion" value="${scene.emotion || ''}" placeholder="如：紧张、温馨、悲伤" data-autosave="true">
    </div>
    <div class="form-group">
      <label for="sceneNotes">备注</label>
      <textarea id="sceneNotes" rows="2" placeholder="输入备注信息" data-autosave="true">${scene.notes || ''}</textarea>
    </div>
  `;

  // 为所有输入框添加失焦自动保存
  document.querySelectorAll('#property-form [data-autosave="true"]').forEach(input => {
    input.addEventListener('blur', () => autoSaveSceneProperties(scene));
  });
}

// 自动保存镜头属性
let sceneSaveTimeout = null;
function autoSaveSceneProperties(scene) {
  if (sceneSaveTimeout) clearTimeout(sceneSaveTimeout);
  sceneSaveTimeout = setTimeout(async () => {
    await saveSceneProperties(scene, true);
  }, 500);
}

async function saveSceneProperties(scene, isAutoSave = false) {
  const name = document.getElementById('sceneName')?.value;
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

      const shot = loadResult.projectJson.shots?.find(s => s.id === appState.currentShot?.id);
      if (shot && shot.scenes) {
        const sceneIndex = shot.scenes.findIndex(s => s.id === scene.id);
        if (sceneIndex !== -1) {
          shot.scenes[sceneIndex] = {
            ...shot.scenes[sceneIndex],
            name,
            shotType,
            angle,
            camera,
            duration,
            content,
            dialogue,
            emotion,
            notes,
            updatedAt: new Date().toISOString()
          };

          const saveResult = await window.electronAPI.saveProject(
            appState.currentProject.projectDir,
            loadResult.projectJson
          );

          if (saveResult.success) {
            appState.currentScene = {
              ...scene,
              name,
              shotType,
              angle,
              camera,
              duration,
              content,
              dialogue,
              emotion,
              notes
            };
            // 更新标题
            if (elements.bottomPanelTitle) {
              elements.bottomPanelTitle.textContent = `${name || '镜头'} 属性`;
            }
            updatePromptPreview();
            if (!isAutoSave) {
              showUpdateNotification();
            }
          }
        }
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

// 显示项目菜单
function showProjectMenu() {
  const menu = document.getElementById('project-context-menu');
  if (menu) {
    menu.remove();
    return;
  }

  const contextMenu = document.createElement('div');
  contextMenu.id = 'project-context-menu';
  contextMenu.className = 'context-menu';
  contextMenu.innerHTML = `
    <div class="context-menu-item" id="project-menu-new">+ 新建项目</div>
    <div class="context-menu-item" id="project-menu-modify">修改当前项目</div>
    <div class="context-menu-item" id="project-menu-delete">删除当前项目</div>
    <div class="context-menu-item" id="project-menu-open-folder">打开资源文件管理器</div>
  `;

  // 菜单位置：在项目菜单按钮下方
  const projectMenuBtn = document.getElementById('project-menu-btn');
  if (projectMenuBtn) {
    const rect = projectMenuBtn.getBoundingClientRect();
    contextMenu.style.position = 'fixed';
    contextMenu.style.top = `${rect.bottom + 5}px`;
    contextMenu.style.left = `${rect.left}px`;
    contextMenu.style.zIndex = '1001';
    contextMenu.style.minWidth = '180px';
  }

  // 菜单项点击事件
  contextMenu.addEventListener('click', (e) => {
    const target = e.target;
    if (target.id === 'project-menu-new') {
      showNewProjectModal();
    } else if (target.id === 'project-menu-modify') {
      if (appState.currentProject) {
        alert('修改项目功能待实现');
      } else {
        alert('请先选择一个项目');
      }
    } else if (target.id === 'project-menu-delete') {
      if (appState.currentProject) {
        deleteCurrentProject();
      } else {
        alert('请先选择一个项目');
      }
    } else if (target.id === 'project-menu-open-folder') {
      openProjectFolder();
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

// 更新项目状态
async function updateProjectStatus(project, newStatus) {
  if (useElectronAPI && project.projectDir) {
    try {
      const loadResult = await window.electronAPI.loadProject(project.projectDir);
      if (!loadResult.success) {
        alert('加载项目失败：' + loadResult.error);
        return;
      }

      // 更新项目状态
      loadResult.projectJson.project.status = newStatus;
      loadResult.projectJson.project.updatedAt = new Date().toISOString();

      const saveResult = await window.electronAPI.saveProject(project.projectDir, loadResult.projectJson);
      if (saveResult.success) {
        // 更新本地状态
        project.status = newStatus;
        // 重新渲染项目列表
        await loadProjects();
        showUpdateNotification();
      } else {
        alert('保存失败：' + saveResult.error);
      }
    } catch (error) {
      console.error('更新项目状态异常:', error);
      alert('更新状态失败：' + error.message);
    }
  }
}

// 更新片段状态
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
      console.error('片段未找到，shot.id:', shot.id, 'shot.name:', shot.name);
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

// 删除当前项目
async function deleteCurrentProject() {
  if (!appState.currentProject) {
    alert('请先选择一个项目');
    return;
  }

  if (!confirm(`确定要删除项目 "${appState.currentProject.name}" 吗？此操作不可恢复！`)) {
    return;
  }

  if (useElectronAPI && appState.currentProject.projectDir) {
    try {
      const result = await window.electronAPI.deleteProject(appState.currentProject.projectDir);
      if (result.success) {
        appState.currentProject = null;
        appState.currentShot = null;
        appState.currentScene = null;
        appState.projectData = null;
        await loadProjects();
        renderShotList([]);
        renderSceneList([]);
        if (elements.promptPreview) {
          elements.promptPreview.innerHTML = '<div class="placeholder-text">请选中项目 > 片段 > 镜头，自动生成提示词</div>';
        }
        if (elements.propertyForm) {
          elements.propertyForm.innerHTML = '<div class="placeholder-text">请选择项目、片段或镜头以编辑属性</div>';
        }
        showUpdateNotification();
      } else {
        alert('删除失败：' + result.error);
      }
    } catch (error) {
      console.error('删除项目异常:', error);
      alert('删除失败：' + error.message);
    }
  }
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

function toggleSceneView() {
  alert('视图切换功能待实现');
}

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
