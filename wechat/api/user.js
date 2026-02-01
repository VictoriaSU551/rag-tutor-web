import request from './request';

/**
 * 获取当前用户信息
 * @returns {Promise}
 */
export const me = () => {
  const token = wx.getStorageSync('access_token');
  if (!token) {
    return Promise.reject(new Error('未登录'));
  }
  return request('/api/me', 'GET', { token });
};

export default {
  me,
};
