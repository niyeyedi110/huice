#!/usr/bin/env python3
"""
CloudBase 部署脚本
自动部署拍照饮食记小程序到腾讯云 CloudBase
"""

import os
import subprocess
import json
import time

class CloudBaseDeployer:
    def __init__(self):
        self.project_path = "/mnt/f/photo-diet-miniprogram - 副本"
        self.env_id = "okkworld1-3gwgdrgu482b27b4"
        
    def run_command(self, command, cwd=None):
        """执行命令并返回结果"""
        try:
            result = subprocess.run(
                command, 
                shell=True, 
                capture_output=True, 
                text=True,
                cwd=cwd or self.project_path
            )
            
            if result.returncode == 0:
                print(f"✅ {command}")
                if result.stdout:
                    print(result.stdout)
            else:
                print(f"❌ {command}")
                if result.stderr:
                    print(f"错误: {result.stderr}")
                    
            return result.returncode == 0
            
        except Exception as e:
            print(f"❌ 执行命令失败: {e}")
            return False
    
    def check_login(self):
        """检查是否已登录"""
        print("\n🔍 检查 CloudBase 登录状态...")
        return self.run_command("tcb env:list")
    
    def deploy_functions(self):
        """部署云函数"""
        print("\n📦 开始部署云函数...")
        
        functions = [
            "quickUpload",
            "addPhotoRecord", 
            "getPhotoRecords",
            "getStatistics",
            "analyzeNutrition"
        ]
        
        success_count = 0
        for func in functions:
            print(f"\n部署云函数: {func}")
            if self.run_command(f"tcb functions:deploy {func}"):
                success_count += 1
                time.sleep(2)  # 避免请求过快
                
        print(f"\n✅ 成功部署 {success_count}/{len(functions)} 个云函数")
        return success_count > 0
    
    def create_database(self):
        """创建数据库集合"""
        print("\n🗄️ 创建数据库集合...")
        
        collections = ["users", "photo_records"]
        
        for collection in collections:
            print(f"\n创建集合: {collection}")
            self.run_command(f"tcb db:create {collection}")
            
        return True
    
    def update_miniprogram_config(self):
        """更新小程序配置"""
        print("\n⚙️ 更新小程序配置...")
        
        app_js_path = os.path.join(self.project_path, "miniprogram", "app.js")
        
        try:
            with open(app_js_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # 替换环境ID
            updated_content = content.replace(
                "env: 'your-env-id'",
                f"env: '{self.env_id}'"
            )
            
            with open(app_js_path, 'w', encoding='utf-8') as f:
                f.write(updated_content)
                
            print(f"✅ 已更新环境ID为: {self.env_id}")
            return True
            
        except Exception as e:
            print(f"❌ 更新配置失败: {e}")
            return False
    
    def deploy(self):
        """执行完整部署流程"""
        print("🚀 开始部署拍照饮食记小程序到 CloudBase")
        print(f"📍 项目路径: {self.project_path}")
        print(f"🌍 环境ID: {self.env_id}")
        print("=" * 60)
        
        # 1. 检查登录状态
        if not self.check_login():
            print("\n⚠️ 请先登录 CloudBase:")
            print("tcb login")
            return False
            
        # 2. 部署云函数
        if not self.deploy_functions():
            print("\n⚠️ 云函数部署失败")
            return False
            
        # 3. 创建数据库
        self.create_database()
        
        # 4. 更新小程序配置
        self.update_miniprogram_config()
        
        print("\n" + "=" * 60)
        print("✅ 部署完成！")
        print("\n后续步骤:")
        print("1. 在微信开发者工具中打开 miniprogram 目录")
        print("2. 编译并上传小程序代码")
        print("3. 在小程序管理后台提交审核")
        
        return True

if __name__ == "__main__":
    deployer = CloudBaseDeployer()
    
    # 如果需要手动执行，可以在命令行运行
    print("\n提示: 如果自动部署失败，可以手动执行以下命令:")
    print(f"cd '{deployer.project_path}'")
    print("tcb login")
    print("tcb functions:deploy")
    print("tcb db:create users")
    print("tcb db:create photo_records")