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
  
  const {
    startDate,
    endDate,
    page = 1,
    pageSize = 20,
    summary = false
  } = event;

  try {
    let query = db.collection('photo_records').where({
      userId: openid
    });

    // 日期范围筛选
    if (startDate && endDate) {
      query = query.where({
        _createTime: _.gte(new Date(startDate)).and(_.lt(new Date(endDate)))
      });
    }

    // 如果只需要摘要（用于日历显示）
    if (summary) {
      const result = await query.field({
        date: true
      }).get();
      
      return {
        success: true,
        data: result.data
      };
    }

    // 分页查询
    const skip = (page - 1) * pageSize;
    
    const result = await query
      .orderBy('_createTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();

    return {
      success: true,
      data: result.data,
      total: result.total
    };
  } catch (err) {
    console.error('获取记录失败', err);
    return {
      success: false,
      error: err.message
    };
  }
};