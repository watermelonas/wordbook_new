<template>
  <view class="debug-container">
    <view class="debug-header">
      <text class="debug-title">应用诊断工具</text>
      <button class="close-btn" @click="goBack">关闭</button>
    </view>

    <scroll-view class="debug-content" scroll-y>
      <!-- 环境信息 -->
      <view class="debug-section">
        <text class="section-title">环境信息</text>
        <view class="debug-item">
          <text class="label">plus 对象:</text>
          <text class="value" :class="{ success: plusAvailable, error: !plusAvailable }">
            {{ plusAvailable ? '✓ 可用' : '✗ 不可用' }}
          </text>
        </view>
        <view class="debug-item">
          <text class="label">plus.sqlite:</text>
          <text class="value" :class="{ success: sqliteAvailable, error: !sqliteAvailable }">
            {{ sqliteAvailable ? '✓ 可用' : '✗ 不可用' }}
          </text>
        </view>
        <view class="debug-item">
          <text class="label">运行环境:</text>
          <text class="value">{{ environment }}</text>
        </view>
      </view>

      <!-- 初始化状态 -->
      <view class="debug-section">
        <text class="section-title">初始化状态</text>
        <view class="debug-item">
          <text class="label">应用初始化:</text>
          <text class="value" :class="{ success: appInitialized, error: !appInitialized }">
            {{ appInitialized ? '✓ 已完成' : '✗ 未完成' }}
          </text>
        </view>
        <view class="debug-item">
          <text class="label">数据库初始化:</text>
          <text class="value" :class="{ success: dbInitialized, error: !dbInitialized }">
            {{ dbInitialized ? '✓ 已完成' : '✗ 未完成' }}
          </text>
        </view>
        <view class="debug-item">
          <text class="label">数据库类型:</text>
          <text class="value">{{ dbType }}</text>
        </view>
      </view>

      <!-- 数据库测试 -->
      <view class="debug-section">
        <text class="section-title">数据库测试</text>
        <view class="debug-item">
          <text class="label">单词总数:</text>
          <text class="value">{{ wordCount }}</text>
        </view>
        <button class="test-btn" @click="testDatabase">测试数据库连接</button>
        <button class="test-btn" @click="testQuery">测试数据库查询</button>
      </view>

      <!-- 日志输出 -->
      <view class="debug-section">
        <text class="section-title">诊断日志</text>
        <view class="log-container">
          <text v-for="(log, idx) in logs" :key="idx" class="log-line">{{ log }}</text>
        </view>
        <button class="test-btn" @click="clearLogs">清除日志</button>
      </view>

      <!-- 操作按钮 -->
      <view class="debug-section">
        <text class="section-title">操作</text>
        <button class="test-btn" @click="reinitializeApp">重新初始化应用</button>
        <button class="test-btn" @click="goToHome">返回首页</button>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getAppStatus, initializeApp } from '../../src/utils/appInitializer.js';
import db from '../../src/utils/db_v2.js';

const plusAvailable = ref(false);
const sqliteAvailable = ref(false);
const environment = ref('');
const appInitialized = ref(false);
const dbInitialized = ref(false);
const dbType = ref('');
const wordCount = ref(0);
const logs = ref([]);

const addLog = (message) => {
  const timestamp = new Date().toLocaleTimeString();
  logs.value.push(`[${timestamp}] ${message}`);
  logger.debug(message);
};

const checkEnvironment = () => {
  addLog('检查环境...');

  // 检查 plus
  try {
    plusAvailable.value = typeof plus !== 'undefined';
    sqliteAvailable.value = typeof plus !== 'undefined' && typeof plus.sqlite !== 'undefined';
    addLog(`plus 对象: ${plusAvailable.value ? '可用' : '不可用'}`);
    addLog(`plus.sqlite: ${sqliteAvailable.value ? '可用' : '不可用'}`);
  } catch (e) {
    addLog(`检查 plus 时出错: ${e.message}`);
  }

  // 检查环境
  environment.value = sqliteAvailable.value ? 'App (SQLite)' : 'H5 (LocalStorage)';
  addLog(`运行环境: ${environment.value}`);

  // 检查初始化状态
  try {
    const status = getAppStatus();
    appInitialized.value = status.initialized;
    addLog(`应用初始化: ${appInitialized.value ? '已完成' : '未完成'}`);
  } catch (e) {
    addLog(`获取应用状态失败: ${e.message}`);
  }
};

const testDatabase = async () => {
  addLog('开始测试数据库连接...');
  try {
    await db.init();
    dbInitialized.value = true;
    dbType.value = db.isH5 ? 'H5 (LocalStorage)' : 'App (SQLite)';
    addLog('✓ 数据库连接成功');
    addLog(`数据库类型: ${dbType.value}`);
  } catch (e) {
    addLog(`✗ 数据库连接失败: ${e.message}`);
  }
};

const testQuery = async () => {
  addLog('开始测试数据库查询...');
  try {
    const words = await db.getAllWords();
    wordCount.value = words.length;
    addLog(`✓ 查询成功，获得 ${words.length} 个单词`);
    if (words.length > 0) {
      addLog(`第一个单词: ${words[0].english} - ${words[0].chinese}`);
    }
  } catch (e) {
    addLog(`✗ 查询失败: ${e.message}`);
  }
};

const reinitializeApp = async () => {
  addLog('重新初始化应用...');
  try {
    await initializeApp();
    addLog('✓ 应用重新初始化成功');
    checkEnvironment();
  } catch (e) {
    addLog(`✗ 重新初始化失败: ${e.message}`);
  }
};

const clearLogs = () => {
  logs.value = [];
  addLog('日志已清除');
};

const goBack = () => {
  uni.navigateBack();
};

const goToHome = () => {
  uni.reLaunch({
    url: '/pages/index/index'
  });
};

onLoad(() => {
  addLog('诊断工具已加载');
  checkEnvironment();
});
</script>

<style scoped>
.debug-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #333;
  color: white;
}

.debug-title {
  font-size: 18px;
  font-weight: bold;
}

.close-btn {
  padding: 8px 16px;
  background-color: #666;
  color: white;
  border-radius: 4px;
}

.debug-content {
  flex: 1;
  padding: 16px;
}

.debug-section {
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
  display: block;
}

.debug-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.debug-item:last-child {
  border-bottom: none;
}

.label {
  color: #666;
  font-size: 14px;
}

.value {
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.value.success {
  color: #4caf50;
}

.value.error {
  color: #f44336;
}

.test-btn {
  width: 100%;
  padding: 12px;
  margin-top: 8px;
  background-color: #2196f3;
  color: white;
  border-radius: 4px;
  border: none;
}

.log-container {
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.log-line {
  display: block;
  font-size: 12px;
  color: #666;
  font-family: monospace;
  line-height: 1.6;
  word-break: break-all;
}
</style>
