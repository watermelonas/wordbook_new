<template>
  <div class="virtual-scroller-wrapper" :style="{ height: containerHeight + 'px' }">
    <scroll-view
      class="virtual-scroller"
      scroll-y
      :style="{ height: containerHeight + 'px' }"
      @scroll="handleScroll"
      :refresher-enabled="refresherEnabled"
      :refresher-triggered="refresherTriggered"
      @refresherrefresh="$emit('refresherrefresh')"
      @scrolltolower="$emit('scrolltolower')"
    >
      <!-- 顶部占位符 -->
      <div :style="{ height: offsetY + 'px' }" class="virtual-spacer-top" />

      <!-- 可见项 -->
      <div
        v-for="(item, index) in visibleItems"
        :key="getItemKey(item, visibleStart + index)"
        :style="{ minHeight: itemHeight + 'px' }"
        class="virtual-item"
      >
        <slot :item="item" :index="visibleStart + index" />
      </div>

      <!-- 底部占位符 -->
      <div :style="{ height: bottomSpacerHeight + 'px' }" class="virtual-spacer-bottom" />
    </scroll-view>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  itemHeight: {
    type: Number,
    default: 80
  },
  containerHeight: {
    type: Number,
    default: 600
  },
  bufferSize: {
    type: Number,
    default: 5
  },
  keyField: {
    type: String,
    default: 'id'
  },
  refresherEnabled: {
    type: Boolean,
    default: false
  },
  refresherTriggered: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['scroll', 'refresherrefresh', 'scrolltolower']);

const scrollTop = ref(0);
const visibleStart = ref(0);

/**
 * 计算可见的项数
 */
const visibleCount = computed(() => {
  return Math.ceil(props.containerHeight / props.itemHeight) + props.bufferSize * 2;
});

/**
 * 计算可见范围的结束索引
 */
const visibleEnd = computed(() => {
  return Math.min(props.items.length, visibleStart.value + visibleCount.value);
});

/**
 * 获取可见的项
 */
const visibleItems = computed(() => {
  return props.items.slice(visibleStart.value, visibleEnd.value);
});

/**
 * 计算顶部占位符高度
 */
const offsetY = computed(() => {
  return visibleStart.value * props.itemHeight;
});

/**
 * 计算底部占位符高度
 */
const bottomSpacerHeight = computed(() => {
  const totalHeight = props.items.length * props.itemHeight;
  const usedHeight = offsetY.value + visibleItems.value.length * props.itemHeight;
  return Math.max(0, totalHeight - usedHeight);
});

/**
 * 处理滚动事件
 */
const handleScroll = (e) => {
  scrollTop.value = e.detail.scrollTop;

  // 更新可见范围
  const newStart = Math.max(
    0,
    Math.floor(scrollTop.value / props.itemHeight) - props.bufferSize
  );

  if (newStart !== visibleStart.value) {
    visibleStart.value = newStart;
  }

  // 发出滚动事件
  emit('scroll', {
    scrollTop: scrollTop.value,
    visibleStart: visibleStart.value,
    visibleEnd: visibleEnd.value,
    visibleItems: visibleItems.value
  });
};

/**
 * 获取项的唯一键
 */
const getItemKey = (item, index) => {
  if (typeof item === 'object' && item !== null) {
    return item[props.keyField] || index;
  }
  return index;
};

/**
 * 监听 items 变化
 */
watch(
  () => props.items,
  () => {
    // 重置滚动位置
    visibleStart.value = 0;
    scrollTop.value = 0;
  },
  { deep: false }
);

/**
 * 滚动到指定位置
 */
const scrollToIndex = (index) => {
  const targetScrollTop = Math.max(0, index * props.itemHeight);
  scrollTop.value = targetScrollTop;
  visibleStart.value = Math.max(0, index - props.bufferSize);
};

/**
 * 暴露方法
 */
defineExpose({
  scrollToIndex
});
</script>

<style scoped>
.virtual-scroller-wrapper {
  width: 100%;
  overflow: hidden;
}

.virtual-scroller {
  width: 100%;
  height: 100%;
}

.virtual-spacer-top,
.virtual-spacer-bottom {
  pointer-events: none;
}

.virtual-item {
  width: 100%;
}
</style>
