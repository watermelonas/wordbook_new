<template>
  <view class="container">
    <!-- 自定义返回按钮 -->
    <view class="custom-nav-bar">
      <view class="nav-back-btn" @click="goBack">‹</view>
    </view>
    <view class="main-content">
      <!-- 英文单词输入 -->
      <view class="qa-english-wrap">
        <input
          type="text"
          v-model="word.english"
          @input="searchWord"
          placeholder="请输入英文单词..."
          :disabled="isSaving"
          class="qa-english-input"
        />
      </view>

      <!-- 页码和年份输入 -->
      <view class="qa-meta-row">
        <view class="qa-meta-item">
          <text class="qa-meta-label">P.</text>
          <input type="number" v-model="word.source_page" placeholder="页码" class="qa-meta-input" />
        </view>
        <view class="qa-meta-item">
          <text class="qa-meta-label">Year</text>
          <input type="number" v-model="word.year" placeholder="年份" class="qa-meta-input" />
        </view>
      </view>

      <!-- 添加到哪个单词本 -->
      <view class="add-to-wordbook-row">
        <text class="add-to-label">添加到单词本</text>
        <VocalColorBlockSelector
          :range="addToWordbookOptions"
          :value="addToWordbookIndex"
          @change="onAddToWordbookChange"
        >
          <view class="add-to-picker">{{ addToWordbookLabel }}</view>
        </VocalColorBlockSelector>
      </view>

      <!-- 单词信息 -->
      <div v-if="foundWord" style="background-color: #f5f7fa; padding: 15px; border-radius: 12px; margin-top: 20px;">
        <div style="font-size: 14px; line-height: 1.5;">
          <span style="font-weight: bold; color: #4A4E69; margin-right: 8px;">中文释义：</span>
          <span>{{ foundWord.chinese }}</span>
        </div>
      </div>
    </view>

    <!-- 底部导航 -->
    <view class="footer">
      <button @click="goBack" :disabled="isSaving">取消</button>
      <button @click="saveQuick" :disabled="isSaving">快速保存</button>
      <button @click="saveAndEdit" :disabled="isSaving">保存并编辑</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import VocalColorBlockSelector from "../../components/vocal-color-block-selector/vocal-color-block-selector.vue";
import { onShow, onUnload } from "@dcloudio/uni-app";
import db from "../../src/utils/db_v2";
import aiService from "../../src/utils/aiService.js";
import { formatWordStatsForPrompt } from "../../src/utils/wordStats.js";
import * as pregenVocab from "../../src/utils/pregenVocab.js";
import * as masterDb from "../../src/utils/masterDb.js";
import { getLocalWordSnapshot } from "../../src/utils/localWordSnapshot.js";
import { getCloudWordbooks, getWordbookWords, setWordbookWords } from "../../src/utils/wordbookSource.js";
import { noteNewWordLearned } from "../../src/utils/learningCenter.js";
import { logger, errorHandler } from "../../src/utils/errorHandler.js";
import { cleanupExpiredCaches } from "../../src/utils/learningCenter_v2.js";

const word = ref({
  english: "",
  chinese: "",
  importance: 3, // 默认三星
  source_page: "",
  year: "",
  tags: "",
});

const foundWord = ref(null);
const isLoading = ref(false);
const isSaving = ref(false);

const goBack = () => uni.navigateBack();

const cloudWordbooks = ref(getCloudWordbooks());
const addToWordbook = ref(cloudWordbooks.value[0]?.id || 'self');
const addToWordbookOptions = computed(() => cloudWordbooks.value.map((o) => o.name));
const addToWordbookIndex = computed(() => {
  const i = cloudWordbooks.value.findIndex((o) => o.id === addToWordbook.value);
  return i >= 0 ? i : 0;
});
const addToWordbookLabel = computed(() => {
  const w = cloudWordbooks.value.find((o) => o.id === addToWordbook.value);
  return w ? w.name : '自用单词';
});
const onAddToWordbookChange = (e) => {
  const i = Number(e.detail.value) || 0;
  const w = cloudWordbooks.value[i];
  addToWordbook.value = w ? w.id : 'self';
};

const applyLocalSnapshotToWord = (local) => {
  if (!local || typeof local !== 'object') return;
  if (local.chinese && !word.value.chinese) word.value.chinese = local.chinese;
  if (local.tags) word.value.tags = local.tags;
  if (typeof local.importance === 'number') word.value.importance = local.importance;
  word.value.examples = local.examples || [];
  word.value.synonyms = local.synonyms || [];
  word.value.antonyms = local.antonyms || [];
};

const normalizeWordHeavyFields = () => {
  word.value.examples = word.value.examples || [];
  word.value.synonyms = word.value.synonyms || [];
  word.value.antonyms = word.value.antonyms || [];
};

let _searchTimer = null;
const searchWord = () => {
  if (_searchTimer) clearTimeout(_searchTimer);
  if (!word.value.english) {
    foundWord.value = null;
    return;
  }
  _searchTimer = setTimeout(async () => {
    _searchTimer = null;
    const english = word.value.english;
    if (!english) return;
    foundWord.value = null;
    const local = await getLocalWordSnapshot(english);
    // 防止输入变化后旧结果覆盖新输入
    if (word.value.english !== english) return;
    if (local && local.chinese) {
      foundWord.value = { word: english.trim(), chinese: local.chinese };
      word.value.chinese = local.chinese;
    } else {
      word.value.chinese = "";
    }
  }, 400);
};

const saveQuick = async () => {
  // 防止重复提交
  if (isSaving.value) {
    return;
  }
  
  if (!word.value.english || !word.value.chinese) {
    uni.showToast({
      title: "请输入英文单词",
      duration: 2000
    });
    return;
  }

  try {
    const targetId = addToWordbook.value || 'self';

    if (targetId !== 'self') {
      // 添加到用户新建的单词本（storage）
      const list = getWordbookWords(targetId) || [];
      const existing = list.find((w) => (w.english || '').toLowerCase() === word.value.english.toLowerCase());
      if (existing) {
        uni.showToast({ title: '该单词本中已存在该词', icon: 'none' });
        return;
      }
      const local = await getLocalWordSnapshot(word.value.english);
      applyLocalSnapshotToWord(local);
      isSaving.value = true;
      normalizeWordHeavyFields();
      const newWord = {
        id: String(Date.now()),
        ...word.value,
        create_time: new Date().toISOString(),
        update_time: new Date().toISOString(),
        view_count: 0,
      };
      list.push(newWord);
      setWordbookWords(targetId, list);
      noteNewWordLearned(newWord, { bookId: targetId, source: 'quick-add' });
      uni.showToast({ title: '已加入首日巩固', icon: 'none', duration: 1800 });
      uni.$emit('refreshWordList');
      uni.navigateTo({ url: '/pages/index/index' });
      return;
    }

    // 自用单词本：写入 DB（用轻量查询做去重，不再全量 SELECT *）
    const existingList = await db.getWordsForList(1, 0, 'create_time', 'desc', { search: word.value.english.trim() });
    const existingWord = existingList.find(
      (w) => (w.english || '').toLowerCase() === word.value.english.toLowerCase(),
    );

    if (existingWord) {
      const newRepeat = (existingWord.repeat_count || 0) + 1;
      await db.updateWord(existingWord.id, {
        repeat_count: newRepeat,
        update_time: new Date().toISOString(),
      });
      uni.showToast({
        title: `该单词已存在，重复次数已增加到 ${newRepeat} 次`,
        duration: 2000
      });
      uni.navigateTo({ url: `/pages/word-detail/word-detail?id=${existingWord.id}` });
      return;
    }

    const local = await getLocalWordSnapshot(word.value.english);
    applyLocalSnapshotToWord(local);
    isSaving.value = true;
    normalizeWordHeavyFields();

    const payload = { ...word.value };
    const added = await db.addWord(payload);
    const addedId = added?.id;
    noteNewWordLearned({ ...payload, id: addedId }, { bookId: 'self', source: 'quick-add' });

    uni.showToast({ title: "已加入首日巩固", icon: 'none', duration: 1800 });
    uni.navigateTo({ url: "/pages/index/index" });

    const english = word.value.english;
    (async () => {
      try {
        const pregen = await pregenVocab.getPregenWord(english);
        if (pregen && (pregen.examples?.length || pregen.synonyms?.length || pregen.antonyms?.length)) {
          const updates = { update_time: new Date().toISOString() };
          if (pregen.examples?.length) updates.examples = pregen.examples;
          if (pregen.synonyms?.length) updates.synonyms = pregen.synonyms;
          if (pregen.antonyms?.length) updates.antonyms = pregen.antonyms;
          if (Object.keys(updates).length > 1) {
            await db.updateWord(addedId, updates);
            uni.$emit("wordEnriched", addedId);
          }
          return;
        }
        // AI 生成时只需要少量样例词，用轻量查询
        const recentWords = await db.getWordsForList(10, 0, 'create_time', 'desc', {});
        const existingWords = recentWords
          .filter((w) => w.english && w.english.toLowerCase() !== english.toLowerCase())
          .map((w) => w.english)
          .slice(0, 10);
        let examStatsText = "";
        try {
          const examData = await masterDb.getWordExamData(english);
          if (examData?.examStats) examStatsText = formatWordStatsForPrompt(examData.examStats);
        } catch (_) {}
        const [result, antonyms] = await Promise.all([
          aiService.generateExamplesAndSynonyms(english, existingWords, examStatsText),
          aiService.generateAntonyms(english, 3),
        ]);
        const updates = { update_time: new Date().toISOString() };
        if (result?.examples?.length) updates.examples = result.examples;
        if (result?.synonyms?.length) updates.synonyms = result.synonyms;
        if (antonyms?.length) updates.antonyms = antonyms;
        if (Object.keys(updates).length > 1) {
          await db.updateWord(addedId, updates);
          uni.$emit("wordEnriched", addedId);
        }
      } catch (_) {}
    })();
  } catch (error) {
    console.error("保存失败:", error);
    uni.showToast({ title: "保存失败，请重试", icon: "none", duration: 2000 });
  } finally {
    isSaving.value = false;
  }
};

const saveAndEdit = async () => {
  if (isSaving.value) return;
  if (!word.value.english || !word.value.chinese) {
    uni.showToast({ title: "请输入英文单词", duration: 2000 });
    return;
  }

  try {
    const targetId = addToWordbook.value || 'self';
    if (targetId !== 'self') {
      const list = getWordbookWords(targetId) || [];
      const existing = list.find((w) => (w.english || '').toLowerCase() === word.value.english.toLowerCase());
      if (existing) {
        uni.showToast({ title: '该单词本中已存在该词', icon: 'none' });
        return;
      }
      const local = await getLocalWordSnapshot(word.value.english);
      applyLocalSnapshotToWord(local);
      isSaving.value = true;
      normalizeWordHeavyFields();
      const newWord = {
        id: String(Date.now()),
        ...word.value,
        create_time: new Date().toISOString(),
        update_time: new Date().toISOString(),
        view_count: 0,
      };
      list.push(newWord);
      setWordbookWords(targetId, list);
      noteNewWordLearned(newWord, { bookId: targetId, source: 'quick-add' });
      uni.showToast({ title: '已加入首日巩固', icon: 'none', duration: 1800 });
      uni.$emit('refreshWordList');
      uni.navigateTo({ url: '/pages/index/index' });
      return;
    }

    // 用轻量查询做去重
    const existingList2 = await db.getWordsForList(1, 0, 'create_time', 'desc', { search: word.value.english.trim() });
    const existingWord = existingList2.find(
      (w) => (w.english || '').toLowerCase() === word.value.english.toLowerCase(),
    );

    if (existingWord) {
      const newRepeat = (existingWord.repeat_count || 0) + 1;
      await db.updateWord(existingWord.id, {
        repeat_count: newRepeat,
        update_time: new Date().toISOString(),
      });
      uni.showToast({
        title: `该单词已存在，重复次数已增加到 ${newRepeat} 次`,
        duration: 1000
      });
      uni.navigateTo({ url: `/pages/word-detail/word-detail?id=${existingWord.id}` });
      return;
    }

    const local = await getLocalWordSnapshot(word.value.english);
    applyLocalSnapshotToWord(local);
    isSaving.value = true;
    normalizeWordHeavyFields();

    const payload = { ...word.value };
    const added = await db.addWord(payload);
    const addedId = added?.id;
    noteNewWordLearned({ ...payload, id: addedId }, { bookId: 'self', source: 'quick-add' });

    uni.showToast({ title: "已加入首日巩固", icon: 'none', duration: 1800 });
    uni.navigateTo({ url: `/pages/word-detail/word-detail?id=${addedId}` });

    const english = word.value.english;
    (async () => {
      try {
        const pregen = await pregenVocab.getPregenWord(english);
        if (pregen && (pregen.examples?.length || pregen.synonyms?.length || pregen.antonyms?.length)) {
          const updates = { update_time: new Date().toISOString() };
          if (pregen.examples?.length) updates.examples = pregen.examples;
          if (pregen.synonyms?.length) updates.synonyms = pregen.synonyms;
          if (pregen.antonyms?.length) updates.antonyms = pregen.antonyms;
          if (Object.keys(updates).length > 1) {
            await db.updateWord(addedId, updates);
            uni.$emit("wordEnriched", addedId);
          }
          return;
        }
        const recentWords2 = await db.getWordsForList(10, 0, 'create_time', 'desc', {});
        const existingWords = recentWords2
          .filter((w) => w.english && w.english.toLowerCase() !== english.toLowerCase())
          .map((w) => w.english)
          .slice(0, 10);
        let examStatsText = "";
        try {
          const examData = await masterDb.getWordExamData(english);
          if (examData?.examStats) examStatsText = formatWordStatsForPrompt(examData.examStats);
        } catch (_) {}
        const [result, antonyms] = await Promise.all([
          aiService.generateExamplesAndSynonyms(english, existingWords, examStatsText),
          aiService.generateAntonyms(english, 3),
        ]);
        const updates = { update_time: new Date().toISOString() };
        if (result?.examples?.length) updates.examples = result.examples;
        if (result?.synonyms?.length) updates.synonyms = result.synonyms;
        if (antonyms?.length) updates.antonyms = antonyms;
        if (Object.keys(updates).length > 1) {
          await db.updateWord(addedId, updates);
          uni.$emit("wordEnriched", addedId);
        }
      } catch (_) {}
    })();
  } catch (error) {
    console.error("保存失败:", error);
    uni.showToast({ title: "保存失败，请重试", icon: "none", duration: 2000 });
  } finally {
    isSaving.value = false;
  }
};

onMounted(async () => {
  cloudWordbooks.value = getCloudWordbooks();
  const lastWord = await db.getLastWord();
  if (lastWord) {
    word.value.source_page = lastWord.source_page || "";
    word.value.year = lastWord.year || "";
  }
});

onShow(() => {
  cloudWordbooks.value = getCloudWordbooks();
});

onUnload(() => {
  // 清理过期缓存
  try {
    cleanupExpiredCaches();
  } catch (error) {
    logger.warn('QuickAdd', '清理缓存失败', error);
  }
});
</script>

<style scoped>
.custom-nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  min-height: 74px; /* 24px状态栏 + 50px导航栏 */
  height: calc(74px + constant(safe-area-inset-top));
  height: calc(74px + env(safe-area-inset-top));
  padding-top: calc(24px + constant(safe-area-inset-top));
  padding-top: calc(24px + env(safe-area-inset-top));
  display: flex;
  align-items: center;
  padding-left: 4px;
  z-index: 999;
  background: transparent;
}

.nav-back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px 8px 8px;
  font-size: 38px;
  color: #B85C6F;
  font-weight: 300;
  line-height: 1;
  min-width: 56px;
  min-height: 56px;
}

.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #FFF8FB;
  padding-top: calc(74px + constant(safe-area-inset-top)); /* 24px状态栏 + 50px导航栏 */
  padding-top: calc(74px + env(safe-area-inset-top));
  padding-bottom: 100px;
}

.input-section {
  margin-bottom: 25px;
  pointer-events: auto;
  z-index: 2;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  background-color: transparent;
  margin-bottom: 20px;
}

.back-arrow {
  padding: 8px;
}

.arrow-icon {
  font-size: 24px;
  color: #FF85A1;
  font-weight: bold;
}

.header-title {
  flex: 1;
  text-align: center;
}

.title-text {
  font-size: 18px;
  font-weight: bold;
  color: #4A4E69;
}

.add-to-wordbook-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 14px 0;
  padding: 0 4%;
}
.add-to-label {
  font-size: 14px;
  color: #4A4E69;
  font-weight: 500;
}
.add-to-picker {
  padding: 10px 16px;
  background-color: #FFF5F7;
  border-radius: 12px;
  font-size: 14px;
  color: #B85C6F;
  min-width: 120px;
}

.header-right {
  width: 40px;
}

.main-content {
  background-color: white;
  margin: 0 20px;
  padding: 30px;
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(255, 133, 161, 0.08);
  margin-bottom: 100px;
}

.english-input {
  width: 100%;
  padding: 20px;
  border: 1px solid #FF85A1;
  border-radius: 15px;
  background-color: #FFF5F7;
  font-size: 16px;
  color: #B85C6F;
  box-sizing: border-box;
  margin-bottom: 20px;
  height: 60px;
  line-height: 20px;
  display: block;
  pointer-events: auto;
}

.english-input::placeholder {
  color: #A0AEC0;
}

.aux-inputs {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  height: 40px;
}

.aux-input {
  flex: 1;
  padding: 0 12px;
  border: 1px solid #FF85A1;
  border-radius: 8px;
  background-color: white;
  font-size: 14px;
  color: #4A4E69;
  box-sizing: border-box;
  height: 100%;
  line-height: 38px;
}

.aux-input::placeholder {
  color: #A0AEC0;
}

.section-label {
  font-size: 14px;
  color: #4A4E69;
  font-weight: 500;
}

.word-info {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 12px;
  margin-top: 20px;
}

.info-item {
  font-size: 14px;
  line-height: 1.5;
}

.info-item .label {
  font-weight: bold;
  color: #4A4E69;
  margin-right: 8px;
}

.bottom-buttons {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: white;
  padding: 20px;
  box-shadow: 0 -5px 20px rgba(255, 133, 161, 0.1);
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 10;
}

.cancel-button {
  flex: 1;
  background: none;
  border: none;
  color: #A0AEC0;
  font-size: 14px;
  padding: 12px;
  text-align: left;
}

.quick-save-button {
  flex: 1;
  padding: 12px;
  background: none;
  border: none;
  color: #FF85A1;
  font-size: 14px;
  border-radius: 8px;
}

.save-edit-button {
  flex: 1;
  padding: 12px;
  background-color: #FF85A1;
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 8px rgba(255, 133, 161, 0.3);
  transition: transform 0.3s ease;
}

.save-edit-button:active {
  transform: scale(0.95);
}

/* 底部导航 */
.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 60px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0;
  background-color: #FFF0F3;
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -4px 16px rgba(255, 133, 161, 0.1);
  z-index: 100;
}

.footer button {
  flex: 1;
  padding: 8px 12px;
  font-size: 15px;
  font-weight: 500;
  background: transparent !important;
  color: #FF85A1 !important;
  border: none !important;
  border-radius: 0 !important;
  transition: all 0.3s ease;
  text-align: center;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.footer button::after {
  display: none !important;
}

.footer button:active {
  opacity: 0.7;
}

.form-row {
  margin-bottom: 16px;
  width: 92%;
  margin-left: auto;
  margin-right: auto;
}

.form-label {
  display: block;
  font-size: 14px;
  color: #4A4E69;
  margin-bottom: 8px;
}

.tags-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tags-row .tags-input {
  flex: 1;
  padding: 10px 14px;
  border-radius: 12px;
  background: #FFF5F7;
  font-size: 14px;
  border: none;
}

.form-row .btn-tag {
  flex-shrink: 0;
  padding: 10px 16px;
  background: transparent;
  color: #FF85A1;
  border: 2px solid #FF85A1;
  border-radius: 12px;
  font-size: 14px;
}

.recommended-tags {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.recommended-tags .tag-chip {
  padding: 6px 12px;
  border-radius: 14px;
  background: #FFF0F3;
  color: #FF85A1;
  font-size: 13px;
}

/* 新增：统一输入区样式 */
.qa-english-wrap {
  margin-bottom: 16px;
}

.qa-english-input {
  width: 100%;
  padding: 0 18px;
  border: 1.5px solid #F4A3B8 !important;
  border-radius: 16px !important;
  background-color: #FFF5F7 !important;
  font-size: 18px;
  color: #B85C6F !important;
  box-sizing: border-box;
  height: 56px;
  font-weight: 600;
}

.qa-meta-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin: 12px 0;
}

.qa-meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #FFF5F7;
  border-radius: 12px;
  padding: 6px 12px;
}

.qa-meta-label {
  font-size: 12px;
  color: #B85C6F;
  font-weight: 600;
  white-space: nowrap;
}

.qa-meta-input {
  width: 90px;
  padding: 8px 10px;
  border: none !important;
  background-color: transparent !important;
  font-size: 14px;
  color: #4A4E69 !important;
  text-align: center;
  height: 36px;
  border-radius: 8px !important;
  box-sizing: border-box;
}
</style>