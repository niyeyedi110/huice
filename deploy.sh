#!/bin/bash

echo "开始部署拍照饮食记小程序..."

# 初始化项目（如果需要）
echo "1. 初始化 CloudBase 项目..."
tcb init

# 部署云函数
echo "2. 部署云函数..."
tcb functions:deploy

# 创建数据库集合
echo "3. 创建数据库集合..."
tcb db:create users
tcb db:create photo_records

# 部署完成
echo "部署完成！"
echo "请在微信开发者工具中："
echo "1. 修改 app.js 中的 env 为您的环境ID"
echo "2. 上传小程序代码"