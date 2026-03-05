//
// LLM API 调用处理器
//

const { ipcMain, net } = require('electron');

// API 配置
const API_CONFIGS = {
  deepseek: {
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat'
  },
  doubao: {
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    defaultModel: 'doubao-pro-4k'
  },
  qianwen: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-turbo'
  }
};

// 初始化 API IPC
function initApiIPC() {
  // 测试 API 连接
  ipcMain.handle('api:testConnection', async (event, provider, apiKey, model) => {
    try {
      const config = getApiConfig(provider);
      const url = `${config.baseUrl}/chat/completions`;

      const response = await makeApiRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model || config.defaultModel,
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10
        })
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorText = await response.text();
        return { success: false, error: errorText };
      }
    } catch (error) {
      console.error('测试连接失败:', error);
      return { success: false, error: error.message };
    }
  });

  // 调用 LLM API
  ipcMain.handle('api:callLlm', async (event, provider, apiKey, model, prompt) => {
    try {
      const config = getApiConfig(provider);
      const url = `${config.baseUrl}/chat/completions`;

      const response = await makeApiRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model || config.defaultModel,
          messages: [
            {
              role: 'system',
              content: 'You are a professional storyboard script assistant. Generate structured JSON data only, no other text.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 4000
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          content: data.choices[0].message.content
        };
      } else {
        const errorText = await response.text();
        return { success: false, error: errorText };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

// 获取 API 配置
function getApiConfig(provider) {
  return API_CONFIGS[provider] || API_CONFIGS.deepseek;
}

// 发起 HTTP 请求
function makeApiRequest(url, options) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';

    const request = net.request({
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    });

    let responseData = '';

    request.on('response', (response) => {
      response.on('data', (chunk) => {
        responseData += chunk.toString();
      });

      response.on('end', () => {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve({
            ok: true,
            status: response.statusCode,
            json: () => Promise.resolve(JSON.parse(responseData)),
            text: () => Promise.resolve(responseData)
          });
        } else {
          resolve({
            ok: false,
            status: response.statusCode,
            text: () => Promise.resolve(responseData)
          });
        }
      });
    });

    request.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      request.write(options.body);
    }

    request.end();
  });
}

module.exports = { initApiIPC };
