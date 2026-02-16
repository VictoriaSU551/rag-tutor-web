<template>
  <div class="h-full flex flex-col px-4 py-3">
    <header class="flex items-center justify-between gap-4 mb-3">
      <div>
        <div class="text-2xl font-semibold">道道的智能学习助手</div>
        <div class="text-sm text-gray-500">今日的努力，是明日的花开！祝您学习愉快！</div>
      </div>
      <div class="flex items-center gap-3">
        <img id="avatar" class="w-10 h-10 rounded-full border" src="/img/default_avatar.svg" />
        <div class="text-sm">
          <div id="username" class="font-medium">未登录</div>
          <button id="btnLogout" class="text-orange-600 hidden">退出</button>
        </div>
      </div>
    </header>

    <main class="flex-1 layout-container min-h-0">
      <section class="chatbox layout-section p-4" data-section="sessions">
        <div class="section-header">
          <button class="collapse-btn" data-toggle="sessions" title="展开/收起">◀</button>
          <div class="font-semibold flex-1">会话列表</div>
          <button id="btnNewSession" class="text-sm text-orange-600 font-medium">新建</button>
        </div>
        <div class="section-content">
          <div id="sessionList" class="space-y-2 overflow-auto grow pr-1"></div>
        </div>
      </section>

      <div class="resize-handle" data-resize="between-sessions-chat"></div>

      <section class="chatbox layout-section p-4" data-section="chat">
        <div class="section-header">
          <div class="font-semibold flex-1">对话</div>
          <button id="btnWrongbook" class="text-sm text-orange-700 underline">错题本</button>
        </div>
        <div class="section-content">
          <div id="chatArea" class="space-y-3 overflow-auto grow pr-2"></div>
          <div id="sources" class="mt-2 text-xs text-gray-500 border-t pt-2"></div>
          <div class="mt-3 flex gap-2 items-end">
            <textarea
              id="q"
              class="flex-1 border rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-inset resize-none overflow-hidden"
              placeholder="输入你的问题（例如：进程与线程区别？死锁的四个必要条件？）"
              rows="1"
              style="line-height: 1.5; min-height: 42px; max-height: 200px;"
            ></textarea>
            <button
              id="btnAsk"
              class="px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors flex items-center justify-center flex-shrink-0"
              style="height: 48px; width: 60px;"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
              </svg>
            </button>
          </div>
        </div>
      </section>

      <div class="resize-handle" data-resize="between-chat-quiz"></div>

      <section class="chatbox layout-section p-4" data-section="quiz">
        <div class="section-header">
          <button class="collapse-btn" data-toggle="quiz" title="展开/收起">▶</button>
          <div class="font-semibold flex-1">题目列表</div>
          <select id="quizDifficulty" class="text-xs border rounded px-2 py-1 mr-2">
            <option value="medium">中等</option>
            <option value="easy">简单</option>
            <option value="hard">困难</option>
          </select>
          <button id="btnClearAnswers" class="text-xs text-orange-600 hidden">清空答案</button>
        </div>
        <div class="section-content">
          <div id="quizBox" class="text-sm text-gray-700 overflow-auto grow space-y-4">
            <div class="text-center text-gray-400">暂无练习题（回答后点击"生成一道题"）</div>
          </div>
        </div>
      </section>
    </main>
  </div>

  <div id="authModal" class="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
    <div class="chatbox w-full max-w-md p-5">
      <div class="text-xl font-semibold">登录 / 注册</div>
      <div class="text-sm text-gray-500 mt-1">用户名支持中英文/数字/特殊字符；密码必须为6位数字</div>

      <div class="mt-4 space-y-2">
        <input id="inUser" class="w-full border rounded-xl p-3" placeholder="用户名" />
        <input id="inPwd" class="w-full border rounded-xl p-3" placeholder="6位数字密码" />
      </div>

      <div class="mt-4 flex gap-2">
        <button id="btnLogin" class="flex-1 px-4 py-2 rounded-xl bg-orange-500 text-white font-medium">登录</button>
        <button id="btnReg" class="flex-1 px-4 py-2 rounded-xl border border-orange-300 text-orange-700 font-medium">注册</button>
      </div>

      <div class="mt-4">
        <div class="text-sm font-medium">头像（可选）</div>
        <input id="inAvatar" type="file" accept="image/png,image/jpeg,image/webp" class="mt-2" />
        <div class="text-xs text-gray-500 mt-1">不上传则使用默认白色头像</div>
      </div>

      <div id="authErr" class="mt-3 text-sm text-red-600"></div>
    </div>
  </div>

  <div id="wrongModal" class="fixed inset-0 bg-black/40 hidden items-center justify-center p-4">
    <div class="chatbox w-full max-w-6xl h-[80vh] p-5 flex flex-col">
      <div class="flex items-center justify-between mb-4">
        <div class="text-xl font-semibold">错题本</div>
        <button id="btnCloseWrong" class="text-gray-500">关闭</button>
      </div>

      <div class="flex flex-1 gap-4 min-h-0">
        <div class="flex-1 bg-gray-50 rounded-lg p-4 overflow-auto">
          <div class="font-medium mb-3">错题列表</div>
          <div id="wrongList" class="space-y-2"></div>
        </div>

        <div class="flex-[2] bg-white rounded-lg p-4 overflow-auto">
          <div class="font-medium mb-3">错题详情</div>
          <div id="wrongDetail" class="text-sm text-gray-500">请选择左侧的错题查看详情</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted } from 'vue';
import { marked } from 'marked';
import renderMathInElement from 'katex/contrib/auto-render';

const apiBase = import.meta.env.VITE_API_BASE || '';
let activeEventSource = null;

const buildApiUrl = (path) => {
  if (!path) return path;
  if (path.startsWith('http')) return path;
  if (!apiBase) return path;
  return `${apiBase}${path.startsWith('/') ? path : `/${path}`}`;
};

onBeforeUnmount(() => {
  if (activeEventSource) {
    activeEventSource.close();
    activeEventSource = null;
  }
});

onMounted(() => {
  let TOKEN = localStorage.getItem('token') || '';
  let USER = JSON.parse(localStorage.getItem('user') || 'null');
  let SESSION_ID = localStorage.getItem('session_id') || '';
  let SESSIONS = [];
  let EXERCISES = [];
  let WRONGBOOK = [];
  let QUIZ_LOADING = false;
  let PENDING_EXERCISE = false;
  let LAST_EXERCISE_COUNT = 0;
  let GENERATING_EXERCISE = false;
  let EXERCISED_INDICES = [];

  class LayoutManager {
    constructor() {
      this.container = document.querySelector('.layout-container');
      this.handles = Array.from(document.querySelectorAll('.resize-handle'));
      this.panels = Array.from(this.container.querySelectorAll('.layout-section'));
      this.panelIndexByName = {};
      this.panels.forEach((p, i) => {
        const name = p.getAttribute('data-section');
        if (name) this.panelIndexByName[name] = i;
      });
      this.layoutState = this.loadLayout();
      this.init();
    }

    init() {
      this.applyLayout();

      console.debug('[layout] init', {
        handleCount: this.handles.length,
        panelCount: this.panels.length
      });

      this.handles.forEach((handle, index) => {
        handle.addEventListener('pointerdown', (e) => this.startResize(e, index));
      });

      document.querySelectorAll('.collapse-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => this.toggleCollapse(e));
      });

      window.addEventListener('resize', () => {
        const containerWidth = this.container.offsetWidth;
        const gapPx = parseFloat(getComputedStyle(this.container).gap || '8');
        const gaps = Math.max(0, this.panels.length - 1) * gapPx;
        const totalPanels = this.panels.reduce((sum, p) => sum + p.offsetWidth, 0);
        const available = containerWidth - gaps;

        if (totalPanels > available) {
          const growIndex = this.panels.findIndex(
            (p) => parseFloat(getComputedStyle(p).flexGrow || '0') > 0
          );
          if (growIndex >= 0) {
            const fixedTotal = this.panels.reduce((sum, p, i) => {
              if (i === growIndex) return sum;
              return sum + p.offsetWidth;
            }, 0);
            const minGrow = parseFloat(getComputedStyle(this.panels[growIndex]).minWidth || '200');
            const newGrow = Math.max(minGrow, available - fixedTotal);
            this.panels[growIndex].style.flexBasis = newGrow + 'px';
          }
        }

        this.saveLayout();
      });
    }

    startResize(e, handleIndex) {
      e.preventDefault();
      const handle = e.currentTarget;
      const startX = e.clientX;

      console.debug('[layout] startResize', {
        handleIndex,
        startX,
        pointerId: e.pointerId,
        buttons: e.buttons,
        pointerType: e.pointerType
      });

      const leftPanel = this.panels[handleIndex];
      const rightPanel = this.panels[handleIndex + 1];
      if (!leftPanel || !rightPanel) return;

      const startLeftWidth = leftPanel.offsetWidth;
      const startRightWidth = rightPanel.offsetWidth;
      const totalWidth = startLeftWidth + startRightWidth;
      const minLeft = parseFloat(getComputedStyle(leftPanel).minWidth || '200');
      const minRight = parseFloat(getComputedStyle(rightPanel).minWidth || '200');

      handle.classList.add('dragging');

      const onPointerMove = (moveEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const proposedLeft = startLeftWidth + deltaX;
        const newLeft = Math.max(minLeft, Math.min(totalWidth - minRight, proposedLeft));
        const newRight = totalWidth - newLeft;

        leftPanel.style.flexBasis = newLeft + 'px';
        rightPanel.style.flexBasis = newRight + 'px';

        console.debug('[layout] resize', {
          deltaX,
          newLeft,
          newRight
        });
      };

      const onPointerUp = (upEvent) => {
        handle.classList.remove('dragging');
        handle.removeEventListener('pointermove', onPointerMove);
        handle.removeEventListener('pointerup', onPointerUp);
        handle.removeEventListener('pointercancel', onPointerUp);
        if (handle.releasePointerCapture && upEvent.pointerId !== undefined) {
          try {
            handle.releasePointerCapture(upEvent.pointerId);
          } catch {
            return;
          }
        }
        this.saveLayout();

        console.debug('[layout] endResize', {
          handleIndex,
          pointerId: upEvent.pointerId
        });
      };

      if (handle.setPointerCapture && e.pointerId !== undefined) {
        try {
          handle.setPointerCapture(e.pointerId);
        } catch {
          return;
        }
      }

      handle.addEventListener('pointermove', onPointerMove);
      handle.addEventListener('pointerup', onPointerUp);
      handle.addEventListener('pointercancel', onPointerUp);
    }

    toggleCollapse(e) {
      const btn = e.currentTarget;
      const sectionName = btn.getAttribute('data-toggle');
      const index = this.panelIndexByName[sectionName];
      if (index === undefined) return;
      const panel = this.panels[index];

      console.debug('[layout] toggleCollapse', {
        sectionName,
        index,
        collapsed: panel.classList.contains('collapsed')
      });

      const willCollapse = !panel.classList.contains('collapsed');
      if (willCollapse) {
        const currentBasis =
          panel.style.flexBasis && panel.style.flexBasis !== 'auto'
            ? panel.style.flexBasis
            : panel.offsetWidth + 'px';
        if (!this.prevBasis) this.prevBasis = new Array(this.panels.length).fill(null);
        this.prevBasis[index] = currentBasis;

        panel.classList.add('collapsed');

        const minW = parseFloat(getComputedStyle(panel).minWidth || '40');
        panel.style.flexBasis = minW + 'px';

        if (index === 0) {
          const h = this.handles[0];
          if (h) h.classList.add('hidden');
        } else if (index === this.panels.length - 1) {
          const h = this.handles[this.handles.length - 1];
          if (h) h.classList.add('hidden');
        }
      } else {
        panel.classList.remove('collapsed');
        const prev = this.prevBasis && this.prevBasis[index];
        if (prev) {
          panel.style.flexBasis = prev;
          this.prevBasis[index] = null;
        } else {
          panel.style.flexBasis = panel.offsetWidth + 'px';
        }

        if (index === 0) {
          const h = this.handles[0];
          if (h) h.classList.remove('hidden');
        } else if (index === this.panels.length - 1) {
          const h = this.handles[this.handles.length - 1];
          if (h) h.classList.remove('hidden');
        }
      }

      this.layoutState.collapsed = Array.isArray(this.layoutState.collapsed)
        ? this.layoutState.collapsed
        : new Array(this.panels.length).fill(false);
      this.layoutState.collapsed[index] = panel.classList.contains('collapsed');
      this.saveLayout();
    }

    applyLayout() {
      if (Array.isArray(this.layoutState.flexBasis) && this.layoutState.flexBasis.length === this.panels.length) {
        this.panels.forEach((p, i) => {
          const basis = this.layoutState.flexBasis[i];
          if (basis) p.style.flexBasis = basis;
        });
      }

      if (Array.isArray(this.layoutState.collapsed) && this.layoutState.collapsed.length === this.panels.length) {
        this.panels.forEach((p, i) => {
          if (this.layoutState.collapsed[i]) p.classList.add('collapsed');
          else p.classList.remove('collapsed');
        });

        const leftCollapsed = this.layoutState.collapsed[0];
        const rightCollapsed = this.layoutState.collapsed[this.panels.length - 1];
        if (this.handles[0]) {
          if (leftCollapsed) this.handles[0].classList.add('hidden');
          else this.handles[0].classList.remove('hidden');
        }
        if (this.handles[this.handles.length - 1]) {
          if (rightCollapsed) this.handles[this.handles.length - 1].classList.add('hidden');
          else this.handles[this.handles.length - 1].classList.remove('hidden');
        }
      }
    }

    saveLayout() {
      this.layoutState.flexBasis = this.panels.map((p) => {
        const basis = p.style.flexBasis;
        if (basis && basis !== 'auto') return basis;
        return p.offsetWidth + 'px';
      });

      this.layoutState.collapsed = this.panels.map((p) => p.classList.contains('collapsed'));

      localStorage.setItem('layoutState', JSON.stringify(this.layoutState));
    }

    loadLayout() {
      const saved = localStorage.getItem('layoutState');
      return saved ? JSON.parse(saved) : {};
    }
  }

  let layoutManager;

  function renderMath(element) {
    if (!element) return;
    renderMathInElement(element, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false }
      ],
      throwOnError: false
    });
  }

  function showQuizLoading() {
    const box = document.getElementById('quizBox');
    if (!box || document.getElementById('quiz-loading-placeholder')) return;
    QUIZ_LOADING = true;
    PENDING_EXERCISE = true;
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'quiz-loading-placeholder';
    loadingDiv.className = 'quiz-loading-card';
    loadingDiv.innerHTML = `
      <div class="quiz-spinner animate-spin"></div>
      <div class="text-sm text-gray-500">题目生成中</div>
    `;
    const emptyMsg = box.querySelector('.text-gray-400');
    if (emptyMsg) emptyMsg.remove();
    box.appendChild(loadingDiv);
    box.scrollTop = box.scrollHeight;
  }

  function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = newHeight + 'px';
  }

  function showAuth(show) {
    document.getElementById('authModal').style.display = show ? 'flex' : 'none';
  }

  function setUser(u, token) {
    USER = u;
    TOKEN = token;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(u));
    document.getElementById('username').innerText = u.username;
    document.getElementById('avatar').src = u.avatar || '/img/default_avatar.svg';
    document.getElementById('btnLogout').classList.remove('hidden');
    showAuth(false);
  }

  async function api(path, method = 'GET', body = null, isForm = false) {
    const opt = { method, headers: {} };
    if (body) {
      if (isForm) {
        opt.body = body;
      } else {
        opt.headers['Content-Type'] = 'application/json';
        opt.body = JSON.stringify(body);
      }
    }
    const urlWithToken = path.includes('?')
      ? `${path}&token=${encodeURIComponent(TOKEN)}`
      : `${path}?token=${encodeURIComponent(TOKEN)}`;
    const res = await fetch(buildApiUrl(urlWithToken), opt);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || '请求失败');
    return data;
  }

  async function loadSessions() {
    try {
      SESSIONS = await api('/api/sessions');
      const list = document.getElementById('sessionList');
      list.innerHTML = '';

      SESSIONS.sort((a, b) => b.updated_at - a.updated_at);

      SESSIONS.forEach((s) => {
        const itemWrapper = document.createElement('div');
        itemWrapper.className = 'relative group';

        const item = document.createElement('div');
        item.className = `p-3 rounded-lg cursor-pointer border transition-all ${
          s.id === SESSION_ID
            ? 'bg-orange-100 border-orange-400 font-medium'
            : 'bg-white border-gray-200 hover:border-orange-300'
        }`;

        const titleDiv = document.createElement('div');
        titleDiv.className = 'text-sm truncate';
        titleDiv.innerText = s.title || '无标题';

        const timeDiv = document.createElement('div');
        timeDiv.className = 'text-xs text-gray-500 mt-1';
        const date = new Date(s.updated_at * 1000);
        timeDiv.innerText = date.toLocaleString('zh-CN');

        item.appendChild(titleDiv);
        item.appendChild(timeDiv);

        item.onclick = (e) => {
          if (e.target.closest('.btn-delete')) return;
          switchSession(s.id);
        };

        const deleteBtn = document.createElement('button');
        deleteBtn.className =
          'btn-delete absolute top-1 right-2 hidden group-hover:block text-gray-400 hover:text-red-500 text-lg';
        deleteBtn.innerText = '✕';
        deleteBtn.onclick = async (e) => {
          e.stopPropagation();
          if (confirm(`确定删除会话 "${s.title || '无标题'}" 吗？`)) {
            await deleteSession(s.id);
          }
        };

        itemWrapper.appendChild(item);
        itemWrapper.appendChild(deleteBtn);
        list.appendChild(itemWrapper);
      });
    } catch (e) {
      console.error('加载会话列表失败:', e);
    }
  }

  async function deleteSession(sessionId) {
    try {
      await api(`/api/sessions/${sessionId}`, 'DELETE');
      if (SESSION_ID === sessionId) {
        SESSION_ID = '';
        localStorage.removeItem('session_id');
        await createNewSession();
      } else {
        await loadSessions();
      }
    } catch (e) {
      alert('删除会话失败: ' + e.message);
    }
  }

  async function switchSession(sessionId) {
    SESSION_ID = sessionId;
    localStorage.setItem('session_id', SESSION_ID);
    document.getElementById('q').value = '';
    await loadSessions();
    await loadHistory();
    await loadQuiz();
  }

  async function createNewSession() {
    try {
      const sessionRes = await api('/api/sessions', 'POST');
      SESSION_ID = sessionRes.id;
      localStorage.setItem('session_id', SESSION_ID);
      await loadSessions();
      await loadHistory();
      await loadQuiz();
    } catch (e) {
      alert('创建会话失败: ' + e.message);
    }
  }

  async function loadHistory() {
    if (!SESSION_ID) return;
    try {
      const session = await api(`/api/sessions/${SESSION_ID}`);
      const area = document.getElementById('chatArea');
      area.innerHTML = '';

      try {
        const meta = JSON.parse(session.meta || '{}');
        EXERCISED_INDICES = meta.exercised_message_indices || [];
      } catch {
        EXERCISED_INDICES = [];
      }

      session.messages.forEach((m, idx) => {
        let userMsgIndex = null;
        if (m.role === 'assistant') {
          for (let i = idx - 1; i >= 0; i--) {
            if (session.messages[i].role === 'user') {
              userMsgIndex = i;
              break;
            }
          }
        }
        addMessage(area, m.role, m.content, m.timestamp, m.sources, userMsgIndex);
      });
      area.scrollTop = 1e9;
    } catch (e) {
      console.error('加载历史失败:', e);
    }
  }

  function addMessage(container, role, content, timestamp, sources, messageIndex) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message-item message-${role}`;

    let timeStr = '';
    let fullTimeStr = '';
    if (timestamp) {
      const date = new Date(timestamp * 1000);
      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      fullTimeStr = date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      if (diffDays === 0) {
        timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      } else if (diffDays === 1) {
        timeStr = '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      } else if (diffDays < 7) {
        timeStr = diffDays + '天前 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      } else {
        timeStr = fullTimeStr;
      }
    }

    const roleLabel = role === 'assistant' ? '助手' : '你';

    const headerDiv = document.createElement('div');
    headerDiv.className = 'message-header';
    headerDiv.innerHTML = `<span class="role-badge">${roleLabel}</span><span class="msg-time" title="${fullTimeStr}">${timeStr}</span>`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    const cleanedContent = content.replace(/\n{2,}/g, '\n\n');
    contentDiv.innerHTML = marked.parse(cleanedContent);
    setTimeout(() => renderMath(contentDiv), 0);

    msgDiv.appendChild(headerDiv);
    msgDiv.appendChild(contentDiv);

    if (sources && sources.length > 0 && role === 'assistant') {
      const sourcesDiv = document.createElement('div');
      sourcesDiv.className = 'message-sources';
      sourcesDiv.innerHTML =
        "📚 知识来源：<ul class='source-list'>" +
        sources
          .map((s) => {
            const bookName = s.book.replace(/\.(pdf|PDF)$/, '');
            return `<li>${bookName} - 第${s.page}页</li>`;
          })
          .join('') +
        '</ul>';
      msgDiv.appendChild(sourcesDiv);
    }

    if (role === 'assistant' && messageIndex !== undefined && messageIndex !== null) {
      const genBtnDiv = document.createElement('div');
      genBtnDiv.className = 'mt-2';
      const alreadyGenerated = EXERCISED_INDICES.includes(messageIndex);
      const genBtn = document.createElement('button');
      genBtn.className =
        'gen-exercise-btn px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ' +
        (alreadyGenerated
          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
          : 'bg-orange-100 text-orange-700 hover:bg-orange-200');
      genBtn.innerText = alreadyGenerated ? '✅ 已生成题目' : '📝 生成一道题';
      genBtn.dataset.messageIndex = messageIndex;
      if (!alreadyGenerated) {
        genBtn.onclick = () => generateExerciseForMessage(messageIndex, genBtn);
      }
      genBtnDiv.appendChild(genBtn);
      msgDiv.appendChild(genBtnDiv);
    }

    container.appendChild(msgDiv);
    container.scrollTop = 1e9;
  }

  async function loadQuiz() {
    if (!TOKEN) return;
    try {
      const result = await api(`/api/quiz_questions?page_size=200`);
      const exercises = (result.items || []).reverse();
      EXERCISES = exercises;
      const box = document.getElementById('quizBox');

      if (exercises.length === 0) {
        box.innerHTML = '<div class="text-center text-gray-400">暂无练习题（回答后点击"生成一道题"）</div>';
        document.getElementById('btnClearAnswers').classList.add('hidden');
        LAST_EXERCISE_COUNT = 0;
        return;
      }

      const savedStates = {};
      for (let i = 0; i < exercises.length; i++) {
        const quizItem = document.getElementById(`quiz-${i}`);
        if (!quizItem) continue;

        const radio = document.querySelector(`input[name="quiz-${i}"]:checked`);
        const resultDiv = document.getElementById(`quiz-result-${i}`);

        const explainContent = resultDiv?.querySelector('.border-l-2');
        const isExplainExpanded = explainContent && !explainContent.classList.contains('hidden');

        savedStates[i] = {
          selectedAnswer: radio ? radio.value : null,
          resultHTML: resultDiv ? resultDiv.innerHTML : '',
          explainExpanded: isExplainExpanded
        };
      }

      box.innerHTML = '';
      document.getElementById('btnClearAnswers').classList.remove('hidden');

      for (let index = 0; index < exercises.length; index++) {
        const ex = exercises[index];
        const quizItem = document.createElement('div');
        quizItem.className = 'border rounded-lg p-3 space-y-2 bg-gray-50';
        quizItem.id = `quiz-${index}`;

        const getDifficultyClass = (difficulty) => {
          switch (difficulty) {
            case '简单':
              return 'bg-green-100 text-green-700';
            case '中等':
              return 'bg-orange-100 text-orange-700';
            case '困难':
              return 'bg-red-100 text-red-700';
            default:
              return 'bg-orange-100 text-orange-700';
          }
        };

        const titleDiv = document.createElement('div');
        titleDiv.className = 'flex items-center justify-between';
        titleDiv.innerHTML = `<span class="font-medium text-sm">第${index + 1}题</span><span class="text-xs px-2 py-1 rounded ${getDifficultyClass(
          ex.difficulty || '中等'
        )}">${ex.difficulty || '中等'}</span>`;
        quizItem.appendChild(titleDiv);

        const qDiv = document.createElement('div');
        qDiv.className = 'text-sm font-medium';
        qDiv.innerText = ex.question || '';
        quizItem.appendChild(qDiv);

        if (ex.options && Array.isArray(ex.options)) {
          const optsDiv = document.createElement('div');
          optsDiv.className = 'space-y-2';
          ex.options.forEach((opt) => {
            const label = document.createElement('label');
            label.className = 'flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded transition-colors';

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = `quiz-${index}`;
            radio.value = opt.charAt(0);
            radio.className = 'w-4 h-4';
            if (savedStates[index]?.selectedAnswer === opt.charAt(0)) radio.checked = true;

            const text = document.createElement('span');
            text.className = 'text-sm';
            text.innerText = opt;

            label.appendChild(radio);
            label.appendChild(text);
            optsDiv.appendChild(label);
          });
          quizItem.appendChild(optsDiv);
        }

        const btnDiv = document.createElement('div');
        btnDiv.className = 'flex gap-2 mt-2';

        const submitBtn = document.createElement('button');
        submitBtn.className = 'flex-1 px-3 py-2 rounded-lg bg-orange-500 text-white text-sm hover:bg-orange-600';
        submitBtn.innerText = '提交';
        submitBtn.onclick = () => submitQuizAnswer(index);

        const addWrongBtn = document.createElement('button');
        addWrongBtn.className = 'px-3 py-2 rounded-lg bg-blue-500 text-white text-sm hover:bg-blue-600';
        addWrongBtn.innerText = '添加到错题本';
        addWrongBtn.onclick = () => addToWrongbook(index);

        const resultDiv = document.createElement('div');
        resultDiv.id = `quiz-result-${index}`;
        resultDiv.className = 'text-sm';

        btnDiv.appendChild(submitBtn);
        btnDiv.appendChild(addWrongBtn);
        quizItem.appendChild(btnDiv);
        quizItem.appendChild(resultDiv);

        box.appendChild(quizItem);

        if (savedStates[index]?.resultHTML) {
          resultDiv.innerHTML = savedStates[index].resultHTML;

          requestAnimationFrame(() => {
            const toggleBtn = resultDiv.querySelector('button');
            const explainContent = resultDiv.querySelector('.border-l-2');

            if (toggleBtn && explainContent) {
              toggleBtn.replaceWith(toggleBtn.cloneNode(true));
              const newToggleBtn = resultDiv.querySelector('button');

              if (newToggleBtn) {
                newToggleBtn.addEventListener('click', function (e) {
                  e.preventDefault();
                  const content = resultDiv.querySelector('.border-l-2');
                  const btn = resultDiv.querySelector('button');
                  if (!content || !btn) return;

                  const isHidden = content.classList.contains('hidden');
                  if (isHidden) {
                    content.classList.remove('hidden');
                    btn.innerText = '📖 收起解析';
                  } else {
                    content.classList.add('hidden');
                    btn.innerText = '📖 展开解析';
                  }
                });

                if (savedStates[index].explainExpanded) {
                  explainContent.classList.remove('hidden');
                  newToggleBtn.innerText = '📖 收起解析';
                }
              }
            }
          });
        }
      }

      box.scrollTop = box.scrollHeight;
      LAST_EXERCISE_COUNT = exercises.length;
    } catch (e) {
      console.error('加载练习题失败:', e);
    }
  }

  async function submitQuizAnswer(quizIndex) {
    const selected = document.querySelector(`input[name="quiz-${quizIndex}"]:checked`);
    if (!selected) {
      alert('请选择答案');
      return;
    }

    const userAnswer = selected.value;
    const exercise = EXERCISES[quizIndex];

    if (!exercise) {
      alert('习题数据错误，请重新加载');
      return;
    }

    const resultDiv = document.getElementById(`quiz-result-${quizIndex}`);
    const correctAnswer = exercise.correct_answer || exercise.answer || '';
    const isCorrect = userAnswer === correctAnswer;

    const resultContainer = document.createElement('div');
    resultContainer.className = 'mt-2';

    const resultLabel = document.createElement('div');
    resultLabel.className = isCorrect
      ? 'p-2 rounded bg-green-100 text-green-700'
      : 'p-2 rounded bg-red-100 text-red-700';
    resultLabel.innerText = isCorrect ? '✓ 答对了！' : `✗ 答错了，正确答案是 ${correctAnswer}`;
    resultContainer.appendChild(resultLabel);

    const explanationDiv = document.createElement('div');
    explanationDiv.className = 'mt-2';

    const toggleBtn = document.createElement('button');
    toggleBtn.className =
      'w-full text-left p-2 rounded bg-blue-50 hover:bg-blue-100 text-sm font-medium text-blue-700 transition-colors';
    toggleBtn.innerText = '📖 展开解析';

    const explainContent = document.createElement('div');
    explainContent.className = 'hidden mt-2 p-2 rounded bg-blue-50 text-sm border-l-2 border-blue-300';
    explainContent.innerHTML = marked.parse(exercise.explanation || '暂无解析');

    toggleBtn.onclick = () => {
      const isHidden = explainContent.classList.contains('hidden');
      if (isHidden) {
        explainContent.classList.remove('hidden');
        toggleBtn.innerText = '📖 收起解析';
      } else {
        explainContent.classList.add('hidden');
        toggleBtn.innerText = '📖 展开解析';
      }
    };

    explanationDiv.appendChild(toggleBtn);
    explanationDiv.appendChild(explainContent);
    resultContainer.appendChild(explanationDiv);

    resultDiv.innerHTML = '';
    resultDiv.appendChild(resultContainer);
  }

  async function loginOrRegister(kind) {
    const username = document.getElementById('inUser').value;
    const password = document.getElementById('inPwd').value;
    document.getElementById('authErr').innerText = '';

    try {
      const path = kind === 'login' ? '/api/login' : '/api/register';
      const res = await fetch(buildApiUrl(path), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        let errorMsg = '失败';
        if (typeof data.detail === 'string') {
          errorMsg = data.detail;
        } else if (Array.isArray(data.detail)) {
          errorMsg = data.detail
            .map((d) => (typeof d === 'string' ? d : d.msg || JSON.stringify(d)))
            .join('; ');
        } else if (data.detail) {
          errorMsg = JSON.stringify(data.detail);
        }
        throw new Error(errorMsg);
      }

      setUser(data.user, data.token);

      const f = document.getElementById('inAvatar').files[0];
      if (f) {
        const fd = new FormData();
        fd.append('file', f);
        const up = await fetch(buildApiUrl(`/api/avatar?token=${encodeURIComponent(TOKEN)}`), {
          method: 'POST',
          body: fd
        });
        const ud = await up.json();
        if (up.ok) {
          USER.avatar = ud.avatar;
          localStorage.setItem('user', JSON.stringify(USER));
          document.getElementById('avatar').src = USER.avatar;
        }
      }

      const sessionRes = await api('/api/sessions', 'POST');
      SESSION_ID = sessionRes.id;
      localStorage.setItem('session_id', SESSION_ID);

      await loadSessions();
      await loadHistory();
      await loadQuiz();
    } catch (e) {
      document.getElementById('authErr').innerText = e.message;
    }
  }

  function startStream(question) {
    if (activeEventSource) activeEventSource.close();
    document.getElementById('sources').innerText = '';

    const chatArea = document.getElementById('chatArea');

    const userMsg = { role: 'user', content: question, timestamp: Math.floor(Date.now() / 1000) };
    addMessage(chatArea, userMsg.role, userMsg.content, userMsg.timestamp);

    const assistantDiv = document.createElement('div');
    assistantDiv.className = 'message-item message-assistant';
    assistantDiv.id = 'current-message';

    const headerDiv = document.createElement('div');
    headerDiv.className = 'message-header';
    const date = new Date();
    const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const fullTimeStr = date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    headerDiv.innerHTML = `<span class="role-badge">助手</span><span class="msg-time" title="${fullTimeStr}">${timeStr}</span>`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.id = 'current-content';
    contentDiv.innerText = '';

    assistantDiv.appendChild(headerDiv);
    assistantDiv.appendChild(contentDiv);
    chatArea.appendChild(assistantDiv);

    const sourcesDiv = document.createElement('div');
    sourcesDiv.className = 'message-sources';
    sourcesDiv.id = 'current-sources';
    sourcesDiv.style.display = 'none';
    assistantDiv.appendChild(sourcesDiv);

    chatArea.scrollTop = 1e9;

    let fullText = '';

    const difficulty = document.getElementById('quizDifficulty').value;

    activeEventSource = new EventSource(
      buildApiUrl(
        `/api/sessions/${SESSION_ID}/chat?token=${encodeURIComponent(TOKEN)}&q=${encodeURIComponent(
          question
        )}&difficulty=${encodeURIComponent(difficulty)}`
      )
    );

    activeEventSource.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.type === 'meta') {
        const sources = msg.sources;
        document.getElementById('current-sources').innerHTML =
          "📚 知识来源：<ul class='source-list'>" +
          sources
            .map((s) => {
              const bookName = s.book.replace(/\.(pdf|PDF)$/, '');
              return `<li>${bookName} - 第${s.page}页</li>`;
            })
            .join('') +
          '</ul>';
        document.getElementById('current-sources').style.display = 'block';
        return;
      }
      if (msg.type === 'delta') {
        fullText += msg.text;
        const contentEl = document.getElementById('current-content');
        const cleanedContent = fullText.replace(/\n{2,}/g, '\n\n');
        contentEl.innerHTML = marked.parse(cleanedContent);
        renderMath(contentEl);
        document.getElementById('chatArea').scrollTop = 1e9;
        return;
      }
      if (msg.type === 'error') {
        const contentEl = document.getElementById('current-content');
        contentEl.innerText += '\n\n[错误] ' + msg.message;
        activeEventSource.close();
        return;
      }
      if (msg.type === 'done') {
        activeEventSource.close();
        document.getElementById('current-message').id = '';
        loadHistory();
        loadQuiz();
        loadSessions();
      }
    };

    activeEventSource.onerror = () => {
      const contentEl = document.getElementById('current-content');
      contentEl.innerText += '\n\n[连接中断] 请检查服务器或API配置。';
      try {
        activeEventSource.close();
      } catch {
        return;
      }
    };
  }

  document.getElementById('btnLogin').onclick = () => loginOrRegister('login');
  document.getElementById('btnReg').onclick = () => loginOrRegister('register');

  document.getElementById('btnNewSession').onclick = createNewSession;

  document.getElementById('btnClearAnswers').onclick = () => {
    document.querySelectorAll('input[type="radio"]').forEach((r) => (r.checked = false));
    document.querySelectorAll('[id^="quiz-result-"]').forEach((d) => (d.innerHTML = ''));
  };

  const sendQuestion = async () => {
    const question = document.getElementById('q').value.trim();
    if (!question) return;
    if (!SESSION_ID) {
      alert('请先登录');
      return;
    }
    if (GENERATING_EXERCISE) {
      alert('正在生成题目，请稍候完成后再提问');
      return;
    }
    document.getElementById('q').value = '';

    try {
      const session = await api(`/api/sessions/${SESSION_ID}`);
      const messages = session.messages || [];

      if (messages.length === 0) {
        startStream(question);
        setTimeout(async () => {
          try {
            const updatedSession = await api(`/api/sessions/${SESSION_ID}`);
            if (!updatedSession.title || updatedSession.title === '无标题') {
              await api(`/api/sessions/${SESSION_ID}/generate_title`, 'POST', {});
              await loadSessions();
            }
          } catch (e) {
            console.log('标题生成可选操作，失败不影响:', e);
          }
        }, 2000);
      } else {
        startStream(question);
      }
    } catch {
      startStream(question);
    }
  };

  document.getElementById('btnAsk').onclick = sendQuestion;

  const textarea = document.getElementById('q');
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuestion();
    }
  });

  textarea.addEventListener('input', () => {
    autoResizeTextarea(textarea);
  });

  autoResizeTextarea(textarea);

  document.getElementById('btnWrongbook').onclick = async () => {
    try {
      document.getElementById('wrongModal').classList.remove('hidden');
      document.getElementById('wrongModal').classList.add('flex');
      await loadWrongbook();
    } catch (e) {
      alert('加载错题本失败: ' + e.message);
    }
  };

  document.getElementById('btnCloseWrong').onclick = () => {
    document.getElementById('wrongModal').classList.add('hidden');
    document.getElementById('wrongModal').classList.remove('flex');
  };

  document.getElementById('btnLogout').onclick = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('session_id');
    TOKEN = '';
    USER = null;
    SESSION_ID = '';
    SESSIONS = [];
    location.reload();
  };

  (async function init() {
    layoutManager = new LayoutManager();

    if (TOKEN && USER) {
      try {
        const me = await api('/api/me');
        document.getElementById('username').innerText = me.username;
        document.getElementById('avatar').src = me.avatar || '/img/default_avatar.svg';
        document.getElementById('btnLogout').classList.remove('hidden');
        showAuth(false);

        await loadSessions();

        if (!SESSION_ID || !SESSIONS.find((s) => s.id === SESSION_ID)) {
          const sessionRes = await api('/api/sessions', 'POST');
          SESSION_ID = sessionRes.id;
          localStorage.setItem('session_id', SESSION_ID);
          await loadSessions();
        }

        await loadHistory();
        await loadQuiz();
      } catch {
        showAuth(true);
      }
    } else {
      showAuth(true);
    }
  })();

  async function loadWrongbook() {
    try {
      const list = await api(`/api/wrongbook`);
      WRONGBOOK = list;
      renderWrongbookList();
      document.getElementById('wrongDetail').innerHTML =
        '<div class="text-sm text-gray-500">请选择左侧的错题查看详情</div>';
    } catch (e) {
      alert('加载错题本失败: ' + e.message);
    }
  }

  function renderWrongbookList() {
    const box = document.getElementById('wrongList');
    box.innerHTML = '';

    if (WRONGBOOK.length === 0) {
      box.innerHTML = "<div class='text-sm text-gray-500'>暂无错题</div>";
      return;
    }

    WRONGBOOK.forEach((item, index) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'p-3 bg-white rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors';
      itemDiv.onclick = () => showWrongDetail(index);

      const titleDiv = document.createElement('div');
      titleDiv.className = 'font-medium text-sm mb-1 truncate';
      titleDiv.innerText =
        item.question.length > 50 ? item.question.substring(0, 50) + '...' : item.question;

      const timeDiv = document.createElement('div');
      timeDiv.className = 'text-xs text-gray-500';
      const date = new Date(item.created_at * 1000);
      timeDiv.innerText = date.toLocaleString('zh-CN');

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'float-right text-red-500 hover:text-red-700 text-sm';
      deleteBtn.innerText = '✕';
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteWrongItem(index);
      };

      itemDiv.appendChild(deleteBtn);
      itemDiv.appendChild(titleDiv);
      itemDiv.appendChild(timeDiv);
      box.appendChild(itemDiv);
    });
  }

  function showWrongDetail(index) {
    const item = WRONGBOOK[index];
    const detailDiv = document.getElementById('wrongDetail');

    document.querySelectorAll('#wrongList > div').forEach((div) => {
      div.classList.remove('bg-blue-50', 'border-blue-300');
      div.classList.add('bg-white', 'border-gray-200');
    });

    const selectedDiv = document.querySelector(`#wrongList > div:nth-child(${index + 1})`);
    if (selectedDiv) {
      selectedDiv.classList.remove('bg-white', 'border-gray-200');
      selectedDiv.classList.add('bg-blue-50', 'border-blue-300');
    }

    detailDiv.innerHTML = `
      <div class="space-y-4">
        <div>
          <div class="font-medium mb-2">题目：</div>
          <div class="text-sm bg-gray-50 p-3 rounded">${item.question}</div>
        </div>

        ${
          item.options
            ? `
        <div>
          <div class="font-medium mb-2">选项：</div>
          <div class="space-y-2">
            ${item.options
              .map(
                (opt) => `
              <label class="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded transition-colors">
                <input type="radio" name="wrong-quiz-${index}" value="${opt.charAt(0)}" class="w-4 h-4">
                <span class="text-sm">${opt}</span>
              </label>
            `
              )
              .join('')}
          </div>
        </div>
        `
            : ''
        }

        <div class="flex gap-2">
          <button onclick="redoWrongQuiz(${index})" class="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600">
            重做题目
          </button>
          <button onclick="showWrongAnswer(${index})" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
            查看答案和解析
          </button>
        </div>

        <div id="wrong-result-${index}" class="hidden"></div>
      </div>
    `;
  }

  window.redoWrongQuiz = function (index) {
    const item = WRONGBOOK[index];
    const selected = document.querySelector(`input[name="wrong-quiz-${index}"]:checked`);
    if (!selected) {
      alert('请选择答案');
      return;
    }

    const userAnswer = selected.value;
    const isCorrect = userAnswer === item.correct_answer;

    const resultDiv = document.getElementById(`wrong-result-${index}`);
    resultDiv.className = 'mt-4 p-3 rounded';
    resultDiv.classList.remove('hidden');

    if (isCorrect) {
      resultDiv.className += ' bg-green-100 text-green-700';
      resultDiv.innerHTML = "<div class='font-medium'>✓ 答对了！</div>";
    } else {
      resultDiv.className += ' bg-red-100 text-red-700';
      resultDiv.innerHTML = `<div class='font-medium'>✗ 答错了，正确答案是 ${item.correct_answer}</div>`;
    }
  };

  window.showWrongAnswer = function (index) {
    const item = WRONGBOOK[index];
    const resultDiv = document.getElementById(`wrong-result-${index}`);
    resultDiv.className = 'mt-4 p-3 rounded bg-blue-50';
    resultDiv.classList.remove('hidden');

    resultDiv.innerHTML = `
      <div class="space-y-2">
        <div class="font-medium">正确答案：${item.correct_answer}</div>
        ${
          item.explanation
            ? `<div><div class="font-medium">解析：</div><div class="text-sm mt-1">${marked.parse(
                item.explanation
              )}</div></div>`
            : ''
        }
      </div>
    `;
  };

  async function deleteWrongItem(index) {
    if (!confirm('确定要删除这道错题吗？')) return;

    try {
      await api(`/api/wrongbook/${index}`, 'DELETE');
      await loadWrongbook();
      alert('错题已删除');
    } catch (e) {
      alert('删除失败: ' + e.message);
    }
  }

  async function addToWrongbook(quizIndex) {
    const exercise = EXERCISES[quizIndex];

    try {
      await api('/api/quiz/add_manual_wrong', 'POST', {
        question: exercise.question,
        options: exercise.options,
        correct_answer: exercise.correct_answer || exercise.answer || '',
        explanation: exercise.explanation,
        difficulty: exercise.difficulty
      });
      alert('已添加到错题本');
    } catch (e) {
      alert('添加到错题本失败: ' + e.message);
    }
  }

  async function generateExerciseForMessage(messageIndex, btnEl) {
    if (EXERCISED_INDICES.includes(messageIndex)) {
      alert('您已经生成过题目了');
      return;
    }
    if (GENERATING_EXERCISE) {
      alert('正在生成题目，请稍候...');
      return;
    }

    GENERATING_EXERCISE = true;

    const qInput = document.getElementById('q');
    const askBtn = document.getElementById('btnAsk');
    qInput.disabled = true;
    askBtn.disabled = true;
    askBtn.classList.add('opacity-50', 'cursor-not-allowed');

    document.querySelectorAll('.gen-exercise-btn').forEach((b) => {
      b.disabled = true;
      b.classList.add('opacity-50', 'cursor-not-allowed');
    });

    btnEl.innerText = '⏳ 题目生成中...';

    showQuizLoading();

    try {
      const difficulty = document.getElementById('quizDifficulty').value;
      const res = await api(
        `/api/sessions/${SESSION_ID}/generate_exercise?message_index=${messageIndex}&difficulty=${difficulty}`,
        'POST'
      );

      if (res.already_generated) {
        alert('您已经生成过题目了');
        btnEl.innerText = '✅ 已生成题目';
        btnEl.classList.remove('bg-orange-100', 'text-orange-700', 'hover:bg-orange-200');
        btnEl.classList.add('bg-gray-200', 'text-gray-500', 'cursor-not-allowed');
        btnEl.onclick = null;
        EXERCISED_INDICES.push(messageIndex);
        return;
      }

      if (res.ok) {
        EXERCISED_INDICES.push(messageIndex);
        btnEl.innerText = '✅ 已生成题目';
        btnEl.classList.remove('bg-orange-100', 'text-orange-700', 'hover:bg-orange-200');
        btnEl.classList.add('bg-gray-200', 'text-gray-500', 'cursor-not-allowed');
        btnEl.onclick = null;

        await loadQuiz();
      }
    } catch (e) {
      alert('题目生成失败: ' + e.message);
      btnEl.innerText = '📝 生成一道题';
    } finally {
      GENERATING_EXERCISE = false;

      qInput.disabled = false;
      askBtn.disabled = false;
      askBtn.classList.remove('opacity-50', 'cursor-not-allowed');

      document.querySelectorAll('.gen-exercise-btn').forEach((b) => {
        const idx = parseInt(b.dataset.messageIndex);
        if (!EXERCISED_INDICES.includes(idx)) {
          b.disabled = false;
          b.classList.remove('opacity-50', 'cursor-not-allowed');
        }
      });

      const loadingPlaceholder = document.getElementById('quiz-loading-placeholder');
      if (loadingPlaceholder) loadingPlaceholder.remove();
      QUIZ_LOADING = false;
      PENDING_EXERCISE = false;
    }
  }

  if (QUIZ_LOADING && !PENDING_EXERCISE && LAST_EXERCISE_COUNT < EXERCISES.length) {
    const loadingPlaceholder = document.getElementById('quiz-loading-placeholder');
    if (loadingPlaceholder) loadingPlaceholder.remove();
    QUIZ_LOADING = false;
  }
});
</script>

<style scoped>
.message-content ul,
.message-content ol {
  margin: 0.25rem 0 !important;
  line-height: 1.4 !important;
}
.message-content li {
  margin: 0.125rem 0 !important;
}
.quiz-loading-card {
  border: 1px solid #fed7aa;
  background: #fff7ed;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.quiz-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #fed7aa;
  border-top-color: #f97316;
  border-radius: 9999px;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.animate-spin {
  animation: spin 1s linear infinite;
}
.layout-container {
  display: flex;
  gap: 0.5rem;
  min-height: 0;
  flex: 1;
  max-width: 100%;
  width: 100%;
  overflow: hidden;
}
.layout-section {
  display: flex;
  flex-direction: column;
  min-width: 200px;
  flex: 0 0 auto;
}
[data-section='sessions'] {
  flex-basis: 200px;
  flex-shrink: 0;
  flex-grow: 0;
}
[data-section='quiz'] {
  flex-basis: 240px;
  flex-shrink: 0;
  flex-grow: 0;
}
[data-section='chat'] {
  flex: 1 1 0;
  min-width: 200px;
  flex-basis: 0;
}
.layout-section.collapsed {
  min-width: 40px;
  padding: 0.5rem 0 !important;
}
.layout-section.collapsed .section-content {
  display: none;
}
.layout-section.collapsed .section-header {
  flex-direction: column;
  writing-mode: horizontal-tb;
  margin-bottom: 0;
  align-items: center;
  gap: 1rem;
  padding-top: 0.5rem;
}
.layout-section.collapsed .section-header > div,
.layout-section.collapsed .section-header > button:not(.collapse-btn) {
  writing-mode: vertical-lr;
  text-orientation: mixed;
  flex: none;
}

.layout-section.collapsed [id='quizDifficulty'],
.layout-section.collapsed #btnClearAnswers {
  display: none;
}
[data-section='sessions'].collapsed .collapse-btn {
  transform: rotate(180deg);
}
[data-section='quiz'].collapsed .collapse-btn {
  transform: rotate(180deg);
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-shrink: 0;
  margin-bottom: 0.75rem;
}
.collapse-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #999;
  transition: color 0.2s;
  padding: 0;
  border: none;
  background: none;
  font-size: 14px;
}
.collapse-btn:hover {
  color: #f97316;
}
.section-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.resize-handle {
  width: 4px;
  cursor: col-resize;
  background: #e5e7eb;
  transition: background 0.2s;
  border-radius: 2px;
  flex-shrink: 1;
  touch-action: none;
}
.resize-handle:hover,
.resize-handle.dragging {
  background: #f97316;
}
.layout-section.collapsed + .resize-handle {
  display: none;
}
.resize-handle.hidden {
  display: none;
}
</style>
