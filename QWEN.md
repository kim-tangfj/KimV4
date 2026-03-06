# Kim 多级分镜提示词助手 - 项目上下文文档

## 项目概述

**Kim 多级分镜提示词助手** (kim-storyboard-assistant) 是一款面向视频创作者和 AI 内容生成师的 Electron 桌面应用，提供多级分镜管理与提示词自动化生成功能。

### 核心功能

- **多级分镜管理**：项目 → 片段 → 镜头 三层结构化管理
- **AI 提示词生成**：集成 DeepSeek、豆包 (字节)、通义千问 (阿里) 等大模型 API
- **模板系统**：支持自定义分镜模板，快速生成结构化 JSON 数据
- **自定义选项库**：管理风格、类型等预设选项
- **双主题支持**：浅色/深色主题切换
- **画幅适配**：支持 16:9、9:16、1:1 等多种画幅比例

### 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Electron |
| 前端 | HTML5 / CSS3 / JavaScript (ES6+) |
| IPC 通信 | ipcRenderer / contextBridge |
| 数据存储 | 本地文件系统 (JSON) |

---

## 项目结构

```
e:\AI\KimV4\
├── index.html              # 主界面 HTML（四栏布局）
├── styles.css              # 全局样式（黑白灰配色，支持深色主题）
├── package.json            # 项目配置与依赖
├── rey.npmrc               # npm 配置
├── .gitignore              # Git 忽略规则
│
├── src/                    # 源代码目录
│   ├── main.js             # Electron 主进程入口
│   ├── preload.js          # 预加载脚本（IPC 桥接）
│   ├── renderer.js         # 渲染进程（UI 逻辑，3300+ 行）
│   ├── handlers/           # IPC 处理器模块
│   │   ├── project.js      # 项目管理（创建/保存/删除/监听）
│   │   ├── api.js          # LLM API 调用（测试连接/请求）
│   │   ├── template.js     # 模板管理（加载/保存/备份/恢复）
│   │   └── options.js      # 自定义选项管理
│   └── utils/              # 工具模块
│       └── menu.js         # 原生菜单与日志初始化
│
├── assets/                 # 静态资源
│   ├── icon.png            # 应用图标
│   └── default/            # 默认数据
│       ├── default-templates.json  # 默认模板（3 个）
│       └── options.json            # 默认自定义选项
│
├── work/                   # 工作文档
│   ├── dev-log.md          # 开发日志
│   ├── rules.md            # 开发规范（Electron 安全/CSS/JS 规范）
│   └── settings.json       # 工作区设置
│
└── node_modules/           # 依赖包
```

---

## 构建与运行

### 环境要求

- Node.js (推荐 v18+)
- npm
- Windows 系统（开发环境）

### 安装依赖

```bash
npm install
```

### 启动应用

```bash
# 正常运行
npm start

# 开发模式（自动打开 DevTools）
npm run dev
```

### 项目配置 (package.json)

```json
{
  "name": "kim-storyboard-assistant",
  "version": "1.0.0",
  "main": "src/main.js",
  "scripts": {
    "start": "electron .",
    "dev": "electron . --dev"
  },
  "devDependencies": {
    "electron": "^40.6.1"
  }
}
```

---

## 开发规范

### Electron 安全最佳实践

1. **禁用 nodeIntegration**，启用 contextIsolation
2. **IPC 通信必须参数校验**，敏感操作仅在主进程实现
3. **外部链接使用 shell.openExternal**，禁用 window.open
4. **路径处理使用 path.join**，避免硬编码路径分隔符

### 代码规范

| 规范类型 | 要求 |
|----------|------|
| JavaScript | ES6+，禁用 var，优先 const/let，异步用 async/await |
| 命名 | 函数小驼峰，常量大写下划线，类名大驼峰 |
| CSS | BEM 命名，属性顺序：布局→盒模型→样式→交互 |
| HTML | 语义化标签，必须包含 viewport 配置 |

详见：`work/rules.md`

### 主题配色

- **浅色主题**：白底 (#ffffff) + 黑字 (#333333) + 灰边框 (#e0e0e0)
- **深色主题**：深灰底 (#1e1e1e) + 白字 (#e0e0e0) + 深灰边框 (#404040)

---

## 核心模块说明

### 1. 主进程 (main.js)

- 创建 BrowserWindow (1400x900，最小 1000x600)
- 初始化 IPC 处理器（项目/API/模板/选项）
- 设置原生菜单
- 初始化默认模板和自定义选项

### 2. 预加载脚本 (preload.js)

暴露安全 IPC 接口到渲染进程：

```javascript
// 项目 API
createProject, loadProject, saveProject, listProjects, deleteProject

// LLM API
testApiConnection, callLlmApi

// 模板 API
loadTemplates, saveTemplates, backupTemplates, restoreTemplates

// 自定义选项 API
getAllOptions, addCustomOption, deleteCustomOption, updateCustomOption
```

### 3. 渲染进程 (renderer.js)

- UI 状态管理（appState 对象）
- DOM 操作与事件处理
- 设置管理（主题/API 密钥/存储路径）
- 模板库与自定义选项管理界面

### 4. 数据结构

**项目结构 (project.json)**：
```json
{
  "project": {
    "name": "项目名称",
    "description": "项目描述",
    "aspectRatio": "16:9",
    "status": "draft"
  },
  "shots": [
    {
      "name": "片段名称",
      "description": "片段描述",
      "duration": 10,
      "scenes": [
        {
          "name": "镜头描述",
          "shotType": "中景",
          "angle": "平视",
          "camera": "推镜头",
          "content": "画面内容描述",
          "duration": 5,
          "dialogue": "台词",
          "emotion": "情绪氛围"
        }
      ]
    }
  ]
}
```

---

## 默认模板

| 模板 ID | 名称 | 用途 |
|---------|------|------|
| default_storyboard | 默认分镜模板 | 标准视频分镜脚本 |
| product_ad_template | 商品广告模板 | 电商产品宣传视频 |
| tutorial_template | 教程教学模板 | 教学视频/操作演示 |

---

## 支持的大模型 API

| 提供商 | 默认模型 | 配置项 |
|--------|----------|--------|
| DeepSeek | deepseek-chat | API Key / 模型名称 |
| 豆包 (字节) | doubao-pro-4k | API Key / 模型名称 |
| 通义千问 (阿里) | qwen3.5-plus | API Key / 模型名称 |

---

## 文件说明

| 文件 | 说明 |
|------|------|
| `index.html` | 主界面，四栏布局（项目/片段/镜头/提示词）+ 底部双面板（属性/素材） |
| `styles.css` | 1100+ 行样式，支持深色主题、面板拖拽、响应式布局 |
| `renderer.js` | 3300+ 行 UI 逻辑，包含所有交互功能 |
| `work/dev-log.md` | 开发日志，记录每次迭代内容 |
| `work/rules.md` | 开发规范文档 |

---

## 注意事项

1. **渲染进程无直接文件系统权限**，所有文件操作通过 IPC 调用主进程
2. **自定义选项分内置/自定义**，内置选项不可删除
3. **模板内容使用 `{剧本内容}` 占位符**，用户输入时自动替换
4. **深色主题通过 body.dark-theme 类切换**，CSS 变量统一控制配色
5. **项目数据本地存储**，清除浏览器缓存不会丢失（独立于 Electron 存储）

---

## 相关文档

- 开发日志：`work/dev-log.md`
- 开发规范：`work/rules.md`
- 默认模板：`assets/default/default-templates.json`
- 默认选项：`assets/default/options.json`
