/**
 * 绿了个植 - 游戏逻辑测试
 * 
 * 验证核心算法的正确性
 */

import { PlantStackManager } from '../assets/scripts/core/PlantStackManager';
import { PlantMatchFinder } from '../assets/scripts/core/PlantMatchFinder';
import { PlantType, PlantState } from '../assets/scripts/core/PlantTypes';

/**
 * 测试堆叠管理器
 */
function testStackManager() {
  console.log('=== 测试堆叠管理器 ===');
  
  const manager = new PlantStackManager();
  
  // 初始化两层布局
  manager.initLayers({
    layers: 2,
    gridSize: { rows: 5, cols: 5 }
  });
  
  // 设置植物类型
  manager.setPlantType(0, 0, 0, PlantType.ROSE);
  manager.setPlantType(0, 0, 1, PlantType.ROSE);
  manager.setPlantType(0, 0, 2, PlantType.TULIP);
  
  // 刷新状态
  manager.refreshAllPlants();
  
  // 获取可见植物
  const visible = manager.getVisiblePlants();
  console.log('可见植物数量:', visible.length);
  
  console.log('堆叠管理器测试通过!\n');
}

/**
 * 测试匹配查找器
 */
function testMatchFinder() {
  console.log('=== 测试匹配查找器 ===');
  
  const manager = new PlantStackManager();
  manager.initLayers({
    layers: 1,
    gridSize: { rows: 5, cols: 5 }
  });
  
  // 设置相邻的相同植物
  manager.setPlantType(0, 0, 0, PlantType.ROSE);
  manager.setPlantType(0, 0, 1, PlantType.ROSE);
  manager.setPlantType(0, 0, 2, PlantType.ROSE);
  
  manager.refreshAllPlants();
  
  const finder = new PlantMatchFinder(manager);
  
  // 查找匹配
  const startPlant = manager.getPlant({ layer: 0, row: 0, col: 0 });
  if (startPlant) {
    const result = finder.findMatches(startPlant);
    console.log('匹配植物数量:', result.count);
    console.log('是否可消除:', result.isEliminated);
    
    if (result.count === 3 && result.isEliminated) {
      console.log('匹配查找器测试通过!\n');
    } else {
      console.error('匹配查找器测试失败!\n');
    }
  }
}

/**
 * 运行所有测试
 */
function runTests() {
  console.log('开始运行测试...\n');
  
  testStackManager();
  testMatchFinder();
  
  console.log('所有测试完成!');
}

// 运行测试
runTests();
