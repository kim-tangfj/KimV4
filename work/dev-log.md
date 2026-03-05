# 开发日志

记录每次开发迭代的需求和处理内容。

---

## 2026-03-05 - 自定义选项功能（菜单入口优化）

### 修改内容

#### 1. 功能入口位置调整
**修改前**: 设置面板 → 自定义选项管理  
**修改后**: 原生菜单 → 系统 → 自定义选项管理

#### 2. menu.js 修改
```javascript
{
  label: '系统',
  submenu: [
    {
      label: '自定义选项管理',  // 新增菜单项
      click: () => {
        mainWindow.webContents.send('open-custom-options');
      }
    },
    // ... 其他菜单项
  ]
}
```

#### 3. preload.js 修改
```javascript
onCustomOptionsOpen: (callback) => {
  ipcRenderer.on('open-custom-options', callback);
}
```

#### 4. renderer.js 修改
```javascript
// Electron API 事件监听
window.electronAPI.onCustomOptionsOpen(() => showCustomOptionsModal());
```

### 使用方式
```
系统菜单 → 自定义选项管理
  ↓
打开自定义选项管理弹窗
  ↓
查看/添加/编辑/删除自定义选项
```

---

## 2026-03-05 - 自定义选项功能（前端实现）

### 完成内容

#### 1. 打开管理弹窗
**函数**: `showCustomOptionsModal()`

**流程**:
```javascript
async function showCustomOptionsModal() {
  // 1. 加载组别筛选器
  await loadGroupFilter();
  
  // 2. 加载自定义选项列表
  await loadCustomOptionsList();
  
  // 3. 显示弹窗
  elements.customOptionsModal.style.display = 'flex';
}
```

#### 2. 选项列表渲染
**函数**: `loadCustomOptionsList(filterGroup)`

**功能**:
- 调用 `window.electronAPI.getAllOptions()` 获取所有选项（内置 + 自定义）
- 支持按组别筛选
- 内置选项标记为灰色、不可编辑
- 自定义选项显示编辑/删除按钮

**列表项结构**:
```html
<div class="custom-option-item builtin">
  <div class="custom-option-item-info">
    <div class="custom-option-item-header">
      <span class="custom-option-group-tag">风格</span>
      <span class="custom-option-item-title">写实风格 - 照片写实</span>
      <span>(系统)</span>
    </div>
    <div class="custom-option-item-subtitle">高度还原现实光影...</div>
  </div>
</div>

<div class="custom-option-item">
  <div class="custom-option-item-info">...</div>
  <div class="custom-option-item-actions">
    <button class="edit-option-btn">编辑</button>
    <button class="delete-option-btn">删除</button>
  </div>
</div>
```

#### 3. 组别筛选器
**函数**: `loadGroupFilter()`

**功能**:
- 调用 `window.electronAPI.getGroups()` 获取所有组别
- 动态填充下拉选项
- 支持"全部组别"选项

#### 4. 添加/编辑表单
**函数**:
- `showAddCustomOptionForm()` - 显示添加表单
- `showEditCustomOptionForm(option)` - 显示编辑表单并填充数据
- `hideCustomOptionForm()` - 隐藏表单

**表单字段**:
- 组别（下拉选择：风格/情绪氛围/配乐风格）
- 类型（文本输入）
- 风格名称（文本输入）
- 描述（多行文本）

#### 5. 保存功能
**函数**: `saveCustomOption()`

**逻辑**:
```javascript
async function saveCustomOption() {
  const optionId = elements.customOptionId.value;
  const optionData = { group, type, style, description };
  
  if (optionId) {
    // 更新
    result = await window.electronAPI.updateCustomOption(optionId, optionData);
  } else {
    // 新增
    result = await window.electronAPI.addCustomOption(optionData);
  }
  
  if (result.success) {
    hideCustomOptionForm();
    await loadCustomOptionsList();
    showUpdateNotification();
  }
}
```

#### 6. 删除功能
**函数**: `deleteCustomOption(optionId)`

**逻辑**:
- 确认对话框
- 调用 API 删除
- 刷新列表

#### 7. 备份/恢复功能
**函数**:
- `backupOptions()` - 备份自定义选项
- `restoreOptions()` - 恢复自定义选项
- `openOptionsFolder()` - 打开选项文件夹

### 事件绑定
```javascript
// 打开管理弹窗
elements.manageCustomOptionsBtn.addEventListener('click', showCustomOptionsModal);

// 组别筛选
elements.customOptionsGroupFilter.addEventListener('change', () => {
  loadCustomOptionsList(elements.customOptionsGroupFilter.value);
});

// 添加选项
elements.addCustomOptionBtn.addEventListener('click', showAddCustomOptionForm);

// 保存选项
elements.saveCustomOptionBtn.addEventListener('click', saveCustomOption);

// 编辑选项（动态绑定）
editBtn.addEventListener('click', () => showEditCustomOptionForm(option));

// 删除选项（动态绑定）
deleteBtn.addEventListener('click', () => deleteCustomOption(option.id));
```

### 待完成功能
- [ ] 组别下拉框动态加载所有可用组别（目前硬编码）
- [ ] 与片段/镜头属性表单集成（使用选项数据填充下拉框）
- [ ] 批量导入/导出功能

---

## 2026-03-05 - 自定义选项功能（基础框架）

### 需求
1. 读取 `assets/default/options.json` 作为系统初始选项（只读）
2. 自定义选项独立存储，与系统选项合并使用
3. 提供管理界面：添加、编辑、删除自定义选项
4. 支持备份/恢复功能

### 数据结构

**内置选项** (`assets/default/options.json`)：
```json
[
  {
    "group": "风格",
    "type": "写实风格",
    "style": "照片写实",
    "description": "高度还原现实光影..."
  }
]
```

**自定义选项** (用户数据目录 `options-custom.json`)：
```json
{
  "version": "1.0",
  "customOptions": [
    {
      "id": "custom_1234567890",
      "group": "风格",
      "type": "自定义类型",
      "style": "自定义风格",
      "description": "描述...",
      "builtin": false
    }
  ]
}
```

### 后端实现

#### 新增模块 `src/handlers/options.js`
**功能**：
- `loadDefaultOptions()` - 加载内置选项（只读）
- `loadCustomOptions()` - 加载自定义选项
- `saveCustomOptions()` - 保存自定义选项
- `getAllOptions()` - 获取所有选项（内置 + 自定义）
- `getOptionsByGroup()` - 按组别获取选项
- `getAllGroups()` - 获取所有组别

**IPC 接口**：
- `options:getAll` - 获取所有选项
- `options:getByGroup` - 按组别获取
- `options:getGroups` - 获取所有组别
- `options:addCustom` - 添加自定义选项
- `options:deleteCustom` - 删除自定义选项
- `options:updateCustom` - 更新自定义选项
- `options:getCustomList` - 获取自定义列表
- `options:backup` - 备份自定义选项
- `options:restore` - 恢复自定义选项
- `options:openFolder` - 打开选项文件夹

#### main.js 更新
```javascript
const { initOptionsIPC, initializeCustomOptions } = require('./handlers/options');

// 初始化
initializeCustomOptions();
initOptionsIPC();
```

#### preload.js 更新
新增 API 暴露：
- `getAllOptions()`
- `getOptionsByGroup(group)`
- `getGroups()`
- `addCustomOption(option)`
- `deleteCustomOption(optionId)`
- `updateCustomOption(optionId, updates)`
- `getCustomList()`
- `backupOptions()`
- `restoreOptions()`
- `openOptionsFolder()`

### 前端 UI

#### 设置面板新增
```html
<!-- 自定义选项管理 -->
<div class="settings-section">
  <h4>自定义选项管理</h4>
  <div class="setting-item">
    <label>系统初始选项</label>
    <input type="text" value="assets/default/options.json" readonly>
    <button id="open-options-folder-btn">打开文件夹</button>
  </div>
  <div class="setting-item">
    <button id="manage-custom-options-btn">管理自定义选项</button>
    <button id="backup-options-btn">备份选项</button>
    <button id="restore-options-btn">恢复选项</button>
  </div>
</div>
```

#### 管理弹窗
- 工具栏：添加选项、刷新
- 组别筛选器
- 选项列表（显示内置 + 自定义，内置标记为只读）
- 编辑表单：组别、类型、风格名称、描述

### 待完成功能
- [ ] 前端 JavaScript 逻辑实现
- [ ] 选项列表渲染
- [ ] 添加/编辑/删除功能
- [ ] 组别筛选功能
- [ ] 备份/恢复功能
- [ ] 与片段/镜头属性表单集成（使用选项数据）

---

## 2026-03-05 - 底部面板分割线优化

### 需求
属性栏和素材栏之间加一根分割线，现在什么都没有，区分不清

### 处理内容

#### CSS 修改
```css
/* 属性面板 - 左侧 2/3 */
.bottom-panel {
  left: 0;
  width: 66.66%;
  border-right: 2px solid var(--border-color);  /* 1px → 2px 加粗 */
}

/* 素材面板 - 右侧 1/3 */
.assets-panel {
  right: 0;
  width: 33.33%;
  border-left: 1px solid var(--border-color);  /* 新增 */
}
```

### 效果
- 属性面板右侧：2px 边框（更明显）
- 素材面板左侧：1px 边框（辅助分隔）
- 双层边框效果，清晰区分两个区域

---

## 2026-03-05 - 片段状态变更功能

### 需求
片段列表状态更改功能，同项目管理状态变更一样

### 处理内容

#### renderShotList 修改
```javascript
// 状态标签点击
const statusTag = shotElement.querySelector('.status-tag');
if (statusTag) {
  statusTag.addEventListener('click', (e) => {
    e.stopPropagation();
    showShotStatusMenu(shot, e);
  });
}
```

#### 新增函数
- `showShotStatusMenu(shot, event)` - 显示片段状态菜单
- `updateShotStatus(shot, newStatus)` - 更新片段状态

#### 状态选项
- 草稿（draft）
- 进行中（processing）
- 已完成（completed）
- 已取消（cancelled）

#### 实现逻辑
```javascript
async function updateShotStatus(shot, newStatus) {
  // 1. 加载项目数据
  const loadResult = await window.electronAPI.loadProject(projectDir);
  
  // 2. 找到片段并更新状态
  const shotIndex = loadResult.projectJson.shots?.findIndex(s => s.id === shot.id);
  loadResult.projectJson.shots[shotIndex].status = newStatus;
  
  // 3. 保存项目
  await window.electronAPI.saveProject(projectDir, loadResult.projectJson);
  
  // 4. 重新渲染片段列表
  renderShotList(loadResult.projectJson.shots || []);
}
```

### 效果
- 点击片段状态标签，弹出状态选择菜单
- 选择新状态后自动保存并刷新列表
- 状态标签颜色根据状态变化

---

## 2026-03-05 - 选中状态修复（片段/镜头）

### 问题
1. 片段列表点击不同片段，选中状态始终在第一个
2. 镜头列表点击不同镜头，选中状态始终在第一个
3. `data-id` 显示为 `undefined`

### 原因
从 AI 生成的项目或某些情况下，片段和镜头数据可能没有 `id` 字段，导致：
- `dataset.id` 为 `undefined`
- 选中状态无法正确匹配

### 修复方案

#### renderShotList 修复
```javascript
shots.forEach((shot, index) => {
  const shotElement = document.createElement('div');
  
  // 确保 ID 存在，没有则生成
  if (!shot.id) {
    shot.id = Date.now() + index;
  }
  shotElement.dataset.id = shot.id;
  
  // ...渲染逻辑
});
```

#### renderSceneList 修复
```javascript
scenes.forEach((scene, index) => {
  const sceneElement = document.createElement('div');
  
  // 确保 ID 存在，没有则生成
  if (!scene.id) {
    scene.id = Date.now() + index;
  }
  sceneElement.dataset.id = scene.id;
  
  // ...渲染逻辑
});
```

#### selectShot 修复
```javascript
// 使用字符串比较
const shotItem = Array.from(document.querySelectorAll('#shot-list .list-item'))
  .find(item => item.dataset.id === String(shot.id));
if (shotItem) {
  shotItem.classList.add('selected');
}
```

#### selectScene 修复
```javascript
// 使用字符串比较
const sceneItem = Array.from(document.querySelectorAll('#scene-list .list-item'))
  .find(item => item.dataset.id === String(scene.id));
if (sceneItem) {
  sceneItem.classList.add('selected');
}
```

---

## 2026-03-05 - 片段选项卡切换修复

### 问题
片段选项卡选中状态效果有 bug，不能切换选中的选项卡效果

### 原因
`showNewProjectModal` 函数中使用 `toggle('active', ...)` 但逻辑不正确

### 修复
```javascript
// 修改前
elements.modeTabs.forEach(tab => {
  tab.classList.toggle('active', tab.dataset.mode === 'manual');
});

// 修改后
elements.modeTabs.forEach(tab => {
  tab.classList.remove('active');
});
if (elements.modeTabs.length > 0) {
  elements.modeTabs[0].classList.add('active');
}
```

---

## 2026-03-05 - 镜头编号显示修复

### 问题
镜头列表显示：`N/A | 主持人中景开场`

### 原因
镜头数据中 `serialNumber` 字段为空或不存在

### 修复
```javascript
// 生成镜头编号（如果没有 serialNumber，使用序号）
const sceneNumber = scene.serialNumber || `镜头${index + 1}`;

sceneElement.innerHTML = `
  <div class="list-item-title">${sceneNumber} | ${scene.name}</div>
  ...
`;
```

### 效果
```
镜头 1 | 主持人中景开场
镜头 2 | 产品展示
镜头 3 | 操作演示
```

---

## 2026-03-05 - 状态标签位置优化

### 需求
将项目、片段状态标签修改到右上角固定位置

### 处理内容

#### CSS 修改
```css
.status-tag {
  position: absolute;
  top: 8px;
  right: 8px;        /* 右上角固定 */
  padding: 3px 8px;
  z-index: 10;
}

.list-item {
  padding: 8px 45px 8px 8px;  /* 右侧留白 45px */
  position: relative;
}
```

#### JavaScript 修改
- `renderProjectList()`: 状态标签移到 list-item 外层
- `renderShotList()`: 状态标签移到 list-item 外层

---

## 2026-03-05 - 项目面板宽度优化

### 需求
项目面板初始宽度改为 200px

### 处理内容
```css
.project-panel {
  width: 200px;        /* 15% → 200px */
  min-width: 150px;
  max-width: 500px;
}
```

---

## 2026-03-05 - 分栏拖拽功能

### 需求
项目、片段、镜头、提示词分栏可以拖拽宽度

### 处理内容

#### CSS 新增
```css
.panel-resizer {
  position: absolute;
  top: 0;
  right: -1px;
  width: 5px;
  height: 100%;
  cursor: col-resize;
}
```

#### JavaScript 新增
- `initPanelResizers()`: 初始化拖拽手柄
- `handleResizerMouseMove()`: 处理拖拽移动
- `handleResizerMouseUp()`: 处理拖拽结束
- `getPanelConstraints()`: 获取面板约束

#### 面板约束
| 面板 | 最小宽度 | 最大宽度 |
|------|---------|---------|
| 项目 | 150px | 500px |
| 片段 | 200px | 600px |
| 镜头 | 250px | 700px |
| 提示词 | 300px | 自动填充 |

---

## 2026-03-05 - 项目结构重构

### 需求
将代码拆分到多个模块文件，避免单个文件过大，不超过 5 个细化结构。

### 处理内容

#### 新增模块文件
| 文件 | 功能 | 行数 |
|------|------|------|
| `src/menu.js` | 原生菜单定义、日志窗口 | ~280 行 |
| `src/project.js` | 项目管理 IPC 处理器 | ~260 行 |
| `src/api.js` | LLM API 调用处理器 | ~150 行 |
| `src/template.js` | 模板管理 IPC 处理器 | ~140 行 |
| `src/main.js` | 主进程入口（简化） | ~60 行 |

#### main.js 简化
**修改前**: ~900 行  
**修改后**: ~60 行

**核心职责**:
- 创建主窗口
- 初始化各模块
- 设置原生菜单

**导入模块**:
```javascript
const { setMainMenu, initializeLogFiles } = require('./menu');
const { initProjectIPC } = require('./project');
const { initApiIPC } = require('./api');
const { initTemplateIPC, initializeDefaultTemplates } = require('./template');
```

### 优势
1. **代码组织清晰**: 每个模块职责单一
2. **易于维护**: 修改功能时只需关注对应模块
3. **便于扩展**: 新增功能时添加新模块
4. **降低耦合**: 模块间通过明确接口通信

---

## 2026-03-05 - 系统菜单与日志功能

### 需求
1. 原生菜单结构调整：文件、编辑、视图、系统
2. 将设置、模板库管理移动到系统菜单
3. 系统菜单添加：自定义选项（待定）、日志（开发日志、更新日志）

### 处理内容

#### 菜单结构调整
**文件菜单**：只保留退出  
**系统菜单**（新增）：
- 设置 (Cmd/Ctrl+,)
- 模板库管理 (Cmd/Ctrl+T)
- 日志（子菜单）
  - 开发日志
  - 更新日志
- 自定义选项（禁用，开发中）

#### 日志功能实现
**新增函数**: `openLogWindow(type)`

**功能特性**:
- 独立窗口显示日志内容（1000x700px）
- 深色主题样式
- 自动创建日志文件（如果不存在）
- 支持 Markdown 格式
- 移除菜单栏（避免循环打开）

**日志文件位置**:
- 开发日志：`%APPDATA%/kim-storyboard-assistant/logs/dev-log.md`
- 更新日志：`%APPDATA%/kim-storyboard-assistant/logs/update-log.md`

**初始化函数**: `initializeLogFiles()`
- 应用启动时自动检查并创建日志文件
- 从 `work/` 目录复制初始日志模板

---

## 2026-03-05 - 底部属性面板优化

### 需求
1. 属性和素材在同一面板内左右分栏显示（2/3 + 1/3）
2. 两个面板独立但同步显隐
3. 标题栏对齐，视觉统一

### 处理内容
- HTML 结构调整
- CSS 样式优化
- JavaScript 事件同步

---

## 2026-03-05 - 属性面板自动保存

### 需求
1. 移除保存/重置按钮
2. 失焦后自动保存（500ms 防抖）
3. 标题动态显示（片段名/镜头名 + 属性）

### 处理内容
- 添加 `data-autosave` 属性
- 实现 `autoSaveShotProperties` 和 `autoSaveSceneProperties` 函数
- 修改保存逻辑支持自动保存模式

---

## 2026-03-05 - 修复 API Key 测试连接问题

### 问题
第一次填写 API Key 后点击测试连接，提示没有输入 API Key

### 原因
`testApiConnection` 函数从 `settings.apiKeys` 读取，但用户输入后尚未保存

### 修复
直接从 DOM 元素获取最新输入值

---

## 2026-03-05 - 修复模板存储路径显示

### 问题
设置面板中模板存储位置显示的是文件路径而非文件夹路径

### 修复
- `main.js` 中 `template:getPath` 返回配置文件夹路径
- `renderer.js` 中更新显示逻辑

---

## 2026-03-05 - 手动创建项目优化

### 需求
将「结构化 JSON 数据」改为「AI 提示词」，支持粘贴 shots 数组格式

### 处理内容
- HTML 标签和 placeholder 更新
- 保持原有逻辑不变

---

### 需求
1. 原生菜单结构调整：文件、编辑、视图、系统
2. 将设置、模板库管理移动到系统菜单
3. 系统菜单添加：自定义选项（待定）、日志（开发日志、更新日志）

### 处理内容

#### 1. 菜单结构调整
**文件位置**: `src/main.js`

**修改内容**:
- 文件菜单：移除设置、模板库管理，只保留退出
- 系统菜单：新增，包含设置、模板库管理、日志、自定义选项

#### 2. 日志功能实现
**文件位置**: `src/main.js`

**新增函数**: `openLogWindow(type)`

**功能**:
- 开发日志 (`dev-log.md`): 记录每次开发迭代的需求和处理内容
- 更新日志 (`update-log.md`): 记录版本更新内容
- 日志文件自动创建在 `userDataPath/logs/` 目录
- 使用独立窗口显示日志内容，深色主题

**日志文件路径**:
- Windows: `%APPDATA%/kim-storyboard-assistant/logs/`

---

## 2026-03-05 - 底部属性面板优化

### 需求
1. 属性和素材在同一面板内左右分栏显示（2/3 + 1/3）
2. 两个面板独立但同步显隐
3. 标题栏对齐，视觉统一

### 处理内容
- HTML 结构调整
- CSS 样式优化
- JavaScript 事件同步

---

## 2026-03-05 - 属性面板自动保存

### 需求
1. 移除保存/重置按钮
2. 失焦后自动保存（500ms 防抖）
3. 标题动态显示（片段名/镜头名 + 属性）

### 处理内容
- 添加 `data-autosave` 属性
- 实现 `autoSaveShotProperties` 和 `autoSaveSceneProperties` 函数
- 修改保存逻辑支持自动保存模式

---

## 2026-03-05 - 修复 API Key 测试连接问题

### 问题
第一次填写 API Key 后点击测试连接，提示没有输入 API Key

### 原因
`testApiConnection` 函数从 `settings.apiKeys` 读取，但用户输入后尚未保存

### 修复
直接从 DOM 元素获取最新输入值

---

## 2026-03-05 - 修复模板存储路径显示

### 问题
设置面板中模板存储位置显示的是文件路径而非文件夹路径

### 修复
- `main.js` 中 `template:getPath` 返回配置文件夹路径
- `renderer.js` 中更新显示逻辑

---

## 2026-03-05 - 手动创建项目优化

### 需求
将「结构化 JSON 数据」改为「AI 提示词」，支持粘贴 shots 数组格式

### 处理内容
- HTML 标签和 placeholder 更新
- 保持原有逻辑不变

---
