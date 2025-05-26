"use strict";

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var axios = require("axios");

var fs = require("fs");

var path = require("path");

var qrcode = require("qrcode-terminal");

var componentAppId = "tt7383053eeca9d442";
var componentAppSecret = "d620884914b65e3ba0332f071caf2a4227a6a407"; // 三方小程序的 token

var component_access_token = "11838d2e5abae2ad11873e68c2f54e10ed88219019f91f982aa55ad9539dc8211d9f11c02c3d99aea944f0983e8c77366ba001d89f1720c0bda6f80d3e7ea3257bdbd477a5f7aaf5d884c53fc7f51";
var authorization_appid = "tte50893b57a3f7eed01"; // 1.获取服务商调用接口 component_access_token

var getComponentAccessToken = function getComponentAccessToken(component_ticket) {
  var response;
  return regeneratorRuntime.async(function getComponentAccessToken$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return regeneratorRuntime.awrap(axios.get("https://open.microapp.bytedance.com/openapi/v1/auth/tp/token", {
            params: {
              component_appid: componentAppId,
              component_appsecret: componentAppSecret,
              component_ticket: component_ticket
            }
          }));

        case 2:
          response = _context.sent;
          console.log("getComponentAccessToken", response.data);
          return _context.abrupt("return", response.data.component_access_token);

        case 5:
        case "end":
          return _context.stop();
      }
    }
  });
}; // 2.生成授权链接


var getAuthUrl = function getAuthUrl(component_access_token, redirect_uri) {
  var response;
  return regeneratorRuntime.async(function getAuthUrl$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.next = 2;
          return regeneratorRuntime.awrap(axios.post("https://open.microapp.bytedance.com/openapi/v2/auth/gen_link?component_appid=".concat(componentAppId, "&component_access_token=").concat(component_access_token), {
            link_type: 1,
            redirect_uri: redirect_uri
          }, {
            headers: {
              "Content-Type": "application/json"
            }
          }));

        case 2:
          response = _context2.sent;
          console.log("getAuthUrl", response.data);
          return _context2.abrupt("return", response.data.link);

        case 5:
        case "end":
          return _context2.stop();
      }
    }
  });
}; //3. 获取授权小程序接口调用凭据


var getAuthorizerAccessToken = function getAuthorizerAccessToken(authorization_code) {
  var response;
  return regeneratorRuntime.async(function getAuthorizerAccessToken$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.next = 2;
          return regeneratorRuntime.awrap(axios.get("https://open.microapp.bytedance.com/openapi/v1/oauth/token", {
            params: {
              component_appid: componentAppId,
              component_access_token: component_access_token,
              authorization_code: authorization_code,
              grant_type: "app_to_tp_authorization_code"
            }
          }));

        case 2:
          response = _context3.sent;
          return _context3.abrupt("return", response.data);

        case 4:
        case "end":
          return _context3.stop();
      }
    }
  });
}; // 4. 找回授权码


var getAuthorizationCode = function getAuthorizationCode() {
  var response;
  return regeneratorRuntime.async(function getAuthorizationCode$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.next = 2;
          return regeneratorRuntime.awrap(axios.post("https://open.microapp.bytedance.com/openapi/v1/auth/retrieve?component_appid=".concat(componentAppId, "&component_access_token=").concat(component_access_token, "&authorization_appid=").concat(authorization_appid), {}, {
            headers: {
              "Content-Type": "application/json"
            }
          }));

        case 2:
          response = _context4.sent;
          return _context4.abrupt("return", response.data);

        case 4:
        case "end":
          return _context4.stop();
      }
    }
  });
}; // 5. 获取模板列表


var getTemplateList = function getTemplateList() {
  var response;
  return regeneratorRuntime.async(function getTemplateList$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _context5.next = 2;
          return regeneratorRuntime.awrap(axios.get("https://open.microapp.bytedance.com/openapi/v1/tp/template/get_tpl_list", {
            params: {
              component_appid: componentAppId,
              component_access_token: component_access_token
            }
          }));

        case 2:
          response = _context5.sent;
          return _context5.abrupt("return", response.data);

        case 4:
        case "end":
          return _context5.stop();
      }
    }
  });
}; // 6. 为商家绑定 Template


var uploadTemplate = function uploadTemplate(_ref) {
  var authorizer_access_token, template_id, user_desc, user_version, _ref$ext_json, ext_json, response;

  return regeneratorRuntime.async(function uploadTemplate$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          authorizer_access_token = _ref.authorizer_access_token, template_id = _ref.template_id, user_desc = _ref.user_desc, user_version = _ref.user_version, _ref$ext_json = _ref.ext_json, ext_json = _ref$ext_json === void 0 ? {} : _ref$ext_json;
          _context6.next = 3;
          return regeneratorRuntime.awrap(axios.post("https://open.microapp.bytedance.com/openapi/v1/microapp/package/upload?component_appid=".concat(componentAppId, "&authorizer_access_token=").concat(authorizer_access_token), {
            template_id: template_id,
            user_desc: user_desc,
            user_version: user_version,
            ext_json: JSON.stringify(ext_json)
          }, {
            headers: {
              "Content-Type": "application/json"
            }
          }));

        case 3:
          response = _context6.sent;
          console.log("uploadTemplate", response.data);

        case 5:
        case "end":
          return _context6.stop();
      }
    }
  });
};

var uploadTemplateV2 = function uploadTemplateV2(_ref2) {
  var authorizer_access_token, template_id, user_desc, user_version, _ref2$ext_json, ext_json, response;

  return regeneratorRuntime.async(function uploadTemplateV2$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          authorizer_access_token = _ref2.authorizer_access_token, template_id = _ref2.template_id, user_desc = _ref2.user_desc, user_version = _ref2.user_version, _ref2$ext_json = _ref2.ext_json, ext_json = _ref2$ext_json === void 0 ? {} : _ref2$ext_json;
          _context7.next = 3;
          return regeneratorRuntime.awrap(axios.post("https://open.douyin.com/api/apps/v1/package_version/upload/", {
            template_id: template_id,
            user_desc: user_desc,
            user_version: user_version,
            ext_json: JSON.stringify(ext_json)
          }, {
            headers: {
              "Content-Type": "application/json",
              "access-token": authorizer_access_token
            }
          }));

        case 3:
          response = _context7.sent;
          console.log("uploadTemplate", response.data);
          return _context7.abrupt("return", response.data);

        case 6:
        case "end":
          return _context7.stop();
      }
    }
  });
}; // 7. 为商家提交审核


var submitAudit = function submitAudit(_ref3) {
  var authorizer_access_token, _ref3$auditNote, auditNote, response;

  return regeneratorRuntime.async(function submitAudit$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          authorizer_access_token = _ref3.authorizer_access_token, _ref3$auditNote = _ref3.auditNote, auditNote = _ref3$auditNote === void 0 ? "提审小程序的备注信息" : _ref3$auditNote;
          _context8.next = 3;
          return regeneratorRuntime.awrap(axios.post("\thttps://open.microapp.bytedance.com/openapi/v2/microapp/package/audit?component_appid=".concat(componentAppId, "&authorizer_access_token=").concat(authorizer_access_token), {
            hostNames: ["toutiao", "douyin"],
            auditNote: auditNote
          }, {
            headers: {
              "Content-Type": "application/json"
            }
          }));

        case 3:
          response = _context8.sent;
          return _context8.abrupt("return", response.data);

        case 5:
        case "end":
          return _context8.stop();
      }
    }
  });
}; // 8. 获取授权小程序二维码


var getAuthorizerQrCode = function getAuthorizerQrCode(_ref4) {
  var tpAppId, authorizer_access_token, response, qrCodePath;
  return regeneratorRuntime.async(function getAuthorizerQrCode$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          tpAppId = _ref4.tpAppId, authorizer_access_token = _ref4.authorizer_access_token;
          _context9.prev = 1;
          _context9.next = 4;
          return regeneratorRuntime.awrap(axios.post("https://open.microapp.bytedance.com/openapi/v1/microapp/app/qrcode?component_appid=".concat(tpAppId || componentAppId, "&authorizer_access_token=").concat(authorizer_access_token), {
            version: "latest"
          }, {
            headers: {
              "Content-Type": "application/json"
            },
            responseType: "arraybuffer" // 设置响应类型为 arraybuffer

          }));

        case 4:
          response = _context9.sent;
          // 生成文件路径
          qrCodePath = path.join(__dirname, "qrcode.png"); // 将二进制数据写入文件

          fs.writeFileSync(qrCodePath, response.data);
          console.log("\u4E8C\u7EF4\u7801\u5DF2\u4FDD\u5B58\u5230: ".concat(qrCodePath));
          return _context9.abrupt("return", qrCodePath);

        case 11:
          _context9.prev = 11;
          _context9.t0 = _context9["catch"](1);
          console.error("生成二维码错误:", _context9.t0);
          throw _context9.t0;

        case 15:
        case "end":
          return _context9.stop();
      }
    }
  }, null, null, [[1, 11]]);
}; // 8. 获取授权小程序二维码


var getAuthorizerQrCodeV2 = function getAuthorizerQrCodeV2(_ref5) {
  var path, authorizer_access_token, response;
  return regeneratorRuntime.async(function getAuthorizerQrCodeV2$(_context10) {
    while (1) {
      switch (_context10.prev = _context10.next) {
        case 0:
          path = _ref5.path, authorizer_access_token = _ref5.authorizer_access_token;
          _context10.prev = 1;
          _context10.next = 4;
          return regeneratorRuntime.awrap(axios.post("https://open.douyin.com/api/apps/v2/basic_info/get_qr_code/", {
            version: "latest",
            path: path
          }, {
            headers: {
              "Content-Type": "application/json",
              "access-token": authorizer_access_token
            }
          }));

        case 4:
          response = _context10.sent;
          return _context10.abrupt("return", response);

        case 8:
          _context10.prev = 8;
          _context10.t0 = _context10["catch"](1);
          console.error("生成二维码错误:", _context10.t0);
          throw _context10.t0;

        case 12:
        case "end":
          return _context10.stop();
      }
    }
  }, null, null, [[1, 8]]);
};

var setRequest = function setRequest(_ref6) {
  var authorizer_access_token, _ref6$action, action, response;

  return regeneratorRuntime.async(function setRequest$(_context11) {
    while (1) {
      switch (_context11.prev = _context11.next) {
        case 0:
          authorizer_access_token = _ref6.authorizer_access_token, _ref6$action = _ref6.action, action = _ref6$action === void 0 ? "add" : _ref6$action;
          _context11.prev = 1;
          _context11.next = 4;
          return regeneratorRuntime.awrap(axios.post("https://open.douyin.com/api/apps/v2/domain/modify_server_domain/", {
            action: action,
            request: ["apm.laiyagushi.com", "api.laiyagushi.com", "www.laiyagushi.com", "km-dalaran--box-48173--api-laiyagushi-com.zpres.zhihu.com", "km-dalaran--box-65096--api-laiyagushi-com.zpres.zhihu.com", 'pay.zhihu.com', 'et.tsn01.in.zhihu.com', 'duga.zhihu.com', 'apm.zhihu.com', 'www.zhihu.com', 'crash2.zhihu.com'] // download: [
            //   "pic1.zhimg.com",
            //   "pic0.zhimg.com",
            //   "picx.zhimg.com",
            //   "pica.zhimg.com",
            //   "unpkg.zhimg.com",
            //   "pic8.zhimg.com",
            //   "pic7.zhimg.com",
            //   "pic6.zhimg.com",
            //   "pic5.zhimg.com",
            //   "pic4.zhimg.com",
            //   "pic2.zhimg.com",
            // ],
            // upload: [
            //   "api.zhihu.com",
            //   "www.zhihu.com",
            //   "www.laiyagushi.com",
            //   "api.laiyagushi.com",
            // ],

          }, {
            headers: {
              "Content-Type": "application/json",
              "access-token": authorizer_access_token
            }
          }));

        case 4:
          response = _context11.sent;
          return _context11.abrupt("return", response);

        case 8:
          _context11.prev = 8;
          _context11.t0 = _context11["catch"](1);
          console.error("绑定安全域名错误:", _context11.t0);
          throw _context11.t0;

        case 12:
        case "end":
          return _context11.stop();
      }
    }
  }, null, null, [[1, 8]]);
};

module.exports = _defineProperty({
  setRequest: setRequest,
  getAuthUrl: getAuthUrl,
  getComponentAccessToken: getComponentAccessToken,
  getAuthorizerAccessToken: getAuthorizerAccessToken,
  getTemplateList: getTemplateList,
  uploadTemplate: uploadTemplate,
  getAuthorizationCode: getAuthorizationCode,
  submitAudit: submitAudit,
  getAuthorizerQrCode: getAuthorizerQrCode,
  getAuthorizerQrCodeV2: getAuthorizerQrCodeV2,
  uploadTemplateV2: uploadTemplateV2
}, "setRequest", setRequest);