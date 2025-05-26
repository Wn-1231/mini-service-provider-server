const { verifyByteDanceServer } = require("./helper/verifyByteDanceServer");
const { decryptMsg } = require("./helper/msgDecrypt");
const { getAuthUrl, getComponentAccessToken, getAuthorizerQrCode } = require("./fetch");

const generateAesKey = "wNeXAJD6r5OxHB2FMkgL1RYSzxHS2L9eFJ2z6eT8HkA";
const tpToken = "HAvtfDZkDFhozBrlo5tsbmt11Oj2z3BG"; // 生成的 Token

// https://api.zhihu.com/api/dalaran-nodejs/open/service/provider/messages
// 获取最新的 票据
const data = {
  TimeStamp: "1744894203",
  Nonce: "27058332895",
  Encrypt:
    "VVvmewhypckTHsHEuiFmuvvMeCpK8dwy4x30RENUvESf0REkQ+lm41LB2WkNJvCDKJZtq3LR5rxphBeZ0/NYv+W6sZYYE5vMuoyfd19Va9ZqXeqm2Sl+17K3zYlHK4gra5yTlMmZG//C8QJTHXLS2Vyf1O9lewEZec+7AV3eBsIi+M70jqgIZZuLZ+yqlmEi35oIM/+k9moNMNLCU7mrAdMz8GaO0wSGMYxystl6jYgcrm2cw+wleNOlS6xidtfdDrzFddBuN1ztc61SC9oO5Q==",
  MsgSignature: "1662b3f335b8af371cf8dbe5c3d5243bf5af6fa6",
};

const main = async () => {
  const { TimeStamp, Nonce, Encrypt, MsgSignature } = data || {};

  const isPass = verifyByteDanceServer(
    tpToken,
    TimeStamp,
    Nonce,
    Encrypt,
    MsgSignature
  );

  console.log("isPass:", isPass);

  if (isPass) {
    try {
      // 解密消息获取 component_ticket
      const decryptedMsg = decryptMsg(generateAesKey, Encrypt);
      console.log("完整解密结果:", JSON.stringify(decryptedMsg, null, 2));

      const { Ticket: component_ticket } = decryptedMsg;
      console.log("component_ticket:", component_ticket);

      // 使用 component_ticket 换取 component_access_token
      const component_access_token = await getComponentAccessToken(
        component_ticket
      );

      console.log("获取 component_access_token 结果:", component_access_token);

      // 生成授权链接
      const auth_url = await getAuthUrl(
        component_access_token,
        "https://api.zhihu.com/api/dalaran-nodejs/open/service/provider/authorization-code"
      );

      console.log("授权链接:", auth_url);

      // 获取并保存二维码
      const qrCodePath = await getAuthorizerQrCode({
        authorizer_access_token: component_access_token
      });
      
      console.log('二维码文件已保存到:', qrCodePath);
      
    } catch (error) {
      console.error("错误:", error);
      if (error.response) {
        console.error("API错误响应:", error.response.data);
      }
    }
  }
};

main();
