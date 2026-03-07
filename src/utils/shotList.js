//
// Kim 多级分镜提示词助手 - 片段管理模块
// 负责片段列表渲染、选择、新建、删除和状态管理
//

// 全局变量引用（由 renderer.js 注入）
// - window.appState: 应用状态
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

/**
 * 渲染片段列表
 * @param {Array} shots - 片段数组
 */
function renderShotList(shots) {
  if (!window.elements.shotList) {
    console.log('[renderShotList] shotList 元素不存在');
    return;
  }

  window.elements.shotList.innerHTML = '';

  if (!shots || shots.length === 0) {
    window.elements.shotList.innerHTML = '<div class="placeholder-text">暂无片段，点击 + 新建</div>';
    if (window.elements.deleteShotBtn) {
      window.elements.deleteShotBtn.disabled = true;
    }
    console.log('[renderShotList] 片段列表为空');
    return;
  }

  shots.forEach((shot, index) => {
    // 确保片段对象有 id 属性（如果没有则生成并保存）
    if (!shot.id) {
      shot.id = Date.now() + index;
      console.log('[renderShotList] 生成片段 ID:', shot.id, '名称:', shot.name);
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
        console.log('[renderShotList] 点击状态标签，不触发选择');
        return;
      }
      console.log('[renderShotList] 点击片段:', shot.name);
      selectShot(shot);
    });

    // 状态标签点击 - 传递原始 shot 对象
    const statusTag = shotElement.querySelector('.status-tag');
    if (statusTag) {
      statusTag.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('[renderShotList] 点击状态标签:', shot.name);
        showShotStatusMenu(shot, e);
      });
    }

    window.elements.shotList.appendChild(shotElement);
  });

  if (window.elements.deleteShotBtn) {
    window.elements.deleteShotBtn.disabled = false;
  }
  console.log('[renderShotList] 渲染完成，共', shots.length, '个片段');
}

/**
 * 选择片段
 * @param {Object} shot - 片段对象
 */
async function selectShot(shot) {
  console.log('[selectShot] 开始选择片段:', shot.name, 'ID:', shot.id);

  // 关键修复：切换片段时清除待处理的自动保存
  if (window.shotSaveTimeout) {
    clearTimeout(window.shotSaveTimeout);
    window.shotSaveTimeout = null;
    window.savingShotId = null;
    console.log('[selectShot] 清除待处理的自动保存');
  }

  if (window.useElectronAPI && window.appState.currentProject?.projectDir) {
    // 从 project.json 中读取最新的片段数据
    try {
      console.log('[selectShot] 从文件加载最新片段数据...');
      const loadResult = await window.electronAPI.loadProject(window.appState.currentProject.projectDir);
      if (loadResult.success) {
        const latestShot = loadResult.projectJson.shots?.find(s => s.id === shot.id);
        if (latestShot) {
          window.appState.currentShot = latestShot;
          console.log('[selectShot] 已加载最新片段数据:', latestShot.name);
        } else {
          console.log('[selectShot] 未找到最新片段，使用当前数据');
          window.appState.currentShot = shot;
        }
      } else {
        console.error('[selectShot] 加载项目失败:', loadResult.error);
        window.appState.currentShot = shot;
      }
    } catch (error) {
      console.error('[selectShot] 加载最新片段数据失败:', error);
      window.appState.currentShot = shot;
    }
  } else {
    console.log('[selectShot] 非 Electron 环境，直接使用当前数据');
    window.appState.currentShot = shot;
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
    console.log('[selectShot] 已设置选中状态');
  } else {
    console.log('[selectShot] 未找到对应的 DOM 元素');
  }

  // 启用镜头操作按钮
  if (window.elements.newSceneBtn) {
    window.elements.newSceneBtn.disabled = false;
  }
  if (window.elements.deleteSceneBtn) {
    window.elements.deleteSceneBtn.disabled = false;
  }

  // 渲染镜头列表
  console.log('[selectShot] 渲染镜头列表...');
  window.renderSceneList(window.appState.currentShot.scenes || []);

  // 更新提示词预览
  console.log('[selectShot] 更新提示词预览...');
  window.updatePromptPreview();

  // 显示片段属性表单
  console.log('[selectShot] 显示片段属性表单...');
  window.showShotProperties(window.appState.currentShot);

  console.log('[selectShot] 完成');
}

/**
 * 新建片段
 */
async function createNewShot() {
  console.log('[createNewShot] 开始创建新片段');

  if (!window.appState.currentProject) {
    console.error('[createNewShot] 未选择项目');
    alert('请先选择一个项目');
    return;
  }

  // 使用自定义 prompt 替代系统 prompt
  const shotName = await showCustomPrompt('请输入片段名称:', '新建片段');
  if (!shotName) {
    console.log('[createNewShot] 用户取消输入');
    return;
  }

  const newShot = {
    id: Date.now(),
    name: shotName,
    description: '',
    duration: 10,
    notes: '',
    status: 'draft',
    aspectRatio: window.appState.currentProject.aspectRatio || '16:9',
    style: '默认风格',
    mood: '默认情绪',
    musicStyle: '',
    soundEffects: '',
    scenes: []
  };

  console.log('[createNewShot] 新片段数据:', newShot);

  if (window.useElectronAPI && window.appState.currentProject.projectDir) {
    try {
      // 加载项目
      console.log('[createNewShot] 加载项目...');
      const loadResult = await window.electronAPI.loadProject(window.appState.currentProject.projectDir);
      if (!loadResult.success) {
        console.error('[createNewShot] 加载项目失败:', loadResult.error);
        alert('加载项目失败：' + loadResult.error);
        return;
      }

      // 添加新片段
      loadResult.projectJson.shots = loadResult.projectJson.shots || [];
      loadResult.projectJson.shots.push(newShot);
      console.log('[createNewShot] 已添加新片段到项目数据');

      // 保存项目
      console.log('[createNewShot] 保存项目...');
      const saveResult = await window.electronAPI.saveProject(
        window.appState.currentProject.projectDir,
        loadResult.projectJson
      );

      if (saveResult.success) {
        console.log('[createNewShot] 保存成功，重新选择项目...');
        await window.selectProject(window.appState.currentProject);
        window.showUpdateNotification();
        console.log('[createNewShot] 完成');
      } else {
        console.error('[createNewShot] 保存失败:', saveResult.error);
        alert('保存失败：' + saveResult.error);
      }
    } catch (error) {
      console.error('[createNewShot] 创建片段异常:', error);
      alert('创建片段失败：' + error.message);
    }
  } else {
    console.error('[createNewShot] 非 Electron 环境');
    alert('请在 Electron 环境中使用此功能');
  }
}

/**
 * 删除选中的片段
 */
async function deleteSelectedShot() {
  console.log('[deleteSelectedShot] 开始删除片段');

  if (!window.appState.currentShot) {
    console.error('[deleteSelectedShot] 未选择片段');
    alert('请先选择一个片段');
    return;
  }

  const confirmed = await window.showConfirm(`确定要删除片段 "${window.appState.currentShot.name}" 吗？`);
  if (!confirmed) {
    console.log('[deleteSelectedShot] 用户取消删除');
    return;
  }

  console.log('[deleteSelectedShot] 确认删除:', window.appState.currentShot.name);

  if (window.useElectronAPI && window.appState.currentProject.projectDir) {
    try {
      // 加载项目
      console.log('[deleteSelectedShot] 加载项目...');
      const loadResult = await window.electronAPI.loadProject(window.appState.currentProject.projectDir);
      if (!loadResult.success) {
        console.error('[deleteSelectedShot] 加载项目失败:', loadResult.error);
        return;
      }

      // 过滤掉要删除的片段
      const beforeCount = loadResult.projectJson.shots?.length || 0;
      loadResult.projectJson.shots = (loadResult.projectJson.shots || []).filter(
        s => s.id !== window.appState.currentShot.id
      );
      console.log('[deleteSelectedShot] 已过滤片段:', beforeCount, '->', loadResult.projectJson.shots.length);

      // 保存项目
      console.log('[deleteSelectedShot] 保存项目...');
      const saveResult = await window.electronAPI.saveProject(
        window.appState.currentProject.projectDir,
        loadResult.projectJson
      );

      if (saveResult.success) {
        console.log('[deleteSelectedShot] 保存成功，清理状态...');
        window.appState.currentShot = null;
        window.appState.currentScene = null;
        await window.selectProject(window.appState.currentProject);
        window.renderSceneList([]);
        console.log('[deleteSelectedShot] 完成');
      } else {
        console.error('[deleteSelectedShot] 保存失败:', saveResult.error);
        alert('保存失败：' + saveResult.error);
      }
    } catch (error) {
      console.error('[deleteSelectedShot] 删除片段异常:', error);
      alert('删除片段失败：' + error.message);
    }
  } else {
    console.error('[deleteSelectedShot] 非 Electron 环境');
    alert('请在 Electron 环境中使用此功能');
  }
}

/**
 * 显示片段状态菜单
 * @param {Object} shot - 片段对象
 * @param {MouseEvent} event - 鼠标事件
 */
function showShotStatusMenu(shot, event) {
  console.log('[showShotStatusMenu] 显示状态菜单，当前状态:', shot.status);

  // 如果菜单已存在，先移除
  const existingMenu = document.getElementById('shot-status-menu');
  if (existingMenu) {
    existingMenu.remove();
    console.log('[showShotStatusMenu] 移除已存在的菜单');
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
      console.log('[showShotStatusMenu] 选择状态:', status);
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
        console.log('[showShotStatusMenu] 菜单已关闭');
      }
    });
  }, 100);

  document.body.appendChild(contextMenu);
  console.log('[showShotStatusMenu] 菜单已显示');
}

/**
 * 更新片段状态
 * @param {Object} shot - 片段对象
 * @param {string} newStatus - 新状态值
 */
async function updateShotStatus(shot, newStatus) {
  console.log('[updateShotStatus] 更新状态:', shot.name, '->', newStatus);

  if (!window.useElectronAPI) {
    console.error('[updateShotStatus] 非 Electron 环境');
    alert('请在 Electron 环境中使用此功能');
    return;
  }

  if (!window.appState.currentProject || !window.appState.currentProject.projectDir) {
    console.error('[updateShotStatus] 项目目录不存在');
    alert('项目目录不存在，请先选择项目');
    return;
  }

  // 检查 shot 对象是否有 id，没有则生成
  if (!shot.id) {
    shot.id = Date.now();
    console.log('[updateShotStatus] 生成片段 ID:', shot.id);
  }

  try {
    // 加载项目
    console.log('[updateShotStatus] 加载项目...');
    const loadResult = await window.electronAPI.loadProject(window.appState.currentProject.projectDir);
    if (!loadResult.success) {
      console.error('[updateShotStatus] 加载项目失败:', loadResult.error);
      alert('加载项目失败：' + loadResult.error);
      return;
    }

    // 找到片段并更新状态（使用 shot.id 查找）
    let shotIndex = loadResult.projectJson.shots?.findIndex(s => s.id === shot.id);

    // 如果没找到，尝试通过名称匹配（兼容旧数据）
    if (shotIndex === -1 && shot.name) {
      shotIndex = loadResult.projectJson.shots?.findIndex(s => s.name === shot.name);
      console.log('[updateShotStatus] 通过名称匹配片段:', shot.name, '索引:', shotIndex);
    }

    if (shotIndex === -1) {
      console.error('[updateShotStatus] 片段未找到:', {
        shotId: shot.id,
        shotName: shot.name,
        availableShots: loadResult.projectJson.shots?.map(s => ({ id: s.id, name: s.name }))
      });
      alert('片段未找到，请检查数据一致性');
      return;
    }

    // 更新片段 ID（如果之前没有）和状态
    loadResult.projectJson.shots[shotIndex].id = shot.id;
    loadResult.projectJson.shots[shotIndex].status = newStatus;
    loadResult.projectJson.project.updatedAt = new Date().toISOString();
    console.log('[updateShotStatus] 已更新项目数据');

    // 保存项目
    console.log('[updateShotStatus] 保存项目...');
    const saveResult = await window.electronAPI.saveProject(
      window.appState.currentProject.projectDir,
      loadResult.projectJson
    );

    if (saveResult.success) {
      console.log('[updateShotStatus] 保存成功，更新本地状态...');
      // 更新本地状态
      shot.status = newStatus;
      // 重新渲染片段列表
      window.renderShotList(loadResult.projectJson.shots || []);
      window.showUpdateNotification();
      console.log('[updateShotStatus] 完成');
    } else {
      console.error('[updateShotStatus] 保存失败:', saveResult.error);
      alert('保存失败：' + saveResult.error);
    }
  } catch (error) {
    console.error('[updateShotStatus] 更新片段状态异常:', error);
    alert('更新状态失败：' + error.message);
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

// 导出函数到全局
window.renderShotList = renderShotList;
window.selectShot = selectShot;
window.createNewShot = createNewShot;
window.deleteSelectedShot = deleteSelectedShot;
window.showShotStatusMenu = showShotStatusMenu;
window.updateShotStatus = updateShotStatus;
window.getStatusText = getStatusText;

console.log('[shotList.js] 模块已加载');
