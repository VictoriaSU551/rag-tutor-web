import request from './request';

/**
 * 获取当前待答习题
 * @param {string} sessionId 会话ID
 * @returns {Promise}
 */
export const getCurrentQuiz = (sessionId) => {
  const token = wx.getStorageSync('access_token');
  return request('/api/quiz/current', 'GET', { token, session_id: sessionId });
};

/**
 * 提交习题答案
 * @param {string} sessionId 会话ID
 * @param {string} answer 答案
 * @returns {Promise}
 */
export const submitQuizAnswer = (sessionId, answer) => {
  const token = wx.getStorageSync('access_token');
  return request(`/api/quiz/answer`, 'POST', {
    token,
    session_id: sessionId,
    answer,
  });
};

/**
 * 将答错的题目加入错题本
 * @param {string} sessionId 会话ID
 * @param {string} userFirstAnswer 用户第一次答案
 * @returns {Promise}
 */
export const addWrongQuestion = (sessionId, userFirstAnswer) => {
  const token = wx.getStorageSync('access_token');
  return request('/api/quiz/add_wrong', 'POST', {
    token,
    session_id: sessionId,
    user_first_answer: userFirstAnswer,
  });
};

/**
 * 手动将题目加入错题本（跨会话）
 * @param {Object} payload 题目内容
 * @returns {Promise}
 */
export const addManualWrongQuestion = (payload) => {
  const token = wx.getStorageSync('access_token');
  return request('/api/quiz/add_manual_wrong', 'POST', {
    token,
    ...payload,
  });
};

/**
 * 获取用户错题本
 * @returns {Promise}
 */
export const getWrongBook = () => {
  const token = wx.getStorageSync('access_token');
  return request('/api/wrongbook', 'GET', { token });
};

/**
 * 删除错题本中的题目
 * @param {number} index 题目索引
 * @returns {Promise}
 */
export const deleteWrongQuestion = (index) => {
  const token = wx.getStorageSync('access_token');
  return request(`/api/wrongbook/${index}`, 'DELETE', { token });
};

/**
 * 获取所有生成过的题目（跨会话）
 * @param {number} page 页码
 * @param {number} pageSize 每页条数
 * @returns {Promise}
 */
export const getQuizQuestions = (page = 1, pageSize = 200) => {
  const token = wx.getStorageSync('access_token');
  return request('/api/quiz_questions', 'GET', { token, page, page_size: pageSize });
};

export default {
  getCurrentQuiz,
  submitQuizAnswer,
  addWrongQuestion,
  addManualWrongQuestion,
  getWrongBook,
  deleteWrongQuestion,
  getQuizQuestions,
};
