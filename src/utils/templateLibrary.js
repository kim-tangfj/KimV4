//
// Kim 多级分镜提示词助手 - 模板库管理模块
//

// @ts-nocheck - 纯 JavaScript 项目，禁用 TypeScript 类型检查

/**
 * 显示模板库面板
 * 使用全局变量：window.elements, window.settings
 */
function showTemplateLibraryModal() {
  if (!window.elements.templateLibraryModal) return;
  renderTemplateList();
  window.elements.templateLibraryModal.style.display = 'flex';
}

/**
 * 隐藏模板库面板
 * 使用全局变量：window.elements
 */
function hideTemplateLibraryModal() {
  if (window.elements.templateLibraryModal) {
    window.elements.templateLibraryModal.style.display = 'none';
    hideTemplateEditor();
  }
}

/**
 * 渲染模板列表
 * 使用全局变量：window.elements, window.settings
 */
function renderTemplateList() {
  if (!window.elements.templateList) return;

  window.elements.templateList.innerHTML = '';

  if (window.settings.templates.length === 0) {
    window.elements.templateList.innerHTML = '<div class="placeholder-text">暂无模板，点击"+ 添加模板"创建</div>';
    return;
  }

  window.settings.templates.forEach(template => {
    const item = document.createElement('div');
    item.className = 'template-item';
    if (template.id === window.settings.activeTemplateId) {
      item.classList.add('active');
    }

    item.innerHTML = `
      <div class="template-item-info">
        <div class="template-item-name">${template.name}</div>
        <div class="template-item-desc">${template.description || ''}</div>
      </div>
      <div class="template-item-actions">
        <button class="form-btn small-btn template-activate-btn" data-id="${template.id}">
          ${template.id === window.settings.activeTemplateId ? '✓ 已激活' : '激活'}
        </button>
        <button class="form-btn small-btn template-edit-btn" data-id="${template.id}">编辑</button>
        <button class="form-btn small-btn template-delete-btn" data-id="${template.id}">删除</button>
      </div>
    `;

    window.elements.templateList.appendChild(item);
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

/**
 * 激活模板
 * 使用全局变量：window.settings
 */
function activateTemplate(templateId) {
  window.settings.activeTemplateId = templateId;
  if (window.saveSettingsToStorage) {
    window.saveSettingsToStorage();
  }
  renderTemplateList();
  if (window.showUpdateNotification) {
    window.showUpdateNotification();
  }
}

/**
 * 添加新模板
 * 使用全局变量：window.elements
 */
function addNewTemplate() {
  showTemplateEditor();
  // 清空编辑器
  if (window.elements.templateName) window.elements.templateName.value = '';
  if (window.elements.templateDescription) window.elements.templateDescription.value = '';
  if (window.elements.templateContent) window.elements.templateContent.value = '';
  if (window.elements.saveTemplateBtn) {
    window.elements.saveTemplateBtn.dataset.mode = 'add';
  }
}

/**
 * 编辑模板
 * 使用全局变量：window.elements, window.settings
 */
function editTemplate(templateId) {
  const template = window.settings.templates.find(t => t.id === templateId);
  if (!template) return;

  showTemplateEditor();
  if (window.elements.templateName) window.elements.templateName.value = template.name;
  if (window.elements.templateDescription) window.elements.templateDescription.value = template.description || '';
  if (window.elements.templateContent) window.elements.templateContent.value = template.content;
  if (window.elements.saveTemplateBtn) {
    window.elements.saveTemplateBtn.dataset.mode = 'edit';
    window.elements.saveTemplateBtn.dataset.id = templateId;
  }
}

/**
 * 删除模板
 * 使用全局变量：window.settings
 */
async function deleteTemplate(templateId) {
  const template = window.settings.templates.find(t => t.id === templateId);
  if (!template) return;

  const confirmed = await window.showConfirm(`确定要删除模板 "${template.name}" 吗？`);
  if (!confirmed) return;

  window.settings.templates = window.settings.templates.filter(t => t.id !== templateId);

  // 如果删除的是激活的模板，激活第一个模板
  if (window.settings.activeTemplateId === templateId) {
    window.settings.activeTemplateId = window.settings.templates.length > 0 ? window.settings.templates[0].id : null;
  }

  if (window.saveSettingsToStorage) {
    window.saveSettingsToStorage();
  }
  renderTemplateList();
}

/**
 * 保存模板
 * 使用全局变量：window.elements, window.settings
 */
function saveTemplate() {
  const name = window.elements.templateName?.value.trim();
  const description = window.elements.templateDescription?.value.trim();
  const content = window.elements.templateContent?.value.trim();
  const mode = window.elements.saveTemplateBtn?.dataset.mode;

  if (!name) {
    window.showToast('请输入模板名称');
    window.elements.templateName?.focus();
    return;
  }

  if (!content) {
    window.showToast('请输入模板内容');
    window.elements.templateContent?.focus();
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
    window.settings.templates.push(newTemplate);
    window.settings.activeTemplateId = newTemplate.id;
  } else if (mode === 'edit') {
    // 编辑现有模板
    const templateId = window.elements.saveTemplateBtn.dataset.id;
    const template = window.settings.templates.find(t => t.id === templateId);
    if (template) {
      template.name = name;
      template.description = description;
      template.content = content;
    }
  }

  if (window.saveSettingsToStorage) {
    window.saveSettingsToStorage();
  }
  hideTemplateEditor();
  renderTemplateList();
  if (window.showUpdateNotification) {
    window.showUpdateNotification();
  }
}

/**
 * 取消编辑
 */
function cancelTemplateEdit() {
  hideTemplateEditor();
}

/**
 * 显示模板编辑器
 * 使用全局变量：window.elements
 */
function showTemplateEditor() {
  if (window.elements.templateEditor) {
    window.elements.templateEditor.style.display = 'block';
  }
  if (window.elements.saveTemplateBtn) {
    window.elements.saveTemplateBtn.style.display = 'inline-block';
  }
  if (window.elements.cancelTemplateBtn) {
    window.elements.cancelTemplateBtn.style.display = 'inline-block';
  }
}

/**
 * 隐藏模板编辑器
 * 使用全局变量：window.elements
 */
function hideTemplateEditor() {
  if (window.elements.templateEditor) {
    window.elements.templateEditor.style.display = 'none';
  }
  if (window.elements.saveTemplateBtn) {
    window.elements.saveTemplateBtn.style.display = 'none';
  }
  if (window.elements.cancelTemplateBtn) {
    window.elements.cancelTemplateBtn.style.display = 'none';
  }
}

/**
 * 备份模板
 * 使用全局变量：window.useElectronAPI, window.electronAPI
 */
async function backupTemplates() {
  if (!window.useElectronAPI) {
    window.showToast('请在 Electron 环境中使用此功能');
    return;
  }

  const result = await window.electronAPI.backupTemplates();
  if (result.success) {
    window.showToast('模板备份成功！文件已保存到：' + result.filePath);
  } else if (!result.canceled) {
    window.showToast('备份失败：' + result.error);
  }
}

/**
 * 恢复模板
 * 使用全局变量：window.useElectronAPI, window.electronAPI
 */
async function restoreTemplates() {
  if (!window.useElectronAPI) {
    window.showToast('请在 Electron 环境中使用此功能');
    return;
  }

  const confirmed = await window.showConfirm('恢复模板将覆盖当前的模板配置，确定继续吗？');
  if (!confirmed) {
    return;
  }

  const result = await window.electronAPI.restoreTemplates();
  if (result.success) {
    window.showToast('模板恢复成功！请重启应用以加载恢复的模板。');
  } else if (!result.canceled) {
    window.showToast('恢复失败：' + result.error);
  }
}

/**
 * 打开模板文件夹
 * 使用全局变量：window.useElectronAPI, window.electronAPI
 */
async function openTemplateFolder() {
  if (!window.useElectronAPI) {
    window.showToast('请在 Electron 环境中使用此功能');
    return;
  }

  try {
    const result = await window.electronAPI.getTemplatesPath();
    if (result.success) {
      await window.electronAPI.openPath(result.path);
    }
  } catch (error) {
    window.showToast('打开文件夹失败：' + error.message);
  }
}

// 复制模板函数（与模板库相关的辅助函数）
/**
 * 复制模板内容到剪贴板
 * 使用全局变量：window.elements, window.settings
 */
function copyTemplate() {
  const scriptContent = window.elements.manualProjectScript?.value.trim() || window.elements.aiProjectScript?.value.trim() || '';

  if (!scriptContent) {
    window.showToast('请先输入项目剧本内容');
    if (window.elements.manualProjectScript) window.elements.manualProjectScript.focus();
    return;
  }

  // 获取激活的模板
  const activeTemplate = window.settings.templates.find(t => t.id === window.settings.activeTemplateId);
  const template = activeTemplate || (window.getDefaultTemplate ? window.getDefaultTemplate() : null);

  if (!template) {
    window.showToast('未找到可用模板');
    return;
  }

  // 替换 {剧本内容} 占位符
  const finalTemplate = template.content.replace('{剧本内容}', scriptContent);

  navigator.clipboard.writeText(finalTemplate).then(() => {
    const btn = window.elements.copyTemplateBtn;
    const originalText = btn.textContent;
    btn.textContent = '✓ 已复制';
    setTimeout(() => {
      btn.textContent = originalText;
    }, 2000);
  }).catch(err => {
    console.error('复制失败:', err);
    window.showToast('复制失败，请手动复制');
  });
}

// 导出到全局
(window).showTemplateLibraryModal = showTemplateLibraryModal;
(window).hideTemplateLibraryModal = hideTemplateLibraryModal;
(window).renderTemplateList = renderTemplateList;
(window).activateTemplate = activateTemplate;
(window).addNewTemplate = addNewTemplate;
(window).editTemplate = editTemplate;
(window).deleteTemplate = deleteTemplate;
(window).saveTemplate = saveTemplate;
(window).showTemplateEditor = showTemplateEditor;
(window).hideTemplateEditor = hideTemplateEditor;
(window).cancelTemplateEdit = cancelTemplateEdit;
(window).backupTemplates = backupTemplates;
(window).restoreTemplates = restoreTemplates;
(window).openTemplateFolder = openTemplateFolder;
(window).copyTemplate = copyTemplate;
