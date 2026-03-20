<template>
  <view class="page">
    <!-- 状态栏占位 -->
    <view class="status-bar"></view>
    
    <view class="content-wrapper">
      <view class="form">
        <text class="label">昵称</text>
        <view class="input-wrapper">
          <input
            v-model="nickname"
            class="nickname-input"
            type="text"
            placeholder="请输入昵称"
            maxlength="20"
            :focus="true"
            :adjust-position="true"
            confirm-type="done"
          />
        </view>
        <text class="hint">保存后将在「我的」页显示，最多 20 字</text>
      </view>
      <button class="btn-save" @click="save">保存</button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const nickname = ref('');

onMounted(() => {
  const name = uni.getStorageSync('userDisplayName') || uni.getStorageSync('username') || '';
  nickname.value = (name || '').trim();
});

const save = async () => {
  const name = (nickname.value || '').trim();
  if (!name) {
    uni.showToast({ title: '请输入昵称', icon: 'none' });
    return;
  }
  
  // 保存到本地
  uni.setStorageSync('userDisplayName', name);
  
  // 上传到云端
  try {
    const uid = uni.getStorageSync('uid');
    if (uid) {
      await uniCloud.callFunction({
        name: 'user-center',
        data: {
          action: 'updateProfile',
          uid: uid,
          displayName: name
        }
      });
    }
  } catch (e) {
    logger.error('上传昵称到云端失败:', e);
    // 即使云端失败，本地也已保存，不影响用户体验
  }
  
  uni.showToast({ title: '昵称已保存', duration: 1500 });
  setTimeout(() => uni.navigateBack(), 300);
};
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 24px;
  padding-top: 0;
  background: #FFF0F3;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.status-bar {
  min-height: 44px;
  height: calc(44px + constant(safe-area-inset-top));
  height: calc(44px + env(safe-area-inset-top));
  width: 100%;
  background: #FFF0F3;
  margin: 0 -24px;
  padding: 0 24px;
}

.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  padding: 40px 0;
}

.form {
  width: 100%;
  margin-bottom: 32px;
}

.label {
  display: block;
  font-size: 16px;
  color: #4A4E69;
  margin-bottom: 12px;
  font-weight: 600;
}

.input-wrapper {
  width: 100%;
  background-color: #FFFFFF;
  border-radius: 16px;
  border: 2px solid #FFE5EC;
  box-sizing: border-box;
  overflow: hidden;
  transition: border-color 0.3s;
}

.input-wrapper:focus-within {
  border-color: #FF85A1;
}

.nickname-input {
  width: 100%;
  height: 56px;
  line-height: 56px;
  padding: 0 24px;
  font-size: 18px;
  color: #333333;
  background-color: transparent;
  border: none;
  border-radius: 0;
  box-sizing: border-box;
  outline: none;
}

/* 覆盖全局样式 */
.nickname-input {
  background-color: transparent !important;
  padding: 0 24px !important;
  font-size: 18px !important;
  color: #333333 !important;
  border: none !important;
  border-radius: 0 !important;
}

.hint {
  display: block;
  font-size: 13px;
  color: #999;
  margin-top: 10px;
  line-height: 1.5;
}

.btn-save {
  width: 100%;
  height: 56px;
  line-height: 56px;
  padding: 0;
  font-size: 18px;
  font-weight: 600;
  color: #FFFFFF;
  background-color: #FF85A1;
  border: none;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(255, 133, 161, 0.3);
}
</style>
