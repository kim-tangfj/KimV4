# 错误处理规范

本文档定义项目的错误处理标准和最佳实践。

---

## 1. 错误处理原则

### 1.1 统一性
- 所有 IPC 处理器使用统一的错误处理包装器
- 错误返回格式统一为：`{ success: false, error: string, code?: string }`
- 日志记录格式统一：`[模块名] 错误描述：详细信息`

### 1.2 分层处理
```
用户界面层 → 显示友好提示
渲染进程层 → 捕获全局错误，使用 safeIpcCall
IPC 通信层 → 参数验证，错误格式化
主进程层 → 捕获未处理异常，记录日志
文件系统层 → 路径验证，权限检查
```

### 1.3 安全性
- 不向用户暴露敏感信息（API Key、完整路径等）
- 生产环境不暴露堆栈跟踪
- 验证所有输入参数
- 防止路径遍历攻击

---

## 2. 主进程错误处理

### 2.1 全局错误监听

```javascript
// main.js

// 未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('[主进程] 未处理的 Promise 拒绝:', reason);
  // 记录到日志文件
});

// 未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('[主进程] 未捕获的异常:', error);
  // 记录日志
  // 如果是致命错误，退出应用
  if (error.code === 'EACCES' || error.code === 'EPERM') {
    app.quit();
  }
});
```

### 2.2 IPC 错误处理包装器

```javascript
// utils/ipcErrorHandler.js
const { withErrorHandler } = require('../utils/ipcErrorHandler');

ipcMain.handle('operation:name', async (event, params) => {
  return withErrorHandler(async () => {
    // 业务逻辑
    return { success: true, data: result };
  }, '操作描述');
});
```

### 2.3 参数验证

```javascript
const { validateParams } = require('../utils/ipcErrorHandler');

ipcMain.handle('project:create', async (event, projectData) => {
  return withErrorHandler(async () => {
    validateParams(projectData, ['name', 'description']);
    // 业务逻辑
  }, '创建项目');
});
```

---

## 3. 渲染进程错误处理

### 3.1 全局错误监听

```javascript
// renderer.js

// 未处理的 Promise 拒绝
window.addEventListener('unhandledrejection', (event) => {
  console.error('[渲染进程] 未处理的 Promise 拒绝:', event.reason);
  if (window.showToast) {
    window.showToast('操作失败：' + (event.reason?.message || '未知错误'), 'error');
  }
  event.preventDefault();
});

// 全局 JavaScript 错误
window.addEventListener('error', (event) => {
  console.error('[渲染进程] 全局错误:', event.error);
  if (window.showToast) {
    window.showToast('发生错误：' + event.message, 'error');
  }
});
```

### 3.2 IPC 调用安全包装

```javascript
// 使用 safeIpcCall
try {
  const result = await window.safeIpcCall('project:create', projectData);
  if (result.success) {
    // 成功处理
  }
} catch (error) {
  // 错误已在 safeIpcCall 中记录
  console.error('创建项目失败:', error.message);
}

// 或直接使用 electronAPI（需要手动处理错误）
try {
  const result = await window.electronAPI.createProject(projectData);
  if (result.success === false) {
    throw new Error(result.error);
  }
} catch (error) {
  window.showToast('创建失败：' + error.message, 'error');
}
```

---

## 4. 错误日志

### 4.1 日志位置
- 主进程：`userData/logs/main-process-error.log`
- 渲染进程：`userData/logs/renderer-error.log`
- IPC 错误：`userData/logs/ipc-error.log`

### 4.2 日志格式
```
[ISO 时间戳] 错误类型：错误信息
堆栈跟踪（仅开发环境）
```

### 4.3 日志级别
- `error` - 错误（需要用户注意的问题）
- `warn` - 警告（不影响功能的问题）
- `info` - 信息（正常操作记录）

---

## 5. 用户提示

### 5.1 提示类型
- `toast` - 轻量提示（操作成功、短暂信息）
- `modal` - 模态框（需要用户确认的重要操作）
- `notification` - 通知（后台任务完成）

### 5.2 错误消息本地化
```javascript
const ERROR_MESSAGES = {
  'EACCES': '权限不足，无法访问文件',
  'ENOENT': '文件不存在',
  'ENOSPC': '磁盘空间不足',
  'NETWORK_ERROR': '网络连接失败，请检查网络设置',
  'API_KEY_INVALID': 'API Key 无效，请在设置中检查',
  'TEMPLATE_NOT_FOUND': '模板不存在，请重新选择'
};

function getUserFriendlyMessage(error) {
  return ERROR_MESSAGES[error.code] || error.message || '操作失败，请稍后重试';
}
```

---

## 6. 最佳实践示例

### 6.1 IPC 处理器完整示例

```javascript
const { ipcMain } = require('electron');
const { withErrorHandler, validateParams } = require('../utils/ipcErrorHandler');

function initMyIPC() {
  ipcMain.handle('my:operation', async (event, params) => {
    return withErrorHandler(async () => {
      // 1. 参数验证
      validateParams(params, ['requiredField']);
      
      // 2. 业务逻辑
      const result = await doSomething(params);
      
      // 3. 返回成功结果
      return { success: true, data: result };
    }, '我的操作');
  });
}
```

### 6.2 渲染进程调用示例

```javascript
async function handleMyOperation() {
  try {
    const result = await window.safeIpcCall('my:operation', {
      requiredField: 'value'
    });
    
    if (result.success) {
      window.showToast('操作成功', 'success');
    }
  } catch (error) {
    // 错误已在 safeIpcCall 中记录和提示
    console.error('操作失败:', error.message);
  }
}
```

---

## 7. 检查清单

在提交代码前，检查以下项目：

- [ ] IPC 处理器使用了 `withErrorHandler`
- [ ] 所有输入参数都经过验证
- [ ] 错误消息对用户友好（不暴露技术细节）
- [ ] 关键操作有日志记录
- [ ] 文件操作有路径验证
- [ ] 异步操作有错误捕获
- [ ] 用户界面有适当的错误提示

---

**文档更新时间**: 2026-03-08
**版本**: v1.0
