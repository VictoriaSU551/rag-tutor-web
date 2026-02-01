Page({
  data: {
    activeTab: 'practice',
    quizList: [
      {
        question: '以下关于二叉搜索树的叙述中，正确的是_________',
        type: '单选题',
        options: [
          '二叉搜索树中序遍历得到的数列是递减的',
          '二叉搜索树中任意节点的左子树值都小于节点值，右子树值都大于节点值',
          '二叉搜索树的高度一定是 O(log n)',
          '二叉搜索树可以有相等的节点值',
        ],
        correctAnswer: 1,
        userAnswer: null,
        submitted: false,
        showAnalysis: false,
        analysis:
          '二叉搜索树（BST）的定义特征就是：左子树中的所有值 < 节点值 < 右子树中的所有值。\n\n选项分析：\nA错误：中序遍历应该得到递增序列\nB正确：这就是BST的定义\nC错误：最坏情况下退化为链表，高度为 O(n)\nD错误：BST不允许重复值',
      },
      {
        question: 'AVL树的平衡因子定义为_________',
        type: '单选题',
        options: [
          '左子树高度减去右子树高度',
          '左子树节点数减去右子树节点数',
          '左子树高度加上右子树高度',
          '树的高度减去树的度数',
        ],
        correctAnswer: 0,
        userAnswer: null,
        submitted: false,
        showAnalysis: false,
        analysis:
          'AVL树通过平衡因子来维持树的平衡。\n\n平衡因子 = 左子树高度 - 右子树高度\n\nAVL树要求每个节点的平衡因子必须在 [-1, 0, 1] 范围内。如果超出这个范围，需要进行旋转操作来恢复平衡。',
      },
      {
        question: '在进行堆排序时，建立初始堆的时间复杂度是_________',
        type: '单选题',
        options: [
          'O(n)',
          'O(n log n)',
          'O(log n)',
          'O(n²)',
        ],
        correctAnswer: 0,
        userAnswer: null,
        submitted: false,
        showAnalysis: false,
        analysis:
          '建立初始堆可以通过自下而上的调整方式进行。\n\n关键分析：\n- 第1层有 1 个节点，需要调整 0 次\n- 第2层有 2 个节点，每个需要调整 1 次\n- 第3层有 4 个节点，每个需要调整 2 次\n- ...\n\n总次数 = 0×1 + 1×2 + 2×4 + ... = O(n)\n\n而整个排序过程的时间复杂度是 O(n log n)。',
      },
    ],
    wrongList: [
      {
        question: '以下关于树的叙述中，错误的是_________',
        type: '单选题',
        options: [
          '树是一种非线性数据结构',
          '树中任意两个节点之间的路径唯一',
          '树中可以有环',
          '树的根节点没有父节点',
        ],
        correctAnswer: 2,
        userAnswer: 2,
        submitted: true,
        showAnalysis: false,
        analysis:
          '树的定义中，关键特征是：树中任意两节点间有且仅有一条路径，因此树中不能有环。\n\nC选项错误：如果存在环，就不是树，而是图。\n\n树的其他特征：\n- 非线性数据结构（A正确）\n- 任意两节点间路径唯一（B正确）\n- 根节点无父节点（D正确）',
      },
    ],
  },

  onLoad() {
    // 初始化页面
  },

  switchTab(event) {
    const tab = event.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  },

  selectAnswer(event) {
    const { questionIndex, optionIndex, disabled } = event.currentTarget.dataset;

    // 如果已提交，不允许修改答案
    if (disabled) return;

    const quizList = this.data.quizList;
    quizList[questionIndex].userAnswer = optionIndex;
    this.setData({ quizList });
  },

  submitAnswer(event) {
    const { questionIndex } = event.currentTarget.dataset;
    const quizList = this.data.quizList;

    if (quizList[questionIndex].userAnswer === null) {
      wx.showToast({ title: '请先选择答案', icon: 'none' });
      return;
    }

    quizList[questionIndex].submitted = true;

    // 如果答错，添加到错题本
    if (quizList[questionIndex].userAnswer !== quizList[questionIndex].correctAnswer) {
      const wrongList = this.data.wrongList;
      const wrongQuestion = {
        ...quizList[questionIndex],
        showAnalysis: false,
      };
      // 检查是否已在错题本中
      const isDuplicate = wrongList.some(
        (item) =>
          item.question === wrongQuestion.question && item.userAnswer === wrongQuestion.userAnswer,
      );
      if (!isDuplicate) {
        wrongList.push(wrongQuestion);
      }
      this.setData({ quizList, wrongList });
    } else {
      this.setData({ quizList });
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

  generateQuiz() {
    wx.showToast({ title: '功能开发中...', icon: 'none' });
  },
});
