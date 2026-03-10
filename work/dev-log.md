# 开发日志

记录每次开发迭代的需求和处理内容。

---

## 2026-03-10 - 打包错误修复

### 完成内容

#### 1. 修复 main.js 重复声明错误
- **问题**: 打包后启动报错 `SyntaxError: Identifier 'ipcMain' has already been declared`
- **原因**: 第 1 行已导入 `ipcMain`，第 172 行又重复声明 `const { ipcMain } = require('electron')`
- **修复**: 删除第 172 行的重复声明
- **提交**: `140343a`

#### 2. 修复 GitHub Release 上传失败
- **问题**: `Validation Failed: already_exists` - 同名文件已存在
- **修复**: 
  - 升级 `softprops/action-gh-release@v1` → `v2`
  - 添加 `overwrite: true` 覆盖同名文件
  - 设置 `draft: false` 直接发布
- **提交**: `cdc1b8a`

---

## 2026-03-09 - Electron 打包和自动更新功能实现

### 完成内容

#### 1. 打包配置 (electron-builder)
- 安装 `electron-builder` 和 `electron-updater`
- 配置 `package.json` 构建选项
- 添加打包脚本：`npm run pack`（测试）、`npm run dist`（构建安装包）
- 配置 NSIS 安装包选项（允许自定义安装目录、创建快捷方式等）

#### 2. 自动更新配置
- **主进程** (`src/main.js`):
  - 导入 `electron-updater`
  - 配置自动更新参数（不自动下载、退出时安装）
  - 开发环境禁用自动更新
  - 监听更新事件（检查中/可用/下载进度/完成/错误）
  - 添加 IPC 处理器（检查/下载/安装）
  - 应用启动后 5 秒自动检查更新

- **预加载脚本** (`src/preload.js`):
  - 暴露更新 API（检查/下载/安装）
  - 暴露更新事件监听器

- **渲染进程** (`src/renderer.js`):
  - 添加更新事件监听器
  - 发现新版本时弹窗询问用户
  - 下载完成后询问是否立即重启安装

- **设置页面** (`index.html` + `src/utils/settings.js`):
  - 添加"应用更新"设置区域
  - 添加"检查更新"按钮
  - 显示当前版本号

### 修改文件
| 文件 | 变更说明 |
|------|----------|
| `package.json` | 添加 electron-builder、electron-updater 依赖和构建配置 |
| `src/main.js` | 添加自动更新逻辑和 IPC 处理器 |
| `src/preload.js` | 暴露更新 API 和事件监听器 |
| `src/renderer.js` | 添加更新事件监听 |
| `index.html` | 设置页面添加更新区域 |
| `src/utils/settings.js` | 添加检查更新按钮事件 |

### 使用说明

#### 打包命令
```bash
# 打包（不解压模式，用于测试）
npm run pack

# 构建 Windows NSIS 安装包
npm run dist:win

# 构建所有平台
npm run dist
```

#### 输出文件
- `dist/Kim 分镜助手 Setup 1.0.0.exe` - NSIS 安装包
- `dist/win-unpacked/` - 未打包版本（测试用）

#### 自动更新流程
1. 应用启动后 5 秒自动检查更新
2. 设置页面可手动点击"检查更新"
3. 发现新版本时弹窗询问是否下载
4. 下载完成后弹窗询问是否立即重启安装
5. 用户确认后自动下载并安装

### 注意事项
1. **开发环境**：自动更新被禁用，不会检查更新
2. **生产环境**：需要配置 GitHub Token 才能发布更新
3. **代码签名**：Windows 应用建议使用代码签名证书（可选）

---

## 2026-03-09 - 项目素材库拖放分镜图片后的刷新和删除逻辑修复

### 问题描述
1. **项目素材库不刷新**：从项目素材库拖放图片到分镜图片后，文件被复制到片段素材库，但项目素材库没有刷新显示新文件（带片段素材库标识）
2. **删除失败**：删除片段素材库素材时，如果素材不在配置中（直接从文件系统读取的），删除逻辑找不到素材
3. **UI 未清空引用**：删除被分镜图片引用的素材后，镜头列表和属性面板的分镜图片引用未清空

### 修复方案

#### 1. 项目素材库刷新
修改 `propertyPanel.js` 中的 `uploadStoryboardImage` 函数：
- 上传成功后调用 `window.refreshProjectAssetsList()` 刷新项目素材库

#### 2. 删除逻辑优化
修改 `sceneAssets.js` 中的 `removeSceneAsset` 函数：
- 支持从文件系统删除素材（即使 `shot.assets` 配置中不存在）
- 删除时先检查分镜图片引用并清空
- 从配置中删除素材记录（如果存在）

#### 3. 分镜图片引用清空
`clearStoryboardImageReferencesForAsset` 函数已经正确实现，删除时会：
- 遍历所有镜头检查 `storyboardImage.path` 是否匹配
- 清空匹配的引用
- 更新 `state.currentScene` 并刷新属性面板
- 刷新镜头列表

### 修改文件
| 文件 | 变更说明 |
|------|----------|
| `src/handlers/project.js` | `uploadStoryboardImage` 从项目素材库拖放时添加到片段素材库配置 |
| `src/utils/propertyPanel.js` | 上传分镜图片后调用 `refreshProjectAssetsList` 刷新项目素材库 |
| `src/utils/sceneAssets.js` | `removeSceneAsset` 支持从文件系统删除素材，删除时正确清空引用并刷新 UI |

### 测试验证
- [x] 从项目素材库拖放图片到分镜图片，文件复制到片段素材库
- [x] 项目素材库刷新，显示新文件（带片段素材库标识 📋）
- [x] 从片段素材库删除素材，即使配置中不存在也能删除
- [x] 删除被分镜图片引用的素材后，镜头列表缩略图清空
- [x] 删除被分镜图片引用的素材后，属性面板分镜图片清空

---

## 2026-03-09 - 片段素材库上传功能修复（项目目录获取）

### 问题描述
从片段素材库上传素材后，控制台报错：
```
[addSceneAssetToShot] 项目目录不存在
```

### 原因分析
`addSceneAssetToShot` 函数中使用 `state.currentProject.projectDir` 获取项目目录，但 `state.currentProject` 的结构不一致：
- 有时是 `projectData` 格式：`{ project: {...}, shots: [...], ... }`
- 有时是 `project` 格式：`{ projectDir: '...', shots: [...], ... }`

当 `state.currentProject` 是 `projectData` 格式时，`state.currentProject.projectDir` 为 `undefined`，导致检查失败。

### 修复方案
修改 `sceneAssets.js` 中的 `addSceneAssetToShot` 函数：
1. 使用 `projectData.project?.projectDir || projectData.projectDir` 获取项目目录
2. 添加详细的错误日志，输出各个可能的项目目录路径
3. 优化 `projectJson` 构建逻辑，使用更可靠的 fallback

### 修改文件
| 文件 | 变更说明 |
|------|----------|
| `src/utils/sceneAssets.js` | `addSceneAssetToShot` 函数修复项目目录获取逻辑 |

### 测试验证
- [x] 片段素材库上传素材后，不再报"项目目录不存在"错误
- [x] 素材成功添加到片段素材库
- [x] 项目数据正确保存

---

## 2026-03-09 - 片段素材库上传/删除后刷新逻辑修复

### 问题描述
1. **上传问题**：从片段素材库上传素材后，片段素材库列表没有刷新，需要手动刷新才能看到新上传的素材
2. **删除问题**：从片段素材库删除素材后，项目素材库没有刷新（如果打开的话）
3. **项目素材库刷新**：`refreshProjectAssetsList` 函数依赖 `currentProjectId`，如果项目素材库未打开则无法刷新

### 修复方案

#### 1. 片段素材库上传后刷新
修改 `sceneAssets.js` 中的 `addSceneAssetToShot` 函数：
- 保存项目并重新加载后，添加 `loadShotAssetsList(shotId)` 调用
- 确保片段素材库列表立即刷新

#### 2. 项目素材库刷新逻辑优化
修改 `projectAssets.js` 中的 `refreshProjectAssetsList` 函数：
- 优先使用 `currentProjectId`（项目素材库打开时）
- 如果 `currentProjectId` 不存在，从 `state.currentProject` 获取项目目录
- 通过项目目录从 `state.projects` 中查找对应的 `project.id`
- 使用 `project.id` 调用 `loadAssetsList`

### 修改文件
| 文件 | 变更说明 |
|------|----------|
| `src/utils/sceneAssets.js` | `addSceneAssetToShot` 函数增加 `loadShotAssetsList(shotId)` 调用 |
| `src/utils/projectAssets.js` | `refreshProjectAssetsList` 函数优化，支持项目素材库未打开时刷新 |

### 测试验证
- [x] 片段素材库上传素材后，列表立即刷新
- [x] 片段素材库删除素材后，项目素材库（如果打开）同步刷新
- [x] 项目素材库刷新不再依赖侧边栏是否打开

---

## 2026-03-09 - 素材删除时检查镜头分镜图片引用（修复 UI 刷新）

### 问题描述
从项目素材库或片段素材库删除素材时，如果有镜头的分镜图片（`scene.storyboardImage`）正在使用该素材，删除后会导致镜头分镜图片引用失效，显示破损图片。

### 第一次修复（不完整）
- 修改 `projectAssets.js` 和 `sceneAssets.js`，增加检查引用并清空逻辑
- **问题**：删除素材后，UI 没有正确刷新，镜头列表和属性面板仍显示旧的缩略图

### 根本原因分析
1. `removeSceneAsset` 函数保存项目后，虽然调用了 `clearStoryboardImageReferencesForAsset` 清空了 `storyboardImage`
2. 但是**没有更新 `state.currentShot.scenes`**，导致 `renderSceneList` 使用的是旧的 scenes 数据
3. 镜头列表缩略图和属性面板都没有同步更新

### 最终修复方案
修改 `sceneAssets.js` 中的 `removeSceneAsset` 函数：
1. 保存项目后，重新加载项目数据
2. 更新 `state.currentShot` 为最新的片段对象（包含更新后的 scenes）
3. 调用 `window.renderSceneList(updatedShot.scenes || [])` 刷新镜头列表
4. 调用 `window.renderShotList()` 刷新片段列表
5. 调用 `window.showSceneProperties(updatedScene)` 刷新属性面板

### 修改文件
| 文件 | 变更说明 |
|------|----------|
| `src/utils/sceneAssets.js` | `removeSceneAsset` 函数增加完整的 UI 刷新逻辑：更新 currentShot、渲染镜头列表、渲染属性面板 |
| `src/utils/projectAssets.js` | `clearStoryboardImageReferences` 函数保持不变 |

### 测试验证
- [x] 从片段素材库删除被分镜图片引用的素材
- [x] 删除后镜头列表缩略图立即消失
- [x] 删除后属性面板分镜图片预览立即清空
- [x] 项目数据正确保存

---

## 2026-03-09 - 素材删除时检查镜头分镜图片引用

### 问题描述
从项目素材库或片段素材库删除素材时，如果有镜头的分镜图片（`scene.storyboardImage`）正在使用该素材，删除后会导致镜头分镜图片引用失效，显示破损图片。

### 完成内容
1. **修改 `projectAssets.js`**:
   - `checkAssetReference` 函数增加对 `scene.storyboardImage.path` 的检查
   - `deleteAsset` 函数在删除素材前调用 `clearStoryboardImageReferences` 清空引用
   - 新增 `clearStoryboardImageReferences` 函数：遍历所有镜头，清空引用该素材路径的分镜图片，保存项目并刷新 UI

2. **修改 `sceneAssets.js`**:
   - `removeSceneAsset` 函数在删除片段素材前，检查是否被镜头分镜图片引用
   - 新增 `clearStoryboardImageReferencesForAsset` 函数：清空所有引用该素材路径的镜头分镜图片，同步更新内存和 UI

### 修复逻辑
- **项目素材库删除**: 检查引用 → 提示用户 → 清空分镜图片引用 → 删除物理文件 → 刷新 UI
- **片段素材库删除**: 查找素材 → 清空分镜图片引用 → 删除物理文件 → 删除配置记录 → 刷新 UI

### 修改文件
| 文件 | 变更说明 |
|------|----------|
| `src/utils/projectAssets.js` | `checkAssetReference` 增加 storyboardImage 检查；`deleteAsset` 增加清空引用逻辑；新增 `clearStoryboardImageReferences` 函数 |
| `src/utils/sceneAssets.js` | `removeSceneAsset` 增加清空引用逻辑；新增 `clearStoryboardImageReferencesForAsset` 函数 |

### 测试验证
- [x] 从项目素材库删除被分镜图片引用的素材，引用自动清空
- [x] 从片段素材库删除被分镜图片引用的素材，引用自动清空
- [x] 删除后镜头列表和属性面板同步更新
- [x] 删除后项目数据正确保存

---

## 2026-03-09 - 分镜图片拖放复制逻辑优化

### 完成内容
- 优化分镜图片上传逻辑，根据素材来源决定是否复制文件
- **从项目素材库拖放** → 复制到片段素材库 `assets/shots/{shotId}/images/`
- **从片段素材库拖放** → 直接使用原文件，不重复复制

### 修改文件
| 文件 | 变更说明 |
|------|----------|
| `src/handlers/project.js` | `uploadStoryboardImage` 处理器根据 `source` 参数决定是否复制文件 |

### Git 提交
- `20206b3` fix: 从片段素材库拖放分镜图片时不再重复复制文件

---

## 2026-03-09 - 分镜图片删除逻辑修复

### 完成内容
- 修复分镜图片删除逻辑，删除按钮只清空引用，不删除物理文件
- 文件保留在片段素材库中，可重复使用
- 删除提示改为"分镜图片已清除"

### 修改文件
| 文件 | 变更说明 |
|------|----------|
| `src/utils/propertyPanel.js` | `deleteStoryboardImage` 函数移除文件删除逻辑和素材库刷新 |

### Git 提交
- `7dcd1ee` fix: 分镜图片删除按钮只清空引用，不删除物理文件

---

## 2026-03-09 - 删除分镜图片后素材库刷新修复

### 完成内容
- 修复删除分镜图片后，素材库未刷新导致显示已删除文件的问题
- 删除分镜图片后，自动刷新片段素材库和项目素材库
- 确保素材库显示的文件与实际文件系统一致

### 修改文件
| 文件 | 变更说明 |
|------|----------|
| `src/utils/propertyPanel.js` | `deleteStoryboardImage` 函数中添加素材库刷新调用 |

### Git 提交
- `16caa44` fix: 删除分镜图片后刷新片段素材库和项目素材库

---

## 2026-03-09 - 片段素材库显示不全修复

### 完成内容
- 修复片段素材库只显示部分素材的问题
- 原因：原实现从 `shot.assets` 内存数据读取，该数据可能未包含所有文件
- 修复：改为从文件系统直接读取 `assets/shots/{shotId}/` 目录下的所有素材文件

### 修改文件
| 文件 | 变更说明 |
|------|----------|
| `src/handlers/project.js` | 新增 `project:getShotAssets` IPC 处理器，从文件系统读取指定片段素材 |
| `src/preload.js` | 暴露 `getShotAssets` API |
| `src/utils/sceneAssets.js` | `loadShotAssetsList` 改为调用 `getShotAssets` 从文件系统读取 |

### Git 提交
- `5cb0cc1` fix: 片段素材库从文件系统读取素材，修复素材显示不全问题

---

## 2026-03-09 - 分镜图片上传后素材库自动刷新

### 完成内容
- 分镜图片上传成功后，自动刷新片段素材库和项目素材库
- 调用 `loadShotAssetsList(shotId)` 刷新片段素材库
- 调用 `loadAssetsList(projectId)` 刷新项目素材库

### 修改文件
| 文件 | 变更说明 |
|------|----------|
| `src/utils/propertyPanel.js` | `uploadStoryboardImage` 函数中添加素材库刷新调用 |

### Git 提交
- `081ed03` feat: 分镜图片上传后自动刷新片段素材库和项目素材库

---

## 2026-03-09 - 分镜图片存储目录修复

### 完成内容
- 修改分镜图片存储目录，移除多余的 `storyboard` 子目录
- 修改前：`assets/shots/{shotId}/images/storyboard/`
- 修改后：`assets/shots/{shotId}/images/`

### 修改文件
| 文件 | 变更说明 |
|------|----------|
| `src/handlers/project.js` | `uploadStoryboardImage` 处理器中移除 `storyboard` 子目录 |

### Git 提交
- `5cbadcc` fix: 分镜图片存储目录改为 assets/shots/{shotId}/images/

---

## 2026-03-09 - 分镜图片 shotId 为空修复

### 完成内容
- 修复分镜图片上传时 `shotId` 为空的问题
- 原因：`scene.shotId` 属性不存在，应从 `state.currentShot.id` 获取
- 修复后文件正确复制到 `assets/shots/{shotId}/images/storyboard/` 目录

### 修改文件
| 文件 | 变更说明 |
|------|----------|
| `src/utils/propertyPanel.js` | `showSceneProperties` 函数中从 `state.currentShot.id` 获取 `shotId` |
| `src/handlers/project.js` | 添加调试日志，便于排查问题 |

### Git 提交
- `116fc53` fix: 修复分镜图片上传时 shotId 为空的问题

---

## 2026-03-09 - 分镜图片上传/删除 3 个问题修复

### 完成内容
修复分镜图片功能的 3 个关键问题：

**问题 1：第一次上传分镜图片后镜头列表未更新**
- 原因：`updateSceneStoryboardImage` 只更新了 `projectData`，但 `currentShot.scenes` 没有同步更新
- 修复：在 `updateSceneStoryboardImage` 中同步更新 `currentShot.scenes` 引用

**问题 2：从项目素材库拖放分镜图片时，文件未复制到片段素材库**
- 原因：主进程直接使用源文件路径，未强制复制到片段素材库
- 修复：修改 `uploadStoryboardImage` 处理器，无论素材来源都复制到 `shots/{shotId}/images/storyboard/`

**问题 3：删除后再上传，镜头列表显示旧缩略图**
- 原因：刷新镜头列表时使用了缓存的 `currentShot.scenes` 引用，未从 `projectData` 获取最新数据
- 修复：在 `uploadStoryboardImage` 和 `deleteStoryboardImage` 中，从 `projectData` 获取最新的 `scenes` 数据再渲染

### 修改文件
| 文件 | 变更说明 |
|------|----------|
| `src/handlers/project.js` | 修改 `uploadStoryboardImage` 处理器，始终复制文件到片段素材库 |
| `src/utils/propertyPanel.js` | 修改 `updateSceneStoryboardImage`、`uploadStoryboardImage`、`deleteStoryboardImage` 函数 |

### Git 提交
- `034ead5` fix: 修复分镜图片上传/删除的 3 个问题（列表未更新/素材未复制/缩略图缓存）

---

## 2026-03-09 - 分镜图片删除功能修复

### 完成内容
- 修复分镜图片删除功能，删除后镜头列表缩略图同步更新
- 添加 `deleteFile` IPC API 用于删除文件
- 删除分镜图片后自动刷新镜头列表和预览区域
- **修复上传/删除后镜头选中状态丢失问题**

### 问题原因
1. 删除功能只修改了内存中的 `currentScene` 对象，未正确保存到 `project.json`
2. 删除后未刷新镜头列表，导致缩略图仍然显示
3. 缺少文件删除的 IPC API
4. 刷新镜头列表后未恢复选中状态

### 修改文件
| 文件 | 变更说明 |
|------|----------|
| `src/preload.js` | 添加 `deleteFile` API 暴露 |
| `src/handlers/project.js` | 添加 `fs:deleteFile` IPC 处理器 |
| `src/utils/propertyPanel.js` | 重写 `deleteStoryboardImage` 函数，增加文件删除、数据保存和列表刷新；上传/删除后恢复镜头选中状态 |

### Git 提交
- `4172e3c` fix: 修复分镜图片删除功能，删除后同步刷新镜头列表
- `6a63372` fix: 修复分镜图片上传/删除后镜头选中状态丢失问题

---

## 2026-03-09 - 镜头列表分镜图缩略图位置修复

### 完成内容
- 修复镜头列表分镜图缩略图显示位置
- 调整为卡片最右边垂直居中显示

### 修改文件
| 文件 | 变更说明 |
|------|----------|
| `styles.css` | 缩略图定位改为 `top: 50%` + `transform: translateY(-50%)` 实现垂直居中 |

### Git 提交
- `830569c` fix: 镜头列表分镜图缩略图位置调整为卡片右侧居中

---

## 2026-03-08 - 编写项目操作流程指南

### 完成内容
- 编写并保存《Kim 多级分镜提示词助手 - 操作流程指南》
- 文档位置：`work/操作流程指南.md`

### 文档章节
1. **快速入门** - 界面布局、基本工作流程
2. **项目创建** - 手动创建/AI 生成/打开/删除项目
3. **分镜管理** - 片段管理、镜头管理、属性编辑
4. **素材管理** - 项目素材库、片段素材库操作
5. **提示词生成** - 自动生成、复制、导出
6. **设置配置** - 主题/存储路径/API 配置/模板管理
7. **常见问题** - FAQ 与解决方案

### 核心内容
- ✅ 手动创建项目流程（含 JSON 格式示例）
- ✅ AI 生成项目流程（含 API 配置说明）
- ✅ 片段/镜头新建、编辑、删除操作
- ✅ 项目素材库和片段素材库上传、预览、删除
- ✅ 提示词生成、复制、导出操作
- ✅ API Key 获取指南（DeepSeek/豆包/通义千问/阿里百炼）
- ✅ 常见问题 FAQ（20+ 问题及解决方案）

---

## 2026-03-08 - 编写项目可行性研究报告

### 完成内容
- 编写并保存《Kim 多级分镜提示词助手 - 可行性研究报告》
- 报告位置：`work/可行性研究报告.md`

### 报告章节
1. **项目概述** - 项目定位、核心目标、目标用户
2. **业务逻辑分析** - 核心业务流程、数据结构、业务规则
3. **关键业务功能** - 多级分镜管理、AI 提示词生成、素材管理、模板系统
4. **技术架构** - 技术选型、架构设计、模块划分、IPC 通信
5. **可行性分析** - 技术/经济/市场/法律四维评估
6. **风险评估** - 技术风险与业务风险及缓解措施
7. **开发计划** - 已完成功能、待实现功能、版本规划
8. **结论与建议** - 可行性结论与后续建议

### 核心结论
- **技术可行**: 核心功能已实现并验证，技术方案成熟可靠
- **经济可行**: 开发成本低，运维成本几乎为零
- **市场可行**: AI 视频创作需求增长，差异化定位明确
- **法律可行**: 合规性好，法律风险低

---

## 2026-03-08 - 修复镜头列表缩略图显示位置错误

### 问题
缩略图显示在片段列表而不是镜头列表

### 修复
1. 移除 `shotList.js` 中的分镜图缩略图代码（片段列表不需要）
2. 在 `sceneList.js` 中添加分镜图缩略图显示（镜头列表需要）
3. 修改 `propertyPanel.js` 刷新镜头列表而不是片段列表

现在分镜图缩略图正确显示在**镜头列表**卡片的右侧

---

## 2026-03-08 - 修复分镜图片功能问题

### 修复内容

#### 1. 调整分镜图片预览缩略图大小与素材库一致
- 高度：`140px`（与素材库缩略图一致）
- 图片高度：`100px`（与素材库缩略图一致）
- 使用 `object-fit: cover` 自适应填充

#### 2. 允许片段素材库拖放至分镜图片
- 移除片段素材拖放限制
- 项目和片段素材库都允许拖放

#### 3. 修复镜头列表不显示缩略图问题
- 上传成功后调用 `renderShotList` 刷新镜头列表
- 确保缩略图正确显示

---

## 2026-03-08 - 优化分镜图片上传框大小和镜头卡片缩略图

### 修改内容

#### 1. 调整分镜图片上传框大小与项目/片段素材库一致
- 修改 `min-height: 120px` → `50px`
- 修改 `padding: 16px` → `12px 10px`
- 添加 `display: flex` 和 `align-items: center`

#### 2. 镜头列表卡片添加分镜图片缩略图
- 检查片段中是否有镜头设置了分镜图片
- 有分镜图时在卡片右侧显示 50x50 缩略图
- 无分镜图时不显示缩略图
- 缩略图自适应填充，使用 `object-fit: cover`

#### 3. 深色主题适配
- `storyboard-upload-area` 深色主题样式
- `storyboard-thumbnail` 深色主题样式

### 修改文件
- `styles.css`: 调整上传区域样式，添加缩略图样式（+50 行）
- `src/utils/shotList.js`: 镜头卡片渲染添加分镜图检查

---

## 2026-03-08 - 实现镜头属性分镜图片上传和拖放功能

### 功能实现
- 添加分镜图片上传区域 HTML 和 CSS 样式
- 实现点击上传和拖放上传功能
- 新增 IPC 处理器 `project:uploadStoryboardImage`
- 分镜图片保存到 `shots/{shotId}/images/storyboard/`
- 支持从项目素材库拖放图片（无标识允许）
- 支持从片段素材库拖放图片
- 禁止从项目素材库拖放📋标识素材
- 实现分镜图预览和删除功能

### 修改文件
- `index.html`: 修改镜头属性表单分镜图片 HTML
- `styles.css`: 添加分镜图片上传区域样式
- `src/utils/propertyPanel.js`: 添加上传功能实现
- `src/utils/projectAssets.js`: 添加素材拖放支持
- `src/utils/sceneAssets.js`: 添加素材拖放支持
- `src/preload.js`: 暴露 `uploadStoryboardImage` API
- `src/handlers/project.js`: 新增 IPC 处理器

---

## 2026-03-08 - 点击项目时刷新项目素材库

### 问题
当项目素材库窗口被打开时，点击项目列表中的项目，项目素材库显示旧的项目信息（片段数、镜头数、素材统计）而不是素材列表

### 修复
- `selectProject` 函数中调用 `window.refreshProjectAssetsList()` 刷新素材列表
- 删除旧的 `window.renderAssetsList([])` 调用

---

## 2026-03-08 - 将项目素材库和片段素材库右键菜单分开

### 修改
- `index.html`: 新增 `project-asset-context-menu` 和 `scene-asset-context-menu`
- `projectAssets.js`: 使用 `project-asset-context-menu`
- `sceneAssets.js`: 使用 `scene-asset-context-menu`

### 优势
- 两个菜单完全独立，互不干扰
- 代码逻辑更清晰
- 避免事件冲突问题

---

## 2026-03-08 - 修复右键菜单事件重复触发问题（最终修复）

### 问题
项目素材库和片段素材库的右键菜单事件监听器都会触发，导致：
- 项目素材库删除片段素材时，既显示 toast 又弹出确认框

### 修复
- 添加 `activeLibrary` 标记区分是哪个库触发的右键菜单
- `projectAssets.js`: 只处理 `activeLibrary === 'project'` 的事件
- `sceneAssets.js`: 只处理 `activeLibrary === 'shot'` 的事件
- 两个监听器互不干扰

---

## 2026-03-08 - 片段素材删除后自动刷新项目素材库

### 问题
片段素材库删除素材成功后，项目素材库没有自动更新，已删除的片段素材仍然显示

### 修复
在 `sceneAssets.js` 右键菜单删除成功后调用 `window.refreshProjectAssetsList()`

---

## 2026-03-08 - 修复右键菜单重复触发事件问题

### 问题
项目素材库和片段素材库都在监听同一个右键菜单的点击事件，导致两个事件处理器都被触发。表现为：
- 在项目素材库右键删除片段素材时，既显示 toast 提示又弹出确认对话框

### 修复
- `projectAssets.js`: 只处理 `project` 素材，`shot` 素材直接返回
- `sceneAssets.js`: 只处理 `shot` 素材，`project` 素材直接返回
- 通过 `assetSource` 区分素材来源，避免重复处理

---

## 2026-03-08 - 修复片段素材库右键删除误用项目素材库逻辑

### 问题
在片段素材库右键删除素材时，提示"片段素材不允许在项目素材库删除"

### 原因
1. 片段素材库渲染时未设置 `data-asset-source` 属性
2. 项目素材库和片段素材库共用同一个右键菜单，但项目素材库的事件监听覆盖了片段素材库的

### 修复
- `renderSceneAssetsSection` 添加 `data-asset-source="shot"`
- `initContextMenuEvents` 检查 `assetSource`，片段素材提示"请使用片段素材库管理此素材"

---

## 2026-03-08 - 修复删除项目功能参数传递错误

### 问题
`deleteCurrentProject` 函数调用时参数顺序和数量不一致
- 定义：7 个参数 `(elements, useElectronAPI, loadProjects, renderShotList, renderSceneList, showToast, showConfirm)`
- 调用：5 个参数 `(elements, useElectronAPI, loadProjects, showToast, showConfirm)`

### 修复
- 删除函数定义中的 `renderShotList` 和 `renderSceneList` 参数
- 删除函数体中的 `renderShotList([])` 和 `renderSceneList([])` 调用
- 更新所有调用处参数

---

## 2026-03-08 - 修复 loadSceneAssetsList 未定义错误

### 问题
`removeSceneAsset` 函数调用了不存在的 `loadSceneAssetsList` 函数

### 修复
镜头素材库暂未实现，添加警告日志

---

## 2026-03-08 - 修复 deleteCurrentProject 递归调用导致堆栈溢出

### 问题
`renderer.js` 中定义了 `deleteCurrentProject` 函数，该函数调用 `window.deleteCurrentProject`，但某个地方又调用了 `renderer.js` 中的 `deleteCurrentProject`，导致无限递归和堆栈溢出

### 修复
将 `renderer.js` 中的函数重命名为 `handleDeleteCurrentProject`

---

## 2026-03-08 - 修复项目素材库删除片段素材时确认框仍然弹出的问题

### 问题
项目素材库删除片段素材时，toast 提示显示了"不允许删除"，但确认对话框仍然弹出

### 原因
`confirmDeleteAsset` 检测到片段素材后显示 toast 并 return，但返回值未被检查，代码继续执行

### 修复
- `confirmDeleteAsset` 返回 boolean 值（true=成功，false=被阻止/取消）
- 预览删除按钮：检查返回值，false 时不关闭预览
- 右键菜单删除：检查返回值，false 时不关闭菜单，让用户看到 toast

---

## 2026-03-08 - 优化项目素材库和片段素材库交互

### 优化 1: 片段素材上传成功后自动刷新项目素材库
**需求**: 片段素材库上传新素材后，项目素材库应实时显示

**实现**:
- 在 `addSceneAssetToShot` 中调用 `window.refreshProjectAssetsList()`
- 项目素材库导出 `refreshProjectAssetsList` 函数到 window 对象
- 项目数据同步后自动触发刷新

### 优化 2: 项目素材库禁止删除片段素材
**需求**: 项目素材库不允许删除片段专属素材

**实现**:
- `confirmDeleteAsset` 检查素材来源（`currentAsset.source`）
- 片段素材（`source: 'shot'`）显示警告并阻止删除
- 提示信息包含素材所属片段 ID

---

## 2026-03-08 - 修复删除按钮和拖放上传问题

### 问题 1: 删除按钮报错 Cannot read properties of null
**现象**: 点击预览模态框的删除按钮时报错

**原因**: `currentPreviewAsset` 可能为 null

**修复**: 在访问 `currentPreviewAsset` 前检查是否为 null

### 问题 2: 拖放上传报错 缺少必填参数 fileData
**现象**: 拖放上传时报错"缺少必填参数：fileData"

**原因**: preload.js 中 `saveDroppedSceneAsset` 的参数传递方式错误
- 渲染进程调用：`saveDroppedSceneAsset(fileName, fileData, projectDir, assetType, shotId)`
- preload.js 错误：`(params) => ipcRenderer.invoke('project:saveDroppedSceneAsset', params)`
- 主进程期望：`async (event, fileName, fileData, projectDir, assetType, shotId)`

**修复**:
- preload.js 改为单独参数传递
- 添加调试日志便于排查问题

---

## 2026-03-08 - 修复片段素材库删除功能并添加右键菜单

### 修复删除失败问题
**原因**: `removeSceneAsset` 使用 `state.currentProject` 获取数据，但该数据可能不是最新的

**修复**:
- `removeSceneAsset` 改用 `state.projectData` 获取最新项目数据
- 删除后同步更新 `currentProject` 和 `projectData`
- 保存时使用 `projectData`

### 添加右键菜单功能
- 片段素材库支持右键菜单（查看/删除）
- 与项目素材库共用同一个右键菜单
- 删除前检查文件是否存在
- 文件不存在时仅删除配置记录

### 其他修复
- 初始化时调用 `initSceneContextMenuEvents`
- 添加 `hideSceneContextMenu` 函数

---

## 2026-03-08 - 修复片段素材库删除和上传问题

### 问题 1: 文件不存在时无法删除配置记录
**现象**: 源文件被删除后，片段素材库中的配置记录无法删除

**修复**:
- 删除前使用 `fileExists` API 检查文件是否存在
- 文件不存在时仅删除配置记录
- 预览时显示文件不存在警告（⚠️ 图标 + 提示文字）
- 确认对话框区分两种情况显示不同提示

### 问题 2: 拖放上传提示'项目不存在'
**现象**: 拖放上传时报错"项目不存在"

**原因**: 使用 `state.currentProject` 获取项目目录，但该数据可能未正确同步

**修复**:
- 使用 `state.projectData` 获取项目目录（更可靠）
- 添加更详细的错误日志
- 改进错误提示信息："项目未加载，请重新打开项目"

---

## 2026-03-08 - 项目素材库显示项目和片段的所有素材

### 需求
项目素材库需要显示项目素材和所有片段素材，方便统一管理和查看。

### 修改内容
- 修改 `project:getAssets` API 同时读取项目素材和片段素材
- 项目素材标记 `source: 'project'`
- 片段素材标记 `source: 'shot'` 并添加 `shotId`
- UI 显示素材来源标识（📋 图标表示片段素材）

### 目录结构
```
项目目录/
├── assets/
│   ├── images/videos/audios       # 项目素材（source: 'project'）
│   └── shots/{shotId}/            # 片段素材（source: 'shot'）
│       ├── images/videos/audios
```

### 效果
- 项目素材库显示所有素材（项目 + 片段）
- 片段素材右上角显示 📋 标识
- 鼠标悬停显示所属片段 ID

---

## 2026-03-08 - 实现片段素材库独立存储

### 问题
- 片段素材库素材直接引用项目素材库路径
- 项目素材库删除文件后片段素材库素材失效

### 解决方案
- 新增 `project:uploadSceneAsset` API（点击上传）
- 新增 `project:saveDroppedSceneAsset` API（拖放上传）
- 片段素材存储到 `assets/shots/{shotId}/{type}` 目录
- 完全独立于项目素材库

### 修改文件
- `src/preload.js`: 新增 2 个 API 暴露
- `src/handlers/project.js`: 新增 2 个 IPC 处理器
- `src/utils/sceneAssets.js`: 修改上传逻辑使用新 API

### 目录结构
```
项目目录/
├── assets/
│   ├── images/        # 项目素材库 - 图片
│   ├── videos/        # 项目素材库 - 视频
│   ├── audios/        # 项目素材库 - 音频
│   └── shots/         # 片段素材库
│       └── {shotId}/
│           ├── images/
│           ├── videos/
│           └── audios/
```

---

## 2026-03-08 - 修复片段素材库保存项目时缺少 projectDir 参数

### 问题
保存项目时报错 `[IPC 错误] 保存项目：缺少必填参数：projectDir`

### 原因
`addSceneAssetToShot` 使用 `projectData` 保存项目，但 `projectData` 可能没有 `projectDir` 属性

### 修复
- 使用 `state.currentProject` 获取 `projectDir`
- 构建完整的项目 JSON 对象（包含 `project`、`shots`、`promptTemplates` 等）
- 添加调试日志确认保存参数

---

## 2026-03-08 - 修复片段素材库拖放上传返回数据格式问题

### 问题
拖放上传时 `saveDroppedFile` 返回的数据没有 `asset` 属性，导致上传失败

### 原因
`saveDroppedFile` 直接返回文件信息 `{ success: true, path, name, type, size, fileSize }`，而不是 `{ success: true, asset: {...} }` 格式

### 修复
在 `handleSceneDroppedFiles` 中将返回数据包装成 `asset` 对象格式：
```javascript
const asset = {
  id: 'asset_' + assetType + '_' + Date.now(),
  name: result.name,
  path: result.path,
  type: result.type,
  size: result.size,
  fileSize: result.fileSize
};
```

---

## 2026-03-08 - 修复片段素材库拖放上传类型错误

### 问题
拖放上传时报错 `Cannot read properties of undefined (reading 'type')`

### 原因
`result.asset` 可能为 `undefined`，导致访问 `asset.type` 时报错

### 修复
- 添加 `result.asset` 存在性检查
- 在 `addSceneAssetToShot` 中添加 asset 对象安全检查
- 添加调试日志确认返回数据

---

## 2026-03-08 - 修复片段素材库添加素材时片段查找错误

### 问题
上传素材时报错 `片段不存在：shot_xxx`，但 `loadShotAssetsList` 能找到该片段

### 原因
`addSceneAssetToShot` 使用 `state.currentProject` 查找片段，但该数据可能不是最新的（与 `state.projectData` 不同步）

### 修复
- 改用 `state.projectData` 查找片段
- 保存时使用 `projectData` 作为数据源
- 添加可用片段 ID 日志便于调试

---

## 2026-03-08 - 修复片段素材库上传后素材不显示的问题

### 问题
上传素材成功后，片段素材库没有显示资源

### 原因
`addSceneAssetToShot` 修改的是 `state.currentProject`，但 `loadShotAssetsList` 从 `state.projectData` 读取，两个数据源不同步

### 修复
- 保存项目后重新加载项目数据
- 同步更新 `state` 中的 `projects`、`currentProject` 和 `projectData`
- 添加调试日志确认数据同步成功

---

## 2026-03-08 - 修复片段素材库上传功能初始化时机问题

### 问题
片段素材库上传功能无效，点击上传区域无响应

### 原因
`initSceneAssetsPanel` 在 DOM 完全加载之前被调用，导致 uploadArea 和 fileInput 元素为 null

### 修复
在 `initSceneAssetsPanel` 中检查 `document.readyState`：
- 如果为 `'loading'`，等待 `DOMContentLoaded` 事件
- 否则直接初始化

---

## 2026-03-08 - 实现片段素材库上传和拖放上传功能

### 需求
为片段素材库添加与项目素材库相同的上传和拖放上传功能。

### 修改文件

| 文件 | 变更 | 说明 |
|------|------|------|
| `index.html` | +11/-2 行 | 新增上传区域 HTML，移除原有上传按钮 |
| `styles.css` | +50 行 | 上传区域样式 + 深色主题适配 |
| `src/utils/sceneAssets.js` | +334/-52 行 | 重构上传功能实现 |

### 核心实现

#### 1. HTML 结构
```html
<div class="scene-assets-upload-area" id="scene-assets-upload-area">
  <input type="file" id="scene-assets-file-input" ... />
  <div class="upload-area-content">
    <span class="upload-icon">📤</span>
    <span class="upload-text">点击或拖放文件到此处上传</span>
  </div>
</div>
```

#### 2. JavaScript 功能
- `initSceneAssetUpload()`: 初始化上传功能
- `handleSceneFilesUpload(files)`: 处理点击上传
- `handleSceneDroppedFiles(files)`: 处理拖放上传
- `addSceneAssetToShot(shotId, asset)`: 添加到片段素材库
- `showSceneUploadProgress()`: 显示上传进度

### 功能特性
- ✅ 点击上传区域选择文件
- ✅ 拖放文件到上传区域自动上传
- ✅ 支持多文件同时上传
- ✅ 自动识别文件类型（图片/视频/音频）
- ✅ 自动分类存储到项目 assets 目录
- ✅ 文件重名自动添加时间戳
- ✅ 上传进度实时显示
- ✅ 上传完成自动刷新素材列表
- ✅ 素材自动添加到当前选中片段
- ✅ 深色主题适配

### 技术实现
- 使用 `showOpenDialog` 选择文件（sandbox 模式）
- 拖放文件使用 `FileReader` 读取为 Base64
- 通过 `saveDroppedFile` API 保存到项目 assets 目录
- 调用 `addSceneAssetToShot` 添加到片段素材库并保存项目

---

## 2026-03-08 - 修复确认对话框 z-index 层级问题

### 问题
预览模态框打开后，点击删除按钮，确认对话框显示在预览模态框之下，无法点击

### 原因
确认对话框和预览模态框共用 z-index: 2000，后打开的预览模态框遮挡了确认对话框

### 修复
将 `confirm-modal` 的 z-index 设置为 3000，确保始终显示在最上层

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

### 使���示例

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
| 模块拆分前 | 2998 行 | -990 ��� (-24.8%) |
| 提示词模块拆分后 | 2567 行 | -431 行 (-14.4%) |
| 设置管理模块拆分后 | 2577 行 | -453 行 (-14.9%) |
| 自定义选项模块拆分后 | ~2600 行 | 添加注释标记 |
| **累计减少** | | **~-1400 行 (-35.1%)** |

*注：自定义选项模块采用注释标记方式，未完全注释掉代码，便于后续验证功能正常后再完全注释。*

---

**文档更新时间**: 2026-03-07
**最新提交**: 89114a7 refactor: 清理重复和未使用的代码区域
