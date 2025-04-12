const crypto = require('crypto');

/**
 * 解密消息
 * @param {string} encodeAesKey - Base64 编码的 AES 密钥
 * @param {string} encryptMsg - 加密的消息体（Base64 编码）
 */
function decryptMsg(encodeAesKey, encryptMsg) {
    try {
        // Step 1: 获取 AES 密钥
        const aesKey = Buffer.from(encodeAesKey + '=', 'base64'); // 补齐 Base64 编码

        // Step 2: 解密消息
        const decryptedData = decrypt(encryptMsg, aesKey);

        // Step 3: 提取消息内容
        const plainText = Buffer.from(decryptedData);
        const buf = plainText.slice(16, 20); // 提取消息长度
        const length = buf.readUInt32BE(0); // 大端序读取 4 字节长度

        // 提取消息体和第三方 AppID
        const msgBody = plainText.slice(20, 20 + length).toString();
        const tpAppId = plainText.slice(20 + length).toString();

        console.log("thirdparty appid:", tpAppId);
        console.log("decode msg body:", msgBody);

        // Step 4: 解析消息内容为 JSON
        const result = JSON.parse(msgBody);
        console.log("msg:", result);

        return result;
    } catch (err) {
        console.error("Error during decryption:", err.message);
        throw err;
    }
}

/**
 * AES-CBC 解密
 * @param {string} rawData - Base64 编码的加密数据
 * @param {Buffer} key - AES 密钥
 * @returns {Buffer} - 解密后的数据
 */
function decrypt(rawData, key) {
    const data = Buffer.from(rawData, 'base64'); // 解码 Base64 数据

    // AES-CBC 解密
    const iv = data.slice(0, 16); // 前 16 字节是 IV
    const encryptedData = data.slice(16); // 剩余部分是加密数据

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    // 去掉 PKCS7 填充
    return unpadPKCS7(decrypted);
}

/**
 * 去掉 PKCS7 填充
 * @param {Buffer} data - 包含填充的数据
 * @returns {Buffer} - 去掉填充后的数据
 */
function unpadPKCS7(data) {
    const padLength = data[data.length - 1];
    return data.slice(0, data.length - padLength);
}

// 测试数据（替换为你从抖音开放平台接收到的实际参数）
const encodeAesKey = "your_encode_aes_key"; // 替换为你的 AES Key
const encryptMsg = "your_encrypted_message"; // 替换为你的加密消息

// 调用解密函数
// decryptMsg(encodeAesKey, encryptMsg);

exports.decryptMsg = decryptMsg;
exports.decrypt = decrypt;
exports.unpadPKCS7 = unpadPKCS7;