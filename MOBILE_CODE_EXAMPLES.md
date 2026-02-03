# 移动端适配 - 代码示例

## 响应式设计类型

### 1️⃣ 条件显示/隐藏

```html
<!-- 仅在桌面版显示 -->
<div class="hidden md:block text-gray-500">
  今日的努力，是明日的花开！祝您学习愉快！
</div>

<!-- 仅在移动版显示 -->
<div class="md:hidden text-xs">
  祝学习愉快！
</div>

<!-- 仅在手机上隐藏 -->
[data-section="sessions"],
[data-section="quiz"] {
  display: none !important; /* 手机 */
}
```

### 2️⃣ 尺寸响应

```html
<!-- 文字大小响应 -->
<h1 class="text-lg md:text-2xl">
  道道的智能学习助手
</h1>
<!-- 手机: 18px | 桌面: 24px -->

<!-- 按钮大小响应 -->
<button class="px-2 md:px-4 py-1.5 md:py-2">
  知识库管理
</button>
<!-- 手机: px-2 py-1.5 | 桌面: px-4 py-2 -->

<!-- 头像大小响应 -->
<img class="w-8 md:w-10 h-8 md:h-10" />
<!-- 手机: 32×32px | 桌面: 40×40px -->
```

### 3️⃣ 布局方向响应

```html
<!-- 响应式方向 -->
<header class="flex flex-col md:flex-row gap-2 md:gap-4">
  <div>标题</div>
  <div class="ml-auto">按钮和头像</div>
</header>

<!-- 手机: 竖排堆叠
     桌面: 水平并排 -->

<!-- 错题本布局 -->
<div class="flex flex-col sm:flex-row gap-2 sm:gap-4">
  <div class="sm:flex-1">错题列表</div>
  <div class="sm:flex-[2]">错题详情</div>
</div>

<!-- 手机: 竖屏堆叠
     平板: 水平分割（1:2） -->
```

### 4️⃣ 间距响应

```html
<!-- 内边距响应 -->
<div class="px-3 md:px-4 py-2 md:py-3">
  内容
</div>
<!-- 手机: 12px 水平, 8px 竖直
     桌面: 16px 水平, 12px 竖直 -->

<!-- 间隔响应 -->
<div class="flex gap-2 md:gap-4">
  <button>按钮1</button>
  <button>按钮2</button>
</div>
<!-- 手机: 8px 间距
     桌面: 16px 间距 -->
```

---

## CSS 媒体查询完整示例

### 手机适配 (≤ 768px)

```css
@media (max-width: 768px) {
  /* 1. 布局变化 */
  .layout-container {
    flex-direction: column;  /* 竖排堆叠 */
    gap: 0.25rem;          /* 减小间距 */
  }

  /* 2. 隐藏非必要元素 */
  [data-section="sessions"],  /* 隐藏会话列表 */
  [data-section="quiz"] {      /* 隐藏练习题 */
    display: none !important;
  }

  /* 3. 全屏对话区 */
  [data-section="chat"] {
    flex: 1 !important;
    min-width: auto !important;
  }

  /* 4. 隐藏拖拽分界线 */
  .resize-handle {
    display: none !important;
  }

  /* 5. 文字大小 */
  .message-content {
    font-size: 13px;
    line-height: 1.6;
  }

  /* 6. 更大的点击区域 */
  button, input, textarea {
    min-height: 44px;
    min-width: 44px;
  }

  /* 7. 防止 iOS 自动缩放 */
  input[type="text"],
  input[type="password"],
  textarea {
    font-size: 16px !important;  /* 关键! */
  }

  /* 8. 移除点击高亮 */
  * {
    -webkit-tap-highlight-color: transparent;
  }

  /* 9. 模态框调整 */
  .fixed.inset-0 {
    padding: 8px !important;
  }

  .chatbox {
    max-height: 90vh;
    border-radius: 12px;
  }
}
```

### 超小屏 (< 640px)

```css
@media (max-width: 640px) {
  /* 进一步缩小文字 */
  .message-content {
    font-size: 12px;
  }

  .message-header {
    font-size: 10px;
    gap: 4px !important;
  }

  .role-badge {
    font-size: 10px;
    padding: 2px 8px;
  }

  /* 减小表格 */
  .message-content table {
    font-size: 12px;
  }

  .message-content th, .message-content td {
    padding: 6px;
  }

  /* 调整代码块 */
  .message-content pre {
    font-size: 11px;
    padding: 8px;
  }
}
```

### 平板优化 (769-1024px)

```css
@media (min-width: 769px) and (max-width: 1024px) {
  /* 调整列宽 */
  [data-section="sessions"] {
    flex-basis: 180px !important;  /* 略窄 */
  }

  [data-section="quiz"] {
    flex-basis: 200px !important;  /* 略窄 */
  }

  /* 文字大小适中 */
  .message-content {
    font-size: 13px;
  }

  /* 间距适中 */
  .layout-container {
    gap: 8px !important;
  }
}
```

---

## 实际代码片段

### 例子1: 响应式头部

```html
<header class="flex flex-col md:flex-row items-start md:items-center 
               justify-between gap-2 md:gap-4 mb-2 md:mb-3">
  <div class="order-1 md:order-none">
    <div class="text-lg md:text-2xl font-semibold">道道的智能学习助手</div>
    <!-- 副标题仅在桌面显示 -->
    <div class="hidden md:block text-sm text-gray-500">
      今日的努力，是明日的花开！祝您学习愉快！
    </div>
  </div>

  <!-- 按钮和头像：移动端横排，桌面端也横排 -->
  <div class="flex items-center gap-2 md:gap-3 w-full md:w-auto order-2 md:order-none">
    <button onclick="showKnowledgeBaseModal()" 
            class="px-2 md:px-4 py-1.5 md:py-2 
                   bg-orange-500 text-white rounded-md 
                   hover:bg-orange-600 
                   text-xs md:text-sm whitespace-nowrap">
      知识库管理
    </button>
    <img id="avatar" 
         class="w-8 md:w-10 h-8 md:h-10 rounded-full border" 
         src="/static/img/default_avatar.svg" />
    <!-- 用户信息仅在桌面显示 -->
    <div class="hidden md:block text-sm">
      <div id="username" class="font-medium">未登录</div>
      <button id="btnLogout" class="text-orange-600 hidden">退出</button>
    </div>
  </div>
</header>
```

**说明**:
- `flex flex-col md:flex-row`: 手机竖排，桌面横排
- `order-1 order-2`: 控制移动端排序
- `gap-2 md:gap-4`: 响应式间距
- `text-lg md:text-2xl`: 响应式文字大小
- `hidden md:block`: 仅桌面显示

### 例子2: 响应式输入框

```html
<div class="mt-3 flex gap-2 items-end">
  <textarea id="q" 
            class="flex-1 border rounded-lg md:rounded-xl p-2 md:p-3 
                   text-sm md:text-base focus:outline-none 
                   focus:ring-1 focus:ring-blue-500 
                   focus:ring-inset resize-none overflow-hidden"
            placeholder="提问..." 
            rows="1" 
            style="line-height: 1.5; min-height: 40px; max-height: 200px;">
  </textarea>
  <button id="btnAsk" 
          class="px-3 md:px-5 py-2 md:py-3 rounded-lg md:rounded-xl 
                 bg-orange-500 hover:bg-orange-600 text-white 
                 font-medium transition-colors flex items-center 
                 justify-center flex-shrink-0" 
          style="height: 40px; width: 44px; min-width: 44px;">
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
    </svg>
  </button>
</div>
```

**关键点**:
- `min-height: 40px`: 手机友好高度
- `text-sm md:text-base`: 手机16px防缩放，桌面16px正常
- `width: 44px; min-width: 44px`: 符合44px标准
- `p-2 md:p-3`: 响应式内边距

### 例子3: 响应式模态框

```html
<!-- 登录框：移动端全屏，桌面端居中 -->
<div id="authModal" class="fixed inset-0 bg-black/40 flex items-center 
                          justify-center p-4 sm:p-4">
  <div class="chatbox w-full max-w-sm sm:max-w-md p-4 sm:p-5 
              max-h-[90vh] overflow-y-auto">
    <div class="text-lg sm:text-xl font-semibold">登录 / 注册</div>
    <div class="text-xs sm:text-sm text-gray-500 mt-1">
      用户名支持中英文/数字/特殊字符；密码必须为6位数字
    </div>

    <div class="mt-4 space-y-2">
      <input id="inUser" class="w-full border rounded-lg sm:rounded-xl 
                                p-2 sm:p-3 text-sm" 
             placeholder="用户名" />
      <input id="inPwd" class="w-full border rounded-lg sm:rounded-xl 
                               p-2 sm:p-3 text-sm" 
             placeholder="6位数字密码" />
    </div>

    <div class="mt-4 flex gap-2">
      <button id="btnLogin" 
              class="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 
                     rounded-lg sm:rounded-xl bg-orange-500 
                     text-white text-sm sm:text-base font-medium 
                     active:bg-orange-700 transition-colors">
        登录
      </button>
      <button id="btnReg" 
              class="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 
                     rounded-lg sm:rounded-xl border border-orange-300 
                     text-orange-700 text-sm sm:text-base font-medium 
                     active:bg-orange-50 transition-colors">
        注册
      </button>
    </div>
  </div>
</div>
```

**特点**:
- `max-w-sm sm:max-w-md`: 手机24rem，桌面28rem
- `max-h-[90vh] overflow-y-auto`: 可滚动，防止超屏
- `text-sm`: 强制16px防iOS缩放
- `active:` 状态而非 `hover:`（移动友好）

### 例子4: 知识库模态框（从底部弹出）

```html
<!-- 知识库管理：移动端底部，桌面端居中 -->
<div id="knowledgeBaseModal" 
     class="fixed inset-0 bg-black bg-opacity-50 hidden 
            flex items-end sm:items-center sm:justify-center 
            p-2 sm:p-4 z-50">
  <div class="bg-white rounded-t-lg sm:rounded-lg shadow-xl 
              w-full sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
    <!-- 头部 -->
    <div class="flex items-center justify-between p-4 sm:p-6 border-b flex-shrink-0">
      <h2 class="text-lg sm:text-2xl font-bold">知识库管理</h2>
      <button onclick="hideKnowledgeBaseModal()" 
              class="text-gray-500 hover:text-gray-700 text-2xl leading-none">
        ×
      </button>
    </div>

    <!-- 内容 -->
    <div class="p-4 sm:p-6 overflow-y-auto flex-1">
      <!-- 上传部分 -->
      <div class="bg-gray-50 p-4 sm:p-6 rounded-lg mb-4 sm:mb-6">
        <h3 class="text-base sm:text-xl font-semibold mb-4">上传新PDF</h3>
        <form id="uploadForm" enctype="multipart/form-data" class="space-y-4">
          <div>
            <label for="pdfFile" class="block text-xs sm:text-sm font-medium text-gray-700">
              选择PDF文件
            </label>
            <input type="file" id="pdfFile" name="file" accept="application/pdf" 
                   class="mt-1 block w-full px-2 sm:px-3 py-2 text-xs sm:text-sm 
                          border border-gray-300 rounded-md shadow-sm 
                          focus:outline-none focus:ring-orange-500 
                          focus:border-orange-500" 
                   required />
          </div>
          <button type="submit" id="uploadButton" 
                  class="w-full bg-orange-500 text-white py-2 px-3 
                         rounded-md hover:bg-orange-600 active:bg-orange-700 
                         focus:outline-none focus:ring-2 focus:ring-orange-500 
                         focus:ring-offset-2 text-sm sm:text-base">
            上传PDF
          </button>
        </form>
      </div>

      <!-- PDF列表 -->
      <div class="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        <h3 class="text-base sm:text-xl font-semibold mb-4">现有PDF文件</h3>
        <div id="pdfList" class="space-y-2 text-xs sm:text-sm">
          <!-- 动态加载 -->
        </div>
      </div>
    </div>
  </div>
</div>
```

**特色**:
- `flex items-end sm:items-center`: 手机底部对齐，桌面中心对齐
- `rounded-t-lg sm:rounded-lg`: 手机仅顶部圆角，桌面全圆角
- `flex flex-col` + `flex-shrink-0` + `flex-1`: 优雅的弹框布局
- `overflow-y-auto flex-1`: 内容区可滚动

---

## CSS 网格（Grid）响应式例子

```css
/* 如果使用 Grid 布局（备选方案） */
@media (min-width: 1024px) {
  .layout-container {
    display: grid;
    grid-template-columns: 200px 1fr 240px;
    gap: 0.5rem;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .layout-container {
    display: grid;
    grid-template-columns: 180px 1fr 200px;
    gap: 0.5rem;
  }
}

@media (max-width: 768px) {
  .layout-container {
    display: flex;
    flex-direction: column;
  }
}
```

---

## Tailwind 快速参考

### 断点速查表

```
sm  → @media (min-width: 640px)
md  → @media (min-width: 768px)  ◄─ 主要分界点
lg  → @media (min-width: 1024px)
xl  → @media (min-width: 1280px)
2xl → @media (min-width: 1536px)
```

### 常用响应式模式

```html
<!-- 隐藏/显示 -->
class="hidden md:block"   <!-- 手机隐藏，桌面显示 -->
class="md:hidden"         <!-- 手机显示，桌面隐藏 -->

<!-- 文字 -->
class="text-xs md:text-sm lg:text-base"

<!-- 内边距 -->
class="p-2 md:p-3 lg:p-4"

<!-- 外边距 -->
class="m-2 md:m-3 lg:m-4"

<!-- 宽度 -->
class="w-full md:max-w-2xl lg:max-w-4xl"

<!-- 布局 -->
class="flex-col md:flex-row"
class="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

<!-- 间隔 -->
class="gap-2 md:gap-4 lg:gap-6"
```

---

## 性能优化提示

### 避免的做法 ❌

```html
<!-- 不要：加载两套不同的CSS -->
<link rel="stylesheet" href="desktop.css" media="(min-width: 768px)">
<link rel="stylesheet" href="mobile.css" media="(max-width: 767px)">
<!-- 原因：资源加倍，维护困难 -->

<!-- 不要：使用多套HTML -->
<!-- 原因：SEO问题，维护困难 -->

<!-- 不要：过度使用 !important -->
class="text-lg !important"
<!-- 原因：难以覆盖，降低可维护性 -->
```

### 推荐的做法 ✅

```html
<!-- 好：单一 HTML，响应式 CSS -->
<div class="text-lg md:text-2xl">内容</div>

<!-- 好：使用 Tailwind 响应式前缀 -->
<div class="px-2 md:px-4 lg:px-6">内容</div>

<!-- 好：用 CSS 媒体查询 -->
@media (max-width: 768px) {
  .something { /* 仅手机 */ }
}
```

---

## 调试技巧

### Chrome DevTools 测试响应式

```
1. F12 打开开发者工具
2. Ctrl+Shift+M 切换设备模式
3. 选择特定设备或自定义宽度
4. 检查元素 > 右键 > 查看源码

关键设备预设：
- iPhone SE: 375×667
- iPhone 14: 390×844
- iPhone 14 Pro Max: 430×932
- iPad: 768×1024
- iPad Pro: 1024×1366
```

### 终端测试

```bash
# 使用 Chrome 无头浏览器测试
chromium --headless --print-to-pdf=output.pdf --window-size=375,667 index.html

# 使用 Firefox 测试
firefox --new-instance -width 375 -height 667 index.html
```

---

**Last Updated**: 2026年2月3日  
**Version**: Mobile Responsive v3.0
