const crypto = require("crypto");

/**
 * 解密消息
 * @param {string} encodingAESKey - Base64 编码的 AES 密钥
 * @param {string} encryptMsg - 加密的消息体（Base64 编码）
 */
function decryptMsg(encodingAESKey, encryptMsg) {
  try {
    // 获取 AES key
    const aesKey = Buffer.from(encodingAESKey + "=", "base64");

    // 解密消息
    const decryptedMsg = decrypt(encryptMsg, aesKey);

    // 解析消息体
    // 前16字节是随机字符串
    // 接下来4字节是消息长度
    const msgLengthBuffer = decryptedMsg.slice(16, 20);
    const msgLength = msgLengthBuffer.readInt32BE(0);
    
    // 获取消息体 (从第20字节开始，到20+msgLength为止)
    const msgBody = decryptedMsg.slice(20, 20 + msgLength).toString('utf8');
    
    // 获取appId (从消息体之后开始到结束)
    const appId = decryptedMsg.slice(20 + msgLength).toString('utf8');
    
    // 解析消息体JSON
    const result = JSON.parse(msgBody);
    
    return result;
  } catch (err) {
    console.error("解密错误:", err);
    throw err;
  }
}

/**
 * AES-CBC 解密
 * @param {string} encryptMsg - Base64 编码的加密数据
 * @param {Buffer} key - AES 密钥
 */
function decrypt(encryptMsg, key) {
  // Base64解码
  const data = Buffer.from(encryptMsg, "base64");

  // 获取IV (前16字节)
  const iv = data.slice(0, 16);
  // 获取加密数据
  const encryptedData = data.slice(16);
  
  // 创建解密器
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  decipher.setAutoPadding(false); // 关闭自动padding
  
  // 解密
  let decrypted = Buffer.concat([
    decipher.update(encryptedData),
    decipher.final()
  ]);

  // 去除PKCS7 padding
  return PKCS7UnPadding(decrypted);
}

/**
 * 去除PKCS7填充
 * @param {Buffer} buf - 需要去除填充的Buffer
 */
function PKCS7UnPadding(buf) {
  const padLength = buf[buf.length - 1];
  return buf.slice(0, buf.length - padLength);
}

// 测试数据（替换为你从抖音开放平台接收到的实际参数）
const encodeAesKey = "your_encode_aes_key"; // 替换为你的 AES Key
const encryptMsg = "your_encrypted_message"; // 替换为你的加密消息

// 调用解密函数
// decryptMsg(encodeAesKey, encryptMsg);

module.exports = {
  decryptMsg
};
