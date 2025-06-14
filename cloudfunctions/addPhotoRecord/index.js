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
  
  // 获取记录数据
  const {
    mealType,
    photos,
    tags,
    satisfaction,
    description,
    location,
    calorieLevel,
    date,
    createTime
  } = event;

  try {
    // 添加记录到数据库
    const result = await db.collection('photo_records').add({
      data: {
        userId: openid,
        mealType,
        photos,
        tags,
        satisfaction,
        description,
        location,
        calorieLevel,
        date,
        createTime,
        _createTime: db.serverDate()
      }
    });

    // 更新用户统计信息
    await updateUserStats(openid, photos.length);

    return {
      success: true,
      recordId: result._id
    };
  } catch (err) {
    console.error('添加记录失败', err);
    return {
      success: false,
      error: err.message
    };
  }
};

// 更新用户统计信息
async function updateUserStats(userId, photoCount) {
  try {
    const userCollection = db.collection('users');
    
    // 检查用户是否存在
    const userRes = await userCollection.where({ _openid: userId }).get();
    
    if (userRes.data.length === 0) {
      // 创建新用户
      await userCollection.add({
        data: {
          _openid: userId,
          totalRecords: 1,
          totalPhotos: photoCount,
          joinDate: db.serverDate(),
          lastRecordDate: db.serverDate()
        }
      });
    } else {
      // 更新现有用户
      await userCollection.where({ _openid: userId }).update({
        data: {
          totalRecords: _.inc(1),
          totalPhotos: _.inc(photoCount),
          lastRecordDate: db.serverDate()
        }
      });
    }
  } catch (err) {
    console.error('更新用户统计失败', err);
  }
}