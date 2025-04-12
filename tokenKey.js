const crypto = require('crypto');

function generateAesKey() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charLength = characters.length;

    // 生成一个随机的 32 字节数据（对应 AES-256 密钥）
    const randomBytes = crypto.randomBytes(32);

    // 将随机字节转换为 Base64 编码
    let base64Key = randomBytes.toString('base64');

    // 移除 Base64 中的非法字符（如 '+' 和 '/'），并截取前 43 位
    let validKey = '';
    for (let i = 0; i < base64Key.length && validKey.length < 43; i++) {
        if (characters.includes(base64Key[i])) {
            validKey += base64Key[i];
        }
    }

    return validKey;
}

// 调用生成函数
const aesKey = generateAesKey();
console.log("Generated AES Key:", aesKey);

// key: wNeXAJD6r5OxHB2FMkgL1RYSzxHS2L9eFJ2z6eT8HkA