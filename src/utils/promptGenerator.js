//
// Kim 多级分镜提示词助手 - 提示词生成模块
// 负责提示词生成、渲染、导出等功能
//

/**
 * 生成单个镜头的提示词
 * @param {Object} scene - 镜头数据对象
 * @param {number} index - 镜头索引（从 0 开始）
 * @param {number} cumulativeTime - 累计时间（秒）
 * @returns {string} 格式化后的镜头提示词
 */
function generateScenePrompt(scene, index, cumulativeTime) {
  if (!scene) return '';

  const shotType = scene.shotType || '';
  const angle = scene.angle || '';
  const camera = scene.camera || '';
  const content = scene.content || '';
  const emotion = scene.emotion || '';
  const dialogue = scene.dialogue || '';
  const notes = scene.notes || '';

  // 计算镜头时间
  const duration = scene.duration || 2;
  const startTime = cumulativeTime;
  const endTime = cumulativeTime + duration;
  const timeRange = `${startTime}-${endTime}秒`;

  // 格式：## 镜头 1\n**0-1 秒**：[特写、俯视、固定镜头]，内容...（情绪）
  let prompt = `## 镜头${index + 1}\n**${timeRange}**：`;

  if (shotType || angle || camera) {
    prompt += `[${[shotType, angle, camera].filter(Boolean).join('、')}]，`;
  }

  prompt += content;

  if (emotion) {
    prompt += `（${emotion}）`;
  }

  if (dialogue) {
    prompt += `\n【对白】${dialogue}`;
  }

  if (notes) {
    prompt += `\n【其他备注】${notes}`;
  }

  return prompt;
}

/**
 * 生成片段的提示词
 * @param {Object} shot - 片段数据对象
 * @returns {string} 格式化后的片段提示词
 */
function generateShotPrompt(shot) {
  if (!shot) return '';

  // 片段头部信息
  let prompt = '';

  // **风格**：风格，情绪氛围
  if (shot.style || shot.mood) {
    prompt += `**风格**：${shot.style || ''}${shot.mood ? `，${shot.mood}` : ''}\n\n`;
  }

  // **时长**：视频时长（秒）
  if (shot.duration) {
    prompt += `**时长**：${shot.duration}秒\n\n`;
  }

  // **画幅**：画幅比例
  if (shot.aspectRatio) {
    prompt += `**画幅**：${shot.aspectRatio}\n\n`;
  }

  // **角色**：角色
  if (shot.characters) {
    prompt += `**角色**：${shot.characters}\n\n`;
  }

  // **场景**：场景设定
  if (shot.sceneSetting) {
    prompt += `**场景**：${shot.sceneSetting}\n\n`;
  }

  // **片段描述**：片段描述
  if (shot.description) {
    prompt += `**片段描述**：${shot.description}\n\n`;
  }

  // **声音**：对白 + 配乐风格 + 音效需求
  const soundParts = [];
  if (shot.musicStyle) soundParts.push(shot.musicStyle);
  if (shot.soundEffect) soundParts.push(shot.soundEffect);
  if (soundParts.length > 0) {
    prompt += `**声音**：对白 + ${soundParts.join(' + ')}\n\n`;
  }

  // **参考**：图片参考，视频参考，音频参考
  const refs = [];
  if (shot.imageRef) refs.push(shot.imageRef);
  if (shot.videoRef) refs.push(shot.videoRef);
  if (shot.audioRef) refs.push(shot.audioRef);
  if (refs.length > 0) {
    prompt += `**参考**：${refs.join('，')}\n\n`;
  }

  // 自定义提示词部分
  if (shot.customPrompt) {
    prompt += `${shot.customPrompt}\n\n`;
  }

  // 镜头列表
  const scenes = shot.scenes || [];
  const enabledScenes = scenes.filter(scene => scene.enabled !== false);

  if (enabledScenes.length > 0) {
    prompt += '---\n# 镜头\n\n';

    let cumulativeTime = 0;
    enabledScenes.forEach((scene, index) => {
      prompt += generateScenePrompt(scene, index, cumulativeTime);
      cumulativeTime += scene.duration || 2;
      prompt += '\n\n';
    });
  }

  return prompt.trim();
}

/**
 * 生成项目的提示词
 * @param {Object} project - 项目数据对象
 * @param {Function} getStatusText - 获取状态文本的函数
 * @returns {string} 格式化后的项目提示词
 */
function generateProjectPrompt(project, getStatusText) {
  if (!project) return '';

  const shotsPrompt = (project.shots || [])
    .map(shot => generateShotPrompt(shot))
    .join('\n\n---\n\n');

  const statusText = getStatusText ? getStatusText(project.status || 'draft') : project.status || 'draft';

  return `【项目名称】${project.name} 【状态】${statusText} 【默认画幅】${project.aspectRatio}\n\n${shotsPrompt}`;
}

/**
 * 渲染提示词并添加语法高亮
 * @param {string} prompt - 原始提示词字符串
 * @returns {string} 带 HTML 标签的高亮提示词
 */
function renderPromptWithHighlight(prompt) {
  if (!prompt) return '';

  const keywords = [
    '风格', '时长', '画幅', '角色', '场景', '片段描述',
    '情绪', '配乐', '音效', '声音', '图片参考', '视频参考', '音频参考',
    '镜头', '对白'
  ];

  let highlighted = prompt;
  keywords.forEach(keyword => {
    const regex = new RegExp(`(\\*\\*${keyword}\\*\\*)`, 'g');
    highlighted = highlighted.replace(regex, '<span class="prompt-tag">$1</span>');
  });

  highlighted = highlighted.replace(/(---)/g, '<span class="prompt-separator">$1</span>');
  highlighted = highlighted.replace(/(\d+-\d+ 秒)/g, '<span class="prompt-scene-time">$1</span>');
  highlighted = highlighted.replace(/(## 镜头\d+)/g, '<span class="prompt-scene-title">$1</span>');

  return `<div class="prompt-content">${highlighted}</div>`;
}

/**
 * 更新提示词预览区域
 * 根据当前选中的片段或镜头自动生成并显示提示词
 */
function updatePromptPreview() {
  const elements = window.elements;
  const appState = window.appState;

  if (!elements.promptPreview) return;

  let prompt = '';

  // 无论选中片段还是镜头，都显示片段级提示词
  if (appState.currentShot) {
    prompt = generateShotPrompt(appState.currentShot);
  } else if (appState.currentProject) {
    const getStatusText = window.getStatusText;
    prompt = generateProjectPrompt(appState.currentProject, getStatusText);
  } else {
    elements.promptPreview.innerHTML = '<div class="placeholder-text">请选中项目 > 片段 > 镜头，自动生成提示词</div>';
    return;
  }

  elements.promptPreview.innerHTML = renderPromptWithHighlight(prompt);
}

/**
 * 复制提示词到剪贴板
 */
function copyPromptToClipboard() {
  const elements = window.elements;
  const prompt = elements.promptPreview?.textContent;
  if (prompt) {
    navigator.clipboard.writeText(prompt).then(() => {
      showUpdateNotification();
    });
  }
}

/**
 * 导出提示词为文本文件
 */
function exportPrompt() {
  const elements = window.elements;
  const prompt = elements.promptPreview?.textContent;
  if (prompt) {
    const blob = new Blob([prompt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

/**
 * 清空提示词预览区域
 */
function clearPrompt() {
  const elements = window.elements;
  if (elements.promptPreview) {
    elements.promptPreview.innerHTML = '<div class="placeholder-text">请选中项目 > 片段 > 镜头，自动生成提示词</div>';
  }
}

/**
 * 从 AI 生成提示词（AI 模式）
 * 使用激活的模板替换占位符，调用 LLM API 生成项目数据
 */
async function generatePromptFromAI() {
  const elements = window.elements;
  const settings = window.settings;
  const useElectronAPI = window.useElectronAPI;

  const script = elements.aiProjectScript?.value.trim();
  const provider = elements.aiProvider?.value || 'deepseek';

  if (!script) {
    showInputError(elements.aiProjectScript, '请输入项目剧本内容');
    return;
  }

  const apiKey = settings.apiKeys[provider];

  if (!apiKey) {
    alert('请先在设置中配置 API Key');
    showSettingsModal();
    return;
  }

  // 获取激活的模板
  const activeTemplate = settings.templates.find(t => t.id === settings.activeTemplateId);
  const template = activeTemplate || getDefaultTemplate();

  // 替换 {剧本内容} 占位符
  const prompt = template.content.replace('{剧本内容}', script);

  // 显示加载状态
  if (elements.generatePromptBtn) {
    elements.generatePromptBtn.disabled = true;
    elements.generatePromptBtn.textContent = '生成中...';
  }

  try {
    const result = await window.electronAPI.callLlmApi(provider, apiKey, settings.models[provider], prompt);

    if (result.success) {
      // 提取 JSON 数据
      let jsonData;
      try {
        const jsonMatch = result.content.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          jsonData = JSON.parse(jsonMatch[0]);
        } else {
          jsonData = JSON.parse(result.content);
        }

        // 格式化 JSON 并显示到预览框
        if (elements.aiResponsePreview) {
          elements.aiResponsePreview.value = JSON.stringify(jsonData, null, 2);
        } else {
          console.error('Preview element not found');
        }

        showUpdateNotification();
      } catch (e) {
        console.error('JSON parse error:', e);
        // 如果解析失败，显示原始返回
        if (elements.aiResponsePreview) {
          elements.aiResponsePreview.value = result.content;
        }
        alert('AI 返回的数据格式可能有误，请检查预览内容');
      }
    } else {
      alert('AI 调用失败：' + result.error);
    }
  } catch (error) {
    console.error('API call error:', error);
    alert('AI 调用失败：' + error.message);
  } finally {
    if (elements.generatePromptBtn) {
      elements.generatePromptBtn.disabled = false;
      elements.generatePromptBtn.textContent = '✨ 生成提示词';
    }
  }
}

// 导出所有函数到 window 对象
window.generateScenePrompt = generateScenePrompt;
window.generateShotPrompt = generateShotPrompt;
window.generateProjectPrompt = generateProjectPrompt;
window.renderPromptWithHighlight = renderPromptWithHighlight;
window.updatePromptPreview = updatePromptPreview;
window.copyPromptToClipboard = copyPromptToClipboard;
window.exportPrompt = exportPrompt;
window.clearPrompt = clearPrompt;
window.generatePromptFromAI = generatePromptFromAI;
