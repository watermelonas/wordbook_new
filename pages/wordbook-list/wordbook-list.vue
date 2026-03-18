<template>
  <view class="container">
    <!-- 状态栏占位 -->
    <view class="status-bar"></view>
    
    <view class="list-title">单词本 ({{ list.length }}/{{ list.length }})</view>
    <view class="list-content">
      <view
        v-for="item in list"
        :key="item.id"
        class="wordbook-card"
        :class="{ selected: currentId === item.id }"
        @click="onSelect(item)"
      >
        <view class="card-left">
          <view class="card-icon">{{ (item.name || '本').charAt(0) }}</view>
          <view class="card-info">
            <text class="card-name">{{ item.name }}</text>
            <text class="card-count">共 {{ getCount(item) }} 词</text>
          </view>
        </view>
        <view v-if="item.canDelete" class="card-delete" @click.stop="onDelete(item)">
          <text class="delete-text">删除</text>
        </view>
      </view>
    </view>
    <view class="footer-btn-wrap">
      <button class="btn-new" @click="showNewModal = true">新建单词本</button>
    </view>

    <view v-if="showNewModal" class="modal-overlay" @click.self="showNewModal = false">
      <view class="modal-box" @click.stop>
        <view class="modal-title">新建单词本</view>
        <input
          v-model="newName"
          class="modal-input"
          placeholder="输入单词本名称"
          focus
        />
        <view class="modal-actions">
          <button class="modal-btn cancel" @click="showNewModal = false">取消</button>
          <button class="modal-btn confirm" @click="onConfirmNew">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { onUnload } from '@dcloudio/uni-app';
import db from '../../src/utils/db';
import {
  getWordbookListForUI,
  getCurrentWordbook,
  setCurrentWordbook,
  addCloudWordbook,
  removeCloudWordbook,
  getWordbookWords,
  isLocalWordbookKey,
  loadLocalWordbook,
} from '../../src/utils/wordbookSource.js';
import { logger } from '../../src/utils/errorHandler.js';
import { cleanupExpiredCaches } from '../../src/utils/learningCenter_v2.js';

const list = ref([]);
const counts = ref({});
const currentId = ref('');
const showNewModal = ref(false);
const newName = ref('');

const loadList = () => {
  list.value = getWordbookListForUI();
  currentId.value = getCurrentWordbook();
};

const getCount = (item) => {
  if (counts.value[item.id] !== undefined) return counts.value[item.id];
  if (item.id === 'self') return counts.value['self'] ?? '—';
  if (item.isLocal) return counts.value[item.id] ?? '—';
  const n = (getWordbookWords(item.id) || []).length;
  counts.value[item.id] = n;
  return n;
};

const loadCounts = async () => {
  const next = {};
  for (const item of list.value) {
    if (item.id === 'self') {
      const words = await db.getWords();
      next['self'] = words.length;
    } else if (item.isLocal) {
      const arr = await loadLocalWordbook(item.id);
      next[item.id] = arr.length;
    } else {
      next[item.id] = (getWordbookWords(item.id) || []).length;
    }
  }
  counts.value = next;
};

const onSelect = (item) => {
  setCurrentWordbook(item.id);
  uni.$emit('wordbookChanged', item.id);
  uni.showToast({ title: '已切换为 ' + item.name, icon: 'none' });
  uni.navigateBack();
};

const onDelete = (item) => {
  if (!item.canDelete) return;
  uni.showModal({
    title: '删除单词本',
    content: '确定删除「' + item.name + '」吗？其中的单词将一并删除。',
    success: (res) => {
      if (res.confirm) {
        removeCloudWordbook(item.id);
        if (currentId.value === item.id) {
          setCurrentWordbook('self');
          uni.$emit('wordbookChanged', 'self');
        }
        loadList();
        loadCounts();
        uni.showToast({ title: '已删除', icon: 'none' });
      }
    },
  });
};

const onConfirmNew = () => {
  const name = (newName.value || '').trim();
  if (!name) {
    uni.showToast({ title: '请输入名称', icon: 'none' });
    return;
  }
  const id = addCloudWordbook(name);
  setCurrentWordbook(id);
  uni.$emit('wordbookChanged', id);
  newName.value = '';
  showNewModal.value = false;
  loadList();
  loadCounts();
  uni.showToast({ title: '已创建并切换', icon: 'none' });
};

onMounted(() => {
  loadList();
  loadCounts();
});

onUnload(() => {
  // 清理过期缓存
  try {
    cleanupExpiredCaches();
  } catch (error) {
    logger.warn('WordbookList', '清理缓存失败', error);
  }
});
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #FFF8FB;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  overflow-x: hidden;
}

.status-bar {
  min-height: 44px;
  height: calc(44px + constant(safe-area-inset-top));
  height: calc(44px + env(safe-area-inset-top));
  width: 100%;
  background: #FFF8FB;
}

.list-title {
  padding: 16px 20px 12px;
  font-size: 16px;
  font-weight: 600;
  color: #4A4E69;
  line-height: 1.4;
}
.list-content {
  padding: 0 16px;
  box-sizing: border-box;
  width: 100%;
}
.wordbook-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 100%;
  box-sizing: border-box;
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 4px 16px rgba(255, 133, 161, 0.06);
  border: 2px solid transparent;
}
.wordbook-card.selected {
  border: 2px solid #FF85A1;
  background: #FFF5F7;
}
.card-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  min-width: 0;
}
.card-icon {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 12px;
  background: #FF85A1;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}
.card-name {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #4A4E69;
  line-height: 1.35;
  word-break: break-all;
}
.card-count {
  display: block;
  font-size: 13px;
  color: #888;
  line-height: 1.35;
}
.card-delete {
  margin-left: 12px;
  flex-shrink: 0;
  padding: 8px 12px;
  border-radius: 12px;
  background: #FFF1F5;
}
.delete-text {
  font-size: 14px;
  color: #8C7B86;
  line-height: 1;
}
.footer-btn-wrap {
  margin-top: auto;
  padding: 18px 16px 0;
  background: #FFF8FB;
  box-sizing: border-box;
}
.btn-new {
  width: 100%;
  height: 50px;
  line-height: 50px;
  background: #FF85A1 !important;
  color: #fff !important;
  border: none;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
.btn-new::after,
.modal-btn::after {
  border: none;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal-box {
  width: calc(100vw - 40px);
  max-width: 320px;
  background: #fff;
  border-radius: 20px;
  padding: 24px;
  box-sizing: border-box;
}
.modal-title {
  font-size: 17px;
  font-weight: 600;
  color: #4A4E69;
  margin-bottom: 16px;
  text-align: center;
}
.modal-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #eee;
  border-radius: 12px;
  font-size: 15px;
  box-sizing: border-box;
  margin-bottom: 20px;
}
.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: space-between;
}
.modal-btn {
  flex: 1;
  height: 44px;
  line-height: 44px;
  border-radius: 12px;
  font-size: 15px;
  margin: 0;
  padding: 0;
}
.modal-btn.cancel {
  background: #FFF1F5;
  color: #7A7284;
  border: 1px solid #F3DCE5;
}
.modal-btn.confirm {
  background: #FF85A1 !important;
  color: #fff !important;
  border: none;
}
</style>
