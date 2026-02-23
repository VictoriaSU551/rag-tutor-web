import config from '../config/index';

const { baseUrl } = config;

const decodeArrayBuffer = (buffer) => {
  try {
    if (typeof TextDecoder !== 'undefined') {
      return new TextDecoder('utf-8').decode(buffer);
    }
  } catch (e) {
    // fallback
  }
  const uint8Array = new Uint8Array(buffer);
  let result = '';
  for (let i = 0; i < uint8Array.length; i += 1) {
    result += String.fromCharCode(uint8Array[i]);
  }
  return decodeURIComponent(escape(result));
};

const parseSseChunk = (chunkText, onMessage) => {
  if (!chunkText) return;
  const events = chunkText.split('\n\n');
  events.forEach((evt) => {
    const lines = evt.split('\n');
    const dataLines = lines.filter(line => line.startsWith('data:'));
    if (dataLines.length === 0) return;
    const dataText = dataLines.map(line => line.replace(/^data:\s?/, '')).join('\n');
    if (!dataText) return;
    try {
      const data = JSON.parse(dataText);
      if (onMessage) {
        onMessage(data);
      }
    } catch (e) {
      console.error('SSE 消息解析失败:', e, 'data:', dataText);
    }
  });
};

/**
 * SSE 流式聊天（HTTPS）
 * 
 * @param {string} sessionId 会话ID
 * @param {string} question 问题
 * @param {string} difficulty 难度level (easy/medium/hard)
 * @param {Function} onMessage 消息回调函数
 * @param {Function} onError 错误回调函数
 * @returns {Object} SSE 连接对象
 */
export const streamChat = (sessionId, question, difficulty = 'medium', onMessage, onError) => {
  const token = wx.getStorageSync('access_token');
  const queryParts = [
    `q=${encodeURIComponent(question)}`,
    `difficulty=${encodeURIComponent(difficulty)}`,
  ];
  if (token) {
    queryParts.unshift(`token=${encodeURIComponent(token)}`);
  }
  const chatUrl = `${baseUrl}/api/sessions/${sessionId}/chat?${queryParts.join('&')}`;
  let buffer = '';
  let closed = false;

  const header = {
    'content-type': 'text/event-stream',
    'Accept': 'text/event-stream',
  };
  if (token) {
    header.Authorization = `Bearer ${token}`;
  }

  const requestTask = wx.request({
    url: chatUrl,
    method: 'GET',
    responseType: 'text',
    enableChunked: true,
    header,
    success(res) {
      if (closed) return;
      if (res.statusCode !== 200) {
        if (onError) {
          onError(res);
        }
      } else if (res.data) {
        parseSseChunk(res.data, onMessage);
      }
    },
    fail(err) {
      if (closed) return;
      if (onError) {
        onError(err);
      }
    }
  });

  if (requestTask && requestTask.onChunkReceived) {
    requestTask.onChunkReceived((res) => {
      if (closed) return;
      try {
        const chunkText = decodeArrayBuffer(res.data);
        buffer += chunkText;
        const lastIndex = buffer.lastIndexOf('\n\n');
        if (lastIndex !== -1) {
          const readyText = buffer.slice(0, lastIndex);
          buffer = buffer.slice(lastIndex + 2);
          parseSseChunk(readyText, onMessage);
        }
      } catch (e) {
        console.error('SSE 处理失败:', e);
      }
    });
  }

  return {
    close() {
      closed = true;
      if (requestTask && requestTask.abort) {
        requestTask.abort();
      }
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
