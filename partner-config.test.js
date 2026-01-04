/**
 * ExtJson 配置管理完整测试用例
 * 包含：草稿管理、审核流程、版本发布、版本回退等场景
 * 使用方法：node partner-config.test.js
 */

const http = require('http');

const BASE_URL = 'http://127.0.0.1:7080/api/dalaran-nodejs/partner/ext-json';

// 测试用的小程序 AppID
const TEST_APP_IDS = {
  app1: 'tt_test_app_1_' + Date.now(),
  app2: 'tt_test_app_2_' + Date.now(),
};

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// HTTP 请求函数
async function request(method, path, data = null) {
  await delay(300);
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    const urlObj = new URL(url);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => (body += chunk));
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({
            status: res.statusCode,
            data: result,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body,
            error: e.message,
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// 断言函数
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ 断言失败: ${message}`);
    throw new Error(`断言失败: ${message}`);
  }
  console.log(`✅ 断言成功: ${message}`);
}

// 验证响应结构
function validateResponse(response, expectedStatus, message) {
  assert(
    response.status === expectedStatus,
    `${message} - 状态码应为 ${expectedStatus}，实际为 ${response.status}`
  );
  assert(response.data, `${message} - 响应应包含 data`);

  if (response.data.status !== undefined) {
    assert(
      response.data.status === 0,
      `${message} - 业务状态码应为 0，实际为 ${response.data.status}`
    );
  }

  return response.data.data || response.data;
}

// 测试场景类
class ExtJsonTestScenarios {
  constructor() {
    this.testResults = [];
  }

  log(message, data = null) {
    console.log(`\n[${new Date().toISOString()}] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  // 场景1：基础草稿管理流程
  async testBasicDraftFlow(appId) {
    this.log(`\n========== 场景1：基础草稿管理流程 (${appId}) ==========`);

    // 1.1 创建草稿
    this.log('1.1 创建草稿');
    const createDraftData = {
      appid: appId,
      templateId: 'tpl_001',
      version: '1.0.0',
      versionDesc: 'Initial draft version 1.0.0',
      extJson: JSON.stringify({
        api: 'v1',
        pages: ['index', 'about'],
        config: { theme: 'light' },
      }),
      platformValue: 'DOUYIN',
    };

    const createResponse = await request('POST', '/draft', createDraftData);
    const draft = validateResponse(createResponse, 200, '创建草稿');

    // 验证返回数据结构
    assert(draft.appid === appId, '返回的 appid 应与请求一致');
    assert(draft.version === '1.0.0', '返回的版本号应为 1.0.0');
    assert(draft.statusValue === 'draft', '状态应为 draft');
    assert(draft.platformValue === 'DOUYIN', '平台应为 DOUYIN');
    assert(
      draft.versionDesc === 'Initial draft version 1.0.0',
      'versionDesc 应正确'
    );
    assert(draft.id, '应返回草稿 ID');

    // 1.2 获取草稿详情
    this.log('1.2 获取草稿详情');
    const configDetailsResponse1 = await request(
      'GET',
      `/config-details?appid=${appId}`
    );

    console.log('configDetailsResponse1', configDetailsResponse1.data);

    const configDetails1 = validateResponse(
      configDetailsResponse1,
      200,
      '获取配置详情 (场景1.2)'
    );
    const getDraft = configDetails1.draft;

    assert(
      getDraft && Object.keys(getDraft).length > 0,
      '获取的草稿应存在且不为空对象'
    );
    assert(getDraft.appid === appId, '获取的草稿 appid 应正确');
    assert(getDraft.extJson === createDraftData.extJson, 'extJson 内容应一致');

    // 1.3 更新草稿
    this.log('1.3 更新草稿');
    const updateDraftData = {
      ...createDraftData,
      version: '1.0.1',
      versionDesc: 'Updated draft to version 1.0.1',
      extJson: JSON.stringify({
        api: 'v1.1',
        pages: ['index', 'about', 'profile'],
        config: { theme: 'dark' },
      }),
    };

    const updateResponse = await request('POST', '/draft', updateDraftData);
    const updatedDraft = validateResponse(updateResponse, 200, '更新草稿');

    assert(updatedDraft.version === '1.0.1', '版本号应更新为 1.0.1');
    assert(
      updatedDraft.extJson === updateDraftData.extJson,
      '更新后的 extJson 应正确'
    );
    assert(
      updatedDraft.versionDesc === updateDraftData.versionDesc,
      '更新后的 versionDesc 应正确'
    );

    return { success: true, draftId: draft.id };
  }

  // 场景2：审核流程测试
  async testReviewFlow(appId) {
    this.log(`\n========== 场景2：审核流程测试 (${appId}) ==========`);

    // 2.1 提交审核
    this.log('2.1 提交审核');
    const submitResponse = await request('POST', '/submit-review', {
      appid: appId,
    });
    const submitResult = validateResponse(submitResponse, 200, '提交审核');

    assert(
      submitResult.statusValue === 'pending_review',
      '提交后状态应为 pending_review'
    );

    // 2.2 测试审核不通过
    this.log('2.2 测试审核不通过');
    const rejectResponse = await request('POST', '/update-review-status', {
      appid: appId,
      statusValue: 'rejected',
      rejectReason: '测试内容不符合规范',
    });
    const rejectResult = validateResponse(rejectResponse, 200, '审核拒绝');

    assert(rejectResult.statusValue === 'rejected', '状态应为 rejected');

    // 2.3 重新创建草稿并提交
    this.log('2.3 重新创建草稿');
    await request('POST', '/draft', {
      appid: appId,
      templateId: 'tpl_001',
      version: '1.0.2',
      versionDesc: 'Draft for second review, version 1.0.2',
      extJson: JSON.stringify({
        api: 'v2',
        pages: ['index', 'about'],
        config: { theme: 'light', optimized: true },
      }),
      platformValue: 'DOUYIN',
    });

    this.log('2.4 再次提交审核');
    await request('POST', '/submit-review', { appid: appId });

    // 2.5 审核通过
    this.log('2.5 审核通过');
    const approveResponse = await request('POST', '/update-review-status', {
      appid: appId,
      statusValue: 'review_passed',
    });
    const approveResult = validateResponse(approveResponse, 200, '审核通过');

    assert(
      approveResult.statusValue === 'review_passed',
      '状态应为 review_passed'
    );
    assert(
      approveResult.versionDesc === 'Draft for second review, version 1.0.2',
      '审核通过后 versionDesc 应保留'
    );

    // 2.5a 验证此时线上版本应不存在或为旧版 (根据之前的测试，可能是 null)
    this.log('2.5a 验证审核通过但未发布时，线上版本情况');
    const prePublishConfigResponse = await request(
      'GET',
      `/config-details?appid=${appId}`
    );

    console.log('prePublishConfigResponse', prePublishConfigResponse.data);
    const prePublishConfig = validateResponse(
      prePublishConfigResponse,
      200,
      '获取配置详情 (场景2.5a)'
    );
    const prePublishOnlineVersion = prePublishConfig.online;

    if (
      prePublishOnlineVersion &&
      Object.keys(prePublishOnlineVersion).length > 0
    ) {
      this.log(
        '存在之前的线上版本 (可能来自其他测试场景，如果独立运行则为null):',
        prePublishOnlineVersion
      );
    } else {
      this.log(
        '审核通过但未发布时，没有查询到线上版本或线上版本为空对象，符合预期。'
      );
      assert(
        !prePublishOnlineVersion ||
          Object.keys(prePublishOnlineVersion).length === 0,
        '审核通过但未发布时，线上版本应不存在或为空对象'
      );
    }

    // 2.5b 发布小程序
    this.log('2.5b 发布小程序');
    const publishResponse = await request('POST', '/publish', { appid: appId });
    validateResponse(publishResponse, 200, '发布小程序');

    // 2.6 验证线上版本
    this.log('2.6 验证发布后的线上版本');
    const postPublishConfigResponse = await request(
      'GET',
      `/config-details?appid=${appId}`
    );
    const postPublishConfig = validateResponse(
      postPublishConfigResponse,
      200,
      '获取配置详情 (场景2.6)'
    );
    const onlineVersion = postPublishConfig.online;

    assert(
      onlineVersion && Object.keys(onlineVersion).length > 0,
      '发布后线上版本应存在且不为空对象'
    );
    console.log('postPublishConfig', postPublishConfig);

    assert(onlineVersion.version === '1.0.2', '线上版本应为 1.0.2');
    assert(onlineVersion.releaseType === 'normal', '发布类型应为 normal');
    assert(onlineVersion.releasedAt, '应包含发布时间');

    return { success: true };
  }

  // 场景3：多版本发布和单次回退
  async testMultiVersionAndSingleRollback(appId) {
    this.log(`\n========== 场景3：多版本发布和单次回退 (${appId}) ==========`);

    const versions = ['2.0.0', '2.1.0', '2.2.0'];

    // 3.1 发布多个版本
    for (let i = 0; i < versions.length; i++) {
      const version = versions[i];
      this.log(`3.1.${i + 1} 发布版本 ${version}`);

      // 创建草稿
      await request('POST', '/draft', {
        appid: appId,
        templateId: 'tpl_002',
        version: version,
        versionDesc: `Version ${version} release candidate`,
        extJson: JSON.stringify({
          api: `v${i + 3}`,
          pages: ['index', 'about', `feature${i + 1}`],
          version: version,
        }),
        platformValue: 'DOUYIN',
      });

      // 提交审核
      await request('POST', '/submit-review', { appid: appId });

      // 审核通过
      await request('POST', '/update-review-status', {
        appid: appId,
        statusValue: 'review_passed',
      });

      // 发布版本
      this.log(`NEW: 发布版本 ${version}`);
      await request('POST', '/publish', { appid: appId });

      await delay(500); // 确保时间戳不同
    }

    // 3.2 验证版本历史
    this.log('3.2 验证版本历史');
    const historyResponse = await request(
      'GET',
      `/version-history?appid=${appId}&limit=10`
    );

    console.log('historyResponse', historyResponse.data);
    const history = validateResponse(historyResponse, 200, '获取版本历史');

    assert(Array.isArray(history), '版本历史应为数组');
    assert(history.length >= 4, '应至少有4个版本（包含之前的版本）');

    // 3.3 执行单次回退
    this.log('3.3 执行版本回退（从 2.2.0 回退到 2.1.0）');
    const rollbackResponse = await request('POST', '/rollback', {
      appid: appId,
    });
    const rollbackResult = validateResponse(rollbackResponse, 200, '版本回退');

    assert(rollbackResult.version === '2.1.0', '回退后版本应为 2.1.0');
    assert(rollbackResult.releaseType === 'rollback', '发布类型应为 rollback');
    assert(rollbackResult.rollbackFromId, '应包含回退来源 ID');
    assert(
      rollbackResult.versionDesc === 'Version 2.1.0 release candidate',
      '回退后 versionDesc 应为目标版本的描述'
    );

    // 3.4 验证当前线上版本
    this.log('3.4 验证回退后的线上版本');
    const currentConfigResponse = await request(
      'GET',
      `/config-details?appid=${appId}`
    );
    const currentConfig = validateResponse(
      currentConfigResponse,
      200,
      '获取配置详情 (场景3.4)'
    );
    const currentVersion = currentConfig.online;

    console.log('configDetailsResponse1', currentConfigResponse.data);

    assert(
      currentVersion && Object.keys(currentVersion).length > 0,
      '回退后线上版本应存在且不为空对象'
    );
    assert(currentVersion.version === '2.1.0', '当前版本应为 2.1.0');
    const extJson = JSON.parse(currentVersion.extJson);
    assert(extJson.api === 'v4', 'API 版本应为 v4（对应 2.1.0）');

    return { success: true };
  }

  // 场景4：回退后再发布新版本
  async testRollbackThenPublish(appId) {
    this.log(`\n========== 场景4：回退后再发布新版本 (${appId}) ==========`);

    // 4.1 发布新版本 3.0.0
    this.log('4.1 发布新版本 3.0.0');
    await request('POST', '/draft', {
      appid: appId,
      templateId: 'tpl_003',
      version: '3.0.0',
      versionDesc: 'Major release version 3.0.0',
      extJson: JSON.stringify({
        api: 'v6',
        pages: ['index', 'dashboard', 'settings'],
        features: ['new-ui', 'performance'],
      }),
      platformValue: 'DOUYIN',
    });

    await request('POST', '/submit-review', { appid: appId });
    await request('POST', '/update-review-status', {
      appid: appId,
      statusValue: 'review_passed',
    });

    // 发布版本
    this.log('NEW: 发布版本 3.0.0');
    await request('POST', '/publish', { appid: appId });

    // 4.2 验证版本发布历史
    this.log('4.2 验证版本发布历史');
    const releaseHistoryResponse = await request(
      'GET',
      `/release-history?appid=${appId}&includeContent=true`
    );
    const releaseHistory = validateResponse(
      releaseHistoryResponse,
      200,
      '获取发布历史'
    );

    assert(Array.isArray(releaseHistory), '发布历史应为数组');

    // 查找最新的记录
    const latestRelease = releaseHistory[0];
    assert(latestRelease.version === '3.0.0', '最新版本应为 3.0.0');
    assert(latestRelease.operation === '新版本发布', '操作类型应为新版本发布');

    // 查找回退记录
    const rollbackRecord = releaseHistory.find(
      r => r.releaseType === 'rollback'
    );
    assert(rollbackRecord, '应存在回退记录');
    assert(
      rollbackRecord.operation.includes('回退'),
      '回退记录的操作描述应包含"回退"'
    );

    return { success: true };
  }

  // 场景5：连续回退测试
  async testContinuousRollback(appId) {
    this.log(`\n========== 场景5：连续回退测试 (${appId}) ==========`);

    // 5.1 准备：发布三个版本
    const versions = [
      { version: '4.0.0', api: 'v7', feature: 'basic' },
      { version: '4.1.0', api: 'v8', feature: 'advanced' },
      { version: '4.2.0', api: 'v9', feature: 'premium' },
    ];

    for (const versionInfo of versions) {
      this.log(`5.1 发布版本 ${versionInfo.version}`);

      await request('POST', '/draft', {
        appid: appId,
        templateId: 'tpl_004',
        version: versionInfo.version,
        versionDesc: `Feature release ${versionInfo.feature}`,
        extJson: JSON.stringify({
          api: versionInfo.api,
          pages: ['index'],
          feature: versionInfo.feature,
        }),
        platformValue: 'DOUYIN',
      });

      await request('POST', '/submit-review', { appid: appId });
      await request('POST', '/update-review-status', {
        appid: appId,
        statusValue: 'review_passed',
      });

      // 发布版本
      this.log(`NEW: 发布版本 ${versionInfo.version}`);
      await request('POST', '/publish', { appid: appId });

      await delay(500);
    }

    // 5.2 第一次回退（4.2.0 -> 4.1.0）
    this.log('5.2 第一次回退（4.2.0 -> 4.1.0）');
    const rollback1Response = await request('POST', '/rollback', {
      appid: appId,
    });
    const rollback1 = validateResponse(rollback1Response, 200, '第一次回退');

    assert(rollback1.version === '4.1.0', '第一次回退后应为 4.1.0');
    assert(rollback1.versionDesc === 'Feature release advanced');
    const extJson1 = JSON.parse(rollback1.extJson);
    assert(extJson1.api === 'v8', 'API 应为 v8');
    assert(extJson1.feature === 'advanced', 'feature 应为 advanced');

    await delay(500);

    // 5.3 第二次回退（4.1.0 -> 4.0.0）
    this.log('5.3 第二次回退（4.1.0 -> 4.0.0）');
    const rollback2Response = await request('POST', '/rollback', {
      appid: appId,
    });
    const rollback2 = validateResponse(rollback2Response, 200, '第二次回退');
    console.log('rollback2', rollback2);
    assert(rollback2.version === '4.0.0', '第二次回退后应为 4.0.0');
    assert(rollback2.versionDesc === 'Feature release basic');
    const extJson2 = JSON.parse(rollback2.extJson);
    assert(extJson2.api === 'v7', 'API 应为 v7');
    assert(extJson2.feature === 'basic', 'feature 应为 basic');

    // 5.4 验证无法继续回退
    this.log('5.4 验证无法继续回退');
    const rollback3Response = await request('POST', '/rollback', {
      appid: appId,
    });

    if (
      rollback3Response.status === 200 &&
      rollback3Response.data.status === 0
    ) {
      // 如果还有更早的版本，继续验证
      const rollback3 = rollback3Response.data.data;
      this.log(`继续回退到版本 ${rollback3.version}`);
    } else {
      // 应该返回错误
      assert(rollback3Response.data.status === 500, '应返回错误状态');
      assert(
        rollback3Response.data.message.includes('没有可回退的版本'),
        '错误信息应提示没有可回退的版本'
      );
      this.log('正确：已无法继续回退');
    }

    return { success: true };
  }

  // 场景6：多个小程序并行操作
  async testMultipleApps() {
    this.log('\n========== 场景6：多个小程序并行操作 ==========');

    // 为场景6使用全新的 AppID，避免与之前的测试冲突
    const app1 = 'tt_multi_app_1_' + Date.now();
    const app2 = 'tt_multi_app_2_' + Date.now();

    // 6.1 App1 发布版本
    this.log(`6.1 ${app1} 发布版本 1.0.0`);
    await request('POST', '/draft', {
      appid: app1,
      templateId: 'tpl_multi_1',
      version: '1.0.0',
      versionDesc: 'App1 initial release',
      extJson: JSON.stringify({ api: 'app1_v1', name: 'App1' }),
      platformValue: 'DOUYIN',
    });
    await request('POST', '/submit-review', { appid: app1 });
    await request('POST', '/update-review-status', {
      appid: app1,
      statusValue: 'review_passed',
    });
    await request('POST', '/publish', { appid: app1 }); // NEW: Publish App1 Version 1

    // 6.2 App2 发布版本
    this.log(`6.2 ${app2} 发布版本 1.0.0`);
    await request('POST', '/draft', {
      appid: app2,
      templateId: 'tpl_multi_2',
      version: '1.0.0',
      versionDesc: 'App2 initial release',
      extJson: JSON.stringify({ api: 'app2_v1', name: 'App2' }),
      platformValue: 'DOUYIN',
    });
    await request('POST', '/submit-review', { appid: app2 });
    await request('POST', '/update-review-status', {
      appid: app2,
      statusValue: 'review_passed',
    });
    await request('POST', '/publish', { appid: app2 }); // NEW: Publish App2 Version 1

    // 6.3 验证两个应用的版本独立
    this.log('6.3 验证两个应用的版本独立');
    const app1ConfigResponse = await request(
      'GET',
      `/config-details?appid=${app1}`
    );
    const app1Config = validateResponse(
      app1ConfigResponse,
      200,
      'App1 配置详情'
    );
    const app1Version = app1Config.online;

    const app2ConfigResponse = await request(
      'GET',
      `/config-details?appid=${app2}`
    );
    const app2Config = validateResponse(
      app2ConfigResponse,
      200,
      'App2 配置详情'
    );
    const app2Version = app2Config.online;

    assert(
      app1Version && Object.keys(app1Version).length > 0,
      'App1 线上版本应存在'
    );
    assert(
      app2Version && Object.keys(app2Version).length > 0,
      'App2 线上版本应存在'
    );

    const app1ExtJson = JSON.parse(app1Version.extJson);
    const app2ExtJson = JSON.parse(app2Version.extJson);

    assert(app1ExtJson.name === 'App1', 'App1 的配置应正确');
    assert(app2ExtJson.name === 'App2', 'App2 的配置应正确');
    assert(app1Version.appid !== app2Version.appid, '两个应用的 appid 应不同');
    assert(
      app1Version.versionDesc === 'App1 initial release',
      'App1 versionDesc 应正确'
    );
    assert(
      app2Version.versionDesc === 'App2 initial release',
      'App2 versionDesc 应正确'
    );

    // 6.4 App1 发布新版本并回退
    this.log('6.4 App1 发布新版本 2.0.0');
    await request('POST', '/draft', {
      appid: app1,
      templateId: 'tpl_multi_1',
      version: '2.0.0',
      versionDesc: 'App1 version 2.0.0 with upgrade',
      extJson: JSON.stringify({ api: 'app1_v2', name: 'App1', upgraded: true }),
      platformValue: 'DOUYIN',
    });
    await request('POST', '/submit-review', { appid: app1 });
    await request('POST', '/update-review-status', {
      appid: app1,
      statusValue: 'review_passed',
    });
    await request('POST', '/publish', { appid: app1 }); // NEW: Publish App1 Version 2.0.0

    // 6.5 App1 执行回退
    this.log('6.5 App1 执行回退');
    await request('POST', '/rollback', { appid: app1 });

    // 6.6 验证 App2 不受影响
    this.log('6.6 验证 App2 版本未受影响');
    const app2CheckConfigResponse = await request(
      'GET',
      `/config-details?appid=${app2}`
    );
    const app2CheckConfig = validateResponse(
      app2CheckConfigResponse,
      200,
      'App2 配置详情检查'
    );
    const app2Check = app2CheckConfig.online;

    assert(
      app2Check && Object.keys(app2Check).length > 0,
      'App2 线上版本 (检查时) 应存在'
    );
    assert(app2Check.version === '1.0.0', 'App2 版本应保持不变');
    const app2CheckExtJson = JSON.parse(app2Check.extJson);
    assert(app2CheckExtJson.api === 'app2_v1', 'App2 的配置应保持不变');

    return { success: true };
  }

  // 场景7：错误处理测试
  async testErrorHandling() {
    this.log('\n========== 场景7：错误处理测试 ==========');

    // 7.1 获取不存在的草稿
    this.log('7.1 获取不存在的配置详情 (预期草稿和线上均为空对象)');
    const notExistAppId = 'tt_this_app_does_not_exist_' + Date.now();
    const notExistConfigResponse = await request(
      'GET',
      `/config-details?appid=${notExistAppId}`
    );
    const notExistConfig = validateResponse(
      notExistConfigResponse,
      200,
      `获取不存在的AppID (${notExistAppId}) 的配置详情`
    );

    assert(notExistConfig, '不存在的AppID配置详情响应体应存在');
    assert(typeof notExistConfig.draft === 'object', 'draft 应为对象');
    assert(typeof notExistConfig.online === 'object', 'online 应为对象');
    assert(
      Object.keys(notExistConfig.draft).length === 0,
      '不存在AppID的draft应为空对象'
    );
    assert(
      Object.keys(notExistConfig.online).length === 0,
      '不存在AppID的online应为空对象'
    );
    this.log(
      `✅ 正确：获取不存在的 AppID (${notExistAppId}) 时，draft 和 online 均返回空对象 {}`
    );

    // 7.2 重复提交审核
    this.log('7.2 测试重复提交审核');
    const testAppId = 'tt_error_test_' + Date.now();

    // 先创建草稿并提交
    await request('POST', '/draft', {
      appid: testAppId,
      templateId: 'tpl_error',
      version: '1.0.0',
      extJson: '{"test": true}',
      platformValue: 'DOUYIN',
    });
    await request('POST', '/submit-review', { appid: testAppId });

    // 再次提交应该失败
    const duplicateSubmitResponse = await request('POST', '/submit-review', {
      appid: testAppId,
    });

    // 打印实际的响应以便调试
    this.log('重复提交审核的响应:', duplicateSubmitResponse.data);

    assert(duplicateSubmitResponse.data.status === 500, '重复提交应返回错误');
    assert(
      duplicateSubmitResponse.data.message &&
        (duplicateSubmitResponse.data.message.includes('已有版本在审核中') ||
          duplicateSubmitResponse.data.message.includes('未找到可提交的草稿')),
      `应提示已有版本在审核中或未找到可提交的草稿，实际消息: ${duplicateSubmitResponse.data.message}`
    );

    // 7.3 回退不存在的版本
    this.log('7.3 回退不存在的版本');
    const noVersionResponse = await request('POST', '/rollback', {
      appid: 'no_version_app',
    });
    assert(noVersionResponse.data.status === 500, '应返回错误状态');
    assert(
      noVersionResponse.data.message.includes('没有线上版本'),
      '应提示没有线上版本'
    );

    return { success: true };
  }

  // 场景8：测试统一的草稿创建/更新接口
  async testUnifiedDraftAPI(appId) {
    this.log(
      `\n========== 场景8：测试统一的草稿创建/更新接口 (${appId}) ==========`
    );

    // 8.1 创建草稿（只提供必填字段）
    this.log('8.1 创建草稿（只提供必填字段）');
    const createData = {
      appid: appId,
      extJson: JSON.stringify({
        api: 'unified_v1',
        pages: ['index'],
        config: { mode: 'basic' },
      }),
      platformValue: 'DOUYIN',
      versionDesc: 'Unified API test - initial create',
      // 不提供 version 和 templateId
    };

    const createResponse = await request('POST', '/draft', createData);
    const draft = validateResponse(createResponse, 200, '创建草稿（最少字段）');

    assert(draft.appid === appId, '返回的 appid 应与请求一致');
    assert(draft.platformValue === 'DOUYIN', '平台应为 DOUYIN');
    assert(draft.statusValue === 'draft', '状态应为 draft');
    assert(draft.version === '', 'version 应为空字符串');
    assert(draft.templateId === '', 'templateId 应为空字符串');
    assert(
      draft.versionDesc === 'Unified API test - initial create',
      'versionDesc 应正确'
    );

    // 8.2 更新草稿（只更新 version）
    this.log('8.2 更新草稿（只更新 version）');
    const updateVersionData = {
      appid: appId,
      extJson: draft.extJson, // 保持原有的 extJson
      platformValue: 'DOUYIN',
      version: '1.0.0',
      versionDesc: 'Unified API test - version updated',
      // 不提供 templateId
    };

    const updateVersionResponse = await request(
      'POST',
      '/draft',
      updateVersionData
    );
    const updatedDraft1 = validateResponse(
      updateVersionResponse,
      200,
      '更新 version'
    );

    assert(updatedDraft1.version === '1.0.0', 'version 应更新为 1.0.0');
    assert(updatedDraft1.templateId === '', 'templateId 应保持为空');
    assert(updatedDraft1.extJson === draft.extJson, 'extJson 应保持不变');
    assert(
      updatedDraft1.versionDesc === 'Unified API test - version updated',
      'versionDesc 应更新'
    );

    // 8.3 更新草稿（只更新 templateId）
    this.log('8.3 更新草稿（只更新 templateId）');
    const updateTemplateData = {
      appid: appId,
      extJson: draft.extJson,
      platformValue: 'DOUYIN',
      templateId: 'tpl_unified_001',
      versionDesc: 'Unified API test - templateId updated',
      // 不提供 version，应保持之前的值
    };

    const updateTemplateResponse = await request(
      'POST',
      '/draft',
      updateTemplateData
    );
    const updatedDraft2 = validateResponse(
      updateTemplateResponse,
      200,
      '更新 templateId'
    );

    assert(updatedDraft2.version === '1.0.0', 'version 应保持为 1.0.0');
    assert(updatedDraft2.templateId === 'tpl_unified_001', 'templateId 应更新');
    assert(
      updatedDraft2.versionDesc === 'Unified API test - templateId updated',
      'versionDesc 应更新'
    );

    // 8.4 更新草稿（同时更新多个字段）
    this.log('8.4 更新草稿（同时更新多个字段）');
    const updateAllData = {
      appid: appId,
      extJson: JSON.stringify({
        api: 'unified_v2',
        pages: ['index', 'settings'],
        config: { mode: 'advanced' },
      }),
      platformValue: 'DOUYIN',
      version: '2.0.0',
      templateId: 'tpl_unified_002',
      versionDesc: 'Unified API test - all fields updated',
    };

    const updateAllResponse = await request('POST', '/draft', updateAllData);
    const updatedDraft3 = validateResponse(
      updateAllResponse,
      200,
      '更新所有字段'
    );

    assert(updatedDraft3.version === '2.0.0', 'version 应更新为 2.0.0');
    assert(updatedDraft3.templateId === 'tpl_unified_002', 'templateId 应更新');
    assert(updatedDraft3.extJson === updateAllData.extJson, 'extJson 应更新');
    assert(
      updatedDraft3.versionDesc === 'Unified API test - all fields updated',
      'versionDesc 应更新'
    );

    // 8.5 测试审核中状态的限制
    this.log('8.5 测试审核中状态的限制');

    // 为测试审核状态创建一个新的小程序
    const reviewTestAppId = 'tt_review_test_' + Date.now();

    // 先创建一个草稿
    this.log(`8.5.1 为 ${reviewTestAppId} 创建初始草稿`);
    await request('POST', '/draft', {
      appid: reviewTestAppId,
      extJson: JSON.stringify({ api: 'review_test_v1' }),
      platformValue: 'DOUYIN',
      version: '1.0.0',
      versionDesc: 'Review test initial draft',
    });

    // 提交审核，使其状态变为 pending_review
    this.log(`8.5.2 提交 ${reviewTestAppId} 的草稿进行审核`);
    const submitToReviewResponse = await request('POST', '/submit-review', {
      appid: reviewTestAppId,
    });
    validateResponse(
      submitToReviewResponse,
      200,
      `提交 ${reviewTestAppId} 审核`
    );
    assert(
      submitToReviewResponse.data.data.statusValue === 'pending_review',
      `${reviewTestAppId} 状态应为 pending_review`
    );

    this.log(`8.5.3 ${reviewTestAppId} 当前为 pending_review 状态`);

    // 尝试更新/创建草稿（应该失败，因为有版本正在审核中）
    this.log(`8.5.4 尝试在 ${reviewTestAppId} 审核中时操作草稿（应失败）`);
    const operateDuringReviewResponse = await request('POST', '/draft', {
      appid: reviewTestAppId,
      extJson: JSON.stringify({ api: 'review_test_v2_update' }),
      platformValue: 'DOUYIN',
      version: '2.0.0',
      versionDesc: 'Attempted update during review',
    });

    assert(
      operateDuringReviewResponse.data.status === 500,
      '审核中操作草稿应返回错误状态'
    );
    assert(
      operateDuringReviewResponse.data.message.includes('有版本正在审核中'),
      '错误信息应提示有版本正在审核中'
    );
    this.log('✅ 正确：审核中状态阻止了草稿操作');

    // 清理：为了让后续测试appid能够使用，需要将此appid的审核状态解除
    // 实践中可能是撤销审核或等待审核完成。这里我们模拟审核不通过，回到可编辑状态。
    this.log(
      `8.5.5 模拟 ${reviewTestAppId} 审核不通过，解除 pending_review 状态`
    );
    await request('POST', '/update-review-status', {
      appid: reviewTestAppId,
      statusValue: 'rejected',
      rejectReason: '测试清理：解除pending_review',
    });

    // 8.6 测试被拒绝状态转为草稿
    this.log('8.6 测试被拒绝状态转为草稿');

    // 先将状态改为拒绝
    const rejectResponse = await request('POST', '/update-review-status', {
      appid: appId,
      statusValue: 'rejected',
      rejectReason: '测试拒绝',
    });

    console.log('rejectResponse', rejectResponse);

    // 创建新草稿（应该将被拒绝的记录转为草稿）
    const createAfterRejectResponse = await request('POST', '/draft', {
      appid: appId,
      extJson: JSON.stringify({
        api: 'unified_v3',
        pages: ['index', 'about', 'contact'],
        config: { mode: 'rejected-to-draft' },
      }),
      platformValue: 'DOUYIN',
      version: '3.0.0',
      templateId: 'tpl_unified_003',
      versionDesc: 'Unified API test - draft from rejected',
    });

    const draftFromRejected = validateResponse(
      createAfterRejectResponse,
      200,
      '被拒绝记录转为草稿'
    );

    assert(draftFromRejected.statusValue === 'draft', '状态应为 draft');
    assert(draftFromRejected.version === '3.0.0', 'version 应更新');
    assert(
      draftFromRejected.templateId === 'tpl_unified_003',
      'templateId 应更新'
    );
    assert(
      draftFromRejected.versionDesc ===
        'Unified API test - draft from rejected',
      'versionDesc 应更新'
    );

    // 验证只有一条 draft 记录
    const draftListResponse = await request(
      'GET',
      `/draft-list?appid=${appId}&statusValue=draft`
    );

    console.log('draftListResponse-草稿 list ', draftListResponse);
    if (draftListResponse.status === 200 && draftListResponse.data.data) {
      const draftList = draftListResponse.data.data.list || [];
      const appDrafts = draftList.filter(d => d.appid === appId);
      assert(appDrafts.length <= 1, '应该只有一条 draft 记录');
    }

    return { success: true };
  }

  // 场景9：测试 uploadCode 的 updateDraft 参数
  async testUploadCodeWithUpdateDraft(appId) {
    this.log(
      `\n========== 场景9：测试 uploadCode 的 updateDraft 参数 (${appId}) ==========`
    );

    // 9.1 准备：创建草稿
    this.log('9.1 创建草稿');
    await request('POST', '/draft', {
      appid: appId,
      extJson: JSON.stringify({
        api: 'upload_test_v1',
        pages: ['index'],
        feature: 'upload-test',
      }),
      platformValue: 'DOUYIN',
      version: '1.0.0',
      templateId: 'tpl_upload_001',
    });

    // 9.2 模拟提交代码（updateDraft 默认为 true）
    this.log('9.2 模拟提交代码（updateDraft 默认为 true）');
    // 注意：这个调用可能会失败，因为是测试 AppID，但我们主要测试参数传递
    const uploadResponse1 = await request('POST', '/../upload-code', {
      componentAppid: appId,
      template_id: 12345,
      user_desc: '测试版本 with update',
      user_version: '1.1.0',
      // 不提供 ext_json，会从草稿获取
      // 不提供 updateDraft，使用默认值 true
    });

    this.log('上传响应（预期可能失败）:', uploadResponse1.data);

    // 9.3 检查草稿是否会被更新（如果上传成功的话）
    this.log('9.3 检查草稿状态');
    const draftCheckConfig1Response = await request(
      'GET',
      `/config-details?appid=${appId}`
    );
    const draftCheckConfig1 = validateResponse(
      draftCheckConfig1Response,
      200,
      '获取配置详情 (场景9.3)'
    );
    if (
      draftCheckConfig1.draft &&
      Object.keys(draftCheckConfig1.draft).length > 0
    ) {
      const draft1 = draftCheckConfig1.draft;
      this.log('草稿当前状态:', {
        version: draft1.version,
        templateId: draft1.templateId,
      });
      // 如果上传成功，version 应该更新为 1.1.0，templateId 应该更新为 "12345"
    } else {
      this.log('场景9.3 未找到草稿或草稿为空');
    }

    // 9.4 模拟提交代码（updateDraft = false）
    this.log('9.4 模拟提交代码（updateDraft = false）');
    const uploadResponse2 = await request('POST', '/../upload-code', {
      componentAppid: appId,
      template_id: 54321,
      user_desc: '测试版本 without update',
      user_version: '2.0.0',
      updateDraft: false, // 明确指定不更新草稿
    });

    this.log('上传响应（updateDraft=false）:', uploadResponse2.data);

    // 9.5 验证草稿未被更新
    this.log('9.5 验证草稿未被更新');
    const draftCheckConfig2Response = await request(
      'GET',
      `/config-details?appid=${appId}`
    );
    const draftCheckConfig2 = validateResponse(
      draftCheckConfig2Response,
      200,
      '获取配置详情 (场景9.5)'
    );
    if (
      draftCheckConfig2.draft &&
      Object.keys(draftCheckConfig2.draft).length > 0
    ) {
      const draft2 = draftCheckConfig2.draft;
      this.log('草稿最终状态:', {
        version: draft2.version,
        templateId: draft2.templateId,
      });
      // 因为 updateDraft=false，草稿的 version 和 templateId 应该保持不变
    } else {
      this.log('场景9.5 未找到草稿或草稿为空');
    }

    // 9.6 测试没有草稿时的默认 ext_json
    this.log('9.6 测试没有草稿时的默认 ext_json');
    const noExistAppId = 'tt_no_draft_' + Date.now();
    const uploadResponse3 = await request('POST', '/../upload-code', {
      componentAppid: noExistAppId,
      template_id: 99999,
      user_desc: '测试默认 ext_json',
      user_version: '1.0.0',
    });

    this.log('无草稿上传响应:', uploadResponse3.data);
    // 应该使用默认的 ext_json: { extEnable: true, extAppid: componentAppid, directCommit: false }

    return { success: true };
  }

  // 新场景：测试 /bind-template 接口
  async testBindTemplateAPI(appId) {
    this.log(
      `\n========== 新场景：测试 /bind-template 接口 (${appId}) ==========`
    );

    // 准备：先创建一个草稿
    this.log('准备：创建初始草稿');
    const initialDraftData = {
      appid: appId,
      extJson: JSON.stringify({ initial: true }),
      platformValue: 'DOUYIN',
      version: '0.9.0',
      versionDesc: 'Initial version for bind template test',
    };
    await request('POST', '/draft', initialDraftData);

    // 1. 绑定模板和版本
    this.log('1. 绑定模板、版本和版本描述');
    const bindData1 = {
      appid: appId,
      templateId: 'tpl_bind_001',
      version: '1.0.0',
      versionDesc: 'Bound to tpl_bind_001, v1.0.0',
    };
    const bindResponse1 = await request('POST', '/bind-template', bindData1);
    const boundDraft1 = validateResponse(bindResponse1, 200, '绑定模板和版本');

    assert(boundDraft1.templateId === 'tpl_bind_001', 'templateId 应更新');
    assert(boundDraft1.version === '1.0.0', 'version 应更新');
    assert(
      boundDraft1.versionDesc === 'Bound to tpl_bind_001, v1.0.0',
      'versionDesc 应更新'
    );

    // 2. 仅绑定模板ID (version 和 versionDesc 应该保留之前的值，如果service层逻辑是这样的话，或者根据具体实现调整)
    this.log('2. 仅绑定模板ID');
    const bindData2 = {
      appid: appId,
      templateId: 'tpl_bind_002',
      // version 和 versionDesc 不提供
    };
    const bindResponse2 = await request('POST', '/bind-template', bindData2);
    const boundDraft2 = validateResponse(bindResponse2, 200, '仅绑定模板ID');

    assert(
      boundDraft2.templateId === 'tpl_bind_002',
      'templateId 应更新为 tpl_bind_002'
    );
    assert(boundDraft2.version === '1.0.0', 'version 应保持 1.0.0'); // 假设不提供则不更新
    assert(
      boundDraft2.versionDesc === 'Bound to tpl_bind_001, v1.0.0',
      'versionDesc 应保持不变'
    ); // 假设不提供则不更新

    // 3. 绑定模板ID并更新版本描述 (version 不变)
    this.log('3. 绑定模板ID并更新版本描述');
    const bindData3 = {
      appid: appId,
      templateId: 'tpl_bind_003',
      versionDesc: 'Updated description for tpl_bind_003',
    };
    const bindResponse3 = await request('POST', '/bind-template', bindData3);
    const boundDraft3 = validateResponse(
      bindResponse3,
      200,
      '绑定模板ID并更新版本描述'
    );

    assert(
      boundDraft3.templateId === 'tpl_bind_003',
      'templateId 应更新为 tpl_bind_003'
    );
    assert(boundDraft3.version === '1.0.0', 'version 应保持 1.0.0');
    assert(
      boundDraft3.versionDesc === 'Updated description for tpl_bind_003',
      'versionDesc 应更新'
    );

    // 4. 绑定模板ID和版本 (versionDesc 不变)
    this.log('4. 绑定模板ID和版本');
    const bindData4 = {
      appid: appId,
      templateId: 'tpl_bind_004',
      version: '2.0.0',
    };
    const bindResponse4 = await request('POST', '/bind-template', bindData4);
    const boundDraft4 = validateResponse(
      bindResponse4,
      200,
      '绑定模板ID和版本'
    );

    assert(
      boundDraft4.templateId === 'tpl_bind_004',
      'templateId 应更新为 tpl_bind_004'
    );
    assert(boundDraft4.version === '2.0.0', 'version 应更新为 2.0.0');
    assert(
      boundDraft4.versionDesc === 'Updated description for tpl_bind_003',
      'versionDesc 应保持不变'
    );

    // 测试审核中/审核通过状态的限制 (需要配合状态变更)
    this.log('准备测试状态限制：提交审核');
    await request('POST', '/submit-review', { appid: appId });

    this.log('尝试在审核中绑定模板 (应失败)');
    const bindFailResponse1 = await request('POST', '/bind-template', {
      appid: appId,
      templateId: 'tpl_fail_001',
      versionDesc: 'Should fail due to pending_review',
    });
    assert(bindFailResponse1.data.status === 500, '审核中绑定模板应失败');
    assert(
      bindFailResponse1.data.message.includes('正在审核中'),
      '错误信息应提示正在审核中'
    );

    this.log('准备测试状态限制：审核通过');
    await request('POST', '/update-review-status', {
      appid: appId,
      statusValue: 'review_passed',
    });

    this.log('尝试在审核通过后绑定模板 (应失败)');
    const bindFailResponse2 = await request('POST', '/bind-template', {
      appid: appId,
      templateId: 'tpl_fail_002',
      versionDesc: 'Should fail due to review_passed',
    });
    assert(bindFailResponse2.data.status === 500, '审核通过后绑定模板应失败');
    assert(
      bindFailResponse2.data.message.includes('已审核通过'),
      '错误信息应提示已审核通过'
    );

    return { success: true };
  }

  // 新增场景：测试发布后创建新草稿
  async testCreateDraftWithPublishedVersion() {
    const appId = 'tt_publish_then_draft_' + Date.now();
    this.log(`
========== 新场景：测试发布后创建新草稿 (${appId}) ==========`);

    // Part 1: 首次创建草稿 (应该成功)
    this.log(`Part 1.1: 为 ${appId} 创建第一个草稿`);
    const firstDraftData = {
      appid: appId,
      templateId: 'tpl_init_001',
      version: '0.1.0',
      extJson: JSON.stringify({ msg: 'Initial draft' }),
      platformValue: 'DOUYIN',
      versionDesc: 'Initial draft for publish test',
    };
    const createFirstResp = await request('POST', '/draft', firstDraftData);
    validateResponse(createFirstResp, 200, '首次创建草稿');

    // Part 1.2: 提交审核 -> 审核通过 -> 发布
    this.log(`Part 1.2: ${appId} 0.1.0 版本：提交审核`);
    await request('POST', '/submit-review', { appid: appId });
    this.log(`Part 1.3: ${appId} 0.1.0 版本：审核通过`);
    await request('POST', '/update-review-status', {
      appid: appId,
      statusValue: 'review_passed',
    });
    this.log(`Part 1.4: ${appId} 0.1.0 版本：发布`);
    const publishResp = await request('POST', '/publish', { appid: appId });
    validateResponse(publishResp, 200, `发布 ${appId} 0.1.0 版本`);

    // Part 1.5: 验证线上版本
    const onlineVersionConfigResponse = await request(
      'GET',
      `/config-details?appid=${appId}`
    );
    const onlineVersionConfig = validateResponse(
      onlineVersionConfigResponse,
      200,
      `获取 ${appId} 配置详情 (场景 Part 1.5)`
    );
    const onlineVersion = onlineVersionConfig.online;

    assert(
      onlineVersion && Object.keys(onlineVersion).length > 0,
      `${appId} 线上版本应存在且不为空对象`
    );
    assert(onlineVersion.version === '0.1.0', `${appId} 线上版本应为 0.1.0`);

    // Part 2: 创建第二条草稿 (此时已有已发布版本，应该成功)
    this.log(`Part 2: 为 ${appId} (已有已发布版本) 创建第二条草稿`);
    const secondDraftData = {
      appid: appId,
      templateId: 'tpl_next_002',
      version: '0.2.0',
      extJson: JSON.stringify({ msg: 'Second draft after publish' }),
      platformValue: 'DOUYIN',
      versionDesc: 'Second draft, created after 0.1.0 was published',
    };
    const createSecondResp = await request('POST', '/draft', secondDraftData);
    const secondDraft = validateResponse(
      createSecondResp,
      200,
      '创建第二条草稿'
    );
    assert(secondDraft.version === '0.2.0', '第二条草稿版本应为 0.2.0');
    assert(secondDraft.statusValue === 'draft', '第二条草稿状态应为 draft');
    this.log(`✅ ${appId} 第二条草稿创建成功`);

    // Part 3: (补充) 测试如果当前只有一个 published 的草稿，没有 draft/rejected，创建新草稿
    // (此场景与Part 2类似，createOrUpdateDraft 会创建新的，因为没有可更新的 draft/rejected)
    // 当前 appId 的 0.1.0 是 published，0.2.0 是 draft。
    // 我们将 0.2.0 提交审核，使其不再是 draft 状态。
    this.log(
      `Part 3.1: 将 ${appId} 的 0.2.0 草稿提交审核，使其不再是 'draft' 状态`
    );
    await request('POST', '/submit-review', { appid: appId }); // 0.2.0 变为 pending_review

    this.log(
      `Part 3.2: 为 ${appId} (当前有 published 和 pending_review) 创建第三条草稿 (预期失败)`
    );
    const thirdDraftData = {
      appid: appId,
      templateId: 'tpl_third_003',
      version: '0.3.0',
      extJson: JSON.stringify({ msg: 'Third draft' }),
      platformValue: 'DOUYIN',
      versionDesc: 'Third draft, created while 0.1.0 published, 0.2.0 pending',
    };
    const createThirdResp = await request('POST', '/draft', thirdDraftData);

    // console.log('createThirdResp', createThirdResp); // 保留用户可能添加的日志

    assert(
      createThirdResp.status === 200 && createThirdResp.data.status === 500,
      `创建第三条草稿时应返回业务错误 (状态码 200, 业务码 500), 实际: HTTP ${createThirdResp.status}, Biz ${createThirdResp.data.status}`
    );
    assert(
      createThirdResp.data.message &&
        createThirdResp.data.message.includes('有版本正在审核中'),
      `错误信息应提示有版本正在审核中, 实际: ${createThirdResp.data.message}`
    );
    this.log(`✅ 正确: ${appId} 当有版本审核中时，无法创建新草稿`);

    return { success: true };
  }

  // 运行所有测试
  async runAllTests() {
    console.log('🚀 开始 ExtJson 配置管理完整测试');
    console.log(`📱 测试 AppID: ${JSON.stringify(TEST_APP_IDS)}`);
    console.log(`🌐 API 地址: ${BASE_URL}`);
    console.log('='.repeat(80));

    const scenarios = [
      {
        name: '基础草稿管理流程',
        fn: () => this.testBasicDraftFlow(TEST_APP_IDS.app1),
      },
      {
        name: '审核流程测试',
        fn: () => this.testReviewFlow(TEST_APP_IDS.app1),
      },
      {
        name: '多版本发布和单次回退',
        fn: () => this.testMultiVersionAndSingleRollback(TEST_APP_IDS.app1),
      },
      {
        name: '回退后再发布新版本',
        fn: () => this.testRollbackThenPublish(TEST_APP_IDS.app1),
      },
      {
        name: '连续回退测试',
        fn: () => this.testContinuousRollback(TEST_APP_IDS.app1),
      },
      { name: '多个小程序并行操作', fn: () => this.testMultipleApps() },
      { name: '错误处理测试', fn: () => this.testErrorHandling() },
      {
        name: '统一的草稿创建/更新接口',
        fn: () => this.testUnifiedDraftAPI(TEST_APP_IDS.app2),
      },
      {
        name: 'uploadCode 的 updateDraft 参数',
        fn: () => this.testUploadCodeWithUpdateDraft(TEST_APP_IDS.app2),
      },
      {
        name: '新场景：测试 /bind-template 接口',
        fn: () => this.testBindTemplateAPI(TEST_APP_IDS.app2),
      },
      {
        name: '新场景：测试发布后创建新草稿',
        fn: () => this.testCreateDraftWithPublishedVersion(),
      },
    ];

    let successCount = 0;
    let failCount = 0;

    for (const scenario of scenarios) {
      try {
        await scenario.fn();
        successCount++;
        this.log(`✅ ${scenario.name} - 测试通过`);
      } catch (error) {
        failCount++;
        this.log(`❌ ${scenario.name} - 测试失败: ${error.message}`);
        console.error(error.stack);

        // 遇到错误时中断
        console.error('\n❌ 测试中断！请检查错误信息。');
        process.exit(1);
      }
    }

    // 打印测试总结
    console.log('\n' + '='.repeat(80));
    console.log('📊 测试总结');
    console.log('='.repeat(80));
    console.log(`✅ 成功: ${successCount}`);
    console.log(`❌ 失败: ${failCount}`);
    console.log(`📈 总计: ${scenarios.length}`);

    if (failCount === 0) {
      console.log('\n🎉 所有测试通过！');
    } else {
      console.log('\n❌ 存在失败的测试，请检查日志。');
      process.exit(1);
    }
  }
}

// 主函数
async function main() {
  const tester = new ExtJsonTestScenarios();

  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('💥 测试执行出错:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main();
}

module.exports = { ExtJsonTestScenarios, request };
