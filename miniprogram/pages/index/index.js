// pages/index/index.js
const app = getApp();
const db = wx.cloud.database();

Page({
  data: {
    todayRecords: [],
    todayDate: '',
    weekday: '',
    todayPhotos: 0,
    mealTypes: {
      breakfast: '早餐',
      lunch: '午餐', 
      dinner: '晚餐',
      snack: '加餐'
    },
    mealIcons: {
      breakfast: '☀️',
      lunch: '🌞',
      dinner: '🌙',
      snack: '🍿'
    },
    satisfactionEmojis: ['😞', '😐', '🙂', '😊', '🤩'],
    satisfactionTexts: ['很不满意', '不太满意', '一般', '满意', '非常满意'],
    loading: false,
    showEmpty: false
  },

  onLoad: function (options) {
    this.setTodayDate();
    this.getTodayRecords();
  },

  onShow: function () {
    // 每次显示页面时刷新数据
    this.getTodayRecords();
  },

  // 设置今日日期
  setTodayDate: function() {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[date.getDay()];
    
    this.setData({
      todayDate: `${year}年${month}月${day}日`,
      weekday: weekday
    });
  },

  // 获取今日记录
  getTodayRecords: function() {
    this.setData({ loading: true });
    
    // 游客模式下使用模拟数据
    if (app.globalData.isTouristMode) {
      setTimeout(() => {
        this.setData({
          todayRecords: this.getMockRecords(),
          todayPhotos: 3,
          showEmpty: false,
          loading: false
        });
      }, 500);
      return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    wx.cloud.callFunction({
      name: 'getPhotoRecords',
      data: {
        startDate: today.toISOString(),
        endDate: tomorrow.toISOString()
      },
      success: res => {
        const records = res.result.data || [];
        // 计算今日照片总数
        let photoCount = 0;
        records.forEach(record => {
          photoCount += (record.photos || []).length;
        });
        
        this.setData({
          todayRecords: records,
          todayPhotos: photoCount,
          showEmpty: records.length === 0,
          loading: false
        });
      },
      fail: err => {
        console.error('获取记录失败', err);
        wx.showToast({
          title: '获取记录失败',
          icon: 'none'
        });
        this.setData({ loading: false });
      }
    });
  },

  // 跳转到拍照记录页面
  goToCamera: function() {
    wx.navigateTo({
      url: '/pages/record/record'
    });
  },

  // 快速拍照（直接调用相机）
  quickCamera: function() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        wx.navigateTo({
          url: `/pages/record/record?photo=${encodeURIComponent(tempFilePath)}`
        });
      }
    });
  },
  
  // 快速备注
  quickNote: function() {
    wx.navigateTo({
      url: '/pages/record/record?quickNote=true'
    });
  },

  // 查看记录详情
  viewRecord: function(e) {
    const record = e.currentTarget.dataset.record;
    wx.previewImage({
      current: record.photos[0],
      urls: record.photos
    });
  },

  // 显示操作菜单
  showActions: function(e) {
    const recordId = e.currentTarget.dataset.id;
    wx.showActionSheet({
      itemList: ['删除记录'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.deleteRecord(recordId);
        }
      }
    });
  },
  
  // 删除记录
  deleteRecord: function(recordId) {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          this.doDeleteRecord(recordId);
        }
      }
    });
  },

  doDeleteRecord: function(recordId) {
    wx.showLoading({ title: '删除中...' });
    
    wx.cloud.callFunction({
      name: 'deletePhoto',
      data: { recordId },
      success: res => {
        wx.hideLoading();
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        });
        this.getTodayRecords();
      },
      fail: err => {
        wx.hideLoading();
        wx.showToast({
          title: '删除失败',
          icon: 'none'
        });
      }
    });
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    this.getTodayRecords();
    wx.stopPullDownRefresh();
  },
  
  // 游客模式模拟数据
  getMockRecords: function() {
    return [
      {
        _id: 'mock1',
        mealType: 'breakfast',
        photos: ['https://picsum.photos/200/200?random=1'],
        tags: ['健康', '自制'],
        satisfaction: 5,
        description: '营养丰富的早餐',
        location: '家',
        createTime: '08:30',
        nutrition: {
          totalNutrition: {
            calories: 350,
            protein: 15.5,
            carbs: 45.2
          }
        }
      },
      {
        _id: 'mock2', 
        mealType: 'lunch',
        photos: ['https://picsum.photos/200/200?random=2', 'https://picsum.photos/200/200?random=3'],
        tags: ['美味'],
        satisfaction: 4,
        createTime: '12:45',
        nutrition: {
          totalNutrition: {
            calories: 680,
            protein: 28.3,
            carbs: 72.5
          }
        }
      }
    ];
  }
});