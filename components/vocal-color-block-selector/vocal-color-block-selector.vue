<template>
  <view class="vocal-selector">
    <view class="selector-trigger" @click="open">
      <slot></slot>
    </view>
    <view v-if="visible" class="selector-overlay" @click="close"></view>
    <view v-if="visible" class="selector-drawer">
      <view class="drawer-handle"></view>
      <scroll-view scroll-y class="drawer-body">
        <view
          v-for="(item, idx) in displayRange"
          :key="idx"
          class="block-option"
          :class="{ selected: idx === currentIndex }"
          @click="select(idx)"
        >
          <text class="block-text">{{ item }}</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  range: { type: Array, default: () => [] },
  value: { type: Number, default: 0 },
});

const emit = defineEmits(['change']);

const visible = ref(false);
const currentIndex = ref(0);

const displayRange = computed(() => {
  const r = props.range;
  return Array.isArray(r) ? r : [];
});

watch(() => props.value, (v) => {
  currentIndex.value = Math.max(0, Math.min(Number(v) || 0, displayRange.value.length - 1));
}, { immediate: true });

function open() {
  currentIndex.value = Math.max(0, Math.min(props.value, displayRange.value.length - 1));
  visible.value = true;
}

function close() {
  visible.value = false;
}

function select(idx) {
  emit('change', { detail: { value: idx } });
  close();
}
</script>

<style scoped>
.vocal-selector {
  position: relative;
}

.selector-trigger {
  min-height: 44rpx;
}

.selector-overlay {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 998;
}

.selector-drawer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: auto;
  max-height: 36vh;
  min-height: 180rpx;
  background: #ffffff;
  z-index: 999;
  border-radius: 20rpx 20rpx 0 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.drawer-handle {
  width: 60rpx;
  height: 6rpx;
  background: #F1C8D5;
  border-radius: 3rpx;
  margin: 16rpx auto 10rpx;
  flex-shrink: 0;
}

.drawer-body {
  flex: 1;
  padding: 0 20rpx 24rpx;
  overflow-y: auto;
  width: 100%;
  box-sizing: border-box;
}

.block-option {
  background: #FFF5F8;
  margin-bottom: 10rpx;
  padding: 18rpx 24rpx;
  border-radius: 10rpx;
  border: 1px solid #F3DCE5;
  width: 100%;
  box-sizing: border-box;
  max-width: 100%;
  overflow: hidden;
}

.block-option:last-child {
  margin-bottom: 0;
}

.block-option.selected {
  background: #F48FB1;
  border-color: #F48FB1;
}

.block-text {
  font-size: 30rpx;
  color: #5B5565;
  word-break: break-all;
  overflow-wrap: break-word;
  display: block;
}

.block-option.selected .block-text {
  color: #ffffff;
  font-weight: bold;
}
</style>
