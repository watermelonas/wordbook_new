# 斩掉单词动画代码

## 1. 响应式变量声明

```javascript
const removingWords = ref({});      // 被删除的单词标记
const movingUpWords = ref({});      // 上移的单词标记
```

## 2. 模板部分

```vue
<template #default="{ item: word, index }">
  <view
    class="word-item"
    :class="{
      'word-item-removing': removingWords[(word.english || '').trim().toLowerCase()],
      'word-item-moving-up': movingUpWords[(word.english || '').trim().toLowerCase()]
    }"
  >
    <!-- 单词内容 -->
  </view>
</template>
```

## 3. 斩掉单词的函数逻辑

```javascript
const masterWord = async (word) => {
  if (!word || !word.english) return;

  const wordKey = (word.english || '').trim().toLowerCase();

  // 1. 立即标记该单词，触发 CSS 渐隐和折叠动画
  removingWords.value[wordKey] = true;

  try {
    const bookId = getCurrentWordbook();

    // 如果是词书单词，添加到已斩列表并从词书中移除
    if (bookId && bookId !== 'self') {
      const { getWordbookWords, setWordbookWords } = await import('../../src/utils/wordbookSource.js');
      const { addGlobalMasteredWord } = await import('../../src/utils/masteredWordbookWords.js');

      addGlobalMasteredWord(word.english);

      const masteredWords = getWordbookWords('mastered') || [];
      const exists = masteredWords.some(w => (w.english || '').trim().toLowerCase() === (word.english || '').trim().toLowerCase());
      if (!exists) {
        masteredWords.push({
          english: word.english,
          chinese: word.chinese || '',
          mastered_at: new Date().toISOString()
        });
        setWordbookWords('mastered', masteredWords);
      }

      const bookWords = getWordbookWords(bookId) || [];
      const filtered = bookWords.filter(w => (w.english || '').trim().toLowerCase() !== wordKey);
      setWordbookWords(bookId, filtered);

      uni.showToast({ title: '已斩掉', icon: 'success' });
    } else {
      await db.deleteWord(word.english);
      uni.showToast({ title: '已斩掉', icon: 'success' });
    }

    // 2. 等待动画完全完成：被斩单词淡出 + 下面单词上移都是 500ms
    // 再加 50ms 缓冲，确保虚拟滚动不会在动画中途重新计算
    await new Promise(resolve => setTimeout(resolve, 550));

    // 3. 动画完成后，从列表中移除元素
    words.value = words.value.filter(w => (w.english || '').trim().toLowerCase() !== wordKey);
    delete removingWords.value[wordKey];
    movingUpWords.value = {}; // 清空上移标记

  } catch (e) {
    logger.error('Index', '斩掉单词失败', e);
    delete removingWords.value[wordKey];
    movingUpWords.value = {};
    uni.showToast({ title: '操作失败', icon: 'none' });
  }
};
```

## 4. CSS 样式部分

```css
.word-item {
  background-color: white;
  padding: 16px 20px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(255, 133, 161, 0.08);
  margin: 8px 10px;
  width: calc(100% - 20px);
  position: relative;
  box-sizing: border-box;

  /* 自适应高度，不限制内容显示 */
  opacity: 1;
  transform: translateX(0) scale(1);
  max-height: none;
  /* 不添加默认过渡，避免淡入和闪烁 */
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 只有移除状态才添加过渡 */
.word-item.word-item-removing {
  transition: opacity 0.5s linear,
              transform 0.5s linear,
              margin 0.5s linear,
              padding 0.5s linear;
}

/* 斩击触发后的状态 */
.word-item-removing {
  opacity: 0 !important;
  transform: translateX(40px) scale(0.95) !important;

  /* 平滑折叠：margin 和 padding 归零 */
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
  border: none !important;
}

/* 上移动画：独立的线性上移，不受虚拟滚动影响 */
.word-item-moving-up {
  animation: moveUp 0.5s linear forwards;
}

@keyframes moveUp {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    /* 假设被删除单词的高度约为 100px（包括 margin） */
    transform: translateY(-100px);
    opacity: 1;
  }
}
```

## 动画流程说明

1. **用户点击"斩"按钮** → `masterWord()` 被调用
2. **立即标记** → `removingWords[wordKey] = true`
3. **CSS 触发** → `.word-item-removing` 类被应用
   - 被斩单词：淡出 + 右移 + 缩小（0.5s linear）
   - 下面单词：上移动画（0.5s linear）
4. **等待 550ms** → 确保所有动画完成
5. **删除单词** → 从 `words.value` 中移除
6. **清空标记** → 删除 `removingWords` 和 `movingUpWords` 的标记

## 关键问题

目前的问题是：**前半程线性，后半程突然加速**

可能的原因：
1. 虚拟滚动在 550ms 时重新计算，导致下面的单词位置改变
2. 动画的 100px 高度计算不准确，实际单词高度可能不同
3. 虚拟滚动的占位符变化与动画不同步
