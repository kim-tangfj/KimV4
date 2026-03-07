//
// 项目管理模块
// 负责项目列表的渲染、选择、创建、删除、状态管理等
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
    'cancelled': '已取消'
  };
  return statusMap[status] || status;
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

/**
 * 显示项目右键菜单
 * @param {Object} project - 项目对象
 * @param {Event} event - 鼠标事件
 * @param {Function} onSelectProject - 选择项目回调
 * @param {Function} onDeleteProject - 删除项目回调
 * @param {Function} onOpenFolder - 打开文件夹回调
 */
function showProjectContextMenu(project, event, onSelectProject, onDeleteProject, onOpenFolder) {
  const menu = document.getElementById('project-context-menu');
  if (menu) {
    menu.remove();
    return;
  }

  const contextMenu = document.createElement('div');
  contextMenu.id = 'project-context-menu';
  contextMenu.className = 'context-menu';
  contextMenu.innerHTML = `
    <div class="context-menu-item" id="project-context-modify">修改项目</div>
    <div class="context-menu-item" id="project-context-delete">删除项目</div>
    <div class="context-menu-item" id="project-context-open-folder">打开资源文件管理器</div>
  `;

  contextMenu.style.position = 'fixed';
  contextMenu.style.top = `${event.clientY}px`;
  contextMenu.style.left = `${event.clientX}px`;
  contextMenu.style.zIndex = '1001';
  contextMenu.style.minWidth = '180px';

  contextMenu.addEventListener('click', (e) => {
    const target = e.target;
    if (target.id === 'project-context-modify') {
      if (project) {
        alert('修改项目功能待实现');
      }
    } else if (target.id === 'project-context-delete') {
      if (project && onDeleteProject) {
        onSelectProject(project);
        onDeleteProject();
      }
    } else if (target.id === 'project-context-open-folder') {
      if (project && onOpenFolder) {
        onOpenFolder(project);
      }
    }
    contextMenu.remove();
  });

  setTimeout(() => {
    document.addEventListener('click', function closeMenu(ev) {
      if (!contextMenu.contains(ev.target)) {
        contextMenu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
  }, 100);

  document.body.appendChild(contextMenu);
}

/**
 * 显示项目状态菜单
 * @param {Object} project - 项目对象
 * @param {Event} event - 鼠标事件
 * @param {Function} onUpdateStatus - 更新状态回调
 */
function showProjectStatusMenu(project, event, onUpdateStatus) {
  const menu = document.getElementById('project-status-menu');
  if (menu) {
    menu.remove();
    return;
  }

  const statuses = [
    { value: 'draft', label: '草稿' },
    { value: 'processing', label: '进行中' },
    { value: 'completed', label: '已完成' },
    { value: 'cancelled', label: '已取消' }
  ];

  const contextMenu = document.createElement('div');
  contextMenu.id = 'project-status-menu';
  contextMenu.className = 'context-menu';
  contextMenu.innerHTML = `
    <div class="context-menu-item" data-status="draft" ${project.status === 'draft' ? 'style="font-weight:bold;"' : ''}>草稿</div>
    <div class="context-menu-item" data-status="processing" ${project.status === 'processing' ? 'style="font-weight:bold;"' : ''}>进行中</div>
    <div class="context-menu-item" data-status="completed" ${project.status === 'completed' ? 'style="font-weight:bold;"' : ''}>已完成</div>
    <div class="context-menu-item" data-status="cancelled" ${project.status === 'cancelled' ? 'style="font-weight:bold;"' : ''}>已取消</div>
  `;

  contextMenu.style.position = 'fixed';
  contextMenu.style.top = `${event.clientY}px`;
  contextMenu.style.left = `${event.clientX}px`;
  contextMenu.style.zIndex = '1001';
  contextMenu.style.minWidth = '100px';

  contextMenu.addEventListener('click', (e) => {
    const status = e.target.dataset.status;
    if (status && onUpdateStatus) {
      onUpdateStatus(project, status);
    }
    contextMenu.remove();
  });

  setTimeout(() => {
    document.addEventListener('click', function closeMenu(ev) {
      if (!contextMenu.contains(ev.target)) {
        contextMenu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
  }, 100);

  document.body.appendChild(contextMenu);
}

/**
 * 打开项目文件夹
 * @param {Object} project - 项目对象
 */
function openProjectFolderByProject(project) {
  console.log('[openProjectFolderByProject] 被调用', project);
  console.log('[openProjectFolderByProject] useElectronAPI:', window.useElectronAPI);
  console.log('[openProjectFolderByProject] electronAPI:', window.electronAPI);
  
  if (!project || !project.projectDir) {
    console.error('[openProjectFolderByProject] 项目目录不存在', project);
    alert('项目目录不存在');
    return;
  }
  // 使用全局变量
  const useElectronAPI = window.useElectronAPI || false;
  if (useElectronAPI) {
    try {
      console.log('[openProjectFolderByProject] 正在打开:', project.projectDir);
      window.electronAPI.openPath(project.projectDir);
    } catch (error) {
      console.error('[openProjectFolderByProject] 打开文件夹失败:', error);
      alert('打开文件夹失败：' + error.message);
    }
  } else {
    console.warn('[openProjectFolderByProject] 不在 Electron 环境中');
  }
}

/**
 * 更新项目状态
 * @param {Object} project - 项目对象
 * @param {string} newStatus - 新状态
 * @param {Object} appState - 应用状态
 * @param {boolean} useElectronAPI - 是否使用 Electron API
 * @param {Function} loadProjects - 重新加载项目列表回调
 * @param {Function} showUpdateNotification - 显示更新提示回调
 */
async function updateProjectStatus(project, newStatus, appState, useElectronAPI, loadProjects, showUpdateNotification) {
  if (useElectronAPI && project.projectDir) {
    try {
      const loadResult = await window.electronAPI.loadProject(project.projectDir);
      if (!loadResult.success) {
        alert('加载项目失败：' + loadResult.error);
        return;
      }

      // 更新项目状态
      loadResult.projectJson.project.status = newStatus;
      loadResult.projectJson.project.updatedAt = new Date().toISOString();

      const saveResult = await window.electronAPI.saveProject(project.projectDir, loadResult.projectJson);
      if (saveResult.success) {
        // 更新本地状态
        project.status = newStatus;
        // 重新渲染项目列表
        await loadProjects();
        showUpdateNotification();
      } else {
        alert('保存失败：' + saveResult.error);
      }
    } catch (error) {
      console.error('更新项目状态异常:', error);
      alert('更新状态失败：' + error.message);
    }
  }
}

/**
 * 删除当前项目
 * @param {Object} appState - 应用状态
 * @param {Object} elements - DOM 元素引用
 * @param {boolean} useElectronAPI - 是否使用 Electron API
 * @param {Function} loadProjects - 重新加载项目列表回调
 * @param {Function} renderShotList - 渲染片段列表回调
 * @param {Function} renderSceneList - 渲染镜头列表回调
 * @param {Function} showToast - 显示提示回调
 * @param {Function} showConfirm - 显示确认对话框回调
 */
async function deleteCurrentProject(appState, elements, useElectronAPI, loadProjects, renderShotList, renderSceneList, showToast, showConfirm) {
  if (!appState || !appState.currentProject) {
    showToast('请先选择一个项目');
    return;
  }

  const confirmed = await showConfirm(`确定要删除项目 "${appState.currentProject.name}" 吗？此操作不可恢复！`);
  if (!confirmed) return;

  if (useElectronAPI && appState.currentProject.projectDir) {
    try {
      const result = await window.electronAPI.deleteProject(appState.currentProject.projectDir);
      if (result.success) {
        appState.currentProject = null;
        appState.currentShot = null;
        appState.currentScene = null;
        appState.projectData = null;
        await loadProjects();
        renderShotList([]);
        renderSceneList([]);
        if (elements.promptPreview) {
          elements.promptPreview.innerHTML = '<div class="placeholder-text">请选中项目 > 片段 > 镜头，自动生成提示词</div>';
        }
        if (elements.propertyForm) {
          elements.propertyForm.innerHTML = '<div class="placeholder-text">请选择项目、片段或镜头以编辑属性</div>';
        }
        showToast('项目已删除');
      } else {
        showToast('删除失败：' + result.error);
      }
    } catch (error) {
      console.error('删除项目异常:', error);
      showToast('删除失败：' + error.message);
    }
  }
}

/**
 * 加载项目列表
 */
async function loadProjects() {
  if (window.useElectronAPI) {
    try {
      // 使用设置中的存储路径
      const result = await window.electronAPI.listProjects(window.settings.storagePath || '');
      if (result.success) {
        window.appState.projects = result.projects;
        window.renderProjectList(window.appState.projects, window.elements, window.selectProject, (project, e) => {
          window.showProjectContextMenu(project, e, window.selectProject, () => window.deleteCurrentProject(), window.openProjectFolderByProject);
        }, (project, e) => {
          // 点击状态标签时，弹出状态菜单
          window.showProjectStatusMenu(project, e, (p, newStatus) => {
            window.updateProjectStatus(p, newStatus, window.appState, window.useElectronAPI, loadProjects, window.showUpdateNotification);
          });
        });
      } else {
        window.appState.projects = [];
        window.renderProjectList([], window.elements, window.selectProject, () => {}, () => {}, () => {});
      }
    } catch (error) {
      console.error('加载项目异常:', error);
      window.appState.projects = [];
      window.renderProjectList([], window.elements, window.selectProject, () => {}, () => {}, () => {});
    }
  } else {
    const savedProjects = localStorage.getItem('kim_projects');
    if (savedProjects) {
      window.appState.projects = JSON.parse(savedProjects);
    } else {
      window.appState.projects = [];
    }
    // 使用模块中的 renderProjectList 函数
    window.renderProjectList(window.appState.projects, window.elements, window.selectProject, (project, e) => {
      window.showProjectContextMenu(project, e, window.selectProject, () => window.deleteCurrentProject(), window.openProjectFolderByProject);
    }, (project, e) => {
      // 点击状态标签时，弹出状态菜单
      window.showProjectStatusMenu(project, e, (p, newStatus) => {
        window.updateProjectStatus(p, newStatus, window.appState, window.useElectronAPI, loadProjects, window.showUpdateNotification);
      });
    });
  }
}

/**
 * 选择项目
 * @param {Object} project - 项目对象
 */
async function selectProject(project) {
  window.appState.currentProject = project;
  window.appState.currentShot = null;
  window.appState.currentScene = null;

  // 使用模块中的 updateProjectSelection 函数
  if (window.updateProjectSelection) {
    window.updateProjectSelection(window.elements, project.id);
  }

  if (window.elements.newShotBtn) window.elements.newShotBtn.disabled = false;
  if (window.elements.deleteShotBtn) window.elements.deleteShotBtn.disabled = false;

  if (window.useElectronAPI && project.projectDir) {
    try {
      const result = await window.electronAPI.loadProject(project.projectDir);
      if (result.success) {
        window.appState.projectData = result.projectJson;
        window.renderShotList(result.projectJson.shots || []);
      } else {
        window.renderShotList(project.shots || []);
      }
    } catch (error) {
      console.error('加载项目数据失败:', error);
      window.renderShotList(project.shots || []);
    }
  } else {
    window.renderShotList(project.shots || []);
  }

  window.renderSceneList([]);

  // 清空提示词预览
  if (window.elements.promptPreview) {
    window.elements.promptPreview.innerHTML = '<div class="placeholder-text">请选择片段</div>';
  }

  // 清空属性栏
  if (window.elements.propertyForm) {
    window.elements.propertyForm.innerHTML = '<div class="placeholder-text">请选择项目、片段或镜头以编辑属性</div>';
  }

  // 重置底部面板标题
  if (window.elements.bottomPanelTitle) {
    window.elements.bottomPanelTitle.textContent = '属性';
  }

  // 清空素材库
  window.renderAssetsList([]);
}

// 将函数暴露到全局作用域
window.renderProjectList = renderProjectList;
window.getStatusText = getStatusText;
window.updateProjectSelection = updateProjectSelection;
window.showProjectContextMenu = showProjectContextMenu;
window.showProjectStatusMenu = showProjectStatusMenu;
window.openProjectFolderByProject = openProjectFolderByProject;
window.updateProjectStatus = updateProjectStatus;
window.deleteCurrentProject = deleteCurrentProject;
window.loadProjects = loadProjects;
window.selectProject = selectProject;
