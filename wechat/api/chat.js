import config from '../config/index';

const { baseUrl } = config;

/**
 * HTTP 流式对话 (返回 JSONL 格式，每行一个 JSON)
 * 
 * 注意：小程序 wx.request 不支持真实流式，需要等待整个响应完成
 * 我们通过分行处理 JSONL 来模拟流式效果，并用延迟来模拟流式输出
 * 
 * 后端返回格式:
 * {"type":"meta","sources":[[...]]}
 * {"type":"delta","text":"..."}
 * {"type":"delta","text":"..."}
 * ...
 * {"type":"done"}
 * 
 * @param {string} sessionId 会话ID
 * @param {string} question 问题
 * @param {string} difficulty 难度level (easy/medium/hard)
 * @param {Function} onMessage 消息回调函数，接收每一行解析后的 JSON 对象
 * @param {Function} onError 错误回调函数
 * @returns {Object} 请求对象，包含 close() 方法
 */
export const streamChat = (sessionId, question, difficulty = 'medium', onMessage, onError) => {
  const token = wx.getStorageSync('access_token');
  
  if (!token) {
    if (onError) {
      onError({ message: '未登录，请先登录' });
    }
    return { close() {} };
  }

  // 使用 HTTP 接口获取完整的 JSONL 数据
  const url = `${baseUrl}/api/sessions/${sessionId}/chat?token=${token}&q=${encodeURIComponent(question)}&difficulty=${difficulty}`;
  
  let requestTask = null;
  let isAborted = false;

  // 使用 wx.request 获取 JSONL 数据
  // 注意：小程序 wx.request 会等待整个响应完成才调用 success
  requestTask = wx.request({
    url: url,
    method: 'GET',
    header: {
      'Authorization': `Bearer ${token}`,
    },
    responseType: 'text',  // 以文本形式获取，便于逐行解析
    success(res) {
      if (res.statusCode === 200) {
        try {
          const data = res.data;
          
          if (typeof data === 'string' && data.length > 0) {
            // 按行分割 JSONL 格式的数据
            const lines = data.trim().split('\n');
            
            // 逐行解析并发送给客户端，添加延迟以模拟流式效果
            if (lines.length === 0) {
              if (onMessage) onMessage({ type: 'done' });
              return;
            }

            // 处理元数据（第一行通常是 meta）
            if (lines[0] && lines[0].trim()) {
              try {
                const firstLine = JSON.parse(lines[0]);
                if (onMessage) {
                  onMessage(firstLine);
                }
              } catch (e) {
                console.error('First line JSON parse error:', lines[0], e);
              }
            }

            // 处理 delta 行，添加延迟以模拟流式输出
            let deltaIndex = 1;
            const processNextDelta = () => {
              if (isAborted || deltaIndex >= lines.length) {
                // 发送完成信号
                if (onMessage && !isAborted) {
                  onMessage({ type: 'done' });
                }
                return;
              }

              const line = lines[deltaIndex];
              if (line && line.trim()) {
                try {
                  const jsonObj = JSON.parse(line);
                  
                  // 立即调用回调
                  if (onMessage) {
                    onMessage(jsonObj);
                  }
                  
                  // 如果是完成信号，停止处理
                  if (jsonObj.type === 'done') {
                    return;
                  }
                } catch (parseErr) {
                  console.error('JSON 解析失败:', line, parseErr);
                }
              }

              // 处理下一行，添加 20ms 延迟以模拟流式效果
              deltaIndex++;
              wx.nextTick(() => processNextDelta());
            };

            // 开始处理 delta 行
            processNextDelta();
          } else {
            console.warn('响应数据为空');
            // 即使为空也发送一个 done 信号
            if (onMessage) {
              onMessage({ type: 'done' });
            }
          }
        } catch (e) {
          console.error('流式数据处理失败:', e);
          if (onError) {
            onError(e);
          }
        }
      } else {
        console.error('请求失败:', res.statusCode, res.data);
        if (onError) {
          onError({ 
            statusCode: res.statusCode, 
            message: res.data || '请求失败' 
          });
        }
      }
    },
    fail(err) {
      console.error('HTTP 请求失败:', err);
      if (onError) {
        onError({ message: '网络请求失败: ' + (err.errMsg || '未知错误') });
      }
    }
  });

  return {
    close() {
      // 标记为已中止
      isAborted = true;
      console.log('HTTP 流式请求会话已关闭');
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
