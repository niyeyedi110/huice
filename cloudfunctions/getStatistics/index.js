// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  const { startDate, endDate, timeRange } = event;

  try {
    // 获取时间范围内的所有记录
    const recordsRes = await db.collection('photo_records')
      .where({
        userId: openid,
        _createTime: _.gte(new Date(startDate)).and(_.lt(new Date(endDate)))
      })
      .get();

    const records = recordsRes.data;

    // 计算统计数据
    const stats = {
      totalRecords: records.length,
      totalDays: calculateUniqueDays(records),
      continuousDays: calculateContinuousDays(records),
      completionRate: 0,
      averagePerDay: 0,
      mealDistribution: {
        breakfast: 0,
        lunch: 0,
        dinner: 0,
        snack: 0
      },
      calorieDistribution: {
        low: 0,
        medium: 0,
        high: 0
      },
      mostUsedTags: [],
      satisfactionTrend: []
    };

    // 计算餐次分布
    records.forEach(record => {
      if (record.mealType) {
        stats.mealDistribution[record.mealType]++;
      }
      
      // 计算热量分布
      if (record.calorieLevel) {
        stats.calorieDistribution[record.calorieLevel]++;
      }
    });

    // 计算热量分布百分比
    const totalCalorieRecords = records.filter(r => r.calorieLevel).length;
    if (totalCalorieRecords > 0) {
      stats.calorieDistribution.low = Math.round(stats.calorieDistribution.low / totalCalorieRecords * 100);
      stats.calorieDistribution.medium = Math.round(stats.calorieDistribution.medium / totalCalorieRecords * 100);
      stats.calorieDistribution.high = Math.round(stats.calorieDistribution.high / totalCalorieRecords * 100);
    }

    // 计算完成率
    const expectedDays = timeRange === 'week' ? 7 : 30;
    stats.completionRate = Math.round(stats.totalDays / expectedDays * 100);

    // 计算日均记录数
    stats.averagePerDay = stats.totalDays > 0 ? 
      (stats.totalRecords / stats.totalDays).toFixed(1) : 0;

    // 统计常用标签
    const tagCount = {};
    records.forEach(record => {
      if (record.tags) {
        record.tags.forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
      }
    });

    stats.mostUsedTags = Object.entries(tagCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      success: true,
      stats
    };
  } catch (err) {
    console.error('获取统计数据失败', err);
    return {
      success: false,
      error: err.message
    };
  }
};

// 计算记录的天数
function calculateUniqueDays(records) {
  const days = new Set();
  records.forEach(record => {
    const date = new Date(record._createTime);
    const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    days.add(dateStr);
  });
  return days.size;
}

// 计算连续记录天数
function calculateContinuousDays(records) {
  if (records.length === 0) return 0;

  // 获取所有记录日期并排序
  const dates = Array.from(new Set(
    records.map(record => {
      const date = new Date(record._createTime);
      return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    })
  )).sort((a, b) => b - a);

  // 从最近的日期开始计算连续天数
  let continuous = 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 检查今天是否有记录
  if (dates[0] !== today.getTime()) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // 如果昨天也没有记录，则连续天数为0
    if (dates[0] !== yesterday.getTime()) {
      return 0;
    }
  }

  // 计算连续天数
  for (let i = 1; i < dates.length; i++) {
    const diff = dates[i - 1] - dates[i];
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    if (diff === oneDayMs) {
      continuous++;
    } else {
      break;
    }
  }

  return continuous;
}