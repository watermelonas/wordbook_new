/**
 * 云端进度同步管理器
 * 负责用户学习进度的云端备份和恢复
 */

import * as db from './db_v2.js';
import { getWordProfile } from './learningCenter_v2.js';

const SYNC_LOG_KEY = 'cloud_sync_log_v1';
const SYNC_CACHE_KEY = 'cloud_sync_cache_v1';

class CloudProgressSync {
	constructor() {
		this.syncing = false;
		this.lastSyncTime = null;
		this.syncCache = {};
	}

	/**
	 * 初始化同步
	 */
	async initSync() {
		try {
			const uid = uni.getStorageSync('uid');
			if (!uid) {
				console.log('[CloudSync] 用户未登录，跳过同步');
				return false;
			}

			// 加载同步日志
			const syncLog = uni.getStorageSync(SYNC_LOG_KEY) || {};
			this.lastSyncTime = syncLog.lastSyncTime;

			console.log('[CloudSync] 初始化完成，上次同步时间:', this.lastSyncTime);
			return true;
		} catch (e) {
			console.error('[CloudSync] 初始化失败:', e);
			return false;
		}
	}

	/**
	 * 上传学习进度
	 */
	async uploadProgress(wordbook = 'self') {
		if (this.syncing) {
			console.log('[CloudSync] 正在同步中，跳过本次上传');
			return false;
		}

		try {
			const uid = uni.getStorageSync('uid');
			if (!uid) {
				console.log('[CloudSync] 用户未登录');
				return false;
			}

			this.syncing = true;
			console.log('[CloudSync] 开始上传进度...');

			// 获取所有单词
			const allWords = await db.getAllWords();
			if (!allWords || allWords.length === 0) {
				console.log('[CloudSync] 没有单词需要上传');
				this.syncing = false;
				return true;
			}

			// 收集需要上传的进度
			const updates = [];
			for (const word of allWords) {
				const profile = getWordProfile(word);
				if (profile) {
					updates.push({
						english: profile.english,
						seen_count: profile.seen_count || 0,
						review_count: profile.review_count || 0,
						correct_count: profile.correct_count || 0,
						wrong_count: profile.wrong_count || 0,
						mastery: profile.mastery || 0,
						difficulty_score: profile.difficulty_score || 0.35,
						stability: profile.stability || 0.6,
						retrievability: profile.retrievability || 0.92,
						interval_days: profile.interval_days || 0,
						lapse_count: profile.lapse_count || 0,
						next_review_time: profile.next_review_time || '',
						last_reviewed_at: profile.last_reviewed_at || '',
						error_count: profile.error_count || 0
					});
				}
			}

			if (updates.length === 0) {
				console.log('[CloudSync] 没有进度需要上传');
				this.syncing = false;
				return true;
			}

			// 调用云函数上传
			const result = await uniCloud.callFunction({
				name: 'user-progress-sync',
				data: {
					action: 'uploadProgress',
					uid: uid,
					wordbook: wordbook,
					updates: updates
				}
			});

			if (result.result.code === 0) {
				// 更新同步日志
				this.lastSyncTime = result.result.lastSyncTime;
				uni.setStorageSync(SYNC_LOG_KEY, {
					lastSyncTime: this.lastSyncTime,
					lastUploadTime: new Date().toISOString(),
					uploadCount: result.result.count
				});

				console.log('[CloudSync] 上传成功，共', result.result.count, '个单词');
				this.syncing = false;
				return true;
			} else {
				console.error('[CloudSync] 上传失败:', result.result.msg);
				this.syncing = false;
				return false;
			}
		} catch (e) {
			console.error('[CloudSync] 上传异常:', e);
			this.syncing = false;
			return false;
		}
	}

	/**
	 * 下载学习进度
	 */
	async downloadProgress(wordbook = 'self') {
		if (this.syncing) {
			console.log('[CloudSync] 正在同步中，跳过本次下载');
			return null;
		}

		try {
			const uid = uni.getStorageSync('uid');
			if (!uid) {
				console.log('[CloudSync] 用户未登录');
				return null;
			}

			this.syncing = true;
			console.log('[CloudSync] 开始下载进度...');

			// 调用云函数下载
			const result = await uniCloud.callFunction({
				name: 'user-progress-sync',
				data: {
					action: 'downloadProgress',
					uid: uid,
					wordbook: wordbook,
					lastSyncTime: this.lastSyncTime
				}
			});

			if (result.result.code === 0) {
				const data = result.result;

				// 更新同步日志
				this.lastSyncTime = data.lastSyncTime;
				uni.setStorageSync(SYNC_LOG_KEY, {
					lastSyncTime: this.lastSyncTime,
					lastDownloadTime: new Date().toISOString(),
					masteredCount: data.masteredWords.length,
					mistakeCount: data.mistakeWords.length
				});

				console.log('[CloudSync] 下载成功');
				this.syncing = false;
				return data;
			} else {
				console.error('[CloudSync] 下载失败:', result.result.msg);
				this.syncing = false;
				return null;
			}
		} catch (e) {
			console.error('[CloudSync] 下载异常:', e);
			this.syncing = false;
			return null;
		}
	}

	/**
	 * 上传已掌握单词
	 */
	async uploadMastered(masteredWords, wordbook = 'self') {
		try {
			const uid = uni.getStorageSync('uid');
			if (!uid) {
				console.log('[CloudSync] 用户未登录');
				return false;
			}

			if (!Array.isArray(masteredWords) || masteredWords.length === 0) {
				console.log('[CloudSync] 没有已掌握单词需要上传');
				return true;
			}

			console.log('[CloudSync] 上传已掌握单词...');

			const result = await uniCloud.callFunction({
				name: 'user-progress-sync',
				data: {
					action: 'uploadMastered',
					uid: uid,
					wordbook: wordbook,
					masteredWords: masteredWords
				}
			});

			if (result.result.code === 0) {
				console.log('[CloudSync] 已掌握单词上传成功');
				return true;
			} else {
				console.error('[CloudSync] 已掌握单词上传失败:', result.result.msg);
				return false;
			}
		} catch (e) {
			console.error('[CloudSync] 上传已掌握单词异常:', e);
			return false;
		}
	}

	/**
	 * 上传错词本
	 */
	async uploadMistakes(mistakeWords, wordbook = 'self') {
		try {
			const uid = uni.getStorageSync('uid');
			if (!uid) {
				console.log('[CloudSync] 用户未登录');
				return false;
			}

			if (!Array.isArray(mistakeWords) || mistakeWords.length === 0) {
				console.log('[CloudSync] 没有错词需要上传');
				return true;
			}

			console.log('[CloudSync] 上传错词本...');

			const result = await uniCloud.callFunction({
				name: 'user-progress-sync',
				data: {
					action: 'uploadMistakes',
					uid: uid,
					wordbook: wordbook,
					mistakeWords: mistakeWords
				}
			});

			if (result.result.code === 0) {
				console.log('[CloudSync] 错词本上传成功');
				return true;
			} else {
				console.error('[CloudSync] 错词本上传失败:', result.result.msg);
				return false;
			}
		} catch (e) {
			console.error('[CloudSync] 上传错词本异常:', e);
			return false;
		}
	}

	/**
	 * 合并本地和云端数据（冲突解决）
	 */
	mergeProgressData(localData, cloudData) {
		if (!cloudData) return localData;

		const merged = { ...localData };

		// 对于每个单词，比较时间戳，使用更新的数据
		for (const english in cloudData.wordProgress) {
			const cloudWord = cloudData.wordProgress[english];
			const localWord = localData[english];

			if (!localWord) {
				// 本地没有，使用云端
				merged[english] = cloudWord;
			} else {
				// 比较更新时间，使用更新的
				const cloudTime = new Date(cloudWord.last_reviewed_at || 0).getTime();
				const localTime = new Date(localWord.last_reviewed_at || 0).getTime();

				if (cloudTime > localTime) {
					merged[english] = cloudWord;
				}
			}
		}

		return merged;
	}

	/**
	 * 合并已掌握单词（取并集）
	 */
	mergeMasteredWords(localMastered, cloudMastered) {
		const merged = new Set(localMastered || []);
		if (cloudMastered) {
			cloudMastered.forEach(word => merged.add(word));
		}
		return Array.from(merged);
	}

	/**
	 * 合并错词本
	 */
	mergeMistakeWords(localMistakes, cloudMistakes) {
		const merged = {};

		// 先加入本地错词
		if (localMistakes) {
			localMistakes.forEach(mistake => {
				merged[mistake.english] = mistake;
			});
		}

		// 再加入云端错词，使用更新的数据
		if (cloudMistakes) {
			cloudMistakes.forEach(cloudMistake => {
				const localMistake = merged[cloudMistake.english];
				if (!localMistake) {
					merged[cloudMistake.english] = cloudMistake;
				} else {
					// 比较时间，使用更新的
					const cloudTime = new Date(cloudMistake.last_wrong_at || 0).getTime();
					const localTime = new Date(localMistake.last_wrong_at || 0).getTime();

					if (cloudTime > localTime) {
						merged[cloudMistake.english] = cloudMistake;
					}
				}
			});
		}

		return Object.values(merged);
	}

	/**
	 * 获取同步状态
	 */
	getSyncStatus() {
		const syncLog = uni.getStorageSync(SYNC_LOG_KEY) || {};
		return {
			lastSyncTime: this.lastSyncTime,
			lastUploadTime: syncLog.lastUploadTime,
			lastDownloadTime: syncLog.lastDownloadTime,
			syncing: this.syncing
		};
	}
}

// 导出单例
export default new CloudProgressSync();
