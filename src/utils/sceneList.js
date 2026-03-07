//
// Kim 多级分镜提示词助手 - 镜头管理模块
// 负责镜头列表渲染、选择、新建和删除
//

// 全局变量引用（由 renderer.js 注入）
// - window.getState(): 获取应用状态
// - window.updateState(): 更新应用状态
// - window.elements: DOM 元素引用
// - window.useElectronAPI: 是否使用 Electron API
// - window.electronAPI: Electron API 接口
// - window.updatePromptPreview: 更新提示词预览函数
// - window.showSceneProperties: 显示镜头属性表单函数
// - window.selectProject: 选择项目函数
// - window.showConfirm: 显示确认对话框函数
// - window.showUpdateNotification: 显示更新提示函数
// - window.showCustomPrompt: 显示自定义输入框函数

/**
 * 渲染镜头列表
 * @param {Array} scenes - 镜头数组
 */
function renderSceneList(scenes) {
  if (!window.elements.sceneList) {
    return;
  }

  window.elements.sceneList.innerHTML = '';

  if (!scenes || scenes.length === 0) {
    window.elements.sceneList.innerHTML = '<div class="placeholder-text">暂无镜头，点击 + 新建</div>';
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
    window.elements.sceneList.appendChild(sceneElement);
  });
}

/**
 * 选择镜头
 * @param {Object} scene - 镜头对象
 */
async function selectScene(scene) {
  // 关键修复：切换镜头时清除待处理的自动保存
  if (window.sceneSaveTimeout) {
    clearTimeout(window.sceneSaveTimeout);
    window.sceneSaveTimeout = null;
    window.savingSceneId = null;
  }

  const state = window.getState();
  if (window.useElectronAPI && state.currentProject?.projectDir && state.currentShot) {
    // 从 project.json 中读取最新的镜头数据
    try {
      const loadResult = await window.electronAPI.loadProject(state.currentProject.projectDir);
      if (loadResult.success) {
        const latestShot = loadResult.projectJson.shots?.find(s => s.id === state.currentShot.id);
        if (latestShot && latestShot.scenes) {
          const latestScene = latestShot.scenes.find(s => s.id === scene.id);
          if (latestScene) {
            window.updateState('currentScene', latestScene);
          }
        }
      }
    } catch (error) {
      window.updateState('currentScene', scene);
    }
  } else {
    window.updateState('currentScene', scene);
  }

  window.updateState('currentScene', window.getState().currentScene || scene);

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

  // 启用提示词操作按钮
  if (window.elements.copyPromptBtn) {
    window.elements.copyPromptBtn.disabled = false;
  }
  if (window.elements.exportPromptBtn) {
    window.elements.exportPromptBtn.disabled = false;
  }
  if (window.elements.clearPromptBtn) {
    window.elements.clearPromptBtn.disabled = false;
  }

  // 更新提示词预览
  window.updatePromptPreview();

  // 显示镜头属性表单
  window.showSceneProperties(window.getState().currentScene);
}

/**
 * 新建镜头
 */
async function createNewScene() {
  const state = window.getState();
  if (!state.currentShot) {
    window.showToast('请先选择一个片段');
    return;
  }

  // 使用自定义 prompt 替代系统 prompt
  const sceneName = await window.showCustomPrompt('请输入镜头名称:', '新建镜头');
  if (!sceneName) {
    return;
  }

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

  if (window.useElectronAPI && state.currentProject.projectDir) {
    try {
      const loadResult = await window.electronAPI.loadProject(state.currentProject.projectDir);
      if (!loadResult.success) {
        return;
      }

      const shot = loadResult.projectJson.shots?.find(s => s.id === state.currentShot.id);
      if (shot) {
        shot.scenes = shot.scenes || [];
        shot.scenes.push(newScene);

        const saveResult = await window.electronAPI.saveProject(
          state.currentProject.projectDir,
          loadResult.projectJson
        );

        if (saveResult.success) {
          await window.selectProject(state.currentProject);
          window.showUpdateNotification();
        }
      }
    } catch (error) {
      console.error('[createNewScene] 创建镜头异常:', error);
    }
  }
}

/**
 * 删除选中的镜头
 */
async function deleteSelectedScene() {
  const state = window.getState();
  if (!state.currentScene) {
    window.showToast('请先选择一个镜头');
    return;
  }

  const confirmed = await window.showConfirm(`确定要删除镜头 "${state.currentScene.name}" 吗？`);
  if (!confirmed) {
    return;
  }

  if (window.useElectronAPI && state.currentProject.projectDir) {
    try {
      const loadResult = await window.electronAPI.loadProject(state.currentProject.projectDir);
      if (!loadResult.success) {
        return;
      }

      const shot = loadResult.projectJson.shots?.find(s => s.id === state.currentShot.id);
      if (shot && shot.scenes) {
        // 减少要删除镜头使用的自定义选项计数
        await decrementSceneOptionsUsage(state.currentScene);

        shot.scenes = shot.scenes.filter(s => s.id !== state.currentScene.id);

        const saveResult = await window.electronAPI.saveProject(
          state.currentProject.projectDir,
          loadResult.projectJson
        );

        if (saveResult.success) {
          window.updateState('currentScene', null);
          await window.selectProject(state.currentProject);
        }
      }
    } catch (error) {
      console.error('[deleteSelectedScene] 删除镜头异常:', error);
    }
  }
}

/**
 * 减少镜头使用的自定义选项计数
 * @param {Object} scene - 镜头对象
 */
async function decrementSceneOptionsUsage(scene) {
  if (!scene) return;

  const usageUpdates = [];
  const optionCounts = new Map();
  
  // 收集镜头使用的选项及其使用次数
  if (scene.shotType) optionCounts.set(scene.shotType, (optionCounts.get(scene.shotType) || 0) + 1);
  if (scene.angle) optionCounts.set(scene.angle, (optionCounts.get(scene.angle) || 0) + 1);
  if (scene.camera) optionCounts.set(scene.camera, (optionCounts.get(scene.camera) || 0) + 1);
  if (scene.emotion) optionCounts.set(scene.emotion, (optionCounts.get(scene.emotion) || 0) + 1);

  // 获取所有自定义选项，减少匹配的选项计数
  const customGroups = ['景别', '镜头角度', '运镜', '情绪氛围'];
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

// 导出函数到全局
window.renderSceneList = renderSceneList;
window.selectScene = selectScene;
window.createNewScene = createNewScene;
window.deleteSelectedScene = deleteSelectedScene;

