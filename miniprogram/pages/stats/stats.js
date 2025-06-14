// pages/stats/stats.js
const app = getApp();

Page({
  data: {
    // 统计时间范围
    timeRange: 'week', // week, month
    timeRanges: [
      { value: 'week', label: '本周' },
      { value: 'month', label: '本月' }
    ],
    
    // 统计数据
    stats: {
      totalDays: 0,
      totalRecords: 0,
      continuousDays: 0,
      completionRate: 0,
      averagePerDay: 0,
      mostUsedTags: [],
      mealDistribution: {
        breakfast: 0,
        lunch: 0,
        dinner: 0,
        snack: 0
      },
      satisfactionTrend: [],
      calorieDistribution: {
        low: 0,
        medium: 0,
        high: 0
      }
    },
    
    // 图表数据
    chartData: {
      mealChart: null,
      trendChart: null
    },
    
    loading: false
  },

  onLoad: function (options) {
    this.loadStatistics();
  },

  onShow: function() {
    // 每次显示时刷新数据
    this.loadStatistics();
  },

  // 切换时间范围
  selectTimeRange: function(e) {
    const timeRange = e.currentTarget.dataset.value;
    this.setData({ timeRange });
    this.loadStatistics();
  },

  // 加载统计数据
  loadStatistics: function() {
    this.setData({ loading: true });
    
    const endDate = new Date();
    const startDate = new Date();
    
    if (this.data.timeRange === 'week') {
      startDate.setDate(startDate.getDate() - 6);
    } else {
      startDate.setMonth(startDate.getMonth() - 1);
    }
    
    wx.cloud.callFunction({
      name: 'getStatistics',
      data: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        timeRange: this.data.timeRange
      },
      success: res => {
        const stats = res.result.stats || {};
        this.setData({
          stats: stats,
          loading: false
        });
        
        // 绘制图表
        this.drawCharts(stats);
      },
      fail: err => {
        console.error('获取统计数据失败', err);
        wx.showToast({
          title: '获取数据失败',
          icon: 'none'
        });
        this.setData({ loading: false });
      }
    });
  },

  // 绘制图表（简化版，实际项目可以使用 wx-charts 等图表库）
  drawCharts: function(stats) {
    // 这里简化处理，实际应该使用专业的图表库
    console.log('绘制图表', stats);
  },

  // 查看标签详情
  viewTagDetail: function(e) {
    const tag = e.currentTarget.dataset.tag;
    wx.showToast({
      title: `标签: ${tag.name} (${tag.count}次)`,
      icon: 'none'
    });
  },

  // 生成报告
  generateReport: function() {
    wx.showLoading({ title: '生成中...' });
    
    // 模拟生成报告
    setTimeout(() => {
      wx.hideLoading();
      wx.showModal({
        title: '饮食报告',
        content: `${this.data.timeRange === 'week' ? '本周' : '本月'}共记录${this.data.stats.totalRecords}餐，连续记录${this.data.stats.continuousDays}天，完成率${this.data.stats.completionRate}%`,
        showCancel: false,
        confirmText: '知道了'
      });
    }, 1000);
  }
});