'use strict';

exports.main = async (event, context) => {
	const db = uniCloud.database();
	const { action, uid, wordbook } = event;

	if (!uid || !wordbook) {
		return { code: -1, msg: '用户ID和词书ID不能为空' };
	}

	try {
		switch (action) {
			case 'uploadProgress':
				return await uploadProgress(db, uid, wordbook, event.updates);
			case 'downloadProgress':
				return await downloadProgress(db, uid, wordbook, event.lastSyncTime);
			case 'uploadMastered':
				return await uploadMastered(db, uid, wordbook, event.masteredWords);
			case 'uploadMistakes':
				return await uploadMistakes(db, uid, wordbook, event.mistakeWords);
			default:
				return { code: -1, msg: '未知操作' };
		}
	} catch (e) {
		console.error('user-progress-sync 错误:', e);
		return { code: -3, msg: '操作失败: ' + e.message };
	}
};

/**
 * 上传用户学习进度
 */
async function uploadProgress(db, uid, wordbook, updates) {
	if (!Array.isArray(updates) || updates.length === 0) {
		return { code: -1, msg: '更新数据不能为空' };
	}

	const collection = db.collection('user_progress');
	const now = new Date().toISOString();
	let successCount = 0;

	for (const update of updates) {
		const { english } = update;
		if (!english) continue;

		try {
			// 查询是否存在
			const existing = await collection
				.where({
					user_id: uid,
					wordbook_id: wordbook,
					english: english
				})
				.get();

			if (existing.data && existing.data.length > 0) {
				// 更新现有记录
				await collection.doc(existing.data[0]._id).update({
					...update,
					updated_at: now
				});
			} else {
				// 创建新记录
				await collection.add({
					user_id: uid,
					wordbook_id: wordbook,
					...update,
					created_at: now,
					updated_at: now
				});
			}
			successCount++;
		} catch (e) {
			console.error(`上传单词 ${english} 失败:`, e);
		}
	}

	// 更新同步日志
	await updateSyncLog(db, uid, wordbook, 'upload', successCount);

	return {
		code: 0,
		msg: '上传成功',
		count: successCount,
		lastSyncTime: now
	};
}

/**
 * 下载用户学习进度
 */
async function downloadProgress(db, uid, wordbook, lastSyncTime) {
	try {
		const progressCollection = db.collection('user_progress');
		const masteredCollection = db.collection('user_mastered_words');
		const mistakeCollection = db.collection('user_mistake_words');

		// 查询学习进度
		let progressQuery = progressCollection.where({
			user_id: uid,
			wordbook_id: wordbook
		});

		if (lastSyncTime) {
			progressQuery = progressQuery.where('updated_at', '>=', lastSyncTime);
		}

		const progressRes = await progressQuery.get();
		const wordProgress = {};

		if (progressRes.data && progressRes.data.length > 0) {
			progressRes.data.forEach(item => {
				wordProgress[item.english] = {
					seen_count: item.seen_count || 0,
					review_count: item.review_count || 0,
					correct_count: item.correct_count || 0,
					wrong_count: item.wrong_count || 0,
					mastery: item.mastery || 0,
					difficulty_score: item.difficulty_score || 0.35,
					stability: item.stability || 0.6,
					retrievability: item.retrievability || 0.92,
					interval_days: item.interval_days || 0,
					lapse_count: item.lapse_count || 0,
					next_review_time: item.next_review_time || '',
					last_reviewed_at: item.last_reviewed_at || '',
					error_count: item.error_count || 0
				};
			});
		}

		// 查询已掌握单词
		const masteredRes = await masteredCollection
			.where({
				user_id: uid,
				wordbook_id: wordbook
			})
			.get();

		const masteredWords = masteredRes.data ? masteredRes.data.map(item => item.english) : [];

		// 查询错词本
		const mistakeRes = await mistakeCollection
			.where({
				user_id: uid,
				wordbook_id: wordbook
			})
			.get();

		const mistakeWords = mistakeRes.data ? mistakeRes.data.map(item => ({
			english: item.english,
			error_count: item.error_count || 0,
			recover_count: item.recover_count || 0,
			active: item.active !== false,
			last_wrong_at: item.last_wrong_at || ''
		})) : [];

		const now = new Date().toISOString();

		return {
			code: 0,
			msg: '下载成功',
			masteredWords,
			mistakeWords,
			wordProgress,
			lastSyncTime: now
		};
	} catch (e) {
		console.error('下载进度失败:', e);
		return { code: -3, msg: '下载失败: ' + e.message };
	}
}

/**
 * 上传已掌握单词
 */
async function uploadMastered(db, uid, wordbook, masteredWords) {
	if (!Array.isArray(masteredWords) || masteredWords.length === 0) {
		return { code: 0, msg: '没有已掌握单词', count: 0 };
	}

	const collection = db.collection('user_mastered_words');
	const now = new Date().toISOString();
	let successCount = 0;

	for (const english of masteredWords) {
		try {
			const existing = await collection
				.where({
					user_id: uid,
					wordbook_id: wordbook,
					english: english
				})
				.get();

			if (!existing.data || existing.data.length === 0) {
				await collection.add({
					user_id: uid,
					wordbook_id: wordbook,
					english: english,
					mastered_at: now,
					created_at: now
				});
				successCount++;
			}
		} catch (e) {
			console.error(`上传已掌握单词 ${english} 失败:`, e);
		}
	}

	return {
		code: 0,
		msg: '上传成功',
		count: successCount
	};
}

/**
 * 上传错词本
 */
async function uploadMistakes(db, uid, wordbook, mistakeWords) {
	if (!Array.isArray(mistakeWords) || mistakeWords.length === 0) {
		return { code: 0, msg: '没有错词', count: 0 };
	}

	const collection = db.collection('user_mistake_words');
	const now = new Date().toISOString();
	let successCount = 0;

	for (const mistake of mistakeWords) {
		const { english } = mistake;
		if (!english) continue;

		try {
			const existing = await collection
				.where({
					user_id: uid,
					wordbook_id: wordbook,
					english: english
				})
				.get();

			if (existing.data && existing.data.length > 0) {
				await collection.doc(existing.data[0]._id).update({
					error_count: mistake.error_count || 0,
					recover_count: mistake.recover_count || 0,
					active: mistake.active !== false,
					last_wrong_at: mistake.last_wrong_at || '',
					updated_at: now
				});
			} else {
				await collection.add({
					user_id: uid,
					wordbook_id: wordbook,
					english: english,
					error_count: mistake.error_count || 0,
					recover_count: mistake.recover_count || 0,
					active: mistake.active !== false,
					last_wrong_at: mistake.last_wrong_at || '',
					created_at: now,
					updated_at: now
				});
			}
			successCount++;
		} catch (e) {
			console.error(`上传错词 ${english} 失败:`, e);
		}
	}

	return {
		code: 0,
		msg: '上传成功',
		count: successCount
	};
}

/**
 * 更新同步日志
 */
async function updateSyncLog(db, uid, wordbook, syncType, syncCount) {
	try {
		const collection = db.collection('user_sync_log');
		const now = new Date().toISOString();

		await collection.add({
			user_id: uid,
			wordbook_id: wordbook,
			sync_type: syncType,
			sync_count: syncCount,
			last_sync_time: now,
			created_at: now
		});
	} catch (e) {
		console.error('更新同步日志失败:', e);
	}
}
