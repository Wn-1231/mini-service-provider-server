const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const { verifyByteDanceServer } = require("./helper/verifyByteDanceServer");
const { decryptMsg } = require("./helper/msgDecrypt");

const generateAesKey = "wNeXAJD6r5OxHB2FMkgL1RYSzxHS2L9eFJ2z6eT8HkA";
const tpToken = "HAvtfDZkDFhozBrlo5tsbmt11Oj2z3BG"; // 生成的 Token

// 创建 Express 应用实例
const app = express();
const PORT = process.env.PORT || 4000;

// 配置中间件
app.use(bodyParser.json()); // 用于解析 JSON 请求体
app.use(bodyParser.urlencoded({ extended: true })); // 用于解析 URL 编码的请求体
app.use(express.static(path.join(__dirname, "public"))); // 提供静态文件服务

// 根路径路由 - 返回 HTML
app.get("/", (req, res) => {
  console.log(123);
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/api/mini/service/provider", (req, res) => {
  res.send("success");
});

// POST 请求示例
app.post("/api/mini/service/provider", (req, res) => {
  const data = req.body;
  const { TimeStamp, Nonce, Encrypt, MsgSignature } = data || {};

  console.log("接收到的数据:", data);

  try {
    const isPass = verifyByteDanceServer(
      tpToken,
      TimeStamp, // 从请求体中获取 TimeStamp
      Nonce, // 从请求体中获取 Nonce
      Encrypt, // 从请求体中获取 Encrypt
      MsgSignature // 从请求体中获取 MsgSignature
    );

    if (isPass) {
      const res = decryptMsg(generateAesKey, Encrypt); // 解密消息
      console.log('"解密后的消息:", res);', res);
    }

    // 直接返回字符串 success，而不是 JSON
    res.send("success");
  } catch (error) {
    console.error("验证失败:", error);
    // 即使验证失败也返回 success，避免字节跳动服务器重试
    res.send("success");
  }
});

// 处理 404 - 未找到的路由
app.use((req, res) => {
  res.status(404).json({ success: false, message: "未找到请求的资源" });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "服务器内部错误" });
});

// 启动服务器

app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在 http://0.0.0.0:${PORT}`);
});

// app.listen(PORT, () => {
//   console.log(`服务器运行在 http://localhost:${PORT}`);
// });
