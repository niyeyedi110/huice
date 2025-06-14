# 营养分析API配置指南

## 快速开始

### 方案1：使用Edamam免费API（推荐）

1. **注册Edamam账号**
   - 访问 https://developer.edamam.com/
   - 点击 "Sign Up" 注册账号
   - 选择 "Developer" 计划（免费）

2. **创建应用获取API密钥**
   - 登录后进入 Dashboard
   - 点击 "Create a new application"
   - 选择 "Food Database API"
   - 获取 Application ID 和 Application Key

3. **配置云函数环境变量**
   - 在微信开发者工具中，右键点击 `analyzeNutrition` 云函数
   - 选择"上传并部署：云端安装依赖"
   - 在云开发控制台中设置环境变量：
     ```
     EDAMAM_APP_ID=你的Application ID
     EDAMAM_APP_KEY=你的Application Key
     ```

4. **更新云函数代码**
   ```bash
   # 将 index-edamam.js 重命名为 index.js
   mv index-edamam.js index.js
   ```

5. **重新部署云函数**

### 方案2：使用模拟数据（开发测试用）

如果暂时不想注册API，可以直接使用现有的 `index.js`，它会返回模拟的营养数据。

## API限制

- Edamam免费版：10,000次请求/月
- 适合个人项目和小规模应用
- 如需更多请求，可升级到付费计划

## 测试方法

1. 在小程序中拍照或选择照片
2. 添加标签（如"米饭"、"鸡肉"等）
3. 提交后查看营养分析结果

## 常见问题

### Q: 为什么识别不准确？
A: 当前版本基于标签和描述推测食物，不是真正的图像识别。如需图像识别，参考 `index-improved.js` 中的其他方案。

### Q: 如何提高识别准确度？
A: 
- 在记录时添加准确的食物标签
- 在描述中写明具体食物名称
- 使用中文或英文标签都可以

### Q: API调用失败怎么办？
A: 系统会自动降级到模拟数据，确保功能可用。检查：
- API密钥是否正确
- 网络连接是否正常
- API额度是否用完

## 进阶优化

1. **添加图像识别**
   - 集成腾讯云AI或百度AI
   - 参考 `index-improved.js` 实现

2. **缓存优化**
   - 对常见食物建立本地缓存
   - 减少API调用次数

3. **用户体验优化**
   - 添加食物搜索功能
   - 支持自定义食物份量