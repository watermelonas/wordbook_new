<template>
	<div id="app"></div>
</template>

<script>
import { logger } from './src/utils/errorHandler.js';

export default {
	name: 'App',
	onLaunch() {
		logger.info('App', 'onLaunch 被触发');
	},
	onShow() {
		logger.info('App', 'onShow 被触发');
	},
	onHide() {
		logger.info('App', 'onHide 被触发');
	}
}
</script>

<style>
* {
	margin: 0;
	padding: 0;
	box-sizing: border-box;
}

html, body, #app {
	width: 100%;
	height: 100%;
}

body {
	background-color: #FFF0F3;
}

/* 覆盖 uni-app 下拉刷新的背景颜色 */
:deep(.uni-scroll-view__refresh) {
	background-color: #FFF0F3 !important;
}

:deep(.uni-scroll-view__refresh-inner) {
	background-color: #FFF0F3 !important;
}
</style>
