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

  // 绑定关闭按钮事件
  if (assetsSidebar.closeBtn) {
    assetsSidebar.closeBtn.addEventListener('click', closeAssetsSidebar);
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

  // TODO: 从文件系统读取素材索引
  // 暂时使用示例数据
  const assets = getMockAssets();

  renderAssetsList(assets);
}

/**
 * 渲染素材列表
 * @param {Object} assets - 素材对象 { images, videos, audios }
 */
function renderAssetsList(assets) {
  if (!assetsSidebar.list) return;

  assetsSidebar.list.innerHTML = '';

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
        <div class="asset-thumbnail" data-asset-id="${item.id}" data-asset-type="${type}">
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

/**
 * 根据类型渲染素材列表
 * @param {string} type - 类型 (all/images/videos/audios)
 */
function renderAssetsListByType(type) {
  if (!currentProjectId) return;

  const assets = getMockAssets();

  if (type === 'all') {
    renderAssetsList(assets);
  } else if (type === 'images') {
    renderAssetsList({ images: assets.images, videos: [], audios: [] });
  } else if (type === 'videos') {
    renderAssetsList({ images: [], videos: assets.videos, audios: [] });
  } else if (type === 'audios') {
    renderAssetsList({ images: [], videos: [], audios: assets.audios });
  }
}

/**
 * 根据关键词过滤素材
 * @param {string} keyword - 搜索关键词
 */
function filterAssetsByKeyword(keyword) {
  if (!currentProjectId) return;

  const assets = getMockAssets();
  
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
  // TODO: 计算实际使用量
  const usedMB = 45; // 示例数据
  const limitMB = 500;
  const percentage = (usedMB / limitMB) * 100;

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

// 导出到 window 对象
window.openAssetsSidebar = openAssetsSidebar;
window.closeAssetsSidebar = closeAssetsSidebar;
window.initAssetsSidebar = initAssetsSidebar;
