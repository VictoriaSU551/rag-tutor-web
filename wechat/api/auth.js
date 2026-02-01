import request from './request';

/**
 * 用户注册
 * @param {string} username 用户名
 * @param {string} password 密码
 * @returns {Promise}
 */
export const register = (username, password) => {
  return request('/api/register', 'POST', {
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
  return request('/api/login', 'POST', {
    username,
    password,
  });
};

/**
 * 获取当前用户信息
 * @returns {Promise}
 */
export const getUserInfo = () => {
  return request('/api/me', 'GET');
};

export default {
  register,
  login,
  getUserInfo,
};
