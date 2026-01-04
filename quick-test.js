/**
 * ExtJson 配置管理完整测试用例
 * 包含：草稿管理、审核流程、版本发布、版本回退等场景
 * 使用方法：node quick-test.js
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
      extJson: JSON.stringify({
        api: 'v1',
        pages: ['index', 'about'],
        config: { theme: 'light' },
      }),
      platform: 'DOUYIN',
    };

    const createResponse = await request('POST', '/draft', createDraftData);
    const draft = validateResponse(createResponse, 200, '创建草稿');

    // 验证返回数据结构
    assert(draft.appid === appId, '返回的 appid 应与请求一致');
    assert(draft.version === '1.0.0', '返回的版本号应为 1.0.0');
    assert(draft.status === 'draft', '状态应为 draft');
    assert(draft.platform === 'DOUYIN', '平台应为 DOUYIN');
    assert(draft.id, '应返回草稿 ID');

    // 1.2 获取草稿详情
    this.log('1.2 获取草稿详情');
    const getResponse = await request('GET', `/draft?appid=${appId}`);
    const getDraft = validateResponse(getResponse, 200, '获取草稿详情');

    assert(getDraft.appid === appId, '获取的草稿 appid 应正确');
    assert(getDraft.extJson === createDraftData.extJson, 'extJson 内容应一致');

    // 1.3 更新草稿
    this.log('1.3 更新草稿');
    const updateDraftData = {
      ...createDraftData,
      version: '1.0.1',
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
      submitResult.status === 'pending_review',
      '提交后状态应为 pending_review'
    );

    // 2.2 测试审核不通过
    this.log('2.2 测试审核不通过');
    const rejectResponse = await request('POST', '/update-review-status', {
      appid: appId,
      status: 'rejected',
      rejectReason: '测试内容不符合规范',
    });
    const rejectResult = validateResponse(rejectResponse, 200, '审核拒绝');

    assert(rejectResult.status === 'rejected', '状态应为 rejected');

    // 2.3 重新创建草稿并提交
    this.log('2.3 重新创建草稿');
    await request('POST', '/draft', {
      appid: appId,
      templateId: 'tpl_001',
      version: '1.0.2',
      extJson: JSON.stringify({
        api: 'v2',
        pages: ['index', 'about'],
        config: { theme: 'light', optimized: true },
      }),
      platform: 'DOUYIN',
    });

    this.log('2.4 再次提交审核');
    await request('POST', '/submit-review', { appid: appId });

    // 2.5 审核通过
    this.log('2.5 审核通过');
    const approveResponse = await request('POST', '/update-review-status', {
      appid: appId,
      status: 'review_passed',
    });
    const approveResult = validateResponse(approveResponse, 200, '审核通过');

    assert(approveResult.status === 'review_passed', '状态应为 review_passed');

    // 2.6 验证线上版本
    this.log('2.6 验证线上版本');
    const onlineResponse = await request(
      'GET',
      `/online-version?appid=${appId}`
    );
    const onlineVersion = validateResponse(onlineResponse, 200, '获取线上版本');

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
        extJson: JSON.stringify({
          api: `v${i + 3}`,
          pages: ['index', 'about', `feature${i + 1}`],
          version: version,
        }),
        platform: 'DOUYIN',
      });

      // 提交审核
      await request('POST', '/submit-review', { appid: appId });

      // 审核通过
      await request('POST', '/update-review-status', {
        appid: appId,
        status: 'review_passed',
      });

      await delay(500); // 确保时间戳不同
    }

    // 3.2 验证版本历史
    this.log('3.2 验证版本历史');
    const historyResponse = await request('POST', '/version-history', {
      appid: appId,
      limit: 10,
    });
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

    // 3.4 验证当前线上版本
    this.log('3.4 验证回退后的线上版本');
    const currentResponse = await request(
      'GET',
      `/online-version?appid=${appId}`
    );
    const currentVersion = validateResponse(
      currentResponse,
      200,
      '获取当前版本'
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
      extJson: JSON.stringify({
        api: 'v6',
        pages: ['index', 'dashboard', 'settings'],
        features: ['new-ui', 'performance'],
      }),
      platform: 'DOUYIN',
    });

    await request('POST', '/submit-review', { appid: appId });
    await request('POST', '/update-review-status', {
      appid: appId,
      status: 'review_passed',
    });

    // 4.2 验证版本发布历史
    this.log('4.2 验证版本发布历史');
    const releaseHistoryResponse = await request('POST', '/release-history', {
      appid: appId,
      includeContent: true,
    });
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
        extJson: JSON.stringify({
          api: versionInfo.api,
          pages: ['index'],
          feature: versionInfo.feature,
        }),
        platform: 'DOUYIN',
      });

      await request('POST', '/submit-review', { appid: appId });
      await request('POST', '/update-review-status', {
        appid: appId,
        status: 'review_passed',
      });

      await delay(500);
    }

    // 5.2 第一次回退（4.2.0 -> 4.1.0）
    this.log('5.2 第一次回退（4.2.0 -> 4.1.0）');
    const rollback1Response = await request('POST', '/rollback', {
      appid: appId,
    });
    const rollback1 = validateResponse(rollback1Response, 200, '第一次回退');

    assert(rollback1.version === '4.1.0', '第一次回退后应为 4.1.0');
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

    assert(rollback2.version === '4.0.0', '第二次回退后应为 4.0.0');
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
      extJson: JSON.stringify({ api: 'app1_v1', name: 'App1' }),
      platform: 'DOUYIN',
    });
    await request('POST', '/submit-review', { appid: app1 });
    await request('POST', '/update-review-status', {
      appid: app1,
      status: 'review_passed',
    });

    // 6.2 App2 发布版本
    this.log(`6.2 ${app2} 发布版本 1.0.0`);
    await request('POST', '/draft', {
      appid: app2,
      templateId: 'tpl_multi_2',
      version: '1.0.0',
      extJson: JSON.stringify({ api: 'app2_v1', name: 'App2' }),
      platform: 'DOUYIN',
    });
    await request('POST', '/submit-review', { appid: app2 });
    await request('POST', '/update-review-status', {
      appid: app2,
      status: 'review_passed',
    });

    // 6.3 验证两个应用的版本独立
    this.log('6.3 验证两个应用的版本独立');
    const app1VersionResponse = await request(
      'GET',
      `/online-version?appid=${app1}`
    );
    const app1Version = validateResponse(app1VersionResponse, 200, 'App1 版本');

    const app2VersionResponse = await request(
      'GET',
      `/online-version?appid=${app2}`
    );
    const app2Version = validateResponse(app2VersionResponse, 200, 'App2 版本');

    const app1ExtJson = JSON.parse(app1Version.extJson);
    const app2ExtJson = JSON.parse(app2Version.extJson);

    assert(app1ExtJson.name === 'App1', 'App1 的配置应正确');
    assert(app2ExtJson.name === 'App2', 'App2 的配置应正确');
    assert(app1Version.appid !== app2Version.appid, '两个应用的 appid 应不同');

    // 6.4 App1 发布新版本并回退
    this.log('6.4 App1 发布新版本 2.0.0');
    await request('POST', '/draft', {
      appid: app1,
      templateId: 'tpl_multi_1',
      version: '2.0.0',
      extJson: JSON.stringify({ api: 'app1_v2', name: 'App1', upgraded: true }),
      platform: 'DOUYIN',
    });
    await request('POST', '/submit-review', { appid: app1 });
    await request('POST', '/update-review-status', {
      appid: app1,
      status: 'review_passed',
    });

    this.log('6.5 App1 执行回退');
    await request('POST', '/rollback', { appid: app1 });

    // 6.6 验证 App2 不受影响
    this.log('6.6 验证 App2 版本未受影响');
    const app2CheckResponse = await request(
      'GET',
      `/online-version?appid=${app2}`
    );
    const app2Check = validateResponse(app2CheckResponse, 200, 'App2 版本检查');

    assert(app2Check.version === '1.0.0', 'App2 版本应保持不变');
    const app2CheckExtJson = JSON.parse(app2Check.extJson);
    assert(app2CheckExtJson.api === 'app2_v1', 'App2 的配置应保持不变');

    return { success: true };
  }

  // 场景7：错误处理测试
  async testErrorHandling() {
    this.log('\n========== 场景7：错误处理测试 ==========');

    // 7.1 获取不存在的草稿
    this.log('7.1 获取不存在的草稿');
    const notExistResponse = await request('GET', '/draft?appid=not_exist_app');
    assert(notExistResponse.data.status === 500, '应返回错误状态');
    assert(
      notExistResponse.data.message.includes('未找到草稿'),
      '应提示未找到草稿'
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
      platform: 'DOUYIN',
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
