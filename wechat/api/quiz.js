import request from './request';

/**
 * 获取当前会话中的待答习题
 * @param {string} sessionId 会话ID
 * @returns {Promise}
 */
export const getCurrentQuiz = (sessionId) => {
  return request('/api/quiz/current', 'GET', { session_id: sessionId });
};

/**
 * 提交习题答案
 * @param {string} sessionId 会话ID
 * @param {string} answer 答案
 * @returns {Promise}
 */
export const submitQuizAnswer = (sessionId, answer) => {
  return request('/api/quiz/answer', 'POST', {
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
  return request('/api/quiz/add_wrong', 'POST', {
    session_id: sessionId,
    user_first_answer: userFirstAnswer,
  });
};

/**
 * 获取用户错题本（来自 session.meta）
 * @returns {Promise}
 */
export const getWrongBook = () => {
  return request('/api/wrongbook', 'GET');
};

/**
 * 删除错题本中的题目
 * @param {number} index 题目索引（按返回顺序）
 * @returns {Promise}
 */
export const deleteWrongQuestion = (index) => {
  return request(`/api/wrongbook/${index}`, 'DELETE');
};

/**
 * 获取所有生成过的题目（跨会话，来自 QuizQuestion 表）
 * @param {number} page 页码
 * @param {number} pageSize 每页条数
 * @returns {Promise}
 */
export const getQuizQuestions = (page = 1, pageSize = 200) => {
  return request('/api/quiz_questions', 'GET', { page, page_size: pageSize });
};

export default {
  getCurrentQuiz,
  submitQuizAnswer,
  addWrongQuestion,
  getWrongBook,
  deleteWrongQuestion,
  getQuizQuestions,
};
