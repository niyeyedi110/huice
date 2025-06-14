# 营养分析云函数升级指南

## 当前状态
目前使用模拟数据返回营养信息，不是真实的AI识别。

## 升级方案

### 方案1：腾讯云AI（推荐 - 与小程序生态集成好）
1. 在腾讯云控制台开通图像识别服务
2. 安装SDK：`npm install tencentcloud-sdk-nodejs`
3. 配置环境变量：
   ```
   TENCENT_SECRET_ID=你的SecretId
   TENCENT_SECRET_KEY=你的SecretKey
   ```

### 方案2：百度AI菜品识别（识别准确度高）
1. 注册百度AI开放平台账号
2. 创建应用获取API Key
3. 安装SDK：`npm install baidu-aip-sdk`
4. 配置环境变量：
   ```
   BAIDU_APP_ID=你的AppId
   BAIDU_API_KEY=你的ApiKey
   BAIDU_SECRET_KEY=你的SecretKey
   ```

### 方案3：Nutritionix + Clarifai（专业营养数据）
1. 注册 [Nutritionix](https://www.nutritionix.com/business/api) 获取营养数据API
2. 注册 [Clarifai](https://www.clarifai.com/) 获取图像识别API
3. 安装依赖：
   ```bash
   npm install axios clarifai-nodejs-grpc
   ```
4. 配置环境变量：
   ```
   NUTRITIONIX_APP_ID=你的AppId
   NUTRITIONIX_APP_KEY=你的AppKey
   CLARIFAI_API_KEY=你的ApiKey
   ```

### 方案4：微信AI能力（最简单）
使用微信小程序内置的AI能力：
```javascript
// 在小程序端直接调用
wx.getImageInfo({
  src: imagePath,
  success: (res) => {
    wx.serviceMarket.invokeService({
      service: 'wxee446d7507c68b11', // 微信官方图像识别服务
      api: 'foodAI',
      data: {
        img_url: res.path
      }
    }).then(aiRes => {
      // 处理识别结果
    })
  }
})
```

## 实施步骤

1. **选择方案**：根据需求和预算选择合适的方案
2. **获取API密钥**：注册并获取相应服务的API密钥
3. **更新云函数**：
   - 将 `index-improved.js` 重命名为 `index.js`
   - 更新 `package.json` 添加所需依赖
4. **配置环境变量**：在云开发控制台设置环境变量
5. **测试验证**：使用真实食物照片测试识别效果

## 注意事项

1. **API费用**：大部分AI服务都有免费额度，超出后需付费
2. **识别准确性**：建议结合多个API提高准确性
3. **响应时间**：AI识别可能需要1-3秒，注意用户体验
4. **隐私保护**：确保用户照片数据安全，及时清理临时文件

## 本地测试

```bash
# 在云函数目录下
cd cloudfunctions/analyzeNutrition
npm install
# 使用微信开发者工具的云函数本地调试功能
```