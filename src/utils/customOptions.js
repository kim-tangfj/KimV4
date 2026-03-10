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
  const appState = window.appState;

  console.log('[DEBUG] saveCustomOptionEdit 开始执行');
  console.log('[DEBUG] useElectronAPI:', useElectronAPI);
  console.log('[DEBUG] appState.currentProject:', appState.currentProject?.name || '无');
  console.log('[DEBUG] appState.currentShot:', appState.currentShot?.name || '无');

  if (!useElectronAPI) {
    console.error('[DEBUG] 错误：不在 Electron 环境中');
    window.showToast('请在 Electron 环境中使用此功能');
    return;
  }

  const optionId = elements.editCustomOptionId?.value;
  console.log('[DEBUG] optionId:', optionId);

  // 获取组别值（下拉框或输入框）
  let group = elements.editCustomOptionGroup?.value;
  const isUsingGroupInput = elements.editCustomOptionGroupInput &&
                             elements.editCustomOptionGroupInput.style.display !== 'none';

  if (isUsingGroupInput) {
    group = elements.editCustomOptionGroupInput.value.trim();
    console.log('[DEBUG] 使用输入框组别:', group);
  } else {
    console.log('[DEBUG] 使用下拉框组别:', group);
  }

  const type = elements.editCustomOptionType?.value;
  const style = elements.editCustomOptionStyle?.value;
  const description = elements.editCustomOptionDescription?.value;

  console.log('[DEBUG] 表单数据:', { group, type, style, description });

  // 分别验证每个字段，提供更明确的错误提示
  if (!group) {
    console.error('[DEBUG] 验证失败：组别为空');
    window.showToast('请选择或输入组别');
    return;
  }
  if (!type) {
    console.error('[DEBUG] 验证失败：类型为空');
    window.showToast('请输入类型');
    return;
  }
  if (!style) {
    console.error('[DEBUG] 验证失败：风格名称为空');
    window.showToast('请输入风格名称');
    return;
  }
  if (!description) {
    console.error('[DEBUG] 验证失败：描述为空');
    window.showToast('请输入描述');
    return;
  }

  // 如果是新建组别，验证输入不为空
  if (isUsingGroupInput && !elements.editCustomOptionGroupInput.value.trim()) {
    console.error('[DEBUG] 验证失败：新建组别输入为空');
    window.showToast('请输入新组别名称');
    elements.editCustomOptionGroupInput.focus();
    return;
  }

  try {
    // 在更新选项前，先保存当前片段的最新数据（从 DOM 读取）
    // 这样可以确保用户手动选择的选项被保存到项目数据中
    if (appState.currentShot && window.saveShotProperties) {
      const shotStyleEl = document.getElementById('shotStyle');
      if (shotStyleEl) {
        // 有片段属性表单在编辑，先立即保存（不等待 blur）
        await window.saveShotProperties(false, true); // 静默保存
        
        // 保存后，重新加载项目数据确保同步
        if (appState.currentProject?.projectDir) {
          const loadResult = await window.electronAPI.loadProject(appState.currentProject.projectDir);
          if (loadResult.success) {
            window.updateState('projectData', loadResult.projectJson);
          }
        }
      }
    }

    // 如果是更新操作，先获取旧选项名称（必须在更新前获取！）
    let oldStyle = null;
    if (optionId) {
      const allOptions = await window.electronAPI.getAllOptions();
      if (allOptions.success) {
        const oldOption = allOptions.options.find(opt => opt.id === optionId);
        if (oldOption) {
          oldStyle = oldOption.style;
        }
      }
    }

    const optionData = { group, type, style, description };

    let result;
    if (optionId) {
      result = await window.electronAPI.updateCustomOption(optionId, optionData);
    } else {
      result = await window.electronAPI.addCustomOption(optionData);
    }

    if (result.success) {
      // 如果选项名称已更改，同步更新当前项目中的数据
      const targetProject = appState.projectData || appState.currentProject;

      if (oldStyle && style !== oldStyle && targetProject && targetProject.shots) {
        await syncOptionUsageInProject(targetProject, group, oldStyle, style);
      }

      hideCustomOptionEditModal();
      await loadCustomOptionsList();
      await loadGroupFilter();

      // 刷新当前片段/镜头属性表单
      // 从 projectData 中获取最新的片段数据
      let currentShot = appState.currentShot;
      if (targetProject && currentShot) {
        const latestShot = targetProject.shots?.find(s => s.id === currentShot.id);
        if (latestShot) {
          currentShot = latestShot;
          // 更新 appState.currentShot 为最新数据
          window.updateState('currentShot', currentShot);
        }
      }

      if (currentShot && window.showShotProperties) {
        await window.showShotProperties(currentShot);
      } else if (appState.currentScene && window.showSceneProperties) {
        await window.showSceneProperties(appState.currentScene);
      }

      // 更新提示词预览（使用最新的 appState.currentShot）
      if (window.updatePromptPreview) {
        window.updatePromptPreview();
      }

      window.showUpdateNotification();
    } else {
      window.showToast('保存失败：' + result.error);
    }
  } catch (error) {
    console.error('[DEBUG] saveCustomOptionEdit 异常:', error);
    window.showToast('保存失败：' + error.message);
  }
}

/**
 * 同步更新项目中所有使用该选项的地方
 * @param {Object} project - 项目对象
 * @param {string} group - 选项组别
 * @param {string} oldStyle - 旧的风格名称
 * @param {string} newStyle - 新的风格名称
 */
async function syncOptionUsageInProject(project, group, oldStyle, newStyle) {
  // 使用 appState 中的项目数据
  const appState = window.appState;
  
  // 合并项目数据：使用传入的 project（有 shots）和 currentProject（有 name 和 projectDir）
  let targetProject = project;
  
  // 如果传入的 project 没有 name 或 projectDir，从 currentProject 补充
  if (appState.currentProject) {
    targetProject = {
      ...project,
      name: project.name || appState.currentProject.name,
      projectDir: project.projectDir || appState.currentProject.projectDir,
      project: project.project || appState.currentProject.project
    };
  }

  if (!targetProject || !targetProject.shots) {
    console.warn('[同步选项] 项目或片段数据为空，跳过同步');
    return;
  }

  let modified = false;
  let updateCount = 0;

  // 遍历所有片段和镜头
  for (const shot of targetProject.shots) {
    // 根据组别更新对应的字段
    if (group === '风格' && shot.style === oldStyle) {
      shot.style = newStyle;
      modified = true;
      updateCount++;
    } else if (group === '情绪氛围' && shot.mood === oldStyle) {
      shot.mood = newStyle;
      modified = true;
      updateCount++;
    } else if (group === '配乐风格' && shot.musicStyle === oldStyle) {
      shot.musicStyle = newStyle;
      modified = true;
      updateCount++;
    } else if (group === '音效' && shot.soundEffect === oldStyle) {
      shot.soundEffect = newStyle;
      modified = true;
      updateCount++;
    }

    // 更新镜头中的选项
    if (shot.scenes) {
      for (let i = 0; i < shot.scenes.length; i++) {
        const scene = shot.scenes[i];
        if (group === '风格' && scene.style === oldStyle) {
          scene.style = newStyle;
          modified = true;
          updateCount++;
        } else if (group === '情绪氛围' && scene.mood === oldStyle) {
          scene.mood = newStyle;
          modified = true;
          updateCount++;
        } else if (group === '镜头类型' && scene.shotType === oldStyle) {
          scene.shotType = newStyle;
          modified = true;
          updateCount++;
        } else if (group === '拍摄角度' && scene.angle === oldStyle) {
          scene.angle = newStyle;
          modified = true;
          updateCount++;
        } else if (group === '运镜方式' && scene.camera === oldStyle) {
          scene.camera = newStyle;
          modified = true;
          updateCount++;
        }
      }
    }
  }

  // 如果有修改，保存项目
  if (modified) {
    try {
      const projectData = {
        project: targetProject.project,
        shots: targetProject.shots
      };
      const saveResult = await window.electronAPI.saveProject(targetProject.projectDir, projectData);
      if (saveResult.success) {
        console.log(`[同步选项] 已更新项目中 "${oldStyle}" → "${newStyle}", 共 ${updateCount} 处`);
      } else {
        console.error('[同步选项] 保存项目失败:', saveResult.error);
        window.showToast('选项已更新，但同步项目数据失败');
      }
    } catch (error) {
      console.error('[同步选项] 保存项目异常:', error);
      window.showToast('选项已更新，但同步项目数据失败');
    }
  }
}

/**
 * 保存自定义选项
 */
async function saveCustomOption() {
  const useElectronAPI = window.useElectronAPI;
  const elements = window.elements;
  const appState = window.appState;

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
    // 如果是更新操作，先获取旧选项名称（必须在更新前获取！）
    let oldStyle = null;
    if (optionId) {
      const allOptions = await window.electronAPI.getAllOptions();
      if (allOptions.success) {
        const oldOption = allOptions.options.find(opt => opt.id === optionId);
        if (oldOption) {
          oldStyle = oldOption.style;
        }
      }
    }

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
      // 如果选项名称已更改，同步更新当前项目中的数据
      const appState = window.appState;
      // 使用 projectData（包含完整 shots）或 currentProject
      let targetProject = appState.projectData || appState.currentProject;

      if (oldStyle && style !== oldStyle && targetProject && targetProject.shots) {
        await syncOptionUsageInProject(targetProject, group, oldStyle, style);
      }

      hideCustomOptionForm();
      await loadCustomOptionsList();

      // 刷新当前片段/镜头属性表单
      // 从 projectData 中获取最新的片段数据
      let currentShot = appState.currentShot;
      if (targetProject && currentShot) {
        const latestShot = targetProject.shots?.find(s => s.id === currentShot.id);
        if (latestShot) {
          currentShot = latestShot;
          // 更新 appState.currentShot 为最新数据
          window.updateState('currentShot', currentShot);
        }
      }

      if (currentShot && window.showShotProperties) {
        await window.showShotProperties(currentShot);
      } else if (appState.currentScene && window.showSceneProperties) {
        await window.showSceneProperties(appState.currentScene);
      }

      // 更新提示词预览（使用最新的 appState.currentShot）
      if (window.updatePromptPreview) {
        window.updatePromptPreview();
      }

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
    let usageResult;
    try {
      usageResult = await window.electronAPI.checkOptionUsage(optionId);
    } catch (checkError) {
      console.error('检查选项使用情况失败:', checkError);
      window.showToast('检查失败，请稍后重试');
      return;
    }

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

    // 执行删除
    let result;
    try {
      result = await window.electronAPI.deleteCustomOption(optionId);
    } catch (deleteError) {
      console.error('删除选项失败:', deleteError);
      window.showToast('删除失败：' + deleteError.message);
      return;
    }

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
    console.error('删除操作异常:', error);
    window.showToast('删除失败，请稍后重试');
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

  // 保存按钮 - 直接调用统一的保存函数
  if (elements.saveBtn) {
    elements.saveBtn.addEventListener('click', async () => {
      await window.saveCustomOptionEdit();
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
