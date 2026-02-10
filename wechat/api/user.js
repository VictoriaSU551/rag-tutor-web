import request from './request';

/**
 * 获取当前用户信息
 * @returns {Promise}
 */
export const me = () => {
  return request('/api/me', 'GET');
};

export default {
  me,
};
