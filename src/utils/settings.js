//
// Kim 多级分镜提示词助手 - 设置管理模块
// 负责设置加载、保存、主题切换、API 测试等功能
//

/**
 * 从 localStorage 和文件系统加载设置
 * 填充设置表单字段
 */
async function loadSettings() {
  // 初始化 window.settings（如果未定义）
  if (!window.settings) {
    window.settings = {
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
  }

  const settings = window.settings;
  const elements = window.elements || {};
  // 直接检查 window.electronAPI 而不是 window.useElectronAPI
  const useElectronAPI = !!(window.electronAPI);

  // 初始化 window.currentTheme（如果未定义）
  if (!window.currentTheme) {
    window.currentTheme = 'light';
  }
  let currentTheme = window.currentTheme;

  // 从 localStorage 加载基本设置（主题、API 配置等）
  const savedSettings = localStorage.getItem('kim_settings');
  let hasValidStoragePath = false;
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings);
      // 只加载非模板相关的设置
      // 注意：空字符串视为"未设置"，需要后续使用系统默认路径
      if (parsed.storagePath) {
        settings.storagePath = parsed.storagePath;
        hasValidStoragePath = true;
      }
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

  // 如果是 Electron 环境且没有设置存储路径，使用系统文档目录作为默认值
  if (useElectronAPI && !hasValidStoragePath) {
    try {
      // 通过 IPC 获取系统文档目录
      const result = await window.electronAPI.getDefaultStoragePath();
      if (result.success && result.path) {
        settings.storagePath = result.path;
      } else {
        settings.storagePath = '文档/KimStoryboard';
      }
    } catch (e) {
      console.error('获取默认存储路径失败:', e);
      settings.storagePath = '文档/KimStoryboard';
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
  if (elements.ailianApiKey) {
    elements.ailianApiKey.value = settings.apiKeys.ailian || '';
  }
  if (elements.deepseekModel) {
    elements.deepseekModel.value = settings.models.deepseek || 'deepseek-chat';
  }
  if (elements.doubaoModel) {
    elements.doubaoModel.value = settings.models.doubao || 'doubao-pro-4k';
  }
  if (elements.qianwenModel) {
    elements.qianwenModel.value = settings.models.qianwen || 'qwen3.5-plus';
  }
  if (elements.ailianModel) {
    elements.ailianModel.value = settings.models.ailian || 'qwen3.5-plus';
  }

  // 更新全局 currentTheme
  window.currentTheme = currentTheme;
}

/**
 * 保存当前设置到 localStorage
 */
function saveSettings() {
  const settings = window.settings;
  const elements = window.elements;
  const currentTheme = window.currentTheme;

  // 从表单获取值，如果为空则使用当前设置中的值（避免保存空值）
  const newStoragePath = elements.storagePathInput?.value?.trim();
  settings.storagePath = newStoragePath || settings.storagePath;
  settings.apiProvider = elements.apiProviderSelect?.value || 'deepseek';
  settings.apiKeys.deepseek = elements.deepseekApiKey?.value || '';
  settings.apiKeys.doubao = elements.doubaoApiKey?.value || '';
  settings.apiKeys.qianwen = elements.qianwenApiKey?.value || '';
  settings.apiKeys.ailian = elements.ailianApiKey?.value || '';
  settings.models.deepseek = elements.deepseekModel?.value || 'deepseek-chat';
  settings.models.doubao = elements.doubaoModel?.value || 'doubao-pro-4k';
  settings.models.qianwen = elements.qianwenModel?.value || 'qwen3.5-plus';
  settings.models.ailian = elements.ailianModel?.value || 'qwen3.5-plus';
  settings.theme = currentTheme;
  settings.autoSaveInterval = parseInt(elements.autoSaveInterval?.value) || 5;

  localStorage.setItem('kim_settings', JSON.stringify(settings));
  showUpdateNotification();
}

/**
 * 保存设置到本地存储（包括模板配置）
 */
function saveSettingsToStorage() {
  const settings = window.settings;
  const useElectronAPI = window.useElectronAPI;
  const currentTheme = window.currentTheme;

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

/**
 * 应用主题到页面
 * @param {string} theme - 主题名称 ('light' | 'dark')
 */
function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
  window.currentTheme = theme;
}

/**
 * 切换当前主题（浅色/深色）
 */
function toggleTheme() {
  const currentTheme = window.currentTheme || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  applyTheme(newTheme);

  const elements = window.elements;
  if (elements.themeToggleBtns) {
    elements.themeToggleBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === newTheme);
    });
  }

  localStorage.setItem('kim_settings', JSON.stringify({ ...window.settings, theme: newTheme }));
}

/**
 * 切换 API Key 输入框可见性
 * @param {HTMLInputElement} input - API Key 输入框
 */
function toggleApiKeyVisibility(input) {
  if (input.type === 'password') {
    input.type = 'text';
  } else {
    input.type = 'password';
  }
}

/**
 * 测试指定提供商的 API 连接
 * @param {string} provider - 提供商名称 (deepseek | doubao | qianwen | ailian)
 */
async function testApiConnection(provider) {
  const useElectronAPI = window.useElectronAPI;
  const elements = window.elements;

  if (!useElectronAPI) {
    window.showToast('请在 Electron 环境中使用此功能');
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
    model = elements.qianwenModel?.value.trim() || 'qwen3.5-plus';
  } else if (provider === 'ailian') {
    apiKey = elements.ailianApiKey?.value.trim() || '';
    model = elements.ailianModel?.value.trim() || 'qwen3.5-plus';
  }

  if (!apiKey) {
    window.showToast('请先输入 API Key');
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

/**
 * 检查 AI 模式 API 状态
 * @returns {boolean} API 是否已配置
 */
function checkApiStatus() {
  const settings = window.settings;
  const elements = window.elements;

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

/**
 * 显示设置面板弹窗
 */
async function showSettingsModal() {
  const elements = window.elements;
  const currentTheme = window.currentTheme;

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
  if (elements.ailianConfig) elements.ailianConfig.style.display = provider === 'ailian' ? 'block' : 'none';

  // 显示模板存储路径（异步）
  await showTemplateStoragePath();

  elements.settingsModal.style.display = 'flex';
}

/**
 * 隐藏设置面板弹窗
 */
function hideSettingsModal() {
  const elements = window.elements;
  if (elements.settingsModal) {
    elements.settingsModal.style.display = 'none';
  }
}

/**
 * 显示加载覆盖层
 * @param {string} text - 加载提示文本
 */
function showLoading(text) {
  const elements = window.elements;
  if (elements.loadingOverlay) {
    elements.loadingText.textContent = text || '正在处理...';
    elements.loadingOverlay.style.display = 'flex';
  }
}

/**
 * 隐藏加载覆盖层
 */
function hideLoading() {
  const elements = window.elements;
  if (elements.loadingOverlay) {
    elements.loadingOverlay.style.display = 'none';
  }
}

/**
 * 获取默认模板配置
 * @returns {Object} 默认模板对象
 */
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

/**
 * 显示模板存储路径（辅助函数）
 */
async function showTemplateStoragePath() {
  const elements = window.elements;
  const useElectronAPI = window.useElectronAPI;

  if (!useElectronAPI) {
    return;
  }

  try {
    const result = await window.electronAPI.getTemplatesPath();
    if (result.success && elements.templateStoragePath) {
      // 显示文件夹路径
      elements.templateStoragePath.value = result.path;
    } else {
      // 如果获取失败，显示设置中的存储路径
      elements.templateStoragePath.value = '模板配置文件存储在：' + window.settings.storagePath;
    }
  } catch (error) {
    console.error('获取模板路径失败:', error);
    elements.templateStoragePath.value = '模板配置文件存储在：' + window.settings.storagePath;
  }
}

// 导出所有函数到 window 对象
window.loadSettings = loadSettings;
window.saveSettings = saveSettings;
window.saveSettingsToStorage = saveSettingsToStorage;
window.applyTheme = applyTheme;
window.toggleTheme = toggleTheme;
window.toggleApiKeyVisibility = toggleApiKeyVisibility;
window.testApiConnection = testApiConnection;
window.checkApiStatus = checkApiStatus;
window.showSettingsModal = showSettingsModal;
window.hideSettingsModal = hideSettingsModal;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.getDefaultTemplate = getDefaultTemplate;
window.showTemplateStoragePath = showTemplateStoragePath;

// 初始化更新检查按钮
function initUpdateButton() {
  const checkUpdateBtn = document.getElementById('check-update-btn');
  if (checkUpdateBtn) {
    checkUpdateBtn.addEventListener('click', () => {
      // 显示模态框
      const updateModal = document.createElement('div');
      updateModal.id = 'update-modal-manual';
      updateModal.className = 'update-modal active';
      updateModal.innerHTML = `
        <div class="update-modal-content">
          <div class="update-modal-header">
            <h3>🔄 检查更新</h3>
          </div>
          <div class="update-modal-body">
            <div class="update-status">正在检查更新...</div>
            <div class="update-progress-container">
              <div class="update-progress-bar">
                <div class="update-progress-fill" style="width: 0%"></div>
              </div>
              <div class="update-progress-text">0%</div>
            </div>
            <div class="update-info">请稍候</div>
          </div>
        </div>
      `;
      document.body.appendChild(updateModal);
      document.body.classList.add('update-lock');

      // 开始检查更新
      window.electronAPI.checkForUpdates();

      // 监听更新检查结果
      const hideModal = () => {
        updateModal.classList.remove('active');
        document.body.classList.remove('update-lock');
        setTimeout(() => updateModal.remove(), 300);
      };

      // 监听更新事件
      const onNotAvailable = () => {
        const statusEl = updateModal.querySelector('.update-status');
        const infoEl = updateModal.querySelector('.update-info');
        if (statusEl) statusEl.textContent = '已是最新版本';
        if (infoEl) infoEl.textContent = '无需更新';
        setTimeout(hideModal, 1500);
      };

      const onError = (error) => {
        const statusEl = updateModal.querySelector('.update-status');
        const infoEl = updateModal.querySelector('.update-info');
        if (statusEl) statusEl.textContent = '检查失败';
        if (infoEl) infoEl.textContent = error?.message || '未知错误';
        setTimeout(hideModal, 2000);
      };

      // 临时监听（仅用于手动检查）
      window.electronAPI.onUpdateNotAvailable(onNotAvailable);
      window.electronAPI.onUpdateError(onError);

      // 10 秒后如果没有结果，自动隐藏
      setTimeout(() => {
        if (updateModal.parentNode) {
          hideModal();
        }
      }, 10000);
    });
  }
}

// 在 DOM 加载完成后初始化按钮
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUpdateButton);
} else {
  initUpdateButton();
}
