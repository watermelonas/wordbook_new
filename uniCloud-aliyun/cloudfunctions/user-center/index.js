'use strict';
const crypto = require('crypto');
const db = uniCloud.database();

const SALT = 'wordbook_salt_2024';
const hashPassword = (pwd) => crypto.createHash('sha256').update(pwd + SALT).digest('hex');
const isHashed = (str) => typeof str === 'string' && str.length === 64 && /^[a-f0-9]+$/.test(str);

exports.main = async (event, context) => {
    const { action, username, password, uid, displayName } = event;

    // 登录/注册
    if (!action || action === 'login') {
        if (!username || !password) {
            return { code: -1, msg: '用户名或密码不能为空' };
        }

        const collection = db.collection('users');
        const userRecord = await collection.where({ username: username }).get();

        if (userRecord.data.length > 0) {
            const user = userRecord.data[0];
            const storedPwd = user.password || '';
            const pwdMatch = isHashed(storedPwd) ? hashPassword(password) === storedPwd : (storedPwd === password);

            if (pwdMatch) {
                if (!isHashed(storedPwd)) {
                    await collection.doc(user._id).update({ password: hashPassword(password) });
                }
                return {
                    code: 0,
                    msg: '登录成功',
                    uid: user._id,
                    username: user.username,
                    displayName: user.displayName || user.username
                };
            }
            return { code: -1, msg: '密码错误' };
        }

        const res = await collection.add({
            username: username,
            password: hashPassword(password),
            displayName: username,
            create_time: Date.now()
        });
        return {
            code: 0,
            msg: '注册并登录成功',
            uid: res.id,
            username: username,
            displayName: username
        };
    }

    // 更新用户昵称
    if (action === 'updateProfile') {
        if (!uid || !displayName) {
            return { code: -1, msg: '参数不完整' };
        }

        const collection = db.collection('users');
        await collection.doc(uid).update({
            displayName: displayName,
            update_time: Date.now()
        });

        return {
            code: 0,
            msg: '昵称已更新',
            displayName: displayName
        };
    }

    return { code: -1, msg: '未知操作' };
};