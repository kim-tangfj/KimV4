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
  uploadBtn: null,
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
 * 初始化素材库侧边窗体
 */
function initAssetsSidebar() {
  // 缓存元素
  assetsSidebar.sidebar = document.getElementById('project-assets-sidebar');
  assetsSidebar.projectName = document.getElementById('assets-project-name');
  assetsSidebar.searchInput = document.getElementById('assets-search-input');
  assetsSidebar.categories = document.querySelectorAll('.assets-category');
  assetsSidebar.uploadBtn = document.getElementById('assets-upload-btn');
  assetsSidebar.list = document.getElementById('assets-list');
  assetsSidebar.usageFill = document.getElementById('assets-usage-fill');
  assetsSidebar.usageText = document.getElementById('assets-usage-text');
  assetsSidebar.closeBtn = document.querySelector('.assets-sidebar-close');
  
  // 缓存预览模态框元素
  previewModal.modal = document.getElementById('asset-preview-modal');
  previewModal.container = document.getElementById('asset-preview-container');
  previewModal.name = document.getElementById('asset-preview-name');
  previewModal.size = document.getElementById('asset-preview-size');
  previewModal.closeBtn = document.getElementById('close-asset-preview-btn');

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
      renderAssetsList(assets);
      return;
    }

    // 调用 Electron API 获取真实素材列表
    const result = await window.electronAPI.getAssets(project.projectDir);

    if (result.success && result.assets) {
      renderAssetsList(result.assets);
    } else {
      console.error('[projectAssets] 获取素材失败:', result.error);
      renderAssetsList({ images: [], videos: [], audios: [] });
    }
  } catch (error) {
    console.error('[projectAssets] 加载素材列表异常:', error);
    // 使用示例数据作为后备
    const assets = getMockAssets();
    renderAssetsList(assets);
  }
}

/**
 * 渲染素材列表
 * @param {Object} assets - 素材对象 { images, videos, audios }
 */
function renderAssetsList(assets) {
  if (!assetsSidebar.list) return;

  assetsSidebar.list.innerHTML = '';

  // 缓存当前素材数据
  currentAssetsData = {
    images: assets.images || [],
    videos: assets.videos || [],
    audios: assets.audios || []
  };

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
  updateAssetsCount(assets);

  // 更新存储使用情况
  updateAssetsUsage(assets);

  // 绑定缩略图点击事件
  bindThumbnailClickEvents();
}

/**
 * 绑定缩略图点击事件
 */
function bindThumbnailClickEvents() {
  const thumbnails = document.querySelectorAll('.asset-thumbnail');
  thumbnails.forEach(thumb => {
    thumb.addEventListener('click', () => {
      const assetType = thumb.dataset.assetType;
      const assetName = thumb.dataset.assetName;
      const assetSize = thumb.dataset.assetSize;
      const assetPath = thumb.dataset.assetPath;
      showPreview(assetType, assetName, assetSize, assetPath);
    });
  });
}

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
      ${items.map(item => `
        <div class="asset-thumbnail" data-asset-id="${item.id}" data-asset-type="${type}" data-asset-name="${item.name}" data-asset-size="${item.size}" data-asset-path="${item.path}">
          ${type === 'image'
            ? `<img src="${item.path}" alt="${item.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2280%22>🖼️</text></svg>'" />`
            : `<div class="${type}-thumbnail">${icons[type]}</div>`
          }
          <div class="asset-info">
            <span class="asset-name">${item.name}</span>
            <span class="asset-size">${item.size}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// 当前素材数据缓存
let currentAssetsData = { images: [], videos: [], audios: [] };

/**
 * 根据类型渲染素材列表
 * @param {string} type - 类型 (all/images/videos/audios)
 */
function renderAssetsListByType(type) {
  if (!currentProjectId) return;

  console.log('[renderAssetsListByType] type:', type);
  console.log('[renderAssetsListByType] currentAssetsData:', JSON.stringify(currentAssetsData, null, 2));

  // 使用缓存的真实数据
  const assets = currentAssetsData;

  if (type === 'all') {
    renderAssetsList(assets);
  } else if (type === 'images') {
    renderAssetsList({ images: assets.images || [], videos: [], audios: [] });
  } else if (type === 'videos') {
    renderAssetsList({ images: [], videos: assets.videos || [], audios: [] });
  } else if (type === 'audios') {
    renderAssetsList({ images: [], videos: [], audios: assets.audios || [] });
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
    renderAssetsList(assets);
    return;
  }

  const filteredAssets = {
    images: assets.images.filter(item => item.name.toLowerCase().includes(keyword)),
    videos: assets.videos.filter(item => item.name.toLowerCase().includes(keyword)),
    audios: assets.audios.filter(item => item.name.toLowerCase().includes(keyword))
  };

  renderAssetsList(filteredAssets);
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
  }
}

// 导出到 window 对象
window.openAssetsSidebar = openAssetsSidebar;
window.closeAssetsSidebar = closeAssetsSidebar;
window.initAssetsSidebar = initAssetsSidebar;
window.showPreview = showPreview;
window.hidePreview = hidePreview;
