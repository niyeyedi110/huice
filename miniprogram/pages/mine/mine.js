// pages/mine/mine.js
const app = getApp();

Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    canIUseGetUserProfile: false,
    
    // 用户设置
    settings: {
      dailyGoal: 3,
      reminderEnabled: false,
      reminderTimes: ['08:00', '12:00', '18:00'],
      privacyMode: false
    },
    
    // 数据统计
    totalRecords: 0,
    totalPhotos: 0,
    joinDays: 0,
    
    // 显示设置弹窗
    showSettingModal: false,
    currentSetting: ''
  },

  onLoad: function () {
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      });
    }
    
    this.loadUserData();
    this.loadSettings();
  },

  onShow: function() {
    this.loadUserData();
  },

  // 获取用户信息
  getUserProfile: function(e) {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        });
        
        // 保存用户信息到云端
        this.saveUserInfo(res.userInfo);
      }
    });
  },

  // 保存用户信息
  saveUserInfo: function(userInfo) {
    wx.cloud.callFunction({
      name: 'updateUserInfo',
      data: { userInfo },
      success: res => {
        wx.showToast({
          title: '信息已更新',
          icon: 'success'
        });
      }
    });
  },

  // 加载用户数据
  loadUserData: function() {
    wx.cloud.callFunction({
      name: 'getUserData',
      success: res => {
        const data = res.result || {};
        this.setData({
          totalRecords: data.totalRecords || 0,
          totalPhotos: data.totalPhotos || 0,
          joinDays: data.joinDays || 0
        });
      }
    });
  },

  // 加载设置
  loadSettings: function() {
    const settings = wx.getStorageSync('userSettings');
    if (settings) {
      this.setData({ settings });
    }
  },

  // 显示设置弹窗
  showSetting: function(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      showSettingModal: true,
      currentSetting: type
    });
  },

  // 关闭设置弹窗
  closeSetting: function() {
    this.setData({
      showSettingModal: false,
      currentSetting: ''
    });
  },

  // 更新每日目标
  updateDailyGoal: function(e) {
    const value = parseInt(e.detail.value);
    const settings = this.data.settings;
    settings.dailyGoal = value;
    
    this.setData({ settings });
    this.saveSettings();
  },

  // 切换提醒开关
  toggleReminder: function(e) {
    const settings = this.data.settings;
    settings.reminderEnabled = e.detail.value;
    
    this.setData({ settings });
    this.saveSettings();
    
    if (settings.reminderEnabled) {
      this.requestSubscribeMessage();
    }
  },

  // 请求订阅消息权限
  requestSubscribeMessage: function() {
    wx.requestSubscribeMessage({
      tmplIds: ['your-template-id'], // 需要在小程序后台配置
      success: (res) => {
        console.log('订阅成功', res);
      },
      fail: (err) => {
        console.error('订阅失败', err);
      }
    });
  },

  // 保存设置
  saveSettings: function() {
    wx.setStorageSync('userSettings', this.data.settings);
    wx.showToast({
      title: '设置已保存',
      icon: 'success'
    });
  },

  // 导出数据
  exportData: function() {
    wx.showLoading({ title: '准备导出...' });
    
    wx.cloud.callFunction({
      name: 'exportData',
      success: res => {
        wx.hideLoading();
        
        if (res.result && res.result.fileUrl) {
          // 下载文件
          wx.downloadFile({
            url: res.result.fileUrl,
            success: (downloadRes) => {
              // 保存到相册或分享
              wx.saveFile({
                tempFilePath: downloadRes.tempFilePath,
                success: (saveRes) => {
                  wx.showModal({
                    title: '导出成功',
                    content: '数据已导出，是否分享？',
                    success: (modalRes) => {
                      if (modalRes.confirm) {
                        wx.shareFileMessage({
                          filePath: saveRes.savedFilePath
                        });
                      }
                    }
                  });
                }
              });
            }
          });
        }
      },
      fail: err => {
        wx.hideLoading();
        wx.showToast({
          title: '导出失败',
          icon: 'none'
        });
      }
    });
  },

  // 清理缓存
  clearCache: function() {
    wx.showModal({
      title: '清理缓存',
      content: '确定要清理本地缓存吗？云端数据不会受影响。',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          wx.showToast({
            title: '缓存已清理',
            icon: 'success'
          });
        }
      }
    });
  },

  // 关于我们
  showAbout: function() {
    wx.showModal({
      title: '关于拍照饮食记',
      content: '版本：1.0.0\n\n这是一个帮助您记录饮食习惯的小程序，通过拍照的方式简单记录每一餐。\n\n如有问题或建议，欢迎反馈。',
      showCancel: false
    });
  },

  // 意见反馈
  feedback: function() {
    // 可以跳转到反馈页面或客服会话
    wx.navigateTo({
      url: '/pages/feedback/feedback'
    });
  }
});