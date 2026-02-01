/** 后端服务地址 */
const baseUrl = 'http://127.0.0.1:8000';

/** 是否使用mock代替api返回 */
const config = {
  baseUrl,
  isMock: false, // 设置为false以连接真实后端
};

export default config;
