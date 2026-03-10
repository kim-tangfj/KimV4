//
// Kim 多级分镜提示词助手 - 事件监听器模块
//

// @ts-nocheck - 纯 JavaScript 项目，禁用 TypeScript 类型检查

/**
 * 设置所有事件监听器
 * 使用全局变量：window.elements, window.appState, window.settings, window.useElectronAPI
 */
function setupEventListeners() {
  // 初始化片段素材库面板
  if (window.initSceneAssetsPanel) {
    window.initSceneAssetsPanel();
  }

  // 初始化素材预览模态框
  if (window.initAssetPreviewModal) {
    window.initAssetPreviewModal();
  }

  // 初始化自定义选项编辑弹窗
  if (window.initCustomOptionEditModal) {
    window.initCustomOptionEditModal();
  }

  // 初始化面板拖拽
  if (window.initPanelResizers) {
    window.initPanelResizers();
  }

  // 主界面按钮
  if (window.elements.newProjectBtn) {
    window.elements.newProjectBtn.addEventListener('click', showNewProjectModal);
  }
  if (window.elements.refreshProjectsBtn) {
    window.elements.refreshProjectsBtn.addEventListener('click', window.loadProjects);
  }
  if (window.elements.newShotBtn) {
    window.elements.newShotBtn.addEventListener('click', createNewShot);
  }
  if (window.elements.deleteShotBtn) {
    window.elements.deleteShotBtn.addEventListener('click', deleteSelectedShot);
  }
  if (window.elements.newSceneBtn) {
    window.elements.newSceneBtn.addEventListener('click', createNewScene);
  }
  if (window.elements.deleteSceneBtn) {
    window.elements.deleteSceneBtn.addEventListener('click', deleteSelectedScene);
  }
  if (window.elements.copyPromptBtn) {
    window.elements.copyPromptBtn.addEventListener('click', () => window.copyPromptToClipboard());
  }
  if (window.elements.exportPromptBtn) {
    window.elements.exportPromptBtn.addEventListener('click', () => window.exportPrompt());
  }
  if (window.elements.clearPromptBtn) {
    window.elements.clearPromptBtn.addEventListener('click', () => window.clearPrompt());
  }
  if (window.elements.panelToggleBtn) {
    window.elements.panelToggleBtn.addEventListener('click', toggleBottomPanel);
  }
  if (window.elements.panelToggleHeader) {
    window.elements.panelToggleHeader.addEventListener('click', toggleBottomPanelByHeader);
  }
  if (window.elements.assetsPanelToggleBtn) {
    window.elements.assetsPanelToggleBtn.addEventListener('click', toggleBottomPanel);
  }
  if (window.elements.assetsPanelToggleHeader) {
    window.elements.assetsPanelToggleHeader.addEventListener('click', toggleAssetsPanelByHeader);
  }
  if (window.elements.viewToggleBtn) {
    window.elements.viewToggleBtn.addEventListener('click', () => window.showToast('视图切换功能待实现'));
  }

  // 模态框按钮
  if (window.elements.closeSettingsBtn) {
    window.elements.closeSettingsBtn.addEventListener('click', async () => {
      // 关闭前自动保存设置（包括 API Key）
      await window.saveSettings();
      window.saveSettingsToStorage();
      window.hideSettingsModal();
    });
  }
  if (window.elements.closeNewProjectBtn) {
    window.elements.closeNewProjectBtn.addEventListener('click', hideNewProjectModal);
  }
  if (window.elements.saveSettingsBtn) {
    window.elements.saveSettingsBtn.addEventListener('click', async () => {
      await window.saveSettings();
      window.saveSettingsToStorage();
      window.hideSettingsModal();
      // 刷新项目列表（存储路径可能已更改）
      window.loadProjects();
      window.showToast('设置已保存');
    });
  }
  if (window.elements.cancelSettingsBtn) {
    window.elements.cancelSettingsBtn.addEventListener('click', window.hideSettingsModal);
  }
  if (window.elements.createProjectBtn) {
    window.elements.createProjectBtn.addEventListener('click', confirmCreateProject);
  }
  if (window.elements.cancelNewProjectBtn) {
    window.elements.cancelNewProjectBtn.addEventListener('click', hideNewProjectModal);
  }

  // 主题切换
  if (window.elements.themeToggleBtns) {
    window.elements.themeToggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        window.currentTheme = theme;
        window.applyTheme(theme);
        window.elements.themeToggleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  // 更改存储路径
  if (window.elements.changePathBtn) {
    window.elements.changePathBtn.addEventListener('click', async () => {
      if (window.useElectronAPI) {
        // 使用 showOpenDialog 并指定默认路径为当前存储路径
        const result = await window.electronAPI.showOpenDialog({
          title: '选择项目存储文件夹',
          properties: ['openDirectory'],
          defaultPath: window.settings?.storagePath || undefined
        });
        if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
          window.elements.storagePathInput.value = result.filePaths[0];
        }
      }
    });
  }

  // API 提供商切换
  if (window.elements.apiProviderSelect) {
    window.elements.apiProviderSelect.addEventListener('change', (e) => {
      const provider = e.target.value;
      if (window.elements.deepseekConfig) window.elements.deepseekConfig.style.display = provider === 'deepseek' ? 'block' : 'none';
      if (window.elements.doubaoConfig) window.elements.doubaoConfig.style.display = provider === 'doubao' ? 'block' : 'none';
      if (window.elements.qianwenConfig) window.elements.qianwenConfig.style.display = provider === 'qianwen' ? 'block' : 'none';
      if (window.elements.ailianConfig) window.elements.ailianConfig.style.display = provider === 'ailian' ? 'block' : 'none';
    });
  }

  // 测试连接按钮
  if (window.elements.testDeepseekBtn) {
    window.elements.testDeepseekBtn.addEventListener('click', () => window.testApiConnection('deepseek'));
  }
  if (window.elements.testDoubaoBtn) {
    window.elements.testDoubaoBtn.addEventListener('click', () => window.testApiConnection('doubao'));
  }
  if (window.elements.testQianwenBtn) {
    window.elements.testQianwenBtn.addEventListener('click', () => window.testApiConnection('qianwen'));
  }
  if (window.elements.testAilianBtn) {
    window.elements.testAilianBtn.addEventListener('click', () => window.testApiConnection('ailian'));
  }

  // 切换 API Key 可见性
  if (window.elements.toggleDeepseekKey) {
    window.elements.toggleDeepseekKey.addEventListener('click', () => window.toggleApiKeyVisibility(window.elements.deepseekApiKey));
  }
  if (window.elements.toggleDoubaoKey) {
    window.elements.toggleDoubaoKey.addEventListener('click', () => window.toggleApiKeyVisibility(window.elements.doubaoApiKey));
  }
  if (window.elements.toggleQianwenKey) {
    window.elements.toggleQianwenKey.addEventListener('click', () => window.toggleApiKeyVisibility(window.elements.qianwenApiKey));
  }
  if (window.elements.toggleAilianKey) {
    window.elements.toggleAilianKey.addEventListener('click', () => window.toggleApiKeyVisibility(window.elements.ailianApiKey));
  }

  // 模式切换
  if (window.elements.modeTabs) {
    window.elements.modeTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.stopPropagation();
        const mode = tab.dataset.mode;

        // 移除所有 tab 的 active 状态
        window.elements.modeTabs.forEach(t => t.classList.remove('active'));
        // 添加当前 tab 的 active 状态
        tab.classList.add('active');

        // 切换内容区域
        if (window.elements.manualMode) window.elements.manualMode.classList.remove('active');
        if (window.elements.aiMode) window.elements.aiMode.classList.remove('active');

        if (mode === 'manual') {
          if (window.elements.manualMode) window.elements.manualMode.classList.add('active');
        } else {
          if (window.elements.aiMode) window.elements.aiMode.classList.add('active');
          if (window.checkApiStatus) {
            window.checkApiStatus();
          }
        }
      });
    });
  }

  // 复制模板按钮
  if (window.elements.copyTemplateBtn) {
    window.elements.copyTemplateBtn.addEventListener('click', (e) => {
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
  if (window.elements.settingsModal) {
    window.elements.settingsModal.addEventListener('click', (e) => {
      if (e.target === window.elements.settingsModal) window.hideSettingsModal();
    });
  }
  if (window.elements.newProjectModal) {
    window.elements.newProjectModal.addEventListener('click', (e) => {
      if (e.target === window.elements.newProjectModal) hideNewProjectModal();
    });
  }
  if (window.elements.templateLibraryModal) {
    window.elements.templateLibraryModal.addEventListener('click', (e) => {
      if (e.target === window.elements.templateLibraryModal) hideTemplateLibraryModal();
    });
  }

  // 模板库事件监听
  if (window.elements.closeTemplateBtn) {
    window.elements.closeTemplateBtn.addEventListener('click', hideTemplateLibraryModal);
  }
  if (window.elements.closeTemplateLibBtn) {
    window.elements.closeTemplateLibBtn.addEventListener('click', hideTemplateLibraryModal);
  }
  if (window.elements.addTemplateBtn) {
    window.elements.addTemplateBtn.addEventListener('click', addNewTemplate);
  }
  if (window.elements.saveTemplateBtn) {
    window.elements.saveTemplateBtn.addEventListener('click', saveTemplate);
  }
  if (window.elements.cancelTemplateBtn) {
    window.elements.cancelTemplateBtn.addEventListener('click', cancelTemplateEdit);
  }

  // AI 生成提示词事件
  if (window.elements.generatePromptBtn) {
    window.elements.generatePromptBtn.addEventListener('click', () => window.generatePromptFromAI());
  }

  // 模板数据管理事件
  if (window.elements.backupTemplatesBtn) {
    window.elements.backupTemplatesBtn.addEventListener('click', backupTemplates);
  }
  if (window.elements.restoreTemplatesBtn) {
    window.elements.restoreTemplatesBtn.addEventListener('click', restoreTemplates);
  }
  if (window.elements.openTemplateFolderBtn) {
    window.elements.openTemplateFolderBtn.addEventListener('click', openTemplateFolder);
  }

  // 自定义选项管理事件
  if (window.elements.manageCustomOptionsBtn) {
    window.elements.manageCustomOptionsBtn.addEventListener('click', () => window.showCustomOptionsModal());
  }
  if (window.elements.closeCustomOptionsBtn) {
    window.elements.closeCustomOptionsBtn.addEventListener('click', () => window.hideCustomOptionsModal());
  }
  if (window.elements.closeCustomOptionsModalBtn) {
    window.elements.closeCustomOptionsModalBtn.addEventListener('click', () => window.hideCustomOptionsModal());
  }
  if (window.elements.addCustomOptionBtn) {
    window.elements.addCustomOptionBtn.addEventListener('click', () => window.showAddCustomOptionForm());
  }
  if (window.elements.refreshCustomOptionsBtn) {
    window.elements.refreshCustomOptionsBtn.addEventListener('click', () => window.loadCustomOptionsList('all'));
  }
  // 分栏按钮事件
  if (window.elements.refreshBuiltinBtn) {
    window.elements.refreshBuiltinBtn.addEventListener('click', () => window.loadCustomOptionsList('all'));
  }
  if (window.elements.addCustomOptionColumnBtn) {
    window.elements.addCustomOptionColumnBtn.addEventListener('click', () => window.showAddCustomOptionForm());
  }
  if (window.elements.refreshCustomColumnBtn) {
    window.elements.refreshCustomColumnBtn.addEventListener('click', () => window.loadCustomOptionsList('all'));
  }
  if (window.elements.saveCustomOptionBtn) {
    window.elements.saveCustomOptionBtn.addEventListener('click', () => window.saveCustomOption());
  }
  if (window.elements.cancelCustomOptionBtn) {
    window.elements.cancelCustomOptionBtn.addEventListener('click', () => window.hideCustomOptionForm());
  }
  if (window.elements.customOptionsGroupFilter) {
    window.elements.customOptionsGroupFilter.addEventListener('change', () => {
      window.loadCustomOptionsList(window.elements.customOptionsGroupFilter.value);
    });
  }

  // 片段素材库上传按钮事件绑定
  if (window.elements.assetsPanelUploadBtn) {
    window.elements.assetsPanelUploadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.showToast('上传素材功能待实现');
      // TODO: 实现素材上传功能
    });
  }
}

// 导出到全局
(window).setupEventListeners = setupEventListeners;
