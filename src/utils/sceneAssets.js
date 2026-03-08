//
// Kim 多级分镜提示词助手 - 片段/镜头素材库模块
// 负责底部片段素材库面板的显示、素材管理等功能
//

/**
 * 片段素材库面板元素
 */
const sceneAssetsPanel = {
  panel: null,
  header: null,
  toggleBtn: null,
  list: null,
  uploadBtn: null,
  currentShotId: null,
  currentSceneId: null
};

/**
 * 当前预览的素材信息
 */
let currentPreviewAsset = null;

/**
 * 初始化片段素材库面板
 */
function initSceneAssetsPanel() {
  sceneAssetsPanel.panel = document.getElementById('assets-panel');
  sceneAssetsPanel.header = document.getElementById('assets-panel-toggle-header');
  sceneAssetsPanel.toggleBtn = document.getElementById('assets-panel-toggle-btn');
  sceneAssetsPanel.list = document.getElementById('shot-assets-list');
  sceneAssetsPanel.uploadBtn = document.getElementById('assets-panel-upload-btn');

  // 绑定上传按钮事件
  if (sceneAssetsPanel.uploadBtn) {
    sceneAssetsPanel.uploadBtn.addEventListener('click', handleUploadAsset);
  }
}

/**
 * 打开片段素材库面板
 */
function openSceneAssetsPanel() {
  if (!sceneAssetsPanel.panel) {
    initSceneAssetsPanel();
  }
  
  if (sceneAssetsPanel.panel.classList.contains('collapsed')) {
    sceneAssetsPanel.panel.classList.remove('collapsed');
    if (sceneAssetsPanel.toggleBtn) {
      sceneAssetsPanel.toggleBtn.textContent = '▼';
      sceneAssetsPanel.toggleBtn.style.visibility = 'visible';
    }
  }
}

/**
 * 关闭片段素材库面板
 */
function closeSceneAssetsPanel() {
  if (!sceneAssetsPanel.panel) return;
  
  sceneAssetsPanel.panel.classList.add('collapsed');
  if (sceneAssetsPanel.toggleBtn) {
    sceneAssetsPanel.toggleBtn.textContent = '▲';
  }
}

/**
 * 切换片段素材库面板显示状态
 */
function toggleSceneAssetsPanel() {
  if (!sceneAssetsPanel.panel) {
    initSceneAssetsPanel();
  }
  
  if (sceneAssetsPanel.panel.classList.contains('collapsed')) {
    openSceneAssetsPanel();
  } else {
    closeSceneAssetsPanel();
  }
}

/**
 * 加载片段素材列表
 * @param {string} shotId - 片段 ID
 */
async function loadShotAssetsList(shotId) {
  if (!sceneAssetsPanel.list) return;

  console.log('[loadShotAssetsList] shotId:', shotId);

  sceneAssetsPanel.currentShotId = shotId;

  sceneAssetsPanel.list.innerHTML = '<div class="placeholder-text">加载中...</div>';

  try {
    const state = window.getState();
    // 从 projectData 读取完整项目数据（包含 shots）
    const projectData = state.projectData;

    console.log('[loadShotAssetsList] projectData:', projectData);
    console.log('[loadShotAssetsList] shots:', projectData?.shots);

    if (!projectData || !projectData.shots) {
      sceneAssetsPanel.list.innerHTML = '<div class="placeholder-text">请先打开项目</div>';
      return;
    }

    // 查找片段
    const shot = projectData.shots.find(s => s.id === shotId);
    console.log('[loadShotAssetsList] found shot:', shot);

    if (!shot) {
      sceneAssetsPanel.list.innerHTML = '<div class="placeholder-text">片段不存在</div>';
      return;
    }

    // 获取片段素材
    const assets = shot.assets || { images: [], videos: [], audios: [] };

    renderSceneAssetsList(assets, 'shot', shotId);
  } catch (error) {
    console.error('[sceneAssets] 加载片段素材失败:', error);
    sceneAssetsPanel.list.innerHTML = '<div class="placeholder-text">加载失败</div>';
  }
}

/**
 * 渲染素材列表
 * @param {Object} assets - 素材对象
 * @param {string} ownerType - 所有者类型 (shot/scene)
 * @param {string} ownerId - 所有者 ID
 */
function renderSceneAssetsList(assets, ownerType, ownerId) {
  if (!sceneAssetsPanel.list) return;
  
  sceneAssetsPanel.list.innerHTML = '';
  
  let totalCount = 0;
  
  // 渲染图片
  if (assets.images && assets.images.length > 0) {
    totalCount += assets.images.length;
    sceneAssetsPanel.list.innerHTML += renderSceneAssetsSection('图片', assets.images, 'image', ownerType, ownerId);
  }
  
  // 渲染视频
  if (assets.videos && assets.videos.length > 0) {
    totalCount += assets.videos.length;
    sceneAssetsPanel.list.innerHTML += renderSceneAssetsSection('视频', assets.videos, 'video', ownerType, ownerId);
  }
  
  // 渲染音频
  if (assets.audios && assets.audios.length > 0) {
    totalCount += assets.audios.length;
    sceneAssetsPanel.list.innerHTML += renderSceneAssetsSection('音频', assets.audios, 'audio', ownerType, ownerId);
  }
  
  if (totalCount === 0) {
    sceneAssetsPanel.list.innerHTML = `
      <div class="placeholder-text">暂无素材</div>
      <div class="assets-upload-hint">点击"上传素材"添加${ownerType === 'shot' ? '片段' : '镜头'}专属素材</div>
    `;
  }
  
  // 更新面板标题
  updateAssetsPanelTitle(ownerType, totalCount);
  
  // 绑定缩略图点击事件
  bindSceneAssetsClickEvents(ownerType, ownerId);
}

/**
 * 渲染素材分类
 */
function renderSceneAssetsSection(title, items, type, ownerType, ownerId) {
  const icons = {
    image: '🖼️',
    video: '🎬',
    audio: '🎵'
  };
  
  return `
    <div class="assets-section-title">${title}</div>
    <div class="assets-grid assets-grid-${type}s">
      ${items.map(item => `
        <div class="asset-thumbnail" data-asset-id="${item.id}" data-asset-type="${type}" data-asset-name="${item.name}" data-asset-path="${item.path}">
          ${type === 'image'
            ? `<img src="${item.path}" alt="${item.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2280%22>🖼️</text></svg>'" />`
            : `<div class="${type}-thumbnail">${icons[type]}</div>`
          }
          <div class="asset-info">
            <span class="asset-name">${item.name}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * 更新面板标题
 */
function updateAssetsPanelTitle(ownerType, count) {
  const titleElement = document.querySelector('#assets-panel .panel-header h3');
  if (titleElement) {
    if (ownerType === 'shot') {
      titleElement.textContent = `片段素材库 (${count})`;
    } else {
      titleElement.textContent = `镜头素材库 (${count})`;
    }
  }
}

/**
 * 绑定缩略图点击事件
 */
function bindSceneAssetsClickEvents(ownerType, ownerId) {
  const thumbnails = document.querySelectorAll('#shot-assets-list .asset-thumbnail');
  thumbnails.forEach(thumb => {
    thumb.addEventListener('click', () => {
      const assetType = thumb.dataset.assetType;
      const assetName = thumb.dataset.assetName;
      const assetPath = thumb.dataset.assetPath;
      const assetId = thumb.dataset.assetId;

      // 显示预览
      currentPreviewAsset = {
        id: assetId,
        type: assetType,
        name: assetName,
        path: assetPath,
        ownerType: ownerType,
        ownerId: ownerId
      };

      showAssetPreview(currentPreviewAsset);
    });
  });
}

/**
 * 显示素材预览
 * @param {Object} asset - 素材信息
 */
function showAssetPreview(asset) {
  const modal = document.getElementById('asset-preview-modal');
  const title = document.getElementById('asset-preview-title');
  const nameEl = document.getElementById('asset-preview-name');
  const sizeEl = document.getElementById('asset-preview-size');
  const container = document.getElementById('asset-preview-container');

  if (!modal || !container) return;

  if (title) title.textContent = asset.name;
  if (nameEl) nameEl.textContent = asset.name;
  if (sizeEl) sizeEl.textContent = asset.size || '-';

  container.innerHTML = '';
  container.dataset.assetPath = asset.path;

  if (asset.type === 'image') {
    const img = document.createElement('img');
    img.src = asset.path;
    img.alt = asset.name;
    container.appendChild(img);
  } else if (asset.type === 'video') {
    const video = document.createElement('video');
    video.src = asset.path;
    video.controls = true;
    video.style.maxWidth = '100%';
    video.style.maxHeight = '60vh';
    container.appendChild(video);
  } else if (asset.type === 'audio') {
    const audioContainer = document.createElement('div');
    audioContainer.style.textAlign = 'center';
    audioContainer.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 15px;">🎵</div>
      <div class="asset-preview-info">
        <h4>${asset.name}</h4>
      </div>
    `;
    const audio = document.createElement('audio');
    audio.src = asset.path;
    audio.controls = true;
    audioContainer.appendChild(audio);
    container.appendChild(audioContainer);
  }

  modal.style.display = 'flex';
}

/**
 * 隐藏素材预览
 */
function hideAssetPreview() {
  const modal = document.getElementById('asset-preview-modal');
  const container = document.getElementById('asset-preview-container');

  if (!modal) return;

  modal.style.display = 'none';
  container.innerHTML = '';
  currentPreviewAsset = null;
}

/**
 * 处理上传素材
 */
async function handleUploadAsset() {
  const state = window.getState();
  const shotId = sceneAssetsPanel.currentShotId;

  if (!shotId) {
    window.showToast('请先选择一个片段');
    return;
  }

  // 创建隐藏的文件选择器
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,video/*,audio/*';
  input.multiple = true;

  input.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const project = state.currentProject;
    if (!project || !project.projectDir) {
      window.showToast('项目未加载');
      return;
    }

    // 查找片段
    const shot = project.shots?.find(s => s.id === shotId);
    if (!shot) {
      window.showToast('片段不存在');
      return;
    }

    // 上传每个文件
    let successCount = 0;
    for (const file of files) {
      try {
        const result = await window.electronAPI.uploadAsset({
          projectDir: project.projectDir,
          filePath: file.path,
          shotId: shotId
        });

        if (result.success) {
          successCount++;
        } else {
          console.error('[sceneAssets] 上传失败:', result.error);
        }
      } catch (error) {
        console.error('[sceneAssets] 上传异常:', error);
      }
    }

    if (successCount > 0) {
      window.showToast(`成功上传 ${successCount}/${files.length} 个素材`);
      // 重新加载素材列表
      loadShotAssetsList(shotId);
    } else {
      window.showToast('上传失败');
    }
  });

  input.click();
}

/**
 * 添加素材到片段/镜头
 * @param {string} ownerType - 所有者类型 (shot/scene)
 * @param {string} ownerId - 所有者 ID
 * @param {Object} asset - 素材对象
 */
async function addSceneAsset(ownerType, ownerId, asset) {
  try {
    const state = window.getState();
    const project = state.currentProject;
    
    if (!project) return { success: false, error: '项目未加载' };
    
    if (ownerType === 'shot') {
      // 添加到片段
      const shot = project.shots?.find(s => s.id === ownerId);
      if (!shot) return { success: false, error: '片段不存在' };
      
      if (!shot.assets) shot.assets = { images: [], videos: [], audios: [] };
      
      const assetType = getAssetType(asset.name);
      shot.assets[assetType + 's'].push(asset);
      
    } else if (ownerType === 'scene') {
      // 添加到镜头
      let targetScene = null;
      for (const shot of project.shots || []) {
        const scene = shot.scenes?.find(s => s.id === ownerId);
        if (scene) {
          targetScene = scene;
          break;
        }
      }
      
      if (!targetScene) return { success: false, error: '镜头不存在' };
      
      if (!targetScene.assets) targetScene.assets = { images: [], videos: [], audios: [] };
      
      const assetType = getAssetType(asset.name);
      targetScene.assets[assetType + 's'].push(asset);
    }
    
    // 保存项目
    await window.electronAPI.saveProject(project.projectDir, project);
    
    // 刷新素材列表
    if (ownerType === 'shot') {
      loadShotAssetsList(ownerId);
    } else {
      loadSceneAssetsList(ownerId);
    }
    
    return { success: true };
  } catch (error) {
    console.error('[sceneAssets] 添加素材失败:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 从片段/镜头删除素材
 * @param {string} ownerType - 所有者类型
 * @param {string} ownerId - 所有者 ID
 * @param {string} assetId - 素材 ID
 */
async function removeSceneAsset(ownerType, ownerId, assetId) {
  try {
    const state = window.getState();
    const project = state.currentProject;
    
    if (!project) return { success: false, error: '项目未加载' };
    
    if (ownerType === 'shot') {
      const shot = project.shots?.find(s => s.id === ownerId);
      if (!shot || !shot.assets) return { success: false, error: '片段不存在' };
      
      // 从所有类型中查找并删除
      for (const type of ['images', 'videos', 'audios']) {
        const index = shot.assets[type].findIndex(a => a.id === assetId);
        if (index !== -1) {
          shot.assets[type].splice(index, 1);
          break;
        }
      }
      
    } else if (ownerType === 'scene') {
      let targetScene = null;
      for (const shot of project.shots || []) {
        const scene = shot.scenes?.find(s => s.id === ownerId);
        if (scene) {
          targetScene = scene;
          break;
        }
      }
      
      if (!targetScene || !targetScene.assets) return { success: false, error: '镜头不存在' };
      
      // 从所有类型中查找并删除
      for (const type of ['images', 'videos', 'audios']) {
        const index = targetScene.assets[type].findIndex(a => a.id === assetId);
        if (index !== -1) {
          targetScene.assets[type].splice(index, 1);
          break;
        }
      }
    }
    
    // 保存项目
    await window.electronAPI.saveProject(project.projectDir, project);
    
    // 刷新素材列表
    if (ownerType === 'shot') {
      loadShotAssetsList(ownerId);
    } else {
      loadSceneAssetsList(ownerId);
    }
    
    return { success: true };
  } catch (error) {
    console.error('[sceneAssets] 删除素材失败:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 根据文件名获取素材类型
 */
function getAssetType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return 'image';
  if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(ext)) return 'audio';
  return 'image'; // 默认
}

/**
 * 初始化预览模态框事件
 */
function initAssetPreviewModal() {
  // 关闭按钮
  const closeBtn = document.getElementById('asset-preview-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', hideAssetPreview);
  }

  // 点击遮罩关闭
  const modal = document.getElementById('asset-preview-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.classList.contains('modal-overlay')) {
        hideAssetPreview();
      }
    });
  }

  // 复制路径按钮
  const copyPathBtn = document.getElementById('asset-preview-copy-path-btn');
  if (copyPathBtn) {
    copyPathBtn.addEventListener('click', () => {
      const container = document.getElementById('asset-preview-container');
      const path = container?.dataset.assetPath;
      if (path) {
        navigator.clipboard.writeText(path)
          .then(() => {
            window.showToast('路径已复制到剪贴板');
          })
          .catch(err => {
            console.error('[sceneAssets] 复制路径失败:', err);
            window.showToast('复制失败');
          });
      }
    });
  }

  // 删除按钮
  const deleteBtn = document.getElementById('asset-preview-delete-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      if (!currentPreviewAsset) return;

      const confirmed = await window.showConfirm(
        `确定要删除素材 "${currentPreviewAsset.name}" 吗？`,
        '删除素材'
      );

      if (!confirmed) return;

      const result = await removeSceneAsset(
        currentPreviewAsset.ownerType,
        currentPreviewAsset.ownerId,
        currentPreviewAsset.id
      );

      if (result.success) {
        window.showToast('素材已删除');
        hideAssetPreview();
        // 重新加载素材列表
        if (currentPreviewAsset.ownerType === 'shot') {
          loadShotAssetsList(currentPreviewAsset.ownerId);
        }
      } else {
        window.showToast('删除失败：' + result.error);
      }
    });
  }
}

// 导出到 window 对象
window.initSceneAssetsPanel = initSceneAssetsPanel;
window.openSceneAssetsPanel = openSceneAssetsPanel;
window.closeSceneAssetsPanel = closeSceneAssetsPanel;
window.toggleSceneAssetsPanel = toggleSceneAssetsPanel;
window.loadShotAssetsList = loadShotAssetsList;
window.addSceneAsset = addSceneAsset;
window.removeSceneAsset = removeSceneAsset;
window.initAssetPreviewModal = initAssetPreviewModal;
window.hideAssetPreview = hideAssetPreview;
