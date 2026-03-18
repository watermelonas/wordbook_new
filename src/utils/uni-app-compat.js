/**
 * @dcloudio/uni-app 兼容层
 * 提供uni-app的生命周期钩子
 */

import { onMounted, onUnmounted, onActivated, onDeactivated } from 'vue'

// 导出uni-app的生命周期钩子，映射到Vue 3的标准钩子
export function onLoad(callback) {
  onMounted(callback)
}

export function onShow(callback) {
  onActivated(callback)
}

export function onHide(callback) {
  onDeactivated(callback)
}

export function onUnload(callback) {
  onUnmounted(callback)
}

export function onReady(callback) {
  onMounted(callback)
}

export function onBackPress(callback) {
  // 浏览器中处理返回按钮
  window.addEventListener('popstate', () => {
    callback && callback()
  })
}

export function onPullDownRefresh(callback) {
  // 浏览器中不支持下拉刷新，但提供空实现
  console.warn('onPullDownRefresh is not supported in browser environment')
}

export function onReachBottom(callback) {
  // 浏览器中不支持到底加载，但提供空实现
  console.warn('onReachBottom is not supported in browser environment')
}

export function onPageScroll(callback) {
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    callback({ scrollTop })
  })
}

export function onShareAppMessage(callback) {
  // 浏览器中不支持分享，但提供空实现
  console.warn('onShareAppMessage is not supported in browser environment')
}

export function onShareTimeline(callback) {
  // 浏览器中不支持分享到朋友圈，但提供空实现
  console.warn('onShareTimeline is not supported in browser environment')
}

export default {
  onLoad,
  onShow,
  onHide,
  onUnload,
  onReady,
  onBackPress,
  onPullDownRefresh,
  onReachBottom,
  onPageScroll,
  onShareAppMessage,
  onShareTimeline
}
