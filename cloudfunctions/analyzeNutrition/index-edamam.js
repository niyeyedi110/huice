// 云函数入口文件 - 使用Edamam免费API
const cloud = require('wx-server-sdk');
const axios = require('axios');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// Edamam API配置
// 免费注册: https://developer.edamam.com/
const EDAMAM_APP_ID = process.env.EDAMAM_APP_ID || 'YOUR_APP_ID';
const EDAMAM_APP_KEY = process.env.EDAMAM_APP_KEY || 'YOUR_APP_KEY';

// 常见中文食物到英文的映射
const foodTranslations = {
  '米饭': 'rice',
  '白米饭': 'white rice',
  '面条': 'noodles',
  '面包': 'bread',
  '鸡蛋': 'egg',
  '鸡肉': 'chicken',
  '牛肉': 'beef',
  '猪肉': 'pork',
  '鱼': 'fish',
  '虾': 'shrimp',
  '豆腐': 'tofu',
  '青菜': 'vegetables',
  '西兰花': 'broccoli',
  '番茄': 'tomato',
  '黄瓜': 'cucumber',
  '苹果': 'apple',
  '香蕉': 'banana',
  '橙子': 'orange',
  '牛奶': 'milk',
  '酸奶': 'yogurt',
  '咖啡': 'coffee',
  '茶': 'tea',
  '水饺': 'dumplings',
  '包子': 'steamed bun',
  '馒头': 'steamed bread',
  '粥': 'porridge',
  '汤': 'soup',
  '沙拉': 'salad',
  '三明治': 'sandwich',
  '汉堡': 'hamburger',
  '披萨': 'pizza',
  '意面': 'pasta',
  '寿司': 'sushi'
};

// 基于图片文件名或用户输入推测食物
function inferFoodFromContext(event) {
  const possibleFoods = [];
  
  // 从标签中提取食物信息
  if (event.tags && Array.isArray(event.tags)) {
    event.tags.forEach(tag => {
      if (foodTranslations[tag]) {
        possibleFoods.push(foodTranslations[tag]);
      } else if (tag && tag.length > 1) {
        possibleFoods.push(tag);
      }
    });
  }
  
  // 从描述中提取食物信息
  if (event.description) {
    Object.keys(foodTranslations).forEach(cnFood => {
      if (event.description.includes(cnFood)) {
        possibleFoods.push(foodTranslations[cnFood]);
      }
    });
  }
  
  // 根据餐次推测可能的食物
  if (event.mealType) {
    switch(event.mealType) {
      case 'breakfast':
        if (possibleFoods.length === 0) {
          possibleFoods.push('bread', 'egg', 'milk');
        }
        break;
      case 'lunch':
      case 'dinner':
        if (possibleFoods.length === 0) {
          possibleFoods.push('rice', 'chicken', 'vegetables');
        }
        break;
      case 'snack':
        if (possibleFoods.length === 0) {
          possibleFoods.push('fruit', 'yogurt');
        }
        break;
    }
  }
  
  // 如果还是没有，使用默认值
  if (possibleFoods.length === 0) {
    possibleFoods.push('mixed meal');
  }
  
  return [...new Set(possibleFoods)]; // 去重
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { fileID } = event;
  
  try {
    // 推测可能的食物
    const inferredFoods = inferFoodFromContext(event);
    console.log('推测的食物:', inferredFoods);
    
    // 如果使用的是demo key，返回基于推测的模拟数据
    if (EDAMAM_APP_ID === 'YOUR_APP_ID') {
      return {
        success: true,
        data: generateMockNutrition(inferredFoods)
      };
    }
    
    // 调用Edamam API获取营养信息
    const nutritionPromises = inferredFoods.slice(0, 3).map(food => 
      getNutritionFromEdamam(food).catch(err => {
        console.error(`获取${food}营养信息失败:`, err);
        return null;
      })
    );
    
    const nutritionResults = await Promise.all(nutritionPromises);
    const validResults = nutritionResults.filter(r => r !== null);
    
    if (validResults.length === 0) {
      // 如果API调用失败，返回基于推测的模拟数据
      return {
        success: true,
        data: generateMockNutrition(inferredFoods)
      };
    }
    
    // 整合营养数据
    const foodDetails = validResults;
    
    // 计算总营养
    const totalNutrition = foodDetails.reduce((total, food) => ({
      calories: total.calories + food.calories,
      protein: total.protein + food.protein,
      fat: total.fat + food.fat,
      carbs: total.carbs + food.carbs,
      fiber: total.fiber + food.fiber
    }), { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 });
    
    // 四舍五入
    Object.keys(totalNutrition).forEach(key => {
      totalNutrition[key] = Math.round(totalNutrition[key] * 10) / 10;
    });
    
    // 生成健康建议
    const suggestions = generateHealthSuggestions(totalNutrition, foodDetails);
    
    return {
      success: true,
      data: {
        foods: foodDetails,
        totalNutrition: totalNutrition,
        suggestions: suggestions,
        analysisTime: new Date().toISOString(),
        dataSource: 'Edamam API'
      }
    };
    
  } catch (error) {
    console.error('营养分析失败：', error);
    
    // 发生错误时返回基础数据
    const inferredFoods = inferFoodFromContext(event);
    return {
      success: true,
      data: generateMockNutrition(inferredFoods)
    };
  }
};

// 从Edamam API获取营养信息
async function getNutritionFromEdamam(foodName) {
  try {
    const response = await axios.get('https://api.edamam.com/api/food-database/v2/parser', {
      params: {
        app_id: EDAMAM_APP_ID,
        app_key: EDAMAM_APP_KEY,
        ingr: foodName,
        'nutrition-type': 'cooking'
      },
      timeout: 5000
    });
    
    if (response.data.hints && response.data.hints.length > 0) {
      const food = response.data.hints[0].food;
      const nutrients = food.nutrients || {};
      
      // 估算份量（克）
      const portion = estimatePortion(foodName);
      const multiplier = portion / 100;
      
      return {
        name: translateFoodName(food.label || foodName),
        portion: portion,
        unit: 'g',
        confidence: 85,
        calories: Math.round((nutrients.ENERC_KCAL || 0) * multiplier),
        protein: Math.round((nutrients.PROCNT || 0) * multiplier * 10) / 10,
        fat: Math.round((nutrients.FAT || 0) * multiplier * 10) / 10,
        carbs: Math.round((nutrients.CHOCDF || 0) * multiplier * 10) / 10,
        fiber: Math.round((nutrients.FIBTG || 0) * multiplier * 10) / 10,
        category: food.category || 'other'
      };
    }
    
    throw new Error('未找到食物信息');
  } catch (error) {
    console.error('Edamam API调用失败:', error.message);
    throw error;
  }
}

// 估算食物份量
function estimatePortion(foodName) {
  const portionMap = {
    'rice': 150,
    'noodles': 200,
    'bread': 50,
    'egg': 50,
    'chicken': 100,
    'beef': 100,
    'pork': 100,
    'fish': 120,
    'vegetables': 150,
    'fruit': 150,
    'milk': 250,
    'yogurt': 150
  };
  
  const lowerName = foodName.toLowerCase();
  for (const [key, value] of Object.entries(portionMap)) {
    if (lowerName.includes(key)) {
      return value;
    }
  }
  
  return 100; // 默认100克
}

// 翻译食物名称
function translateFoodName(englishName) {
  // 反向查找中文名
  for (const [cn, en] of Object.entries(foodTranslations)) {
    if (en.toLowerCase() === englishName.toLowerCase()) {
      return cn;
    }
  }
  
  // 如果没找到，返回原名
  return englishName;
}

// 生成模拟营养数据（当API不可用时）
function generateMockNutrition(foodNames) {
  const mockDatabase = {
    'rice': { calories: 130, protein: 2.7, fat: 0.3, carbs: 28.2, fiber: 0.4 },
    'bread': { calories: 265, protein: 9, fat: 3.2, carbs: 49, fiber: 2.7 },
    'egg': { calories: 155, protein: 13, fat: 11, carbs: 1.1, fiber: 0 },
    'chicken': { calories: 165, protein: 31, fat: 3.6, carbs: 0, fiber: 0 },
    'vegetables': { calories: 25, protein: 2, fat: 0.2, carbs: 5, fiber: 2 },
    'fruit': { calories: 60, protein: 0.5, fat: 0.2, carbs: 15, fiber: 2 },
    'milk': { calories: 42, protein: 3.4, fat: 1, carbs: 5, fiber: 0 },
    'mixed meal': { calories: 350, protein: 15, fat: 10, carbs: 45, fiber: 3 }
  };
  
  const foodDetails = foodNames.map(name => {
    const nutrition = mockDatabase[name] || mockDatabase['mixed meal'];
    const portion = estimatePortion(name);
    const multiplier = portion / 100;
    
    return {
      name: translateFoodName(name),
      portion: portion,
      unit: 'g',
      confidence: 75,
      calories: Math.round(nutrition.calories * multiplier),
      protein: Math.round(nutrition.protein * multiplier * 10) / 10,
      fat: Math.round(nutrition.fat * multiplier * 10) / 10,
      carbs: Math.round(nutrition.carbs * multiplier * 10) / 10,
      fiber: Math.round(nutrition.fiber * multiplier * 10) / 10,
      category: categorizeFood(name)
    };
  });
  
  const totalNutrition = foodDetails.reduce((total, food) => ({
    calories: total.calories + food.calories,
    protein: total.protein + food.protein,
    fat: total.fat + food.fat,
    carbs: total.carbs + food.carbs,
    fiber: total.fiber + food.fiber
  }), { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 });
  
  return {
    foods: foodDetails,
    totalNutrition: totalNutrition,
    suggestions: generateHealthSuggestions(totalNutrition, foodDetails),
    analysisTime: new Date().toISOString(),
    dataSource: 'Estimated'
  };
}

// 食物分类
function categorizeFood(foodName) {
  const categories = {
    grain: ['rice', 'bread', 'pasta', 'noodle', 'cereal'],
    protein: ['chicken', 'beef', 'pork', 'fish', 'egg', 'tofu'],
    vegetable: ['vegetable', 'broccoli', 'tomato', 'cucumber'],
    fruit: ['apple', 'banana', 'orange', 'fruit'],
    dairy: ['milk', 'yogurt', 'cheese']
  };
  
  const lowerName = foodName.toLowerCase();
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerName.includes(keyword))) {
      return category;
    }
  }
  
  return 'other';
}

// 生成健康建议
function generateHealthSuggestions(nutrition, foods) {
  const suggestions = [];
  
  // 基于卡路里的建议
  if (nutrition.calories > 800) {
    suggestions.push({
      type: 'warning',
      text: '这一餐的热量较高，建议适当控制份量'
    });
  } else if (nutrition.calories < 300 && foods.length > 0) {
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