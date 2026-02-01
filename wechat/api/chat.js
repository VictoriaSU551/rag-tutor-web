import config from '../config/index';

const { baseUrl } = config;

/**
 * 流式聊天 - 处理SSE格式的流式响应
 * 注意：微信小程序的wx.request不支持真正的流式（分块）响应
 * 这里的实现在响应完全到达时处理所有的数据行
 * 
 * @param {string} sessionId 会话ID
 * @param {string} question 问题
 * @param {string} difficulty 难度level (easy/medium/hard)
 * @param {Function} onMessage 消息回调函数
 * @param {Function} onError 错误回调函数
 */
export const streamChat = (sessionId, question, difficulty = 'medium', onMessage, onError) => {
  const token = wx.getStorageSync('access_token');
  
  const chatUrl = `${baseUrl}/api/sessions/${sessionId}/chat`;
  
  return wx.request({
    url: chatUrl,
    method: 'GET',
    data: {
      q: question,
      difficulty,
    },
    header: {
      'content-type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    success(res) {
      if (res.statusCode === 200) {
        // 处理流式响应 - 按行分割
        const lines = (res.data || '').split('\n');
        
        lines.forEach((line) => {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.substring(6).trim();
              if (jsonStr) {
                const data = JSON.parse(jsonStr);
                onMessage(data);
              }
            } catch (e) {
              console.error('Failed to parse message:', e, 'line:', line);
            }
          }
        });
      } else {
        if (onError) {
          onError(res.data);
        }
      }
    },
    fail(err) {
      if (onError) {
        onError(err);
      }
    },
  });
};

/**
 * 生成会话标题
 * @param {string} sessionId 会话ID
 * @returns {Promise}
 */
export const generateTitle = (sessionId) => {
  const token = wx.getStorageSync('access_token');

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${baseUrl}/api/sessions/${sessionId}/generate_title`,
      method: 'POST',
      header: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      data: {},
      success(res) {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(res.data);
        }
      },
      fail(err) {
        reject(err);
      },
    });
  });
};

export default {
  streamChat,
  generateTitle,
};
