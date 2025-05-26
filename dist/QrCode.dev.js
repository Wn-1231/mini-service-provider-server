"use strict";

var _require = require("./fetch"),
    getAuthorizerQrCodeV2 = _require.getAuthorizerQrCodeV2,
    uploadTemplateV2 = _require.uploadTemplateV2,
    setRequest = _require.setRequest;

var templateId = "59811";
var componentAppId = "tt7383053eeca9d442"; // 授权小程序

var authorizer_access_token = "isvact.28139a4f7e28743879ebf22068febd71rvqXhjt64bPmukofIM9Yv913dohC_hl";

var run = function run() {
  return regeneratorRuntime.async(function run$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.next = 2;
          return regeneratorRuntime.awrap(uploadTemplateV2({
            authorizer_access_token: authorizer_access_token,
            template_id: templateId,
            user_desc: "feat: 测试新版本",
            user_version: "0.0.2",
            ext_json: {
              ext: {
                TP_APP_ID: "tt7383053eeca9d442",
                // 服务商第三方小程序 appid
                // API_HOST: "https://api.laiyagushi.com",
                // API_HOST: "km-dalaran--box-65096--api-laiyagushi-com.zpres.zhihu.com",
                API_HOST: "https://km-dalaran--box-65096--api-laiyagushi-com.zpres.zhihu.com",
                // MINI_APPID: "tte50893b57a3f7eed01",  // 天秤
                // PRODUCT_ID: "1885073809138238427",   // 天秤
                MINI_APPID: "tt2e7f58c2b14f814401",
                // 斑马
                PRODUCT_ID: "1723057087201091584",
                // 斑马
                THEME_COLOR: {
                  primaryColor: "#F5AD22",
                  deepColor: "#572D07",
                  warnColor: "#FF3257",
                  linkColor: "#84B6E7"
                },
                vipCardText: "精品小说免费看"
              }
            }
          }).then(function _callee(res) {
            var getAuthorizerQrCodeResult;
            return regeneratorRuntime.async(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    console.log("uploadTemplateV2", res); //2. 生成测试二维码

                    _context.next = 3;
                    return regeneratorRuntime.awrap(getAuthorizerQrCodeV2({
                      componentAppId: componentAppId,
                      authorizer_access_token: authorizer_access_token
                    }));

                  case 3:
                    getAuthorizerQrCodeResult = _context.sent;
                    console.log("getAuthorizerQrCodeResult", getAuthorizerQrCodeResult.data);

                  case 5:
                  case "end":
                    return _context.stop();
                }
              }
            });
          }));

        case 2:
        case "end":
          return _context2.stop();
      }
    }
  });
};

run(); // 设置安全域名 

var run2 = function run2() {
  var setRequestResult;
  return regeneratorRuntime.async(function run2$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.next = 2;
          return regeneratorRuntime.awrap(setRequest({
            authorizer_access_token: authorizer_access_token
          }));

        case 2:
          setRequestResult = _context3.sent;
          console.log("setRequestResult", setRequestResult.data);

        case 4:
        case "end":
          return _context3.stop();
      }
    }
  });
}; // run2();