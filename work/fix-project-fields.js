/**
 * 自动修复项目字段脚本
 * 用途：读取现有 project.json 文件，添加缺失的新字段
 * 
 * 使用方法：
 * 1. 打开 PowerShell
 * 2. 导航到项目目录：cd e:\AI\KimV4
 * 3. 运行脚本：node work/fix-project-fields.js
 */

const fs = require('fs');
const path = require('path');

// 项目根目录
const WORK_DIR = path.join(__dirname);
const PROJECTS_DIR = path.join(WORK_DIR, 'projects'); // 假设项目在 projects 目录

// 新增字段定义
const NEW_SHOT_FIELDS = {
  characters: '',
  sceneSetting: '',
  musicStyle: '',
  soundEffect: '',
  imageRef: '',
  videoRef: '',
  audioRef: '',
  customPrompt: ''
};

const NEW_SCENE_FIELDS = {
  image: ''
};

/**
 * 修复单个项目文件
 */
function fixProjectFile(filePath) {
  console.log(`\n正在处理：${filePath}`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const project = JSON.parse(content);
    
    let modified = false;
    
    // 修复片段字段
    if (project.shots && Array.isArray(project.shots)) {
      project.shots.forEach((shot, shotIndex) => {
        let shotModified = false;
        
        // 添加缺失的片段字段
        Object.entries(NEW_SHOT_FIELDS).forEach(([field, defaultValue]) => {
          if (!(field in shot)) {
            shot[field] = defaultValue;
            console.log(`  - 片段 [${shotIndex}] 添加字段：${field}`);
            shotModified = true;
          }
        });
        
        // 修复镜头字段
        if (shot.scenes && Array.isArray(shot.scenes)) {
          shot.scenes.forEach((scene, sceneIndex) => {
            let sceneModified = false;
            
            Object.entries(NEW_SCENE_FIELDS).forEach(([field, defaultValue]) => {
              if (!(field in scene)) {
                scene[field] = defaultValue;
                console.log(`    - 镜头 [${sceneIndex}] 添加字段：${field}`);
                sceneModified = true;
              }
            });
            
            if (sceneModified) modified = true;
          });
        }
        
        if (shotModified) modified = true;
      });
    }
    
    // 保存修改后的文件
    if (modified) {
      const backupPath = filePath + '.backup';
      fs.copyFileSync(filePath, backupPath);
      console.log(`  ✓ 已创建备份：${backupPath}`);
      
      fs.writeFileSync(filePath, JSON.stringify(project, null, 2), 'utf8');
      console.log(`  ✓ 修复完成`);
      return true;
    } else {
      console.log(`  ✓ 无需修改（所有字段已存在）`);
      return false;
    }
    
  } catch (error) {
    console.error(`  ✗ 处理失败：${error.message}`);
    return false;
  }
}

/**
 * 查找所有项目文件
 */
function findProjectFiles() {
  const projectFiles = [];
  
  // 方法 1: 从 projects 目录查找
  if (fs.existsSync(PROJECTS_DIR)) {
    const dirs = fs.readdirSync(PROJECTS_DIR);
    dirs.forEach(dir => {
      const projectFile = path.join(PROJECTS_DIR, dir, 'project.json');
      if (fs.existsSync(projectFile)) {
        projectFiles.push(projectFile);
      }
    });
  }
  
  // 方法 2: 从 work 目录查找（兼容旧结构）
  const workDir = path.join(WORK_DIR, 'work');
  if (fs.existsSync(workDir)) {
    const dirs = fs.readdirSync(workDir);
    dirs.forEach(dir => {
      // 跳过非项目目录
      if (dir === 'projects' || !fs.statSync(path.join(workDir, dir)).isDirectory()) {
        return;
      }
      
      const projectFile = path.join(workDir, dir, 'project.json');
      if (fs.existsSync(projectFile)) {
        if (!projectFiles.includes(projectFile)) {
          projectFiles.push(projectFile);
        }
      }
    });
  }
  
  return projectFiles;
}

/**
 * 主函数
 */
function main() {
  console.log('='.repeat(60));
  console.log('项目字段自动修复工具');
  console.log('='.repeat(60));
  
  const projectFiles = findProjectFiles();
  
  if (projectFiles.length === 0) {
    console.log('\n未找到项目文件');
    console.log('请确认项目位置：');
    console.log('  - e:\\AI\\KimV4\\projects\\<项目名>\\project.json');
    console.log('  - e:\\AI\\KimV4\\work\\<项目名>\\project.json');
    return;
  }
  
  console.log(`\n找到 ${projectFiles.length} 个项目文件:\n`);
  projectFiles.forEach(f => console.log(`  - ${f}`));
  
  console.log('\n' + '-'.repeat(60));
  console.log('开始修复...\n');
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  projectFiles.forEach(file => {
    const result = fixProjectFile(file);
    if (result === true) successCount++;
    else if (result === false) skipCount++;
    else errorCount++;
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('修复完成');
  console.log('='.repeat(60));
  console.log(`成功：${successCount} 个`);
  console.log(`跳过：${skipCount} 个`);
  console.log(`失败：${errorCount} 个`);
  console.log('\n备份文件位置：原文件.backup');
  console.log('如有问题，可删除 .backup 文件恢复原文件');
}

// 运行
main();
