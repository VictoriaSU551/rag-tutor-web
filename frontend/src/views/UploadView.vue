<template>
  <div class="bg-gray-100 min-h-screen">
    <div class="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <div class="w-full sm:max-w-4xl mx-auto">
        <h1 class="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center">知识库管理</h1>

        <div class="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8">
          <h2 class="text-xl sm:text-xl font-semibold mb-4">上传新PDF</h2>
          <form @submit.prevent="handleUpload" class="space-y-4">
            <div>
              <label for="pdfFile" class="block text-xs sm:text-sm font-medium text-gray-700">选择PDF文件</label>
              <input
                ref="fileInput"
                type="file"
                id="pdfFile"
                name="file"
                accept="application/pdf"
                class="mt-1 block w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>
            <div v-show="progress.visible">
              <div class="w-full bg-gray-200 rounded-full h-2.5">
                <div class="bg-orange-500 h-2.5 rounded-full transition-all duration-300" :style="{ width: progress.percent + '%' }"></div>
              </div>
              <p class="text-xs sm:text-sm text-gray-600 mt-1">{{ progress.text }}</p>
            </div>
            <button
              type="submit"
              class="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 active:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 text-sm sm:text-base font-medium"
              :disabled="uploading"
            >
              {{ uploading ? '上传中...' : '上传PDF' }}
            </button>
          </form>
          <div v-if="uploadMessage.text" class="mt-4 text-xs sm:text-sm" :class="uploadMessageClass">
            {{ uploadMessage.text }}
          </div>
        </div>

        <div class="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h2 class="text-xl sm:text-xl font-semibold mb-4">现有PDF文件</h2>
          <div class="space-y-2 text-xs sm:text-sm">
            <p v-if="needLogin" class="text-gray-500">请先登录</p>
            <p v-else-if="pdfs.length === 0" class="text-gray-500">暂无PDF文件</p>
            <div v-else>
              <div v-for="pdf in pdfs" :key="pdf.name" class="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div class="flex-1">
                  <p class="font-medium">{{ pdf.name }}</p>
                  <p class="text-sm text-gray-500">上传时间: {{ formatDate(pdf.upload_time) }}</p>
                </div>
                <button @click="deletePdf(pdf.name)" class="text-red-500 hover:text-red-700 ml-4">删除</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';

const apiBase = import.meta.env.VITE_API_BASE || '';
const fileInput = ref(null);
const pdfs = ref([]);
const uploading = ref(false);
const needLogin = ref(false);
const uploadMessage = reactive({ text: '', type: '' });
const progress = reactive({ visible: false, percent: 0, text: '准备上传...' });

const uploadMessageClass = computed(() => {
  if (uploadMessage.type === 'success') return 'text-green-500';
  if (uploadMessage.type === 'error') return 'text-red-500';
  return '';
});

const buildApiUrl = (path) => {
  if (!path) return path;
  if (path.startsWith('http')) return path;
  if (!apiBase) return path;
  return `${apiBase}${path.startsWith('/') ? path : `/${path}`}`;
};

const parseJsonResponse = async (res) => {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await res.json().catch(() => ({}));
    return { isJson: true, data };
  }
  const text = await res.text();
  return { isJson: false, data: {}, text };
};

const fetchJsonWithFallback = async (path, options) => {
  const res = await fetch(buildApiUrl(path), options);
  const parsed = await parseJsonResponse(res);
  return { res, parsed };
};

const formatDate = (timestamp) => new Date(timestamp).toLocaleString();

const loadPdfList = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    needLogin.value = true;
    pdfs.value = [];
    return;
  }
  needLogin.value = false;

  try {
    const { res, parsed } = await fetchJsonWithFallback('/api/pdfs', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (res.ok && parsed.isJson) {
      pdfs.value = parsed.data || [];
    } else if (!parsed.isJson) {
      uploadMessage.text = '接口返回非 JSON，请检查后端/代理配置';
      uploadMessage.type = 'error';
    } else {
      uploadMessage.text = '加载PDF列表失败';
      uploadMessage.type = 'error';
    }
  } catch {
    uploadMessage.text = '网络错误';
    uploadMessage.type = 'error';
  }
};

const deletePdf = async (filename) => {
  if (!confirm(`确定要删除 ${filename} 吗？`)) return;

  const token = localStorage.getItem('token');
  try {
    const { res, parsed } = await fetchJsonWithFallback(`/api/pdfs/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (res.ok && parsed.isJson) {
      loadPdfList();
    } else if (!parsed.isJson) {
      alert('接口返回非 JSON，请检查后端/代理配置');
    } else {
      alert('删除失败');
    }
  } catch {
    alert('网络错误');
  }
};

const handleUpload = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    uploadMessage.text = '请先登录';
    uploadMessage.type = 'error';
    return;
  }

  const file = fileInput.value?.files?.[0];
  if (!file) return;

  uploadMessage.text = '';
  uploadMessage.type = '';
  progress.visible = true;
  progress.percent = 0;
  progress.text = '准备上传...';
  uploading.value = true;

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('token', token);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        progress.percent = percentComplete;
        progress.text = `上传中... ${Math.round(percentComplete)}%`;
      }
    });

    xhr.addEventListener('load', () => {
      progress.text = '处理中，请稍候...';
      progress.percent = 100;
    });

    xhr.addEventListener('loadend', async () => {
      if (xhr.status === 200) {
        let result = null;
        try {
          result = JSON.parse(xhr.responseText);
        } catch {
          uploadMessage.text = '接口返回非 JSON，请检查后端/代理配置';
          uploadMessage.type = 'error';
          progress.visible = false;
          uploading.value = false;
          return;
        }

        uploadMessage.text = result.message;
        uploadMessage.type = 'success';
        if (fileInput.value) fileInput.value.value = '';

        monitorIndexProgress();
        loadPdfList();
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          uploadMessage.text = error.detail || '上传失败';
        } catch {
          uploadMessage.text = '接口返回非 JSON，请检查后端/代理配置';
        }
        uploadMessage.type = 'error';
        progress.visible = false;
        uploading.value = false;
      }
    });

    xhr.addEventListener('error', () => {
      uploadMessage.text = '网络错误';
      uploadMessage.type = 'error';
      progress.visible = false;
      uploading.value = false;
    });

    xhr.open('POST', buildApiUrl('/api/upload-pdf'));
    xhr.send(formData);
  } catch {
    uploadMessage.text = '网络错误';
    uploadMessage.type = 'error';
    progress.visible = false;
    uploading.value = false;
  }
};

const monitorIndexProgress = async () => {
  const token = localStorage.getItem('token');
  progress.visible = true;
  progress.text = '生成索引中...';

  const checkProgress = async () => {
    try {
      const { res, parsed } = await fetchJsonWithFallback('/api/index-progress', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok && parsed.isJson) {
        const progressData = parsed.data;
        progress.percent = progressData.percent;
        progress.text = `${progressData.step}... ${progressData.percent}%`;

        if (progressData.percent < 100) {
          setTimeout(checkProgress, 1000);
        } else {
          setTimeout(() => {
            progress.visible = false;
            uploadMessage.text = '索引生成完成';
            uploadMessage.type = 'success';
            uploading.value = false;
          }, 2000);
        }
      } else if (!parsed.isJson) {
        progress.text = '接口返回非 JSON，请检查后端/代理配置';
        setTimeout(() => (progress.visible = false), 2000);
        uploading.value = false;
      } else {
        progress.text = '获取进度失败';
        setTimeout(() => (progress.visible = false), 2000);
        uploading.value = false;
      }
    } catch {
      progress.text = '网络错误';
      setTimeout(() => (progress.visible = false), 2000);
      uploading.value = false;
    }
  };

  checkProgress();
};

onMounted(() => {
  loadPdfList();
});
</script>

<style scoped>
@supports (padding: max(0px)) {
  :global(body) {
    padding-left: max(0px, env(safe-area-inset-left));
    padding-right: max(0px, env(safe-area-inset-right));
    padding-top: max(0px, env(safe-area-inset-top));
    padding-bottom: max(0px, env(safe-area-inset-bottom));
  }
}

:global(body) {
  background: #f3f4f6;
  overflow: auto;
}
</style>
