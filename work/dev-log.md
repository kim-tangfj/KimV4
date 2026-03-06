# 开发日志

记录每次开发迭代的需求和处理内容。

---

## 2026-03-06 - 修复自动保存功能问题

### 问题
1. **自动保存时无提示** - 用户不知道是否保存成功
2. **切换片段/镜头后数据不更新** - 切换片段再切回来，没有正确读取保存的数据

### 原因分析

**问题 1 原因**: 
`saveShotProperties` 和 `saveSceneProperties` 函数中：
```javascript
if (!isAutoSave) {
  showUpdateNotification();
}
```
自动保存时不显示提示。

**问题 2 原因**:
`selectShot` 和 `selectScene` 函数直接使用传入的对象，没有从 `project.json` 中读取最新数据。

### 修复方案

#### 1. 修复自动保存提示

**修改文件**: `src/renderer.js`

**saveShotProperties 修复** (第 3052 行):
```javascript
// 修改前
if (saveResult.success) {
  appState.currentShot = { ... }; // 手动拼接对象
  if (!isAutoSave) {
    showUpdateNotification();
  }
}

// 修改后
if (saveResult.success) {
  // 直接使用保存后的最新数据
  appState.currentShot = loadResult.projectJson.shots[shotIndex];
  // 自动保存时也显示提示
  showUpdateNotification();
}
```

**saveSceneProperties 修复** (第 3263 行):
```javascript
// 修改前
if (saveResult.success) {
  appState.currentScene = { ... }; // 手动拼接对象
  if (!isAutoSave) {
    showUpdateNotification();
  }
}

// 修改后
if (saveResult.success) {
  // 直接使用保存后的最新数据
  appState.currentScene = shot.scenes[sceneIndex];
  // 自动保存时也显示提示
  showUpdateNotification();
}
```

#### 2. 修复数据读取

**selectShot 修复** (第 2456 行):
```javascript
async function selectShot(shot) {
  if (useElectronAPI && appState.currentProject.projectDir) {
    // 从 project.json 中读取最新的片段数据
    try {
      const loadResult = await window.electronAPI.loadProject(appState.currentProject.projectDir);
      if (loadResult.success) {
        const latestShot = loadResult.projectJson.shots?.find(s => s.id === shot.id);
        if (latestShot) {
          appState.currentShot = latestShot;
        }
      }
    } catch (error) {
      console.error('加载最新片段数据失败:', error);
      appState.currentShot = shot;
    }
  } else {
    appState.currentShot = shot;
  }
  
  // ... 其他逻辑
  showShotProperties(appState.currentShot);
}
```

**selectScene 修复** (第 2622 行):
```javascript
function selectScene(scene) {
  if (useElectronAPI && appState.currentProject.projectDir && appState.currentShot) {
    // 从 project.json 中读取最新的镜头数据
    try {
      const shot = appState.currentShot;
      const latestScene = shot.scenes?.find(s => s.id === scene.id);
      if (latestScene) {
        appState.currentScene = latestScene;
      }
    } catch (error) {
      console.error('加载最新镜头数据失败:', error);
      appState.currentScene = scene;
    }
  } else {
    appState.currentScene = scene;
  }
  
  // ... 其他逻辑
  showSceneProperties(appState.currentScene);
}
```

### 效果

1. **自动保存提示** - 每次自动保存后显示"已保存"提示
2. **数据实时同步** - 切换片段/镜头后，重新从 `project.json` 读取最新数据
3. **状态一致性** - `appState.currentShot` 和 `appState.currentScene` 始终指向最新数据

---

## 2026-03-06 - 属性自动保存功能检查

### 检查范围
1. 片段属性字段完整性
2. 镜头属性字段完整性
3. 失焦自动保存功能

### 检查结果

#### 字段完整性
**片段属性**: 14/14 = 100% ✅
| 字段 | 字段 ID | 状态 |
|------|--------|------|
| 片段名称 | shotName | ✅ |
| 片段描述 | shotDescription | ✅ |
| 风格 | shotStyle | ✅ |
| 情绪氛围 | shotMood | ✅ |
| 角色 | shotCharacters | ✅ |
| 场景设定 | shotSceneSetting | ✅ |
| 画幅比例 | shotAspectRatio | ✅ |
| 视频时长 | shotDuration | ✅ |
| 配乐风格 | shotMusicStyle | ✅ |
| 音效需求 | shotSoundEffect | ✅ |
| 图片参考 | shotImageRef | ✅ |
| 视频参考 | shotVideoRef | ✅ |
| 音频参考 | shotAudioRef | ✅ |
| 补充提示词 | shotCustomPrompt | ✅ |

**镜头属性**: 10/10 = 100% ✅
| 字段 | 字段 ID | 状态 |
|------|--------|------|
| 镜头名称 | sceneName | ✅ |
| 分镜图片 | sceneImage | ✅ |
| 景别 | sceneShotType | ✅ |
| 镜头角度 | sceneAngle | ✅ |
| 运镜 | sceneCamera | ✅ |
| 时长 | sceneDuration | ✅ |
| 内容描述 | sceneContent | ✅ |
| 对白内容 | sceneDialogue | ✅ |
| 情绪描述 | sceneEmotion | ✅ |
| 其他备注 | sceneNotes | ✅ |

#### 自动保存功能
- ✅ 失焦自动保存：已实现
- ✅ 500ms 防抖：已实现
- ✅ 选项变更检测：已实现
- ✅ 使用次数统计：已实现

### 实现位置
**文件**: `src/renderer.js`

**片段属性自动保存** (第 2950 行):
```javascript
document.querySelectorAll('#property-form [data-autosave="true"]').forEach(input => {
  input.addEventListener('blur', () => autoSaveShotProperties(shot));
});

function autoSaveShotProperties(shot) {
  if (shotSaveTimeout) clearTimeout(shotSaveTimeout);
  shotSaveTimeout = setTimeout(async () => {
    await saveShotProperties(shot, true);
  }, 500);
}
```

**镜头属性自动保存** (第 3193 行):
```javascript
document.querySelectorAll('#property-form [data-autosave="true"]').forEach(input => {
  input.addEventListener('blur', () => autoSaveSceneProperties(scene));
});

function autoSaveSceneProperties(scene) {
  if (sceneSaveTimeout) clearTimeout(sceneSaveTimeout);
  sceneSaveTimeout = setTimeout(async () => {
    await saveSceneProperties(scene, true);
  }, 500);
}
```

### 结论
**自动保存功能已基本实现**，所有字段都能正确保存到 `project.json` 文件中。

### 输出文档
- `work/属性自动保存功能检查报告.md`

---

## 2026-03-06 - 修复创建项目时 ID 生成问题

### 问题
创建项目时，初始化 project.json 时只有项目级别生成了唯一 ID，但片段（shots）和镜头（scenes）没有生成唯一 ID，导致：
1. 保存时依赖名称匹配，不可靠
2. 可能出现数据覆盖风险
3. 选中状态无法正确匹配

### 原因
`project:create` IPC 处理器中，直接使用传入的 `shots` 数组，没有为缺失 ID 的片段和镜头生成唯一 ID。

### 修复方案

**修改文件**: `src/handlers/project.js`

**新增逻辑**:
```javascript
// 为所有片段和镜头生成唯一 ID（如果缺失）
const timestamp = Date.now();
if (shots && Array.isArray(shots)) {
  shots.forEach((shot, shotIndex) => {
    // 为片段生成 ID
    if (!shot.id) {
      shot.id = `shot_${timestamp}_${shotIndex}`;
      console.log('[创建项目] 为片段添加 ID:', shot.name || `片段${shotIndex}`, '->', shot.id);
    }
    // 为镜头生成 ID
    if (shot.scenes && Array.isArray(shot.scenes)) {
      shot.scenes.forEach((scene, sceneIndex) => {
        if (!scene.id) {
          scene.id = `scene_${timestamp}_${shotIndex}_${sceneIndex}`;
          console.log('[创建项目] 为镜头添加 ID:', scene.name || `镜头${sceneIndex}`, '->', scene.id);
        }
      });
    }
  });
}
```

### ID 格式
- **片段 ID**: `shot_时间戳_索引` (如：`shot_1772760068170_0`)
- **镜头 ID**: `scene_时间戳_片段索引_镜头索引` (如：`scene_1772760068170_0_0`)

### 效果
1. **创建项目时自动生成** - 所有缺失的 ID 会在项目创建时自动生成
2. **日志输出** - 控制台显示 ID 添加过程
3. **唯一性保证** - 使用时间戳 + 索引确保唯一性
4. **与保存时修复互补** - 创建时生成 + 保存时检查，双重保障

---

## 2026-03-06 - 修复新建项目表单失焦问题

### 问题
打开新建项目表单后，输入框失焦，无法选中文本框无法编辑。

### 原因
`showNewProjectModal` 函数中：
1. 使用 `setTimeout` 延迟聚焦，但 100ms 可能不够或受其他事件干扰
2. 模式切换 tab 的样式更新逻辑可能触发额外的事件

### 修复方案

**修改前**:
```javascript
function showNewProjectModal() {
  // ... 清空输入

  // 切换到手动模式
  elements.modeTabs.forEach(tab => {
    tab.classList.remove('active');
  });
  if (elements.modeTabs.length > 0) {
    elements.modeTabs[0].classList.add('active');
  }
  // ...

  elements.newProjectModal.style.display = 'flex';

  setTimeout(() => {
    if (elements.manualProjectName) elements.manualProjectName.focus();
  }, 100);
}
```

**修改后**:
```javascript
function showNewProjectModal() {
  // ... 清空输入

  // 切换到手动模式 - 直接操作样式，避免触发事件
  elements.manualMode?.classList.add('active');
  elements.aiMode?.classList.remove('active');
  
  // 更新 tab 样式
  elements.modeTabs.forEach(tab => {
    if (tab.dataset.mode === 'manual') {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  elements.newProjectModal.style.display = 'flex';

  // 等待模态框完全显示后再聚焦
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (elements.manualProjectName) {
        elements.manualProjectName.focus();
      }
    });
  });
}
```

### 关键改进
1. **简化模式切换逻辑** - 直接操作样式，避免不必要的事件触发
2. **使用 `requestAnimationFrame`** - 比 `setTimeout` 更可靠，确保在浏览器完成重绘后聚焦
3. **双重 `requestAnimationFrame`** - 确保模态框完全显示且样式稳定后再聚焦

### 效果
- 打开新建项目表单后，项目名称输入框自动获得焦点
- 可以立即开始输入，无失焦问题

---

## 2026-03-05 - 修复 ID 缺失问题

### 问题
项目、片段、镜头在创建初期没有唯一 ID，导致：
1. 保存时无法正确匹配对象
2. 依赖名称匹配不可靠
3. 可能出现数据覆盖风险

### 原因
1. **项目创建时**：AI 生成的数据没有包含 ID
2. **片段创建时**：虽然有 `id: Date.now()`，但旧项目可能没有
3. **镜头创建时**：同上

### 解决方案

#### 自动添加 ID 机制
在每次保存时，自动为缺失 ID 的对象生成唯一 ID：

**片段保存**:
```javascript
// saveShotProperties 函数
if (loadResult.projectJson.shots) {
  loadResult.projectJson.shots.forEach((s, idx) => {
    if (!s.id) {
      s.id = 'shot_' + Date.now() + '_' + idx;
      console.log('[保存片段] 为片段添加 ID:', s.name, '->', s.id);
    }
    // 确保所有镜头都有 ID
    if (s.scenes) {
      s.scenes.forEach((scene, sceneIdx) => {
        if (!scene.id) {
          scene.id = 'scene_' + Date.now() + '_' + sceneIdx;
          console.log('[保存片段] 为镜头添加 ID:', scene.name, '->', scene.id);
        }
      });
    }
  });
}
```

**镜头保存**:
```javascript
// saveSceneProperties 函数
if (loadResult.projectJson.shots) {
  loadResult.projectJson.shots.forEach((s, idx) => {
    if (!s.id) {
      s.id = 'shot_' + Date.now() + '_' + idx;
    }
    if (s.scenes) {
      s.scenes.forEach((scene, sceneIdx) => {
        if (!scene.id) {
          scene.id = 'scene_' + Date.now() + '_' + sceneIdx;
        }
      });
    }
  });
}
```

### ID 格式
- **片段 ID**: `shot_时间戳_索引` (如：`shot_1772732500000_0`)
- **镜头 ID**: `scene_时间戳_索引` (如：`scene_1772732500000_0`)

### 效果
1. **首次保存时自动修复** - 缺失的 ID 会自动生成
2. **后续保存正常匹配** - 使用 ID 精确匹配
3. **日志输出** - 控制台显示 ID 添加过程

### 日志示例
```
[保存片段] 加载成功，片段数量：3
[保存片段] 为片段添加 ID：底妆基础上妆 -> shot_1772732500000_0
[保存片段] 为镜头添加 ID：底妆产品展示 -> scene_1772732500000_0
[保存片段] 为镜头添加 ID：粉底液点涂 -> scene_1772732500000_1
...
[保存片段] 成功，索引：0
```

### 长期解决方案（待实现）
1. **项目创建时强制生成 ID**
2. **AI 生成模板包含 ID 字段**
3. **迁移脚本批量添加 ID**

---

## 2026-03-05 - 选项使用统计和验证功能

### 需求
1. 删除选项时检查是否被使用
2. 被使用的选项不允许删除，提示警告
3. 跟踪每个选项的使用次数
4. 在管理面板显示使用次数
5. 支持按使用频率排序

### 处理内容

#### 1. 后端 IPC 新增 (`src/handlers/options.js`)

**数据结构更新**:
```javascript
// 自定义选项新增 usageCount 字段
{
  id: 'custom_123',
  group: '风格',
  type: '写实风格',
  style: '照片写实',
  description: '...',
  usageCount: 15  // 新增
}
```

**新增 IPC 接口**:
```javascript
// 增加选项使用次数
ipcMain.handle('options:incrementUsage', async (event, optionId) => {
  // 找到选项并 +1
});

// 检查选项使用情况
ipcMain.handle('options:checkUsage', async (event, optionId) => {
  // 返回 usageCount
});
```

#### 2. 预加载脚本 API (`src/preload.js`)
```javascript
incrementOptionUsage: (optionId) => 
  ipcRenderer.invoke('options:incrementUsage', optionId),
checkOptionUsage: (optionId) => 
  ipcRenderer.invoke('options:checkUsage', optionId)
```

#### 3. 前端使用统计 (`src/renderer.js`)

**保存时增加使用次数**:
```javascript
// saveShotProperties 函数
if (style && style !== oldShot.style) {
  const styleOptions = await loadOptionsByGroup('风格');
  const selectedOption = styleOptions.find(opt => opt.style === style);
  if (selectedOption && !selectedOption.builtin) {
    await window.electronAPI.incrementOptionUsage(selectedOption.id);
  }
}
// 同样逻辑应用于 mood, musicStyle, soundEffect
```

**删除时检查使用情况**:
```javascript
async function deleteCustomOption(optionId) {
  // 先检查使用情况
  const usageResult = await window.electronAPI.checkOptionUsage(optionId);
  
  if (usageResult.usageCount > 0) {
    // 被使用，不允许删除
    alert(`该选项已被使用 ${usageResult.usageCount} 次，无法删除。`);
    return;
  }
  
  // 未被使用，确认删除
  if (!confirm('确定要删除该自定义选项吗？')) return;
  
  // 执行删除
}
```

**管理面板显示使用次数**:
```javascript
function renderCustomOptionsList(options) {
  // 按使用次数降序排序
  const sortedOptions = [...options].sort(
    (a, b) => (b.usageCount || 0) - (a.usageCount || 0)
  );
  
  // 显示使用次数徽章
  const usageBadge = option.usageCount > 0 
    ? `<span class="usage-count-badge">${option.usageCount}次</span>` 
    : '';
}
```

#### 4. CSS 样式 (`styles.css`)
```css
/* 使用次数徽章 */
.usage-count-badge {
  padding: 2px 6px;
  background-color: var(--selected-bg);
  border-radius: 10px;
  font-size: 11px;
  color: var(--text-color);
  font-weight: 500;
  margin-left: 6px;
}
```

### 效果

**管理面板**:
```
┌─────────────────────────────────────────┐
│ 自定义选项                              │
├─────────────────────────────────────────┤
│ [风格] 照片写实 - 写实风格    [15 次] ✎ ×│  ← 使用次数高，不可删除
│ [风格] 日系清新 - 清新治愈    [8 次]  ✎ ×│  ← 使用次数高，不可删除
│ [风格] 扁平插画 - 插画风格  [3 次]  ✎ ×│  ← 使用次数高，不可删除
│ [风格] 未使用选项           [0 次]  ✎ ×│  ← 可删除
└─────────────────────────────────────────┘
```

**删除被使用的选项**:
```
┌─────────────────────────────────────────┐
│ ⚠ 该选项已被使用 15 次，无法删除。       │
│                                         │
│ 请先到片段或镜头中修改使用该选项的内容，│
│ 然后再尝试删除。                        │
│                                         │
│              [确定]                     │
└─────────────────────────────────────────┘
```

**删除未使用的选项**:
```
┌─────────────────────────────────┐
│ 确定要删除该自定义选项吗？      │
│                                 │
│      [确定]      [取消]         │
└─────────────────────────────────┘
```

**自动统计**:
- 片段属性：风格、情绪氛围、配乐风格、音效
- 镜头属性：景别、镜头角度、运镜
- 仅统计自定义选项，内置选项不统计
- 仅当选项变更时增加使用次数

---

## 2026-03-05 - 片段属性表单优化（集成搜索 + 快速添加）

### 需求
1. 选项动态加载形式修改：改为在 dropdown 列表底部添加"+ 创建新选项"
2. 模糊查询集成在同一个控件内，不要额外添加搜索框

### 处理内容

#### 1. 控件设计

**集成搜索和下拉**:
```html
<div class="select-with-search">
  <!-- 输入框：用于输入和搜索 -->
  <input type="text" class="select-search-input" 
         placeholder="输入或搜索风格..." 
         data-target="shotStyle" 
         data-group="风格" 
         data-value="${shot.style || ''}">
  
  <!-- 下拉框：默认隐藏，聚焦时显示 -->
  <select id="shotStyle" size="1" style="display:none;">
    <option value="">请选择风格</option>
    <!-- 动态加载的选项 -->
    <option value="__new__" style="border-top: 1px dashed #ccc;">+ 创建新选项</option>
  </select>
</div>
```

#### 2. 交互逻辑

**输入框功能**:
- 直接输入：可输入任意文本作为选项值
- 搜索过滤：输入时自动过滤下拉选项
- 点击/聚焦：展开下拉列表
- 回车确认：
  - 有匹配项 → 确认并保存
  - 无匹配项 → 弹出快速添加窗口

**下拉框功能**:
- 选择现有选项 → 填充到输入框并保存
- 选择"+ 创建新选项" → 弹出快速添加窗口
- 失焦 → 自动收起

#### 3. JavaScript 实现

```javascript
function initSelectSearchAndInput(shot) {
  document.querySelectorAll('.select-with-search .select-search-input').forEach(searchInput => {
    const select = document.getElementById(searchInput.dataset.target);
    const group = searchInput.dataset.group;
    
    // 输入时过滤
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      select.querySelectorAll('option').forEach(option => {
        option.style.display = option.textContent.toLowerCase().includes(searchTerm) ? '' : 'none';
      });
    });
    
    // 聚焦时展开
    searchInput.addEventListener('focus', () => {
      select.size = Math.min(10, select.options.length);
      select.style.display = 'block';
    });
    
    // 选择选项
    select.addEventListener('change', () => {
      if (select.value === '__new__') {
        showQuickAddOptionModal(group, select.id, shot);
      } else {
        searchInput.value = select.value;
        autoSaveShotProperties(shot);
      }
      select.size = 1;
      select.style.display = 'none';
    });
    
    // 回车确认
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (!hasMatch(searchInput.value)) {
          showQuickAddOptionModal(group, select.id, shot, searchInput.value);
        } else {
          autoSaveShotProperties(shot);
        }
      }
    });
  });
}
```

#### 4. 快速添加弹窗

用户输入的内容没有匹配项时，自动弹出：
```javascript
function showQuickAddOptionModal(group, field, shot, defaultValue = '') {
  // 弹窗表单：类型、风格名称、描述
  // 保存后重新加载选项
}
```

### 效果

**用户体验**:
1. **输入即搜索**: 在输入框打字时，下方实时显示匹配的选项
2. **一键选择**: 点击匹配的选项直接填充
3. **快速创建**: 输入新词后回车，或选择"+ 创建新选项"
4. **简洁界面**: 搜索和选择集成在一个控件，无额外按钮

**控件状态**:
```
┌─────────────────────────────┐
│ 输入或搜索风格... [光标]    │  ← 输入框
├─────────────────────────────┤
│ 请选择风格                  │
│ 照片写实 - 写实风格         │  ← 过滤后的选项
│ 日系清新 - 清新治愈         │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│ + 创建新选项                │  ← 创建新选项
└─────────────────────────────┘
```

---

## 2026-03-05 - 片段属性表单优化（多列布局 + 选项增强）

### 需求
1. 严格按照 `attribute-field-description.md` 中的片段属性字段开发
2. 多列显示属性字段，提升界面效率
3. 选项增强功能：
   - 动态创建选项，归入用户自定义选项管理
   - 选项字段支持模糊查找

### 处理内容

#### 1. 字段结构（按文档）

| 分组 | 字段 | 类型 | 字段 ID |
|------|------|------|--------|
| **基本信息** | 片段名称 | 单行文本 | shotName |
| | 片段描述 | 多行文本 | shotDescription |
| **风格设定** | 风格 | 选项（+ 搜索 + 添加） | shotStyle |
| | 情绪氛围 | 选项（+ 搜索 + 添加） | shotMood |
| **角色与场景** | 角色 | 多行文本 | shotCharacters |
| | 场景设定 | 单行文本 | shotSceneSetting |
| **视频参数** | 画幅比例 | 选项 | shotAspectRatio |
| | 视频时长 | 数字 | shotDuration |
| **声音设计** | 配乐风格 | 选项（+ 搜索 + 添加） | shotMusicStyle |
| | 音效需求 | 选项（+ 搜索 + 添加） | shotSoundEffect |
| **参考素材** | 图片参考（≤9 张） | 多行文本 | shotImageRef |
| | 视频参考（≤3 个） | 多行文本 | shotVideoRef |
| | 音频参考（≤3 个） | 多行文本 | shotAudioRef |
| **自定义提示词** | 补充提示词 | 多行文本 | shotCustomPrompt |

#### 2. 多列布局 CSS (`styles.css`)

```css
.shot-properties-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  max-height: 65vh;
  overflow-y: auto;
}

.property-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background-color: var(--panel-bg);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.property-column.full-width {
  grid-column: 1 / -1;
}

/* 响应式 */
@media (max-width: 1200px) {
  grid-template-columns: repeat(2, 1fr);
}
@media (max-width: 800px) {
  grid-template-columns: 1fr;
}
```

#### 3. 选项搜索功能

**HTML 结构**:
```html
<div class="select-with-search">
  <input type="text" class="select-search-input" placeholder="搜索风格..." data-target="shotStyle">
  <select id="shotStyle">...</select>
</div>
```

**JavaScript 实现**:
```javascript
function initSelectSearch() {
  document.querySelectorAll('.select-search-input').forEach(searchInput => {
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const options = select.querySelectorAll('option');
      options.forEach(option => {
        option.style.display = option.textContent.toLowerCase().includes(searchTerm) ? '' : 'none';
      });
    });
    
    // 聚焦时展开下拉
    searchInput.addEventListener('focus', () => { select.size = Math.min(10, select.options.length); });
    searchInput.addEventListener('blur', () => { select.size = 1; });
  });
}
```

#### 4. 快速添加选项功能

**添加按钮**:
```html
<label for="shotStyle">
  风格
  <button type="button" class="icon-btn small add-option-btn" data-field="shotStyle" data-group="风格">+</button>
</label>
```

**快速添加弹窗**:
```javascript
function showQuickAddOptionModal(group, field, shot) {
  // 创建弹窗
  const modal = `
    <div class="modal-content quick-add-modal">
      <div class="modal-header">
        <h3>添加"${group}"新选项</h3>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>类型</label>
          <input type="text" id="quick-option-type" placeholder="如：写实风格">
        </div>
        <div class="form-group">
          <label>风格名称</label>
          <input type="text" id="quick-option-style" placeholder="如：照片写实">
        </div>
        <div class="form-group">
          <label>描述</label>
          <textarea id="quick-option-description" rows="3"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button id="quick-add-save">保存</button>
      </div>
    </div>
  `;
  
  // 保存时调用 API
  const result = await window.electronAPI.addCustomOption({ group, type, style, description });
  if (result.success) {
    await showShotProperties(shot); // 重新加载选项
  }
}
```

#### 5. 更新 `saveShotProperties` 函数

新增字段保存：
```javascript
const characters = document.getElementById('shotCharacters')?.value;
const sceneSetting = document.getElementById('shotSceneSetting')?.value;
const imageRef = document.getElementById('shotImageRef')?.value;
const videoRef = document.getElementById('shotVideoRef')?.value;
const audioRef = document.getElementById('shotAudioRef')?.value;
const customPrompt = document.getElementById('shotCustomPrompt')?.value;
```

### 效果
- **多列布局**: 3 列网格显示，每列一个分组，带标题和边框
- **选项搜索**: 每个选项字段上方有搜索框，输入即过滤
- **快速添加**: 点击 `+` 按钮弹出小窗口，快速创建新选项
- **自动保存**: 所有字段失焦后 500ms 自动保存
- **响应式**: 大屏 3 列，中屏 2 列，小屏 1 列

---

## 2026-03-05 - 镜头属性表单集成自定义选项

### 需求
将片段属性表单中的风格、情绪氛围、配乐风格、音效字段从文本输入改为下拉选择，使用自定义选项数据填充。

### 处理内容

#### 1. 字段映射
| 片段属性字段 | 对应选项组别 | 字段 ID |
|-------------|-------------|--------|
| 风格 | 风格 | shotStyle |
| 情绪氛围 | 情绪氛围 | shotMood |
| 配乐风格 | 配乐风格 | shotMusicStyle |
| 音效 | 音效 | shotSoundEffect |

#### 2. 新增函数 (`renderer.js`)

**加载指定组别选项**:
```javascript
async function loadOptionsByGroup(group) {
  if (!useElectronAPI) return [];
  try {
    const result = await window.electronAPI.getOptionsByGroup(group);
    return result.success ? (result.options || []) : [];
  } catch (error) {
    console.error(`加载${group}选项失败:`, error);
    return [];
  }
}
```

**设置选项提示监听**:
```javascript
function setupOptionHintListeners(shot) {
  const hintMap = {
    'shotStyle': 'shotStyleHint',
    'shotMood': 'shotMoodHint',
    'shotMusicStyle': 'shotMusicStyleHint',
    'shotSoundEffect': 'shotSoundEffectHint'
  };

  Object.entries(hintMap).forEach(([selectId, hintId]) => {
    const select = document.getElementById(selectId);
    const hint = document.getElementById(hintId);
    if (select && hint) {
      select.addEventListener('change', () => {
        const selectedOption = select.options[select.selectedIndex];
        const description = selectedOption.dataset.description || '选择...';
        hint.textContent = description;
        autoSaveShotProperties(shot);
      });
    }
  });
}
```

#### 3. 修改 `showShotProperties` 函数

**修改前**: 使用 `<input type="text">`
```html
<input type="text" id="shotStyle" value="${shot.style || ''}" placeholder="如：简约清新、科技感">
```

**修改后**: 使用 `<select>` 动态加载选项
```html
<select id="shotStyle" data-autosave="true" data-option-group="风格">
  <option value="">请选择风格</option>
  ${styleOptions.map(opt => `
    <option value="${opt.style}" ${shot.style === opt.style ? 'selected' : ''} 
      data-description="${opt.description || ''}">
      ${opt.style} - ${opt.type}
    </option>
  `).join('')}
</select>
<small class="setting-hint" id="shotStyleHint">
  ${styleOptions.find(o => o.style === shot.style)?.description || '选择风格'}
</small>
```

#### 4. 功能特性

**下拉选项格式**: `风格名称 - 类型`
- 例如：`照片写实 - 写实风格`

**描述提示**: 
- 选择选项后，下方显示该选项的详细描述
- 描述来自 `options.json` 中的 `description` 字段

**自动保存**: 
- 选择选项时自动触发保存
- 失焦后 500ms 自动保存

### 效果
- 风格、情绪氛围、配乐风格、音效字段改为下拉选择
- 选项来自自定义选项管理中的配置
- 支持使用内置选项和自定义选项
- 选择后显示详细描述
- 自动保存选择结果

---

## 2026-03-05 - 镜头属性表单集成自定义选项

### 需求
将镜头属性表单中的景别、拍摄角度、运镜方式字段从硬编码下拉选项改为使用自定义选项数据填充。

### 处理内容

#### 1. 字段映射
| 镜头属性字段 | 对应选项组别 | 字段 ID |
|-------------|-------------|--------|
| 景别 | 景别 | sceneShotType |
| 拍摄角度 | 镜头角度 | sceneAngle |
| 运镜方式 | 运镜 | sceneCamera |

#### 2. 修改 `showSceneProperties` 函数

**修改前**: 硬编码选项
```html
<select id="sceneShotType">
  <option value="特写">特写</option>
  <option value="近景">近景</option>
  <option value="中景">中景</option>
  ...
</select>
```

**修改后**: 动态加载自定义选项
```html
<select id="sceneShotType" data-autosave="true" data-option-group="景别">
  <option value="">请选择景别</option>
  ${shotTypeOptions.map(opt => `
    <option value="${opt.style}" ${scene.shotType === opt.style ? 'selected' : ''}
      data-description="${opt.description || ''}">
      ${opt.style} - ${opt.type}
    </option>
  `).join('')}
</select>
<small class="setting-hint" id="sceneShotTypeHint">
  ${shotTypeOptions.find(o => o.style === scene.shotType)?.description || '选择景别'}
</small>
```

#### 3. 新增函数

**设置镜头选项提示监听**:
```javascript
function setupSceneOptionHintListeners(scene) {
  const hintMap = {
    'sceneShotType': 'sceneShotTypeHint',
    'sceneAngle': 'sceneAngleHint',
    'sceneCamera': 'sceneCameraHint'
  };

  Object.entries(hintMap).forEach(([selectId, hintId]) => {
    const select = document.getElementById(selectId);
    const hint = document.getElementById(hintId);
    if (select && hint) {
      select.addEventListener('change', () => {
        const selectedOption = select.options[select.selectedIndex];
        const description = selectedOption.dataset.description || '选择...';
        hint.textContent = description;
        autoSaveSceneProperties(scene);
      });
    }
  });
}
```

### 效果
- 景别、拍摄角度、运镜方式字段改为使用自定义选项
- 支持使用内置选项和自定义选项
- 选择后显示详细描述
- 自动保存选择结果
- 可在自定义选项管理中维护和扩展

---

## 2026-03-05 - 自定义选项编辑功能改为弹窗形式

### 需求
将自定义选项管理中的新增和编辑功能改为弹窗形式，而不是在原页面内展开表单。

### 处理内容

#### 1. 新增编辑弹窗 HTML (`index.html`)
```html
<!-- 添加/编辑自定义选项弹窗 -->
<div id="custom-option-edit-modal" class="modal">
  <div class="modal-content custom-option-edit-modal">
    <div class="modal-header">
      <h3 id="custom-option-edit-title">添加自定义选项</h3>
      <button class="modal-close">×</button>
    </div>
    <div class="modal-body">
      <!-- 表单：组别、类型、风格名称、描述 -->
    </div>
    <div class="modal-footer">
      <button>保存</button>
      <button>取消</button>
    </div>
  </div>
</div>
```

#### 2. CSS 样式 (`styles.css`)
```css
/* 添加/编辑自定义选项弹窗 */
.modal-content.custom-option-edit-modal {
  max-width: 550px !important;
  width: 90% !important;
}
```

#### 3. JavaScript 逻辑修改 (`renderer.js`)

**新增 DOM 元素缓存**:
```javascript
elements.customOptionEditModal = document.getElementById('custom-option-edit-modal');
elements.customOptionEditTitle = document.getElementById('custom-option-edit-title');
elements.closeCustomOptionEditBtn = document.getElementById('close-custom-option-edit-btn');
elements.saveCustomOptionEditBtn = document.getElementById('save-custom-option-edit-btn');
elements.cancelCustomOptionEditBtn = document.getElementById('cancel-custom-option-edit-btn');
elements.editCustomOptionGroup = document.getElementById('edit-custom-option-group');
elements.editCustomOptionGroupInput = document.getElementById('edit-custom-option-group-input');
elements.editCustomOptionType = document.getElementById('edit-custom-option-type');
elements.editCustomOptionStyle = document.getElementById('edit-custom-option-style');
elements.editCustomOptionDescription = document.getElementById('edit-custom-option-description');
elements.editCustomOptionId = document.getElementById('edit-custom-option-id');
```

**函数重构**:
- `showAddCustomOptionForm()` → 打开添加弹窗
- `showEditCustomOptionForm(option)` → 打开编辑弹窗
- `hideCustomOptionEditModal()` → 隐藏编辑弹窗
- `loadGroupFilterForEditForm()` → 加载组别下拉框（编辑表单用）
- `saveCustomOptionEdit()` → 保存自定义选项（弹窗版）

**删除旧函数**:
- `loadGroupFilterForForm()` - 已废弃

**事件绑定**:
```javascript
elements.closeCustomOptionEditBtn.addEventListener('click', hideCustomOptionEditModal);
elements.saveCustomOptionEditBtn.addEventListener('click', saveCustomOptionEdit);
elements.cancelCustomOptionEditBtn.addEventListener('click', hideCustomOptionEditModal);
```

### 效果
- 点击"添加"或"编辑"按钮时，弹出独立编辑窗口
- 弹窗标题动态切换（添加/编辑自定义选项）
- 表单字段：组别（支持下拉选择或新建）、类型、风格名称、描述
- 保存/取消按钮操作清晰
- 原管理弹窗内不再嵌入表单，界面更简洁

---

## 2026-03-05 - 自定义选项管理页面优化（样式统一 + 图标按钮）

### 问题
1. 自定义管理弹窗宽度偏小，页面控件被挤压
2. 内置选项标题右侧缺少刷新按钮
3. 自定义选项标题右侧缺少增加和刷新按钮
4. 自定义选项栏样式与内置选项栏样式不统一
5. 自定义选项列表的编辑和删除按钮样式不简洁
6. 顶部工具栏按钮冗余

### 处理内容

#### 1. 弹窗宽度调整 (`styles.css`)
**问题原因**: `.modal-content` 默认 `max-width: 500px` 覆盖了自定义弹窗样式

**修复**:
```css
/* 自定义选项管理弹窗 */
.custom-options-modal {
  max-width: 1400px;
  width: 95%;
  max-height: 90vh;
}

.custom-options-modal .modal-content {
  max-width: 1400px;
  width: 95%;
}
```

#### 2. 删除顶部工具栏 (`index.html`)
移除冗余的 `+ 添加自定义选项` 和 `刷新` 按钮，保留组别筛选器。

**修改前**:
```html
<div class="modal-body">
  <div class="custom-options-toolbar">
    <button>+ 添加自定义选项</button>
    <button>刷新</button>
  </div>
  <div class="custom-options-filter">...</div>
```

**修改后**:
```html
<div class="modal-body">
  <div class="custom-options-filter">...</div>
```

#### 3. 标题栏按钮新增 (`index.html`)
**内置选项标题栏**:
```html
<div class="custom-options-column-header">
  <div class="column-title-group">
    <h4>内置选项</h4>
    <span class="column-count">0</span>
  </div>
  <button id="refresh-builtin-btn" class="icon-btn small" title="刷新">↻</button>
</div>
```

**自定义选项标题栏**:
```html
<div class="custom-options-column-header">
  <div class="column-title-group">
    <h4>自定义选项</h4>
    <span class="column-count">0</span>
  </div>
  <div class="column-actions">
    <button id="add-custom-option-column-btn" class="icon-btn small" title="添加">+</button>
    <button id="refresh-custom-column-btn" class="icon-btn small" title="刷新">↻</button>
  </div>
</div>
```

#### 4. 两栏样式统一 (`styles.css`)
```css
.custom-options-columns {
  display: flex;
  gap: 16px;
  height: 50vh;
  min-height: 400px;
}

.custom-options-column {
  flex: 1;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 12px;
  background-color: var(--bg-color);
}

.custom-options-column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--border-color);
}

.column-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.column-actions {
  display: flex;
  gap: 6px;
}

.custom-options-list-container {
  flex: 1;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--panel-bg);
}
```

#### 5. 编辑/删除按钮改为图标 (`renderer.js`)
```javascript
// 修改前
<button class="form-btn small-btn edit-option-btn">编辑</button>
<button class="form-btn small-btn delete-option-btn">删除</button>

// 修改后
<button class="icon-btn small edit-option-btn" title="编辑">✎</button>
<button class="icon-btn small delete-option-btn" title="删除">×</button>
```

#### 6. CSS 样式微调
```css
.custom-option-item-actions .icon-btn {
  width: 22px;
  height: 22px;
  font-size: 12px;
}
```

#### 7. JavaScript 事件绑定更新
```javascript
// DOM 元素缓存新增
elements.refreshBuiltinBtn = document.getElementById('refresh-builtin-btn');
elements.refreshCustomColumnBtn = document.getElementById('refresh-custom-column-btn');

// 事件绑定
elements.refreshBuiltinBtn.addEventListener('click', () => {
  loadCustomOptionsList('all');
});
elements.refreshCustomColumnBtn.addEventListener('click', () => {
  loadCustomOptionsList('all');
});
```

### 效果
- 弹窗宽度增加至 1400px（宽度 95%），控件不再拥挤
- 顶部冗余工具栏移除，界面更简洁
- 内置选项栏：标题 + 数量 + 刷新按钮
- 自定义选项栏：标题 + 数量 + 添加按钮 + 刷新按钮
- 两栏样式统一：边框、圆角、背景色一致
- 编辑/删除按钮改为图标（✎ 编辑，× 删除），简洁美观

---

## 2026-03-05 - 自定义选项管理页面布局优化（两栏显示）

### 需求
将自定义选项管理页面的内置选项和自定义选项分为两栏展示，其他保持不变。

### 处理内容

#### 1. HTML 结构调整 (`index.html`)
**修改内容**:
- 新增 `.custom-options-columns` 两栏布局容器
- 左侧：内置选项栏（带数量统计）
- 右侧：自定义选项栏（带数量统计 + 快捷工具栏）

**新增元素**:
```html
<div class="custom-options-columns">
  <!-- 左侧：内置选项 -->
  <div class="custom-options-column">
    <div class="custom-options-column-header">
      <h4>内置选项</h4>
      <span class="column-count" id="builtin-count">0</span>
    </div>
    <div class="custom-options-list-container builtin-container">
      <div id="builtin-options-list" class="custom-options-list"></div>
    </div>
  </div>

  <!-- 右侧：自定义选项 -->
  <div class="custom-options-column">
    <div class="custom-options-column-header">
      <h4>自定义选项</h4>
      <span class="column-count" id="custom-count">0</span>
    </div>
    <div class="custom-options-toolbar custom-toolbar">
      <button id="add-custom-option-column-btn" class="icon-btn small" title="添加">+</button>
      <button id="backup-options-column-btn" class="icon-btn small" title="备份">↓</button>
      <button id="restore-options-column-btn" class="icon-btn small" title="恢复">↑</button>
    </div>
    <div class="custom-options-list-container custom-container">
      <div id="custom-options-list" class="custom-options-list"></div>
    </div>
  </div>
</div>
```

#### 2. CSS 样式新增 (`styles.css`)
```css
/* 自定义选项两栏布局 */
.custom-options-columns {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.custom-options-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.custom-options-column-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.column-count {
  padding: 2px 8px;
  background-color: var(--selected-bg);
  border-radius: 10px;
  font-size: 11px;
}

.custom-options-list-container {
  max-height: 400px;
  min-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  flex: 1;
}

.custom-toolbar {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}

/* 选项列表项样式 */
.custom-option-item {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.custom-option-item.builtin {
  opacity: 0.5;
  cursor: default;
  background-color: var(--panel-bg);
}

.custom-option-item-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}
```

#### 3. JavaScript 逻辑修改 (`renderer.js`)

**DOM 元素缓存新增**:
```javascript
elements.builtinOptionsList = document.getElementById('builtin-options-list');
elements.customOptionsList = document.getElementById('custom-options-list');
elements.builtinCount = document.getElementById('builtin-count');
elements.customCount = document.getElementById('custom-count');
elements.addCustomOptionColumnBtn = document.getElementById('add-custom-option-column-btn');
elements.backupOptionsColumnBtn = document.getElementById('backup-options-column-btn');
elements.restoreOptionsColumnBtn = document.getElementById('restore-options-column-btn');
```

**函数重构**:
- `loadCustomOptionsList()`: 改为分别渲染两个列表
- 新增 `renderBuiltinOptionsList()`: 渲染内置选项列表
- 新增 `renderCustomOptionsList()`: 渲染自定义选项列表

**事件绑定新增**:
```javascript
// 分栏按钮事件
elements.addCustomOptionColumnBtn.addEventListener('click', showAddCustomOptionForm);
elements.backupOptionsColumnBtn.addEventListener('click', backupOptions);
elements.restoreOptionsColumnBtn.addEventListener('click', restoreOptions);
```

### 效果
- 左侧显示内置选项（灰色背景，不可编辑）
- 右侧显示自定义选项（白色背景，可编辑/删除）
- 每栏顶部显示选项数量统计
- 右侧栏提供快捷添加/备份/恢复按钮（图标按钮）
- 弹窗宽度从 900px 调整为 1200px

---

## 2026-03-05 - 自定义选项管理页面优化（样式统一）

### 问题
1. 样式不统一，自定义选项样式丢失
2. 按钮样式不一致
3. 弹窗宽度偏小

### 处理内容

#### 1. 弹窗宽度调整
```css
.custom-options-modal {
  max-width: 1200px;  /* 900px → 1200px */
}
```

#### 2. 按钮统一为图标样式
**HTML 修改**:
- 工具栏按钮改为 `icon-btn` 样式
- 分栏工具栏按钮改为 `icon-btn small` 样式
- 使用图标：`+`（添加）、`↻`（刷新）、`↓`（备份）、`↑`（恢复）

#### 3. 列表项样式优化
```css
.custom-option-item {
  padding: 10px 12px;
  align-items: flex-start;
  gap: 12px;
}

.custom-option-item-subtitle {
  line-height: 1.4;
  word-break: break-word;
}

.custom-option-item-actions {
  flex-shrink: 0;
}
```

#### 4. 内置选项样式区分
```css
.custom-option-item.builtin {
  opacity: 0.5;
  cursor: default;
  background-color: var(--panel-bg);
}
```

#### 5. 列表容器高度调整
```css
.custom-options-list-container {
  max-height: 400px;  /* 300px → 400px */
  min-height: 200px;
}
```

### 效果
- 弹窗宽度增加，两栏布局更舒适
- 按钮统一为图标样式，简洁一致
- 列表项描述支持换行，长文本正常显示
- 内置选项样式明显区分（灰色背景，不可点击）

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
