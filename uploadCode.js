const {
  getAuthorizerQrCodeV2,
  uploadTemplateV2,
  setRequest,
} = require("./fetch");

const templateId = "59811";

const componentAppId = "tt7383053eeca9d442";

// 授权小程序
const authorizer_access_token =
  "isvact.3a7c6381e64577087d03729b808eeca6iAUVIdAebYjL7LdXF5MGONou0gxO_hl";

const run = async () => {
  //1、 绑定模板
  await uploadTemplateV2({
    authorizer_access_token: authorizer_access_token,
    template_id: templateId,
    user_desc: "feat: 测试新版本",
    user_version: "0.0.2",
    ext_json: {
      ext: {
        TP_APP_ID: "tt7383053eeca9d442",  // 服务商第三方小程序 appid
        // API_HOST: "https://api.laiyagushi.com",
        // API_HOST: "km-dalaran--box-65096--api-laiyagushi-com.zpres.zhihu.com",
        API_HOST:
          "https://km-dalaran--box-65096--api-laiyagushi-com.zpres.zhihu.com",
        // MINI_APPID: "tte50893b57a3f7eed01",  // 天秤
        // PRODUCT_ID: "1885073809138238427",   // 天秤

        MINI_APPID: "tt2e7f58c2b14f814401", // 斑马
        PRODUCT_ID: "1723057087201091584", // 斑马

        THEME_COLOR: {
          primaryColor: "#F5AD22",
          deepColor: "#572D07",
          warnColor: "#FF3257",
          linkColor: "#84B6E7",
        },
        vipCardText: "精品小说免费看"
      },
    },
  }).then(async res => {
    console.log("uploadTemplateV2", res);

  

    //2. 生成测试二维码
    const getAuthorizerQrCodeResult = await getAuthorizerQrCodeV2({
      componentAppId,
      path: 'pages/manuscript/manuscript?ad_group=__PROJECT_ID__&pages%2Fmanuscript%2Fmanuscript%3Fad_campaign=__PROMOTION_ID__&utm_medium=commercial_dist&work_id=1899199894125777092&zxh_adid=1900146755628130637&clickid=__CLICKID__&id=1899199894125777092&utm_division=&utm_source=ttxxl&ad_campaign_name=__PROMOTION_NAME__&ad_group_name=__PROJECT_NAME__',
      authorizer_access_token: authorizer_access_token,
    });

    console.log("getAuthorizerQrCodeResult", getAuthorizerQrCodeResult.data);
  });
};

// run();

// 设置安全域名 
const run2 = async () => {
  const setRequestResult = await setRequest({
    action: 'set',
    authorizer_access_token: authorizer_access_token,
  });
  console.log("setRequestResult", setRequestResult.data);
};

run2();

