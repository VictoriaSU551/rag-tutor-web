import config from '~/config';

const { baseUrl } = config;
const delay = config.isMock ? 500 : 0;

function request(url, method = 'GET', data = {}) {
  const header = {
    'content-type': 'application/json',
    // 有其他content-type需求加点逻辑判断处理即可
  };
  
  // 获取token，有就丢进请求头
  const tokenString = wx.getStorageSync('access_token');
  if (tokenString) {
    header.Authorization = `Bearer ${tokenString}`;
  }

  // 对于 GET 请求，参数应该放在 URL 中
  let requestUrl = baseUrl + url;
  let requestData = {};

  if (method === 'GET' && Object.keys(data).length > 0) {
    // 将参数转换为 URL 查询字符串
    const queryParams = new URLSearchParams();
    Object.keys(data).forEach((key) => {
      queryParams.append(key, data[key]);
    });
    requestUrl = requestUrl + '?' + queryParams.toString();
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
          } else {
            // wx.request的特性，只要有响应就会走success回调，所以在这里判断状态，非200的均视为请求失败
            reject(res.data || res);
          }
        }, delay);
      },
      fail(err) {
        setTimeout(() => {
          // 断网、服务器挂了都会fail回调，直接reject即可
          reject(err);
        }, delay);
      },
    });
  });
}

// 导出请求和服务地址
export default request;
