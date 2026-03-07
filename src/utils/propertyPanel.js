//
// Kim 多级分镜提示词助手 - 属性面板模块
// 负责片段和镜头属性表单的显示、自动保存和保存逻辑
//

// 全局变量引用（由 renderer.js 注入）
// - window.appState: 应用状态
// - window.elements: DOM 元素引用
// - window.useElectronAPI: 是否使用 Electron API
// - window.electronAPI: Electron API 接口
// - window.renderShotList: 渲染片段列表函数
// - window.updatePromptPreview: 更新提示词预览函数
// - window.loadOptionsByGroup: 加载自定义选项函数
// - window.showUpdateNotification: 显示更新提示函数

// 自动保存相关变量
let shotSaveTimeout = null;
let savingShotId = null;
let sceneSaveTimeout = null;
let savingSceneId = null;

/**
 * 显示片段属性表单
 * @param {Object} shot - 片段对象
 */
async function showShotProperties(shot) {
  console.log('[propertyPanel] showShotProperties: 显示片段属性', shot.name);
  
  if (!window.elements.propertyForm) {
    console.error('[propertyPanel] propertyForm 元素不存在');
    return;
  }

  // 更新底部面板标题
  if (window.elements.bottomPanelTitle) {
    window.elements.bottomPanelTitle.textContent = `${shot.name || '片段'} 属性`;
  }

  // 加载自定义选项
  const styleOptions = await window.loadOptionsByGroup('风格');
  const moodOptions = await window.loadOptionsByGroup('情绪氛围');
  const ratioOptions = [
    { style: '16:9', description: '横屏视频，适合 YouTube、B 站等平台' },
    { style: '9:16', description: '竖屏视频，适合抖音、快手、Reels 等平台' },
    { style: '1:1', description: '正方形视频，适合 Instagram 等社交平台' },
    { style: '4:3', description: '传统电视比例' },
    { style: '3:4', description: '竖版照片比例' }
  ];
  const musicOptions = await window.loadOptionsByGroup('配乐风格');
  const soundOptions = await window.loadOptionsByGroup('音效');

  window.elements.propertyForm.innerHTML = `
    <div class="shot-properties-grid shot-properties-2cols">
      <!-- 第一列 -->
      <div class="property-column">
        <h4 class="property-section-title">基本信息</h4>
        <div class="form-group">
          <label for="shotName">片段名称</label>
          <input type="text" id="shotName" value="${shot.name || ''}" placeholder="输入片段名称" data-autosave="true">
        </div>
        <div class="form-group">
          <label for="shotDescription">片段描述</label>
          <textarea id="shotDescription" rows="3" placeholder="输入片段描述" data-autosave="true">${shot.description || ''}</textarea>
        </div>

        <h4 class="property-section-title" style="margin-top: 16px;">角色与场景</h4>
        <div class="form-group">
          <label for="shotCharacters">角色</label>
          <textarea id="shotCharacters" rows="2" placeholder="描述角色信息" data-autosave="true">${shot.characters || ''}</textarea>
        </div>
        <div class="form-group">
          <label for="shotSceneSetting">场景设定</label>
          <input type="text" id="shotSceneSetting" value="${shot.sceneSetting || ''}" placeholder="如：室内演播室" data-autosave="true">
        </div>

        <h4 class="property-section-title" style="margin-top: 16px;">参考素材</h4>
        <div class="form-group">
          <label for="shotImageRef">图片参考（≤9 张）</label>
          <textarea id="shotImageRef" rows="2" placeholder="例如：@图片 1 作为首帧" data-autosave="true">${shot.imageRef || ''}</textarea>
        </div>
        <div class="form-group">
          <label for="shotVideoRef">视频参考（≤3 个）</label>
          <textarea id="shotVideoRef" rows="2" placeholder="例如：@视频 1 作为参考运镜" data-autosave="true">${shot.videoRef || ''}</textarea>
        </div>
        <div class="form-group">
          <label for="shotAudioRef">音频参考（≤3 个）</label>
          <textarea id="shotAudioRef" rows="2" placeholder="例如：@音频 1 作为整体配乐" data-autosave="true">${shot.audioRef || ''}</textarea>
        </div>
        <small class="setting-hint" style="color: #f59e0b;">！最多 12 个文件，视频/音频总时长≤15 秒</small>
      </div>

      <!-- 第二列 -->
      <div class="property-column">
        <h4 class="property-section-title">风格设定</h4>
        <div class="form-group">
          <label for="shotStyle">
            风格
            <button type="button" class="icon-btn small add-option-btn" data-field="shotStyle" data-group="风格" title="添加新选项">+</button>
          </label>
          <select id="shotStyle" data-autosave="true">
            <option value="">请选择风格</option>
            ${styleOptions.map(opt => `
              <option value="${opt.style}" ${shot.style === opt.style ? 'selected' : ''}
                data-description="${opt.description || ''}">
                ${opt.style} - ${opt.type}
              </option>
            `).join('')}
          </select>
          <small class="setting-hint" id="shotStyleHint">${styleOptions.find(o => o.style === shot.style)?.description || '选择风格'}</small>
        </div>
        <div class="form-group">
          <label for="shotMood">
            情绪氛围
            <button type="button" class="icon-btn small add-option-btn" data-field="shotMood" data-group="情绪氛围" title="添加新选项">+</button>
          </label>
          <select id="shotMood" data-autosave="true">
            <option value="">请选择情绪氛围</option>
            ${moodOptions.map(opt => `
              <option value="${opt.style}" ${shot.mood === opt.style ? 'selected' : ''}
                data-description="${opt.description || ''}">
                ${opt.style} - ${opt.type}
              </option>
            `).join('')}
          </select>
          <small class="setting-hint" id="shotMoodHint">${moodOptions.find(o => o.style === shot.mood)?.description || '选择情绪'}</small>
        </div>

        <h4 class="property-section-title" style="margin-top: 16px;">视频参数</h4>
        <div class="form-group">
          <label for="shotAspectRatio">画幅比例</label>
          <select id="shotAspectRatio" data-autosave="true">
            <option value="">请选择画幅</option>
            ${ratioOptions.map(opt => `
              <option value="${opt.style}" ${shot.aspectRatio === opt.style ? 'selected' : ''}
                data-description="${opt.description || ''}">
                ${opt.style}
              </option>
            `).join('')}
          </select>
          <small class="setting-hint" id="shotAspectRatioHint">${ratioOptions.find(o => o.style === shot.aspectRatio)?.description || '选择画幅'}</small>
        </div>
        <div class="form-group">
          <label for="shotDuration">视频时长（秒）</label>
          <input type="number" id="shotDuration" value="${shot.duration || 10}" min="1" max="15" step="0.5" data-autosave="true">
          <small class="setting-hint">每个片段最长 15 秒</small>
        </div>

        <h4 class="property-section-title" style="margin-top: 16px;">声音设计</h4>
        <div class="form-group">
          <label for="shotMusicStyle">
            配乐风格
            <button type="button" class="icon-btn small add-option-btn" data-field="shotMusicStyle" data-group="配乐风格" title="添加新选项">+</button>
          </label>
          <select id="shotMusicStyle" data-autosave="true">
            <option value="">请选择配乐风格</option>
            ${musicOptions.map(opt => `
              <option value="${opt.style}" ${shot.musicStyle === opt.style ? 'selected' : ''}
                data-description="${opt.description || ''}">
                ${opt.style} - ${opt.type}
              </option>
            `).join('')}
          </select>
          <small class="setting-hint" id="shotMusicStyleHint">${musicOptions.find(o => o.style === shot.musicStyle)?.description || '选择配乐'}</small>
        </div>
        <div class="form-group">
          <label for="shotSoundEffect">
            音效需求
            <button type="button" class="icon-btn small add-option-btn" data-field="shotSoundEffect" data-group="音效" title="添加新选项">+</button>
          </label>
          <select id="shotSoundEffect" data-autosave="true">
            <option value="">请选择音效</option>
            ${soundOptions.map(opt => `
              <option value="${opt.style}" ${shot.soundEffect === opt.style ? 'selected' : ''}
                data-description="${opt.description || ''}">
                ${opt.style} - ${opt.type}
              </option>
            `).join('')}
          </select>
          <small class="setting-hint" id="shotSoundEffectHint">${soundOptions.find(o => o.style === shot.soundEffect)?.description || '选择音效'}</small>
        </div>

        <h4 class="property-section-title" style="margin-top: 16px;">自定义提示词</h4>
        <div class="form-group">
          <label for="shotCustomPrompt">补充提示词</label>
          <textarea id="shotCustomPrompt" rows="3" placeholder="输入额外的提示词或要求" data-autosave="true">${shot.customPrompt || ''}</textarea>
        </div>
      </div>
    </div>
  `;

  console.log('[propertyPanel] showShotProperties: 属性表单已渲染');

  // 为所有输入框添加失焦自动保存
  document.querySelectorAll('#property-form [data-autosave="true"]').forEach(input => {
    input.addEventListener('blur', autoSaveShotProperties);
  });

  // 为选项下拉框添加变化时更新提示
  setupOptionHintListeners();

  // 绑定添加选项按钮事件
  setupAddOptionButtons();
  
  console.log('[propertyPanel] showShotProperties: 事件监听器已绑定');
}

/**
 * 自动保存片段属性
 */
function autoSaveShotProperties() {
  console.log('[propertyPanel] autoSaveShotProperties: 触发自动保存');
  
  if (shotSaveTimeout) {
    clearTimeout(shotSaveTimeout);
  }
  savingShotId = window.appState.currentShot?.id;
  console.log('[propertyPanel] autoSaveShotProperties: 保存 ID:', savingShotId);
  
  shotSaveTimeout = setTimeout(async () => {
    console.log('[propertyPanel] autoSaveShotProperties: 执行保存');
    await saveShotProperties(true);
  }, 500);
}

/**
 * 保存片段属性
 * @param {boolean} isAutoSave - 是否为自动保存
 */
async function saveShotProperties(isAutoSave = false) {
  console.log('[propertyPanel] saveShotProperties: 开始保存，isAutoSave:', isAutoSave);
  
  const shot = window.appState.currentShot;
  if (!shot) {
    console.warn('[propertyPanel] saveShotProperties: 当前片段为空，取消保存');
    return;
  }

  // 检查在保存过程中是否切换了片段
  if (savingShotId !== shot.id) {
    console.log('[propertyPanel] saveShotProperties: 片段已切换，取消保存', savingShotId, '->', shot.id);
    return;
  }

  // 检查表单元素是否存在
  const nameElement = document.getElementById('shotName');
  if (!nameElement) {
    console.warn('[propertyPanel] saveShotProperties: 表单元素不存在，取消保存');
    return;
  }

  const name = nameElement?.value;
  const description = document.getElementById('shotDescription')?.value;
  const style = document.getElementById('shotStyle')?.value;
  const mood = document.getElementById('shotMood')?.value;
  const characters = document.getElementById('shotCharacters')?.value;
  const sceneSetting = document.getElementById('shotSceneSetting')?.value;
  const aspectRatio = document.getElementById('shotAspectRatio')?.value;
  const duration = parseInt(document.getElementById('shotDuration')?.value) || 10;
  const musicStyle = document.getElementById('shotMusicStyle')?.value;
  const soundEffect = document.getElementById('shotSoundEffect')?.value;
  const imageRef = document.getElementById('shotImageRef')?.value;
  const videoRef = document.getElementById('shotVideoRef')?.value;
  const audioRef = document.getElementById('shotAudioRef')?.value;
  const customPrompt = document.getElementById('shotCustomPrompt')?.value;

  console.log('[propertyPanel] saveShotProperties: 表单数据已获取');

  if (window.useElectronAPI && window.appState.currentProject?.projectDir) {
    try {
      const loadResult = await window.electronAPI.loadProject(window.appState.currentProject.projectDir);
      if (!loadResult.success) {
        console.error('[propertyPanel] saveShotProperties: 加载项目失败', loadResult.error);
        return;
      }

      const shotIndex = loadResult.projectJson.shots?.findIndex(s => s.id === shot.id);
      if (shotIndex === -1) {
        console.error('[propertyPanel] saveShotProperties: 找不到片段 ID', shot.id);
        return;
      }

      const oldShot = loadResult.projectJson.shots[shotIndex];

      // 检查选项是否变更，如果变更则增加使用次数
      if (style && oldShot && style !== oldShot.style) {
        const styleOptions = await window.loadOptionsByGroup('风格');
        const selectedOption = styleOptions.find(opt => opt.style === style);
        if (selectedOption && !selectedOption.builtin) {
          await window.electronAPI.incrementOptionUsage(selectedOption.id);
        }
      }
      if (mood && oldShot && mood !== oldShot.mood) {
        const moodOptions = await window.loadOptionsByGroup('情绪氛围');
        const selectedOption = moodOptions.find(opt => opt.style === mood);
        if (selectedOption && !selectedOption.builtin) {
          await window.electronAPI.incrementOptionUsage(selectedOption.id);
        }
      }
      if (musicStyle && oldShot && musicStyle !== oldShot.musicStyle) {
        const musicOptions = await window.loadOptionsByGroup('配乐风格');
        const selectedOption = musicOptions.find(opt => opt.style === musicStyle);
        if (selectedOption && !selectedOption.builtin) {
          await window.electronAPI.incrementOptionUsage(selectedOption.id);
        }
      }
      if (soundEffect && oldShot && soundEffect !== oldShot.soundEffect) {
        const soundOptions = await window.loadOptionsByGroup('音效');
        const selectedOption = soundOptions.find(opt => opt.style === soundEffect);
        if (selectedOption && !selectedOption.builtin) {
          await window.electronAPI.incrementOptionUsage(selectedOption.id);
        }
      }

      loadResult.projectJson.shots[shotIndex] = {
        ...loadResult.projectJson.shots[shotIndex],
        name: name || '',
        description: description || '',
        style: style || '',
        mood: mood || '',
        characters: characters !== undefined ? characters : (oldShot.characters || ''),
        sceneSetting: sceneSetting !== undefined ? sceneSetting : (oldShot.sceneSetting || ''),
        aspectRatio: aspectRatio || '',
        duration: duration || 10,
        musicStyle: musicStyle !== undefined ? musicStyle : (oldShot.musicStyle || ''),
        soundEffect: soundEffect !== undefined ? soundEffect : (oldShot.soundEffect || ''),
        imageRef: imageRef !== undefined ? imageRef : (oldShot.imageRef || ''),
        videoRef: videoRef !== undefined ? videoRef : (oldShot.videoRef || ''),
        audioRef: audioRef !== undefined ? audioRef : (oldShot.audioRef || ''),
        customPrompt: customPrompt !== undefined ? customPrompt : (oldShot.customPrompt || ''),
        updatedAt: new Date().toISOString()
      };

      const saveResult = await window.electronAPI.saveProject(
        window.appState.currentProject.projectDir,
        loadResult.projectJson
      );

      if (saveResult.success) {
        console.log('[propertyPanel] saveShotProperties: 保存成功');
        // 更新 appState 中的 currentShot 引用为最新数据
        window.appState.currentShot = loadResult.projectJson.shots[shotIndex];
        if (window.elements.bottomPanelTitle) {
          window.elements.bottomPanelTitle.textContent = `${name || '片段'} 属性`;
        }
        window.updatePromptPreview();
        window.renderShotList(loadResult.projectJson.shots || []);
        // 如果当前选中了镜头，更新镜头列表
        if (window.appState.currentScene) {
          window.renderSceneList(loadResult.projectJson.shots[shotIndex].scenes || []);
          const sceneItem = document.querySelector(`#scene-list .list-item[data-id="${window.appState.currentScene.id}"]`);
          if (sceneItem) {
            sceneItem.classList.add('selected');
          }
        }
        // 重新设置选中状态
        const shotItem = document.querySelector(`#shot-list .list-item[data-id="${shot.id}"]`);
        if (shotItem) {
          shotItem.classList.add('selected');
        }
        window.showUpdateNotification();
      } else {
        console.error('[propertyPanel] saveShotProperties: 保存失败', saveResult.error);
      }
    } catch (error) {
      console.error('[propertyPanel] saveShotProperties: 保存异常', error);
    }
  } else {
    console.warn('[propertyPanel] saveShotProperties: 非 Electron 环境');
  }
}

/**
 * 显示镜头属性表单
 * @param {Object} scene - 镜头对象
 */
async function showSceneProperties(scene) {
  console.log('[propertyPanel] showSceneProperties: 显示镜头属性', scene.name);
  
  if (!window.elements.propertyForm) {
    console.error('[propertyPanel] propertyForm 元素不存在');
    return;
  }

  // 更新底部面板标题
  if (window.elements.bottomPanelTitle) {
    window.elements.bottomPanelTitle.textContent = `${scene.name || '镜头'} 属性`;
  }

  // 加载自定义选项
  const shotTypeOptions = await window.loadOptionsByGroup('景别');
  const angleOptions = await window.loadOptionsByGroup('镜头角度');
  const cameraOptions = await window.loadOptionsByGroup('运镜');

  window.elements.propertyForm.innerHTML = `
    <div class="shot-properties-grid shot-properties-2cols">
      <!-- 第一列：基本信息 -->
      <div class="property-column">
        <h4 class="property-section-title">基本信息</h4>
        <div class="form-group">
          <label for="sceneName">镜头名称</label>
          <input type="text" id="sceneName" value="${scene.name || ''}" placeholder="输入镜头名称" data-autosave="true">
        </div>
        <div class="form-group">
          <label for="sceneImage">分镜图片</label>
          <textarea id="sceneImage" rows="2" placeholder="点击上传或拖放图片，支持多张图片" data-autosave="true">${scene.image || ''}</textarea>
          <small class="setting-hint">支持上传和拖放图片</small>
        </div>

        <h4 class="property-section-title" style="margin-top: 16px;">镜头信息</h4>
        <div class="form-group">
          <label for="sceneShotType">
            景别
            <button type="button" class="icon-btn small add-option-btn" data-field="sceneShotType" data-group="景别" title="添加新选项">+</button>
          </label>
          <select id="sceneShotType" data-autosave="true">
            <option value="">请选择景别</option>
            ${shotTypeOptions.map(opt => `
              <option value="${opt.style}" ${scene.shotType === opt.style ? 'selected' : ''}
                data-description="${opt.description || ''}">
                ${opt.style} - ${opt.type}
              </option>
            `).join('')}
          </select>
          <small class="setting-hint" id="sceneShotTypeHint">${shotTypeOptions.find(o => o.style === scene.shotType)?.description || '选择景别'}</small>
        </div>
        <div class="form-group">
          <label for="sceneAngle">
            镜头角度
            <button type="button" class="icon-btn small add-option-btn" data-field="sceneAngle" data-group="镜头角度" title="添加新选项">+</button>
          </label>
          <select id="sceneAngle" data-autosave="true">
            <option value="">请选择镜头角度</option>
            ${angleOptions.map(opt => `
              <option value="${opt.style}" ${scene.angle === opt.style ? 'selected' : ''}
                data-description="${opt.description || ''}">
                ${opt.style} - ${opt.type}
              </option>
            `).join('')}
          </select>
          <small class="setting-hint" id="sceneAngleHint">${angleOptions.find(o => o.style === scene.angle)?.description || '选择镜头角度'}</small>
        </div>
        <div class="form-group">
          <label for="sceneCamera">
            运镜方式
            <button type="button" class="icon-btn small add-option-btn" data-field="sceneCamera" data-group="运镜" title="添加新选项">+</button>
          </label>
          <select id="sceneCamera" data-autosave="true">
            <option value="">请选择运镜方式</option>
            ${cameraOptions.map(opt => `
              <option value="${opt.style}" ${scene.camera === opt.style ? 'selected' : ''}
                data-description="${opt.description || ''}">
                ${opt.style} - ${opt.type}
              </option>
            `).join('')}
          </select>
          <small class="setting-hint" id="sceneCameraHint">${cameraOptions.find(o => o.style === scene.camera)?.description || '选择运镜方式'}</small>
        </div>
      </div>

      <!-- 第二列：详细信息 -->
      <div class="property-column">
        <h4 class="property-section-title">镜头信息</h4>
        <div class="form-group">
          <label for="sceneDuration">时长（秒）</label>
          <input type="number" id="sceneDuration" value="${scene.duration || 2}" min="1" step="0.5" data-autosave="true">
        </div>
        <div class="form-group">
          <label for="sceneContent">内容描述</label>
          <textarea id="sceneContent" rows="4" placeholder="输入镜头内容描述" data-autosave="true">${scene.content || ''}</textarea>
        </div>
        <div class="form-group">
          <label for="sceneDialogue">对白内容</label>
          <textarea id="sceneDialogue" rows="3" placeholder="输入台词或旁白" data-autosave="true">${scene.dialogue || ''}</textarea>
        </div>
        <div class="form-group">
          <label for="sceneEmotion">情绪描述</label>
          <input type="text" id="sceneEmotion" value="${scene.emotion || ''}" placeholder="如：紧张、温馨、悲伤" data-autosave="true">
        </div>
        <div class="form-group">
          <label for="sceneNotes">其他备注</label>
          <textarea id="sceneNotes" rows="3" placeholder="输入备注信息" data-autosave="true">${scene.notes || ''}</textarea>
        </div>
      </div>
    </div>
  `;

  console.log('[propertyPanel] showSceneProperties: 属性表单已渲染');

  // 为所有输入框添加失焦自动保存
  document.querySelectorAll('#property-form [data-autosave="true"]').forEach(input => {
    input.addEventListener('blur', autoSaveSceneProperties);
  });

  // 为选项下拉框添加变化时更新提示
  setupSceneOptionHintListeners();

  // 绑定添加选项按钮事件
  setupAddOptionButtons();
  
  console.log('[propertyPanel] showSceneProperties: 事件监听器已绑定');
}

/**
 * 自动保存镜头属性
 */
function autoSaveSceneProperties() {
  console.log('[propertyPanel] autoSaveSceneProperties: 触发自动保存');
  
  if (sceneSaveTimeout) {
    clearTimeout(sceneSaveTimeout);
  }
  savingSceneId = window.appState.currentScene?.id;
  console.log('[propertyPanel] autoSaveSceneProperties: 保存 ID:', savingSceneId);
  
  sceneSaveTimeout = setTimeout(async () => {
    console.log('[propertyPanel] autoSaveSceneProperties: 执行保存');
    await saveSceneProperties(true);
  }, 500);
}

/**
 * 保存镜头属性
 * @param {boolean} isAutoSave - 是否为自动保存
 */
async function saveSceneProperties(isAutoSave = false) {
  console.log('[propertyPanel] saveSceneProperties: 开始保存，isAutoSave:', isAutoSave);
  
  const scene = window.appState.currentScene;
  const currentShot = window.appState.currentShot;
  if (!scene || !currentShot) {
    console.warn('[propertyPanel] saveSceneProperties: 当前镜头或片段为空，取消保存');
    return;
  }

  // 检查在保存过程中是否切换了镜头
  if (savingSceneId !== scene.id) {
    console.log('[propertyPanel] saveSceneProperties: 镜头已切换，取消保存', savingSceneId, '->', scene.id);
    return;
  }

  // 检查表单元素是否存在
  const nameElement = document.getElementById('sceneName');
  if (!nameElement) {
    console.warn('[propertyPanel] saveSceneProperties: 表单元素不存在，取消保存');
    return;
  }

  const name = nameElement?.value;
  const image = document.getElementById('sceneImage')?.value;
  const shotType = document.getElementById('sceneShotType')?.value;
  const angle = document.getElementById('sceneAngle')?.value;
  const camera = document.getElementById('sceneCamera')?.value;
  const duration = parseInt(document.getElementById('sceneDuration')?.value) || 2;
  const content = document.getElementById('sceneContent')?.value;
  const dialogue = document.getElementById('sceneDialogue')?.value;
  const emotion = document.getElementById('sceneEmotion')?.value;
  const notes = document.getElementById('sceneNotes')?.value;

  console.log('[propertyPanel] saveSceneProperties: 表单数据已获取');

  if (window.useElectronAPI && window.appState.currentProject?.projectDir) {
    try {
      const loadResult = await window.electronAPI.loadProject(window.appState.currentProject.projectDir);
      if (!loadResult.success) {
        console.error('[propertyPanel] saveSceneProperties: 加载项目失败', loadResult.error);
        return;
      }

      const shot = loadResult.projectJson.shots?.find(s => s.id === currentShot.id);
      if (!shot) {
        console.error('[propertyPanel] saveSceneProperties: 找不到片段', currentShot.id);
        return;
      }

      const sceneIndex = shot.scenes?.findIndex(s => s.id === scene.id);
      if (sceneIndex === -1) {
        console.error('[propertyPanel] saveSceneProperties: 找不到镜头 ID', scene.id);
        return;
      }

      const oldScene = shot.scenes[sceneIndex];

      // 检查选项是否变更
      if (shotType && oldScene && shotType !== oldScene.shotType) {
        const shotTypeOptions = await window.loadOptionsByGroup('景别');
        const selectedOption = shotTypeOptions.find(opt => opt.style === shotType);
        if (selectedOption && !selectedOption.builtin) {
          await window.electronAPI.incrementOptionUsage(selectedOption.id);
        }
      }
      if (angle && oldScene && angle !== oldScene.angle) {
        const angleOptions = await window.loadOptionsByGroup('镜头角度');
        const selectedOption = angleOptions.find(opt => opt.style === angle);
        if (selectedOption && !selectedOption.builtin) {
          await window.electronAPI.incrementOptionUsage(selectedOption.id);
        }
      }
      if (camera && oldScene && camera !== oldScene.camera) {
        const cameraOptions = await window.loadOptionsByGroup('运镜');
        const selectedOption = cameraOptions.find(opt => opt.style === camera);
        if (selectedOption && !selectedOption.builtin) {
          await window.electronAPI.incrementOptionUsage(selectedOption.id);
        }
      }

      shot.scenes[sceneIndex] = {
        ...shot.scenes[sceneIndex],
        name: name || '',
        image: image !== undefined ? image : (oldScene.image || ''),
        shotType: shotType || '',
        angle: angle || '',
        camera: camera || '',
        duration: duration || 2,
        content: content !== undefined ? content : (oldScene.content || ''),
        dialogue: dialogue !== undefined ? dialogue : (oldScene.dialogue || ''),
        emotion: emotion !== undefined ? emotion : (oldScene.emotion || ''),
        notes: notes !== undefined ? notes : (oldScene.notes || ''),
        updatedAt: new Date().toISOString()
      };

      const saveResult = await window.electronAPI.saveProject(
        window.appState.currentProject.projectDir,
        loadResult.projectJson
      );

      if (saveResult.success) {
        console.log('[propertyPanel] saveSceneProperties: 保存成功');
        // 更新 currentScene
        window.appState.currentScene = shot.scenes[sceneIndex];
        // 更新 currentShot.scenes（重要！否则提示词不会更新）
        if (window.appState.currentShot) {
          window.appState.currentShot.scenes = shot.scenes;
        }
        if (window.elements.bottomPanelTitle) {
          window.elements.bottomPanelTitle.textContent = `${name || '镜头'} 属性`;
        }
        window.updatePromptPreview();
        window.renderShotList(loadResult.projectJson.shots || []);
        // 恢复片段列表选中状态
        const shotItem = document.querySelector(`#shot-list .list-item[data-id="${window.appState.currentShot.id}"]`);
        if (shotItem) {
          shotItem.classList.add('selected');
        }
        window.renderSceneList(shot.scenes || []);
        const sceneItem = document.querySelector(`#scene-list .list-item[data-id="${scene.id}"]`);
        if (sceneItem) {
          sceneItem.classList.add('selected');
        }
        window.showUpdateNotification();
      } else {
        console.error('[propertyPanel] saveSceneProperties: 保存失败', saveResult.error);
      }
    } catch (error) {
      console.error('[propertyPanel] saveSceneProperties: 保存异常', error);
    }
  } else {
    console.warn('[propertyPanel] saveSceneProperties: 非 Electron 环境');
  }
}

/**
 * 设置片段选项提示监听
 */
function setupOptionHintListeners() {
  console.log('[propertyPanel] setupOptionHintListeners: 设置片段选项提示监听');
  
  const hintMap = {
    'shotStyle': 'shotStyleHint',
    'shotMood': 'shotMoodHint',
    'shotMusicStyle': 'shotMusicStyleHint',
    'shotSoundEffect': 'shotSoundEffectHint'
  };

  Object.entries(hintMap).forEach(([selectId, hintId]) => {
    const select = document.getElementById(selectId);
    const hint = document.getElementById(hintId);
    if (select && hint) {
      select.addEventListener('change', () => {
        const selectedOption = select.options[select.selectedIndex];
        const description = selectedOption.dataset.description || '选择该项';
        hint.textContent = description;
        autoSaveShotProperties();
      });
    }
  });
}

/**
 * 设置镜头选项提示监听
 */
function setupSceneOptionHintListeners() {
  console.log('[propertyPanel] setupSceneOptionHintListeners: 设置镜头选项提示监听');
  
  const hintMap = {
    'sceneShotType': 'sceneShotTypeHint',
    'sceneAngle': 'sceneAngleHint',
    'sceneCamera': 'sceneCameraHint'
  };

  Object.entries(hintMap).forEach(([selectId, hintId]) => {
    const select = document.getElementById(selectId);
    const hint = document.getElementById(hintId);
    if (select && hint) {
      select.addEventListener('change', () => {
        const selectedOption = select.options[select.selectedIndex];
        const description = selectedOption.dataset.description || '选择该项';
        hint.textContent = description;
        autoSaveSceneProperties();
      });
    }
  });
}

/**
 * 设置添加选项按钮事件
 */
function setupAddOptionButtons() {
  document.querySelectorAll('.add-option-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const field = btn.dataset.field;
      const group = btn.dataset.group;
      showQuickAddOptionModal(group, field);
    });
  });
}

/**
 * 显示快速添加选项弹窗
 * @param {string} group - 选项组别
 * @param {string} field - 字段名
 * @param {string} defaultValue - 默认值
 */
async function showQuickAddOptionModal(group, field, defaultValue = '') {
  console.log('[propertyPanel] showQuickAddOptionModal: 显示快速添加选项弹窗', group, field);
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="modal-content quick-add-modal">
      <div class="modal-header">
        <h3>添加"${group}"新选项</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>类型</label>
          <input type="text" id="quick-option-type" placeholder="如：写实风格、清新治愈">
        </div>
        <div class="form-group">
          <label>风格名称</label>
          <input type="text" id="quick-option-style" placeholder="如：照片写实、日系清新" value="${defaultValue}">
        </div>
        <div class="form-group">
          <label>描述</label>
          <textarea id="quick-option-description" rows="3" placeholder="描述该选项的特点"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="form-btn primary" id="quick-add-save">保存</button>
        <button class="form-btn" onclick="this.closest('.modal').remove()">取消</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const saveBtn = modal.querySelector('#quick-add-save');
  saveBtn.addEventListener('click', async () => {
    const type = document.getElementById('quick-option-type').value.trim();
    const style = document.getElementById('quick-option-style').value.trim();
    const description = document.getElementById('quick-option-description').value.trim();

    if (!type || !style || !description) {
      alert('请填写所有必填字段');
      return;
    }

    try {
      const result = await window.electronAPI.addCustomOption({
        group,
        type,
        style,
        description,
        builtin: false
      });

      if (result.success) {
        modal.remove();
        window.showUpdateNotification();
        // 重新渲染当前属性表单
        if (window.appState.currentShot && field.startsWith('shot')) {
          await showShotProperties(window.appState.currentShot);
        } else if (window.appState.currentScene && field.startsWith('scene')) {
          await showSceneProperties(window.appState.currentScene);
        }
      } else {
        alert('添加失败：' + result.error);
      }
    } catch (error) {
      console.error('[propertyPanel] showQuickAddOptionModal: 添加选项失败', error);
      alert('添加失败：' + error.message);
    }
  });
}

// 导出函数到全局
window.showShotProperties = showShotProperties;
window.showSceneProperties = showSceneProperties;
window.autoSaveShotProperties = autoSaveShotProperties;
window.autoSaveSceneProperties = autoSaveSceneProperties;
window.saveShotProperties = saveShotProperties;
window.saveSceneProperties = saveSceneProperties;
window.setupOptionHintListeners = setupOptionHintListeners;
window.setupSceneOptionHintListeners = setupSceneOptionHintListeners;
window.setupAddOptionButtons = setupAddOptionButtons;
window.showQuickAddOptionModal = showQuickAddOptionModal;

console.log('[propertyPanel.js] 模块已加载');
