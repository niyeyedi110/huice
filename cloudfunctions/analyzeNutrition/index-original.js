// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 模拟的营养数据库（实际应用中可以接入真实的食物识别API）
const nutritionDatabase = {
  '米饭': {
    calories: 116,
    protein: 2.6,
    fat: 0.3,
    carbs: 25.9,
    fiber: 0.3,
    category: 'grain'
  },
  '鸡胸肉': {
    calories: 165,
    protein: 31,
    fat: 3.6,
    carbs: 0,
    fiber: 0,
    category: 'protein'
  },
  '西兰花': {
    calories: 34,
    protein: 2.8,
    fat: 0.4,
    carbs: 7,
    fiber: 2.6,
    category: 'vegetable'
  },
  '苹果': {
    calories: 52,
    protein: 0.3,
    fat: 0.2,
    carbs: 14,
    fiber: 2.4,
    category: 'fruit'
  },
  '鸡蛋': {
    calories: 155,
    protein: 13,
    fat: 11,
    carbs: 1.1,
    fiber: 0,
    category: 'protein'
  },
  '面包': {
    calories: 265,
    protein: 9,
    fat: 3.2,
    carbs: 49,
    fiber: 2.7,
    category: 'grain'
  },
  '牛奶': {
    calories: 42,
    protein: 3.4,
    fat: 1,
    carbs: 5,
    fiber: 0,
    category: 'dairy'
  },
  '沙拉': {
    calories: 20,
    protein: 1.5,
    fat: 0.2,
    carbs: 3.8,
    fiber: 2,
    category: 'vegetable'
  }
};

// 云函数入口函数
exports.main = async (event, context) => {
  const { fileID } = event;
  
  try {
    // 下载图片
    const res = await cloud.downloadFile({
      fileID: fileID,
    });
    const buffer = res.fileContent;
    
    // 这里模拟食物识别过程
    // 实际应用中，你可以：
    // 1. 使用腾讯云AI的图像识别API
    // 2. 使用百度AI的菜品识别API
    // 3. 使用其他第三方食物识别服务
    
    // 模拟识别结果（随机返回一些食物）
    const allFoods = Object.keys(nutritionDatabase);
    const detectedFoods = [];
    
    // 随机选择2-4种食物
    const foodCount = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < foodCount; i++) {
      const randomFood = allFoods[Math.floor(Math.random() * allFoods.length)];
      if (!detectedFoods.find(f => f.name === randomFood)) {
        const portion = Math.floor(Math.random() * 150) + 50; // 50-200g
        detectedFoods.push({
          name: randomFood,
          portion: portion,
          unit: 'g',
          confidence: Math.floor(Math.random() * 20) + 80 // 80-100%置信度
        });
      }
    }
    
    // 计算总营养成分
    let totalNutrition = {
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      fiber: 0
    };
    
    const foodDetails = detectedFoods.map(food => {
      const nutrition = nutritionDatabase[food.name];
      const multiplier = food.portion / 100; // 营养数据基于100g
      
      const foodNutrition = {
        name: food.name,
        portion: food.portion,
        unit: food.unit,
        confidence: food.confidence,
        calories: Math.round(nutrition.calories * multiplier),
        protein: Math.round(nutrition.protein * multiplier * 10) / 10,
        fat: Math.round(nutrition.fat * multiplier * 10) / 10,
        carbs: Math.round(nutrition.carbs * multiplier * 10) / 10,
        fiber: Math.round(nutrition.fiber * multiplier * 10) / 10,
        category: nutrition.category
      };
      
      // 累加到总计
      totalNutrition.calories += foodNutrition.calories;
      totalNutrition.protein += foodNutrition.protein;
      totalNutrition.fat += foodNutrition.fat;
      totalNutrition.carbs += foodNutrition.carbs;
      totalNutrition.fiber += foodNutrition.fiber;
      
      return foodNutrition;
    });
    
    // 四舍五入总营养数据
    totalNutrition = {
      calories: Math.round(totalNutrition.calories),
      protein: Math.round(totalNutrition.protein * 10) / 10,
      fat: Math.round(totalNutrition.fat * 10) / 10,
      carbs: Math.round(totalNutrition.carbs * 10) / 10,
      fiber: Math.round(totalNutrition.fiber * 10) / 10
    };
    
    // 生成健康建议
    const suggestions = generateHealthSuggestions(totalNutrition, foodDetails);
    
    return {
      success: true,
      data: {
        foods: foodDetails,
        totalNutrition: totalNutrition,
        suggestions: suggestions,
        analysisTime: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('营养分析失败：', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 生成健康建议
function generateHealthSuggestions(nutrition, foods) {
  const suggestions = [];
  
  // 基于卡路里的建议
  if (nutrition.calories > 800) {
    suggestions.push({
      type: 'warning',
      text: '这一餐的热量较高，建议适当控制份量'
    });
  } else if (nutrition.calories < 300) {
    suggestions.push({
      type: 'info',
      text: '这一餐的热量较低，如果是正餐可以适当增加'
    });
  }
  
  // 基于蛋白质的建议
  if (nutrition.protein < 10) {
    suggestions.push({
      type: 'info',
      text: '蛋白质含量较低，建议添加鸡蛋、豆类或肉类'
    });
  }
  
  // 基于纤维的建议
  if (nutrition.fiber < 3) {
    suggestions.push({
      type: 'info',
      text: '膳食纤维不足，建议增加蔬菜或水果'
    });
  }
  
  // 基于食物种类的建议
  const categories = foods.map(f => f.category);
  if (!categories.includes('vegetable')) {
    suggestions.push({
      type: 'warning',
      text: '缺少蔬菜，建议每餐都要有蔬菜'
    });
  }
  
  // 如果没有任何建议，给一个正面反馈
  if (suggestions.length === 0) {
    suggestions.push({
      type: 'success',
      text: '营养搭配合理，继续保持！'
    });
  }
  
  return suggestions;
}