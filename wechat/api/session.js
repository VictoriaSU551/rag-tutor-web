import request from './request';

/**
 * 获取所有会话列表
 * @returns {Promise}
 */
export const getSessions = () => {
  return request('/api/sessions', 'GET');
};

/**
 * 创建新会话
 * @returns {Promise}
 */
export const createSession = () => {
  return request('/api/sessions', 'POST', {});
};

/**
 * 获取会话详情
 * @param {string} sessionId 会话ID
 * @returns {Promise}
 */
export const getSessionDetail = (sessionId) => {
  return request(`/api/sessions/${sessionId}`, 'GET');
};

/**
 * 删除会话
 * @param {string} sessionId 会话ID
 * @returns {Promise}
 */
export const deleteSession = (sessionId) => {
  return request(`/api/sessions/${sessionId}`, 'DELETE');
};

export default {
  getSessions,
  createSession,
  getSessionDetail,
  deleteSession,
};
