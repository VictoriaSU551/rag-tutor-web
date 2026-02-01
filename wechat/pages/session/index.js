// pages/session/index.js
import { getSessions, createSession, deleteSession } from '../../api/session';

Page({
  data: {
    messageList: [],
    loading: true,
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

  async getMessageList() {
    this.setData({ loading: true });
    try {
      const sessions = await getSessions();
      
      // 格式化会话列表
      const messageList = sessions.map((session) => ({
        userId: session.id,
        name: session.title,
        avatar: '/static/chat/avatar.png', // 使用默认头像
        lastMessage: session.title,
        time: new Date(session.updated_at).getTime(),
        messages: [],
      }));

      // 为每条会话的最后一条消息添加格式化时间
      messageList.forEach((conversation) => {
        conversation.formattedTime = this.formatUpdateTime(conversation.time);
      });

      this.setData({ messageList, loading: false });
    } catch (error) {
      wx.showToast({
        title: '获取会话列表失败',
        icon: 'none',
        duration: 2000,
      });
      this.setData({ loading: false });
    }
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

  async addSession() {
    try {
      const newSession = await createSession();
      wx.navigateTo({ url: `/pages/chat/index?userId=${newSession.id}` });
    } catch (error) {
      wx.showToast({
        title: '创建会话失败',
        icon: 'none',
        duration: 2000,
      });
    }
  },

  // 长按删除会话
  async onSessionLongPress(event) {
    const { userId } = event.currentTarget.dataset;
    
    wx.showModal({
      title: '删除会话',
      content: '确定要删除此会话吗?',
      success: async (res) => {
        if (res.confirm) {
          try {
            await deleteSession(userId);
            this.getMessageList();
            wx.showToast({
              title: '删除成功',
              icon: 'success',
              duration: 1500,
            });
          } catch (error) {
            wx.showToast({
              title: '删除失败',
              icon: 'none',
              duration: 2000,
            });
          }
        }
      },
    });
  },
});
