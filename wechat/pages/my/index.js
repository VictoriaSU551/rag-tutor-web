import useToastBehavior from '~/behaviors/useToast';
import { me } from '~/api/user';

Page({
  behaviors: [useToastBehavior],

  data: {
    isLoad: false,
    personalInfo: {
      nickname: '加载中...',
      avatar: '/static/chat/avatar.png',
      level: '未知',
      score: 0,
      totalQuestions: 0,
      correctRate: '0%',
    },
    settingList: [
      { name: '设置', icon: 'setting', type: 'setting', url: '/pages/setting/index' },
    ],
  },

  onLoad() {
    this.loadUserInfo();
  },

  onShow() {
    const Token = wx.getStorageSync('access_token');
    if (Token) {
      this.loadUserInfo();
    } else {
      this.setData({ isLoad: false });
    }
  },

  async loadUserInfo() {
    try {
      const userInfo = await me();
      
      this.setData({
        isLoad: true,
        personalInfo: {
          nickname: userInfo.username,
          avatar: userInfo.avatar || '/static/chat/avatar.png',
          level: '初级',
          score: 0,
          totalQuestions: 0,
          correctRate: '0%',
        },
      });
    } catch (error) {
      // 如果获取用户信息失败，可能是没有登录
      this.setData({ isLoad: false });
    }
  },

  onLogin(e) {
    wx.navigateTo({
      url: '/pages/login/login',
    });
  },

  onEleClick(e) {
    const { name, url } = e.currentTarget.dataset.data;
    if (url) {
      wx.navigateTo({ url });
    } else {
      this.onShowToast('#t-toast', name);
    }
  },

  // 登出功能
  onLogout() {
    wx.showModal({
      title: '确认登出',
      content: '确定要登出吗?',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('access_token');
          wx.removeStorageSync('userInfo');
          this.setData({ isLoad: false });
          wx.switchTab({
            url: '/pages/session/index',
          });
        }
      },
    });
  },
});
