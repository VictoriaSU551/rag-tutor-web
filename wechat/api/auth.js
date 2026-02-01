import request from './request';

/**
 * 用户注册
 * @param {string} username 用户名
 * @param {string} password 密码
 * @returns {Promise}
 */
export const register = (username, password) => {
  return request('/auth/register', 'POST', {
    username,
    password,
  });
};

/**
 * 用户登录
 * @param {string} username 用户名
 * @param {string} password 密码
 * @returns {Promise}
 */
export const login = (username, password) => {
  return request('/auth/login', 'POST', {
    username,
    password,
  });
};

/**
 * 获取当前用户信息
 * @returns {Promise}
 */
export const getUserInfo = () => {
  const token = wx.getStorageSync('access_token');
  return request('/me', 'GET', { token });
};

export default {
  register,
  login,
  getUserInfo,
};
