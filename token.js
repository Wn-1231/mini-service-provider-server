const crypto = require('crypto');

function generateToken(length = 32) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charLength = characters.length;
    let result = '';
    
    // 使用 crypto.randomBytes 生成随机字节
    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
        // 将随机字节映射到字符集中
        result += characters[randomBytes[i] % charLength];
    }
    return result;
}

// 生成一个 32 位的 Token
const token = generateToken();

// 生成 TOKEN： HAvtfDZkDFhozBrlo5tsbmt11Oj2z3BG
console.log(token);