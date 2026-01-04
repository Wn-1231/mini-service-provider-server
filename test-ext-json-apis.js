/**
 * ExtJson 接口测试脚本
 * 使用方法：node test-ext-json-apis.js
 */

const https = require("https");
const http = require("http");


// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


// 配置
const CONFIG = {
  baseUrl: "http://127.0.0.1:7080/api/dalaran-nodejs/partner/ext-json",
  testAppId: "tt12345_test_" + Date.now(), // 使用时间戳避免冲突
  headers: {
    "Content-Type": "application/json",
    // 如果需要认证，在这里添加
    // 'Authorization': 'Bearer YOUR_TOKEN',
    // 'X-User-Id': 'test_user',
  },
};

// HTTP 请求工具函数
function makeRequest(method, url, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: CONFIG.headers,
    };

    const req = (urlObj.protocol === "https:" ? https : http).request(
      options,
      res => {
        let body = "";
        res.on("data", chunk => {
          body += chunk;
        });
        res.on("end", () => {
          try {
            const result = {
              status: res.statusCode,
              headers: res.headers,
              data: body ? JSON.parse(body) : null,
            };
            resolve(result);
          } catch (e) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: body,
              parseError: e.message,
            });
          }
        });
      }
    );

    req.on("error", err => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// 测试用例
class ExtJsonApiTester {
  constructor() {
    this.appId = CONFIG.testAppId;
    this.results = [];
  }

  log(message, data = null) {
    console.log(`[${new Date().toISOString()}] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
    console.log("---");
  }

  async test(name, testFn) {
    try {
      this.log(`🧪 开始测试: ${name}`);
      const result = await testFn();
      this.results.push({ name, status: "success", result });
      this.log(`✅ 测试成功: ${name}`, result);
      return result;
    } catch (error) {
      this.results.push({ name, status: "error", error: error.message });
      this.log(`❌ 测试失败: ${name}`, { error: error.message });
      throw error;
    }
  }

  // 1. 创建或更新草稿
  async testCreateDraft() {
    return this.test("创建 ExtJson 草稿", async () => {
      const data = {
        appid: this.appId,
        templateId: "tpl_001",
        version: "1.0.0",
        extJson: JSON.stringify({
          extEnable: true,
          extAppid: this.appId,
          pages: ["pages/index/index"],
          api: "v1",
          test: "test123123",
        }),
        platform: "DOUYIN",
      };

      return await makeRequest("POST", `${CONFIG.baseUrl}/draft`, data);
    });
  }

  // 2. 获取草稿详情
  async testGetDraft() {
    return this.test("获取草稿详情", async () => {
      return await makeRequest(
        "GET",
        `${CONFIG.baseUrl}/draft?appid=${this.appId}`
      );
    });
  }

  // 3. 获取草稿列表
  async testGetDraftList() {
    return this.test("获取草稿列表", async () => {
      const data = {
        status: "draft",
        platform: "DOUYIN",
        offset: 0,
        limit: 20,
      };

      return await makeRequest("POST", `${CONFIG.baseUrl}/draft-list`, data);
    });
  }

  // 4. 提交审核
  async testSubmitReview() {
    await delay(500);
    return this.test("提交草稿审核", async () => {
      const data = {
        appid: this.appId,
      };

      return await makeRequest("POST", `${CONFIG.baseUrl}/submit-review`, data);
    });
  }

  // 5. 审核通过
  async testApproveReview() {
    await delay(500);
    return this.test("审核通过", async () => {
      const data = {
        appid: this.appId,
        status: "review_passed",
      };

      return await makeRequest(
        "POST",
        `${CONFIG.baseUrl}/update-review-status`,
        data
      );
    });
  }

  // 6. 获取当前线上版本
  async testGetOnlineVersion() {
    await delay(500);
    return this.test("获取当前线上版本", async () => {
      return await makeRequest(
        "GET",
        `${CONFIG.baseUrl}/online-version?appid=${this.appId}`
      );
    });
  }

  // 7. 创建第二个版本
  async testCreateSecondVersion() {
    await delay(500);
    return this.test("创建第二个版本", async () => {
      const data = {
        appid: this.appId,
        templateId: "tpl_001",
        version: "1.1.0",
        extJson: JSON.stringify({
          extEnable: true,
          extAppid: this.appId,
          pages: ["pages/index/index", "pages/about/about"],
          api: "v2",
          test: "900980898123",
        }),
        platform: "DOUYIN",
      };

      return await makeRequest("POST", `${CONFIG.baseUrl}/draft`, data);
    });
  }

  // 8. 提交并通过第二个版本
  async testSubmitAndApproveSecondVersion() {
    await delay(500);
    await this.test("提交第二个版本审核", async () => {
      return await makeRequest("POST", `${CONFIG.baseUrl}/submit-review`, {
        appid: this.appId,
      });
    });

    return this.test("通过第二个版本审核", async () => {
      return await makeRequest(
        "POST",
        `${CONFIG.baseUrl}/update-review-status`,
        {
          appid: this.appId,
          status: "review_passed",
        }
      );
    });
  }

  // 9. 获取版本历史
  async testGetVersionHistory() {
    await delay(500);
    return this.test("获取版本历史", async () => {
      const data = {
        appid: this.appId,
        limit: 10,
      };

      return await makeRequest(
        "POST",
        `${CONFIG.baseUrl}/version-history`,
        data
      );
    });
  }

  // 10. 版本回退
  async testRollback() {
    await delay(500);
    return this.test("版本回退", async () => {
      const data = {
        appid: this.appId,
      };

      return await makeRequest("POST", `${CONFIG.baseUrl}/rollback`, data);
    });
  }

  // 11. 获取发布历史
  async testGetReleaseHistory() {
    await delay(500);
    return this.test("获取发布历史", async () => {
      const data = {
        appid: this.appId,
        includeContent: true,
      };

      return await makeRequest(
        "POST",
        `${CONFIG.baseUrl}/release-history`,
        data
      );
    });
  }

  // 12. 再次回退测试
  async testSecondRollback() {
    await delay(500);
    return this.test("再次回退测试", async () => {
      const data = {
        appid: this.appId,
      };

      return await makeRequest("POST", `${CONFIG.baseUrl}/rollback`, data);
    });
  }

  // 13. 删除草稿（清理）
  async testDeleteDraft() {
    await delay(500);
    return this.test("删除草稿", async () => {
      const data = {
        appid: this.appId,
      };

      return await makeRequest("POST", `${CONFIG.baseUrl}/delete-draft`, data);
    });
  }

  // 添加第三个版本的测试方法
  async testCreateThirdVersion() {
    await delay(500);
    return this.test("创建第三个版本", async () => {
      const data = {
        appid: this.appId,
        templateId: "tpl_001",
        version: "1.2.0",
        extJson: JSON.stringify({
          extEnable: true,
          extAppid: this.appId,
          pages: ["pages/index/index", "pages/about/about", "pages/user/user"],
          api: "v3",
          test: "third_version_test",
        }),
        platform: "DOUYIN",
      };

      return await makeRequest("POST", `${CONFIG.baseUrl}/draft`, data);
    });
  }

  // 提交并通过第三个版本
  async testSubmitAndApproveThirdVersion() {
    await delay(500);
    await this.test("提交第三个版本审核", async () => {
      return await makeRequest("POST", `${CONFIG.baseUrl}/submit-review`, {
        appid: this.appId,
      });
    });

    return this.test("通过第三个版本审核", async () => {
      return await makeRequest(
        "POST",
        `${CONFIG.baseUrl}/update-review-status`,
        {
          appid: this.appId,
          status: "review_passed",
        }
      );
    });
  }

  // 运行完整测试流程
  async runFullTest() {
    console.log("🚀 开始 ExtJson 接口完整测试");
    console.log(`📱 测试 AppID: ${this.appId}`);
    console.log(`🌐 API 基础地址: ${CONFIG.baseUrl}`);
    console.log("=".repeat(60));

    try {
      // 第一轮：创建第一个版本
      await this.testCreateDraft();
      await this.testGetDraft();
      await this.testGetDraftList();
      await this.testSubmitReview();
      await this.testApproveReview();
      await this.testGetOnlineVersion();

      // 第二轮：创建第二个版本
      await this.testCreateSecondVersion();
      await this.testSubmitAndApproveSecondVersion();
      await this.testGetOnlineVersion();

      // 第三轮：创建第三个版本
      await this.testCreateThirdVersion();
      await this.testSubmitAndApproveThirdVersion();
      await this.testGetOnlineVersion();

      // 获取版本历史
      await this.testGetVersionHistory();

      // 第一次回退（从v3回退到v2）
      console.log("\n=== 第一次回退（v3 -> v2）===");
      await this.testRollback();
      await this.testGetOnlineVersion();
      await this.testGetReleaseHistory();

      // 第二次回退（从v2回退到v1）
      console.log("\n=== 第二次回退（v2 -> v1）===");
      await this.testRollback();
      await this.testGetOnlineVersion();
      await this.testGetReleaseHistory();

      // 清理
      try {
        await this.testDeleteDraft();
      } catch (e) {
        this.log("⚠️  清理草稿失败（可能没有草稿）");
      }
    } catch (error) {
      this.log("💥 测试流程中断", { error: error.message });
    }

    this.printSummary();
  }

  // 打印测试总结
  printSummary() {
    console.log("\n" + "=".repeat(60));
    console.log("📊 测试总结");
    console.log("=".repeat(60));

    const successful = this.results.filter(r => r.status === "success").length;
    const failed = this.results.filter(r => r.status === "error").length;

    console.log(`✅ 成功: ${successful}`);
    console.log(`❌ 失败: ${failed}`);
    console.log(`📈 总计: ${this.results.length}`);

    if (failed > 0) {
      console.log("\n❌ 失败的测试:");
      this.results
        .filter(r => r.status === "error")
        .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
    }

    console.log("\n🎯 测试完成！");
  }

  // 单独测试某个接口
  async testSingle(testName) {
    const testMethods = {
      "create-draft": () => this.testCreateDraft(),
      "get-draft": () => this.testGetDraft(),
      "draft-list": () => this.testGetDraftList(),
      "submit-review": () => this.testSubmitReview(),
      "approve-review": () => this.testApproveReview(),
      "online-version": () => this.testGetOnlineVersion(),
      "version-history": () => this.testGetVersionHistory(),
      rollback: () => this.testRollback(),
      "release-history": () => this.testGetReleaseHistory(),
      "delete-draft": () => this.testDeleteDraft(),
    };

    if (testMethods[testName]) {
      await testMethods[testName]();
    } else {
      console.log("❌ 未知的测试名称:", testName);
      console.log("可用的测试:", Object.keys(testMethods).join(", "));
    }
  }
}

// 主函数
async function main() {
  const tester = new ExtJsonApiTester();

  // 检查命令行参数
  const args = process.argv.slice(2);

  if (args.length > 0) {
    // 单独测试
    await tester.testSingle(args[0]);
  } else {
    // 完整测试
    await tester.runFullTest();
  }
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = ExtJsonApiTester;
