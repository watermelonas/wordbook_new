'use strict';
exports.main = async (event, context) => {
	const db = uniCloud.database();
	const collection = db.collection('cloud_words');
	const progressCollection = db.collection('user_progress');

	const { action, uid, words, progress, mastered } = event;

	if (action === 'upload') {
		// 上传单词数据
		if (!uid || !words) {
			return {
				code: -1,
				msg: '参数不完整'
			};
		}

		try {
			// 先删除该用户的旧数据
			await collection.where({
				user_id: uid
			}).remove();

			// 批量插入新数据
			if (words && words.length > 0) {
				const batchData = words.map(word => ({
					user_id: uid,
					english: word.english,
					chinese: word.chinese,
					tags: word.tags || '',
					source_page: word.source_page || '',
					year: word.year || '',
					importance: word.importance || 3,
					error_rate: word.error_rate || 0,
					review_frequency: word.review_frequency || 0,
					repeat_count: word.repeat_count || 1,
					view_count: word.view_count != null ? word.view_count : 0,
					examples: word.examples ? JSON.stringify(word.examples) : '[]',
					synonyms: word.synonyms ? JSON.stringify(word.synonyms) : '[]',
					antonyms: word.antonyms ? JSON.stringify(word.antonyms) : '[]',
					create_time: word.create_time || new Date().toISOString(),
					update_time: word.update_time || new Date().toISOString()
				}));

				await collection.add(batchData);
			}

			return {
				code: 0,
				msg: '上传成功',
				count: words ? words.length : 0
			};
		} catch (e) {
			return {
				code: -3,
				msg: '上传失败: ' + e.message
			};
		}

	} else if (action === 'download') {
		// 下载单词数据
		if (!uid) {
			return {
				code: -1,
				msg: '参数不完整'
			};
		}

		try {
			const res = await collection.where({
				user_id: uid
			}).get();

			// 解析 examples、synonyms、antonyms 字段
			const wordsList = res.data.map(word => {
				let examples = [], synonyms = [], antonyms = [];
				try {
					examples = word.examples ? JSON.parse(word.examples) : [];
				} catch (e) { examples = []; }
				try {
					synonyms = word.synonyms ? JSON.parse(word.synonyms) : [];
				} catch (e) { synonyms = []; }
				try {
					antonyms = word.antonyms ? JSON.parse(word.antonyms) : [];
				} catch (e) { antonyms = []; }
				return {
					id: word._id,
					english: word.english,
					chinese: word.chinese,
					tags: word.tags,
					source_page: word.source_page,
					year: word.year,
					importance: word.importance,
					error_rate: word.error_rate,
					review_frequency: word.review_frequency,
					repeat_count: word.repeat_count,
					view_count: word.view_count != null ? word.view_count : 0,
					examples,
					synonyms,
					antonyms,
					create_time: word.create_time,
					update_time: word.update_time
				};
			});

			return {
				code: 0,
				msg: '获取成功',
				words: wordsList,
				count: wordsList.length
			};
		} catch (e) {
			return {
				code: -3,
				msg: '获取失败: ' + e.message
			};
		}

	} else if (action === 'backup-progress') {
		// 备份学习进度
		if (!uid || !progress) {
			return {
				code: -1,
				msg: '参数不完整'
			};
		}

		try {
			// 删除旧的进度数据
			await progressCollection.where({
				user_id: uid
			}).remove();

			// 插入新的进度数据
			if (progress && progress.length > 0) {
				const progressData = progress.map(p => ({
					user_id: uid,
					english: p.english,
					repeat_count: p.repeat_count || 1,
					view_count: p.view_count || 0,
					error_rate: p.error_rate || 0,
					review_frequency: p.review_frequency || 0,
					importance: p.importance || 3,
					is_favorite: p.is_favorite || false,
					update_time: p.update_time || new Date().toISOString(),
					backup_time: new Date().toISOString()
				}));

				await progressCollection.add(progressData);
			}

			return {
				code: 0,
				msg: '进度备份成功',
				count: progress ? progress.length : 0
			};
		} catch (e) {
			return {
				code: -3,
				msg: '进度备份失败: ' + e.message
			};
		}

	} else if (action === 'backup-mastered') {
		// 备份已斩单词列表
		if (!uid || !mastered) {
			return {
				code: -1,
				msg: '参数不完整'
			};
		}

		try {
			const masteredCollection = db.collection('user_mastered_words');

			// 删除旧的已斩数据
			await masteredCollection.where({
				user_id: uid
			}).remove();

			// 插入新的已斩数据
			if (mastered && mastered.length > 0) {
				const masteredData = mastered.map(english => ({
					user_id: uid,
					english: english,
					backup_time: new Date().toISOString()
				}));

				await masteredCollection.add(masteredData);
			}

			return {
				code: 0,
				msg: '已斩单词备份成功',
				count: mastered ? mastered.length : 0
			};
		} catch (e) {
			return {
				code: -3,
				msg: '已斩单词备份失败: ' + e.message
			};
		}

	} else {
		return {
			code: -2,
			msg: '无效的操作'
		};
	}
};

