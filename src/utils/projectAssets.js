//
// Kim 多级分镜提示词助手 - 项目素材库模块
// 负责素材库侧边窗体的显示、隐藏、素材列表渲染等功能
//

/**
 * 素材库侧边窗体元素
 */
const assetsSidebar = {
  sidebar: null,
  projectName: null,
  searchInput: null,
  categories: null,
  uploadArea: null,
  fileInput: null,
  list: null,
  usageFill: null,
  usageText: null,
  closeBtn: null
};

/**
 * 素材预览模态框元素
 */
const previewModal = {
  modal: null,
  container: null,
  name: null,
  size: null,
  closeBtn: null
};

/**
 * 当前打开素材库的项目 ID
 */
let currentProjectId = null;

/**
 * 当前素材数据缓存
 */
let currentAssetsData = { images: [], videos: [], audios: [] };

/**
 * 渲染素材分类
 * @param {string} title - 分类标题
 * @param {Array} items - 素材数组
 * @param {string} type - 素材类型 (image/video/audio)
 */
function renderAssetsSection(title, items, type) {
  const icons = {
    image: '🖼️',
    video: '🎬',
    audio: '🎵'
  };

  return `
    <div class="assets-section-title">${title}</div>
    <div class="assets-grid assets-grid-${type}s">
      ${items.map((item, index) => {
        const sourceBadge = item.source === 'shot' 
          ? `<span class="asset-source" title="片段素材：${item.shotId || ''}">📋</span>` 
          : '';
        return `
        <div class="asset-thumbnail" data-asset-id="${item.id}" data-asset-type="${type}" data-asset-name="${item.name}" data-asset-size="${item.size}" data-asset-path="${item.path}" data-asset-source="${item.source || 'project'}">
          ${sourceBadge}
          ${type === 'image'
            ? `<img src="${item.path}" alt="${item.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2280%22>🖼️</text></svg>'" />`
            : type === 'video'
              ? `<video src="${item.path}" preload="auto" muted oncanplay="window.extractVideoFrame(this)" onerror="this.parentElement.innerHTML='<div class=\\'video-thumbnail\\'>${icons[type]}</div>'"></video>`
              : `<div class="${type}-thumbnail">${icons[type]}</div>`
          }
          <div class="asset-info">
            <span class="asset-name">${item.name}</span>
            <span class="asset-size">${item.size}</span>
          </div>
        </div>
      `;
      }).join('')}
    </div>
  `;
}

/**
 * 渲染素材列表
 * @param {Object} assets - 素材对象 { images, videos, audios }
 * @param {boolean} cacheData - 是否缓存数据（默认 true）
 * @param {boolean} updateCount - 是否更新计数（默认 true）
 */
const renderProjectAssetsList = function(assets, cacheData = true, updateCount = true) {
  if (!assetsSidebar.list) return;

  assetsSidebar.list.innerHTML = '';

  // 缓存当前素材数据
  if (cacheData) {
    currentAssetsData = {
      images: assets.images || [],
      videos: assets.videos || [],
      audios: assets.audios || []
    };
  }

  let totalCount = 0;

  // 渲染图片
  if (assets.images && assets.images.length > 0) {
    totalCount += assets.images.length;
    assetsSidebar.list.innerHTML += renderAssetsSection('图片', assets.images, 'image');
  }

  // 渲染视频
  if (assets.videos && assets.videos.length > 0) {
    totalCount += assets.videos.length;
    assetsSidebar.list.innerHTML += renderAssetsSection('视频', assets.videos, 'video');
  }

  // 渲染音频
  if (assets.audios && assets.audios.length > 0) {
    totalCount += assets.audios.length;
    assetsSidebar.list.innerHTML += renderAssetsSection('音频', assets.audios, 'audio');
  }

  if (totalCount === 0) {
    assetsSidebar.list.innerHTML = '<div class="placeholder-text">暂无素材，点击"上传素材"添加</div>';
  }

  // 更新计数
  if (updateCount) {
    updateAssetsCount(assets);
  }

  // 更新存储使用情况
  updateAssetsUsage(assets);

  // 绑定缩略图点击事件
  bindThumbnailClickEvents();
}

/**
 * 初始化素材库侧边窗体
 */
function initAssetsSidebar() {
  // 缓存元素
  assetsSidebar.sidebar = document.getElementById('project-assets-sidebar');
  assetsSidebar.projectName = document.getElementById('assets-project-name');
  assetsSidebar.searchInput = document.getElementById('assets-search-input');
  assetsSidebar.categories = document.querySelectorAll('.assets-category');
  assetsSidebar.uploadArea = document.getElementById('assets-upload-area');
  assetsSidebar.fileInput = document.getElementById('assets-file-input');
  assetsSidebar.list = document.getElementById('assets-list');
  assetsSidebar.usageFill = document.getElementById('assets-usage-fill');
  assetsSidebar.usageText = document.getElementById('assets-usage-text');
  assetsSidebar.closeBtn = document.querySelector('.assets-sidebar-close');

  // 缓存预览模态框元素
  previewModal.modal = document.getElementById('asset-preview-modal');
  previewModal.container = document.getElementById('asset-preview-container');
  previewModal.name = document.getElementById('asset-preview-name');
  previewModal.size = document.getElementById('asset-preview-size');
  previewModal.closeBtn = document.getElementById('asset-preview-close-btn');
  previewModal.title = document.getElementById('asset-preview-title');
  previewModal.copyPathBtn = document.getElementById('asset-preview-copy-path-btn');
  previewModal.deleteBtn = document.getElementById('asset-preview-delete-btn');

  // 初始化上传功能
  initUploadFunctionality();

  // 初始化其他事件
  initAssetsSidebarEvents();
}

/**
 * 初始化上传功能（点击 + 拖放）
 */
function initUploadFunctionality() {
  const { uploadArea, fileInput } = assetsSidebar;

  if (!uploadArea || !fileInput) return;

  // 点击上传区域 - 使用 dialog 选择文件
  uploadArea.addEventListener('click', async () => {
    const result = await window.electronAPI.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: '图片', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'] },
        { name: '视频', extensions: ['mp4', 'webm', 'ogg', 'mov', 'avi'] },
        { name: '音频', extensions: ['mp3', 'wav', 'ogg', 'aac', 'flac'] },
        { name: '所有文件', extensions: ['*'] }
      ]
    });

    if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
      // 将 filePaths 转换为文件对象格式
      const files = result.filePaths.map(filePath => {
        // 从路径提取文件名（兼容 Windows 和 Unix）
        const fileName = filePath.split(/[\\/]/).pop();
        return {
          name: fileName,
          path: filePath
        };
      });
      handleFilesUpload(files);
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

  // 处理文件 drop - 真正的拖放上传
  uploadArea.addEventListener('drop', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    uploadArea.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // 将 FileList 转换为数组并处理
      const fileArray = Array.from(files);
      handleDroppedFiles(fileArray);
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
function readFileAsBase64(file) {
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
async function handleDroppedFiles(files) {
  const state = window.getState();
  const project = state.currentProject;

  if (!project || !project.projectDir) {
    window.showToast('请先选择项目');
    return;
  }

  // 显示上传进度
  showUploadProgress(0, files.length);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    console.log(`[handleDroppedFiles] file ${i}:`, file.name, file.type, file.size);

    try {
      // 读取文件为 Base64
      const fileData = await readFileAsBase64(file);

      // 确定素材类型
      let assetType = 'image';
      if (file.type.startsWith('video/')) {
        assetType = 'video';
      } else if (file.type.startsWith('audio/')) {
        assetType = 'audio';
      }

      // 使用项目素材库上传 API（通过 Base64 保存）
      const result = await window.electronAPI.saveDroppedFile(
        file.name,
        fileData,
        project.projectDir,
        assetType
      );

      if (result.success) {
        successCount++;
        console.log(`[handleDroppedFiles] 上传成功 ${file.name}:`, result.path);
      } else {
        failCount++;
        console.error(`[handleDroppedFiles] 上传失败 ${file.name}:`, result.error);
      }
    } catch (error) {
      failCount++;
      console.error(`[handleDroppedFiles] 上传异常 ${file.name}:`, error);
    }

    // 更新进度
    showUploadProgress(i + 1, files.length);
  }

  // 隐藏进度条
  setTimeout(() => hideUploadProgress(), 1000);

  // 显示结果
  if (successCount > 0) {
    window.showToast(`成功上传 ${successCount}/${files.length} 个素材`);
    // 重新加载素材列表
    loadAssetsList(currentProjectId);
  } else {
    window.showToast('上传失败，请检查文件格式');
  }
}

/**
 * 处理文件上传
 * @param {Object[]} files - 文件列表（包含 name 和 path 属性）
 */
async function handleFilesUpload(files) {
  const state = window.getState();
  const project = state.currentProject;

  if (!project || !project.projectDir) {
    window.showToast('请先选择项目');
    return;
  }

  // 显示上传进度
  showUploadProgress(0, files.length);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    console.log(`[handleFilesUpload] file ${i}:`, file.name, file.path);
    
    if (!file.path) {
      console.error(`[handleFilesUpload] file ${i} (${file.name}) 没有路径`);
      failCount++;
      continue;
    }
    
    try {
      // 使用项目素材库上传 API（不需要 shotId）
      const result = await window.electronAPI.uploadAssetToProject({
        projectDir: project.projectDir,
        filePath: file.path,
        fileName: file.name
      });

      if (result.success) {
        successCount++;
      } else {
        failCount++;
        console.error(`上传失败 ${file.name}:`, result.error);
      }
    } catch (error) {
      failCount++;
      console.error(`上传异常 ${file.name}:`, error);
    }

    // 更新进度
    showUploadProgress(i + 1, files.length);
  }

  // 隐藏进度条
  setTimeout(() => hideUploadProgress(), 1000);

  // 显示结果
  if (successCount > 0) {
    window.showToast(`成功上传 ${successCount}/${files.length} 个素材`);
    // 重新加载素材列表
    loadAssetsList(currentProjectId);
  } else {
    window.showToast('上传失败，请检查文件格式');
  }
}

/**
 * 显示上传进度
 * @param {number} current - 当前已上传数量
 * @param {number} total - 总文件数
 */
function showUploadProgress(current, total) {
  let progressEl = document.getElementById('upload-progress');

  if (!progressEl) {
    // 创建进度条元素
    const uploadArea = assetsSidebar.uploadArea;
    progressEl = document.createElement('div');
    progressEl.id = 'upload-progress';
    progressEl.className = 'upload-progress active';
    progressEl.innerHTML = `
      <div class="progress-bar">
        <div class="progress-fill" id="progress-fill"></div>
      </div>
      <div class="progress-text" id="progress-text"></div>
    `;
    uploadArea.parentNode.insertBefore(progressEl, uploadArea.nextSibling);
  } else {
    progressEl.classList.add('active');
  }

  const percent = Math.round((current / total) * 100);
  const fillEl = document.getElementById('progress-fill');
  const textEl = document.getElementById('progress-text');

  if (fillEl) fillEl.style.width = `${percent}%`;
  if (textEl) textEl.textContent = `正在上传 ${current}/${total} (${percent}%)`;
}

/**
 * 隐藏上传进度
 */
function hideUploadProgress() {
  const progressEl = document.getElementById('upload-progress');
  if (progressEl) {
    progressEl.classList.remove('active');
  }
}

/**
 * 初始化素材库侧边窗体 - 绑定其他事件
 */
function initAssetsSidebarEvents() {
  // 绑定关闭按钮事件
  if (assetsSidebar.closeBtn) {
    assetsSidebar.closeBtn.addEventListener('click', closeAssetsSidebar);
  }

  // 绑定模态框关闭按钮事件
  if (previewModal.closeBtn) {
    previewModal.closeBtn.addEventListener('click', hidePreview);
  }

  // 绑定模态框遮罩层点击关闭
  if (previewModal.modal) {
    previewModal.modal.addEventListener('click', (e) => {
      if (e.target === previewModal.modal || e.target.classList.contains('modal-overlay')) {
        hidePreview();
      }
    });
  }

  // 绑定复制路径按钮事件
  if (previewModal.copyPathBtn) {
    previewModal.copyPathBtn.addEventListener('click', () => {
      const path = previewModal.container.dataset.assetPath;
      if (path) {
        navigator.clipboard.writeText(path)
          .then(() => window.showToast('路径已复制到剪贴板'))
          .catch(() => window.showToast('复制失败'));
      }
    });
  }

  // 绑定删除按钮事件
  if (previewModal.deleteBtn) {
    previewModal.deleteBtn.addEventListener('click', async () => {
      const assetType = previewModal.container.dataset.assetType;
      const assetName = previewModal.container.dataset.assetName;
      const assetPath = previewModal.container.dataset.assetPath;
      if (assetPath) {
        const result = await confirmDeleteAsset(assetType, assetName, assetPath);
        if (result === false) {
          // 删除被阻止（如片段素材），不关闭预览
          return;
        }
      }
    });
  }

  // 初始化右键菜单
  initContextMenuEvents();

  // 绑定分类筛选事件
  assetsSidebar.categories.forEach(category => {
    category.addEventListener('click', () => {
      assetsSidebar.categories.forEach(c => c.classList.remove('active'));
      category.classList.add('active');
      const type = category.dataset.type;
      renderAssetsListByType(type);
    });
  });

  // 绑定搜索框事件
  if (assetsSidebar.searchInput) {
    assetsSidebar.searchInput.addEventListener('input', (e) => {
      const keyword = e.target.value.toLowerCase();
      filterAssetsByKeyword(keyword);
    });
  }
}

/**
 * 打开素材库侧边窗体
 * @param {string} projectId - 项目 ID
 * @param {string} projectName - 项目名称
 */
function openAssetsSidebar(projectId, projectName) {
  if (!assetsSidebar.sidebar) {
    initAssetsSidebar();
  }

  currentProjectId = projectId;

  // 从 projects 中查找项目并设置为 currentProject
  const state = window.getState();
  const project = state.projects?.find(p => p.id === projectId);
  
  if (project) {
    // 设置 currentProject 以便上传功能使用
    window.updateState('currentProject', project);
  }

  // 更新项目信息
  if (assetsSidebar.projectName) {
    assetsSidebar.projectName.textContent = projectName;
  }

  // 显示侧边窗体
  assetsSidebar.sidebar.style.display = 'flex';

  // 使用 requestAnimationFrame 确保动画流畅
  requestAnimationFrame(() => {
    assetsSidebar.sidebar.classList.remove('hidden');
  });

  // 加载素材列表
  loadAssetsList(projectId);
}

/**
 * 关闭素材库侧边窗体
 */
function closeAssetsSidebar() {
  if (!assetsSidebar.sidebar) return;

  assetsSidebar.sidebar.classList.add('hidden');
  
  // 等待动画完成后隐藏
  setTimeout(() => {
    if (assetsSidebar.sidebar) {
      assetsSidebar.sidebar.style.display = 'none';
    }
  }, 300);

  currentProjectId = null;
}

/**
 * 加载素材列表
 * @param {string} projectId - 项目 ID
 */
async function loadAssetsList(projectId) {
  if (!assetsSidebar.list) return;

  assetsSidebar.list.innerHTML = '<div class="placeholder-text">加载中...</div>';

  try {
    // 从状态管理器获取当前项目目录
    const state = window.getState();
    const project = state.projects?.find(p => p.id === projectId);

    if (!project || !project.projectDir) {
      // 如果没有项目目录，使用示例数据
      console.warn('[projectAssets] 项目目录不存在，使用示例数据');
      const assets = getMockAssets();
      renderProjectAssetsList(assets);
      return;
    }

    // 调用 Electron API 获取真实素材列表
    const result = await window.electronAPI.getAssets(project.projectDir);

    if (result.success && result.assets) {
      renderProjectAssetsList(result.assets);
    } else {
      console.error('[projectAssets] 获取素材失败:', result.error);
      renderProjectAssetsList({ images: [], videos: [], audios: [] });
    }
  } catch (error) {
    console.error('[projectAssets] 加载素材列表异常:', error);
    // 使用示例数据作为后备
    const assets = getMockAssets();
    renderProjectAssetsList(assets);
  }
}

/**
 * 刷新项目素材列表（由外部调用，如片段素材上传成功后）
 */
function refreshProjectAssetsList() {
  if (currentProjectId) {
    console.log('[refreshProjectAssetsList] 刷新项目素材列表');
    loadAssetsList(currentProjectId);
  }
}

// 导出刷新函数到 window 对象
window.refreshProjectAssetsList = refreshProjectAssetsList;

/**
 * 绑定缩略图点击事件
 */
function bindThumbnailClickEvents() {
  const thumbnails = document.querySelectorAll('.asset-thumbnail');
  thumbnails.forEach(thumb => {
    // 左键点击 - 预览
    thumb.addEventListener('click', () => {
      const assetType = thumb.dataset.assetType;
      const assetName = thumb.dataset.assetName;
      const assetSize = thumb.dataset.assetSize;
      const assetPath = thumb.dataset.assetPath;
      showPreview(assetType, assetName, assetSize, assetPath);
    });

    // 右键点击 - 上下文菜单
    thumb.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showContextMenu(e, {
        type: thumb.dataset.assetType,
        name: thumb.dataset.assetName,
        size: thumb.dataset.assetSize,
        path: thumb.dataset.assetPath
      });
    });
    
    // 支持拖放
    thumb.setAttribute('draggable', 'true');
    thumb.addEventListener('dragstart', (e) => {
      const assetData = {
        source: thumb.dataset.assetSource || 'project',
        type: thumb.dataset.assetType,
        name: thumb.dataset.assetName,
        path: thumb.dataset.assetPath,
        size: thumb.dataset.assetSize
      };
      e.dataTransfer.setData('text/asset-data', JSON.stringify(assetData));
      e.dataTransfer.effectAllowed = 'copy';
    });
  });
}

/**
 * 显示右键菜单
 * @param {MouseEvent} e - 鼠标事件
 * @param {Object} asset - 素材信息
 */
function showContextMenu(e, asset) {
  const contextMenu = document.getElementById('project-asset-context-menu');
  if (!contextMenu) return;

  // 存储当前选中的素材信息
  contextMenu.dataset.assetType = asset.type;
  contextMenu.dataset.assetName = asset.name;
  contextMenu.dataset.assetSize = asset.size;
  contextMenu.dataset.assetPath = asset.path;
  contextMenu.dataset.assetSource = asset.source || 'project';

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
function hideContextMenu() {
  const contextMenu = document.getElementById('project-asset-context-menu');
  if (contextMenu) {
    contextMenu.style.display = 'none';
  }
}

/**
 * 初始化右键菜单事件
 */
function initContextMenuEvents() {
  const contextMenu = document.getElementById('project-asset-context-menu');
  if (!contextMenu) return;

  // 菜单项点击事件
  contextMenu.addEventListener('click', async (e) => {
    const menuItem = e.target.closest('.context-menu-item');
    if (!menuItem) return;

    const action = menuItem.dataset.action;
    const assetType = contextMenu.dataset.assetType;
    const assetName = contextMenu.dataset.assetName;
    const assetSize = contextMenu.dataset.assetSize;
    const assetPath = contextMenu.dataset.assetPath;
    const assetSource = contextMenu.dataset.assetSource;

    if (action === 'view') {
      showPreview(assetType, assetName, assetSize, assetPath);
      hideContextMenu();
    } else if (action === 'delete') {
      // 片段素材不允许在项目素材库删除
      if (assetSource === 'shot') {
        window.showToast(`⚠️ 片段素材不允许在项目素材库删除\n\n请使用片段素材库管理此素材`);
        hideContextMenu();
        return;
      }

      const result = await confirmDeleteAsset(assetType, assetName, assetPath);
      if (result !== false) {
        hideContextMenu();
      }
    }
  });

  // 点击其他地方关闭菜单
  document.addEventListener('click', hideContextMenu);
  document.addEventListener('scroll', hideContextMenu);
}

/**
 * 提取视频第一帧作为缩略图
 * @param {HTMLVideoElement} video - 视频元素
 */
function extractVideoFrame(video) {
  try {
    // 检查是否已经处理过
    if (video.dataset.frameExtracted === 'true') {
      return;
    }
    
    // 检查是否正在处理中
    if (video.dataset.extracting === 'true') {
      return;
    }
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // 等待视频元数据加载完成
    if (video.readyState < 2) {
      video.onloadedmetadata = () => extractVideoFrame(video);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 检测画面是否为全黑
    function isFrameBlack() {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      let totalBrightness = 0;
      const threshold = 30;

      for (let i = 0; i < data.length; i += 64) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
        totalBrightness += brightness;
      }

      const avgBrightness = totalBrightness / (data.length / 64);
      return avgBrightness < threshold;
    }

    // 使用当前帧
    function useCurrentFrame() {
      // 再次检查是否已经处理过
      if (video.dataset.frameExtracted === 'true') {
        return;
      }
      
      // 检查视频元素是否还在 DOM 中
      if (!video || !video.parentNode || !document.contains(video)) {
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 转换为图片
      const img = document.createElement('img');
      img.src = canvas.toDataURL('image/jpeg', 0.8);
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.dataset.frameExtracted = 'true';

      // 标记为已完成，防止重复处理
      video.dataset.frameExtracted = 'true';
      video.dataset.extracting = 'false';

      // 替换 video 元素
      try {
        video.parentNode.replaceChild(img, video);
      } catch (error) {
        console.error('提取视频封面失败:', error.message);
      }
    }

    // 标记为正在处理
    video.dataset.extracting = 'true';
    
    let seekCount = 0;
    const maxSeeks = 2; // 最多跳转 2 次

    // 只尝试一次，不循环跳转
    video.onseeked = function() {
      seekCount++;
      
      // 检查元素是否还在 DOM 中
      if (!video || !document.contains(video)) {
        return;
      }
      
      // 防止超过最大跳转次数
      if (seekCount > maxSeeks) {
        video.dataset.extracting = 'false';
        return;
      }

      if (isFrameBlack()) {
        // 是黑场，跳转到 1 秒再试一次
        video.currentTime = 1.0;
        video.onseeked = function() {
          seekCount++;
          if (!video || !document.contains(video)) {
            return;
          }
          if (seekCount > maxSeeks) {
            video.dataset.extracting = 'false';
            return;
          }
          if (isFrameBlack()) {
            // 还是黑场，使用当前帧
            useCurrentFrame();
          } else {
            useCurrentFrame();
          }
        };
      } else {
        // 不是黑场，直接使用
        useCurrentFrame();
      }
    };

    // 开始尝试
    video.currentTime = 0.1;

  } catch (error) {
    console.error('提取视频封面失败:', error);
  }
}

/**
 * 根据类型渲染素材列表
 * @param {string} type - 类型 (all/images/videos/audios)
 */
function renderAssetsListByType(type) {
  if (!currentProjectId) return;

  // 使用缓存的真实数据
  const assets = currentAssetsData;

  if (type === 'all') {
    renderProjectAssetsList(assets, true, true);  // 缓存并更新计数
  } else if (type === 'images') {
    renderProjectAssetsList({ images: assets.images || [], videos: [], audios: [] }, false, false);  // 不缓存不更新计数
  } else if (type === 'videos') {
    renderProjectAssetsList({ images: [], videos: assets.videos || [], audios: [] }, false, false);  // 不缓存不更新计数
  } else if (type === 'audios') {
    renderProjectAssetsList({ images: [], videos: [], audios: assets.audios || [] }, false, false);  // 不缓存不更新计数
  }
}

/**
 * 根据关键词过滤素材
 * @param {string} keyword - 搜索关键词
 */
function filterAssetsByKeyword(keyword) {
  if (!currentProjectId) return;

  // 使用缓存的真实数据
  const assets = currentAssetsData;

  if (keyword === '') {
    // 清空搜索，显示全部素材并更新计数
    renderProjectAssetsList(assets, false, true);
    return;
  }

  const filteredAssets = {
    images: assets.images.filter(item => item.name.toLowerCase().includes(keyword)),
    videos: assets.videos.filter(item => item.name.toLowerCase().includes(keyword)),
    audios: assets.audios.filter(item => item.name.toLowerCase().includes(keyword))
  };

  // 渲染过滤后的素材列表，并更新计数为过滤后的数量
  renderProjectAssetsList(filteredAssets, false, true);
}

/**
 * 更新素材计数
 * @param {Object} assets - 素材对象
 */
function updateAssetsCount(assets) {
  const counts = {
    all: (assets.images?.length || 0) + (assets.videos?.length || 0) + (assets.audios?.length || 0),
    images: assets.images?.length || 0,
    videos: assets.videos?.length || 0,
    audios: assets.audios?.length || 0
  };

  const countElements = {
    all: document.getElementById('assets-count-all'),
    images: document.getElementById('assets-count-images'),
    videos: document.getElementById('assets-count-videos'),
    audios: document.getElementById('assets-count-audios')
  };

  Object.keys(counts).forEach(key => {
    if (countElements[key]) {
      countElements[key].textContent = counts[key];
    }
  });
}

/**
 * 更新存储使用情况
 * @param {Object} assets - 素材对象
 */
function updateAssetsUsage(assets) {
  // 计算实际使用量
  let totalBytes = 0;
  
  if (assets.images) {
    totalBytes += assets.images.reduce((sum, item) => sum + (item.fileSize || 0), 0);
  }
  if (assets.videos) {
    totalBytes += assets.videos.reduce((sum, item) => sum + (item.fileSize || 0), 0);
  }
  if (assets.audios) {
    totalBytes += assets.audios.reduce((sum, item) => sum + (item.fileSize || 0), 0);
  }
  
  const usedMB = (totalBytes / (1024 * 1024)).toFixed(1);
  const limitMB = 500;
  const percentage = Math.min((totalBytes / (1024 * 1024)) / limitMB * 100, 100);

  if (assetsSidebar.usageFill) {
    assetsSidebar.usageFill.style.width = `${percentage}%`;
  }

  if (assetsSidebar.usageText) {
    assetsSidebar.usageText.textContent = `已用 ${usedMB}MB / 限制 ${limitMB}MB`;
  }
}

/**
 * 获取示例素材数据（临时）
 * @returns {Object} 素材对象
 */
function getMockAssets() {
  return {
    images: [
      { id: 'asset_img_001', name: 'img_01.jpg', size: '1.2MB', path: 'assets/images/img_01.jpg' },
      { id: 'asset_img_002', name: 'img_02.png', size: '2.3MB', path: 'assets/images/img_02.png' },
      { id: 'asset_img_003', name: 'img_03.jpg', size: '0.8MB', path: 'assets/images/img_03.jpg' },
      { id: 'asset_img_004', name: 'img_04.png', size: '1.5MB', path: 'assets/images/img_04.png' }
    ],
    videos: [
      { id: 'asset_vid_001', name: 'vid_01.mp4', size: '5.2MB', path: 'assets/videos/vid_01.mp4' },
      { id: 'asset_vid_002', name: 'vid_02.mp4', size: '8.1MB', path: 'assets/videos/vid_02.mp4' }
    ],
    audios: [
      { id: 'asset_aud_001', name: 'aud_01.mp3', size: '3.1MB', path: 'assets/audios/aud_01.mp3' },
      { id: 'asset_aud_002', name: 'aud_02.mp3', size: '2.7MB', path: 'assets/audios/aud_02.mp3' }
    ]
  };
}

/**
 * 显示素材预览
 * @param {string} type - 素材类型 (image/video/audio)
 * @param {string} name - 素材名称
 * @param {string} size - 素材大小
 * @param {string} path - 素材路径
 */
function showPreview(type, name, size, path) {
  if (!previewModal.modal || !previewModal.container) return;

  let previewHTML = '';

  if (type === 'image') {
    previewHTML = `<img src="${path}" alt="${name}" />`;
  } else if (type === 'video') {
    previewHTML = `
      <video controls autoplay>
        <source src="${path}" type="video/mp4">
        您的浏览器不支持视频播放
      </video>
    `;
  } else if (type === 'audio') {
    previewHTML = `
      <div class="audio-player">
        <span class="audio-icon">🎵</span>
        <audio controls autoplay>
          <source src="${path}" type="audio/mpeg">
          您的浏览器不支持音频播放
        </audio>
      </div>
    `;
  }

  previewModal.container.innerHTML = previewHTML;
  previewModal.container.dataset.assetPath = path;
  previewModal.container.dataset.assetType = type;
  previewModal.container.dataset.assetName = name;

  if (previewModal.title) {
    previewModal.title.textContent = name;
  }
  if (previewModal.name) {
    previewModal.name.textContent = name;
  }
  if (previewModal.size) {
    previewModal.size.textContent = size;
  }

  // 显示模态框
  previewModal.modal.style.display = 'flex';
}

/**
 * 隐藏素材预览
 */
function hidePreview() {
  if (!previewModal.modal) return;

  previewModal.modal.style.display = 'none';
  if (previewModal.container) {
    previewModal.container.innerHTML = '';
    previewModal.container.dataset.assetPath = '';
    previewModal.container.dataset.assetType = '';
    previewModal.container.dataset.assetName = '';
  }
}

/**
 * 确认删除素材
 * @param {string} assetType - 素材类型 (image/video/audio)
 * @param {string} assetName - 素材名称
 * @param {string} assetPath - 素材路径
 */
async function confirmDeleteAsset(assetType, assetName, assetPath) {
  if (!assetPath) {
    window.showToast('素材路径无效');
    return false;
  }

  // 检查素材来源
  const state = window.getState();
  const assets = currentAssetsData;
  const allAssets = [...(assets.images || []), ...(assets.videos || []), ...(assets.audios || [])];
  const currentAsset = allAssets.find(a => a.path === assetPath);

  // 如果是片段素材，不允许删除
  if (currentAsset && currentAsset.source === 'shot') {
    window.showToast(`⚠️ 片段素材不允许在项目素材库删除\n\n该素材属于片段：${currentAsset.shotId || '未知'}`);
    return false;
  }

  // 检查素材是否被镜头引用
  const isReferenced = checkAssetReference(assetPath);

  const confirmMsg = isReferenced
    ? `⚠️ 该素材正被镜头引用，删除后可能导致引用失效。\n\n确定要删除 "${assetName}" 吗？`
    : `确定要删除 "${assetName}" 吗？\n\n此操作将永久删除文件，无法恢复。`;

  const confirmed = await window.showConfirm(confirmMsg);

  if (confirmed) {
    deleteAsset(assetType, assetName, assetPath);
    return true;
  }
  
  return false;
}

/**
 * 检查素材是否被镜头引用
 * @param {string} assetPath - 素材路径
 * @returns {boolean} 是否被引用
 */
function checkAssetReference(assetPath) {
  const state = window.getState();
  const projects = state.projects || [];

  // 遍历所有项目
  for (const project of projects) {
    const shots = project.shots || [];
    // 遍历所有片段
    for (const shot of shots) {
      const scenes = shot.scenes || [];
      // 遍历所有镜头
      for (const scene of scenes) {
        // 检查镜头的素材字段是否包含该路径
        if (scene.materials && Array.isArray(scene.materials)) {
          if (scene.materials.some(m => m.path === assetPath)) {
            return true;
          }
        }
        // 检查提示词中是否包含路径
        if (scene.content && scene.content.includes(assetPath)) {
          return true;
        }
        // 检查分镜图片是否引用该路径
        if (scene.storyboardImage && scene.storyboardImage.path === assetPath) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * 删除素材
 * @param {string} assetType - 素材类型 (image/video/audio)
 * @param {string} assetName - 素材名称
 * @param {string} assetPath - 素材路径
 */
async function deleteAsset(assetType, assetName, assetPath) {
  const state = window.getState();
  const project = state.currentProject;

  if (!project || !project.projectDir) {
    window.showToast('请先选择项目');
    return;
  }

  try {
    // 先清空所有引用该素材的镜头分镜图片
    await clearStoryboardImageReferences(assetPath);

    // 调用 Electron API 删除素材
    const result = await window.electronAPI.deleteAsset({
      projectDir: project.projectDir,
      assetPath: assetPath,
      assetType: assetType
    });

    if (result.success) {
      window.showToast(`已删除 "${assetName}"`);
      // 重新加载素材列表
      loadAssetsList(currentProjectId);
      // 如果预览模态框打开，关闭它
      hidePreview();
    } else {
      window.showToast(`删除失败：${result.error}`);
    }
  } catch (error) {
    console.error('[deleteAsset] 删除异常:', error);
    window.showToast('删除失败，请重试');
  }
}

/**
 * 清空所有引用该素材路径的镜头分镜图片
 * @param {string} assetPath - 素材路径
 */
async function clearStoryboardImageReferences(assetPath) {
  const state = window.getState();
  const projectData = state.projectData || state.currentProject;

  if (!projectData || !projectData.project?.projectDir) {
    return;
  }

  let hasChanges = false;
  const affectedScenes = [];

  // 遍历所有片段和镜头
  for (const shot of projectData.shots || []) {
    for (const scene of shot.scenes || []) {
      // 检查分镜图片是否引用该路径
      if (scene.storyboardImage && scene.storyboardImage.path === assetPath) {
        // 清空分镜图片引用
        scene.storyboardImage = null;
        hasChanges = true;
        affectedScenes.push({ shotId: shot.id, sceneId: scene.id, sceneName: scene.name });
        console.log('[clearStoryboardImageReferences] 清空分镜图片引用:', shot.name, '-', scene.name);
      }
    }
  }

  // 如果有修改，保存项目
  if (hasChanges) {
    try {
      // 同步更新 currentProject
      if (state.currentProject && state.currentProject.shots) {
        for (const shot of state.currentProject.shots || []) {
          for (const scene of shot.scenes || []) {
            if (scene.storyboardImage && scene.storyboardImage.path === assetPath) {
              scene.storyboardImage = null;
            }
          }
        }
      }

      // 保存项目
      const projectJson = {
        project: projectData.project || projectData,
        shots: projectData.shots || [],
        promptTemplates: projectData.promptTemplates || [],
        selected: projectData.selected || {},
        theme: projectData.theme || {}
      };

      await window.electronAPI.saveProject(projectData.project.projectDir, projectJson);

      // 重新加载项目数据
      const loadResult = await window.electronAPI.loadProject(projectData.project.projectDir);
      if (loadResult.success && loadResult.projectJson) {
        window.updateState('projectData', loadResult.projectJson);
        window.updateState('currentProject', loadResult.projectJson);

        // 更新 projects 列表
        const projects = state.projects || [];
        const index = projects.findIndex(p => p.projectDir === projectData.project.projectDir);
        if (index !== -1) {
          projects[index] = { ...projects[index], ...loadResult.projectJson.project };
          window.updateState('projects', projects);
        }
      }

      // 刷新镜头列表
      if (window.renderShotList) {
        window.renderShotList();
      }

      // 刷新属性面板
      if (window.renderSceneProperties) {
        const currentScene = state.currentScene;
        if (currentScene && affectedScenes.some(s => s.sceneId === currentScene.id)) {
          window.renderSceneProperties(currentScene);
        }
      }

      console.log('[clearStoryboardImageReferences] 已清空', affectedScenes.length, '个镜头的分镜图片引用');
    } catch (error) {
      console.error('[clearStoryboardImageReferences] 保存项目失败:', error);
    }
  }
}

// 导出到 window 对象
window.openAssetsSidebar = openAssetsSidebar;
window.closeAssetsSidebar = closeAssetsSidebar;
window.initAssetsSidebar = initAssetsSidebar;
window.showPreview = showPreview;
window.hidePreview = hidePreview;
window.extractVideoFrame = extractVideoFrame;
