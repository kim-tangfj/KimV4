//
// Kim 多级分镜提示词助手 - UI 工具函数模块
// 负责 Toast 提示、确认对话框、自定义输入框、面板拖拽等 UI 工具功能
//

/**
 * 显示错误提示模态框（用于严重错误）
 * @param {string} message - 错误消息
 * @returns {Promise<void>}
 */
function showErrorModal(message) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 3000;
    `;

    const modal = document.createElement('div');
    modal.className = 'modal-content';
    modal.style.cssText = `
      background: var(--bg-color, #fff);
      border-radius: 8px;
      padding: 24px;
      min-width: 400px;
      max-width: 500px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;

    modal.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
        <span style="font-size: 24px; color: #d32f2f;">⚠️</span>
        <h3 style="margin: 0; font-size: 18px; color: var(--text-color, #333);">错误提示</h3>
      </div>
      <div style="margin-bottom: 24px; padding: 12px; background: #ffebee; border-radius: 4px; color: #d32f2f; font-size: 14px; line-height: 1.6;">
        ${message}
      </div>
      <div style="display: flex; justify-content: flex-end;">
        <button id="error-modal-confirm" style="
          padding: 8px 24px;
          border: none;
          background: #d32f2f;
          color: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        ">确定</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const confirmBtn = document.getElementById('error-modal-confirm');

    const closeModal = () => {
      overlay.remove();
      resolve();
    };

    confirmBtn.addEventListener('click', closeModal);

    // ESC 键关闭
    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscKey);
      }
    };
    document.addEventListener('keydown', handleEscKey);

    // 点击遮罩关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    });
  });
}

/**
 * 显示输入错误提示（不阻塞）
 * @param {HTMLElement} input - 输入框元素
 * @param {string} message - 错误消息
 */
function showInputError(input, message) {
  const elements = window.elements;
  if (!input) return;

  // 聚焦到输入框
  input.focus();

  // 添加错误样式
  input.style.borderColor = '#d32f2f';
  input.style.backgroundColor = '#ffebee';

  // 检查是否已存在错误提示
  const existingError = input.parentElement.querySelector('.input-error-message');
  if (existingError) {
    existingError.remove();
  }

  // 创建错误提示（显示在输入框下方）
  const errorDiv = document.createElement('div');
  errorDiv.className = 'input-error-message';
  errorDiv.style.cssText = `
    color: #d32f2f;
    font-size: 12px;
    margin-top: 4px;
  `;
  errorDiv.textContent = message;
  input.parentElement.appendChild(errorDiv);

  // 3 秒后自动清除错误样式
  setTimeout(() => {
    input.style.borderColor = '';
    input.style.backgroundColor = '';
    if (errorDiv.parentElement) {
      errorDiv.remove();
    }
  }, 3000);
}

/**
 * 初始化面板拖拽
 */
function initPanelResizers() {
  const resizers = document.querySelectorAll('.panel-resizer');
  resizers.forEach(resizer => {
    resizer.addEventListener('mousedown', (e) => {
      window.isResizing = true;
      window.currentResizer = resizer;
      window.currentPanel = resizer.dataset.panel;
      window.startX = e.pageX;

      const panel = resizer.parentElement;
      window.startWidth = panel.offsetWidth;

      resizer.classList.add('resizing');

      document.addEventListener('mousemove', handleResizerMouseMove);
      document.addEventListener('mouseup', handleResizerMouseUp);

      e.preventDefault();
    });
  });
}

/**
 * 处理拖拽移动
 */
function handleResizerMouseMove(e) {
  if (!window.isResizing || !window.currentResizer) return;

  const diff = e.pageX - window.startX;
  const panel = window.currentResizer.parentElement;
  const newWidth = window.startWidth + diff;

  // 根据面板类型设置最小/最大宽度
  const constraints = getPanelConstraints(window.currentPanel);
  const constrainedWidth = Math.max(constraints.min, Math.min(constraints.max, newWidth));

  panel.style.width = `${constrainedWidth}px`;
  panel.style.flex = 'none';
}

/**
 * 处理拖拽结束
 */
function handleResizerMouseUp() {
  window.isResizing = false;
  if (window.currentResizer) {
    window.currentResizer.classList.remove('resizing');
  }
  window.currentResizer = null;
  window.currentPanel = null;

  document.removeEventListener('mousemove', handleResizerMouseMove);
  document.removeEventListener('mouseup', handleResizerMouseUp);
}

/**
 * 获取面板约束
 * @param {string} panelType - 面板类型
 */
function getPanelConstraints(panelType) {
  const constraints = {
    project: { min: 150, max: 500 },
    shot: { min: 200, max: 600 },
    scene: { min: 250, max: 700 }
  };
  return constraints[panelType] || { min: 150, max: 500 };
}

/**
 * 自定义 Toast 提示（替代 alert）
 * @param {string} message - 消息内容
 * @param {number} duration - 显示时长（毫秒）
 */
function showToast(message, duration = 2000) {
  const elements = window.elements;
  const toast = document.getElementById('toast-notification');
  const toastMessage = document.getElementById('toast-message');
  if (!toast || !toastMessage) return;

  toastMessage.textContent = message;
  toast.style.display = 'block';

  setTimeout(() => {
    toast.style.display = 'none';
  }, duration);
}

/**
 * 自定义确认对话框（替代 confirm）
 * @param {string} message - 确认消息
 * @returns {Promise<boolean>} 用户选择结果
 */
function showConfirm(message) {
  return new Promise((resolve) => {
    const elements = window.elements;
    const modal = document.getElementById('confirm-modal');
    const confirmMessage = document.getElementById('confirm-message');
    const okBtn = document.getElementById('confirm-ok-btn');
    const cancelBtn = document.getElementById('confirm-cancel-btn');

    if (!modal || !confirmMessage || !okBtn || !cancelBtn) {
      resolve(false);
      return;
    }

    confirmMessage.textContent = message;
    modal.style.display = 'flex';

    // 移除旧的事件监听器
    const newOkBtn = okBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOkBtn, okBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    // 添加新的事件监听器
    newOkBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      resolve(true);
    });

    newCancelBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      resolve(false);
    });

    // 点击背景关闭
    modal.addEventListener('click', function closeOnBackdrop(e) {
      if (e.target === modal) {
        modal.style.display = 'none';
        modal.removeEventListener('click', closeOnBackdrop);
        resolve(false);
      }
    });
  });
}

/**
 * 显示自定义输入框（替代系统 prompt）
 * @param {string} message - 提示信息
 * @param {string} title - 标题
 * @returns {Promise<string>} 用户输入的内容
 */
async function showCustomPrompt(message, title = '输入') {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 3000;
    `;

    const modal = document.createElement('div');
    modal.className = 'modal-content';
    modal.style.cssText = `
      background: var(--bg-color, #fff);
      border-radius: 8px;
      padding: 24px;
      min-width: 400px;
      max-width: 500px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;

    modal.innerHTML = `
      <h3 style="margin: 0 0 16px 0; font-size: 18px; color: var(--text-color, #333);">${title}</h3>
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 8px; color: var(--text-color, #333);">${message}</label>
        <input type="text" id="custom-prompt-input" style="
          width: 100%;
          padding: 8px 12px;
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: 4px;
          font-size: 14px;
          box-sizing: border-box;
        " placeholder="请输入...">
      </div>
      <div style="display: flex; justify-content: flex-end; gap: 8px;">
        <button id="custom-prompt-cancel" style="
          padding: 8px 16px;
          border: 1px solid var(--border-color, #e0e0e0);
          background: var(--bg-color, #fff);
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          color: var(--text-color, #333);
        ">取消</button>
        <button id="custom-prompt-confirm" style="
          padding: 8px 16px;
          border: none;
          background: #007bff;
          color: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        ">确定</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const input = document.getElementById('custom-prompt-input');
    const confirmBtn = document.getElementById('custom-prompt-confirm');
    const cancelBtn = document.getElementById('custom-prompt-cancel');

    // 聚焦输入框
    setTimeout(() => input.focus(), 10);

    // 确定按钮
    confirmBtn.addEventListener('click', () => {
      const value = input.value.trim();
      overlay.remove();
      resolve(value);
    });

    // 取消按钮
    cancelBtn.addEventListener('click', () => {
      overlay.remove();
      resolve('');
    });

    // Enter 键确认
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const value = input.value.trim();
        overlay.remove();
        resolve(value);
      }
    });

    // 点击遮罩关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
        resolve('');
      }
    });
  });
}

/**
 * 显示更新通知
 */
function showUpdateNotification() {
  const notification = document.createElement('div');
  notification.textContent = '已更新';
  notification.style.position = 'fixed';
  notification.style.top = '10px';
  notification.style.right = '10px';
  notification.style.backgroundColor = '#333';
  notification.style.color = '#fff';
  notification.style.padding = '8px 16px';
  notification.style.borderRadius = '4px';
  notification.style.zIndex = '3000';
  notification.style.opacity = '0';
  notification.style.transition = 'opacity 0.3s';

  document.body.appendChild(notification);

  setTimeout(() => { notification.style.opacity = '1'; }, 10);
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => { document.body.removeChild(notification); }, 300);
  }, 2000);
}

// 导出所有函数到 window 对象
window.showInputError = showInputError;
window.initPanelResizers = initPanelResizers;
window.handleResizerMouseMove = handleResizerMouseMove;
window.handleResizerMouseUp = handleResizerMouseUp;
window.getPanelConstraints = getPanelConstraints;
window.showToast = showToast;
window.showConfirm = showConfirm;
window.showCustomPrompt = showCustomPrompt;
window.showUpdateNotification = showUpdateNotification;
window.showErrorModal = showErrorModal;
