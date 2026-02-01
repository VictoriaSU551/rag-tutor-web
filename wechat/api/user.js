import request from './request';

/**
 * 获取当前用户信息
 * @returns {Promise}
 */
export const me = () => {
  const token = wx.getStorageSync('access_token');
  return request('/me', 'GET', { token });
};

export default {
  me,
};
