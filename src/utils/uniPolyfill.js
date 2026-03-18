/**
 * uni-app API Polyfill
 * 为浏览器环境提供uni API的基本实现
 */

// 全局uni对象
window.uni = window.uni || {}

// 页面栈管理
const pageStack = []

// getApp() - 获取应用实例
window.getApp = function() {
  return {
    globalData: {},
    $vm: null
  }
}

// getCurrentPages() - 获取当前页面栈
window.getCurrentPages = function() {
  return pageStack
}

// 导航相关
window.uni.navigateTo = function(options) {
  const { url, success, fail } = options
  if (url) {
    window.location.hash = url
    success && success()
  } else {
    fail && fail({ errMsg: 'navigateTo:fail invalid url' })
  }
}

window.uni.redirectTo = function(options) {
  const { url, success, fail } = options
  if (url) {
    window.location.hash = url
    success && success()
  } else {
    fail && fail({ errMsg: 'redirectTo:fail invalid url' })
  }
}

window.uni.navigateBack = function(options) {
  const { delta = 1 } = options || {}
  window.history.go(-delta)
}

// 存储相关 - 异步版本
window.uni.setStorage = function(options) {
  const { key, data, success, fail } = options
  try {
    localStorage.setItem(key, JSON.stringify(data))
    success && success()
  } catch (error) {
    fail && fail({ errMsg: error.message })
  }
}

window.uni.getStorage = function(options) {
  const { key, success, fail } = options
  try {
    const data = localStorage.getItem(key)
    if (data) {
      success && success({ data: JSON.parse(data) })
    } else {
      fail && fail({ errMsg: 'getStorage:fail key not found' })
    }
  } catch (error) {
    fail && fail({ errMsg: error.message })
  }
}

window.uni.removeStorage = function(options) {
  const { key, success, fail } = options
  try {
    localStorage.removeItem(key)
    success && success()
  } catch (error) {
    fail && fail({ errMsg: error.message })
  }
}

window.uni.clearStorage = function(options) {
  const { success, fail } = options || {}
  try {
    localStorage.clear()
    success && success()
  } catch (error) {
    fail && fail({ errMsg: error.message })
  }
}

// 存储相关 - 同步版本
window.uni.setStorageSync = function(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error('setStorageSync error:', error)
  }
}

window.uni.getStorageSync = function(key) {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('getStorageSync error:', error)
    return null
  }
}

window.uni.removeStorageSync = function(key) {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('removeStorageSync error:', error)
  }
}

window.uni.clearStorageSync = function() {
  try {
    localStorage.clear()
  } catch (error) {
    console.error('clearStorageSync error:', error)
  }
}

// 提示相关
window.uni.showToast = function(options) {
  const { title, icon = 'success', duration = 1500 } = options
  console.log(`[Toast] ${title}`)
  // 可以在这里添加实际的Toast UI实现
}

window.uni.showLoading = function(options) {
  const { title = 'Loading...' } = options || {}
  console.log(`[Loading] ${title}`)
}

window.uni.hideLoading = function() {
  console.log('[Loading] hidden')
}

window.uni.showModal = function(options) {
  const { title, content, success, fail } = options
  const result = confirm(`${title}\n${content}`)
  if (result) {
    success && success({ confirm: true })
  } else {
    success && success({ confirm: false })
  }
}

// 系统信息
window.uni.getSystemInfo = function(options) {
  const { success, fail } = options
  try {
    const info = {
      platform: navigator.platform,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      statusBarHeight: 0,
      navigationBarHeight: 44,
      language: navigator.language,
      version: '1.0.0',
      system: navigator.userAgent
    }
    success && success(info)
  } catch (error) {
    fail && fail({ errMsg: error.message })
  }
}

window.uni.getSystemInfoSync = function() {
  return {
    platform: navigator.platform,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
    statusBarHeight: 0,
    navigationBarHeight: 44,
    language: navigator.language,
    version: '1.0.0',
    system: navigator.userAgent
  }
}

// 请求相关
window.uni.request = function(options) {
  const { url, method = 'GET', data, header = {}, success, fail, complete } = options

  fetch(url, {
    method,
    headers: header,
    body: method !== 'GET' ? JSON.stringify(data) : undefined
  })
    .then(response => response.json())
    .then(responseData => {
      success && success({
        data: responseData,
        statusCode: 200,
        header: {}
      })
      complete && complete()
    })
    .catch(error => {
      fail && fail({ errMsg: error.message })
      complete && complete()
    })
}

// 文件相关
window.uni.chooseImage = function(options) {
  const { success, fail } = options
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.multiple = true

  input.onchange = (e) => {
    const files = Array.from(e.target.files)
    const tempFilePaths = files.map(file => URL.createObjectURL(file))
    success && success({ tempFilePaths })
  }

  input.onerror = () => {
    fail && fail({ errMsg: 'chooseImage:fail' })
  }

  input.click()
}

// 页面相关
window.uni.pageScrollTo = function(options) {
  const { scrollTop = 0 } = options
  window.scrollTo(0, scrollTop)
}

// 设备相关
window.uni.vibrate = function(options) {
  const { duration = 15 } = options || {}
  if (navigator.vibrate) {
    navigator.vibrate(duration)
  }
}

// 剪贴板
window.uni.setClipboardData = function(options) {
  const { data, success, fail } = options
  navigator.clipboard.writeText(data)
    .then(() => success && success())
    .catch(error => fail && fail({ errMsg: error.message }))
}

window.uni.getClipboardData = function(options) {
  const { success, fail } = options
  navigator.clipboard.readText()
    .then(text => success && success({ data: text }))
    .catch(error => fail && fail({ errMsg: error.message }))
}

export default window.uni
