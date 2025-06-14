// pages/history/history.js
const app = getApp();

Page({
  data: {
    currentDate: '',
    selectedDate: '',
    records: [],
    monthRecords: {}, // 存储每个日期是否有记录
    loading: false,
    viewMode: 'calendar', // calendar or gallery
    galleryPhotos: [],
    hasMore: true,
    page: 1,
    pageSize: 20
  },

  onLoad: function (options) {
    this.initCalendar();
    this.loadMonthRecords();
  },

  // 初始化日历
  initCalendar: function() {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    this.setData({
      currentDate: `${year}-${month}`,
      selectedDate: `${year}-${month}-${date.getDate().toString().padStart(2, '0')}`
    });
  },

  // 加载当月记录概览
  loadMonthRecords: function() {
    const [year, month] = this.data.currentDate.split('-');
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    wx.cloud.callFunction({
      name: 'getPhotoRecords',
      data: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        summary: true // 只获取日期列表
      },
      success: res => {
        const monthRecords = {};
        (res.result.data || []).forEach(record => {
          const date = record.date.split(' ')[0];
          monthRecords[date] = true;
        });
        this.setData({ monthRecords });
      }
    });
  },

  // 日期改变
  onDateChange: function(e) {
    this.setData({
      selectedDate: e.detail.value
    });
    this.loadDayRecords();
  },

  // 月份改变
  onMonthChange: function(e) {
    this.setData({
      currentDate: e.detail.value
    });
    this.loadMonthRecords();
  },

  // 加载指定日期的记录
  loadDayRecords: function() {
    this.setData({ loading: true });
    
    const date = new Date(this.data.selectedDate);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    wx.cloud.callFunction({
      name: 'getPhotoRecords',
      data: {
        startDate: date.toISOString(),
        endDate: nextDate.toISOString()
      },
      success: res => {
        this.setData({
          records: res.result.data || [],
          loading: false
        });
      },
      fail: err => {
        console.error('获取记录失败', err);
        this.setData({ loading: false });
      }
    });
  },

  // 切换视图模式
  switchViewMode: function() {
    const newMode = this.data.viewMode === 'calendar' ? 'gallery' : 'calendar';
    this.setData({ viewMode: newMode });
    
    if (newMode === 'gallery' && this.data.galleryPhotos.length === 0) {
      this.loadGalleryPhotos();
    }
  },

  // 加载照片墙数据
  loadGalleryPhotos: function() {
    if (!this.data.hasMore) return;
    
    this.setData({ loading: true });
    
    wx.cloud.callFunction({
      name: 'getPhotoRecords',
      data: {
        page: this.data.page,
        pageSize: this.data.pageSize
      },
      success: res => {
        const newPhotos = res.result.data || [];
        const allPhotos = [];
        
        // 将所有照片提取出来
        newPhotos.forEach(record => {
          record.photos.forEach(photo => {
            allPhotos.push({
              url: photo,
              record: record
            });
          });
        });
        
        this.setData({
          galleryPhotos: this.data.galleryPhotos.concat(allPhotos),
          hasMore: newPhotos.length === this.data.pageSize,
          page: this.data.page + 1,
          loading: false
        });
      },
      fail: err => {
        console.error('加载照片失败', err);
        this.setData({ loading: false });
      }
    });
  },

  // 查看照片详情
  viewPhoto: function(e) {
    const photo = e.currentTarget.dataset.photo;
    const urls = photo.record.photos;
    
    wx.previewImage({
      current: photo.url,
      urls: urls
    });
  },

  // 触底加载更多
  onReachBottom: function() {
    if (this.data.viewMode === 'gallery') {
      this.loadGalleryPhotos();
    }
  },

  // 选择日期（从日历点击）
  selectDate: function(e) {
    const date = e.currentTarget.dataset.date;
    this.setData({ selectedDate: date });
    this.loadDayRecords();
  }
});