'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
    // 获取前端传来的动作指令、用户ID和单词数组
    const { action, uid, words } = event;

    if (!uid) {
        return { code: -1, msg: '缺少用户身份标识(uid)，请先登录' };
    }

    // 严格对齐你刚才在网页端建的表名
    const collection = db.collection('cloud_words');

    // ==========================================
    // 动作 1：上传备份到云端 (Upload)
    // ==========================================
    if (action === 'upload') {
        try {
            // 1. 先把该用户在云端的旧数据清空（避免每次备份重复累加）
            await collection.where({ user_id: uid }).remove();

            // 2. 如果本地本来就没单词，清空完直接返回成功
            if (!words || words.length === 0) {
                return { code: 0, msg: '云端已同步为空' };
            }

            // 3. 给每一个单词打上该用户的“专属烙印” (user_id)
            const batchData = words.map(w => ({
                user_id: uid,
                english: w.english,
                source_page: w.source_page || '',
                year: w.year || '',
                create_time: w.create_time || new Date().toISOString(),
                update_time: w.update_time || new Date().toISOString()
            }));
            await collection.add(batchData);
            return { code: 0, msg: '上传成功', count: words.length };

        } catch (e) {
            console.error("上传写入报错:", e);
            return { code: -1, msg: '云端写入失败' };
        }
    }

    // ==========================================
    // 动作 2：从云端恢复到本地 (Download)
    // ==========================================
    if (action === 'download') {
        try {
            const res = await collection.where({ user_id: uid }).get();
            const wordsList = res.data.map(w => {
                return {
                    id: w._id,
                    english: w.english,
                    source_page: w.source_page,
                    year: w.year,
                    create_time: w.create_time,
                    update_time: w.update_time
                };
            });
            return { code: 0, msg: '获取成功', words: wordsList, data: wordsList };
        } catch (e) {
            return { code: -1, msg: '云端读取失败' };
        }
    }

    return { code: -1, msg: '未知的同步指令' };
};