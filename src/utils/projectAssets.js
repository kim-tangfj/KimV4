//
// Kim 澶氱骇鍒嗛暅鎻愮ず璇嶅姪鎵?- 椤圭洰绱犳潗搴撴ā鍧?// 璐熻矗绱犳潗搴撲晶杈圭獥浣撶殑鏄剧ず銆侀殣钘忋€佺礌鏉愬垪琛ㄦ覆鏌撶瓑鍔熻兘
//

/**
 * 绱犳潗搴撲晶杈圭獥浣撳厓绱? */
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
 * 绱犳潗棰勮妯℃€佹鍏冪礌
 */
const previewModal = {
  modal: null,
  container: null,
  name: null,
  size: null,
  closeBtn: null
};

/**
 * 褰撳墠鎵撳紑绱犳潗搴撶殑椤圭洰 ID
 */
let currentProjectId = null;

/**
 * 褰撳墠绱犳潗鏁版嵁缂撳瓨
 */
let currentAssetsData = { images: [], videos: [], audios: [] };

/**
 * 娓叉煋绱犳潗鍒嗙被
 * @param {string} title - 鍒嗙被鏍囬
 * @param {Array} items - 绱犳潗鏁扮粍
 * @param {string} type - 绱犳潗绫诲瀷 (image/video/audio)
 */
const renderAssetsSection = function(title, items, type) {
  const icons = {
    image: '馃柤锔?,
    video: '馃幀',
    audio: '馃幍'
  };

  return `
    <div class="assets-section-title">${title}</div>
    <div class="assets-grid assets-grid-${type}s">
      ${items.map((item, index) => `
        <div class="asset-thumbnail" data-asset-id="${item.id}" data-asset-type="${type}" data-asset-name="${item.name}" data-asset-size="${item.size}" data-asset-path="${item.path}">
          ${type === 'image'
            ? `<img src="${item.path}" alt="${item.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2280%22>馃柤锔?/text></svg>'" />`
            : type === 'video'
              ? `<video src="${item.path}" preload="auto" muted oncanplay="window.extractVideoFrame(this)" onerror="this.parentElement.innerHTML='<div class=\\'video-thumbnail\\'>${icons[type]}</div>'"></video>`
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
 * 娓叉煋绱犳潗鍒楄〃
 * @param {Object} assets - 绱犳潗瀵硅薄 { images, videos, audios }
 * @param {boolean} cacheData - 鏄惁缂撳瓨鏁版嵁锛堥粯璁?true锛? * @param {boolean} updateCount - 鏄惁鏇存柊璁℃暟锛堥粯璁?true锛? */
const renderProjectAssetsList = function(assets, cacheData = true, updateCount = true) {
  if (!assetsSidebar.list) return;

  assetsSidebar.list.innerHTML = '';

  // 缂撳瓨褰撳墠绱犳潗鏁版嵁
  if (cacheData) {
    currentAssetsData = {
      images: assets.images || [],
      videos: assets.videos || [],
      audios: assets.audios || []
    };
  }

  let totalCount = 0;

  // 娓叉煋鍥剧墖
  if (assets.images && assets.images.length > 0) {
    totalCount += assets.images.length;
    assetsSidebar.list.innerHTML += renderAssetsSection('鍥剧墖', assets.images, 'image');
  }

  // 娓叉煋瑙嗛
  if (assets.videos && assets.videos.length > 0) {
    totalCount += assets.videos.length;
    assetsSidebar.list.innerHTML += renderAssetsSection('瑙嗛', assets.videos, 'video');
  }

  // 娓叉煋闊抽
  if (assets.audios && assets.audios.length > 0) {
    totalCount += assets.audios.length;
    assetsSidebar.list.innerHTML += renderAssetsSection('闊抽', assets.audios, 'audio');
  }

  if (totalCount === 0) {
    assetsSidebar.list.innerHTML = '<div class="placeholder-text">鏆傛棤绱犳潗锛岀偣鍑?涓婁紶绱犳潗"娣诲姞</div>';
  }

  // 鏇存柊璁℃暟
  if (updateCount) {
    updateAssetsCount(assets);
  }

  // 鏇存柊瀛樺偍浣跨敤鎯呭喌
  updateAssetsUsage(assets);

  // 缁戝畾缂╃暐鍥剧偣鍑讳簨浠?  bindThumbnailClickEvents();
}

/**
 * 鍒濆鍖栫礌鏉愬簱渚ц竟绐椾綋
 */
function initAssetsSidebar() {
  // 缂撳瓨鍏冪礌
  assetsSidebar.sidebar = document.getElementById('project-assets-sidebar');
  assetsSidebar.projectName = document.getElementById('assets-project-name');
  assetsSidebar.searchInput = document.getElementById('assets-search-input');
  assetsSidebar.categories = document.querySelectorAll('.assets-category');
  assetsSidebar.uploadBtn = document.getElementById('assets-upload-btn');
  assetsSidebar.list = document.getElementById('assets-list');
  assetsSidebar.usageFill = document.getElementById('assets-usage-fill');
  assetsSidebar.usageText = document.getElementById('assets-usage-text');
  assetsSidebar.closeBtn = document.querySelector('.assets-sidebar-close');
  
  // 缂撳瓨棰勮妯℃€佹鍏冪礌
  previewModal.modal = document.getElementById('asset-preview-modal');
  previewModal.container = document.getElementById('asset-preview-container');
  previewModal.name = document.getElementById('asset-preview-name');
  previewModal.size = document.getElementById('asset-preview-size');
  previewModal.closeBtn = document.getElementById('asset-preview-close-btn');
  previewModal.title = document.getElementById('asset-preview-title');
  previewModal.copyPathBtn = document.getElementById('asset-preview-copy-path-btn');
  previewModal.deleteBtn = document.getElementById('asset-preview-delete-btn');

  // 缁戝畾鍏抽棴鎸夐挳浜嬩欢
  if (assetsSidebar.closeBtn) {
    assetsSidebar.closeBtn.addEventListener('click', closeAssetsSidebar);
  }

  // 缁戝畾妯℃€佹鍏抽棴鎸夐挳浜嬩欢
  if (previewModal.closeBtn) {
    previewModal.closeBtn.addEventListener('click', hidePreview);
  }

  // 缁戝畾妯℃€佹閬僵灞傜偣鍑诲叧闂?  if (previewModal.modal) {
    previewModal.modal.addEventListener('click', (e) => {
      if (e.target === previewModal.modal || e.target.classList.contains('modal-overlay')) {
        hidePreview();
      }
    });
  }

  // 缁戝畾澶嶅埗璺緞鎸夐挳浜嬩欢
  if (previewModal.copyPathBtn) {
    previewModal.copyPathBtn.addEventListener('click', () => {
      const path = previewModal.container.dataset.assetPath;
      if (path) {
        navigator.clipboard.writeText(path)
          .then(() => window.showToast('璺緞宸插鍒跺埌鍓创鏉?))
          .catch(() => window.showToast('澶嶅埗澶辫触'));
      }
    });
  }

  // 缁戝畾鍒犻櫎鎸夐挳浜嬩欢锛堥」鐩礌鏉愬簱鏆備笉瀹炵幇鍒犻櫎锛屼粎鎻愮ず锛?  if (previewModal.deleteBtn) {
    previewModal.deleteBtn.addEventListener('click', () => {
      window.showToast('椤圭洰绱犳潗搴撳垹闄ゅ姛鑳藉緟瀹炵幇');
    });
  }

  // 缁戝畾鍒嗙被绛涢€変簨浠?  assetsSidebar.categories.forEach(category => {
    category.addEventListener('click', () => {
      assetsSidebar.categories.forEach(c => c.classList.remove('active'));
      category.classList.add('active');
      const type = category.dataset.type;
      renderAssetsListByType(type);
    });
  });

  // 缁戝畾鎼滅储妗嗕簨浠?  if (assetsSidebar.searchInput) {
    assetsSidebar.searchInput.addEventListener('input', (e) => {
      const keyword = e.target.value.toLowerCase();
      filterAssetsByKeyword(keyword);
    });
  }
}

/**
 * 鎵撳紑绱犳潗搴撲晶杈圭獥浣? * @param {string} projectId - 椤圭洰 ID
 * @param {string} projectName - 椤圭洰鍚嶇О
 */
function openAssetsSidebar(projectId, projectName) {
  if (!assetsSidebar.sidebar) {
    initAssetsSidebar();
  }

  currentProjectId = projectId;

  // 鏇存柊椤圭洰淇℃伅
  if (assetsSidebar.projectName) {
    assetsSidebar.projectName.textContent = projectName;
  }

  // 鏄剧ず渚ц竟绐椾綋
  assetsSidebar.sidebar.style.display = 'flex';

  // 浣跨敤 requestAnimationFrame 纭繚鍔ㄧ敾娴佺晠
  requestAnimationFrame(() => {
    assetsSidebar.sidebar.classList.remove('hidden');
  });

  // 鍔犺浇绱犳潗鍒楄〃
  loadAssetsList(projectId);
}

/**
 * 鍏抽棴绱犳潗搴撲晶杈圭獥浣? */
function closeAssetsSidebar() {
  if (!assetsSidebar.sidebar) return;

  assetsSidebar.sidebar.classList.add('hidden');
  
  // 绛夊緟鍔ㄧ敾瀹屾垚鍚庨殣钘?  setTimeout(() => {
    if (assetsSidebar.sidebar) {
      assetsSidebar.sidebar.style.display = 'none';
    }
  }, 300);

  currentProjectId = null;
}

/**
 * 鍔犺浇绱犳潗鍒楄〃
 * @param {string} projectId - 椤圭洰 ID
 */
async function loadAssetsList(projectId) {
  if (!assetsSidebar.list) return;

  assetsSidebar.list.innerHTML = '<div class="placeholder-text">鍔犺浇涓?..</div>';

  try {
    // 浠庣姸鎬佺鐞嗗櫒鑾峰彇褰撳墠椤圭洰鐩綍
    const state = window.getState();
    const project = state.projects?.find(p => p.id === projectId);

    if (!project || !project.projectDir) {
      // 濡傛灉娌℃湁椤圭洰鐩綍锛屼娇鐢ㄧず渚嬫暟鎹?      console.warn('[projectAssets] 椤圭洰鐩綍涓嶅瓨鍦紝浣跨敤绀轰緥鏁版嵁');
      const assets = getMockAssets();
      renderProjectAssetsList(assets);
      return;
    }

    // 璋冪敤 Electron API 鑾峰彇鐪熷疄绱犳潗鍒楄〃
    const result = await window.electronAPI.getAssets(project.projectDir);

    if (result.success && result.assets) {
      renderProjectAssetsList(result.assets);
    } else {
      console.error('[projectAssets] 鑾峰彇绱犳潗澶辫触:', result.error);
      renderProjectAssetsList({ images: [], videos: [], audios: [] });
    }
  } catch (error) {
    console.error('[projectAssets] 鍔犺浇绱犳潗鍒楄〃寮傚父:', error);
    // 浣跨敤绀轰緥鏁版嵁浣滀负鍚庡
    const assets = getMockAssets();
    renderProjectAssetsList(assets);
  }
}

/**
 * 缁戝畾缂╃暐鍥剧偣鍑讳簨浠? */
const bindThumbnailClickEvents = function() {
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
 * 鎻愬彇瑙嗛绗竴甯т綔涓虹缉鐣ュ浘
 * @param {HTMLVideoElement} video - 瑙嗛鍏冪礌
 */
function extractVideoFrame(video) {
  try {
    // 妫€鏌ユ槸鍚﹀凡缁忓鐞嗚繃
    if (video.dataset.frameExtracted === 'true') {
      return;
    }
    
    // 妫€鏌ユ槸鍚︽鍦ㄥ鐞嗕腑
    if (video.dataset.extracting === 'true') {
      return;
    }
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // 绛夊緟瑙嗛鍏冩暟鎹姞杞藉畬鎴?    if (video.readyState < 2) {
      video.onloadedmetadata = () => extractVideoFrame(video);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 妫€娴嬬敾闈㈡槸鍚︿负鍏ㄩ粦
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

    // 浣跨敤褰撳墠甯?    function useCurrentFrame() {
      // 鍐嶆妫€鏌ユ槸鍚﹀凡缁忓鐞嗚繃
      if (video.dataset.frameExtracted === 'true') {
        return;
      }
      
      // 妫€鏌ヨ棰戝厓绱犳槸鍚﹁繕鍦?DOM 涓?      if (!video || !video.parentNode || !document.contains(video)) {
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 杞崲涓哄浘鐗?      const img = document.createElement('img');
      img.src = canvas.toDataURL('image/jpeg', 0.8);
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.dataset.frameExtracted = 'true';

      // 鏍囪涓哄凡瀹屾垚锛岄槻姝㈤噸澶嶅鐞?      video.dataset.frameExtracted = 'true';
      video.dataset.extracting = 'false';

      // 鏇挎崲 video 鍏冪礌
      try {
        video.parentNode.replaceChild(img, video);
      } catch (error) {
        console.error('鎻愬彇瑙嗛灏侀潰澶辫触:', error.message);
      }
    }

    // 鏍囪涓烘鍦ㄥ鐞?    video.dataset.extracting = 'true';
    
    let seekCount = 0;
    const maxSeeks = 2; // 鏈€澶氳烦杞?2 娆?
    // 鍙皾璇曚竴娆★紝涓嶅惊鐜烦杞?    video.onseeked = function() {
      seekCount++;
      
      // 妫€鏌ュ厓绱犳槸鍚﹁繕鍦?DOM 涓?      if (!video || !document.contains(video)) {
        return;
      }
      
      // 闃叉瓒呰繃鏈€澶ц烦杞鏁?      if (seekCount > maxSeeks) {
        video.dataset.extracting = 'false';
        return;
      }

      if (isFrameBlack()) {
        // 鏄粦鍦猴紝璺宠浆鍒?1 绉掑啀璇曚竴娆?        video.currentTime = 1.0;
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
            // 杩樻槸榛戝満锛屼娇鐢ㄥ綋鍓嶅抚
            useCurrentFrame();
          } else {
            useCurrentFrame();
          }
        };
      } else {
        // 涓嶆槸榛戝満锛岀洿鎺ヤ娇鐢?        useCurrentFrame();
      }
    };

    // 寮€濮嬪皾璇?    video.currentTime = 0.1;

  } catch (error) {
    console.error('鎻愬彇瑙嗛灏侀潰澶辫触:', error);
  }
}

/**
 * 鏍规嵁绫诲瀷娓叉煋绱犳潗鍒楄〃
 * @param {string} type - 绫诲瀷 (all/images/videos/audios)
 */
const renderAssetsListByType = function(type) {
  if (!currentProjectId) return;

  // 浣跨敤缂撳瓨鐨勭湡瀹炴暟鎹?  const assets = currentAssetsData;

  if (type === 'all') {
    renderProjectAssetsList(assets, true, true);  // 缂撳瓨骞舵洿鏂拌鏁?  } else if (type === 'images') {
    renderProjectAssetsList({ images: assets.images || [], videos: [], audios: [] }, false, false);  // 涓嶇紦瀛樹笉鏇存柊璁℃暟
  } else if (type === 'videos') {
    renderProjectAssetsList({ images: [], videos: assets.videos || [], audios: [] }, false, false);  // 涓嶇紦瀛樹笉鏇存柊璁℃暟
  } else if (type === 'audios') {
    renderProjectAssetsList({ images: [], videos: [], audios: assets.audios || [] }, false, false);  // 涓嶇紦瀛樹笉鏇存柊璁℃暟
  }
}

/**
 * 鏍规嵁鍏抽敭璇嶈繃婊ょ礌鏉? * @param {string} keyword - 鎼滅储鍏抽敭璇? */
const filterAssetsByKeyword = function(keyword) {
  if (!currentProjectId) return;

  // 浣跨敤缂撳瓨鐨勭湡瀹炴暟鎹?  const assets = currentAssetsData;

  if (keyword === '') {
    // 娓呯┖鎼滅储锛屾樉绀哄叏閮ㄧ礌鏉愬苟鏇存柊璁℃暟
    renderProjectAssetsList(assets, false, true);
    return;
  }

  const filteredAssets = {
    images: assets.images.filter(item => item.name.toLowerCase().includes(keyword)),
    videos: assets.videos.filter(item => item.name.toLowerCase().includes(keyword)),
    audios: assets.audios.filter(item => item.name.toLowerCase().includes(keyword))
  };

  // 娓叉煋杩囨护鍚庣殑绱犳潗鍒楄〃锛屽苟鏇存柊璁℃暟涓鸿繃婊ゅ悗鐨勬暟閲?  renderProjectAssetsList(filteredAssets, false, true);
}

/**
 * 鏇存柊绱犳潗璁℃暟
 * @param {Object} assets - 绱犳潗瀵硅薄
 */
const updateAssetsCount = function(assets) {
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
 * 鏇存柊瀛樺偍浣跨敤鎯呭喌
 * @param {Object} assets - 绱犳潗瀵硅薄
 */
const updateAssetsUsage = function(assets) {
  // 璁＄畻瀹為檯浣跨敤閲?  let totalBytes = 0;
  
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
    assetsSidebar.usageText.textContent = `宸茬敤 ${usedMB}MB / 闄愬埗 ${limitMB}MB`;
  }
}

/**
 * 鑾峰彇绀轰緥绱犳潗鏁版嵁锛堜复鏃讹級
 * @returns {Object} 绱犳潗瀵硅薄
 */
const getMockAssets = function() {
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
 * 鏄剧ず绱犳潗棰勮
 * @param {string} type - 绱犳潗绫诲瀷 (image/video/audio)
 * @param {string} name - 绱犳潗鍚嶇О
 * @param {string} size - 绱犳潗澶у皬
 * @param {string} path - 绱犳潗璺緞
 */
const showPreview = function(type, name, size, path) {
  if (!previewModal.modal || !previewModal.container) return;

  let previewHTML = '';

  if (type === 'image') {
    previewHTML = `<img src="${path}" alt="${name}" />`;
  } else if (type === 'video') {
    previewHTML = `
      <video controls autoplay>
        <source src="${path}" type="video/mp4">
        鎮ㄧ殑娴忚鍣ㄤ笉鏀寔瑙嗛鎾斁
      </video>
    `;
  } else if (type === 'audio') {
    previewHTML = `
      <div class="audio-player">
        <span class="audio-icon">馃幍</span>
        <audio controls autoplay>
          <source src="${path}" type="audio/mpeg">
          鎮ㄧ殑娴忚鍣ㄤ笉鏀寔闊抽鎾斁
        </audio>
      </div>
    `;
  }

  previewModal.container.innerHTML = previewHTML;
  previewModal.container.dataset.assetPath = path;

  if (previewModal.title) {
    previewModal.title.textContent = name;
  }
  if (previewModal.name) {
    previewModal.name.textContent = name;
  }
  if (previewModal.size) {
    previewModal.size.textContent = size;
  }

  // 鏄剧ず妯℃€佹
  previewModal.modal.style.display = 'flex';
}

/**
 * 闅愯棌绱犳潗棰勮
 */
const hidePreview = function() {
  if (!previewModal.modal) return;

  previewModal.modal.style.display = 'none';
  if (previewModal.container) {
    previewModal.container.innerHTML = '';
    previewModal.container.dataset.assetPath = '';
  }
}

// 瀵煎嚭鍒?window 瀵硅薄
window.openAssetsSidebar = openAssetsSidebar;
window.closeAssetsSidebar = closeAssetsSidebar;
window.initAssetsSidebar = initAssetsSidebar;
window.showPreview = showPreview;
window.hidePreview = hidePreview;
window.extractVideoFrame = extractVideoFrame;

