import { 
  getCurrentQuiz, 
  submitQuizAnswer, 
  addWrongQuestion, 
  getWrongBook,
  deleteWrongQuestion,
  getQuizQuestions
} from '../../api/quiz';

const towxml = require('../../towxml/index.js');

Page({
  data: {
    activeTab: 'practice',
    quizList: [],
    wrongList: [],
    loading: true,
    submitting: false,
    sessionId: null,
  },

  onLoad() {
    this.loadQuizQuestions();
    this.loadWrongBook();
  },

  onShow() {
    this.loadQuizQuestions();
    this.loadWrongBook();
  },

  renderMarkdown(markdown) {
    if (!markdown) return null;
    try {
      return towxml(markdown, 'markdown', {
        theme: 'light',
        useInline: false
      });
    } catch (e) {
      console.error('Markdown render error:', e);
      return null;
    }
  },

  async loadQuizQuestions() {
    try {
      this.setData({ loading: true });
      const result = await getQuizQuestions(1, 200);
      const items = (result.items || []); // 按最新的题目在下排序
      
      // 转换为前端需要的格式
      const quizList = items.map((item, idx) => {
        // 确定正确答案（支持多种字段名）
        const correctAnswerField = item.correct_answer || item.answer || 'A';
        const correctIndex = this.optionToIndex(correctAnswerField, item.options);
        
        // 调试：打印原始数据
        console.log(`Question ${idx}:`, {
          correct_answer: item.correct_answer,
          answer: item.answer,
          resolved: correctAnswerField,
          index: correctIndex
        });
        
        return {
          id: item.id,
          question: item.question,
          options: item.options || [],
          correctAnswer: correctIndex,
          correctAnswerDisplay: correctAnswerField.trim().charAt(0).toUpperCase(),  // 直接保存字母用于显示
          explanation: item.explanation || '暂无解析',
          explanationNodes: this.renderMarkdown(item.explanation),  // 添加 markdown 渲染
          difficulty: item.difficulty || '中等',
          userAnswer: null,
          submitted: false,
          showAnalysis: false,
        };
      });
      this.setData({ quizList, loading: false });
    } catch (error) {
      console.error('获取题目列表失败:', error);
      wx.showToast({
        title: '获取题目列表失败',
        icon: 'none',
        duration: 2000,
      });
      this.setData({ loading: false });
    }
  },

  // 将答案字母转为选项索引 (A->0, B->1, ...)
  optionToIndex(answer, options) {
    if (!answer || !options || options.length === 0) return 0;
    const letter = answer.trim().charAt(0).toUpperCase();
    const index = letter.charCodeAt(0) - 65;
    return (index >= 0 && index < options.length) ? index : 0;
  },

  // 将选项索引转为答案字母 (0->A, 1->B, ...)
  indexToOption(index) {
    if (index === null || index === undefined) return '';
    return String.fromCharCode(65 + index);
  },

  async loadWrongBook() {
    try {
      const wrongQuestions = await getWrongBook();
      // 后端返回的错题本格式可能有两种：
      // 1. 从 session.meta 中的 wrong_questions（有 user_first_answer）
      // 2. 从用户 meta 中手动添加的错题（有完整 options）
      const processedWrongList = wrongQuestions.map((item, idx) => {
        // 处理 user_first_answer 到 userAnswer
        let userAnswerIndex = null;
        if (item.user_first_answer !== undefined && item.user_first_answer !== null) {
          // user_first_answer 是用户答案的字母或选项索引
          const answer = item.user_first_answer.trim();
          const charCode = answer.charCodeAt(0);
          // 如果是大写字母（A-Z）
          if (charCode >= 65 && charCode <= 90) {
            userAnswerIndex = charCode - 65;
          } else if (!isNaN(answer)) {
            // 如果是数字
            userAnswerIndex = parseInt(answer);
          }
        }

        // 处理 correct_answer 到 correctAnswerIndex
        let correctAnswerIndex = this.optionToIndex(item.correct_answer, item.options);

        return {
          question: item.question,
          options: item.options || [],
          correctAnswer: item.correct_answer,
          correctAnswerIndex: correctAnswerIndex,
          userAnswer: item.user_first_answer,
          userAnswerIndex: userAnswerIndex,
          explanation: item.explanation || '暂无解析',
          explanationNodes: this.renderMarkdown(item.explanation),  // 添加 markdown 渲染
          difficulty: item.difficulty || '中等',
          showAnalysis: false,
        };
      });
      this.setData({ wrongList: processedWrongList, loading: false });
    } catch (error) {
      console.error('获取错题本失败:', error);
      wx.showToast({
        title: '获取错题本失败',
        icon: 'none',
        duration: 2000,
      });
      this.setData({ loading: false });
    }
  },

  switchTab(event) {
    const tab = event.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
    
    if (tab === 'wrong') {
      this.loadWrongBook();
    } else if (tab === 'practice') {
      this.loadQuizQuestions();
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

      // 本地判题（题目来自独立题目表，不需要 session）
      const isCorrect = quiz.userAnswer === quiz.correctAnswer;

      if (isCorrect) {
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
        
        this.setData({ quizList });
        
        wx.showToast({
          title: '回答不正确',
          icon: 'none',
          duration: 1500,
        });
      }
    } catch (error) {
      wx.showToast({
        title: '提交失败',
        icon: 'none',
        duration: 2000,
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  async addWrong(event) {
    const { questionIndex } = event.currentTarget.dataset;
    
    // 此功能用于在 quiz/current 接口的流程中添加错题
    // 对于独立题目表中的题目，暂不支持直接添加到错题本
    // 用户可以手动记录或稍后使用 add_manual_wrong 接口
    
    wx.showToast({
      title: '该功能正在开发中',
      icon: 'none',
      duration: 2000,
    });
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
      content: '确定要删除此错题吗?',
      confirmText: '删除',
      cancelText: '取消',
      success: async (res) => {
        if (res.confirm) {
          try {
            await deleteWrongQuestion(questionIndex);
            wx.showToast({
              title: '已删除',
              icon: 'success',
              duration: 1500,
            });
            // 重新加载错题本
            await this.loadWrongBook();
          } catch (error) {
            console.error('删除错题失败:', error);
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
