/**
 * uni-app 生命周期兼容插件
 * 将uni-app的生命周期钩子映射到Vue 3的标准钩子
 */

import { onMounted, onUnmounted, onActivated, onDeactivated } from 'vue'

export function createUniLifecyclePlugin() {
  return {
    install(app) {
      // 在Vue原型上添加uni生命周期支持
      app.mixin({
        setup() {
          const instance = this

          return {
            // 支持onLoad (页面加载)
            onLoad(callback) {
              onMounted(callback)
            },
            // 支持onShow (页面显示)
            onShow(callback) {
              onActivated(callback)
            },
            // 支持onHide (页面隐藏)
            onHide(callback) {
              onDeactivated(callback)
            },
            // 支持onUnload (页面卸载)
            onUnload(callback) {
              onUnmounted(callback)
            },
            // 支持onReady (页面初次渲染完成)
            onReady(callback) {
              onMounted(callback)
            }
          }
        }
      })
    }
  }
}

export default createUniLifecyclePlugin()
