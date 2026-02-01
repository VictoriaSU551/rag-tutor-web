import config from '../config/index';

const { baseUrl, isMock } = config;
const delay = isMock ? 500 : 0;

function request(url, method = 'GET', data = {}) {
  const header = {
    'content-type': 'application/json',
    // 有其他content-type需求加点逻辑判断处理即可
  };
  
  // 获取token，有就丢进请求头
  const tokenString = wx.getStorageSync('access_token');
  if (tokenString) {
    header.Authorization = `Bearer ${tokenString}`;
  } else if (!url.includes('/login') && !url.includes('/register')) {
    // 非登录/注册接口，但没有token，直接返回未登录错误
    return Promise.reject({
      statusCode: 401,
      detail: '未登录，请先登录',
      isAuthError: true
    });
  }

  // 对于 GET 请求，参数应该放在 URL 中
  let requestUrl = baseUrl + url;
  let requestData = {};

  if (method === 'GET' && Object.keys(data).length > 0) {
    // 将参数转换为 URL 查询字符串（微信小程序中不支持 URLSearchParams）
    const queryParams = Object.keys(data)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
      .join('&');
    requestUrl = requestUrl + '?' + queryParams;
  } else if (method !== 'GET') {
    // 非 GET 请求，数据放在 body 中
    requestData = data;
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: requestUrl,
      method,
      data: requestData,
      dataType: 'json', // 微信官方文档中介绍会对数据进行一次JSON.parse
      header,
      success(res) {
        setTimeout(() => {
          // HTTP状态码为200才视为成功
          if (res.statusCode === 200) {
            resolve(res.data);
          } else if (res.statusCode === 401) {
            // 处理401未授权错误
            wx.removeStorageSync('access_token');
            wx.removeStorageSync('userInfo');
            wx.showToast({
              title: '登录已过期，请重新登录',
              icon: 'none',
              duration: 2000,
            });
            setTimeout(() => {
              wx.navigateTo({ url: '/pages/login/login' });
            }, 500);
            reject(res.data || res);
          } else {
            // wx.request的特性，只要有响应就会走success回调，所以在这里判断状态，非200的均视为请求失败
            reject(res.data || res);
          }
        }, delay);
      },
      fail(err) {
        setTimeout(() => {
          reject(err);
        }, delay);
      },
    });
  });
}

// 导出请求和服务地址
export default request;
