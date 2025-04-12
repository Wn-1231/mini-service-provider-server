const crypto = require("crypto");

function sha1(str) {
    return crypto.createHash('sha1').update(str).digest('hex');
}

function verifyByteDanceServer(
  tpToken,
  timestamp,
  nonce,
  encrypt,
  msgSignature
) {
  // 将参数按字典序排序
  const values = [tpToken, timestamp, nonce, encrypt].sort();

  // 拼接排序后的字符串
  const joinedStr = values.join("");

  // 计算 SHA1 签名
  const newMsgSignature = sha1(joinedStr);

  // 比对签名
  if (newMsgSignature === msgSignature) {
    console.log("success");
    return true;
  } else {
    console.log("fail");
    return false;
  }
}

exports.verifyByteDanceServer = verifyByteDanceServer;