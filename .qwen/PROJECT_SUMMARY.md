# 项目摘要

## 总体目标
开发"Kim 多级分镜提示词助手"，一款面向视频创作者和 AI 内容生成师的 Electron 桌面应用，提供多级分镜管理、提示词自动化生成和自定义选项系统。

## 关键知识

### 技术栈
- **框架**: Electron (v40.6.1)
- **前端**: HTML5 / CSS3 / JavaScript (ES6+)
- **IPC 通信**: ipcRenderer / contextBridge
- **数据存储**: 本地文件系统 (JSON)
- **开发环境**: Windows, VS Code, PowerShell

### 项目结构
```
e:\AI\KimV4\
├── src/
│   ├── main.js              # Electron 主进程入口
│   ├── preload.js           # 预加载脚本（IPC 桥接）
│   ├── renderer.js          # 渲染进程（UI 逻辑，约 3700 行）
│   ├── handlers/            # IPC 处理器
│   │   ├── project.js       # 项目管理
│   │   ├── api.js           # LLM API 调用
│   │   ├── template.js      # 模板管理
│   │   └── options.js       # 自定义选项管理
│   └── utils/
│       └── menu.js          # 原生菜单和日志初始化
├── assets/default/
│   ├── default-templates.json  # 默认模板（3 个）
│   └── options.json            # 默认自定义选项（100+ 条）
├── index.html, styles.css
└── work/dev-log.md            # 开发日志
```

### 自定义选项系统
- **组别**: 风格、情绪氛围、配乐风格、音效、景别、镜头角度、运镜
- **数据结构**: `{ group, type, style, description, builtin }`
- **存储路径**: `%APPDATA%/kim-storyboard-assistant/config/options-custom.json`
- **API**: `getOptionsByGroup()`, `addCustomOption()`, `deleteCustomOption()`, `updateCustomOption()`

### 开发规范（来自 work/rules.md）
1. Electron 安全：禁用 nodeIntegration，启用 contextIsolation
2. IPC 调用需要参数验证
3. 文件操作仅在主进程实现
4. CSS: BEM 命名，2 空格缩进，px/rem 单位，黑白灰配色
5. JavaScript: ES6+，优先 const/let，异步用 async/await
6. 所有开发工作记录到 `work/dev-log.md`

### 构建和运行命令
```bash
npm install          # 安装依赖
npm start            # 运行应用
npm run dev          # 开发模式（自动打开 DevTools）
```

## 近期工作

### 已完成功能

#### 1. 自定义选项管理模块 [100%]
- [x] 后端 IPC 处理器（`src/handlers/options.js`）
- [x] 预加载脚本 API 暴露
- [x] 原生菜单入口（系统 → 自定义选项管理）
- [x] 管理弹窗双栏布局（内置选项 vs 自定义选项）
- [x] 独立编辑/添加弹窗
- [x] 快速添加选项功能（属性表单中的"+"按钮）
- [x] 备份/恢复功能
- [x] 删除选项后自动刷新属性表单

#### 2. 片段属性表单 [100%]
- [x] 14 个字段严格按 `attribute-field-description.md` 开发
- [x] 两列网格布局
- [x] 选项字段集成自定义选项（风格、情绪氛围、配乐风格、音效）
- [x] 每个选项字段旁有"+"添加按钮
- [x] 失焦自动保存（500ms 防抖）
- [x] 选项描述提示
- [x] 细滚动条（6px 宽度）

#### 3. 镜头属性表单 [80%]
- [x] 10 个字段严格按 `attribute-field-description.md` 开发
- [x] 两列网格布局
- [x] 选项字段集成（景别、镜头角度、运镜）
- [x] "+"添加按钮功能
- [x] 失焦自动保存
- [x] 选项描述提示
- [x] 分镜图片字段（文本占位符）
- [ ] 图片上传功能（待完成）

### 关键实现细节

#### 属性表单布局
```css
.shot-properties-2cols {
  grid-template-columns: repeat(2, 1fr);
}
.property-column {
  padding: 12px;
  background-color: var(--panel-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
}
```

#### 选项字段模式
```html
<label for="shotStyle">
  风格
  <button type="button" class="icon-btn small add-option-btn"
          data-field="shotStyle" data-group="风格">+</button>
</label>
<select id="shotStyle" data-autosave="true">
  <option value="">请选择风格</option>
  <!-- 来自自定义选项系统的动态选项 -->
</select>
<small class="setting-hint">描述信息</small>
```

#### 自动保存模式
```javascript
input.addEventListener('blur', () => {
  setTimeout(async () => {
    await saveShotProperties(shot, true);
  }, 500);
});
```

## 当前计划

### 优先任务

#### 1. [待完成] 分镜图片上传（P0 优先级）
**位置**: 镜头属性表单 - 分镜图片字段
**需求**:
- 点击图片上传
- 拖放支持
- 缩略图预览
- 支持多张图片（≤9 张）
**预计**: 4 小时

#### 2. [待完成] 参考素材文件管理（P0 优先级）
**位置**: 片段属性表单 - 图片/视频/音频参考字段
**需求**:
- 文件选择器集成
- 显示已上传文件列表
- 拖放上传
- 数量限制（图片≤9、视频≤3、音频≤3）
- 时长限制（视频/音频总计≤15 秒）
**预计**: 6 小时

#### 3. [待完成] 选项字段验证（P1 优先级）
**需求**:
- 删除前检查选项是否被使用
- 提示用户替换为其他选项
- 跟踪每个选项的使用次数
**预计**: 2 小时

#### 4. [待完成] 响应式布局（P1 优先级）
**需求**:
- 小屏幕：单列
- 中屏幕：双列
- 大屏幕：三列（片段属性）
**CSS 实现**:
```css
@media (max-width: 800px) {
  .shot-properties-2cols {
    grid-template-columns: 1fr;
  }
}
@media (min-width: 1200px) {
  .shot-properties-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```
**预计**: 2 小时

#### 5. [待完成] 选项使用统计（P2 优先级）
**需求**:
- 在 `options-custom.json` 中跟踪选项使用次数
- 在管理面板显示使用次数
- 支持按频率排序
**数据结构**:
```json
{
  "id": "custom_123",
  "group": "风格",
  "type": "写实风格",
  "style": "照片写实",
  "description": "...",
  "usageCount": 15
}
```
**预计**: 3 小时

### 进度汇总
```
自定义选项管理：████████████████████ 100%
片段属性表单：    ████████████████████ 100%
镜头属性表单：    ████████████████░░░░  80% (缺少图片上传)
总体进度：        ████████████████░░░░  85%
```

### 剩余工作总量
P0-P2 优先级任务预计约 17 小时。

---

## 摘要元数据
**更新时间**: 2026-03-05T16:30:45.248Z
