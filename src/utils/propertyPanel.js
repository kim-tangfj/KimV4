//
// Kim 多级分镜提示词助手 - 属性面板模块
// 负责片段和镜头属性表单的显示、自动保存和保存逻辑
//

// 全局变量引用（由 renderer.js 注入）
// - window.getState(): 获取应用状态
// - window.updateState(): 更新应用状态
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
  if (!window.elements.propertyForm) {
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

  // 为所有输入框添加失焦自动保存
  document.querySelectorAll('#property-form [data-autosave="true"]').forEach(input => {
    input.addEventListener('blur', autoSaveShotProperties);
  });

  // 为选项下拉框添加变化时更新提示
  setupOptionHintListeners();

  // 绑定添加选项按钮事件
  setupAddOptionButtons();
}

/**
 * 自动保存片段属性
 */
function autoSaveShotProperties() {
  if (shotSaveTimeout) {
    clearTimeout(shotSaveTimeout);
  }
  const state = window.getState();
  savingShotId = state.currentShot?.id;
  shotSaveTimeout = setTimeout(async () => {
    await saveShotProperties(true);
  }, 500);
}

/**
 * 保存片段属性
 * @param {boolean} isAutoSave - 是否为自动保存
 */
async function saveShotProperties(isAutoSave = false) {
  const state = window.getState();
  const shot = state.currentShot;
  if (!shot) {
    return;
  }

  // 检查在保存过程中是否切换了片段
  if (savingShotId !== shot.id) {
    return;
  }

  // 检查表单元素是否存在
  const nameElement = document.getElementById('shotName');
  if (!nameElement) {
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

  if (window.useElectronAPI && state.currentProject?.projectDir) {
    try {
      const loadResult = await window.electronAPI.loadProject(state.currentProject.projectDir);
      if (!loadResult.success) {
        return;
      }

      const shotIndex = loadResult.projectJson.shots?.findIndex(s => s.id === shot.id);
      if (shotIndex === -1) {
        console.error('[propertyPanel] saveShotProperties: 找不到片段 ID', shot.id);
        return;
      }

      const oldShot = loadResult.projectJson.shots[shotIndex];

      // 收集选项变更，批量更新使用次数
      const usageUpdates = [];
      
      // 检查选项是否变更，如果变更则更新使用次数
      if (style && oldShot && style !== oldShot.style) {
        const styleOptions = await window.loadOptionsByGroup('风格');
        const selectedOption = styleOptions.find(opt => opt.style === style);
        const oldOption = styleOptions.find(opt => opt.style === oldShot.style);
        if (selectedOption && !selectedOption.builtin) {
          usageUpdates.push({ optionId: selectedOption.id, delta: 1 });
        }
        if (oldOption && !oldOption.builtin) {
          usageUpdates.push({ optionId: oldOption.id, delta: -1 });
        }
      }
      if (mood && oldShot && mood !== oldShot.mood) {
        const moodOptions = await window.loadOptionsByGroup('情绪氛围');
        const selectedOption = moodOptions.find(opt => opt.style === mood);
        const oldOption = moodOptions.find(opt => opt.style === oldShot.mood);
        if (selectedOption && !selectedOption.builtin) {
          usageUpdates.push({ optionId: selectedOption.id, delta: 1 });
        }
        if (oldOption && !oldOption.builtin) {
          usageUpdates.push({ optionId: oldOption.id, delta: -1 });
        }
      }
      if (musicStyle !== undefined && oldShot && musicStyle !== oldShot.musicStyle) {
        const musicOptions = await window.loadOptionsByGroup('配乐风格');
        const selectedOption = musicOptions.find(opt => opt.style === musicStyle);
        const oldOption = musicOptions.find(opt => opt.style === oldShot.musicStyle);
        if (selectedOption && !selectedOption.builtin) {
          usageUpdates.push({ optionId: selectedOption.id, delta: 1 });
        }
        if (oldOption && !oldOption.builtin) {
          usageUpdates.push({ optionId: oldOption.id, delta: -1 });
        }
      }
      if (soundEffect !== undefined && oldShot && soundEffect !== oldShot.soundEffect) {
        const soundOptions = await window.loadOptionsByGroup('音效');
        const selectedOption = soundOptions.find(opt => opt.style === soundEffect);
        const oldOption = soundOptions.find(opt => opt.style === oldShot.soundEffect);
        if (selectedOption && !selectedOption.builtin) {
          usageUpdates.push({ optionId: selectedOption.id, delta: 1 });
        }
        if (oldOption && !oldOption.builtin) {
          usageUpdates.push({ optionId: oldOption.id, delta: -1 });
        }
      }

      // 批量更新选项使用次数
      if (usageUpdates.length > 0) {
        await window.electronAPI.batchUpdateOptionUsage(usageUpdates);
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
        state.currentProject.projectDir,
        loadResult.projectJson
      );

      if (saveResult.success) {
        // 更新 appState 中的 currentShot 引用为最新数据
        window.updateState('currentShot', loadResult.projectJson.shots[shotIndex]);
        if (window.elements.bottomPanelTitle) {
          window.elements.bottomPanelTitle.textContent = `${name || '片段'} 属性`;
        }
        window.updatePromptPreview();
        window.renderShotList(loadResult.projectJson.shots || []);
        // 如果当前选中了镜头，更新镜头列表
        const currentState = window.getState();
        if (currentState.currentScene) {
          window.renderSceneList(loadResult.projectJson.shots[shotIndex].scenes || []);
          const sceneItem = document.querySelector(`#scene-list .list-item[data-id="${currentState.currentScene.id}"]`);
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
  }
}

/**
 * 显示镜头属性表单
 * @param {Object} scene - 镜头对象
 */
async function showSceneProperties(scene) {
  if (!window.elements.propertyForm) {
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
        
        <!-- 分镜图片上传区域 -->
        <div class="form-group">
          <label for="sceneStoryboardImage">分镜图片</label>
          <div class="storyboard-upload-area" id="storyboard-upload-area" data-shot-id="${scene.shotId || ''}" data-scene-id="${scene.id}">
            <input type="file" id="storyboard-file-input" accept="image/*" style="display: none;" />
            <div class="upload-area-content">
              <span class="upload-icon">📤</span>
              <span class="upload-text">点击或拖放图片到此处</span>
              <span class="upload-hint">支持 jpg, png, webp 格式</span>
            </div>
            <!-- 已上传预览区域 -->
            <div class="storyboard-preview" id="storyboard-preview"></div>
          </div>
          <small class="setting-hint">支持上传和从素材库拖放（📋片段素材不可用）</small>
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

  // 为所有输入框添加失焦自动保存
  document.querySelectorAll('#property-form [data-autosave="true"]').forEach(input => {
    input.addEventListener('blur', autoSaveSceneProperties);
  });

  // 为选项下拉框添加变化时更新提示
  setupSceneOptionHintListeners();

  // 绑定添加选项按钮事件
  setupAddOptionButtons();
  
  // 初始化分镜图片上传功能
  initStoryboardImageUpload();
  
  // 加载分镜图预览
  setTimeout(() => {
    loadStoryboardPreview();
  }, 100);
}

/**
 * 自动保存镜头属性
 */
function autoSaveSceneProperties() {
  if (sceneSaveTimeout) {
    clearTimeout(sceneSaveTimeout);
  }
  const state = window.getState();
  savingSceneId = state.currentScene?.id;
  sceneSaveTimeout = setTimeout(async () => {
    await saveSceneProperties(true);
  }, 500);
}

/**
 * 保存镜头属性
 * @param {boolean} isAutoSave - 是否为自动保存
 */
async function saveSceneProperties(isAutoSave = false) {
  const state = window.getState();
  const scene = state.currentScene;
  const currentShot = state.currentShot;
  if (!scene || !currentShot) {
    return;
  }

  // 检查在保存过程中是否切换了镜头
  if (savingSceneId !== scene.id) {
    return;
  }

  // 检查表单元素是否存在
  const nameElement = document.getElementById('sceneName');
  if (!nameElement) {
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

  if (window.useElectronAPI && state.currentProject?.projectDir) {
    try {
      const loadResult = await window.electronAPI.loadProject(state.currentProject.projectDir);
      if (!loadResult.success) {
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

      // 收集选项变更，批量更新使用次数
      const usageUpdates = [];
      
      // 检查选项是否变更，如果变更则更新使用次数
      if (shotType && oldScene && shotType !== oldScene.shotType) {
        const shotTypeOptions = await window.loadOptionsByGroup('景别');
        const selectedOption = shotTypeOptions.find(opt => opt.style === shotType);
        const oldOption = shotTypeOptions.find(opt => opt.style === oldScene.shotType);
        if (selectedOption && !selectedOption.builtin) {
          usageUpdates.push({ optionId: selectedOption.id, delta: 1 });
        }
        if (oldOption && !oldOption.builtin) {
          usageUpdates.push({ optionId: oldOption.id, delta: -1 });
        }
      }
      if (angle && oldScene && angle !== oldScene.angle) {
        const angleOptions = await window.loadOptionsByGroup('镜头角度');
        const selectedOption = angleOptions.find(opt => opt.style === angle);
        const oldOption = angleOptions.find(opt => opt.style === oldScene.angle);
        if (selectedOption && !selectedOption.builtin) {
          usageUpdates.push({ optionId: selectedOption.id, delta: 1 });
        }
        if (oldOption && !oldOption.builtin) {
          usageUpdates.push({ optionId: oldOption.id, delta: -1 });
        }
      }
      if (camera && oldScene && camera !== oldScene.camera) {
        const cameraOptions = await window.loadOptionsByGroup('运镜');
        const selectedOption = cameraOptions.find(opt => opt.style === camera);
        const oldOption = cameraOptions.find(opt => opt.style === oldScene.camera);
        if (selectedOption && !selectedOption.builtin) {
          usageUpdates.push({ optionId: selectedOption.id, delta: 1 });
        }
        if (oldOption && !oldOption.builtin) {
          usageUpdates.push({ optionId: oldOption.id, delta: -1 });
        }
      }
      if (emotion && oldScene && emotion !== oldScene.emotion) {
        const emotionOptions = await window.loadOptionsByGroup('情绪氛围');
        const selectedOption = emotionOptions.find(opt => opt.style === emotion);
        const oldOption = emotionOptions.find(opt => opt.style === oldScene.emotion);
        if (selectedOption && !selectedOption.builtin) {
          usageUpdates.push({ optionId: selectedOption.id, delta: 1 });
        }
        if (oldOption && !oldOption.builtin) {
          usageUpdates.push({ optionId: oldOption.id, delta: -1 });
        }
      }

      // 批量更新选项使用次数
      if (usageUpdates.length > 0) {
        await window.electronAPI.batchUpdateOptionUsage(usageUpdates);
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
        state.currentProject.projectDir,
        loadResult.projectJson
      );

      if (saveResult.success) {
        // 更新 currentScene
        window.updateState('currentScene', shot.scenes[sceneIndex]);
        // 更新 currentShot.scenes（重要！否则提示词不会更新）
        const currentState = window.getState();
        if (currentState.currentShot) {
          window.updateState('currentShot', { ...currentState.currentShot, scenes: shot.scenes });
        }
        if (window.elements.bottomPanelTitle) {
          window.elements.bottomPanelTitle.textContent = `${name || '镜头'} 属性`;
        }
        window.updatePromptPreview();
        window.renderShotList(loadResult.projectJson.shots || []);
        // 恢复片段列表选中状态
        const shotItem = document.querySelector(`#shot-list .list-item[data-id="${currentState.currentShot.id}"]`);
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
  }
}

/**
 * 设置片段选项提示监听
 */
function setupOptionHintListeners() {
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
  // 创建遮罩层
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
  modal.className = 'modal';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="modal-content quick-add-modal">
      <div class="modal-header">
        <h3>添加"${group}"新选项</h3>
        <button class="modal-close" id="quick-add-close">×</button>
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
        <button class="form-btn" id="quick-add-cancel">取消</button>
      </div>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // 关闭函数
  const closeModal = () => {
    overlay.remove();
  };

  // 绑定关闭按钮
  const closeBtn = modal.querySelector('#quick-add-close');
  closeBtn.addEventListener('click', closeModal);

  // 绑定取消按钮
  const cancelBtn = modal.querySelector('#quick-add-cancel');
  cancelBtn.addEventListener('click', closeModal);

  // 点击遮罩关闭
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });

  // ESC 键关闭
  const handleEscKey = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEscKey);
    }
  };
  document.addEventListener('keydown', handleEscKey);

  const saveBtn = modal.querySelector('#quick-add-save');
  saveBtn.addEventListener('click', async () => {
    const type = document.getElementById('quick-option-type').value.trim();
    const style = document.getElementById('quick-option-style').value.trim();
    const description = document.getElementById('quick-option-description').value.trim();

    if (!type || !style || !description) {
      window.showToast('请填写所有必填字段');
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
        closeModal();
        window.showUpdateNotification();
        // 重新渲染当前属性表单
        const state = window.getState();
        if (state.currentShot && field.startsWith('shot')) {
          await showShotProperties(state.currentShot);
        } else if (state.currentScene && field.startsWith('scene')) {
          await showSceneProperties(state.currentScene);
        }
      } else {
        window.showToast('添加失败：' + result.error);
      }
    } catch (error) {
      console.error('[propertyPanel] showQuickAddOptionModal: 添加选项失败', error);
      window.showToast('添加失败：' + error.message);
    }
  });
}
window.showShotProperties = showShotProperties;
window.showSceneProperties = showSceneProperties;
window.autoSaveShotProperties = autoSaveShotProperties;
window.autoSaveSceneProperties = autoSaveSceneProperties;
window.saveShotProperties = saveShotProperties;
window.saveSceneProperties = saveSceneProperties;
window.initStoryboardImageUpload = initStoryboardImageUpload;

/**
 * 初始化分镜图片上传功能
 */
function initStoryboardImageUpload() {
  const uploadArea = document.getElementById('storyboard-upload-area');
  const fileInput = document.getElementById('storyboard-file-input');
  
  if (!uploadArea || !fileInput) return;
  
  const shotId = uploadArea.dataset.shotId;
  const sceneId = uploadArea.dataset.sceneId;
  
  // 点击上传区域
  uploadArea.addEventListener('click', async () => {
    const result = await window.electronAPI.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: '图片', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] }
      ]
    });
    
    if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      const fileName = filePath.split(/[\\/]/).pop();
      uploadStoryboardImage(filePath, fileName, shotId, sceneId);
    }
  });
  
  // 拖放上传 - 阻止默认行为
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    }, false);
  });
  
  // 拖放视觉效果
  uploadArea.addEventListener('dragenter', () => {
    uploadArea.classList.add('drag-over');
  });
  
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
  });
  
  // 处理文件 drop
  uploadArea.addEventListener('drop', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    uploadArea.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        // 本地文件拖放
        const filePath = file.path || await getFileLocalPath(file);
        if (filePath) {
          uploadStoryboardImage(filePath, file.name, shotId, sceneId);
        }
      }
    }
  });
  
  // 从素材库拖放处理
  uploadArea.addEventListener('dragover', (e) => {
    const assetData = e.dataTransfer.getData('text/asset-data');
    if (assetData) {
      try {
        const data = JSON.parse(assetData);
        // 允许所有素材拖放（项目和片段素材库都允许）
        uploadArea.classList.remove('drag-forbidden');
        e.dataTransfer.dropEffect = 'copy';
      } catch (err) {
        console.error('[storyboard dragover] 解析素材数据失败:', err);
      }
    }
  });
  
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-forbidden');
  });
  
  uploadArea.addEventListener('drop', async (e) => {
    const assetData = e.dataTransfer.getData('text/asset-data');
    if (assetData) {
      try {
        const data = JSON.parse(assetData);
        uploadArea.classList.remove('drag-forbidden');

        // 从项目素材库或片段素材库拖放
        if (data.path) {
          uploadStoryboardImage(data.path, data.name, shotId, sceneId, data.source);
        }
      } catch (err) {
        console.error('[storyboard drop] 解析素材数据失败:', err);
      }
    }
  });
}

/**
 * 获取本地文件路径（sandbox 模式兼容）
 */
async function getFileLocalPath(file) {
  // 在 sandbox 模式下，File 对象没有 path 属性
  // 这里返回 null，表示需要通过其他方式获取路径
  return null;
}

/**
 * 上传分镜图片
 */
async function uploadStoryboardImage(filePath, fileName, shotId, sceneId, source = 'project') {
  const state = window.getState();
  const project = state.currentProject;

  if (!project || !project.projectDir) {
    window.showToast('项目未加载');
    return;
  }

  try {
    const result = await window.electronAPI.uploadStoryboardImage({
      projectDir: project.projectDir,
      filePath: filePath,
      shotId: shotId,
      sceneId: sceneId,
      fileName: fileName,
      source: source // project 或 shot
    });

    if (result.success) {
      window.showToast('分镜图片已上传');
      // 更新镜头数据
      updateSceneStoryboardImage(sceneId, result.asset);
      // 刷新预览
      renderStoryboardPreview(result.asset);
      // 刷新镜头列表缩略图
      if (window.renderShotList) {
        window.renderShotList(project.shots || []);
      }
    } else {
      window.showToast('上传失败：' + result.error);
    }
  } catch (error) {
    console.error('[uploadStoryboardImage] 上传失败:', error);
    window.showToast('上传失败：' + error.message);
  }
}

/**
 * 更新镜头分镜图片数据
 */
function updateSceneStoryboardImage(sceneId, asset) {
  const state = window.getState();
  const projectData = state.projectData;
  
  if (!projectData || !projectData.shots) return;
  
  // 查找镜头
  for (const shot of projectData.shots) {
    const scene = shot.scenes?.find(s => s.id === sceneId);
    if (scene) {
      scene.storyboardImage = asset;
      break;
    }
  }
  
  // 保存项目
  saveProjectData(projectData);
}

/**
 * 保存项目数据
 */
async function saveProjectData(projectData) {
  const state = window.getState();
  const project = state.currentProject;
  
  if (!project || !project.projectDir) return;
  
  try {
    await window.electronAPI.saveProject(project.projectDir, projectData);
    window.updateState('projectData', projectData);
  } catch (error) {
    console.error('[saveProjectData] 保存失败:', error);
  }
}

/**
 * 渲染分镜图预览
 */
function renderStoryboardPreview(asset) {
  const previewEl = document.getElementById('storyboard-preview');
  const uploadArea = document.getElementById('storyboard-upload-area');
  
  if (!previewEl || !uploadArea) return;
  
  if (asset) {
    previewEl.innerHTML = `
      <div class="storyboard-preview-item">
        <img src="${asset.path}" alt="${asset.name}" />
        <div class="storyboard-preview-info">
          <span class="storyboard-preview-name">${asset.name}</span>
          <button class="storyboard-preview-delete" title="删除">×</button>
        </div>
      </div>
    `;
    previewEl.classList.add('has-image');
    uploadArea.querySelector('.upload-area-content').style.display = 'none';
    
    // 绑定删除按钮事件
    const deleteBtn = previewEl.querySelector('.storyboard-preview-delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteStoryboardImage();
      });
    }
  } else {
    previewEl.innerHTML = '';
    previewEl.classList.remove('has-image');
    uploadArea.querySelector('.upload-area-content').style.display = 'flex';
  }
}

/**
 * 删除分镜图片
 */
function deleteStoryboardImage() {
  const state = window.getState();
  const currentScene = state.currentScene;
  
  if (!currentScene) return;
  
  currentScene.storyboardImage = null;
  
  // 保存项目
  const projectData = state.projectData;
  saveProjectData(projectData);
  
  // 刷新预览
  renderStoryboardPreview(null);
  
  window.showToast('分镜图片已删除');
}

/**
 * 加载分镜图预览
 */
function loadStoryboardPreview() {
  const state = window.getState();
  const currentScene = state.currentScene;
  
  if (currentScene && currentScene.storyboardImage) {
    renderStoryboardPreview(currentScene.storyboardImage);
  }
}
window.saveSceneProperties = saveSceneProperties;
window.setupOptionHintListeners = setupOptionHintListeners;
window.setupSceneOptionHintListeners = setupSceneOptionHintListeners;
window.setupAddOptionButtons = setupAddOptionButtons;
window.showQuickAddOptionModal = showQuickAddOptionModal;
