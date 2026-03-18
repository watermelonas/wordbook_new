'use strict';
exports.main = async (event, context) => {
	const db = uniCloud.database();
	const collection = db.collection('cloud_words');
	
	const { action, uid, words } = event;
	
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
		
	} else {
		return {
			code: -2,
			msg: '无效的操作'
		};
	}
};
