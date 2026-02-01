// pages/session/index.js
import { getConversationList } from '~/utils/sampleData';

Page({
  data: {
    messageList: [],
    loading: false,
  },

  onLoad() {
    this.getMessageList();
  },

  onReady() {},

  onShow() {
    this.getMessageList();
  },

  onHide() {},

  onUnload() {},

  getMessageList() {
    const messageList = getConversationList();
    // 为每条会话的最后一条消息添加格式化时间
    messageList.forEach((conversation) => {
      const lastMessage = conversation.messages[conversation.messages.length - 1];
      if (lastMessage) {
        lastMessage.formattedTime = this.formatUpdateTime(lastMessage.time);
      }
    });
    this.setData({ messageList, loading: false });
  },

  toChat(event) {
    const { userId } = event.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/chat/index?userId=${userId}` });
  },

  formatUpdateTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;

    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  },

  addSession() {
    wx.showToast({ title: '功能开发中...', icon: 'none' });
  },
});
