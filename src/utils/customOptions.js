//
// Kim 多级分镜提示词助手 - 自定义选项管理模块
// 负责自定义选项的加载、保存、编辑、删除等功能
//

/**
 * 显示自定义选项管理弹窗
 */
async function showCustomOptionsModal() {
  const elements = window.elements;
  if (!elements.customOptionsModal) return;

  // 加载组别筛选器
  await loadGroupFilter();

  // 加载自定义选项列表
  await loadCustomOptionsList();

  elements.customOptionsModal.style.display = 'flex';
}

/**
 * 隐藏自定义选项管理弹窗
 */
function hideCustomOptionsModal() {
  const elements = window.elements;
  if (elements.customOptionsModal) {
    elements.customOptionsModal.style.display = 'none';
  }
}

/**
 * 加载组别筛选器
 */
async function loadGroupFilter() {
  const useElectronAPI = window.useElectronAPI;
  const elements = window.elements;
  
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

/**
 * 加载自定义选项列表（两栏显示）
 * @param {string} filterGroup - 筛选组别，'all' 表示显示全部
 */
async function loadCustomOptionsList(filterGroup = 'all') {
  const useElectronAPI = window.useElectronAPI;
  const elements = window.elements;
  
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

/**
 * 渲染内置选项列表
 * @param {Array} options - 内置选项数组
 */
function renderBuiltinOptionsList(options) {
  const elements = window.elements;
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

/**
 * 渲染自定义选项列表
 * @param {Array} options - 自定义选项数组
 */
function renderCustomOptionsList(options) {
  const elements = window.elements;
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

/**
 * 显示添加自定义选项表单（弹窗）
 */
async function showAddCustomOptionForm() {
  const elements = window.elements;
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

/**
 * 显示编辑自定义选项表单（弹窗）
 * @param {Object} option - 选项对象
 */
async function showEditCustomOptionForm(option) {
  const elements = window.elements;
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

/**
 * 加载组别下拉框（编辑表单用）
 */
async function loadGroupFilterForEditForm() {
  const useElectronAPI = window.useElectronAPI;
  const elements = window.elements;

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
          if (elements.editCustomOptionGroup) elements.editCustomOptionGroup.style.display = 'none';
          if (elements.editCustomOptionGroupInput) {
            elements.editCustomOptionGroupInput.style.display = 'block';
            elements.editCustomOptionGroupInput.value = '';
            elements.editCustomOptionGroupInput.focus();
          }
        }
      };
    }
  } catch (error) {
    console.error('加载组别失败:', error);
  }
}

/**
 * 隐藏自定义选项编辑弹窗
 */
function hideCustomOptionEditModal() {
  const elements = window.elements;
  if (elements.customOptionEditModal) {
    elements.customOptionEditModal.style.display = 'none';
  }
}

/**
 * 保存自定义选项编辑（弹窗版）
 */
async function saveCustomOptionEdit() {
  const useElectronAPI = window.useElectronAPI;
  const elements = window.elements;

  if (!useElectronAPI) {
    window.showToast('请在 Electron 环境中使用此功能');
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
    window.showToast('请填写所有必填字段');
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
      window.showUpdateNotification();
    } else {
      window.showToast('保存失败：' + result.error);
    }
  } catch (error) {
    console.error('保存选项失败:', error);
    window.showToast('保存失败：' + error.message);
  }
}

/**
 * 保存自定义选项
 */
async function saveCustomOption() {
  const useElectronAPI = window.useElectronAPI;
  const elements = window.elements;

  if (!useElectronAPI) {
    window.showToast('请在 Electron 环境中使用此功能');
    return;
  }

  const optionId = elements.customOptionId?.value;
  const group = elements.customOptionGroup?.value;
  const type = elements.customOptionType?.value;
  const style = elements.customOptionStyle?.value;
  const description = elements.customOptionDescription?.value;

  if (!group || !type || !style || !description) {
    window.showToast('请填写所有必填字段');
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
      window.showUpdateNotification();
    } else {
      window.showToast('保存失败：' + result.error);
    }
  } catch (error) {
    console.error('保存选项失败:', error);
    window.showToast('保存失败：' + error.message);
  }
}

/**
 * 删除自定义选项
 * @param {string} optionId - 选项 ID
 */
async function deleteCustomOption(optionId) {
  const useElectronAPI = window.useElectronAPI;
  const elements = window.elements;
  const appState = window.appState;

  if (!useElectronAPI) {
    window.showToast('请在 Electron 环境中使用此功能');
    return;
  }

  try {
    // 先检查使用情况
    const usageResult = await window.electronAPI.checkOptionUsage(optionId);
    if (!usageResult.success) {
      window.showToast('检查失败：' + usageResult.error);
      return;
    }

    if (usageResult.usageCount > 0) {
      // 选项正在被使用，不允许删除
      window.showToast(
        `该选项已被使用 ${usageResult.usageCount} 次，无法删除。\n\n` +
        `请先到片段或镜头中修改使用该选项的内容，然后再尝试删除。`
      );
      return;
    }

    // 未被使用，简单确认
    const confirmed = await window.showConfirm('确定要删除该自定义选项吗？');
    if (!confirmed) {
      return;
    }

    const result = await window.electronAPI.deleteCustomOption(optionId);
    if (result.success) {
      await loadCustomOptionsList();
      await loadGroupFilter();

      // 刷新当前片段属性表单的选项
      if (appState.currentShot && window.showShotProperties) {
        await window.showShotProperties(appState.currentShot);
      }

      window.showUpdateNotification();
    } else {
      window.showToast('删除失败：' + result.error);
    }
  } catch (error) {
    console.error('删除选项失败:', error);
    window.showToast('删除失败：' + error.message);
  }
}

/**
 * 隐藏自定义选项表单
 */
function hideCustomOptionForm() {
  const elements = window.elements;
  if (elements.customOptionsEditor) {
    elements.customOptionsEditor.style.display = 'none';
  }
  if (elements.addCustomOptionColumnBtn) {
    elements.addCustomOptionColumnBtn.style.display = 'block';
  }
  if (elements.refreshCustomColumnBtn) {
    elements.refreshCustomColumnBtn.style.display = 'block';
  }
  if (elements.builtinOptionsList) {
    elements.builtinOptionsList.style.display = 'block';
  }
  if (elements.customOptionsList) {
    elements.customOptionsList.style.display = 'block';
  }
}

// 导出所有函数到 window 对象
window.showCustomOptionsModal = showCustomOptionsModal;
window.hideCustomOptionsModal = hideCustomOptionsModal;
window.loadGroupFilter = loadGroupFilter;
window.loadCustomOptionsList = loadCustomOptionsList;
window.renderBuiltinOptionsList = renderBuiltinOptionsList;
window.renderCustomOptionsList = renderCustomOptionsList;
window.showAddCustomOptionForm = showAddCustomOptionForm;
window.showEditCustomOptionForm = showEditCustomOptionForm;
window.loadGroupFilterForEditForm = loadGroupFilterForEditForm;
window.hideCustomOptionEditModal = hideCustomOptionEditModal;
window.saveCustomOptionEdit = saveCustomOptionEdit;
window.saveCustomOption = saveCustomOption;
window.deleteCustomOption = deleteCustomOption;
window.hideCustomOptionForm = hideCustomOptionForm;
window.initCustomOptionEditModal = initCustomOptionEditModal;

/**
 * 初始化自定义选项编辑弹窗事件
 */
function initCustomOptionEditModal() {
  const elements = {
    closeBtn: document.getElementById('close-custom-option-edit-btn'),
    saveBtn: document.getElementById('save-custom-option-edit-btn'),
    cancelBtn: document.getElementById('cancel-custom-option-edit-btn'),
    modal: document.getElementById('custom-option-edit-modal')
  };

  // 关闭按钮
  if (elements.closeBtn) {
    elements.closeBtn.addEventListener('click', () => {
      if (elements.modal) elements.modal.style.display = 'none';
    });
  }

  // 取消按钮
  if (elements.cancelBtn) {
    elements.cancelBtn.addEventListener('click', () => {
      if (elements.modal) elements.modal.style.display = 'none';
    });
  }

  // 保存按钮
  if (elements.saveBtn) {
    elements.saveBtn.addEventListener('click', async () => {
      const groupId = document.getElementById('edit-custom-option-group')?.value;
      const groupInput = document.getElementById('edit-custom-option-group-input');
      const type = document.getElementById('edit-custom-option-type')?.value;
      const style = document.getElementById('edit-custom-option-style')?.value;
      const description = document.getElementById('edit-custom-option-description')?.value;
      const optionId = document.getElementById('edit-custom-option-id')?.value;

      // 验证必填字段
      if (!groupId && !groupInput?.value) {
        window.showToast('请选择或输入组别');
        return;
      }
      if (!type) {
        window.showToast('请输入类型');
        return;
      }
      if (!style) {
        window.showToast('请输入风格名称');
        return;
      }
      if (!description) {
        window.showToast('请输入描述');
        return;
      }

      const finalGroup = groupInput?.style.display !== 'none' && groupInput?.value ? groupInput.value : groupId;

      // 保存选项
      const result = await window.electronAPI.updateCustomOption(optionId, {
        group: finalGroup,
        type: type,
        style: style,
        description: description
      });

      if (result.success) {
        window.showToast('保存成功');
        if (elements.modal) elements.modal.style.display = 'none';
        // 重新加载列表
        if (window.loadCustomOptionsList) {
          window.loadCustomOptionsList();
        }
      } else {
        window.showToast('保存失败：' + result.error);
      }
    });
  }

  // 点击遮罩关闭
  if (elements.modal) {
    elements.modal.addEventListener('click', (e) => {
      if (e.target === elements.modal) {
        elements.modal.style.display = 'none';
      }
    });
  }
}
