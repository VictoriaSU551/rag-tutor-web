// pages/session/index.js
import { getSessions, createSession, deleteSession, getSessionDetail } from '../../api/session';

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

  getAvatarForSession(sessionId) {
    const avatars = [
      '/static/avatar1.png',
      '/static/image1.png',
      '/static/image2.png',
      '/static/icon_doc.png',
      '/static/icon_map.png',
      '/static/icon_wx.png',
      '/static/icon_qq.png',
      '/static/icon_td.png',
    ];
    const idStr = String(sessionId || '0');
    let hash = 0;
    for (let i = 0; i < idStr.length; i += 1) {
      hash = (hash * 31 + idStr.charCodeAt(i)) % 100000;
    }
    const index = hash % avatars.length;
    return avatars[index];
  },

  async getMessageList() {
    this.setData({ loading: true });
    try {
      // 检查登录状态
      const token = wx.getStorageSync('access_token');
      if (!token) {
        this.setData({ loading: false });
        wx.navigateTo({ url: '/pages/login/login' });
        return;
      }
      
      const sessions = await getSessions();

      const detailList = await Promise.all(
        (sessions || []).map(async (session) => {
          try {
            const detail = await getSessionDetail(session.id);
            return { session, detail };
          } catch (e) {
            return { session, detail: null };
          }
        })
      );

      const messageList = detailList.map(({ session, detail }) => {
        const messages = (detail && detail.messages) ? detail.messages : [];
        const last = this.getLastPreviewMessage(messages);
        return {
          userId: session.id,
          name: session.title,
          avatar: this.getAvatarForSession(session.id),
          lastMessage: last || '点击继续对话',
          time: this.normalizeTimestamp(session.updated_at),
          messages: [],
          formattedTime: this.formatUpdateTime(this.normalizeTimestamp(session.updated_at)),
        };
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

  getLastPreviewMessage(messages) {
    if (!messages || messages.length === 0) return '';
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const msg = messages[i];
      if (msg && msg.content) {
        const text = msg.content.replace(/\s+/g, ' ').trim();
        return text.length > 40 ? `${text.slice(0, 40)}…` : text;
      }
    }
    return '';
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

  normalizeTimestamp(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) {
      return Date.now();
    }
    return num < 1e12 ? num * 1000 : num;
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

  // 点击删除按钮
  onDeleteSessionTap(event) {
    const { userId } = event.currentTarget.dataset;
    this.confirmDeleteSession(userId);
  },

  confirmDeleteSession(userId) {
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
