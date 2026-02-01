// pages/chat/index.js
import { getConversationById, appendMessage, markAllRead } from '~/utils/sampleData';

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
  },

  onLoad(options) {
    const targetId = options.userId || 1;
    const conversation = getConversationById(targetId);
    if (conversation) {
      markAllRead(targetId);
      this.setData({
        userId: conversation.userId,
        avatar: conversation.avatar,
        name: conversation.name,
        messages: conversation.messages,
      });
      wx.nextTick(this.scrollToBottom);
    }
  },

  onReady() {},

  onShow() {},

  onHide() {},

  onUnload() {},

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

  sendMessage() {
    const { userId, messages, input: content } = this.data;
    if (!content) return;
    const message = {
      messageId: Date.now(),
      from: 0,
      content,
      time: Date.now(),
      read: true,
    };
    appendMessage(userId, message);
    this.setData({ input: '', messages: [...messages, message] });
    wx.nextTick(this.scrollToBottom);
  },

  scrollToBottom() {
    this.setData({ anchor: 'bottom' });
  },
});
