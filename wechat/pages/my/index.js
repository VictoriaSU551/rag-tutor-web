import useToastBehavior from '~/behaviors/useToast';

Page({
  behaviors: [useToastBehavior],

  data: {
    isLoad: true,
    personalInfo: {
      nickname: '考研学生',
      avatar: '/static/chat/avatar.png',
      level: '初级',
      score: 2450,
      totalQuestions: 1250,
      correctRate: '72%',
    },
    settingList: [
      { name: '设置', icon: 'setting', type: 'setting', url: '/pages/setting/index' },
    ],
  },

  onLoad() {
    // 页面加载逻辑
  },

  onShow() {
    const Token = wx.getStorageSync('access_token');
    if (Token) {
      this.setData({ isLoad: true });
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
});
