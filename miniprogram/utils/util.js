// 格式化时间
const formatTime = date => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`;
};

const formatNumber = n => {
  n = n.toString();
  return n[1] ? n : `0${n}`;
};

// 获取当前日期字符串
const getCurrentDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = formatNumber(date.getMonth() + 1);
  const day = formatNumber(date.getDate());
  return `${year}-${month}-${day}`;
};

// 获取星期几
const getWeekday = date => {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return weekdays[date.getDay()];
};

// 压缩图片
const compressImage = (filePath, quality = 80) => {
  return new Promise((resolve, reject) => {
    wx.compressImage({
      src: filePath,
      quality: quality,
      success: res => resolve(res.tempFilePath),
      fail: reject
    });
  });
};

// 显示加载提示
const showLoading = (title = '加载中...') => {
  wx.showLoading({
    title: title,
    mask: true
  });
};

// 隐藏加载提示
const hideLoading = () => {
  wx.hideLoading();
};

// 显示成功提示
const showSuccess = (title, duration = 1500) => {
  wx.showToast({
    title: title,
    icon: 'success',
    duration: duration
  });
};

// 显示错误提示
const showError = (title, duration = 2000) => {
  wx.showToast({
    title: title,
    icon: 'none',
    duration: duration
  });
};

// 防抖函数
const debounce = (fn, delay = 300) => {
  let timer = null;
  return function() {
    const context = this;
    const args = arguments;
    
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(context, args);
    }, delay);
  };
};

// 节流函数
const throttle = (fn, delay = 300) => {
  let lastTime = 0;
  return function() {
    const context = this;
    const args = arguments;
    const nowTime = Date.now();
    
    if (nowTime - lastTime > delay) {
      fn.apply(context, args);
      lastTime = nowTime;
    }
  };
};

module.exports = {
  formatTime,
  formatNumber,
  getCurrentDate,
  getWeekday,
  compressImage,
  showLoading,
  hideLoading,
  showSuccess,
  showError,
  debounce,
  throttle
};