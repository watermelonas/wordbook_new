'use strict';
const crypto = require('crypto');

const SALT = 'wordbook_salt_2024';
const hashPassword = (pwd) => crypto.createHash('sha256').update(pwd + SALT).digest('hex');
const isHashed = (str) => typeof str === 'string' && str.length === 64 && /^[a-f0-9]+$/.test(str);

exports.main = async (event, context) => {
	const db = uniCloud.database();
	const collection = db.collection('users');
	
	const { username, password } = event;
	
	if (!username || !password) {
		return { code: -1, msg: '用户名和密码不能为空' };
	}
	
	try {
		const res = await collection.where({ username: username }).get();
		
		if (res.data && res.data.length > 0) {
			const user = res.data[0];
			const storedPwd = user.password || '';
			const pwdMatch = isHashed(storedPwd) 
				? hashPassword(password) === storedPwd 
				: (storedPwd === password);
			
			if (pwdMatch) {
				if (!isHashed(storedPwd)) {
					await collection.doc(user._id).update({ password: hashPassword(password) });
				}
				return {
					code: 0,
					msg: '登录成功',
					uid: user._id,
					username: user.username
				};
			}
			return { code: -2, msg: '密码错误' };
		}
		
		const createRes = await collection.add({
			username: username,
			password: hashPassword(password),
			createTime: Date.now()
		});
		
		return {
			code: 0,
			msg: '注册成功',
			uid: createRes.id,
			username: username
		};
	} catch (e) {
		return { code: -3, msg: '操作失败: ' + e.message };
	}
};
