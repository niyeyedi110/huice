// app.js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      wx.showModal({
        title: '提示',
        content: '当前微信版本过低，无法使用云开发功能，请升级到最新微信版本后重试。',
        showCancel: false
      });
    } else {
      // 检查是否为游客模式
      const accountInfo = wx.getAccountInfoSync();
      if (accountInfo.miniProgram.appId === 'touristappid') {
        console.warn('当前为游客模式，云开发功能受限');
        // 游客模式下跳过云开发初始化
        this.globalData.isTouristMode = true;
      } else {
        wx.cloud.init({
          env: 'your-env-id',
          traceUser: true,
        });
      }
    }

    // globalData已在下面定义，这里不需要重新赋值

    // 获取用户 openid
    this.getOpenid();
    
    // 获取系统信息
    this.getSystemInfo();
  },

  getOpenid: function() {
    // 游客模式下跳过获取openid
    if (this.globalData.isTouristMode) {
      console.log('游客模式，跳过获取openid');
      this.globalData.openid = 'tourist-' + Date.now();
      return;
    }
    
    wx.cloud.callFunction({
      name: 'quickUpload',
      data: {
        action: 'getOpenid'
      },
      success: res => {
        this.globalData.openid = res.result.openid;
      },
      fail: err => {
        console.error('[云函数] [quickUpload] 调用失败', err);
      }
    });
  },

  getSystemInfo: function() {
    // 使用新的API替代deprecated的getSystemInfoSync
    const windowInfo = wx.getWindowInfo();
    const systemSetting = wx.getSystemSetting();
    
    this.globalData.systemInfo = {
      ...windowInfo,
      ...systemSetting
    };
    
    // 计算自定义导航栏高度
    const menuButton = wx.getMenuButtonBoundingClientRect();
    this.globalData.navBarHeight = (menuButton.top - windowInfo.statusBarHeight) * 2 + menuButton.height + windowInfo.statusBarHeight;
    this.globalData.statusBarHeight = windowInfo.statusBarHeight;
  },

  globalData: {
    userInfo: null,
    openid: null,
    todayRecords: [],
    systemInfo: null,
    navBarHeight: 0,
    statusBarHeight: 0,
    isTouristMode: false
  }
});