//
// Kim 多级分镜提示词助手 - 片段管理模块
// 负责片段列表渲染、选择、新建、删除和状态管理
//

// 全局变量引用（由 renderer.js 注入）
// - window.getState(): 获取应用状态
// - window.updateState(): 更新应用状态
// - window.elements: DOM 元素引用
// - window.useElectronAPI: 是否使用 Electron API
// - window.electronAPI: Electron API 接口
// - window.renderSceneList: 渲染镜头列表函数
// - window.updatePromptPreview: 更新提示词预览函数
// - window.showShotProperties: 显示片段属性表单函数
// - window.showUpdateNotification: 显示更新提示函数
// - window.loadOptionsByGroup: 加载自定义选项函数
// - window.selectProject: 选择项目函数
// - window.showConfirm: 显示确认对话框函数
// - window.showToast: 显示提示函数
// - window.showCustomPrompt: 显示自定义输入框函数

/**
 * 渲染片段列表
 * @param {Array} shots - 片段数组
 */
function renderShotList(shots) {
  if (!window.elements.shotList) {
    return;
  }

  window.elements.shotList.innerHTML = '';

  if (!shots || shots.length === 0) {
    window.elements.shotList.innerHTML = '<div class="placeholder-text">暂无片段，点击 + 新建</div>';
    if (window.elements.deleteShotBtn) {
      window.elements.deleteShotBtn.disabled = true;
    }
    return;
  }

  shots.forEach((shot, index) => {
    // 确保片段对象有 id 属性（如果没有则生成并保存）
    if (!shot.id) {
      shot.id = Date.now() + index;
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

    window.elements.shotList.appendChild(shotElement);
  });

  if (window.elements.deleteShotBtn) {
    window.elements.deleteShotBtn.disabled = false;
  }
}

/**
 * 选择片段
 * @param {Object} shot - 片段对象
 */
async function selectShot(shot) {
  // 关键修复：切换片段时清除待处理的自动保存
  if (window.shotSaveTimeout) {
    clearTimeout(window.shotSaveTimeout);
    window.shotSaveTimeout = null;
    window.savingShotId = null;
  }

  const state = window.getState();
  if (window.useElectronAPI && state.currentProject?.projectDir) {
    // 从 project.json 中读取最新的片段数据
    try {
      const loadResult = await window.electronAPI.loadProject(state.currentProject.projectDir);
      if (loadResult.success) {
        const latestShot = loadResult.projectJson.shots?.find(s => s.id === shot.id);
        if (latestShot) {
          window.updateState('currentShot', latestShot);
        } else {
          window.updateState('currentShot', shot);
        }
      } else {
        window.updateState('currentShot', shot);
      }
    } catch (error) {
      window.updateState('currentShot', shot);
    }
  } else {
    window.updateState('currentShot', shot);
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

  // 启用镜头操作按钮
  if (window.elements.newSceneBtn) {
    window.elements.newSceneBtn.disabled = false;
  }
  if (window.elements.deleteSceneBtn) {
    window.elements.deleteSceneBtn.disabled = false;
  }

  // 渲染镜头列表
  window.renderSceneList(window.getState().currentShot.scenes || []);

  // 更新提示词预览
  window.updatePromptPreview();

  // 显示片段属性表单
  window.showShotProperties(window.getState().currentShot);
  
  // 加载片段素材库
  if (window.loadShotAssetsList) {
    window.loadShotAssetsList(shot.id);
  }
}

/**
 * 新建片段
 */
async function createNewShot() {
  const state = window.getState();
  if (!state.currentProject) {
    alert('请先选择一个项目');
    return;
  }

  // 使用自定义 prompt 替代系统 prompt
  const shotName = await showCustomPrompt('请输入片段名称:', '新建片段');
  if (!shotName) {
    return;
  }

  const newShot = {
    id: Date.now(),
    name: shotName,
    description: '',
    duration: 10,
    notes: '',
    status: 'draft',
    aspectRatio: state.currentProject.aspectRatio || '16:9',
    style: '默认风格',
    mood: '默认情绪',
    musicStyle: '',
    soundEffects: '',
    scenes: []
  };

  if (window.useElectronAPI && state.currentProject.projectDir) {
    try {
      // 加载项目
      const loadResult = await window.electronAPI.loadProject(state.currentProject.projectDir);
      if (!loadResult.success) {
        window.showErrorModal('加载项目失败：' + loadResult.error);
        return;
      }

      // 添加新片段
      loadResult.projectJson.shots = loadResult.projectJson.shots || [];
      loadResult.projectJson.shots.push(newShot);

      // 保存项目
      const saveResult = await window.electronAPI.saveProject(
        state.currentProject.projectDir,
        loadResult.projectJson
      );

      if (saveResult.success) {
        await window.selectProject(state.currentProject);
        window.showUpdateNotification();
      } else {
        window.showErrorModal('保存失败：' + saveResult.error);
      }
    } catch (error) {
      console.error('[createNewShot] 创建片段异常:', error);
      window.showErrorModal('创建片段失败：' + error.message);
    }
  } else {
    window.showToast('请在 Electron 环境中使用此功能');
  }
}

/**
 * 删除选中的片段
 */
async function deleteSelectedShot() {
  const state = window.getState();
  if (!state.currentShot) {
    window.showToast('请先选择一个片段');
    return;
  }

  const confirmed = await window.showConfirm(`确定要删除片段 "${state.currentShot.name}" 吗？`);
  if (!confirmed) {
    return;
  }

  if (window.useElectronAPI && state.currentProject.projectDir) {
    try {
      // 加载项目
      const loadResult = await window.electronAPI.loadProject(state.currentProject.projectDir);
      if (!loadResult.success) {
        return;
      }

      // 减少要删除片段使用的自定义选项计数
      await decrementShotOptionsUsage(state.currentShot);

      // 过滤掉要删除的片段
      loadResult.projectJson.shots = (loadResult.projectJson.shots || []).filter(
        s => s.id !== state.currentShot.id
      );

      // 保存项目
      const saveResult = await window.electronAPI.saveProject(
        state.currentProject.projectDir,
        loadResult.projectJson
      );

      if (saveResult.success) {
        window.updateState('currentShot', null);
        window.updateState('currentScene', null);
        await window.selectProject(state.currentProject);
        window.renderSceneList([]);
      } else {
        window.showErrorModal('保存失败：' + saveResult.error);
      }
    } catch (error) {
      console.error('[deleteSelectedShot] 删除片段异常:', error);
      window.showErrorModal('删除片段失败：' + error.message);
    }
  } else {
    window.showToast('请在 Electron 环境中使用此功能');
  }
}

/**
 * 减少片段使用的自定义选项计数
 * @param {Object} shot - 片段对象
 */
async function decrementShotOptionsUsage(shot) {
  if (!shot) return;

  const usageUpdates = [];
  const optionCounts = new Map();
  
  // 收集片段使用的选项及其使用次数
  if (shot.style) optionCounts.set(shot.style, (optionCounts.get(shot.style) || 0) + 1);
  if (shot.mood) optionCounts.set(shot.mood, (optionCounts.get(shot.mood) || 0) + 1);
  
  // 收集镜头使用的选项
  if (shot.scenes) {
    for (const scene of shot.scenes) {
      if (scene.shotType) optionCounts.set(scene.shotType, (optionCounts.get(scene.shotType) || 0) + 1);
      if (scene.angle) optionCounts.set(scene.angle, (optionCounts.get(scene.angle) || 0) + 1);
      if (scene.camera) optionCounts.set(scene.camera, (optionCounts.get(scene.camera) || 0) + 1);
      if (scene.emotion) optionCounts.set(scene.emotion, (optionCounts.get(scene.emotion) || 0) + 1);
    }
  }

  // 获取所有自定义选项，减少匹配的选项计数
  const customGroups = ['景别', '镜头角度', '运镜', '风格', '情绪氛围'];
  for (const group of customGroups) {
    const options = await window.loadOptionsByGroup(group);
    for (const opt of options) {
      if (!opt.builtin && optionCounts.has(opt.style)) {
        const count = optionCounts.get(opt.style);
        usageUpdates.push({ optionId: opt.id, delta: -count });
      }
    }
  }

  // 批量更新选项使用次数
  if (usageUpdates.length > 0) {
    await window.electronAPI.batchUpdateOptionUsage(usageUpdates);
  }
}

/**
 * 显示片段状态菜单
 * @param {Object} shot - 片段对象
 * @param {MouseEvent} event - 鼠标事件
 */
function showShotStatusMenu(shot, event) {
  // 如果菜单已存在，先移除
  const existingMenu = document.getElementById('shot-status-menu');
  if (existingMenu) {
    existingMenu.remove();
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

/**
 * 更新片段状态
 * @param {Object} shot - 片段对象
 * @param {string} newStatus - 新状态值
 */
async function updateShotStatus(shot, newStatus) {
  if (!window.useElectronAPI) {
    window.showToast('请在 Electron 环境中使用此功能');
    return;
  }

  const state = window.getState();
  if (!state.currentProject || !state.currentProject.projectDir) {
    window.showToast('项目目录不存在，请先选择项目');
    return;
  }

  // 检查 shot 对象是否有 id，没有则生成
  if (!shot.id) {
    shot.id = Date.now();
  }

  try {
    // 加载项目
    const loadResult = await window.electronAPI.loadProject(state.currentProject.projectDir);
    if (!loadResult.success) {
      window.showErrorModal('加载项目失败：' + loadResult.error);
      return;
    }

    // 找到片段并更新状态（使用 shot.id 查找）
    let shotIndex = loadResult.projectJson.shots?.findIndex(s => s.id === shot.id);

    // 如果没找到，尝试通过名称匹配（兼容旧数据）
    if (shotIndex === -1 && shot.name) {
      shotIndex = loadResult.projectJson.shots?.findIndex(s => s.name === shot.name);
    }

    if (shotIndex === -1) {
      window.showErrorModal('片段未找到，请检查数据一致性');
      return;
    }

    // 更新片段 ID（如果之前没有）和状态
    loadResult.projectJson.shots[shotIndex].id = shot.id;
    loadResult.projectJson.shots[shotIndex].status = newStatus;
    loadResult.projectJson.project.updatedAt = new Date().toISOString();

    // 保存项目
    const saveResult = await window.electronAPI.saveProject(
      state.currentProject.projectDir,
      loadResult.projectJson
    );

    if (saveResult.success) {
      // 更新本地状态
      shot.status = newStatus;
      // 重新渲染片段列表
      window.renderShotList(loadResult.projectJson.shots || []);
      window.showUpdateNotification();
    } else {
      window.showErrorModal('保存失败：' + saveResult.error);
    }
  } catch (error) {
    console.error('[updateShotStatus] 更新片段状态异常:', error);
    window.showErrorModal('更新状态失败：' + error.message);
  }
}

/**
 * 获取状态文本显示
 * @param {string} status - 状态值
 * @returns {string} 状态文本
 */
function getStatusText(status) {
  const statusMap = {
    draft: '草稿',
    processing: '进行中',
    completed: '已完成',
    cancelled: '已取消'
  };
  return statusMap[status] || status;
}

// 导出函数到全局
window.renderShotList = renderShotList;
window.selectShot = selectShot;
window.createNewShot = createNewShot;
window.deleteSelectedShot = deleteSelectedShot;
window.showShotStatusMenu = showShotStatusMenu;
window.updateShotStatus = updateShotStatus;
window.getStatusText = getStatusText;

