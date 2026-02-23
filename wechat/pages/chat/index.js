// pages/chat/index.js
import { getSessionDetail } from '../../api/session';
import { streamChat, generateExercise } from '../../api/chat';
const towxml = require('../../towxml/index.js');

Page({
  data: {
    myAvatar: '/static/chat/avatar.png',
    userId: null,
    avatar: '',
    name: '对话',
    messages: [],
    input: '',
    anchor: '',
    keyboardHeight: 0,
    loading: true,
    sending: false,
    generatingExercise: false,
    exercisedIndices: [],
    pendingSources: [],
  },

  renderDebounceTimer: null,
  contentUpdateCount: 0, // 记录内容更新数

  onLoad(options) {
    const targetId = options.userId || 1;
    this.userId = targetId;
    this.loadSessionDetail();
  },

  onReady() {},

  onShow() {},

  onHide() {},

  onUnload() {},

  formatSources(sources) {
    if (!sources || !Array.isArray(sources)) return [];
    return sources.map((s) => {
      const bookName = (s.book || '').replace(/\.(pdf|PDF)$/g, '');
      return {
        ...s,
        displayBook: bookName || s.book || '未知文档',
      };
    });
  },

  renderMarkdown(markdown) {
    if (!markdown) return null;
    try {
      return towxml(markdown, 'markdown', {
        theme: 'light',
        useInline: false
      });
    } catch (e) {
      console.error('Markdown render error:', e);
      return null;
    }
  },

  updateMessageMarkdown() {
    // 延迟更新markdown渲染，用于流式输出完成后的最终渲染
    const msgs = this.data.messages;
    const lastMessage = msgs[msgs.length - 1];
    if (lastMessage && lastMessage.from === 1 && lastMessage.content) {
      lastMessage.contentNodes = this.renderMarkdown(lastMessage.content);
    }
    this.setData({ messages: msgs });
  },

  updateMessageMarkdownDebounce() {
    // 防抖渲染markdown - 只在积累足够内容后才渲染
    // 清除之前的定时器
    if (this.renderDebounceTimer) {
      clearTimeout(this.renderDebounceTimer);
    }

    // 设置新的定时器 - 最长等待200ms进行一次渲染
    this.renderDebounceTimer = setTimeout(() => {
      this.updateMessageMarkdown();
      this.contentUpdateCount = 0; // 计数器重置
      this.renderDebounceTimer = null;
    }, 200);
  },

  shouldRenderMarkdown(textLength) {
    // 判断是否应该渲染 - 当累计文本达到300字符时（优先保证文本流畅输出）
    this.contentUpdateCount += textLength;
    if (this.contentUpdateCount >= 300) {
      this.contentUpdateCount = 0; // 重置计数
      return true;
    }
    return false;
  },

  async loadSessionDetail() {
    try {
      const sessionDetail = await getSessionDetail(this.userId);
      
      // 转换消息格式
      const messages = (sessionDetail.messages || []).map((msg, idx) => {
        // 为助手消息找到对应的用户消息索引
        let userMsgIndex = null;
        if(msg.role === 'assistant'){
          const allMsgs = sessionDetail.messages;
          for(let i = idx - 1; i >= 0; i--){
            if(allMsgs[i].role === 'user'){
              userMsgIndex = i;
              break;
            }
          }
        }
        return {
          messageId: msg.timestamp,
          from: msg.role === 'user' ? 0 : 1,
          content: msg.content,
          contentNodes: msg.role === 'assistant' ? this.renderMarkdown(msg.content) : null,
          time: msg.timestamp * 1000,
          read: true,
          userMsgIndex: userMsgIndex,
          sources: this.formatSources(msg.sources || []),
        };
      });

      // 解析已生成题目的消息索引
      let exercisedIndices = [];
      try{
        const meta = JSON.parse(sessionDetail.meta || '{}');
        exercisedIndices = meta.exercised_message_indices || [];
      }catch(e){
        exercisedIndices = [];
      }

      this.setData({
        userId: sessionDetail.id,
        name: sessionDetail.title,
        messages,
        exercisedIndices,
        loading: false,
      });

      wx.nextTick(() => this.scrollToBottom());
    } catch (error) {
      wx.showToast({
        title: '加载会话失败',
        icon: 'none',
        duration: 2000,
      });
      this.setData({ loading: false });
    }
  },

  handleKeyboardHeightChange(event) {
    const { height } = event.detail;
    if (!height) return;
    this.setData({ keyboardHeight: height });
    wx.nextTick(() => this.scrollToBottom());
  },

  handleBlur() {
    this.setData({ keyboardHeight: 0 });
  },

  handleInput(event) {
    this.setData({ input: event.detail.value });
  },

  async sendMessage() {
    const { input: content } = this.data;
    
    if (!content.trim()) return;
    if (this.data.sending) return;
    if (this.data.generatingExercise) {
      wx.showToast({ title: '正在生成题目，请稍候', icon: 'none', duration: 2000 });
      return;
    }

    this.setData({ sending: true });

    // 添加用户消息到本地
    const userMessage = {
      messageId: Date.now(),
      from: 0,
      content,
      time: Date.now(),
      read: true,
    };

    const messages = [...this.data.messages, userMessage];
    this.setData({ input: '', messages });
    wx.nextTick(() => this.scrollToBottom());

    // 重置来源
    this.setData({ pendingSources: [] });

    try {
      // 发送到服务器并获取流式回复
      streamChat(
        this.userId,
        content,
        'medium',
        (data) => {
          if (data.type === 'meta') {
            const sources = this.formatSources(data.sources || []);
            this.setData({ pendingSources: sources });
            const msgs = this.data.messages;
            const lastMessage = msgs[msgs.length - 1];
            if (lastMessage && lastMessage.from === 1 && (!lastMessage.sources || lastMessage.sources.length === 0)) {
              lastMessage.sources = sources;
              this.setData({ messages: msgs });
            }
            return;
          }
          // WebSocket 流式处理
          if (data.type === 'delta') {
            // 只更新纯文本，不渲染markdown
            const msgs = this.data.messages;
            let lastMessage = msgs[msgs.length - 1];
            const textLength = data.text ? data.text.length : 0;
            
            if (!lastMessage || lastMessage.from === 0) {
              // 创建新的助手消息
              const newMessage = {
                messageId: Date.now(),
                from: 1,
                content: data.text || '',
                time: Date.now(),
                read: true,
                sources: this.data.pendingSources || [],
              };
              
              // 关联知识来源
              
              msgs.push(newMessage);
              lastMessage = msgs[msgs.length - 1];
            } else {
              // 只追加纯文本
              lastMessage.content += data.text;
            }
            
            // 快速更新UI，只显示纯文本
            this.setData({ messages: msgs });
            wx.nextTick(() => this.scrollToBottom());
            
            // 检查是否应该进行markdown渲染（每积累50个字符）
            if (this.shouldRenderMarkdown(textLength)) {
              this.updateMessageMarkdown();
            } else {
              // 启动防抖定时器作为backup（确保200ms内至少渲染一次）
              if (!this.renderDebounceTimer) {
                this.updateMessageMarkdownDebounce();
              }
            }
          } else if (data.type === 'exercise') {
            // 处理习题（可选）
            console.log('练习题:', data.data);
          } else if (data.type === 'done') {
            // 流式完成 - 清除防抖定时器，立即渲染最终markdown
            if (this.renderDebounceTimer) {
              clearTimeout(this.renderDebounceTimer);
              this.renderDebounceTimer = null;
            }
            this.contentUpdateCount = 0;
            this.updateMessageMarkdown();

            // 为最后一条助手消息标记用户消息索引
            const msgs = this.data.messages;
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg && lastMsg.from === 1) {
              if (!lastMsg.sources || lastMsg.sources.length === 0) {
                lastMsg.sources = this.data.pendingSources || [];
              }
              // 找到对应的用户消息索引（倒序的前一条用户消息在原消息列表中的位置）
              // 用户消息是倒数第二条
              const totalOriginalMsgs = msgs.length; // 本地消息数即对应原列表长度
              lastMsg.userMsgIndex = totalOriginalMsgs - 2; // 用户消息在原数组中的索引
              this.setData({ messages: msgs });
            }

            this.setData({ sending: false });
            wx.showToast({
              title: '消息已发送',
              icon: 'success',
              duration: 1000,
            });
          } else if (data.type === 'error' || data.type === 'exercise_error') {
            console.error('Error:', data.message);
          }
        },
        (error) => {
          wx.showToast({
            title: '发送失败',
            icon: 'none',
            duration: 2000,
          });
          this.setData({ sending: false });
        }
      );
    } catch (error) {
      wx.showToast({
        title: '发送失败',
        icon: 'none',
        duration: 2000,
      });
      this.setData({ sending: false });
    }
  },

  scrollToBottom() {
    this.setData({ anchor: 'bottom' });
  },

  async handleGenerateExercise(e) {
    const messageIndex = e.currentTarget.dataset.msgIndex;
    
    if (this.data.exercisedIndices.includes(messageIndex)) {
      wx.showToast({ title: '您已经生成过题目了', icon: 'none', duration: 2000 });
      return;
    }
    if (this.data.generatingExercise) {
      wx.showToast({ title: '正在生成题目，请稍候...', icon: 'none', duration: 2000 });
      return;
    }

    this.setData({ generatingExercise: true });
    wx.showLoading({ title: '题目生成中...' });

    try {
      const res = await generateExercise(this.userId, messageIndex, 'medium');
      
      if (res.already_generated) {
        wx.showToast({ title: '您已经生成过题目了', icon: 'none', duration: 2000 });
        const indices = [...this.data.exercisedIndices, messageIndex];
        this.setData({ exercisedIndices: indices });
        return;
      }

      if (res.ok) {
        const indices = [...this.data.exercisedIndices, messageIndex];
        this.setData({ exercisedIndices: indices });
        wx.showToast({ title: '题目已生成', icon: 'success', duration: 1500 });
      }
    } catch (err) {
      wx.showToast({ title: '题目生成失败', icon: 'none', duration: 2000 });
    } finally {
      this.setData({ generatingExercise: false });
      wx.hideLoading();
    }
  },
});
