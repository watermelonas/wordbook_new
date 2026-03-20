<template>
  <view class="container">
    <!-- 状态栏占位 -->
    <view class="status-bar"></view>
    
    <!-- 用户信息区域 -->
    <view class="user-card">
      <view class="user-section">
        <view class="avatar">
          <text class="avatar-text">{{ userInitial }}</text>
        </view>
        <view class="user-info">
          <text class="username">{{ displayName }}</text>
          <text class="status">{{ isLoggedIn ? '已登录' : '点击下方按钮登录' }}</text>
          <text class="edit-name-btn" @click.stop="goToEditNickname" v-if="isLoggedIn">编辑昵称</text>
        </view>
      </view>
      
      <!-- 登录按钮 -->
      <view class="login-section" v-if="!isLoggedIn">
        <button class="login-btn" @click="goToLogin">登录 / 注册</button>
      </view>
    </view>
    
    <!-- 当前单词本（与下方卡片统一：同一 card + sync-list 样式） -->
    <view class="card wordbook-card" @click="goToWordbookList">
      <view class="card-title">当前单词本</view>
      <view class="sync-list">
        <view class="sync-item">
          <text class="sync-item-text">{{ currentWordbookLabel }}</text>
          <text class="sync-item-arrow">→</text>
        </view>
      </view>
      <view class="sync-info">
        <text class="info-text">首页与复习将使用所选单词本，轻按可切换</text>
      </view>
    </view>

    <view class="card learning-center-card">
      <view class="card-title">学习中心</view>
      <view class="report-stats">
        <text class="info-text">今日到期 {{ learningSnapshot.dueCount }} 个 · 错词 {{ learningSnapshot.mistakeCount }} 个</text>
        <text class="info-text">首日巩固 {{ learningSnapshot.firstDayDue }} 个 · 连续学习 {{ studyStats.streak || 0 }} 天</text>
      </view>
      <view class="sync-list">
        <view class="sync-item" @click="goToStats">
          <text class="sync-item-text">查看学习统计</text>
          <text class="sync-item-arrow">→</text>
        </view>
        <view class="sync-item" @click="goToMistakes">
          <text class="sync-item-text">打开错词本</text>
          <text class="sync-item-arrow">→</text>
        </view>
        <view class="sync-item" @click="goToMasteredWords">
          <text class="sync-item-text">已斩单词本</text>
          <text class="sync-item-arrow">→</text>
        </view>
        <view class="sync-item" @click="goToDueReview">
          <text class="sync-item-text">开始到期复习</text>
          <text class="sync-item-arrow">→</text>
        </view>
      </view>
    </view>

    <!-- 已登录才显示的功能 -->
    <view v-if="isLoggedIn">
      <!-- 云端数据卡 -->
      <view class="card cloud-card">
        <view class="card-title">云端数据</view>
        
        <view class="sync-list">
          <view class="sync-item" @click="uploadToCloud">
            <text class="sync-item-text">备份到云端</text>
            <text class="sync-item-arrow">→</text>
          </view>
          
          <view class="sync-item" @click="downloadFromCloud">
            <text class="sync-item-text">从云端恢复</text>
            <text class="sync-item-arrow">→</text>
          </view>
        </view>
        
        <view class="sync-info">
          <text class="info-text">本地单词数: {{ localWordCount }}</text>
        </view>
      </view>

      <!-- 本地数据：导入/导出 -->
      <view class="card local-data-card">
        <view class="card-title">本地数据</view>
        <view class="sync-list">
          <view class="sync-item" @click="exportCsv">
            <text class="sync-item-text">导出为 CSV</text>
            <text class="sync-item-arrow">→</text>
          </view>
          <view class="sync-item" @click="exportTxt">
            <text class="sync-item-text">导出为 TXT</text>
            <text class="sync-item-arrow">→</text>
          </view>
          <view class="sync-item" @click="exportTxtEnglishOnly">
            <text class="sync-item-text">仅导出英文</text>
            <text class="sync-item-arrow">→</text>
          </view>
          <view class="sync-item" @click="chooseImportFile">
            <text class="sync-item-text">从 CSV/TXT 导入</text>
            <text class="sync-item-arrow">→</text>
          </view>
        </view>
      </view>

      <!-- 学习报告 -->
      <view class="card report-card">
        <view class="card-title">学习报告</view>
        <view class="report-stats">
          <text class="info-text">总词数 {{ localWordCount }} · 累计查看 {{ totalViewCount }} 次</text>
          <text v-if="lastReviewAccuracy !== null" class="info-text">上次复习正确率 {{ lastReviewAccuracy }}%</text>
        </view>
        <view class="sync-list">
          <view class="sync-item" @click="openAiSuggestion">
            <text class="sync-item-text">查看 AI 复习建议</text>
            <text class="sync-item-arrow">→</text>
          </view>
        </view>
      </view>

      <!-- 退出登录 -->
      <view class="logout-section">
        <text class="logout-text" @click="handleLogout">退出登录</text>
      </view>
    </view>

    <!-- 未登录也显示：本地数据与学习报告（仅统计与导出） -->
    <view v-if="!isLoggedIn" class="card local-data-card">
      <view class="card-title">本地数据</view>
      <view class="sync-list">
        <view class="sync-item" @click="exportCsv">
          <text class="sync-item-text">导出为 CSV</text>
          <text class="sync-item-arrow">→</text>
        </view>
        <view class="sync-item" @click="exportTxt">
          <text class="sync-item-text">导出为 TXT</text>
          <text class="sync-item-arrow">→</text>
        </view>
        <view class="sync-item" @click="exportTxtEnglishOnly">
          <text class="sync-item-text">仅导出英文</text>
          <text class="sync-item-arrow">→</text>
        </view>
        <view class="sync-item" @click="chooseImportFile">
          <text class="sync-item-text">从 CSV/TXT 导入</text>
          <text class="sync-item-arrow">→</text>
        </view>
      </view>
    </view>
    <view v-if="!isLoggedIn" class="card report-card">
      <view class="card-title">学习报告</view>
      <view class="report-stats">
        <text class="info-text">总词数 {{ localWordCount }} · 累计查看 {{ totalViewCount }} 次</text>
        <text v-if="lastReviewAccuracy !== null" class="info-text">上次复习正确率 {{ lastReviewAccuracy }}%</text>
      </view>
      <view class="sync-list">
        <view class="sync-item" @click="openAiSuggestion">
          <text class="sync-item-text">查看 AI 复习建议</text>
          <text class="sync-item-arrow">→</text>
        </view>
      </view>
    </view>

    <!-- 学习报告弹窗（模板：数据统计 + 错误词 + AI 建议） -->
    <view v-if="showAiSuggestionModal" class="modal-overlay" @click.self="showAiSuggestionModal = false">
      <view class="report-modal" @click.stop>
        <view class="modal-title">学习报告</view>
        <scroll-view scroll-y class="report-content">
          <view class="report-section">
            <view class="report-section-title">一、学习数据</view>
            <view class="report-stats-block">
              <view class="report-stat-row">总词数：{{ localWordCount }}</view>
              <view class="report-stat-row">累计查看：{{ totalViewCount }} 次</view>
              <view class="report-stat-row" v-if="lastReviewAccuracy !== null">上次复习正确率：{{ lastReviewAccuracy }}%</view>
              <view class="report-stat-row" v-if="lastReviewResult">上次正确 {{ lastReviewResult.correctCount || 0 }} 题，错误 {{ lastReviewResult.wrongCount || 0 }} 题</view>
            </view>
            <view v-if="lastReviewResult && lastReviewResult.wrongWords && lastReviewResult.wrongWords.length" class="report-wrong-section">
              <view class="report-wrong-title">上次错误单词（{{ lastReviewResult.wrongWords.length }}）</view>
              <view class="report-wrong-list">
                <view v-for="(w, i) in lastReviewResult.wrongWords" :key="i" class="report-wrong-item">{{ w.english }} — {{ w.chinese }}</view>
              </view>
            </view>
          </view>
          <view class="report-section">
            <view class="report-section-title">二、AI 复习建议</view>
            <text class="suggestion-text">{{ aiSuggestionText || '加载中...' }}</text>
          </view>
        </scroll-view>
        <button class="modal-close-btn" @click="showAiSuggestionModal = false">关闭</button>
      </view>
    </view>

    <!-- 导入格式说明弹窗 -->
    <view v-if="showImportModal" class="modal-overlay" @click.self="showImportModal = false">
      <view class="import-modal" @click.stop>
        <view class="modal-title">导入单词</view>
        <scroll-view scroll-y class="import-content">
          <view class="import-section">
            <view class="import-section-title">📋 支持格式</view>
            <view class="format-card">
              <view class="format-name">纯英文单词列表（推荐）</view>
              <view class="format-example">abandon
achieve
academic
accomplish</view>
              <view class="format-note">每行一个单词，释义和例句会自动补全</view>
            </view>
            <view class="format-card">
              <view class="format-name">CSV 格式</view>
              <view class="format-example">abandon
achieve
academic</view>
              <view class="format-note">只需要第一列英文单词，其他列会被忽略</view>
            </view>
            <view class="format-card">
              <view class="format-name">TXT 格式（Tab 分隔）</view>
              <view class="format-example">abandon	放弃
achieve	实现</view>
              <view class="format-note">只需要第一列英文单词，其他列会被忽略</view>
            </view>
          </view>
          
          <view class="import-section">
            <view class="import-section-title">💡 导入步骤</view>
            <view class="step-list">
              <view class="step-item">
                <view class="step-number">1</view>
                <view class="step-text">准备好 CSV 或 TXT 文件</view>
              </view>
              <view class="step-item">
                <view class="step-number">2</view>
                <view class="step-text">复制文件内容到剪贴板</view>
              </view>
              <view class="step-item">
                <view class="step-number">3</view>
                <view class="step-text">点击下方"开始导入"按钮</view>
              </view>
            </view>
          </view>
          
          <view class="import-tips">
            <text class="tips-icon">✨</text>
            <text class="tips-text">只需提供英文单词，释义、例句、近义词等信息会自动从本地数据库补全</text>
          </view>
        </scroll-view>
        
        <view class="modal-actions">
          <button class="modal-btn cancel" @click="showImportModal = false">取消</button>
          <button class="modal-btn confirm" @click="handleFileImport">开始导入</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onShow, onUnload } from '@dcloudio/uni-app';
import db from '../../src/utils/db_v2';
import aiService from '../../src/utils/aiService';
import { getWordBriefBatch } from '../../src/utils/masterDb.js';
import { getLocalWordSnapshot } from '../../src/utils/localWordSnapshot.js';
import { getCurrentWordbook, getWordbookListForUI, setCurrentWordbook, isLocalWordbookKey, loadLocalWordbook, getWordbookWords } from '../../src/utils/wordbookSource';
import { getLearningDashboard, getStudyStats, getLatestSession } from '../../src/utils/learningCenter.js';
import { logger } from '../../src/utils/errorHandler.js';
import { cleanupExpiredCaches } from '../../src/utils/learningCenter_v2.js';

const uid = ref('');
const username = ref('');
const userDisplayName = ref(''); // 用户自定义昵称，优先于登录用户名展示
const isLoggedIn = ref(false);
const localWordCount = ref(0);
const totalViewCount = ref(0);
const lastReviewAccuracy = ref(null);
const lastReviewResult = ref(null);
const showAiSuggestionModal = ref(false);
const showImportModal = ref(false);
const aiSuggestionText = ref('');
const currentWordbookKey = ref(getCurrentWordbook());
const learningSnapshot = ref({ dueCount: 0, mistakeCount: 0, firstDayDue: 0 });
const studyStats = ref({ streak: 0 });

const displayName = computed(() => {
  if (!isLoggedIn.value) return '未登录';
  const name = (userDisplayName.value || username.value || '').trim();
  return name ? `用户名：${name}` : '用户名：—';
});

const currentWordbookLabel = computed(() => {
  const id = currentWordbookKey.value;
  const list = getWordbookListForUI();
  const item = list.find((o) => o.id === id);
  return item ? item.name : '自用单词';
});

const goToWordbookList = () => {
  uni.navigateTo({ url: '/pages/wordbook-list/wordbook-list' });
};

const goToStats = () => {
  uni.navigateTo({ url: '/pages/stats/stats' });
};

const goToMistakes = () => {
  uni.navigateTo({ url: '/pages/mistakes/mistakes' });
};

const goToMasteredWords = () => {
  uni.navigateTo({ url: '/pages/mastered-words/mastered-words' });
};

const goToDueReview = () => {
  uni.navigateTo({ url: '/pages/review/review?preset=due' });
};

const userInitial = computed(() => {
  const name = (userDisplayName.value || username.value || '').trim();
  if (name) return name.charAt(0).toUpperCase();
  return '?';
});

const goToEditNickname = () => {
  uni.navigateTo({ url: '/pages/my/edit-nickname' });
};

onShow(() => {
  currentWordbookKey.value = getCurrentWordbook();
  checkLoginStatus();
});

const onWordbookChanged = () => {
  currentWordbookKey.value = getCurrentWordbook();
};
uni.$on('wordbookChanged', onWordbookChanged);
onUnload(() => {
  uni.$off('wordbookChanged', onWordbookChanged);

  // 清理过期缓存
  try {
    cleanupExpiredCaches();
  } catch (error) {
    logger.warn('My', '清理缓存失败', error);
  }
});

const checkLoginStatus = () => {
  uid.value = uni.getStorageSync('uid') || '';
  username.value = uni.getStorageSync('username') || '';
  userDisplayName.value = uni.getStorageSync('userDisplayName') || '';
  isLoggedIn.value = !!uid.value;
  const last = getLatestSession(getCurrentWordbook()) || uni.getStorageSync('lastReviewResult');
  lastReviewResult.value = last || null;
  lastReviewAccuracy.value = last
    ? (typeof last.accuracy === 'number'
      ? last.accuracy
      : Math.round((Number(last.correctCount || 0) / Math.max(1, Number(last.reviewedCount || 0))) * 100))
    : null;
  loadLocalWordCount();
};

const loadLocalWordCount = async () => {
  try {
    const words = await db.getAllWords();
    localWordCount.value = words.length;
    totalViewCount.value = words.reduce((s, w) => s + (w.view_count || 0), 0);
    const currentBook = getCurrentWordbook();
    let currentPool = words;
    if (currentBook !== 'self') {
      if (isLocalWordbookKey(currentBook)) currentPool = await loadLocalWordbook(currentBook);
      else currentPool = getWordbookWords(currentBook) || [];
    }
    learningSnapshot.value = getLearningDashboard(currentPool, currentBook);
    studyStats.value = getStudyStats(currentPool, currentBook);
  } catch (e) {
    console.error('获取本地单词数失败:', e);
    localWordCount.value = 0;
    totalViewCount.value = 0;
    learningSnapshot.value = { dueCount: 0, mistakeCount: 0, firstDayDue: 0 };
    studyStats.value = { streak: 0 };
  }
};

const goToLogin = () => {
  uni.navigateTo({
    url: '/pages/login/login'
  });
};

const handleLogout = () => {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        uni.removeStorageSync('uid');
        uni.removeStorageSync('username');
        uni.removeStorageSync('userDisplayName');
        uid.value = '';
        username.value = '';
        userDisplayName.value = '';
        isLoggedIn.value = false;
        setCurrentWordbook('红宝书');
        currentWordbookKey.value = '红宝书';
        uni.$emit('wordbookChanged', '红宝书');
        
        uni.showToast({
          title: '已退出登录',
          icon: 'success'
        });
      }
    }
  });
};

const uploadToCloud = async () => {
  if (!isLoggedIn.value) {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    });
    return;
  }
  
  uni.showLoading({
    title: '正在备份...',
    mask: true
  });
  
  try {
    // 获取本地所有单词
    const words = await db.getAllWords();
    const lightWords = words.map((w) => ({
      english: w.english,
      source_page: w.source_page || '',
      year: w.year || '',
      create_time: w.create_time || new Date().toISOString(),
      update_time: w.update_time || new Date().toISOString(),
    }));
    
    console.log('准备上传的轻量单词数据:', lightWords.length);
    
    const result = await uniCloud.callFunction({
      name: 'word-sync',
      data: {
        action: 'upload',
        uid: uid.value,
        words: lightWords
      }
    });
    
    uni.hideLoading();

    if (result.result && result.result.code === 0) {
      // 备份成功后，也备份学习进度
      await backupProgressToCloud();

      uni.showToast({
        title: '备份成功',
        icon: 'success'
      });
    } else {
      uni.showToast({
        title: result.result ? result.result.msg : '备份失败',
        icon: 'none'
      });
    }
  } catch (e) {
    uni.hideLoading();
    console.error('备份失败:', e);
    uni.showToast({
      title: '备份失败: ' + e.message,
      icon: 'none'
    });
  }
};

const downloadFromCloud = async () => {
  if (!isLoggedIn.value) {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    });
    return;
  }
  
  uni.showModal({
    title: '确认恢复',
    content: '从云端恢复会覆盖本地数据，确定要继续吗？',
    success: async (res) => {
      if (res.confirm) {
        await performDownload();
      }
    }
  });
};

const performDownload = async () => {
  const uid = uni.getStorageSync('uid');
  if (!uid) {
    return uni.showToast({ title: '请先登录账号', icon: 'none' });
  }

  uni.showLoading({ title: '正在连接云端...' });

  try {
    console.log('🚀 --- 开始向云端要数据, 账号 uid:', uid);
    
    const res = await uniCloud.callFunction({
      name: 'word-sync',
      data: {
        action: 'download',
        uid: uid
      }
    });
    
    console.log('📦 云端返回的完整包裹:', res);

    if (res.result.code === 0) {
      const cloudWords = res.result.words || res.result.data || [];
      
      if (cloudWords && cloudWords.length > 0) {
        console.log(`✅ 成功拿到 ${cloudWords.length} 个单词！准备写入本地...`);
        const englishList = cloudWords.map((w) => (w.english || '').trim()).filter(Boolean);
        const briefMap = await getWordBriefBatch(englishList).catch(() => ({}));
        const restored = [];
        for (const w of cloudWords) {
          const snapshot = await getLocalWordSnapshot(w.english, { briefMap });
          restored.push({
            ...w,
            chinese: snapshot.chinese || '',
            tags: snapshot.tags || '',
            importance: typeof snapshot.importance === 'number' ? snapshot.importance : (w.importance || 0),
            repeat_count: w.repeat_count || 1,
            view_count: w.view_count != null ? w.view_count : 0,
            is_favorite: w.is_favorite || false,
            examples: snapshot.examples || [],
            synonyms: snapshot.synonyms || [],
            antonyms: snapshot.antonyms || [],
          });
        }
        
        await db.clearAndInsertWords(restored);
        await loadLocalWordCount();
        
        uni.showToast({ title: `成功恢复 ${cloudWords.length} 个单词`, icon: 'success' });
        
        // 👇 新增这一行：向全宇宙广播，单词库更新啦！
        uni.$emit('refreshWordList');
        
        uni.showModal({
          title: '恢复成功',
          content: '请返回首页查看恢复的单词',
          showCancel: false
        });
      } else {
        uni.showToast({ title: '您的云端词库是空的', icon: 'none' });
      }
    } else {
      console.error('❌ 云端拒绝了请求:', res.result.msg);
      uni.showToast({ title: res.result.msg || '恢复失败', icon: 'none' });
    }

  } catch (error) {
    console.error('💥 前端请求崩溃:', error);
    uni.showToast({ title: '网络通信异常', icon: 'error' });
  } finally {
    uni.hideLoading();
  }
};

// 导出为 CSV
const exportCsv = async () => {
  try {
    const words = await db.getAllWords();
    if (!words.length) {
      uni.showToast({ title: '暂无单词可导出', icon: 'none' });
      return;
    }
    const header = '英文,中文,标签,页码,年份,重要程度\n';
    const rows = words.map(w => {
      const eng = (w.english || '').replace(/"/g, '""');
      const chi = (w.chinese || '').replace(/"/g, '""');
      const tags = (w.tags || '').replace(/"/g, '""');
      return `"${eng}","${chi}","${tags}",${w.source_page || ''},${w.year || ''},${w.importance ?? ''}`;
    });
    const csv = '\uFEFF' + header + rows.join('\n');
    uni.setClipboardData({
      data: csv,
      success: () => uni.showToast({ title: '已复制到剪贴板', icon: 'success' })
    });
  } catch (e) {
    uni.showToast({ title: '导出失败', icon: 'none' });
  }
};

// 导出为 TXT（每行：英文\t中文）
const exportTxt = async () => {
  try {
    const words = await db.getAllWords();
    if (!words.length) {
      uni.showToast({ title: '暂无单词可导出', icon: 'none' });
      return;
    }
    const txt = words.map(w => `${w.english || ''}\t${w.chinese || ''}`).join('\n');
    uni.setClipboardData({
      data: txt,
      success: () => uni.showToast({ title: '已复制到剪贴板', icon: 'success' })
    });
  } catch (e) {
    uni.showToast({ title: '导出失败', icon: 'none' });
  }
};

// 仅导出英文（每行一个单词，便于打印记忆）
const exportTxtEnglishOnly = async () => {
  try {
    const words = await db.getAllWords();
    if (!words.length) {
      uni.showToast({ title: '暂无单词可导出', icon: 'none' });
      return;
    }
    const txt = words.map(w => w.english || '').filter(Boolean).join('\n');
    uni.setClipboardData({
      data: txt,
      success: () => uni.showToast({ title: '已复制到剪贴板', icon: 'success' })
    });
  } catch (e) {
    uni.showToast({ title: '导出失败', icon: 'none' });
  }
};

// 选择文件并导入
const chooseImportFile = () => {
  showImportModal.value = true;
};

const handleFileImport = () => {
  // 检测环境
  const isH5 = typeof window !== 'undefined' && typeof document !== 'undefined';
  
  if (isH5) {
    // H5 端使用 HTML input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.txt';
    input.style.cssText = 'position:fixed;top:-100px;left:-100px;opacity:0;';
    input.onchange = (e) => {
      const file = e.target && e.target.files && e.target.files[0];
      if (file) {
        readAndImportFile(file);
        showImportModal.value = false;
      }
    };
    document.body.appendChild(input);
    setTimeout(() => input.click(), 100);
  } else {
    // App 端从剪贴板导入
    showImportModal.value = false;
    uni.getClipboardData({
      success: (clipRes) => {
        const text = clipRes.data || '';
        if (!text.trim()) {
          uni.showToast({ title: '剪贴板为空', icon: 'none' });
          return;
        }
        parseAndImport(text, (err, count) => {
          if (err) uni.showToast({ title: err, icon: 'none', duration: 3000 });
          else {
            uni.showToast({ title: `成功导入 ${count} 个单词`, icon: 'success' });
            uni.$emit('refreshWordList');
            loadLocalWordCount();
          }
        });
      },
      fail: () => {
        uni.showToast({ title: '读取剪贴板失败', icon: 'none' });
      }
    });
  }
};

// H5 用 FileReader 读文件
const readAndImportFile = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = (e.target && e.target.result) || '';
    parseAndImport(text, (err, count) => {
      if (err) uni.showToast({ title: err, icon: 'none' });
      else uni.showToast({ title: `成功导入 ${count} 个单词`, icon: 'success' });
      uni.$emit('refreshWordList');
      loadLocalWordCount();
    });
  };
  reader.readAsText(file, 'UTF-8');
};

// 解析 CSV 或 TXT 并写入数据库（追加，不覆盖）
function parseAndImport(text, callback) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (!lines.length) {
    callback('文件为空或格式不正确', 0);
    return;
  }
  const words = [];
  const isCsv = /,|"/.test(lines[0]);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let eng = '';
    let chi = '';
    if (isCsv) {
      const m = line.match(/("(?:[^"]|"")*"|[^,]*)/g);
      if (m && m.length >= 2) {
        eng = (m[0] || '').replace(/^"|"$/g, '').replace(/""/g, '"').trim();
        chi = (m[1] || '').replace(/^"|"$/g, '').replace(/""/g, '"').trim();
      }
    } else {
      const idx = line.indexOf('\t');
      if (idx >= 0) {
        eng = line.slice(0, idx).trim();
        chi = line.slice(idx + 1).trim();
      } else {
        const sp = line.split(/\s+/);
        eng = sp[0] || '';
        chi = sp.slice(1).join(' ').trim();
      }
    }
    if (eng) {
      words.push({
        english: eng,
        chinese: chi || '',
        importance: 3
      });
    }
  }
  if (!words.length) {
    callback('未能解析出有效单词', 0);
    return;
  }
  (async () => {
    const existingWords = await db.getAllWords().catch(() => []);
    const existingSet = new Set(
      (existingWords || [])
        .map((w) => String(w?.english || '').trim().toLowerCase())
        .filter(Boolean)
    );
    const englishList = [...new Set(words.map((w) => String(w.english || '').trim()).filter(Boolean))];
    const briefMap = await getWordBriefBatch(englishList).catch(() => ({}));
    let count = 0;
    for (const w of words) {
      try {
        const key = String(w.english || '').trim().toLowerCase();
        if (!key || existingSet.has(key)) continue;
        const snapshot = await getLocalWordSnapshot(w.english, { briefMap });
        await db.addWord({
          ...w,
          chinese: snapshot.chinese || w.chinese || '',
          tags: snapshot.tags || '',
          importance: typeof snapshot.importance === 'number' ? snapshot.importance : (w.importance || 0),
          examples: snapshot.examples || [],
          synonyms: snapshot.synonyms || [],
          antonyms: snapshot.antonyms || [],
        });
        existingSet.add(key);
        count++;
      } catch (e) {
        console.warn('跳过重复或无效:', w.english, e);
      }
    }
    callback(null, count);
  })();
}

// 备份学习进度到云端
const backupProgressToCloud = async () => {
  try {
    const uid = uni.getStorageSync('uid');
    if (!uid) return;

    const words = await db.getAllWords();
    const progressData = words.map(w => ({
      english: w.english,
      repeat_count: w.repeat_count || 1,
      view_count: w.view_count || 0,
      error_rate: w.error_rate || 0,
      review_frequency: w.review_frequency || 0,
      importance: w.importance || 3,
      update_time: w.update_time || new Date().toISOString()
    }));

    await uniCloud.callFunction({
      name: 'word-sync',
      data: {
        action: 'backup-progress',
        uid: uid,
        progress: progressData
      }
    });

    console.log('学习进度已备份到云端');
  } catch (e) {
    console.warn('备份学习进度失败:', e);
  }
};

// 打开学习报告（含数据统计 + AI 复习建议）
const openAiSuggestion = async () => {
  showAiSuggestionModal.value = true;
  lastReviewResult.value = getLatestSession(getCurrentWordbook()) || uni.getStorageSync('lastReviewResult') || null;
  aiSuggestionText.value = '正在生成建议...';
  try {
    const words = await db.getAllWords();
    const suggestion = await aiService.generateReviewSuggestion(words);
    aiSuggestionText.value = suggestion || '暂无建议';
  } catch (e) {
    aiSuggestionText.value = '生成失败，请检查网络或稍后重试。';
  }
};
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #FFF8FB;
  padding: 20px;
  padding-top: 0;
}

.status-bar {
  min-height: 44px;
  height: calc(44px + constant(safe-area-inset-top));
  height: calc(44px + env(safe-area-inset-top));
  width: 100%;
  background: #FFF8FB;
  margin: 0 -20px;
  padding: 0 20px;
}

/* 用户卡片 */
.user-card {
  background-color: white;
  border-radius: 24px;
  padding: 30px 20px;
  margin-bottom: 15px;
  box-shadow: 0 10px 30px rgba(255, 133, 161, 0.08);
}

.user-section {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.avatar {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF85A1, #FFB3C6);
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 20px;
  box-shadow: 0 4px 14px rgba(255, 133, 161, 0.3);
}

.avatar-text {
  font-size: 28px;
  color: #FFFFFF;
  font-weight: bold;
  text-shadow: 0 1px 4px rgba(184, 92, 111, 0.4);
}

.user-info {
  flex: 1;
}

.username {
  display: block;
  font-size: 20px;
  font-weight: bold;
  color: #5B5565;
  margin-bottom: 5px;
}

.edit-name-btn {
  display: inline-block;
  font-size: 14px;
  color: #FF85A1;
  margin-top: 6px;
  padding: 4px 0;
}

.edit-name-btn:active {
  opacity: 0.8;
}

.status {
  display: block;
  font-size: 16px;
  color: #4A4E69;
}

.login-section {
  margin-top: 20px;
}

.login-btn {
  width: 100%;
  padding: 15px;
  background-color: #FF85A1;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 18px;
}

/* 通用卡片样式 */
.card {
  background-color: white;
  border-radius: 24px;
  padding: 20px;
  margin-bottom: 15px;
  box-shadow: 0 10px 30px rgba(255, 133, 161, 0.08);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #4A4E69;
  margin-bottom: 16px;
}

/* 云端数据卡 */
.cloud-card {
  margin-bottom: 15px;
}

.sync-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.sync-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-radius: 12px;
  background-color: #FFF5F7;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.sync-item:active {
  background-color: #FFE5EC;
}

.sync-item-text {
  font-size: 14px;
  color: #FF85A1;
}

.sync-item-arrow {
  font-size: 14px;
  color: #999;
}

.sync-info {
  margin-bottom: 0;
}

.info-text {
  font-size: 14px;
  color: #8E8798;
}

/* 退出登录 */
.logout-section {
  margin-top: 20px;
  text-align: center;
}

.logout-text {
  font-size: 14px;
  color: #999;
  cursor: pointer;
  padding: 10px;
}

.logout-text:active {
  color: #666;
}

.local-data-card,
.report-card {
  margin-bottom: 15px;
}

.report-stats {
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.modal-overlay {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.suggestion-modal,
.report-modal {
  width: 90%;
  max-height: 78vh;
  background: #fff;
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #4A4E69;
  margin-bottom: 12px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.modal-btn {
  padding: 10px 20px;
  font-size: 15px;
  border: none;
  border-radius: 12px;
}

.modal-btn.cancel {
  background: #FFF1F5;
  color: #7A7284;
  border: 1px solid #F3DCE5;
}

.modal-btn.confirm {
  background: #FF85A1;
  color: white;
}

.report-content,
.suggestion-content {
  flex: 1;
  min-height: 200px;
  max-height: 55vh;
  margin-bottom: 16px;
}

.report-section {
  margin-bottom: 20px;
}

.report-section-title {
  font-size: 15px;
  font-weight: 600;
  color: #FF85A1;
  margin-bottom: 10px;
}

.report-stats-block {
  background: #FFF5F7;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 12px;
}

.report-stat-row {
  font-size: 14px;
  color: #4A4E69;
  line-height: 1.8;
}

.report-wrong-section {
  margin-top: 10px;
}

.report-wrong-title {
  font-size: 13px;
  color: #888;
  margin-bottom: 6px;
}

.report-wrong-list {
  max-height: 120px;
  overflow-y: auto;
}

.report-wrong-item {
  font-size: 13px;
  color: #5B5565;
  padding: 4px 0;
  border-bottom: 1px solid #F5E7ED;
}

.suggestion-text {
  font-size: 14px;
  color: #5B5565;
  line-height: 1.6;
  white-space: pre-wrap;
}

.modal-close-btn {
  background: #FF85A1 !important;
  color: #fff !important;
  border: none;
  border-radius: 12px;
  padding: 12px;
}

/* 导入模态框样式 */
.import-modal {
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  background: linear-gradient(135deg, #FFF8FB 0%, #FFFFFF 100%);
  border-radius: 24px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(255, 133, 161, 0.25);
}

.import-content {
  flex: 1;
  min-height: 200px;
  max-height: 55vh;
  margin-bottom: 20px;
}

.import-section {
  margin-bottom: 24px;
}

.import-section-title {
  font-size: 16px;
  font-weight: 600;
  color: #FF85A1;
  margin-bottom: 12px;
}

.format-card {
  background: #FFF5F7;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  border: 2px solid #FFE5EC;
}

.format-name {
  font-size: 14px;
  font-weight: 600;
  color: #5B5565;
  margin-bottom: 8px;
}

.format-example {
  font-size: 12px;
  font-family: 'Courier New', monospace;
  color: #7A7284;
  background: #FFFFFF;
  padding: 12px;
  border-radius: 8px;
  line-height: 1.6;
  white-space: pre;
  overflow-x: auto;
  border: 1px solid #F3DCE5;
  margin-bottom: 8px;
}

.format-note {
  font-size: 12px;
  color: #999;
  font-style: italic;
}

.step-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #FFF5F7;
  border-radius: 12px;
}

.step-number {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF85A1, #FFB3C6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(255, 133, 161, 0.3);
}

.step-text {
  font-size: 14px;
  color: #5B5565;
  flex: 1;
}

.import-tips {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #FFF5F7, #FFE5EC);
  border-radius: 12px;
  border-left: 4px solid #FF85A1;
}

.tips-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.tips-text {
  font-size: 13px;
  color: #7A7284;
  line-height: 1.5;
}
</style>

