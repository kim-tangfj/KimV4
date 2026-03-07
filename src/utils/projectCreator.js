//
// Kim 多级分镜提示词助手 - 项目创建模块
//

// @ts-nocheck - 纯 JavaScript 项目，禁用 TypeScript 类型检查

/**
 * AI 创建项目（使用预览的数据）
 * 
 * 流程：
 * 1. 获取表单数据（名称、描述、画幅比例）
 * 2. 检查预览数据是否存在
 * 3. 解析预览数据为 JSON
 * 4. 调用 Electron API 创建项目
 * 
 * @async
 * @returns {Promise<void>}
 * 
 * @example
 * // 在 AI 模式按钮点击时调用
 * elements.generatePromptBtn.addEventListener('click', createProjectAI);
 */
async function createProjectAI() {
  const name = window.elements.aiProjectName?.value.trim();
  const description = window.elements.aiProjectDesc?.value.trim();
  const ratio = window.elements.aiProjectRatio?.value || '16:9';

  // 检查是否有预览数据
  const previewData = window.elements.aiResponsePreview?.value.trim();

  if (!name) {
    if (window.showInputError) {
      window.showInputError(window.elements.aiProjectName, '请输入项目名称');
    }
    return;
  }

  if (!previewData) {
    window.showToast('请先生成提示词并获取 AI 返回数据');
    return;
  }

  // 解析预览数据
  let jsonData;
  try {
    jsonData = JSON.parse(previewData);
  } catch (e) {
    window.showToast('预览数据格式错误：' + e.message);
    return;
  }

  if (window.hideNewProjectModal) {
    window.hideNewProjectModal();
  }

  if (window.useElectronAPI) {
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
        baseDir: window.settings.storagePath || ''
      });
      if (result.success) {
        if (window.loadProjects) {
          await window.loadProjects();
        }
        if (window.showUpdateNotification) {
          window.showUpdateNotification();
        }
      } else {
        window.showToast('创建项目失败：' + result.error);
      }
    } catch (error) {
      console.error('创建项目异常:', error);
      window.showToast('创建项目失败：' + error.message);
    }
  }
}

/**
 * 手动创建项目
 * 
 * 支持两种模式：
 * 1. JSON 模式：直接输入结构化 JSON 数据
 * 2. 剧本模式：输入剧本文本，调用 AI 生成结构化数据
 * 
 * @async
 * @returns {Promise<void>}
 * 
 * @example
 * // 在手动模式确认按钮点击时调用
 * elements.createProjectBtn.addEventListener('click', confirmCreateProject);
 */
async function createProjectManual() {
  const name = window.elements.manualProjectName?.value.trim();
  const description = window.elements.manualProjectDesc?.value.trim();
  const ratio = window.elements.manualProjectRatio?.value || '16:9';
  const script = window.elements.manualProjectScript?.value.trim();
  const jsonStr = window.elements.manualProjectJson?.value.trim();

  if (!name) {
    if (window.showInputError) {
      window.showInputError(window.elements.manualProjectName, '请输入项目名称');
    }
    return;
  }

  if (!script && !jsonStr) {
    if (window.showInputError) {
      window.showInputError(window.elements.manualProjectScript, '请输入项目剧本或结构化 JSON 数据（二选一）');
    }
    return;
  }

  // 如果有 JSON 数据，直接使用
  if (jsonStr) {
    let jsonData;
    try {
      jsonData = JSON.parse(jsonStr);
    } catch (e) {
      if (window.showInputError) {
        window.showInputError(window.elements.manualProjectJson, 'JSON 格式错误：' + e.message);
      }
      return;
    }

    if (window.hideNewProjectModal) {
      window.hideNewProjectModal();
    }

    if (window.useElectronAPI) {
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
          baseDir: window.settings.storagePath || ''
        });
        if (result.success) {
          if (window.loadProjects) {
            await window.loadProjects();
          }
          if (window.showUpdateNotification) {
            window.showUpdateNotification();
          }
        } else {
          window.showToast('创建项目失败：' + result.error);
        }
      } catch (error) {
        console.error('创建项目异常:', error);
        window.showToast('创建项目失败：' + error.message);
      }
    }
    return;
  }

  // 如果有剧本数据，使用 AI 生成
  if (script) {
    if (window.hideNewProjectModal) {
      window.hideNewProjectModal();
    }
    if (window.showLoading) {
      window.showLoading('正在生成结构化数据...');
    }

    try {
      const provider = window.settings.apiProvider || 'deepseek';
      const apiKey = window.settings.apiKeys[provider];
      const model = window.settings.models[provider];

      if (!apiKey) {
        if (window.hideLoading) {
          window.hideLoading();
        }
        window.showToast('请先在设置中配置 API Key');
        if (window.showSettingsModal) {
          window.showSettingsModal();
        }
        return;
      }

      // 使用激活的模板而不是硬编码的提示词
      const activeTemplate = window.settings.templates.find(t => t.id === window.settings.activeTemplateId);
      const template = activeTemplate || (window.getDefaultTemplate ? window.getDefaultTemplate() : null);

      // 替换 {剧本内容} 占位符
      const prompt = template.content.replace('{剧本内容}', script);

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
            if (window.loadProjects) {
              await window.loadProjects();
            }
            if (window.showUpdateNotification) {
              window.showUpdateNotification();
            }
          } else {
            window.showToast('创建项目失败：' + createResult.error);
          }
        } catch (e) {
          window.showToast('AI 返回的数据格式错误：' + e.message);
        }
      } else {
        window.showToast('AI 调用失败：' + result.error);
      }
    } catch (error) {
      console.error('AI 调用异常:', error);
      window.showToast('AI 调用失败：' + error.message);
    } finally {
      if (window.hideLoading) {
        window.hideLoading();
      }
    }
    return;
  }
}

/**
 * 显示新建项目弹窗
 * 
 * 功能：
 * - 显示模态框
 * - 重置为手动模式
 * - 清空表单数据
 * 
 * @example
 * // 在新建项目按钮点击时调用
 * elements.newProjectBtn.addEventListener('click', showNewProjectModal);
 */
function showNewProjectModal() {
  if (!window.elements.newProjectModal) return;

  // 关键修复：确保 loading-overlay 已隐藏（z-index=3000 会覆盖模态框）
  if (window.elements.loadingOverlay) {
    window.elements.loadingOverlay.style.display = 'none';
  }

  // 清空输入
  if (window.elements.manualProjectName) window.elements.manualProjectName.value = '';
  if (window.elements.manualProjectDesc) window.elements.manualProjectDesc.value = '';
  if (window.elements.manualProjectRatio) window.elements.manualProjectRatio.value = '16:9';
  if (window.elements.manualProjectJson) window.elements.manualProjectJson.value = '';
  if (window.elements.aiProjectName) window.elements.aiProjectName.value = '';
  if (window.elements.aiProjectDesc) window.elements.aiProjectDesc.value = '';
  if (window.elements.aiProjectRatio) window.elements.aiProjectRatio.value = '16:9';
  if (window.elements.aiProjectScript) window.elements.aiProjectScript.value = '';
  if (window.elements.aiProvider) window.elements.aiProvider.value = window.settings.apiProvider || 'deepseek';
  if (window.elements.aiApiStatus) window.elements.aiApiStatus.textContent = '';
  if (window.elements.aiResponsePreview) window.elements.aiResponsePreview.value = '';

  // 切换到手动模式 - 直接操作样式，避免触发事件
  if (window.elements.manualMode) window.elements.manualMode.classList.add('active');
  if (window.elements.aiMode) window.elements.aiMode.classList.remove('active');

  // 更新 tab 样式
  if (window.elements.modeTabs) {
    window.elements.modeTabs.forEach(tab => {
      if (tab.dataset.mode === 'manual') {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  // 显示模态框
  window.elements.newProjectModal.style.display = 'flex';

  // 关键修复：强制重绘模态框内容，解决点击无反应问题
  const modalContent = window.elements.newProjectModal.querySelector('.modal-content');
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
  if (window.elements.manualProjectName) {
    window.elements.manualProjectName.focus();
    // 设置可交互样式
    window.elements.manualProjectName.style.pointerEvents = 'auto';
    window.elements.manualProjectName.style.cursor = 'text';
  }
}

/**
 * 隐藏新建项目弹窗
 * 
 * @example
 * // 在取消按钮点击时调用
 * elements.cancelNewProjectBtn.addEventListener('click', hideNewProjectModal);
 */
function hideNewProjectModal() {
  if (window.elements.newProjectModal) {
    window.elements.newProjectModal.style.display = 'none';
  }
}

/**
 * 确认创建项目
 * 
 * 根据当前激活的模式调用相应的创建函数：
 * - AI 模式：createProjectAI()
 * - 手动模式：createProjectManual()
 * 
 * @async
 * @example
 * // 在创建按钮点击时调用
 * elements.createProjectBtn.addEventListener('click', confirmCreateProject);
 */
async function confirmCreateProject() {
  const activeMode = document.querySelector('.mode-tab.active')?.dataset.mode;

  if (activeMode === 'manual') {
    await createProjectManual();
  } else {
    await createProjectAI();
  }
}

// 导出到全局
(window).createProjectAI = createProjectAI;
(window).createProjectManual = createProjectManual;
(window).showNewProjectModal = showNewProjectModal;
(window).hideNewProjectModal = hideNewProjectModal;
(window).confirmCreateProject = confirmCreateProject;
