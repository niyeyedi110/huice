// pages/record/record.js
const app = getApp();

Page({
  data: {
    photos: [],
    maxPhotos: 9,
    mealType: '',
    mealTypes: [
      { value: 'breakfast', label: '早餐', icon: '🌅' },
      { value: 'lunch', label: '午餐', icon: '☀️' },
      { value: 'dinner', label: '晚餐', icon: '🌙' },
      { value: 'snack', label: '加餐', icon: '🍿' }
    ],
    tags: [
      { value: '健康', selected: false },
      { value: '美味', selected: false },
      { value: '清淡', selected: false },
      { value: '油腻', selected: false },
      { value: '外卖', selected: false },
      { value: '自制', selected: false },
      { value: '聚餐', selected: false },
      { value: '减脂', selected: false }
    ],
    satisfaction: 3,
    description: '',
    location: '',
    calorieLevel: 'medium',
    calorieLevels: [
      { value: 'low', label: '低热量', color: '#4CAF50' },
      { value: 'medium', label: '中热量', color: '#FF9800' },
      { value: 'high', label: '高热量', color: '#F44336' }
    ],
    uploading: false,
    // 营养分析相关
    nutritionData: null,
    analyzingNutrition: false
  },

  onLoad: function (options) {
    // 如果从首页快速拍照进入，直接添加照片
    if (options.photo) {
      this.setData({
        photos: [decodeURIComponent(options.photo)]
      });
    }
    
    // 自动判断餐次
    this.autoSelectMealType();
  },

  // 自动判断餐次
  autoSelectMealType: function() {
    const hour = new Date().getHours();
    let mealType = 'snack';
    
    if (hour >= 5 && hour < 10) {
      mealType = 'breakfast';
    } else if (hour >= 10 && hour < 15) {
      mealType = 'lunch';
    } else if (hour >= 17 && hour < 21) {
      mealType = 'dinner';
    }
    
    this.setData({ mealType });
  },

  // 选择照片
  chooseImage: function() {
    const remainingCount = this.data.maxPhotos - this.data.photos.length;
    if (remainingCount <= 0) {
      wx.showToast({
        title: `最多选择${this.data.maxPhotos}张照片`,
        icon: 'none'
      });
      return;
    }

    wx.chooseImage({
      count: remainingCount,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newPhotos = this.data.photos.concat(res.tempFilePaths);
        this.setData({
          photos: newPhotos
        });
      }
    });
  },

  // 预览照片
  previewImage: function(e) {
    const index = e.currentTarget.dataset.index;
    wx.previewImage({
      current: this.data.photos[index],
      urls: this.data.photos
    });
  },

  // 删除照片
  deleteImage: function(e) {
    const index = e.currentTarget.dataset.index;
    const photos = this.data.photos;
    photos.splice(index, 1);
    this.setData({ photos });
  },

  // 选择餐次
  selectMealType: function(e) {
    const mealType = e.currentTarget.dataset.value;
    this.setData({ mealType });
  },

  // 选择标签
  toggleTag: function(e) {
    const index = e.currentTarget.dataset.index;
    const tags = this.data.tags;
    tags[index].selected = !tags[index].selected;
    this.setData({ tags });
  },

  // 选择满意度
  selectSatisfaction: function(e) {
    const satisfaction = e.currentTarget.dataset.value;
    this.setData({ satisfaction });
  },

  // 选择热量等级
  selectCalorieLevel: function(e) {
    const calorieLevel = e.currentTarget.dataset.value;
    this.setData({ calorieLevel });
  },

  // 输入描述
  inputDescription: function(e) {
    this.setData({
      description: e.detail.value
    });
  },

  // 获取位置
  getLocation: function() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          location: res.name || res.address
        });
      }
    });
  },

  // 保存记录
  saveRecord: function() {
    // 验证数据
    if (this.data.photos.length === 0) {
      wx.showToast({
        title: '请至少上传一张照片',
        icon: 'none'
      });
      return;
    }

    if (!this.data.mealType) {
      wx.showToast({
        title: '请选择用餐类型',
        icon: 'none'
      });
      return;
    }

    this.setData({ uploading: true });
    wx.showLoading({ title: '保存中...' });

    // 上传图片到云存储
    this.uploadPhotos().then(photoUrls => {
      // 准备记录数据
      const selectedTags = this.data.tags.filter(tag => tag.selected).map(tag => tag.value);
      const recordData = {
        mealType: this.data.mealType,
        photos: photoUrls,
        tags: selectedTags,
        satisfaction: this.data.satisfaction,
        description: this.data.description,
        location: this.data.location,
        calorieLevel: this.data.calorieLevel,
        date: new Date().toLocaleDateString(),
        createTime: new Date().toLocaleString(),
        // 如果有营养分析数据，也保存
        nutrition: this.data.nutritionData ? {
          foods: this.data.nutritionData.foods,
          totalNutrition: this.data.nutritionData.totalNutrition,
          analysisTime: this.data.nutritionData.analysisTime
        } : null
      };

      // 调用云函数保存记录
      return wx.cloud.callFunction({
        name: 'addPhotoRecord',
        data: recordData
      });
    }).then(res => {
      wx.hideLoading();
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });
      
      // 返回首页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
      this.setData({ uploading: false });
      console.error('保存失败', err);
    });
  },

  // 批量上传照片
  uploadPhotos: function() {
    const uploadTasks = this.data.photos.map((photo, index) => {
      return wx.cloud.uploadFile({
        cloudPath: `diet-photos/${Date.now()}-${index}.jpg`,
        filePath: photo
      });
    });

    return Promise.all(uploadTasks).then(results => {
      return results.map(res => res.fileID);
    });
  },

  // 营养分析
  analyzeNutrition: function() {
    if (this.data.photos.length === 0) {
      wx.showToast({
        title: '请先添加照片',
        icon: 'none'
      });
      return;
    }

    this.setData({ 
      analyzingNutrition: true,
      nutritionData: null 
    });

    // 先上传第一张照片用于分析
    wx.cloud.uploadFile({
      cloudPath: `diet-photos/analyze-${Date.now()}.jpg`,
      filePath: this.data.photos[0]
    }).then(res => {
      // 调用云函数进行营养分析
      return wx.cloud.callFunction({
        name: 'analyzeNutrition',
        data: {
          fileID: res.fileID,
          tags: this.data.tags.filter(t => t.selected).map(t => t.value),
          description: this.data.description,
          mealType: this.data.selectedMealType
        }
      });
    }).then(res => {
      if (res.result.success) {
        this.setData({
          nutritionData: res.result.data,
          analyzingNutrition: false
        });
        
        // 根据分析结果自动设置热量等级
        const calories = res.result.data.totalNutrition.calories;
        let calorieLevel = 'medium';
        if (calories < 400) {
          calorieLevel = 'low';
        } else if (calories > 700) {
          calorieLevel = 'high';
        }
        this.setData({ calorieLevel });
        
        // 自动添加相关标签
        this.autoAddNutritionTags(res.result.data);
      } else {
        throw new Error(res.result.error || '分析失败');
      }
    }).catch(err => {
      console.error('营养分析失败', err);
      wx.showToast({
        title: '分析失败，请重试',
        icon: 'none'
      });
      this.setData({ analyzingNutrition: false });
    });
  },

  // 根据营养分析结果自动添加标签
  autoAddNutritionTags: function(nutritionData) {
    const tags = [...this.data.tags];
    const calories = nutritionData.totalNutrition.calories;
    const protein = nutritionData.totalNutrition.protein;
    
    // 根据热量判断
    if (calories < 400) {
      const lightIndex = tags.findIndex(t => t.value === '清淡');
      if (lightIndex !== -1) tags[lightIndex].selected = true;
      
      const dietIndex = tags.findIndex(t => t.value === '减脂');
      if (dietIndex !== -1) tags[dietIndex].selected = true;
    }
    
    // 根据蛋白质判断
    if (protein > 20) {
      const healthyIndex = tags.findIndex(t => t.value === '健康');
      if (healthyIndex !== -1) tags[healthyIndex].selected = true;
    }
    
    this.setData({ tags });
  }
});