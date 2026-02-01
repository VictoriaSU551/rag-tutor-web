// pages/chat/index.js
import { getSessionDetail } from '~/api/session';
import { streamChat } from '~/api/chat';

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
  },

  onLoad(options) {
    const targetId = options.userId || 1;
    this.userId = targetId;
    this.loadSessionDetail();
  },

  onReady() {},

  onShow() {},

  onHide() {},

  onUnload() {},

  async loadSessionDetail() {
    try {
      const sessionDetail = await getSessionDetail(this.userId);
      
      // 转换消息格式
      const messages = (sessionDetail.messages || []).map((msg) => ({
        messageId: msg.timestamp,
        from: msg.role === 'user' ? 0 : 1,
        content: msg.content,
        time: msg.timestamp * 1000,
        read: true,
        sources: msg.sources || [],
      }));

      this.setData({
        userId: sessionDetail.id,
        name: sessionDetail.title,
        messages,
        loading: false,
      });

      wx.nextTick(this.scrollToBottom);
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
    wx.nextTick(this.scrollToBottom);
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
    wx.nextTick(this.scrollToBottom);

    try {
      // 发送到服务器并获取流式回复
      streamChat(
        this.userId,
        content,
        'medium',
        (data) => {
          // 处理流式消息
          if (data.type === 'delta') {
            // 更新最后一条助手消息
            const msgs = this.data.messages;
            const lastMessage = msgs[msgs.length - 1];
            
            if (lastMessage && lastMessage.from === 1) {
              lastMessage.content += data.text;
            } else {
              msgs.push({
                messageId: Date.now(),
                from: 1,
                content: data.text,
                time: Date.now(),
                read: true,
              });
            }
            
            this.setData({ messages: msgs });
            wx.nextTick(this.scrollToBottom);
          } else if (data.type === 'meta') {
            // 处理源信息
            const msgs = this.data.messages;
            const lastMessage = msgs[msgs.length - 1];
            if (lastMessage && lastMessage.from === 1) {
              lastMessage.sources = data.sources || [];
            }
            this.setData({ messages: msgs });
          } else if (data.type === 'exercise') {
            // 处理习题（可选）
            console.log('练习题:', data.data);
          } else if (data.type === 'done') {
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
});
