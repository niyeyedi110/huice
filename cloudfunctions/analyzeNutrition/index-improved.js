// 云函数入口文件 - 集成真实AI识别
const cloud = require('wx-server-sdk');
const axios = require('axios');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 云函数入口函数
exports.main = async (event, context) => {
  const { fileID } = event;
  
  try {
    // 下载图片
    const res = await cloud.downloadFile({
      fileID: fileID,
    });
    const buffer = res.fileContent;
    
    // 将图片转换为base64
    const base64Image = buffer.toString('base64');
    
    // 选择以下任一方案实现AI识别：
    
    // 方案1: 使用腾讯云AI图像识别
    // const nutritionData = await analyzeFoodWithTencentAI(base64Image);
    
    // 方案2: 使用百度AI菜品识别
    // const nutritionData = await analyzeFoodWithBaiduAI(base64Image);
    
    // 方案3: 使用开源模型 (如 food-101)
    // const nutritionData = await analyzeFoodWithOpenModel(base64Image);
    
    // 方案4: 使用第三方API服务 (如 Nutritionix, Edamam)
    const nutritionData = await analyzeFoodWithNutritionixAPI(base64Image);
    
    return {
      success: true,
      data: nutritionData
    };
    
  } catch (error) {
    console.error('营养分析失败：', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 方案1: 腾讯云AI实现
async function analyzeFoodWithTencentAI(base64Image) {
  // 需要在腾讯云控制台开通图像识别服务
  // 获取 SecretId 和 SecretKey
  const tencentcloud = require("tencentcloud-sdk-nodejs");
  const TiiaClient = tencentcloud.tiia.v20190529.Client;
  
  const clientConfig = {
    credential: {
      secretId: process.env.TENCENT_SECRET_ID,
      secretKey: process.env.TENCENT_SECRET_KEY,
    },
    region: "ap-beijing",
    profile: {
      httpProfile: {
        endpoint: "tiia.tencentcloudapi.com",
      },
    },
  };
  
  const client = new TiiaClient(clientConfig);
  const params = {
    "ImageBase64": base64Image,
    "Type": 1  // 1表示菜品识别
  };
  
  const result = await client.DetectDisgust(params);
  
  // 解析腾讯云返回的结果并查询营养数据库
  return parseAndGetNutrition(result);
}

// 方案2: 百度AI实现
async function analyzeFoodWithBaiduAI(base64Image) {
  // 需要在百度AI开放平台注册应用
  const AipImageClassifyClient = require("baidu-aip-sdk").imageClassify;
  
  const client = new AipImageClassifyClient(
    process.env.BAIDU_APP_ID,
    process.env.BAIDU_API_KEY,
    process.env.BAIDU_SECRET_KEY
  );
  
  // 调用菜品识别
  const result = await client.dishDetect(base64Image);
  
  if (result.result && result.result.length > 0) {
    const foods = result.result.map(item => ({
      name: item.name,
      confidence: item.probability,
      calorie: item.calorie || 0
    }));
    
    // 获取详细营养信息
    return await getDetailedNutrition(foods);
  }
  
  throw new Error('未识别到食物');
}

// 方案4: Nutritionix API (推荐 - 专业的食物营养API)
async function analyzeFoodWithNutritionixAPI(base64Image) {
  // 首先使用通用图像识别API识别食物
  // 然后使用Nutritionix获取营养信息
  
  // Step 1: 使用 Clarifai 或其他图像识别API识别食物
  const foodItems = await identifyFoodWithClarifai(base64Image);
  
  // Step 2: 使用 Nutritionix 获取营养信息
  const nutritionPromises = foodItems.map(async (food) => {
    const response = await axios.post(
      'https://trackapi.nutritionix.com/v2/natural/nutrients',
      { query: food.name },
      {
        headers: {
          'x-app-id': process.env.NUTRITIONIX_APP_ID,
          'x-app-key': process.env.NUTRITIONIX_APP_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const nutrient = response.data.foods[0];
    return {
      name: nutrient.food_name,
      portion: nutrient.serving_qty,
      unit: nutrient.serving_unit,
      confidence: food.confidence * 100,
      calories: Math.round(nutrient.nf_calories),
      protein: Math.round(nutrient.nf_protein * 10) / 10,
      fat: Math.round(nutrient.nf_total_fat * 10) / 10,
      carbs: Math.round(nutrient.nf_total_carbohydrate * 10) / 10,
      fiber: Math.round(nutrient.nf_dietary_fiber * 10) / 10,
      category: categorizeFood(nutrient.food_name)
    };
  });
  
  const foodDetails = await Promise.all(nutritionPromises);
  
  // 计算总营养
  const totalNutrition = foodDetails.reduce((total, food) => ({
    calories: total.calories + food.calories,
    protein: total.protein + food.protein,
    fat: total.fat + food.fat,
    carbs: total.carbs + food.carbs,
    fiber: total.fiber + food.fiber
  }), { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 });
  
  // 生成健康建议
  const suggestions = generateHealthSuggestions(totalNutrition, foodDetails);
  
  return {
    foods: foodDetails,
    totalNutrition: totalNutrition,
    suggestions: suggestions,
    analysisTime: new Date().toISOString()
  };
}

// 使用Clarifai识别食物
async function identifyFoodWithClarifai(base64Image) {
  const { ClarifaiStub, grpc } = require("clarifai-nodejs-grpc");
  const stub = ClarifaiStub.grpc();
  
  const metadata = new grpc.Metadata();
  metadata.set("authorization", `Key ${process.env.CLARIFAI_API_KEY}`);
  
  return new Promise((resolve, reject) => {
    stub.PostModelOutputs(
      {
        model_id: "food-item-recognition",
        inputs: [{
          data: {
            image: {
              base64: base64Image
            }
          }
        }]
      },
      metadata,
      (err, response) => {
        if (err) {
          reject(err);
          return;
        }
        
        const concepts = response.outputs[0].data.concepts;
        const foods = concepts
          .filter(c => c.value > 0.7) // 只保留置信度大于70%的结果
          .map(c => ({
            name: c.name,
            confidence: c.value
          }));
        
        resolve(foods);
      }
    );
  });
}

// 食物分类函数
function categorizeFood(foodName) {
  const categories = {
    grain: ['rice', 'bread', 'pasta', 'noodle', 'cereal', 'wheat', 'oat'],
    protein: ['chicken', 'beef', 'pork', 'fish', 'egg', 'bean', 'tofu', 'meat'],
    vegetable: ['vegetable', 'salad', 'broccoli', 'carrot', 'tomato', 'lettuce'],
    fruit: ['apple', 'banana', 'orange', 'berry', 'fruit', 'grape'],
    dairy: ['milk', 'cheese', 'yogurt', 'dairy']
  };
  
  const lowerName = foodName.toLowerCase();
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerName.includes(keyword))) {
      return category;
    }
  }
  
  return 'other';
}

// 生成健康建议（复用原有函数）
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
  
  // 营养比例建议
  const totalMacros = nutrition.protein + nutrition.fat + nutrition.carbs;
  if (totalMacros > 0) {
    const proteinRatio = nutrition.protein / totalMacros;
    const fatRatio = nutrition.fat / totalMacros;
    const carbRatio = nutrition.carbs / totalMacros;
    
    if (carbRatio > 0.65) {
      suggestions.push({
        type: 'info',
        text: '碳水化合物比例较高，可以增加蛋白质摄入'
      });
    }
    
    if (fatRatio > 0.4) {
      suggestions.push({
        type: 'warning',
        text: '脂肪含量较高，注意选择健康脂肪来源'
      });
    }
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