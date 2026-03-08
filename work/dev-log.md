# 开发日志

记录每次开发迭代的需求和处理内容。

---

## 2026-03-08 - 修复预览模态框删除按钮无效

### 问题
预览模态框中的删除按钮点击无效

### 原因
`showPreview` 函数只设置了 `dataset.assetPath`，未设置 `dataset.assetType` 和 `dataset.assetName`

### 修复
在 `showPreview` 函数中添加：
```javascript
previewModal.container.dataset.assetType = type;
previewModal.container.dataset.assetName = name;
```

---

## 2026-03-08 - 实现素材删除功能（右键菜单 + 预览删除）

### 需求
实现项目素材库的删除功能，支持：
1. 右键素材显示上下文菜单（查看/删除）
2. 预览模态框删除按钮
3. 删除前检查素材是否被镜头引用
4. 删除确认对话框

### 修改文件

| 文件 | 变更 | 说明 |
|------|------|------|
| `index.html` | +5 行 | 新增右键菜单 HTML |
| `styles.css` | +35 行 | 右键菜单样式 + 深色主题适配 |
| `src/preload.js` | +2 行 | 暴露 `deleteAsset` API |
| `src/handlers/project.js` | +30 行 | 新增 `project:deleteAsset` IPC 处理器 |
| `src/utils/projectAssets.js` | +100 行 | 右键菜单 + 删除功能实现 |

### 核心实现

#### 1. HTML - 右键菜单
```html
<div id="asset-context-menu" class="context-menu">
  <div class="context-menu-item" data-action="view">👁️ 查看</div>
  <div class="context-menu-item" data-action="delete">🗑️ 删除</div>
</div>
```

#### 2. CSS - 右键菜单样式
```css
.context-menu {
  position: fixed;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10000;
}

.context-menu-item[data-action="delete"] {
  color: #d32f2f;
}
```

#### 3. projectAssets.js - 右键菜单功能
```javascript
// 右键点击素材
thumb.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  showContextMenu(e, { type, name, size, path });
});

// 菜单项点击
if (action === 'view') {
  showPreview(...);
} else if (action === 'delete') {
  confirmDeleteAsset(...);
}
```

#### 4. 删除确认与引用检查
```javascript
function confirmDeleteAsset(assetType, assetName, assetPath) {
  // 检查是否被镜头引用
  const isReferenced = checkAssetReference(assetPath);
  
  const confirmMsg = isReferenced
    ? `⚠️ 该素材正被镜头引用，删除后可能导致引用失效。`
    : `确定要删除吗？此操作无法恢复。`;
  
  if (window.confirm(confirmMsg)) {
    deleteAsset(...);
  }
}

function checkAssetReference(assetPath) {
  // 遍历所有项目的镜头
  // 检查 materials 字段和 content 字段是否包含该路径
}
```

#### 5. 主进程删除处理器
```javascript
ipcMain.handle('project:deleteAsset', async (event, params) => {
  const { projectDir, assetPath, assetType } = params;
  
  // 安全验证：防止目录遍历攻击
  const normalizedPath = path.normalize(assetPath);
  if (!normalizedPath.startsWith(assetsDir)) {
    throw new Error('非法的文件路径');
  }
  
  // 删除文件
  fs.unlinkSync(normalizedPath);
  
  return { success: true };
});
```

### 功能特性
- ✅ 右键素材显示上下文菜单（查看/删除）
- ✅ 预览模态框删除按钮
- ✅ 删除前检查素材是否被镜头引用
- ✅ 删除确认对话框（带警告提示，使用项目统一模态框）
- ✅ 物理删除文件
- ✅ 删除后自动刷新素材列表
- ✅ 删除后关闭预览模态框
- ✅ 安全验证：防止目录遍历攻击
- ✅ 深色主题适配

### 交互流程
1. **右键删除**：右键素材 → 选择"删除" → 确认对话框 → 删除文件 → 刷新列表
2. **预览删除**：左键预览 → 点击"删除"按钮 → 确认对话框 → 删除文件 → 刷新列表 + 关闭模态框

### 引用检查逻辑
- 遍历所有项目的 `shots[].scenes[].materials` 数组
- 检查镜头的 `content` 字段是否包含路径
- 如果被引用，显示警告提示

### 安全机制
- 路径规范化：`path.normalize()`
- 目录限制：确保文件在 `assets` 目录内
- 参数校验：验证 `projectDir`, `assetPath`, `assetType`

---

## 2026-03-08 - 实现拖放上传功能（Sandbox 模式）

### 需求
实现真正的项目素材库拖放上传功能，解决 Electron Sandbox 模式下无法获取文件真实路径的问题。

### 技术方案
**Sandbox 模式限制**：渲染进程无法直接访问 File 对象的 `path` 属性

**解决方案**：使用 `FileReader` 读取文件为 Base64，通过 IPC 传递给主进程保存

### 修改文件

| 文件 | 变更 | 说明 |
|------|------|------|
| `src/preload.js` | +2 行 | 暴露 `saveDroppedFile` API |
| `src/handlers/project.js` | +55 行 | 新增 `fs:saveDroppedFile` IPC 处理器 |
| `src/utils/projectAssets.js` | +80 行 | 新增 `handleDroppedFiles` 和 `readFileAsBase64` 函数 |
| `styles.css` | +15 行 | 增强拖放视觉效果（动画 + 阴影） |

### 核心实现

#### 1. preload.js - 暴露 API
```javascript
saveDroppedFile: (fileName, fileData, projectDir, assetType) => 
  ipcRenderer.invoke('fs:saveDroppedFile', fileName, fileData, projectDir, assetType)
```

#### 2. project.js - 主进程保存文件
```javascript
ipcMain.handle('fs:saveDroppedFile', async (event, fileName, fileData, projectDir, assetType) => {
  // 解析 Base64 数据
  const matches = fileData.match(/^data:(.+);base64,(.+)$/);
  const buffer = Buffer.from(matches[2], 'base64');
  
  // 确定素材类型目录（images/videos/audios）
  // 复制到项目 assets 目录
  // 处理重名文件（添加时间戳）
  
  return { success: true, path, name, size, fileSize, type };
})
```

#### 3. projectAssets.js - 渲染进程处理拖放
```javascript
// 拖放 drop 事件
uploadArea.addEventListener('drop', async (e) => {
  const files = e.dataTransfer.files;
  const fileArray = Array.from(files);
  await handleDroppedFiles(fileArray);
});

// 读取文件为 Base64
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
  });
}

// 处理拖放文件
async function handleDroppedFiles(files) {
  // 遍历文件列表
  // 读取 Base64 → 调用 IPC 保存 → 显示进度 → 刷新列表
}
```

### 视觉效果增强
- 拖放时边框变绿 + 背景高亮
- 图标 bounce 动画
- 绿色阴影效果
- 深色主题适配

### 功能特性
- ✅ 支持单文件拖放上传
- ✅ 支持多文件同时拖放
- ✅ 自动识别文件类型（图片/视频/音频）
- ✅ 自动分类存储到对应目录
- ✅ 文件重名自动添加时间戳
- ✅ 上传进度实时显示
- ✅ 上传完成自动刷新素材列表
- ✅ 深色主题完美适配

### 已知限制
- 大文件（>50MB）上传可能较慢（Base64 编码 + IPC 传输）
- 视频文件建议先压缩再上传

---

## 2026-03-08 - 项目素材库上传功能（点击 + 拖放）

### 新增功能

#### 1. HTML 结构修改
- 删除原有的 `<button class="assets-upload-btn">`
- 新增 `<div class="assets-upload-area">` 拖放区域
- 内置隐藏的 `<input type="file">` 元素
- 支持 `image/*,video/*,audio/*` 多文件选择

#### 2. CSS 样式
- 上传区域样式（虚线边框、最小高度 80px）
- 拖放时高亮效果（绿色边框 + 背景）
- 上传进度条样式
- 深色主题适配
- 拖放动画效果（bounce 动画 + 阴影）

#### 3. JavaScript 功能
**核心函数**:
- `initUploadFunctionality()`: 初始化上传功能
- `handleFilesUpload(files)`: 处理文件上传（点击方式）
- `handleDroppedFiles(files)`: 处理拖放文件上传
- `readFileAsBase64(file)`: 读取文件为 Base64
- `showUploadProgress(current, total)`: 显示上传进度
- `hideUploadProgress()`: 隐藏进度条

**功能特性**:
- ✅ 点击上传区域触发文件选择
- ✅ 拖放文件到上传区域自动上传
- ✅ 支持多文件同时上传
- ✅ 上传进度实时显示
- ✅ 自动根据文件类型分类存储
- ✅ 上传完成后自动刷新素材列表

### 使用方式
1. **点击上传**: 点击上传区域 → 选择文件 → 自动上传
2. **拖放上传**: 拖拽文件到上传区域 → 释放 → 自动上传

---

## 2026-03-08 - 修复 projectAssets.js renderAssetsList 作用域问题（最终修复）

### 问题
```
TypeError: assets.forEach is not a function
    at renderAssetsList (renderer.js:546:10)
```

### 原因
- `projectAssets.js` 中的 `loadAssetsList` 函数调用 `renderAssetsList` 时，错误调用了 `window.renderAssetsList`（来自 `renderer.js`）
- `window.renderAssetsList` 期望接收**数组**参数
- 但 `projectAssets.js` 传递的是**对象** `{ images: [], videos: [], audios: [] }`

### 尝试的解决方案

#### 方案 1：移动函数定义位置 ❌
将 `renderAssetsList` 函数移到 `loadAssetsList` 之前定义，但问题依然存在。

#### 方案 2：添加 var 局部变量声明 ❌
在文件顶部添加 `var renderAssetsList` 声明，但问题依然存在。

#### 方案 3：改为 const 函数表达式赋值 ✅
将所有局部函数改为 `const` 函数表达式赋值：
```javascript
const renderAssetsList = function(assets, cacheData = true, updateCount = true) {
  // ...
};
```

**原理**：
- `const` 声明的变量不会被提升到 `window` 对象
- 作用域链查找时优先使用当前文件作用域的变量
- 确保调用的是局部函数而非 `window.renderAssetsList`

### 修改的函数（共 10 个）
- `renderAssetsSection`
- `renderAssetsList`
- `bindThumbnailClickEvents`
- `renderAssetsListByType`
- `filterAssetsByKeyword`
- `updateAssetsCount`
- `updateAssetsUsage`
- `getMockAssets`
- `showPreview`
- `hidePreview`

### 修改文件
- `src/utils/projectAssets.js` - 10 个函数改为函数表达式（+10 行，-14 行）

---

## 2026-03-08 - 修复 projectAssets.js renderAssetsList 作用域问题

### 问题
```
TypeError: assets.forEach is not a function
    at renderAssetsList (renderer.js:546:10)
```

### 原因
- `projectAssets.js` 中的 `loadAssetsList` 函数调用 `renderAssetsList` 时，错误调用了 `window.renderAssetsList`（来自 `renderer.js`）
- `window.renderAssetsList` 期望接收**数组**参数
- 但 `projectAssets.js` 传递的是**对象** `{ images: [], videos: [], audios: [] }`

### 解决方案
将 `renderAssetsList` 和 `renderAssetsSection` 函数移到 `loadAssetsList` 之前定义，确保 JavaScript 函数提升机制正确工作，局部函数优先于 `window.renderAssetsList`。

### 修改文件
- `src/utils/projectAssets.js` - 移动函数定义位置（+95 行）

---

## 2026-03-08 - 统一共用素材预览模态框

### 问题
项目素材库和片段素材库各有一个预览模态框，造成重复和资源浪费。

### 解决方案
删除重复的模态框，两个素材库共用同一个预览模态框。

### 修改内容

| 文件 | 变更 | 说明 |
|------|------|------|
| `index.html` | -18 行 | 删除片段素材库旁边的重复模态框 |
| `src/utils/projectAssets.js` | +20 行 | 更新为使用统一模态框 ID，添加复制路径功能 |
| `src/utils/sceneAssets.js` | +10 行 | 更新为使用统一模态框 ID |

### 统一模态框结构

```html
<div id="asset-preview-modal" class="modal" style="display: none;">
  <div class="modal-overlay"></div>
  <div class="modal-content asset-preview-modal-content">
    <div class="modal-header">
      <h3 id="asset-preview-title">素材预览</h3>
      <button class="modal-close" id="asset-preview-close-btn">×</button>
    </div>
    <div class="modal-body asset-preview-body">
      <div class="asset-preview-container" id="asset-preview-container">
        <!-- 动态渲染预览内容 -->
      </div>
      <div class="asset-preview-info">
        <span id="asset-preview-name">-</span>
        <span id="asset-preview-size">-</span>
      </div>
    </div>
    <div class="modal-footer asset-preview-footer">
      <button id="asset-preview-copy-path-btn" class="btn btn-secondary">复制路径</button>
      <button id="asset-preview-delete-btn" class="btn btn-danger">删除</button>
    </div>
  </div>
</div>
```

### 功能差异

| 功能 | 项目素材库 | 片段素材库 |
|------|------------|------------|
| 预览 | ✅ 支持 | ✅ 支持 |
| 复制路径 | ✅ 支持 | ✅ 支持 |
| 删除 | ⏸️ 待实现 | ✅ 支持 |

---

## 2026-03-08 - 片段素材库功能实现（P1 阶段）

### 新增功能

#### 1. 素材上传功能
- **触发方式**: 点击片段素材库右上角「📤」上传按钮
- **支持格式**:
  - 图片：jpg, jpeg, png, gif, webp, bmp
  - 视频：mp4, webm, ogg, mov, avi
  - 音频：mp3, wav, ogg, aac, flac
- **功能特性**:
  - 支持多文件同时选择上传
  - 自动分类复制到项目 assets 目录
  - 自动创建分类文件夹（images/videos/audios）
  - 文件重名时自动添加时间戳
  - 上传成功后自动刷新素材列表

#### 2. 素材预览功能
- **触发方式**: 点击素材缩略图
- **预览模态框**:
  - 图片预览：直接显示大图（自适应窗口）
  - 视频预览：HTML5 播放器，支持播放控制
  - 音频预览：音频播放器 + 封面图标
- **操作按钮**:
  - 复制路径：复制素材绝对路径到剪贴板
  - 删除：删除素材（物理删除 + 索引移除）

#### 3. 素材删除功能
- **删除确认**: 弹窗确认，防止误删
- **双重删除**:
  - 从 project.json 移除索引记录
  - 物理删除 assets 目录中的文件
- **自动刷新**: 删除成功后自动刷新素材列表

### 修改的文件

| 文件 | 变更 | 说明 |
|------|------|------|
| `index.html` | +20 行 | 上传按钮可见 + 预览模态框 HTML |
| `styles.css` | +80 行 | 预览模态框样式 + 深色主题适配 |
| `src/preload.js` | +1 行 | 暴露 `uploadAsset` API |
| `src/handlers/project.js` | +84 行 | 新增 `project:uploadAsset` IPC 处理器 |
| `src/utils/sceneAssets.js` | +220 行 | 上传/预览/删除功能实现 |
| `src/utils/eventListeners.js` | +10 行 | 初始化素材库面板和预览模态框 |

### 核心函数

```javascript
// sceneAssets.js
function handleUploadAsset()           // 处理文件上传
function showAssetPreview(asset)       // 显示素材预览
function hideAssetPreview()            // 隐藏预览
function bindSceneAssetsClickEvents()  // 绑定缩略图点击事件
function initAssetPreviewModal()       // 初始化预览模态框事件

// project.js
ipcMain.handle('project:uploadAsset', ...)  // 上传素材 IPC 处理器
```

### 数据结构

**片段素材结构**（存储在 project.json）:
```json
{
  "shots": [{
    "id": "shot_001",
    "name": "片段 01",
    "assets": {
      "images": [
        {
          "id": "asset_img_1234567890",
          "name": "test.png",
          "path": "e:\\AI\\KimV4\\work\\projects\\测试\\assets\\images\\test.png",
          "type": "image",
          "size": "1.2MB",
          "fileSize": 1258291
        }
      ],
      "videos": [],
      "audios": []
    }
  }]
}
```

### 使用说明

1. **创建项目** → 创建片段 → 选中片段
2. **展开素材库**: 点击底部「片段素材库」面板标题栏
3. **上传素材**: 点击右上角「📤」按钮，选择文件
4. **预览素材**: 点击任意素材缩略图
5. **删除素材**: 预览时点击「删除」按钮

### 测试指南

详见：`work/scene-assets-test-guide.md`

### 已知问题

- 视频预览依赖浏览器支持的编码格式（推荐 H.264/MP4）
- 大文件上传可能需要较长时间（无进度条显示）

---

## 2026-03-08 - 项目素材库搜索功能修复

### 问题
搜索素材后资源统计不正确，会被重置为空，计数为 0。

### 原因
`filterAssetsByKeyword` 调用 `renderAssetsList` 时没有正确传递 `updateCount` 参数。

### 修复
```javascript
// 修改前
renderAssetsList(filteredAssets);  // 默认 updateCount=true，但可能数据为空

// 修改后
renderAssetsList(filteredAssets, false, true);  // 明确更新计数
```

### 调试日志
添加日志输出帮助排查问题：
```
[filterAssetsByKeyword] keyword: 小
[filterAssetsByKeyword] currentAssetsData: {...}
[filterAssetsByKeyword] filteredAssets: {...}
```

### 测试结果
- ✅ 搜索中文关键词（如 "小"）可以正确过滤
- ✅ 计数显示过滤后的数量
- ✅ 清空搜索后显示全部素材和正确计数

---

## 2026-03-08 - 项目素材库视频缩略图提取功能

### 问题修复

#### 1. 无限循环问题 ✅
**问题**: 视频缩略图提取时无限循环调用 `onseeked`

**原因**: 
- 多个视频同时加载时并发处理
- 没有跳转次数限制
- 元素被替换后继续触发事件

**解决方案**:
```javascript
// 1. 添加 extracting 标记防止并发
if (video.dataset.extracting === 'true') return;

// 2. 添加 seekCount 计数器
let seekCount = 0;
const maxSeeks = 2;

// 3. 超过限制自动停止
if (seekCount > maxSeeks) {
  video.dataset.extracting = 'false';
  return;
}

// 4. 完成后标记
video.dataset.frameExtracted = 'true';
video.dataset.extracting = 'false';
```

#### 2. 缩略图尺寸优化 ✅
**修改**: 改为纵向长方体布局

| 元素 | 修改前 | 修改后 |
|------|--------|--------|
| `.asset-thumbnail` | 90px | 140px |
| `video` / `img` | 70px | 100px |

### 功能特性

1. **黑场检测**
   - 从 0.1 秒开始尝试
   - 如果是黑场，跳转到 1 秒重试
   - 亮度阈值：30（0-255 范围）

2. **调试日志**
   ```
   [extractVideoFrame] 开始提取，视频尺寸：720 x 1280
   [extractVideoFrame] onseeked 调用次数：1
   [extractVideoFrame] 亮度检测：152.26 (正常)
   [extractVideoFrame] ✅ 提取完成
   ```

3. **容错处理**
   - 元素不在 DOM 中时自动跳过
   - 替换失败时静默处理
   - 最多尝试 2 次后停止

### 修改的文件

| 文件 | 变更 | 说明 |
|------|------|------|
| `src/utils/projectAssets.js` | +60 行 | 添加防循环机制和调试日志 |
| `styles.css` | +10 行 | 修改缩略图尺寸为纵向长方体 |

---

## 2026-03-08 - 片段素材库功能实现

### 新增模块
**文件**: `src/utils/sceneAssets.js` (356 行)

### 功能说明

#### 片段素材库（底部面板）
- **位置**: 底部属性面板（双面板之一）
- **标题**: `片段素材库`
- **ID**: `#assets-panel`
- **用途**: 存放和管理当前选中片段的专属素材资源

#### 核心功能
1. **面板控制**
   - 展开/收起动画
   - 标题栏点击切换
   - 上传按钮（待实现）

2. **素材加载**
   - `loadShotAssetsList(shotId)` - 加载片段素材
   - 从 `shot.assets` 读取数据（images/videos/audios）
   - 2 列网格显示缩略图

3. **数据结构**
```javascript
shot.assets = {
  images: [{ id, name, path, type, fileSize }],
  videos: [...],
  audios: [...]
}
```

### 设计原则
1. **片段素材库独立管理** - 与项目素材库无联动
2. **片段级专属资源** - 每个片段有自己的素材库
3. **镜头选中时保持不变** - 选中镜头时素材库仍显示当前片段素材

### 修改的文件

| 文件 | 变更 | 说明 |
|------|------|------|
| `index.html` | +3 行 | 添加上传按钮 |
| `src/renderer.js` | +4 行 | 缓存 DOM 元素 |
| `src/utils/eventListeners.js` | +20 行 | 绑定面板事件 |
| `src/utils/shotList.js` | +5 行 | 选中片段时加载素材 |
| `src/utils/sceneList.js` | +3 行 | 选中镜头时保持素材库不变 |

---

## 2026-03-08 - 项目素材库功能完善

### 新增功能

#### 1. 素材预览面板
- **位置**: 项目素材库侧边窗体内（素材列表上方）
- **触发**: 点击素材缩略图
- **功能**:
  - 图片预览：直接显示图片（最大 180px 高度）
  - 视频预览：HTML5 视频播放器
  - 音频预览：HTML5 音频播放器 + 图标
  - 显示素材名称和文件大小
  - 支持关闭预览面板

#### 2. 真实素材数据读取
- **IPC 处理器**: `project:getAssets` (src/handlers/project.js)
- **API 暴露**: `window.electronAPI.getAssets` (src/preload.js)
- **读取逻辑**: 扫描项目目录 `assets/{images,videos,audios}`
- **支持格式**:
  - 图片：jpg, jpeg, png, gif, webp, bmp
  - 视频：mp4, webm, ogg, mov, avi
  - 音频：mp3, wav, ogg, aac, flac

#### 3. 存储使用量计算
- **计算方式**: 累加所有素材文件的实际大小
- **显示格式**: 已用 X.XMB / 限制 500MB
- **进度条**: 根据实际使用量动态更新

### 修改的文件

| 文件 | 变更 | 说明 |
|------|------|------|
| `index.html` | +15 行 | 添加预览面板 HTML 结构 |
| `styles.css` | +133 行 | 预览面板样式 + 深色主题适配 |
| `src/handlers/project.js` | +92 行 | 新增 `project:getAssets` IPC 处理器 |
| `src/preload.js` | +1 行 | 暴露 `getAssets` API |
| `src/utils/projectAssets.js` | +155 行 | 修改加载逻辑、添加预览功能 |
| `src/utils/propertyPanel.js` | +10 行 | 属性面板高度调整 |

### 核心函数

```javascript
// project.js
function formatFileSize(bytes)  // 格式化文件大小
ipcMain.handle('project:getAssets', ...)  // 获取素材列表

// projectAssets.js
function loadAssetsList(projectId)  // 加载真实素材列表
function updateAssetsUsage(assets)  // 计算存储使用量
function showPreview(type, name, size, path)  // 显示预览
function hidePreview()  // 隐藏预览
function bindThumbnailClickEvents()  // 绑定缩略图点击事件
```

### 设计原则

1. **项目素材库和片段素材引用无联动** - 独立管理
2. **预览在素材库窗口内** - 不额外弹窗
3. **缩略图网格显示** - 2 列布局（70px 高度）
4. **真实数据统计** - 基于实际文件数量和大小

---

## 2026-03-08 - 添加 JSDoc 注释

### 已添加注释的模块

#### 1. appStateManager.js
- 类注释：包含使用示例
- 构造函数注释
- 所有公共方法注释：
  - `getState()` / `setState()` / `updateState()`
  - `getSettings()` / `setSettings()` / `updateSetting()` / `updateNestedSetting()`
  - `getTheme()` / `setTheme()`
  - `getUseElectronAPI()` / `setUseElectronAPI()`
  - `init()` / `loadFromWindow()`

#### 2. projectCreator.js
- `createProjectAI()` - AI 创建项目流程说明
- `createProjectManual()` - 手动创建项目模式说明
- `showNewProjectModal()` - 弹窗功能说明
- `hideNewProjectModal()` - 隐藏弹窗
- `confirmCreateProject()` - 模式切换逻辑

### 注释规范

```javascript
/**
 * 函数描述
 * 
 * 流程说明（如适用）：
 * 1. 步骤一
 * 2. 步骤二
 * 
 * @async - 异步函数
 * @param {type} name - 参数说明
 * @returns {type} 返回值说明
 * 
 * @example
 * // 使用示例
 * code example;
 */
```

---

## 2026-03-08 - 所有模块统一使用状态管理器

### 修改的模块

| 模块 | 修改内容 |
|------|----------|
| projectList.js | 使用 updateState/getState |
| shotList.js | 使用 updateState/getState |
| sceneList.js | 使用 updateState/getState |
| propertyPanel.js | 使用 updateState/getState |

### 修改规则

| 原代码 | 新代码 |
|--------|--------|
| `window.appState.projects = x` | `window.updateState('projects', x)` |
| `window.appState.currentProject = x` | `window.updateState('currentProject', x)` |
| `window.appState.currentShot = x` | `window.updateState('currentShot', x)` |
| `window.appState.currentScene = x` | `window.updateState('currentScene', x)` |
| `window.appState` | `window.getState()` |
| `window.appState.currentProject` | `window.getState().currentProject` |

### 优势

- ✅ 单一数据源，避免状态不同步
- ✅ 集中管理状态变更
- ✅ 便于调试和追踪状态变化

---

## 2026-03-08 - 状态管理改进 - 使用单一数据源

### 问题

- `renderer.js` 中有局部 `settings` 变量
- 与 `window.settings` 可能不同步
- 多个模块直接修改 `window` 对象导致状态混乱

### 解决方案

创建 `appStateManager.js` 状态管理器类：

```javascript
class AppStateManager {
  // 统一管理状态
  state = { projects, currentProject, currentShot, currentScene, projectData }
  settings = { storagePath, apiProvider, apiKeys, models, templates, activeTemplateId }
  currentTheme = 'light'
  useElectronAPI = false
  
  // 提供统一 API
  getState() / setState(newState) / updateState(key, value)
  getSettings() / setSettings(newSettings) / updateSetting(key, value)
  getTheme() / setTheme(theme)
}
```

### 代码变化

| 文件 | 变化 |
|------|------|
| `src/utils/appStateManager.js` | 新增 ~270 行 |
| `src/renderer.js` | 移除局部变量，使用状态管理器 |
| `index.html` | 添加状态管理器模块引用 |

### 优势

- ✅ 单一数据源，避免状态不同步
- ✅ 集中管理状态变更
- ✅ 保持向后兼容（window 对象仍然可用）
- ✅ 便于调试和状态追踪

### 使用示例

```javascript
// 之前（可能导致不同步）
let settings = { ... };
settings.apiProvider = 'deepseek';
window.settings = settings;

// 现在（统一使用状态管理器）
appStateManager.updateSetting('apiProvider', 'deepseek');
// 或
window.updateSetting('apiProvider', 'deepseek');
```

---

## 2026-03-08 - 拆分 renderer.js 为独立模块

### 重构概述

将 renderer.js（约 1466 行）拆分为更小的独立模块，提高代码可维护性。

### 创建的新模块

| 模块 | 文件 | 行数 | 包含函数 |
|------|------|------|------|
| 事件监听器 | `src/utils/eventListeners.js` | ~200 行 | `setupEventListeners()` |
| 模板库管理 | `src/utils/templateLibrary.js` | ~350 行 | 14 个模板管理函数 |
| 项目创建 | `src/utils/projectCreator.js` | ~250 行 | 5 个项目创建函数 |

### 代码变化

| 文件 | 变化前 | 变化后 | 减少 |
|------|--------|--------|------|
| `src/renderer.js` | 1466 行 | ~400 行 | -1066 行 (-72.7%) |

### 验证结果

```bash
npm start
# ✅ 应用正常运行
```

---

## 2026-03-07 - 清理重复和未使用的代码区域

### 检查结果

**位置**: `renderer.js` 第 1294 行开始的"重复和未使用的代码区域"

| 函数 | 状态 | 调用情况 | 处理 |
|------|------|----------|------|
| `renderAssetsList` | ✅ 正在使用 | projectList.js:424 | 保留并添加到 window 导出 |
| `showUpdateNotification` | ❌ 重复代码 | uiHelpers.js:386 已有 | 注释掉 |
| `showCustomPrompt` | ❌ 重复代码 | uiHelpers.js:278 已有 | 注释掉 |

### 修改内容

**更新 exposeGlobals()**:
```javascript
// 修改前
function exposeGlobals() {
  window.showToast = showToast;
  window.showConfirm = showConfirm;
  window.loadOptionsByGroup = loadOptionsByGroup;
  window.showUpdateNotification = showUpdateNotification;
  window.showCustomPrompt = showCustomPrompt;
}

// 修改后
function exposeGlobals() {
  // 导出 renderAssetsList - 素材库列表渲染（仅在 renderer.js 中定义）
  window.renderAssetsList = renderAssetsList;
}
```

**注释掉重复函数**:
```javascript
/* === 已移除 - 函数已在 uiHelpers.js 中实现 ===

function showUpdateNotification() {
  // 已在 uiHelpers.js:386 实现
}

async function showCustomPrompt(message, title = '输入') {
  // 已在 uiHelpers.js:278 实现
}

=== 已移除 - 函数已在 uiHelpers.js 中实现 === */
```

### 代码变化
- 减少 109 行重复代码
- 统一使用 uiHelpers.js 中的实现

### Git 提交
```
89114a7 refactor: 清理重复和未使用的代码区域
```

---

## 2026-03-07 - 替换所有 alert 为模态框提示

### 处理内容
将 `renderer.js` 中所有 `alert()` 调用替换为 `window.showToast()`。

### 替换统计

| 功能模块 | alert 数量 | 替换为 |
|----------|-----------|--------|
| 项目管理功能 | 11 | window.showToast |
| 模板库管理功能 | 6 | window.showToast |
| 复制模板功能 | 2 | window.showToast |
| 打开项目文件夹 | 1 | window.showToast |
| **合计** | **22** | - |

### 修改示例

**修改前**:
```javascript
alert('创建项目失败：' + result.error);
alert('请先在设置中配置 API Key');
```

**修改后**:
```javascript
window.showToast('创建项目失败：' + result.error);
window.showToast('请先在设置中配置 API Key');
```

### 代码变化
- 减少 99 行代码（alert 消息简化）
- 统一使用模态框提示
- 改善用户体验

### Git 提交
```
3b7e8c3 refactor: 替换所有 alert 为 window.showToast
```

---

## 2026-03-07 - renderer.js 代码结构整理（第二次）

### 整理内容
对 `renderer.js` 进行代码结构整理，按功能模块重新排列代码。

### 模块排列顺序

| 序号 | 模块名称 | 说明 |
|------|----------|------|
| 1 | 文件头注释和模块导入说明 | 包含 4 个已迁移模块的说明注释 |
| 2 | 全局变量定义 | appState、currentTheme、useElectronAPI、settings 等 |
| 3 | DOM 元素缓存 | cacheDOMElements() 函数 |
| 4 | 应用初始化 | initializeApp() 和 DOMContentLoaded 事件 |
| 5 | 事件监听器设置 | setupEventListeners() 函数 |
| 6 | 项目管理功能 | 项目创建、删除、状态更新等 |
| 7 | 模板库管理功能 | 模板的增删改查、备份恢复等 |
| 8 | 自定义选项管理功能（已迁移） | 保留原有函数和迁移注释 |
| 9 | 项目加载和渲染 | 保留模块注释标记 |
| 10-15 | 已迁移模块（保留注释） | 镜头/片段/属性面板/提示词/设置/UI 工具 |
| 16 | 面板控制功能 | toggleBottomPanel 等函数 |
| 17 | 包装函数（已删除） | 保留模块注释标记 |
| 18 | 全局变量导出 | exposeGlobals() 函数 |
| 19 | 重复和未使用的代码区域 | renderAssetsList、showUpdateNotification、showCustomPrompt |

### 区域标记格式
```javascript
// ======= 功能模块名称 开始 ========
... 代码 ...
// ======= 功能模块名称 结束 ========
```

### 注意事项
- **未修改任何函数内部代码**，只移动了代码块位置
- **已迁移模块保留原有注释**，包括 `【已迁移至 src/utils/xxx.js】`
- **新增"重复和未使用的代码区域"** 放在文件末尾

---

## 2026-03-07 - renderer.js 代码整理（第一次）

### 整理内容
根据 `work/renderer-analysis-report.md` 分析报告，对 `renderer.js` 进行代码结构整理。

### 处理项

#### 1. 注释掉自定义选项管理重复代码 (436 行)
**位置**: 1194-1630 行
**原因**: 函数已完整迁移至 `src/utils/customOptions.js`
**处理**: 用块注释包裹，保留代码以备参考

#### 2. 注释掉 UI 工具函数重复代码 (182 行)
**位置**: 1865-2047 行
**原因**: 函数已迁移至 `src/utils/uiHelpers.js`
**处理**: 用块注释包裹

#### 3. 注释掉包装函数 (32 行)
**位置**: 1821-1855 行
**原因**: 可直接使用 window 对象中的函数
**处理**: 用块注释包裹

#### 4. 统一注释风格
**处理**: 将所有 `[已移至 xxx]` 统一为 `【已迁移至 xxx】`

### 代码统计

| 阶段 | 行数 | 减少 |
|------|------|------|
| 原始 | 3988 行 | - |
| 模块拆分前 | 2998 行 | -990 行 (-24.8%) |
| 提示词模块拆分后 | 2567 行 | -431 行 (-14.4%) |
| 设置管理模块拆分后 | 2577 行 | -453 行 (-14.9%) |
| **本次整理后** | **1793 行** | **-280 行 (-13.5%)** |
| **累计减少** | | **~-2200 行 (-55.1%)** |

---

## 2026-03-07 - 统一替换 alert/confirm 为模态框提示

### 新增功能
**`showErrorModal` 函数**（uiHelpers.js）- 用于严重错误的模态提示框
- 红色警告图标 ⚠️
- 红色背景错误消息区域
- 支持 ESC 键和点击遮罩关闭

### 替换规则
| 场景 | 替换为 |
|------|--------|
| 普通提示/验证失败 | `window.showToast()` |
| 确认操作 | `window.showConfirm()` |
| 严重错误/系统错误 | `window.showErrorModal()` |

### 更新的模块
| 模块 | 替换数量 |
|------|----------|
| customOptions.js | 11 处 alert |
| promptGenerator.js | 4 处 alert |
| settings.js | 2 处 alert |
| projectList.js | 6 处 alert |
| shotList.js | 8 处 alert |
| sceneList.js | 2 处 alert |
| uiHelpers.js | 新增 showErrorModal |

### Git 提交
```
8a0244b refactor: 统一替换 alert/confirm 为模态框提示
```

---

## 2026-03-07 - 自定义选项管理模块拆分

### 拆分内容
将 `renderer.js` 中的自定义选项管理相关函数拆分到独立的 `src/utils/customOptions.js` 模块中。

### 已迁移的函数（customOptions.js）
| 函数 | 说明 |
|------|------|
| `showCustomOptionsModal` | 显示自定义选项管理弹窗 |
| `hideCustomOptionsModal` | 隐藏自定义选项管理弹窗 |
| `loadGroupFilter` | 加载组别筛选器 |
| `loadCustomOptionsList` | 加载自定义选项列表（两栏显示） |
| `renderBuiltinOptionsList` | 渲染内置选项列表 |
| `renderCustomOptionsList` | 渲染自定义选项列表 |
| `showAddCustomOptionForm` | 显示添加自定义选项表单（弹窗） |
| `showEditCustomOptionForm` | 显示编辑自定义选项表单（弹窗） |
| `loadGroupFilterForEditForm` | 加载组别下拉框（编辑表单用） |
| `hideCustomOptionEditModal` | 隐藏自定义选项编辑弹窗 |
| `saveCustomOptionEdit` | 保存自定义选项编辑（弹窗版） |
| `saveCustomOption` | 保存自定义选项 |
| `deleteCustomOption` | 删除自定义选项（检查使用情况） |
| `hideCustomOptionForm` | 隐藏自定义选项表单 |

### 模块文件
- **新文件**: `src/utils/customOptions.js`
- **原文件**: `src/renderer.js` (添加模块注释标记)

### 注释标记（renderer.js 第 1668-1673 行）
```javascript
// ========== 自定义选项管理 ==========
// 【已迁移至 src/utils/customOptions.js】
// 包含函数：showCustomOptionsModal, hideCustomOptionsModal, loadGroupFilter, loadCustomOptionsList,
// renderBuiltinOptionsList, renderCustomOptionsList, showAddCustomOptionForm, showEditCustomOptionForm,
// loadGroupFilterForEditForm, hideCustomOptionEditModal, saveCustomOptionEdit, saveCustomOption,
// deleteCustomOption, hideCustomOptionForm
```

### 累计模块拆分进度
| 模块 | 文件 | 行数 | 状态 |
|------|------|------|------|
| 项目管理 | `src/utils/projectList.js` | 436 行 | ✅ 已完成 |
| 片段管理 | `src/utils/shotList.js` | 413 行 | ✅ 已完成 |
| 镜头管理 | `src/utils/sceneList.js` | 230 行 | ✅ 已完成 |
| 属性面板 | `src/utils/propertyPanel.js` | 766 行 | ✅ 已完成 |
| 提示词生成 | `src/utils/promptGenerator.js` | 266 行 | ✅ 已完成 |
| 设置管理 | `src/utils/settings.js` | 494 行 | ✅ 已完成 |
| **自定义选项管理** | **`src/utils/customOptions.js`** | **~520 行** | **✅ 已完成** |

### renderer.js 代码变化
| 阶段 | 行数 | 减少 |
|------|------|------|
| 原始 | 3988 行 | - |
| 模块拆分前 | 2998 行 | -990 行 (-24.8%) |
| 提示词模块拆分后 | 2567 行 | -431 行 (-14.4%) |
| 设置管理模块拆分后 | 2577 行 | -453 行 (-14.9%) |
| 自定义选项模块拆分后 | ~2600 行 | 添加注释标记 |
| **累计减少** | | **~-1400 行 (-35.1%)** |

*注：自定义选项模块采用注释标记方式，未完全注释掉代码，便于后续验证功能正常后再完全注释。*

---

**文档更新时间**: 2026-03-07
**最新提交**: 89114a7 refactor: 清理重复和未使用的代码区域
