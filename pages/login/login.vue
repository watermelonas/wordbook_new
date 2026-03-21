<template>
  <view class="container">
    <view class="login-box">
      <view class="title-wrap">
        <text class="title">个人单词本</text>
        <text class="subtitle">登录 / 注册</text>
      </view>

      <view class="form-item">
        <view class="label">用户名</view>
        <view class="input-wrap" @tap.stop>
          <input
            type="text"
            v-model="username"
            placeholder="请输入用户名"
            class="input"
          />
        </view>
      </view>

      <view class="form-item">
        <view class="label">密码</view>
        <view class="input-wrap" @tap.stop>
          <input
            type="password"
            v-model="password"
            placeholder="请输入密码"
            class="input"
          />
        </view>
      </view>

      <view class="form-item captcha-row">
        <view class="captcha-label-wrap">
          <view class="label">验证码</view>
          <view class="captcha-refresh" @click="generateCaptcha">换一张</view>
        </view>
        <view class="captcha-input-row">
          <view class="input-wrap" @tap.stop>
            <input
              type="text"
              v-model="captchaInput"
              placeholder="请输入验证码"
              class="input captcha-input"
              maxlength="4"
            />
          </view>
          <view class="captcha-display" @click.stop="generateCaptcha">
            <view
              v-for="(ch, i) in captchaCode"
              :key="i"
              class="captcha-char"
              :style="captchaCharStyle(i)"
            >{{ ch }}</view>
          </view>
        </view>
      </view>

      <button class="login-btn" @click="handleLogin" :disabled="isLoading">
        {{ isLoading ? '处理中...' : '登录 / 注册' }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// ========== 响应式数据 ==========
// 用户输入的用户名
const username = ref('');
// 用户输入的密码
const password = ref('');
// 用户输入的验证码
const captchaInput = ref('');
// 生成的验证码（4位随机字符）
const captchaCode = ref('');
// 登录按钮加载状态
const isLoading = ref(false);

// ========== 验证码配置 ==========
// 验证码可用字符（排除容易混淆的字符如 I、O、1、0）
const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * 生成随机验证码
 * - 生成4位随机字符
 * - 清空用户输入框
 */
const generateCaptcha = () => {
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  captchaCode.value = code;
  captchaInput.value = '';
};

/**
 * 为验证码字符设置样式
 * - 每个字符有不同的旋转角度（增加防爬虫效果）
 * - 每个字符有不同的颜色（提升视觉效果）
 * @param {number} index - 字符索引（0-3）
 * @returns {object} 包含 transform 和 color 的样式对象
 */
const captchaCharStyle = (index) => {
  const rotations = [-8, 5, -4, 6];  // 每个字符的旋转角度
  const colors = ['#FF85A1', '#4A4E69', '#E91E63', '#5C6BC0'];  // 每个字符的颜色
  return {
    transform: `rotate(${rotations[index]}deg)`,
    color: colors[index % colors.length]
  };
};

/**
 * 页面挂载时生成初始验证码
 */
onMounted(() => {
  generateCaptcha();
});

/**
 * 处理登录逻辑
 * 流程：
 * 1. 验证用户名和密码不为空
 * 2. 验证验证码是否正确
 * 3. 调用云函数进行登录认证
 * 4. 保存用户信息到本地存储
 * 5. 返回上一页
 */
const handleLogin = async () => {
  // 检查用户名和密码是否为空
  if (!username.value || !password.value) {
    uni.showToast({
      title: '请输入用户名和密码',
      icon: 'none'
    });
    return;
  }

  // 验证验证码（转大写并去除空格）
  const input = captchaInput.value.toUpperCase().trim();
  if (input !== captchaCode.value) {
    uni.showToast({
      title: '验证码错误',
      icon: 'none'
    });
    generateCaptcha();  // 验证码错误时重新生成
    return;
  }

  isLoading.value = true;

  try {
    // 显示加载中提示
    uni.showLoading({
      title: '请稍候...',
      mask: true
    });

    // 调用云函数 user-center 进行登录
    const result = await uniCloud.callFunction({
      name: 'user-center',
      data: {
        username: username.value,
        password: password.value
      }
    });

    uni.hideLoading();

    // 检查登录是否成功（code === 0 表示成功）
    if (result.result && result.result.code === 0) {
      // 保存用户信息到本地存储
      uni.setStorageSync('uid', result.result.uid);
      uni.setStorageSync('username', result.result.username);
      uni.setStorageSync('userDisplayName', result.result.displayName || result.result.username);

      uni.showToast({
        title: result.result.msg,
        icon: 'success'
      });

      // 1.5秒后返回上一页
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    } else {
      // 登录失败，显示错误信息
      uni.showToast({
        title: result.result ? result.result.msg : '登录失败',
        icon: 'none'
      });
      generateCaptcha();  // 登录失败时重新生成验证码
    }
  } catch (e) {
    uni.hideLoading();
    logger.error('登录失败:', e);
    uni.showToast({
      title: '网络错误，请稍后重试',
      icon: 'none'
    });
    generateCaptcha();  // 网络错误时重新生成验证码
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #FFF0F3;
  padding: 24px;
  padding-top: calc(env(safe-area-inset-top) + 24px);
}

.login-box {
  background-color: #FFFFFF;
  padding: 36px 28px;
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(255, 133, 161, 0.12);
  width: 100%;
  max-width: 380px;
}

.title-wrap {
  text-align: center;
  margin-bottom: 32px;
}

.title {
  display: block;
  font-size: 22px;
  font-weight: 700;
  color: #4A4E69;
  margin-bottom: 6px;
}

.subtitle {
  font-size: 14px;
  color: #FF85A1;
}

.form-item {
  margin-bottom: 20px;
}

.label {
  display: block;
  font-size: 14px;
  color: #4A4E69;
  margin-bottom: 8px;
  font-weight: 500;
}

.input-wrap {
  min-height: 48px;
}

.input {
  width: 100%;
  height: 48px;
  padding: 0 18px;
  border-radius: 999px;
  font-size: 16px;
  background-color: #FFF0F3;
  border: 1px solid #FFE4E9;
  color: #4A4E69;
  box-sizing: border-box;
}

.input::placeholder {
  color: #FFB3C1;
}

.captcha-row .label {
  margin-bottom: 4px;
}

.captcha-label-wrap {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.captcha-refresh {
  font-size: 13px;
  color: #FF85A1;
  padding: 4px 8px;
}

.captcha-input-row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.captcha-input {
  flex: 1;
  min-width: 0;
  height: 44px;
  padding: 0 14px;
}

.captcha-display {
  flex-shrink: 0;
  min-width: 100px;
  max-width: 140px;
  height: 44px;
  background: linear-gradient(135deg, #FFF0F3 0%, #FFE4E9 100%);
  border: 1px solid #FFE4E9;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  letter-spacing: 4px;
}

.captcha-char {
  font-size: 20px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  display: inline-block;
}

.login-btn {
  width: 100%;
  padding: 16px;
  margin-top: 28px;
  background-color: #FF85A1;
  color: white;
  border: none;
  border-radius: 999px;
  font-size: 17px;
  font-weight: 600;
}

.login-btn:disabled {
  background-color: #FFB3C1;
  opacity: 0.8;
}
</style>
