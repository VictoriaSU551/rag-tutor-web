import { 
  getCurrentQuiz, 
  submitQuizAnswer, 
  addWrongQuestion, 
  getWrongBook,
  deleteWrongQuestion 
} from '~/api/quiz';

Page({
  data: {
    activeTab: 'practice',
    quizList: [],
    wrongList: [],
    loading: true,
    submitting: false,
    selectedSessionId: null,
  },

  onLoad() {
    this.loadWrongBook();
  },

  onShow() {
    this.loadWrongBook();
  },

  async loadWrongBook() {
    try {
      const wrongQuestions = await getWrongBook();
      this.setData({ wrongList: wrongQuestions, loading: false });
    } catch (error) {
      console.error('获取错题本失败:', error);
      this.setData({ loading: false });
    }
  },

  switchTab(event) {
    const tab = event.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
    
    if (tab === 'wrong') {
      this.loadWrongBook();
    }
  },

  selectAnswer(event) {
    const { questionIndex, optionIndex, disabled } = event.currentTarget.dataset;

    // 如果已提交，不允许修改答案
    if (disabled) return;

    const quizList = this.data.quizList;
    quizList[questionIndex].userAnswer = optionIndex;
    this.setData({ quizList });
  },

  async submitAnswer(event) {
    const { questionIndex } = event.currentTarget.dataset;
    
    if (this.data.submitting) return;

    this.setData({ submitting: true });

    try {
      const quizList = this.data.quizList;
      const quiz = quizList[questionIndex];

      if (quiz.userAnswer === null) {
        wx.showToast({ title: '请先选择答案', icon: 'none' });
        this.setData({ submitting: false });
        return;
      }

      // 调用后端API提交答案
      const result = await submitQuizAnswer(
        this.data.selectedSessionId,
        quiz.userAnswer.toString()
      );

      if (result.correct) {
        wx.showToast({
          title: '回答正确!',
          icon: 'success',
          duration: 1500,
        });
        
        quiz.submitted = true;
        this.setData({ quizList });
      } else {
        quiz.submitted = true;
        quiz.showAnalysis = true;
        
        if (result.can_add_wrong) {
          this.setData({ 
            quizList,
            showAddWrongButton: true,
            currentQuestionIndex: questionIndex,
          });
        } else {
          this.setData({ quizList });
        }
        
        wx.showToast({
          title: '回答不正确',
          icon: 'none',
          duration: 1500,
        });
      }
    } catch (error) {
      wx.showToast({
        title: error.detail || '提交失败',
        icon: 'none',
        duration: 2000,
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  async addWrong(event) {
    const { questionIndex } = event.currentTarget.dataset;
    
    try {
      const quizList = this.data.quizList;
      const quiz = quizList[questionIndex];

      await addWrongQuestion(
        this.data.selectedSessionId,
        quiz.userAnswer.toString()
      );

      wx.showToast({
        title: '已添加到错题本',
        icon: 'success',
        duration: 1500,
      });

      this.setData({ quizList });
    } catch (error) {
      wx.showToast({
        title: '添加失败',
        icon: 'none',
        duration: 2000,
      });
    }
  },

  toggleAnalysis(event) {
    const { questionIndex } = event.currentTarget.dataset;
    const quizList = this.data.quizList;
    quizList[questionIndex].showAnalysis = !quizList[questionIndex].showAnalysis;
    this.setData({ quizList });
  },

  toggleWrongAnalysis(event) {
    const { questionIndex } = event.currentTarget.dataset;
    const wrongList = this.data.wrongList;
    wrongList[questionIndex].showAnalysis = !wrongList[questionIndex].showAnalysis;
    this.setData({ wrongList });
  },

  async deleteWrong(event) {
    const { questionIndex } = event.currentTarget.dataset;
    
    wx.showModal({
      title: '删除确认',
      content: '确定要删除此题目吗?',
      success: async (res) => {
        if (res.confirm) {
          try {
            await deleteWrongQuestion(questionIndex);
            this.loadWrongBook();
            wx.showToast({
              title: '已删除',
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

  generateQuiz() {
    wx.showToast({ title: '功能开发中...', icon: 'none' });
  },
});
