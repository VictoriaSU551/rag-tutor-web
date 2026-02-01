import { register, login } from '../../api/auth';

Page({
  data: {
    isLogin: true, // true表示登录模式，false表示注册模式
    username: '',
    password: '',
    confirmPassword: '',
    isCheck: false,
    isSubmit: false,
    isLoading: false,
  },

  onUsernameChange(e) {
    this.setData({ username: e.detail.value });
    this.updateSubmitButton();
  },

  onPasswordChange(e) {
    this.setData({ password: e.detail.value });
    this.updateSubmitButton();
  },

  onConfirmPasswordChange(e) {
    this.setData({ confirmPassword: e.detail.value });
    this.updateSubmitButton();
  },

  onCheckChange(e) {
    const { value } = e.detail;
    // value 是一个数组，包含选中的复选框值
    const isChecked = value && Array.isArray(value) && value.includes('agree');
    this.setData({
      isCheck: isChecked,
    });
    this.updateSubmitButton();
  },

  updateSubmitButton() {
    const { isLogin, username, password, confirmPassword, isCheck } = this.data;
    
    let canSubmit = false;
    if (isLogin) {
      // 登录模式：需要用户名、密码和勾选同意
      canSubmit = username.trim() && password.trim() && isCheck;
    } else {
      // 注册模式：需要用户名、密码、确认密码相同且勾选同意
      canSubmit = username.trim() && password.trim() && 
                  password === confirmPassword && 
                  password.length >= 6 &&
                  isCheck;
    }
    this.setData({ isSubmit: canSubmit });
  },

  toggleMode() {
    this.setData({ 
      isLogin: !this.data.isLogin, 
      isSubmit: false,
      username: '',
      password: '',
      confirmPassword: '',
      isCheck: false,
    });
  },

  async submitForm() {
    if (this.data.isLoading) return;

    const { isLogin, username, password, confirmPassword } = this.data;

    // 验证
    if (!username.trim()) {
      wx.showToast({
        title: '请输入用户名',
        icon: 'none',
      });
      return;
    }

    if (!password.trim()) {
      wx.showToast({
        title: '请输入密码',
        icon: 'none',
      });
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      wx.showToast({
        title: '两次输入密码不一致',
        icon: 'none',
      });
      return;
    }

    if (!isLogin && password.length < 6) {
      wx.showToast({
        title: '密码至少6个字符',
        icon: 'none',
      });
      return;
    }

    this.setData({ isLoading: true });

    try {
      let res;
      if (isLogin) {
        res = await login(username, password);
      } else {
        res = await register(username, password);
      }

      // 保存token和用户信息
      wx.setStorageSync('access_token', res.token);
      wx.setStorageSync('userInfo', JSON.stringify(res.user));

      wx.showToast({
        title: isLogin ? '登录成功' : '注册成功',
        icon: 'success',
        duration: 1500,
      });

      // 延迟后跳转到首页
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/my/index',
        });
      }, 1500);
    } catch (error) {
      console.error('登录/注册错误:', error);
      let errorMsg = isLogin ? '登录失败' : '注册失败';
      
      // 处理不同格式的错误
      if (error && error.detail) {
        errorMsg = error.detail;
      } else if (error && error.message) {
        errorMsg = error.message;
      } else if (typeof error === 'string') {
        errorMsg = error;
      }
      
      wx.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 2000,
      });
    } finally {
      this.setData({ isLoading: false });
    }
  },
});
