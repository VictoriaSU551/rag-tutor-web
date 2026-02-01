import { register, login } from '~/api/auth';

Page({
  data: {
    phoneNumber: '',
    isPhoneNumber: false,
    isCheck: false,
    isSubmit: false,
    isPasswordLogin: false,
    passwordInfo: {
      account: '',
      password: '',
    },
    radioValue: '',
    isLoading: false,
  },

  changeSubmit() {
    if (this.data.isPasswordLogin) {
      if (this.data.passwordInfo.account !== '' && this.data.passwordInfo.password !== '' && this.data.isCheck) {
        this.setData({ isSubmit: true });
      } else {
        this.setData({ isSubmit: false });
      }
    } else if (this.data.isPhoneNumber && this.data.isCheck) {
      this.setData({ isSubmit: true });
    } else {
      this.setData({ isSubmit: false });
    }
  },

  onPhoneInput(e) {
    const isPhoneNumber = /^[1][3,4,5,7,8,9][0-9]{9}$/.test(e.detail.value);
    this.setData({
      isPhoneNumber,
      phoneNumber: e.detail.value,
    });
    this.changeSubmit();
  },

  onCheckChange(e) {
    const { value } = e.detail;
    this.setData({
      radioValue: value,
      isCheck: value === 'agree',
    });
    this.changeSubmit();
  },

  onAccountChange(e) {
    this.setData({ 
      passwordInfo: { ...this.data.passwordInfo, account: e.detail.value } 
    });
    this.changeSubmit();
  },

  onPasswordChange(e) {
    this.setData({ 
      passwordInfo: { ...this.data.passwordInfo, password: e.detail.value } 
    });
    this.changeSubmit();
  },

  changeLogin() {
    this.setData({ isPasswordLogin: !this.data.isPasswordLogin, isSubmit: false });
  },

  async login() {
    // 登录逻辑
    if (this.data.isLoading) return;

    const { account, password } = this.data.passwordInfo;

    this.setData({ isLoading: true });

    try {
      const res = await login(account, password);
      
      // 保存token
      wx.setStorageSync('access_token', res.token);
      
      // 保存用户信息
      wx.setStorageSync('userInfo', JSON.stringify(res.user));

      wx.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500,
      });

      // 延迟后跳转到我的页面
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/my/index',
        });
      }, 1500);
    } catch (error) {
      wx.showToast({
        title: error.detail || '登录失败',
        icon: 'none',
        duration: 2000,
      });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  async register() {
    // 注册逻辑
    if (this.data.isLoading) return;

    const { account, password } = this.data.passwordInfo;

    this.setData({ isLoading: true });

    try {
      const res = await register(account, password);
      
      // 保存token
      wx.setStorageSync('access_token', res.token);
      
      // 保存用户信息
      wx.setStorageSync('userInfo', JSON.stringify(res.user));

      wx.showToast({
        title: '注册成功',
        icon: 'success',
        duration: 1500,
      });

      // 延迟后跳转到我的页面
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/my/index',
        });
      }, 1500);
    } catch (error) {
      wx.showToast({
        title: error.detail || '注册失败',
        icon: 'none',
        duration: 2000,
      });
    } finally {
      this.setData({ isLoading: false });
    }
  },
});
