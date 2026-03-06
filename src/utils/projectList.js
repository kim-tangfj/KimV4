//
// 项目管理模块
// 负责项目列表的渲染、选择和基本操作
//

/**
 * 渲染项目列表
 * @param {Array} projects - 项目数组
 * @param {Object} elements - DOM 元素引用
 * @param {Function} onSelectProject - 选择项目回调
 * @param {Function} onContextMenu - 右键菜单回调
 * @param {Function} onStatusClick - 状态标签点击回调
 */
function renderProjectList(projects, elements, onSelectProject, onContextMenu, onStatusClick) {
  if (!elements.projectList) return;

  elements.projectList.innerHTML = '';

  if (projects.length === 0) {
    elements.projectList.innerHTML = '<div class="placeholder-text">暂无项目，点击 + 新建</div>';
    return;
  }

  projects.forEach(project => {
    const projectElement = document.createElement('div');
    projectElement.className = 'list-item';
    projectElement.dataset.id = project.id;
    const statusText = getStatusText(project.status || 'draft');
    projectElement.innerHTML = `
      <div class="list-item-content">
        <div class="list-item-title">${project.name}</div>
        <div class="list-item-subtitle">
          ${(project.description || '').substring(0, 30)}${(project.description || '').length > 30 ? '...' : ''}
        </div>
      </div>
      <span class="status-tag status-${project.status || 'draft'}" data-project-id="${project.id}" data-status="${project.status || 'draft'}">${statusText}</span>
    `;

    // 项目卡片点击
    projectElement.addEventListener('click', (e) => {
      if (e.target.classList.contains('status-tag')) {
        return;
      }
      if (onSelectProject) onSelectProject(project);
    });

    // 右键菜单
    projectElement.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (onContextMenu) onContextMenu(project, e);
    });

    // 状态标签点击
    const statusTag = projectElement.querySelector('.status-tag');
    if (statusTag) {
      statusTag.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onStatusClick) onStatusClick(project, e);
      });
    }

    elements.projectList.appendChild(projectElement);
  });
}

/**
 * 获取项目状态文本
 * @param {string} status - 状态码
 * @returns {string} 状态文本
 */
function getStatusText(status) {
  const statusMap = {
    'draft': '草稿',
    'processing': '进行中',
    'completed': '已完成',
    'archived': '已归档'
  };
  return statusMap[status] || '草稿';
}

/**
 * 更新项目列表选中状态
 * @param {Object} elements - DOM 元素引用
 * @param {string} projectId - 选中的项目 ID
 */
function updateProjectSelection(elements, projectId) {
  document.querySelectorAll('#project-list .list-item').forEach(item => {
    item.classList.remove('selected');
  });
  document.querySelector(`#project-list .list-item[data-id="${projectId}"]`)?.classList.add('selected');
}

// 将函数暴露到全局作用域
window.renderProjectList = renderProjectList;
window.getStatusText = getStatusText;
window.updateProjectSelection = updateProjectSelection;
