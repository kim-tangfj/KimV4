# 修复 renderer.js - 添加 ID 生成逻辑

$file = 'e:\AI\KimV4\src\renderer.js'
$content = Get-Content $file -Raw -Encoding UTF8

# 1. 修复手动创建项目 - 添加 ID 生成
$manualPattern = '(\s+const projectData = \{\s+project: \{\s+id: `proj_\$\{Date\.now\(\)\}`)'
$manualReplacement = @'
  const projectId = `proj_${Date.now()}`;
  const timestamp = Date.now();
  
  // 确保所有片段和镜头都有 ID
  const shotsWithIds = (jsonData.shots || []).map((shot, idx) => ({
    ...shot,
    id: shot.id || `shot_${timestamp}_${idx}`,
    scenes: (shot.scenes || []).map((scene, sceneIdx) => ({
      ...scene,
      id: scene.id || `scene_${timestamp}_${sceneIdx}`
    }))
  }));

  const projectData = {
    project: {
      id: projectId,
'@

$content = $content -replace $manualPattern, $manualReplacement

# 替换 shots 字段
$content = $content -replace 'shots: jsonData\.shots \|\| \[\]', 'shots: shotsWithIds'

# 替换 selected.projectId
$content = $content -replace 'projectId: `proj_\$\{Date\.now\(\)\}`', 'projectId'

Write-Host "修复完成，保存文件..."
$content | Set-Content $file -Encoding UTF8 -NoNewline
Write-Host "完成！"
