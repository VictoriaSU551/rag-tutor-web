import useToastBehavior from '../../behaviors/useToast';
import { me } from '../../api/user';

Page({
  behaviors: [useToastBehavior],

  data: {
    isLoad: false,
    personalInfo: {
      name: '加载中...',
      image: '/static/chat/avatar.png',
      star: '未知',
      city: '地球',
    },
    gridList: [
      { name: '全部', icon: 'view-list', type: 'all' },
      { name: '完成', icon: 'check-circle-filled', type: 'done' },
      { name: '进行中', icon: 'circle', type: 'process' },
      { name: '暂存', icon: 'bookmark', type: 'save' },
    ],
    service: [
      { name: '成就', image: '/static/chat/avatar.png' },
      { name: '排行', image: '/static/chat/avatar.png' },
      { name: '反馈', image: '/static/chat/avatar.png' },
      { name: '关于', image: '/static/chat/avatar.png' },
    ],
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
      // 未登录时，2秒后跳转到登录页
      setTimeout(() => {
        const stillNoToken = wx.getStorageSync('access_token');
        if (!stillNoToken) {
          wx.navigateTo({ url: '/pages/login/login' });
        }
      }, 2000);
    }
  },

  async loadUserInfo() {
    try {
      const token = wx.getStorageSync('access_token');
      console.log('获取用户信息 - token:', token);
      
      if (!token) {
        console.log('没有 token，用户未登录');
        this.setData({ isLoad: false });
        return;
      }
      
      const userInfo = await me();
      console.log('获取到用户信息:', userInfo);
      
      this.setData({
        isLoad: true,
        personalInfo: {
          name: userInfo.username || userInfo.name || '用户',
          image: userInfo.avatar || '/static/chat/avatar.png',
          star: '学者',
          city: '地球',
        },
      });
    } catch (error) {
      console.error('加载用户信息失败:', error);
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
