# 拍照饮食记小程序

一个基于微信小程序云开发的饮食记录应用，通过拍照的方式简单记录每一餐。

## 功能特性

### 核心功能
- 📸 **拍照记录**：支持拍照和相册选择，快速记录饮食
- 🏷️ **标签分类**：预设多种标签，方便分类管理
- 📊 **数据统计**：自动统计饮食习惯，生成可视化报告
- 📅 **历史查看**：日历视图和照片墙两种浏览方式
- ☁️ **云端同步**：数据自动备份到云端，永不丢失

### 特色功能
- 智能判断餐次（早/午/晚/加餐）
- 满意度评分系统
- 热量等级标记
- 地点记录功能
- 连续打卡统计
- 数据导出功能

## 技术架构

- **前端**：微信小程序原生开发
- **后端**：腾讯云开发（CloudBase）
- **数据库**：云数据库
- **存储**：云存储（照片）
- **云函数**：Node.js

## 项目结构

```
photo-diet-miniprogram/
├── miniprogram/              # 小程序端代码
│   ├── pages/               # 页面文件
│   │   ├── index/          # 首页（今日记录）
│   │   ├── record/         # 拍照记录页
│   │   ├── history/        # 历史记录页
│   │   ├── stats/          # 统计分析页
│   │   └── mine/           # 个人中心页
│   ├── utils/              # 工具函数
│   └── images/             # 图片资源
├── cloudfunctions/          # 云函数
│   ├── quickUpload/        # 快速上传
│   ├── addPhotoRecord/     # 添加记录
│   ├── getPhotoRecords/    # 获取记录
│   └── getStatistics/      # 获取统计
└── project.config.json      # 项目配置
```

## 部署指南

### 1. 环境准备
- 安装微信开发者工具
- 注册微信小程序账号
- 开通云开发功能

### 2. 项目配置
1. 在 `project.config.json` 中填写你的 AppID
2. 在 `app.js` 中配置云开发环境ID

### 3. 云开发配置
1. 在微信开发者工具中创建云开发环境
2. 部署云函数：
   ```bash
   # 右键点击 cloudfunctions 文件夹
   # 选择"上传并部署：云端安装依赖"
   ```
3. 创建数据库集合：
   - `users` - 用户信息
   - `photo_records` - 饮食记录

### 4. 使用 CloudBase CLI 部署

```bash
# 安装 CloudBase CLI
npm install -g @cloudbase/cli

# 登录
tcb login

# 初始化项目
tcb init

# 部署
tcb deploy
```

## 数据库设计

### users 集合
```javascript
{
  "_id": "用户ID",
  "_openid": "微信openid",
  "totalRecords": 100,      // 总记录数
  "totalPhotos": 300,       // 总照片数
  "joinDate": Date,         // 加入日期
  "lastRecordDate": Date    // 最后记录日期
}
```

### photo_records 集合
```javascript
{
  "_id": "记录ID",
  "userId": "用户openid",
  "mealType": "lunch",      // 餐次类型
  "photos": ["url1", "url2"], // 照片URL数组
  "tags": ["健康", "自制"],   // 标签
  "satisfaction": 5,         // 满意度(1-5)
  "description": "备注",     // 描述
  "location": "地点",        // 位置
  "calorieLevel": "medium",  // 热量等级
  "date": "2024-01-15",     // 日期
  "createTime": "时间戳",    // 创建时间
  "_createTime": Date       // 服务器时间
}
```

## 开发说明

### 本地开发
1. 克隆项目到本地
2. 使用微信开发者工具打开项目
3. 配置云开发环境
4. 编译运行

### 注意事项
- 首次使用需要在云控制台创建数据库集合
- 云函数修改后需要重新部署
- 图片上传会自动压缩以节省存储空间
- 建议定期备份云端数据

## 更新日志

### v1.0.0 (2024-01-15)
- 初始版本发布
- 实现基础拍照记录功能
- 支持标签和满意度评分
- 添加统计分析功能

## 待开发功能
- [ ] AI食物识别
- [ ] 营养成分分析
- [ ] 社交分享功能
- [ ] 多语言支持
- [ ] 深色模式

## 贡献指南
欢迎提交 Issue 和 Pull Request

## 许可证
MIT License