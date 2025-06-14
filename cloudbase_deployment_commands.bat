@echo off
echo ===================================
echo CloudBase 部署脚本 - 拍照饮食记小程序
echo 环境ID: okkworld1-3gwgdrgu482b27b4
echo ===================================

cd /d "F:\photo-diet-miniprogram - 副本"

echo.
echo 步骤 1: 登录 CloudBase
tcb login

echo.
echo 步骤 2: 部署云函数
echo 部署 quickUpload...
tcb functions:deploy quickUpload
timeout /t 2 > nul

echo 部署 addPhotoRecord...
tcb functions:deploy addPhotoRecord
timeout /t 2 > nul

echo 部署 getPhotoRecords...
tcb functions:deploy getPhotoRecords
timeout /t 2 > nul

echo 部署 getStatistics...
tcb functions:deploy getStatistics
timeout /t 2 > nul

echo 部署 analyzeNutrition...
tcb functions:deploy analyzeNutrition
timeout /t 2 > nul

echo.
echo 步骤 3: 创建数据库集合
tcb db:create users
tcb db:create photo_records

echo.
echo ===================================
echo 部署完成！
echo 请在微信开发者工具中上传小程序代码
echo ===================================
pause