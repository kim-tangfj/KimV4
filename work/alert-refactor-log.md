# 2026-03-07 - 替换所有 alert 为模态框提示

## 处理内容
将 `renderer.js` 中所有 `alert()` 调用替换为 `window.showToast()`。

## 替换统计

| 功能模块 | alert 数量 | 替换为 |
|----------|-----------|--------|
| 项目管理功能 | 11 | window.showToast |
| 模板库管理功能 | 6 | window.showToast |
| 复制模板功能 | 2 | window.showToast |
| 打开项目文件夹 | 1 | window.showToast |
| **合计** | **22** | - |

## 修改示例

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

## 代码变化
- 减少 99 行代码（alert 消息简化）
- 统一使用模态框提示
- 改善用户体验

## 测试验证
- [x] 应用启动正常
- [ ] 项目创建功能
- [ ] 模板管理功能
- [ ] AI 调用功能

## Git 提交
```
3b7e8c3 refactor: 替换所有 alert 为 window.showToast
```
