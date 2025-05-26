const axios = require("axios");
const fs = require("fs");
const path = require("path");
const qrcode = require("qrcode-terminal");

const componentAppId = "tt7383053eeca9d442";
const componentAppSecret = "d620884914b65e3ba0332f071caf2a4227a6a407";

// 三方小程序的 token
const component_access_token =
  "11838d2e5abae2ad11873e68c2f54e10ed88219019f91f982aa55ad9539dc8211d9f11c02c3d99aea944f0983e8c77366ba001d89f1720c0bda6f80d3e7ea3257bdbd477a5f7aaf5d884c53fc7f51";

const authorization_appid = "tte50893b57a3f7eed01";

// 1.获取服务商调用接口 component_access_token
const getComponentAccessToken = async component_ticket => {
  const response = await axios.get(
    "https://open.microapp.bytedance.com/openapi/v1/auth/tp/token",
    {
      params: {
        component_appid: componentAppId,
        component_appsecret: componentAppSecret,
        component_ticket: component_ticket,
      },
    }
  );

  console.log("getComponentAccessToken", response.data);

  return response.data.component_access_token;
};

// 2.生成授权链接
const getAuthUrl = async (component_access_token, redirect_uri) => {
  const response = await axios.post(
    `https://open.microapp.bytedance.com/openapi/v2/auth/gen_link?component_appid=${componentAppId}&component_access_token=${component_access_token}`,
    {
      link_type: 1,
      redirect_uri,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  console.log("getAuthUrl", response.data);

  return response.data.link;
};

//3. 获取授权小程序接口调用凭据
const getAuthorizerAccessToken = async authorization_code => {
  const response = await axios.get(
    `https://open.microapp.bytedance.com/openapi/v1/oauth/token`,
    {
      params: {
        component_appid: componentAppId,
        component_access_token: component_access_token,
        authorization_code,
        grant_type: "app_to_tp_authorization_code",
      },
    }
  );

  // {
  //   authorizer_access_token: '0802121847445a794e6341485243776c4c75654d423332702f513d3d',
  //   expires_in: 7200,
  //   authorizer_refresh_token: '7a08d65f40012322abc9dd57853b67fbe00fb1472cf37af7cb5b5c14b4731eac305f162c298136971b72bb66b7d60fd525a9f08821f447a436e90740b58ab8a072cf2ab1d651f22a1fff007987d4c',
  //   refresh_expires_in: 2592000,
  //   authorizer_appid: 'tt328c4431adbbd92c01',
  //   authorize_permission: [
  //     {
  //       id: 1,
  //       category: '开发管理权限',
  //       description: '帮助小程序进行基础功能开发及配置开发所需信息'
  //     },
  //     {
  //       id: 2,
  //       category: '基本信息设置权限',
  //       description: '帮助小程序管理名称、头像、简介、服务类目等信息'
  //     },
  //     {
  //       id: 3,
  //       category: '运营管理权限',
  //       description: '帮助小程序接入平台提供的开放能力，包括自主挂载、达人推广、搜索等'
  //     },
  //     {
  //       id: 4,
  //       category: '数据分析权限',
  //       description: '能够获得小程序相关数据并进行数据分析，主要包括小程序用户数据及交易数据'
  //     },
  //     { id: 5, category: '广告管理权限', description: '帮助小程序进行广告投放及管理' },
  //     {
  //       id: 6,
  //       category: '支付服务权限',
  //       description: '帮助小程序开通及使用支付产品，并获得支付产生的相关数据'
  //     },
  //     { id: 7, category: '流量主权限', description: '帮助开发者管理小程序内的广告变现业务' },
  //     {
  //       id: 8,
  //       category: '小程序推广计划-任务管理权限',
  //       description: '帮助开发者发布小程序推广任务并查看任务相关信息'
  //     }
  //   ],
  //   share_data: { share_ratio: 0, share_amount: 0 }
  // }

  return response.data;
};

// 4. 找回授权码
const getAuthorizationCode = async () => {
  const response = await axios.post(
    `https://open.microapp.bytedance.com/openapi/v1/auth/retrieve?component_appid=${componentAppId}&component_access_token=${component_access_token}&authorization_appid=${authorization_appid}`,
    {},
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  // {
  //   authorization_code: 'wp7dLjpJK0ny_uPrqyE9XMb6gqbx9yraBccu_oS_3SuLJHUV',
  //   expires_in: 3600
  // }

  return response.data;
};
// 5. 获取模板列表
const getTemplateList = async () => {
  const response = await axios.get(
    `https://open.microapp.bytedance.com/openapi/v1/tp/template/get_tpl_list`,
    {
      params: {
        component_appid: componentAppId,
        component_access_token: component_access_token,
      },
    }
  );

  return response.data;
};

// 6. 为商家绑定 Template
const uploadTemplate = async ({
  authorizer_access_token,
  template_id,
  user_desc,
  user_version,
  ext_json = {},
}) => {
  const response = await axios.post(
    `https://open.microapp.bytedance.com/openapi/v1/microapp/package/upload?component_appid=${componentAppId}&authorizer_access_token=${authorizer_access_token}`,
    {
      template_id: template_id,
      user_desc,
      user_version,
      ext_json: JSON.stringify(ext_json),
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  console.log("uploadTemplate", response.data);
};

const uploadTemplateV2 = async ({
  authorizer_access_token,
  template_id,
  user_desc,
  user_version,
  ext_json = {},
}) => {
  const response = await axios.post(
    `https://open.douyin.com/api/apps/v1/package_version/upload/`,
    {
      template_id: template_id,
      user_desc,
      user_version,
      ext_json: JSON.stringify(ext_json),
    },
    {
      headers: {
        "Content-Type": "application/json",
        "access-token": authorizer_access_token,
      },
    }
  );

  console.log("uploadTemplate", response.data);
  return response.data;
};

// 7. 为商家提交审核
const submitAudit = async ({
  authorizer_access_token,
  auditNote = "提审小程序的备注信息",
}) => {
  const response = await axios.post(
    `	https://open.microapp.bytedance.com/openapi/v2/microapp/package/audit?component_appid=${componentAppId}&authorizer_access_token=${authorizer_access_token}`,
    {
      hostNames: ["toutiao", "douyin"],
      auditNote,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

// 8. 获取授权小程序二维码
const getAuthorizerQrCode = async ({ tpAppId, authorizer_access_token }) => {
  try {
    const response = await axios.post(
      `https://open.microapp.bytedance.com/openapi/v1/microapp/app/qrcode?component_appid=${
        tpAppId || componentAppId
      }&authorizer_access_token=${authorizer_access_token}`,
      {
        version: "latest",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer", // 设置响应类型为 arraybuffer
      }
    );

    // 生成文件路径
    const qrCodePath = path.join(__dirname, "qrcode.png");

    // 将二进制数据写入文件
    fs.writeFileSync(qrCodePath, response.data);

    console.log(`二维码已保存到: ${qrCodePath}`);

    return qrCodePath;
  } catch (error) {
    console.error("生成二维码错误:", error);
    throw error;
  }
};

// 8. 获取授权小程序二维码
const getAuthorizerQrCodeV2 = async ({ path, authorizer_access_token }) => {
  try {
    const response = await axios.post(
      `https://open.douyin.com/api/apps/v2/basic_info/get_qr_code/`,
      {
        version: "latest",
        path,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "access-token": authorizer_access_token,
        },
      }
    );
    return response;
  } catch (error) {
    console.error("生成二维码错误:", error);
    throw error;
  }
};

const setRequest = async ({ authorizer_access_token, action = "add" }) => {
  try {
    const response = await axios.post(
      `https://open.douyin.com/api/apps/v2/domain/modify_server_domain/`,
      {
        action: action,
        request: [
          "apm.laiyagushi.com",
          "api.laiyagushi.com",
          "www.laiyagushi.com",
          "km-dalaran--box-48173--api-laiyagushi-com.zpres.zhihu.com",
          "km-dalaran--box-65096--api-laiyagushi-com.zpres.zhihu.com",


          'pay.zhihu.com',
          'et.tsn01.in.zhihu.com',
          'duga.zhihu.com',
          'apm.zhihu.com',
          'www.zhihu.com',
          'crash2.zhihu.com'
        ],
        // download: [
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
      },
      {
        headers: {
          "Content-Type": "application/json",
          "access-token": authorizer_access_token,
        },
      }
    );
    return response;
  } catch (error) {
    console.error("绑定安全域名错误:", error);
    throw error;
  }
};

module.exports = {
  setRequest,
  getAuthUrl,
  getComponentAccessToken,
  getAuthorizerAccessToken,
  getTemplateList,
  uploadTemplate,
  getAuthorizationCode,
  submitAudit,
  getAuthorizerQrCode,
  getAuthorizerQrCodeV2,
  uploadTemplateV2,
  setRequest,
};
