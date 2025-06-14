# 拍照饮食记小程序 CloudBase 部署指南

## 准备工作

1. 确保已安装 CloudBase CLI
   ```bash
   npm install -g @cloudbase/cli
   ```

2. 登录腾讯云 CloudBase
   ```bash
   tcb login
   ```

## 部署步骤

### 1. 修改配置文件

编辑 `cloudbaserc.json`，将 `"envId": "your-env-id"` 替换为你的实际环境 ID。

### 2. 初始化项目

在项目根目录（F:\photo-diet-miniprogram - 副本）运行：
```bash
tcb init
```

### 3. 部署云函数

部署所有云函数：
```bash
tcb functions:deploy
```

或者分别部署各个云函数：
```bash
tcb functions:deploy quickUpload
tcb functions:deploy addPhotoRecord
tcb functions:deploy getPhotoRecords
tcb functions:deploy getStatistics
tcb functions:deploy analyzeNutrition
```

### 4. 创建数据库集合

创建必要的数据库集合：
```bash
tcb db:create users
tcb db:create photo_records
```

### 5. 配置小程序

1. 在微信开发者工具中打开 `miniprogram` 目录
2. 修改 `miniprogram/app.js` 中的环境 ID：
   ```javascript
   wx.cloud.init({
     env: 'your-env-id', // 替换为你的环境 ID
     traceUser: true,
   })
   ```

### 6. 上传小程序代码

在微信开发者工具中：
1. 点击"上传"按钮
2. 填写版本号和项目备注
3. 提交审核

## 云函数说明

- **quickUpload**: 快速上传图片
- **addPhotoRecord**: 添加饮食记录
- **getPhotoRecords**: 获取历史记录
- **getStatistics**: 获取统计数据
- **analyzeNutrition**: 分析营养成分（AI 分析）

## 数据库集合

- **users**: 用户信息
- **photo_records**: 饮食记录

## 注意事项

1. 确保云函数的 Node.js 版本与本地开发环境一致（建议使用 Node.js 16.13）
2. 云函数部署后需要等待几秒钟才能生效
3. 首次部署可能需要配置云开发环境的权限

## 故障排查

如果部署失败，请检查：
1. 是否已正确登录 CloudBase
2. 环境 ID 是否正确
3. 云函数代码是否有语法错误
4. 网络连接是否正常

## 部署后测试

1. 在微信开发者工具中运行小程序
2. 测试各个功能是否正常：
   - 拍照上传
   - 查看历史记录
   - 统计分析
   - AI 营养分析