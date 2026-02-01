import request from './request';

/**
 * 获取所有会话列表
 * @returns {Promise}
 */
export const getSessions = () => {
  const token = wx.getStorageSync('access_token');
  return request('/api/sessions', 'GET', { token });
};

/**
 * 创建新会话
 * @returns {Promise}
 */
export const createSession = () => {
  const token = wx.getStorageSync('access_token');
  return request('/api/sessions', 'POST', { token });
};

/**
 * 获取会话详情
 * @param {string} sessionId 会话ID
 * @returns {Promise}
 */
export const getSessionDetail = (sessionId) => {
  const token = wx.getStorageSync('access_token');
  return request(`/api/sessions/${sessionId}`, 'GET', { token });
};

/**
 * 删除会话
 * @param {string} sessionId 会话ID
 * @returns {Promise}
 */
export const deleteSession = (sessionId) => {
  const token = wx.getStorageSync('access_token');
  return request(`/api/sessions/${sessionId}`, 'DELETE', { token });
};

export default {
  getSessions,
  createSession,
  getSessionDetail,
  deleteSession,
};
