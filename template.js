const {
  getTemplateList,
  uploadTemplate,
  getAuthorizationCode,
  submitAudit,
  getAuthorizerAccessToken,
  getAuthorizerQrCode
} = require("./fetch");


const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const main = async () => {
  const { authorization_code } = await getAuthorizationCode();

  console.log("authorization_code", authorization_code);

  // 获取第三方授权的 access_token
  const { authorizer_access_token } = await getAuthorizerAccessToken(
    authorization_code
  );
  console.log("getAuthorizerAccessToken", authorizer_access_token);

  // const authorizer_access_token = '0802121847445a794e6341485243776c4c75654d423332702f513d3d'

  const templateList = await getTemplateList();


  const templateId = templateList?.template_list[0]?.template_id;
  
  
  console.log("templateList", templateList);
  console.log("templateId", templateId);

  // get_tpl_list {
  //   errno: 0,
  //   message: 'success',
  //   template_list: [
  //     {
  //       template_id: 57975,
  //       user_version: '0.0.1',
  //       user_desc: 'feat: 番薯短篇阅读',
  //       create_time: 1744470143
  //     }
  //   ]
  // }

  const uploadTemplateResult = await uploadTemplate({
    authorizer_access_token: authorizer_access_token,
    template_id: templateId,
    user_desc: "feat: 绑定 Template",
    user_version: "0.0.2",
    ext_json: {
      ext: {
        authorizer_appid: "tt328c4431adbbd92c01",
        app_id: "tt328c4431adbbd92c01",
        app_name: "test name",
        app_logo: "https://static.bytedance.com/p26-ops/tos-cn-i-0001/1744894203_1744894203_1744894203",
      },
    },
  });


  console.log("uploadTemplateResult", uploadTemplateResult);

  // await sleep(3000);

  const getAuthorizerQrCodeResult = await getAuthorizerQrCode({
    authorizer_access_token: authorizer_access_token,
  });

  console.log("getAuthorizerQrCodeResult", getAuthorizerQrCodeResult);


//  const submitAuditResult = await submitAudit({
//     authorizer_access_token: authorizer_access_token,
//   });

//   console.log("submitAuditResult", submitAuditResult);
};

main();
