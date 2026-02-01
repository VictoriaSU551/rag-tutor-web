import request from './request';

/**
 * 获取当前待答习题
 * @param {string} sessionId 会话ID
 * @returns {Promise}
 */
export const getCurrentQuiz = (sessionId) => {
  const token = wx.getStorageSync('access_token');
  return request('/quiz/current', 'GET', { token, session_id: sessionId });
};

/**
 * 提交习题答案
 * @param {string} sessionId 会话ID
 * @param {string} answer 答案
 * @returns {Promise}
 */
export const submitQuizAnswer = (sessionId, answer) => {
  const token = wx.getStorageSync('access_token');
  return request(`/quiz/answer`, 'POST', {
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
  return request('/quiz/add_wrong', 'POST', {
    token,
    session_id: sessionId,
    user_first_answer: userFirstAnswer,
  });
};

/**
 * 获取用户错题本
 * @returns {Promise}
 */
export const getWrongBook = () => {
  const token = wx.getStorageSync('access_token');
  return request('/wrongbook', 'GET', { token });
};

/**
 * 删除错题本中的题目
 * @param {number} index 题目索引
 * @returns {Promise}
 */
export const deleteWrongQuestion = (index) => {
  const token = wx.getStorageSync('access_token');
  return request(`/wrongbook/${index}`, 'DELETE', { token });
};

export default {
  getCurrentQuiz,
  submitQuizAnswer,
  addWrongQuestion,
  getWrongBook,
  deleteWrongQuestion,
};
