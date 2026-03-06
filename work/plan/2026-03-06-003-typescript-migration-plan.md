# Kim 多级分镜提示词助手 - TypeScript 迁移计划

**文档编号**: 2026-03-06-003
**创建时间**: 2026-03-06
**版本**: v1.0
**优先级**: P2（功能完善阶段）

---

## 一、当前状态分析

### 1.1 已完成模块拆分

| 模块 | 文件 | 行数 | 状态 |
|------|------|------|------|
| 项目管理 | `src/utils/projectList.js` | ~340 行 | ✅ 已完成 |
| 菜单工具 | `src/utils/menu.js` | - | ✅ 已存在 |

### 1.2 待拆分模块（仍在 renderer.js 中）

| 模块 | 预估行数 | 优先级 | 说明 |
|------|---------|--------|------|
| 片段管理 | ~400 行 | P0 | renderShotList, selectShot, createNewShot, deleteSelectedShot |
| 镜头管理 | ~300 行 | P0 | renderSceneList, selectScene, createNewScene, deleteSelectedScene |
| 属性面板 | ~500 行 | P1 | showShotProperties, showSceneProperties, 自动保存逻辑 |
| 提示词生成 | ~200 行 | P1 | generateShotPrompt, generateScenePrompt, updatePromptPreview |
| 设置管理 | ~200 行 | P2 | loadSettings, saveSettings, 设置面板相关 |
| 模板管理 | ~150 行 | P2 | 模板库相关功能 |
| 自定义选项 | ~150 行 | P2 | 自定义选项管理 |
| 工具函数 | ~100 行 | P3 | showToast, showConfirm, 面板拖拽等 |

### 1.3 当前代码统计

| 文件 | 行数 | 说明 |
|------|------|------|
| `src/renderer.js` | ~3470 行 | 包含所有未拆分的模块 |
| `src/utils/projectList.js` | ~340 行 | 已完成拆分 |
| `src/utils/menu.js` | - | 工具模块 |
| **总计** | **~3810 行** | |

---

## 二、迁移策略

### 2.1 迁移原则

1. **先拆分后迁移** - 先将所有模块从 renderer.js 拆分出来，再逐个迁移到 TypeScript
2. **渐进式迁移** - 不一次性全部重写，按模块逐步迁移
3. **保持兼容** - 迁移过程中保持应用可运行
4. **类型优先** - 核心数据类型优先定义（Project, Shot, Scene 等）

### 2.2 迁移阶段

```
阶段 1: 模块拆分（当前阶段）
  └─ 将 renderer.js 中的功能拆分为独立模块

阶段 2: 类型定义（下一阶段）
  └─ 创建类型定义文件
  └─ 定义核心数据结构

阶段 3: 模块迁移
  └─ 逐个模块迁移到 TypeScript
  └─ 添加类型注解

阶段 4: 构建配置
  └─ 配置 TypeScript 编译器
  └─ 配置构建流程
```

---

## 三、详细计划

### 阶段 1: 模块拆分（预计 4-6 小时）

#### 1.1 片段管理模块 (`src/utils/shotList.js`)

**拆分内容**:
- `renderShotList(shots)` - 渲染片段列表
- `selectShot(shot)` - 选择片段
- `createNewShot()` - 新建片段
- `deleteSelectedShot()` - 删除片段
- `updateShotStatus(shot, newStatus)` - 更新片段状态
- `showShotStatusMenu(shot, event)` - 显示状态菜单

**依赖**:
- `window.appState`
- `window.electronAPI`
- `elements`

**预计工时**: 1 小时

---

#### 1.2 镜头管理模块 (`src/utils/sceneList.js`)

**拆分内容**:
- `renderSceneList(scenes)` - 渲染镜头列表
- `selectScene(scene)` - 选择镜头
- `createNewScene()` - 新建镜头
- `deleteSelectedScene()` - 删除镜头
- 镜头时间范围计算逻辑

**依赖**:
- `window.appState`
- `window.electronAPI`
- `elements`

**预计工时**: 1 小时

---

#### 1.3 属性面板模块 (`src/utils/propertyPanel.js`)

**拆分内容**:
- `showShotProperties(shot)` - 显示片段属性表单
- `showSceneProperties(scene)` - 显示镜头属性表单
- `autoSaveShotProperties()` - 片段自动保存
- `autoSaveSceneProperties()` - 镜头自动保存
- `saveShotProperties()` - 保存片段属性
- `saveSceneProperties()` - 保存镜头属性
- `setupOptionHintListeners()` - 选项提示监听
- `setupAddOptionButtons()` - 添加选项按钮

**依赖**:
- `window.appState`
- `window.electronAPI`
- `window.renderShotList`
- `window.renderSceneList`
- `window.updatePromptPreview`

**预计工时**: 1.5 小时

---

#### 1.4 提示词生成模块 (`src/utils/promptGenerator.js`)

**拆分内容**:
- `generateScenePrompt(scene, index, cumulativeTime)` - 生成镜头提示词
- `generateShotPrompt(shot)` - 生成片段提示词
- `generateProjectPrompt(project, getStatusText)` - 生成项目提示词
- `renderPromptWithHighlight(prompt)` - 渲染提示词并高亮
- `updatePromptPreview()` - 更新提示词预览

**依赖**:
- `window.appState`

**预计工时**: 0.5 小时

---

#### 1.5 设置管理模块 (`src/utils/settings.js`)

**拆分内容**:
- `loadSettings()` - 加载设置
- `saveSettings()` - 保存设置
- `showSettingsModal()` - 显示设置面板
- `hideSettingsModal()` - 隐藏设置面板
- `testApiConnection(provider)` - 测试 API 连接
- `applyTheme(theme)` - 应用主题

**依赖**:
- `localStorage`
- `window.electronAPI`

**预计工时**: 1 小时

---

### 阶段 2: 类型定义（预计 2-3 小时）

#### 2.1 创建类型定义文件 (`src/types/index.ts`)

```typescript
// 核心数据结构
interface Project {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'processing' | 'completed' | 'archived';
  aspectRatio: string;
  shots: Shot[];
  // ...
}

interface Shot {
  id: string;
  name: string;
  description: string;
  duration: number;
  status: 'draft' | 'completed';
  scenes: Scene[];
  // ...
}

interface Scene {
  id: string;
  name: string;
  shotType: string;
  angle: string;
  camera: string;
  content: string;
  duration: number;
  dialogue: string;
  emotion: string;
  // ...
}

// 应用状态
interface AppState {
  projects: Project[];
  currentProject: Project | null;
  currentShot: Shot | null;
  currentScene: Scene | null;
  projectData: any;
}

// 设置
interface Settings {
  storagePath: string;
  apiProvider: 'deepseek' | 'doubao' | 'qianwen' | 'ailian';
  apiKeys: {
    deepseek: string;
    doubao: string;
    qianwen: string;
    ailian: string;
  };
  models: {
    deepseek: string;
    doubao: string;
    qianwen: string;
    ailian: string;
  };
  theme: 'light' | 'dark';
  autoSaveInterval: number;
}

// DOM 元素引用
interface DOMElements {
  projectList: HTMLElement;
  shotList: HTMLElement;
  sceneList: HTMLElement;
  promptPreview: HTMLElement;
  propertyForm: HTMLElement;
  // ...
}

// 模块函数类型
type RenderProjectList = (
  projects: Project[],
  elements: DOMElements,
  onSelectProject: (project: Project) => void,
  onContextMenu: (project: Project, event: MouseEvent) => void,
  onStatusClick: (project: Project, event: MouseEvent) => void
) => void;

// ...
```

**预计工时**: 1.5 小时

---

#### 2.2 创建 Electron API 类型 (`src/types/electron.d.ts`)

```typescript
interface ElectronAPI {
  // 项目 API
  createProject: (projectData: any) => Promise<{ success: boolean; error?: string }>;
  loadProject: (projectDir: string) => Promise<{ success: boolean; projectJson?: any; error?: string }>;
  saveProject: (projectDir: string, projectJson: any) => Promise<{ success: boolean; error?: string }>;
  listProjects: (baseDir: string) => Promise<{ success: boolean; projects?: any[]; error?: string }>;
  deleteProject: (projectDir: string) => Promise<{ success: boolean; error?: string }>;
  openFolder: (projectDir: string) => Promise<void>;
  
  // LLM API
  testApiConnection: (provider: string, apiKey: string, model: string) => Promise<{ success: boolean; error?: string }>;
  callLlmApi: (provider: string, apiKey: string, model: string, prompt: string) => Promise<{ success: boolean; content?: string; error?: string }>;
  
  // 模板 API
  loadTemplates: () => Promise<{ success: boolean; config?: any; error?: string }>;
  saveTemplates: (config: any) => Promise<{ success: boolean; error?: string }>;
  
  // 自定义选项 API
  getAllOptions: () => Promise<{ success: boolean; options?: any[]; error?: string }>;
  addCustomOption: (option: any) => Promise<{ success: boolean; error?: string }>;
  deleteCustomOption: (optionId: string) => Promise<{ success: boolean; error?: string }>;
  
  // ...
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    appState: AppState;
    elements: DOMElements;
    // 模块函数
    renderProjectList: RenderProjectList;
    // ...
  }
}

export {};
```

**预计工时**: 0.5 小时

---

### 阶段 3: 模块迁移（预计 8-12 小时）

按以下顺序逐个模块迁移到 TypeScript：

#### 3.1 迁移顺序

| 顺序 | 模块 | 文件名 | 预计工时 | 依赖 |
|------|------|--------|---------|------|
| 1 | 类型定义 | `src/types/*.ts` | 2h | 无 |
| 2 | 提示词生成 | `src/utils/promptGenerator.ts` | 1h | 类型定义 |
| 3 | 项目管理 | `src/utils/projectList.ts` | 1h | 类型定义 |
| 4 | 片段管理 | `src/utils/shotList.ts` | 1.5h | 类型定义 |
| 5 | 镜头管理 | `src/utils/sceneList.ts` | 1.5h | 类型定义 |
| 6 | 属性面板 | `src/utils/propertyPanel.ts` | 2h | 片段、镜头模块 |
| 7 | 设置管理 | `src/utils/settings.ts` | 1h | 类型定义 |
| 8 | 渲染进程 | `src/renderer.ts` | 2h | 所有模块 |

**总预计工时**: 11 小时

---

#### 3.2 迁移步骤（以 shotList.js 为例）

**步骤 1**: 创建 `shotList.ts`
```typescript
import { Shot, AppState, DOMElements } from '../types';

declare global {
  interface Window {
    appState: AppState;
    elements: DOMElements;
    renderShotList: (shots: Shot[]) => void;
    // ...
  }
}

export function renderShotList(shots: Shot[]): void {
  const shotList = document.getElementById('shot-list');
  if (!shotList) return;
  // ...
}

// 暴露到全局
(window as any).renderShotList = renderShotList;
```

**步骤 2**: 删除 `shotList.js`

**步骤 3**: 更新 `index.html`
```html
<script src="./src/utils/shotList.ts" defer></script>
```

**步骤 4**: 测试功能

---

### 阶段 4: 构建配置（预计 2-3 小时）

#### 4.1 安装 TypeScript

```bash
npm install --save-dev typescript
```

#### 4.2 创建 `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "skipLibCheck": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "allowJs": true,
    "checkJs": false,
    "strict": true,
    "noImplicitAny": false,
    "strictNullChecks": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### 4.3 更新 `package.json`

```json
{
  "scripts": {
    "start": "electron .",
    "dev": "electron . --dev",
    "build:ts": "tsc",
    "watch:ts": "tsc --watch"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "electron": "^40.6.1"
  }
}
```

#### 4.4 更新 `main.js` 入口

由于 Electron 可以直接加载 JavaScript，TypeScript 需要编译为 JavaScript 后加载。有两种方案：

**方案 A**: 使用 `ts-node` 直接运行 TypeScript（开发环境）
```bash
npm install --save-dev ts-node
```

**方案 B**: 先编译为 JavaScript，再启动 Electron（生产环境）
```json
{
  "scripts": {
    "build": "tsc && electron-builder",
    "start": "tsc && electron ."
  }
}
```

**预计工时**: 2 小时

---

## 四、风险与注意事项

### 4.1 技术风险

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 类型定义不完整 | 编译错误 | 使用 `any` 临时绕过，逐步完善 |
| 第三方库无类型 | 无法使用 | 创建自定义类型定义文件 |
| 构建流程复杂 | 开发效率降低 | 使用 `tsc --watch` 自动编译 |
| 学习曲线 | 团队适应时间 | 提供 TypeScript 入门文档 |

### 4.2 代码兼容性

- TypeScript 可以编译为任意版本的 JavaScript
- 保持与现有 Electron 版本兼容
- 浏览器环境代码需要特殊处理（localStorage 等）

### 4.3 开发规范

迁移到 TypeScript 后，需要更新开发规范：

1. **必须定义类型** - 所有函数参数和返回值必须有类型
2. **禁止使用 `any`** - 除非万不得已，使用 `unknown` 代替
3. **严格模式** - 启用 `strict` 编译选项
4. **类型导出** - 所有类型定义统一从 `src/types` 导出

---

## 五、预期收益

### 5.1 代码质量提升

| 指标 | 迁移前 | 迁移后 | 提升 |
|------|--------|--------|------|
| 运行时类型错误 | 频繁 | 极少 | -90% |
| IDE 代码提示 | 基础 | 完整 | +100% |
| 重构安全性 | 低 | 高 | +80% |
| 新成员上手时间 | 2 周 | 1 周 | -50% |

### 5.2 开发效率提升

- **自动补全** - 减少查阅文档时间
- **错误提前发现** - 编译时发现而非运行时
- **重构信心** - 类型系统保证修改安全
- **文档即代码** - 类型定义即文档

---

## 六、决策建议

### 建议迁移的时机

✅ **适合迁移的情况**:
- 项目功能基本稳定
- 有充足的开发时间
- 团队熟悉 TypeScript
- 计划长期维护项目

❌ **不适合迁移的情况**:
- 项目功能频繁变更
- 开发时间紧张
- 团队不熟悉 TypeScript
- 短期项目

### 当前项目评估

| 评估项 | 状态 | 建议 |
|--------|------|------|
| 功能稳定性 | 中等（仍在开发中） | ⚠️ 建议功能稳定后再迁移 |
| 开发时间 | 未知 | ⚠️ 需评估时间是否充足 |
| 团队技能 | 未知 | ⚠️ 需确认是否熟悉 TypeScript |
| 维护计划 | 长期 | ✅ 适合迁移 |

### 最终建议

**建议暂缓迁移，先完成以下工作**:

1. ✅ 完成所有模块拆分（当前阶段）
2. ✅ 确保所有功能正常工作
3. ✅ 项目功能基本稳定
4. ⏸️ **然后再考虑 TypeScript 迁移**

**预计迁移时间**: 功能稳定后，预留 2-3 天专门进行 TypeScript 迁移

---

## 七、下一步行动

### 立即执行（当前阶段）

- [ ] 完成片段管理模块拆分 (`shotList.js`)
- [ ] 完成镜头管理模块拆分 (`sceneList.js`)
- [ ] 完成属性面板模块拆分 (`propertyPanel.js`)
- [ ] 完成提示词生成模块拆分 (`promptGenerator.js`)
- [ ] 完成设置管理模块拆分 (`settings.js`)

### 下一阶段（功能稳定后）

- [ ] 评估团队 TypeScript 技能
- [ ] 确认开发时间是否充足
- [ ] 决定是否进行 TypeScript 迁移
- [ ] 如决定迁移，按本计划执行

---

**文档更新时间**: 2026-03-06
**版本**: v1.0
**下次评估时间**: 所有模块拆分完成后
