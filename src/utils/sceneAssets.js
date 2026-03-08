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
  uploadArea: null,
  fileInput: null,
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
  // 等待 DOM 加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSceneAssetsPanel);
    return;
  }

  sceneAssetsPanel.panel = document.getElementById('assets-panel');
  sceneAssetsPanel.header = document.getElementById('assets-panel-toggle-header');
  sceneAssetsPanel.toggleBtn = document.getElementById('assets-panel-toggle-btn');
  sceneAssetsPanel.list = document.getElementById('shot-assets-list');
  sceneAssetsPanel.uploadArea = document.getElementById('scene-assets-upload-area');
  sceneAssetsPanel.fileInput = document.getElementById('scene-assets-file-input');

  console.log('[initSceneAssetsPanel] 初始化完成', sceneAssetsPanel);

  // 初始化上传功能
  initSceneAssetUpload();

  // 初始化右键菜单
  initSceneContextMenuEvents();
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

  const sectionId = `assets-section-${type}-${ownerId}`;

  return `
    <div class="assets-section" data-section-id="${sectionId}">
      <div class="assets-section-title assets-section-title-clickable" onclick="window.toggleAssetsSection('${sectionId}')">
        <span class="section-toggle">▼</span>
        <span>${title}</span>
        <span class="section-count">(${items.length})</span>
      </div>
      <div class="assets-section-content" id="${sectionId}">
        <div class="assets-grid assets-grid-${type}s">
          ${items.map(item => `
            <div class="asset-thumbnail" data-asset-id="${item.id}" data-asset-type="${type}" data-asset-name="${item.name}" data-asset-path="${item.path}" data-asset-source="shot">
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
      </div>
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
    // 左键点击 - 预览
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

    // 右键点击 - 上下文菜单
    thumb.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const assetType = thumb.dataset.assetType;
      const assetName = thumb.dataset.assetName;
      const assetPath = thumb.dataset.assetPath;
      const assetId = thumb.dataset.assetId;
      const assetSource = thumb.dataset.assetSource;

      showSceneContextMenu(e, {
        type: assetType,
        name: assetName,
        path: assetPath,
        id: assetId,
        ownerType: ownerType,
        ownerId: ownerId,
        source: assetSource || 'shot'
      });
    });
  });
}

/**
 * 显示片段素材右键菜单
 * @param {MouseEvent} e - 鼠标事件
 * @param {Object} asset - 素材信息
 */
function showSceneContextMenu(e, asset) {
  const contextMenu = document.getElementById('scene-asset-context-menu');
  if (!contextMenu) return;

  // 存储当前选中的素材信息
  contextMenu.dataset.assetType = asset.type;
  contextMenu.dataset.assetName = asset.name;
  contextMenu.dataset.assetPath = asset.path;
  contextMenu.dataset.assetId = asset.id;
  contextMenu.dataset.ownerType = asset.ownerType;
  contextMenu.dataset.ownerId = asset.ownerId;

  // 定位菜单
  contextMenu.style.display = 'block';
  contextMenu.style.left = `${e.clientX}px`;
  contextMenu.style.top = `${e.clientY}px`;

  // 确保菜单不超出窗口
  const rect = contextMenu.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    contextMenu.style.left = `${e.clientX - rect.width}px`;
  }
  if (rect.bottom > window.innerHeight) {
    contextMenu.style.top = `${e.clientY - rect.height}px`;
  }
}

/**
 * 隐藏右键菜单
 */
function hideSceneContextMenu() {
  const contextMenu = document.getElementById('scene-asset-context-menu');
  if (contextMenu) {
    contextMenu.style.display = 'none';
  }
}

/**
 * 初始化片段素材右键菜单事件
 */
function initSceneContextMenuEvents() {
  const contextMenu = document.getElementById('scene-asset-context-menu');
  if (!contextMenu) return;

  // 菜单项点击事件
  contextMenu.addEventListener('click', async (e) => {
    const menuItem = e.target.closest('.context-menu-item');
    if (!menuItem) return;

    const action = menuItem.dataset.action;
    const assetPath = contextMenu.dataset.assetPath;
    const assetName = contextMenu.dataset.assetName;
    const assetId = contextMenu.dataset.assetId;
    const ownerType = contextMenu.dataset.ownerType;
    const ownerId = contextMenu.dataset.ownerId;

    if (action === 'view') {
      // 显示预览
      currentPreviewAsset = {
        id: assetId,
        type: contextMenu.dataset.assetType,
        name: assetName,
        path: assetPath,
        ownerType: ownerType,
        ownerId: ownerId
      };
      showAssetPreview(currentPreviewAsset);
    } else if (action === 'delete') {
      // 检查文件是否存在
      const fileExists = await window.electronAPI.fileExists(assetPath);

      let confirmMsg;
      if (!fileExists) {
        confirmMsg = `⚠️ 文件已不存在，仅删除配置记录。\n\n确定要删除 "${assetName}" 吗？`;
      } else {
        confirmMsg = `确定要删除素材 "${assetName}" 吗？\n\n此操作将永久删除文件，无法恢复。`;
      }

      const confirmed = await window.showConfirm(confirmMsg, '删除素材');

      if (!confirmed) {
        hideSceneContextMenu();
        return;
      }

      // 如果文件存在，先删除物理文件
      if (fileExists) {
        const state = window.getState();
        const projectDir = state.projectData?.project?.projectDir || state.currentProject?.projectDir;

        const deleteResult = await window.electronAPI.deleteAsset({
          projectDir: projectDir,
          assetPath: assetPath,
          assetType: contextMenu.dataset.assetType
        });
        if (!deleteResult.success) {
          console.warn('[sceneAssets] 删除物理文件失败:', deleteResult.error);
        }
      }

      // 删除配置记录
      const result = await removeSceneAsset(ownerType, ownerId, assetId);

      if (result.success) {
        window.showToast(!fileExists ? '配置记录已删除' : '素材已删除');
        // 通知项目素材库刷新
        if (window.refreshProjectAssetsList) {
          window.refreshProjectAssetsList();
        }
      } else {
        window.showToast('删除失败：' + result.error);
      }
    }

    hideSceneContextMenu();
  });

  // 点击其他地方关闭菜单
  document.addEventListener('click', hideSceneContextMenu);
  document.addEventListener('scroll', hideSceneContextMenu);
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
  container.dataset.assetType = asset.type;
  container.dataset.assetName = asset.name;

  if (asset.type === 'image') {
    const img = document.createElement('img');
    img.src = asset.path;
    img.alt = asset.name;
    // 检查文件是否存在
    img.onerror = () => {
      img.style.display = 'none';
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = 'display:flex;align-items:center;justify-content:center;height:200px;background:#333;color:#fff;flex-direction:column;gap:10px;';
      errorDiv.innerHTML = '<div style="font-size:48px">⚠️</div><div>文件不存在</div>';
      container.appendChild(errorDiv);
    };
    container.appendChild(img);
  } else if (asset.type === 'video') {
    const video = document.createElement('video');
    video.src = asset.path;
    video.controls = true;
    video.style.maxWidth = '100%';
    video.style.maxHeight = '60vh';
    // 检查文件是否存在
    video.onerror = () => {
      video.style.display = 'none';
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = 'display:flex;align-items:center;justify-content:center;height:200px;background:#333;color:#fff;flex-direction:column;gap:10px;';
      errorDiv.innerHTML = '<div style="font-size:48px">⚠️</div><div>文件不存在</div>';
      container.appendChild(errorDiv);
    };
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
    // 检查文件是否存在
    audio.onerror = () => {
      audioContainer.innerHTML = '<div style="font-size:48px">⚠️</div><div>文件不存在</div>';
    };
    audioContainer.appendChild(audio);
    container.appendChild(audioContainer);
  }

  // 保存项目目录用于删除操作
  const state = window.getState();
  const projectDir = state.projectData?.project?.projectDir || state.currentProject?.projectDir;

  modal.style.display = 'flex';

  // 更新 currentPreviewAsset
  currentPreviewAsset = {
    ...asset,
    projectDir: projectDir
  };
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
 * 初始化片段素材上传功能（点击 + 拖放）
 */
function initSceneAssetUpload() {
  const { uploadArea, fileInput } = sceneAssetsPanel;

  console.log('[initSceneAssetUpload] uploadArea:', uploadArea, 'fileInput:', fileInput);

  if (!uploadArea || !fileInput) {
    console.error('[initSceneAssetUpload] 上传区域或文件输入不存在');
    return;
  }

  // 点击上传区域 - 使用 dialog 选择文件
  uploadArea.addEventListener('click', async () => {
    console.log('[initSceneAssetUpload] 点击上传区域');
    const result = await window.electronAPI.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: '图片', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'] },
        { name: '视频', extensions: ['mp4', 'webm', 'ogg', 'mov', 'avi'] },
        { name: '音频', extensions: ['mp3', 'wav', 'ogg', 'aac', 'flac'] },
        { name: '所有文件', extensions: ['*'] }
      ]
    });

    console.log('[initSceneAssetUpload] dialog result:', result);

    if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
      const files = result.filePaths.map(filePath => ({
        name: filePath.split(/[\\/]/).pop(),
        path: filePath
      }));
      handleSceneFilesUpload(files);
    }
  });

  // 拖放上传 - 阻止默认行为
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, preventDefaults, false);
  });

  // 拖放视觉效果
  ['dragenter', 'dragover'].forEach(eventName => {
    uploadArea.addEventListener(eventName, () => {
      uploadArea.classList.add('drag-over');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, () => {
      uploadArea.classList.remove('drag-over');
    }, false);
  });

  // 处理文件 drop
  uploadArea.addEventListener('drop', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    uploadArea.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      handleSceneDroppedFiles(fileArray);
    }
  });
}

/**
 * 阻止拖放默认行为
 */
function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

/**
 * 读取文件为 Base64
 * @param {File} file - 文件对象
 * @returns {Promise<string>} Base64 数据 URL
 */
function readSceneFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * 处理拖放的文件
 * @param {File[]} files - 文件对象数组
 */
async function handleSceneDroppedFiles(files) {
  const state = window.getState();
  const shotId = sceneAssetsPanel.currentShotId;

  if (!shotId) {
    window.showToast('请先选择一个片段');
    return;
  }

  // 使用 projectData 获取项目信息（更可靠）
  const projectData = state.projectData || state.currentProject;
  const projectDir = projectData?.project?.projectDir || state.currentProject?.projectDir;

  if (!projectDir) {
    console.error('[handleSceneDroppedFiles] 项目目录不存在', state);
    window.showToast('项目未加载，请重新打开项目');
    return;
  }

  console.log('[handleSceneDroppedFiles] 项目目录:', projectDir);

  // 显示上传进度
  showSceneUploadProgress(0, files.length);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    try {
      // 读取文件为 Base64
      const fileData = await readSceneFileAsBase64(file);

      console.log('[handleSceneDroppedFiles] file:', file.name, 'type:', file.type, 'size:', file.size);
      console.log('[handleSceneDroppedFiles] fileData:', fileData ? 'ok' : 'undefined');

      if (!fileData) {
        console.error('[handleSceneDroppedFiles] 文件读取失败:', file.name);
        failCount++;
        continue;
      }

      // 确定素材类型
      let assetType = 'image';
      if (file.type.startsWith('video/')) {
        assetType = 'video';
      } else if (file.type.startsWith('audio/')) {
        assetType = 'audio';
      }

      console.log('[handleSceneDroppedFiles] 调用 saveDroppedSceneAsset:', { fileName: file.name, projectDir, assetType, shotId });

      // 使用片段素材库上传 API（通过 Base64 保存，独立存储）
      const result = await window.electronAPI.saveDroppedSceneAsset(
        file.name,
        fileData,
        projectDir,
        assetType,
        shotId
      );

      console.log('[handleSceneDroppedFiles] saveDroppedSceneAsset result:', result);

      if (result.success) {
        // 将返回数据包装成 asset 对象格式
        const asset = {
          id: 'asset_' + assetType + '_' + Date.now(),
          name: result.name,
          path: result.path,
          type: result.type,
          size: result.size,
          fileSize: result.fileSize
        };
        // 添加到片段素材库
        console.log('[handleSceneDroppedFiles] 添加素材到片段:', asset);
        await addSceneAssetToShot(shotId, asset, true); // isSceneAsset = true 表示这是片段专属素材
        successCount++;
      } else {
        failCount++;
        console.error('[handleSceneDroppedFiles] 上传失败:', result.error || '无返回数据');
      }
    } catch (error) {
      failCount++;
      console.error('[handleSceneDroppedFiles] 上传异常:', error);
    }

    // 更新进度
    showSceneUploadProgress(i + 1, files.length);
  }

  // 隐藏进度条
  setTimeout(() => hideSceneUploadProgress(), 1000);

  // 显示结果
  if (successCount > 0) {
    window.showToast(`成功上传 ${successCount}/${files.length} 个素材`);
    loadShotAssetsList(shotId);
  } else {
    window.showToast('上传失败，请检查文件格式');
  }
}

/**
 * 处理文件上传（点击方式）
 * @param {Object[]} files - 文件列表（包含 name 和 path 属性）
 */
async function handleSceneFilesUpload(files) {
  const state = window.getState();
  const shotId = sceneAssetsPanel.currentShotId;

  if (!shotId) {
    window.showToast('请先选择一个片段');
    return;
  }

  // 使用 projectData 获取项目信息（更可靠）
  const projectData = state.projectData || state.currentProject;
  const projectDir = projectData?.project?.projectDir || state.currentProject?.projectDir;

  if (!projectDir) {
    console.error('[handleSceneFilesUpload] 项目目录不存在', state);
    window.showToast('项目未加载，请重新打开项目');
    return;
  }

  // 显示上传进度
  showSceneUploadProgress(0, files.length);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if (!file.path) {
      failCount++;
      continue;
    }

    try {
      // 使用片段素材上传 API（独立存储）
      const result = await window.electronAPI.uploadSceneAsset({
        projectDir: projectDir,
        filePath: file.path,
        fileName: file.name,
        shotId: shotId
      });

      if (result.success && result.asset) {
        // 添加到片段素材库
        await addSceneAssetToShot(shotId, result.asset, true);
        successCount++;
      } else {
        failCount++;
      }
    } catch (error) {
      failCount++;
      console.error('[handleSceneFilesUpload] 上传异常:', error);
    }

    // 更新进度
    showSceneUploadProgress(i + 1, files.length);
  }

  // 隐藏进度条
  setTimeout(() => hideSceneUploadProgress(), 1000);

  // 显示结果
  if (successCount > 0) {
    window.showToast(`成功上传 ${successCount}/${files.length} 个素材`);
    loadShotAssetsList(shotId);
  } else {
    window.showToast('上传失败');
  }
}

/**
 * 添加素材到片段
 * @param {string} shotId - 片段 ID
 * @param {Object} asset - 素材对象
 */
async function addSceneAssetToShot(shotId, asset) {
  const state = window.getState();
  // 使用 projectData 获取最新的项目数据
  const projectData = state.projectData || state.currentProject;

  if (!projectData) {
    console.error('[addSceneAssetToShot] 项目未加载');
    return;
  }

  // 从 projectData.shots 中查找片段
  const shot = projectData.shots?.find(s => s.id === shotId);
  if (!shot) {
    console.error('[addSceneAssetToShot] 片段不存在:', shotId, '可用片段:', projectData.shots?.map(s => s.id));
    return;
  }

  // 初始化素材库
  if (!shot.assets) {
    shot.assets = { images: [], videos: [], audios: [] };
  }

  // 根据类型添加到对应数组
  const assetType = (asset && asset.type) || getAssetType(asset.name);
  const assetArray = shot.assets[assetType + 's'];
  if (!Array.isArray(assetArray)) {
    shot.assets[assetType + 's'] = [];
  }
  shot.assets[assetType + 's'].push(asset);

  console.log('[addSceneAssetToShot] 添加素材:', asset, '到片段:', shotId);

  // 保存项目 - 使用 projectData 或 currentProject
  const project = state.currentProject;
  if (!project || !project.projectDir) {
    console.error('[addSceneAssetToShot] 项目目录不存在');
    return;
  }

  // 构建完整的项目 JSON 对象
  const projectJson = {
    project: project.project || project,
    shots: projectData.shots || project.shots,
    promptTemplates: projectData.promptTemplates || project.promptTemplates || [],
    selected: projectData.selected || project.selected || {},
    theme: projectData.theme || project.theme || {}
  };

  console.log('[addSceneAssetToShot] 保存项目，projectDir:', project.projectDir);

  const saveResult = await window.electronAPI.saveProject(project.projectDir, projectJson);
  console.log('[addSceneAssetToShot] 保存结果:', saveResult);

  // 重新加载项目数据以确保同步
  if (saveResult.success) {
    const loadResult = await window.electronAPI.loadProject(project.projectDir);
    if (loadResult.success && loadResult.projectJson) {
      // 更新 state 中的两个项目对象
      const projects = state.projects || [];
      const index = projects.findIndex(p => p.projectDir === project.projectDir);
      if (index !== -1) {
        projects[index] = { ...projects[index], ...loadResult.projectJson.project };
      }
      window.updateState('projects', projects);
      window.updateState('currentProject', loadResult.projectJson);
      window.updateState('projectData', loadResult.projectJson);
      console.log('[addSceneAssetToShot] 项目数据已同步');

      // 通知项目素材库刷新（如果已打开）
      if (window.refreshProjectAssetsList) {
        window.refreshProjectAssetsList();
      }
    }
  }
}

/**
 * 显示上传进度
 * @param {number} current - 当前已上传数量
 * @param {number} total - 总文件数
 */
function showSceneUploadProgress(current, total) {
  let progressEl = document.getElementById('scene-upload-progress');

  if (!progressEl) {
    const uploadArea = sceneAssetsPanel.uploadArea;
    progressEl = document.createElement('div');
    progressEl.id = 'scene-upload-progress';
    progressEl.className = 'upload-progress active';
    progressEl.innerHTML = `
      <div class="progress-bar">
        <div class="progress-fill" id="scene-progress-fill"></div>
      </div>
      <div class="progress-text" id="scene-progress-text"></div>
    `;
    uploadArea.parentNode.insertBefore(progressEl, uploadArea.nextSibling);
  } else {
    progressEl.classList.add('active');
  }

  const percent = Math.round((current / total) * 100);
  const fillEl = document.getElementById('scene-progress-fill');
  const textEl = document.getElementById('scene-progress-text');

  if (fillEl) fillEl.style.width = `${percent}%`;
  if (textEl) textEl.textContent = `正在上传 ${current}/${total} (${percent}%)`;
}

/**
 * 隐藏上传进度
 */
function hideSceneUploadProgress() {
  const progressEl = document.getElementById('scene-upload-progress');
  if (progressEl) {
    progressEl.classList.remove('active');
  }
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
    // 使用 projectData 获取最新的项目数据
    const projectData = state.projectData || state.currentProject;

    if (!projectData) return { success: false, error: '项目未加载' };

    if (ownerType === 'shot') {
      const shot = projectData.shots?.find(s => s.id === ownerId);
      if (!shot || !shot.assets) return { success: false, error: '片段不存在' };

      // 从所有类型中查找并删除
      for (const type of ['images', 'videos', 'audios']) {
        const index = shot.assets[type].findIndex(a => a.id === assetId);
        if (index !== -1) {
          shot.assets[type].splice(index, 1);
          break;
        }
      }

      // 同步更新 currentProject
      if (state.currentProject && state.currentProject.shots) {
        const currentShot = state.currentProject.shots?.find(s => s.id === ownerId);
        if (currentShot && currentShot.assets) {
          for (const type of ['images', 'videos', 'audios']) {
            const index = currentShot.assets[type].findIndex(a => a.id === assetId);
            if (index !== -1) {
              currentShot.assets[type].splice(index, 1);
              break;
            }
          }
        }
      }

    } else if (ownerType === 'scene') {
      let targetScene = null;
      for (const shot of projectData.shots || []) {
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

    // 保存项目 - 使用 projectData
    const project = state.currentProject;
    if (!project || !project.projectDir) {
      return { success: false, error: '项目目录不存在' };
    }

    await window.electronAPI.saveProject(project.projectDir, projectData);

    // 刷新素材列表
    if (ownerType === 'shot') {
      loadShotAssetsList(ownerId);
    } else {
      // 镜头素材库暂未实现
      console.warn('[sceneAssets] 镜头素材删除后刷新功能暂未实现');
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

      const assetPath = currentPreviewAsset.path;
      const assetName = currentPreviewAsset.name;

      // 检查文件是否存在
      const fileExists = await window.electronAPI.fileExists(assetPath);

      let confirmMsg;
      if (!fileExists) {
        confirmMsg = `⚠️ 文件已不存在，仅删除配置记录。\n\n确定要删除 "${assetName}" 吗？`;
      } else {
        confirmMsg = `确定要删除素材 "${assetName}" 吗？\n\n此操作将永久删除文件，无法恢复。`;
      }

      const confirmed = await window.showConfirm(confirmMsg, '删除素材');

      if (!confirmed) return;

      // 如果文件存在，先删除物理文件
      if (fileExists) {
        const deleteResult = await window.electronAPI.deleteAsset({
          projectDir: currentPreviewAsset.projectDir,
          assetPath: assetPath,
          assetType: currentPreviewAsset.type
        });
        if (!deleteResult.success) {
          console.warn('[sceneAssets] 删除物理文件失败:', deleteResult.error);
          // 文件删除失败但仍然可以继续删除配置
        }
      }

      // 删除配置记录
      if (!currentPreviewAsset) {
        window.showToast('素材信息已丢失，请刷新后重试');
        return;
      }

      const result = await removeSceneAsset(
        currentPreviewAsset.ownerType,
        currentPreviewAsset.ownerId,
        currentPreviewAsset.id
      );

      if (result.success) {
        window.showToast(!fileExists ? '配置记录已删除' : '素材已删除');
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
window.toggleAssetsSection = toggleAssetsSection;

/**
 * 切换素材分类折叠状态
 * @param {string} sectionId - 分类 ID
 */
function toggleAssetsSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;

  const titleEl = section.previousElementSibling;
  const toggleEl = titleEl?.querySelector('.section-toggle');

  if (section.classList.contains('collapsed')) {
    section.classList.remove('collapsed');
    if (toggleEl) toggleEl.textContent = '▼';
  } else {
    section.classList.add('collapsed');
    if (toggleEl) toggleEl.textContent = '▶';
  }
}
