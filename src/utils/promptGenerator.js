//
// 提示词生成器
// 负责生成片段、镜头、项目级别的提示词
//

/**
 * 生成镜头提示词
 * @param {Object} scene - 镜头数据
 * @param {number} index - 镜头索引
 * @returns {string} 镜头提示词
 */
function generateScenePrompt(scene, index) {
  if (!scene) return '';
  
  // 镜头提示词格式：[景别、角度、运镜]，内容描述。（情绪）【对白】
  const shotType = scene.shotType || '特写';
  const angle = scene.angle || '平视';
  const camera = scene.camera || '固定镜头';
  const content = scene.content || '';
  const emotion = scene.emotion ? `（${scene.emotion}）` : '';
  const dialogue = scene.dialogue ? `\n【对白】${scene.dialogue}` : '';
  
  return `## 镜头${index + 1}\n[${shotType}、${angle}、${camera}]，${content}。${emotion}${dialogue}`;
}

/**
 * 生成片段提示词
 * @param {Object} shot - 片段数据
 * @returns {string} 片段提示词
 */
function generateShotPrompt(shot) {
  if (!shot) return '';

  // 片段提示词格式（按 defualt-prompt.md 模板）
  const style = shot.style || '默认风格';
  const duration = shot.duration || 0;
  const aspectRatio = shot.aspectRatio || '16:9';
  const characters = shot.characters ? `\n**角色**：${shot.characters}` : '';
  const sceneSetting = shot.sceneSetting ? `\n**场景**：${shot.sceneSetting}` : '';
  const description = shot.description ? `\n**片段描述**：${shot.description}` : '';
  const mood = shot.mood || '默认情绪';
  
  // 声音设计
  const musicStyle = shot.musicStyle ? `\n**配乐**：${shot.musicStyle}` : '';
  const soundEffect = shot.soundEffect ? `\n**音效**：${shot.soundEffect}` : '';
  const soundLine = (musicStyle || soundEffect) 
    ? `\n**声音**：${musicStyle}${soundEffect}`.replace(/\n\*\*/g, ' + ').replace(/^\+ /, '') 
    : '';
  
  // 参考素材
  const imageRef = shot.imageRef ? `\n**图片参考**：${shot.imageRef}` : '';
  const videoRef = shot.videoRef ? `\n**视频参考**：${shot.videoRef}` : '';
  const audioRef = shot.audioRef ? `\n**音频参考**：${shot.audioRef}` : '';
  const refs = imageRef + videoRef + audioRef;
  
  // 自定义提示词
  const customPrompt = shot.customPrompt ? `\n\n${shot.customPrompt}` : '';

  // 镜头列表
  const scenes = shot.scenes || [];
  const enabledScenes = scenes.filter(scene => scene.enabled !== false);
  
  let scenesPrompt = '';
  if (enabledScenes.length > 0) {
    scenesPrompt = '\n\n---\n# 镜头\n\n' + enabledScenes.map((scene, index) => {
      return generateScenePrompt(scene, index);
    }).join('\n\n');
  }

  return `**风格**：${style}
**时长**：${duration}秒
**画幅**：${aspectRatio}${characters}${sceneSetting}${description}
**情绪**：${mood}${soundLine}${refs}${customPrompt}${scenesPrompt}`;
}

/**
 * 生成项目提示词
 * @param {Object} project - 项目数据
 * @param {Function} getStatusText - 获取状态文本的函数
 * @returns {string} 项目提示词
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
 * 渲染提示词并高亮关键词
 * @param {string} prompt - 提示词
 * @returns {string} HTML 字符串
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
  highlighted = highlighted.replace(/(\d+ 秒)/g, '<span class="prompt-value">$1</span>');
  highlighted = highlighted.replace(/(## 镜头\d+)/g, '<span class="prompt-scene-title">$1</span>');

  return `<div class="prompt-content">${highlighted}</div>`;
}

module.exports = {
  generateScenePrompt,
  generateShotPrompt,
  generateProjectPrompt,
  renderPromptWithHighlight
};
