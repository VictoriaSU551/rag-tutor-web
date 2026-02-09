import config from '../config/index';

const { baseUrl } = config;

/**
 * WebSocket 流式聊天
 * 
 * @param {string} sessionId 会话ID
 * @param {string} question 问题
 * @param {string} difficulty 难度level (easy/medium/hard)
 * @param {Function} onMessage 消息回调函数
 * @param {Function} onError 错误回调函数
 * @returns {Object} WebSocket 连接对象
 */
export const streamChat = (sessionId, question, difficulty = 'medium', onMessage, onError) => {
  const token = wx.getStorageSync('access_token');
  
  // 将 http/https 转换为 ws/wss
  const wsUrl = baseUrl.replace(/^http/, 'ws');
  const chatUrl = `${wsUrl}/api/ws/chat/${sessionId}?token=${token}&q=${encodeURIComponent(question)}&difficulty=${difficulty}`;
  
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 3;
  
  function connect() {
    wx.connectSocket({
      url: chatUrl,
      success(res) {
        console.log('WebSocket 连接成功');
      },
      fail(err) {
        console.error('WebSocket 连接失败:', err);
        if (onError) {
          onError(err);
        }
      }
    });

    // WebSocket 打开事件
    wx.onSocketOpen(() => {
      console.log('WebSocket 已打开');
      reconnectAttempts = 0;
    });

    // WebSocket 消息事件
    wx.onSocketMessage((event) => {
      try {
        const data = JSON.parse(event.data);
        if (onMessage) {
          onMessage(data);
        }
      } catch (e) {
        console.error('消息解析失败:', e, 'data:', event.data);
      }
    });

    // WebSocket 错误事件
    wx.onSocketError((error) => {
      console.error('WebSocket 错误:', error);
      if (onError) {
        onError(error);
      }
    });

    // WebSocket 关闭事件
    wx.onSocketClose((event) => {
      console.log('WebSocket 已关闭:', event);
    });
  }

  connect();

  return {
    close() {
      wx.closeSocket({
        success() {
          console.log('WebSocket 已关闭');
        }
      });
    }
  };
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

/**
 * 针对指定消息生成一道练习题
 * @param {string} sessionId 会话ID
 * @param {number} messageIndex 用户消息索引
 * @param {string} difficulty 难度
 * @returns {Promise}
 */
export const generateExercise = (sessionId, messageIndex, difficulty = 'medium') => {
  const token = wx.getStorageSync('access_token');

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${baseUrl}/api/sessions/${sessionId}/generate_exercise?message_index=${messageIndex}&difficulty=${difficulty}`,
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
  generateExercise,
};
