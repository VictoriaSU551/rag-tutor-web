const sampleConversations = [
  {
    userId: 1,
    name: '考研408助手',
    avatar: '/static/chat/avatar.png',
    messages: [
      { messageId: 1, from: 1, content: '你好！我是你的考研408学习助手。今天有什么需要帮助的吗？', time: Date.now() - 3600000, read: true },
      { messageId: 2, from: 0, content: '请解释一下二叉搜索树的定义和性质', time: Date.now() - 3500000, read: true },
      { messageId: 3, from: 1, content: '二叉搜索树（Binary Search Tree, BST）是一种特殊的二叉树，具有以下性质：\n\n1. **定义**：每个节点的值大于其左子树中所有节点的值，小于其右子树中所有节点的值\n\n2. **核心性质**：\n   - 左子树中所有值 < 节点值 < 右子树中所有值\n   - 左右子树也分别是二叉搜索树\n   - 不存在相等的节点值\n\n3. **优势**：\n   - 中序遍历可以得到有序序列\n   - 查找、插入、删除的平均时间复杂度为O(log n)\n\n4. **缺点**：\n   - 最坏情况下（退化为链表）时间复杂度为O(n)\n   - 解决方案：使用平衡二叉树（AVL树、红黑树等）', time: Date.now() - 3400000, read: true },
      { messageId: 4, from: 0, content: 'AVL树的旋转有几种类型？', time: Date.now() - 3200000, read: true },
      { messageId: 5, from: 1, content: 'AVL树通过旋转来维持平衡，共有4种基本旋转类型：\n\n**1. LL型（左左）**\n- 问题：新节点在失衡节点的左子树的左侧\n- 解决：右旋\n\n**2. RR型（右右）**\n- 问题：新节点在失衡节点的右子树的右侧\n- 解决：左旋\n\n**3. LR型（左右）**\n- 问题：新节点在失衡节点的左子树的右侧\n- 解决：先左旋后右旋\n\n**4. RL型（右左）**\n- 问题：新节点在失衡节点的右子树的左侧\n- 解决：先右旋后左旋\n\n旋转的核心是通过改变节点之间的关系来调整树的结构，使得任何节点的左右子树高度差不超过1。', time: Date.now() - 3100000, read: true },
    ],
  },
  {
    userId: 2,
    name: '算法刷题群',
    avatar: '/static/chat/avatar.png',
    messages: [
      { messageId: 6, from: 0, content: '最近的排序算法真题有吗？', time: Date.now() - 7200000, read: true },
      { messageId: 7, from: 1, content: '有的，2023年考研408真题第35题是关于快速排序的。题目要求分析快速排序在特定输入下的时间复杂度，并给出改进方案。这是一道经典的考查排序算法本质的题目。', time: Date.now() - 7100000, read: true },
    ],
  },
  {
    userId: 3,
    name: '操作系统讨论',
    avatar: '/static/chat/avatar.png',
    messages: [
      { messageId: 8, from: 0, content: '页表的多级结构有什么优缺点?', time: Date.now() - 1800000, read: true },
      { messageId: 9, from: 1, content: '多级页表的设计是为了解决单级页表的问题：\n\n**优点：**\n- 节省内存空间：只需要为实际使用的页表分配内存\n- 支持虚拟内存：可以让页表本身也放入虚拟内存\n- 灵活性更好：可以根据需要调整级数\n\n**缺点：**\n- 增加了访问延迟：每一级都需要一次内存访问\n- 实现复杂：需要处理多级转换\n- TLB命中率下降：更多的转换增加了TLB的压力\n\n为了缓解延迟问题，现代CPU都配备了转换后备缓冲区（TLB）来缓存频繁使用的地址转换。', time: Date.now() - 1700000, read: true },
    ],
  },
];

function cloneConversation(conversation) {
  return {
    ...conversation,
    messages: conversation.messages.map((message) => ({ ...message })),
  };
}

export function getConversationList() {
  return sampleConversations.map((conversation) => cloneConversation(conversation));
}

export function getConversationById(userId) {
  return sampleConversations.find((conversation) => String(conversation.userId) === String(userId));
}

export function markAllRead(userId) {
  const conversation = getConversationById(userId);
  if (!conversation) return;
  conversation.messages.forEach((message) => {
    message.read = true;
  });
}

export function appendMessage(userId, message) {
  const conversation = getConversationById(userId);
  if (!conversation) return;
  conversation.messages.push(message);
}
