用户要求生成项目摘要，我需要基于对话历史创建一个全面的中文 markdown 摘要，包含总体目标、关键知识、近期工作和当前计划。# 项目摘要

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
│   ├── renderer.js          # 渲染进程（UI 逻辑，约 3800 行）
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
└── work/                      # 开发文档和日志
```

### 自定义选项系统
- **组别**: 风格、情绪氛围、配乐风格、音效、景别、镜头角度、运镜
- **数据结构**: `{ id, group, type, style, description, builtin, usageCount }`
- **存储路径**: `%APPDATA%/kim-storyboard-assistant/config/options-custom.json`
- **API**: `getOptionsByGroup()`, `addCustomOption()`, `deleteCustomOption()`, `updateCustomOption()`, `incrementOptionUsage()`, `checkOptionUsage()`

### 开发规范
1. Electron 安全：禁用 nodeIntegration，启用 contextIsolation
2. IPC 调用需要参数验证
3. 文件操作仅在主进程实现
4. CSS: BEM 命名，2 空格缩进，px/rem 单位，黑白灰配色，支持深色主题
5. JavaScript: ES6+，优先 const/let，异步用 async/await，禁用 var
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
- ✅ 后端 IPC 处理器（`src/handlers/options.js`）
- ✅ 预加载脚本 API 暴露
- ✅ 原生菜单入口（系统 → 自定义选项管理）
- ✅ 管理弹窗双栏布局（内置选项 vs 自定义选项）
- ✅ 独立编辑/添加弹窗
- ✅ 快速添加选项功能（属性表单中的"+"按钮）
- ✅ 备份/恢复功能
- ✅ 删除选项后自动刷新属性表单

#### 2. 选项使用统计和验证功能 [100%]
- ✅ 数据结构新增 `usageCount` 字段
- ✅ 新增 IPC 接口：`options:incrementUsage`, `options:checkUsage`
- ✅ 保存属性时自动增加选项使用次数（片段：风格、情绪、配乐、音效；镜头：景别、角度、运镜）
- ✅ 删除前检查使用情况，被使用的选项不允许删除
- ✅ 管理面板按使用次数降序排序
- ✅ 显示使用次数徽章（如"15 次"）

#### 3. 片段属性表单 [100%]
- ✅ 14 个字段严格按 `attribute-field-description.md` 开发
- ✅ 两列网格布局
- ✅ 选项字段集成自定义选项（风格、情绪氛围、配乐风格、音效）
- ✅ 每个选项字段旁有"+"添加按钮
- ✅ 失焦自动保存（500ms 防抖）
- ✅ 选项描述提示
- ✅ 细滚动条（6px 宽度）

#### 4. 镜头属性表单 [80%]
- ✅ 10 个字段严格按 `attribute-field-description.md` 开发
- ✅ 两列网格布局
- ✅ 选项字段集成（景别、镜头角度、运镜）
- ✅ "+"添加按钮功能
- ✅ 失焦自动保存
- ✅ 选项描述提示
- ✅ 分镜图片字段（文本占位符）
- ⏳ 图片上传功能（待完成）

#### 5. 字段一致性修复 [100%]
- ✅ 更新默认模板 (`assets/default/default-templates.json`)
- ✅ 统一 HTML 表单 ID、变量名、JSON 字段名
- ✅ 创建说明文档 `work/字段不一致问题修复说明.md`

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
  <!-- 动态选项 -->
</select>
<small class="setting-hint">描述信息</small>
```

#### 使用统计逻辑
```javascript
// 保存时增加使用次数
if (style && style !== oldShot.style) {
  const options = await loadOptionsByGroup('风格');
  const option = options.find(opt => opt.style === style);
  if (option && !option.builtin) {
    await window.electronAPI.incrementOptionUsage(option.id);
  }
}

// 删除时检查使用情况
const usage = await window.electronAPI.checkOptionUsage(optionId);
if (usage.usageCount > 0) {
  alert(`该选项已被使用 ${usage.usageCount} 次，无法删除。`);
  return;
}
```

#### 管理面板显示
```javascript
// 按使用次数降序排序
const sorted = [...options].sort(
  (a, b) => (b.usageCount || 0) - (a.usageCount || 0)
);
// 显示徽章
const badge = option.usageCount > 0 
  ? `<span class="usage-count-badge">${option.usageCount}次</span>` 
  : '';
```

## 当前计划

### 优先任务

#### 1. [TODO] 分镜图片上传（P0 优先级）
**位置**: 镜头属性表单 - 分镜图片字段
**需求**:
- 点击图片上传
- 拖放支持
- 缩略图预览
- 支持多张图片（≤9 张）
**预计**: 4 小时

#### 2. [TODO] 参考素材文件管理（P0 优先级）
**位置**: 片段属性表单 - 图片/视频/音频参考字段
**需求**:
- 文件选择器集成
- 显示已上传文件列表
- 拖放上传
- 数量限制（图片≤9、视频≤3、音频≤3）
- 时长限制（视频/音频总计≤15 秒）
**预计**: 6 小时

#### 3. [TODO] 响应式布局（P1 优先级）
**需求**:
- 小屏幕：单列
- 中屏幕：双列
- 大屏幕：三列（片段属性）
**预计**: 2 小时

### 进度汇总
```
自定义选项管理：    ████████████████████ 100%
选项使用统计：      ████████████████████ 100%
片段属性表单：      ████████████████████ 100%
镜头属性表单：      ████████████████░░░░  80% (缺少图片上传)
字段一致性修复：    ████████████████████ 100%
总体进度：          ████████████████░░░░  88%
```

### 剩余工作总量
P0-P1 优先级任务预计约 12 小时。

---

## 摘要元数据
**更新时间**: 2026-03-06

---

## Summary Metadata
**Update time**: 2026-03-05T18:59:44.222Z 
