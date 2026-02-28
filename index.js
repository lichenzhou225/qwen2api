const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

// Qwen API 基础 URL - 使用公开的代理服务
const QWEN_BASE_URL = 'https://qwen.aikit.club';

// Auth Token (从 chat.qwen.ai 的 localStorage 获取，cookie 中的 token 值)
const AUTH_TOKEN = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjhkMTE4ZjI3LWFlNzItNDBhZC05YjIwLTY0MWMzZDAxMWVkMiIsImxhc3RfcGFzc3dvcmRfY2hhbmdlIjoxNzcyMzA0MjExLCJleHAiOjE3NzQ4OTY2NDB9.hCR1c8MfUWyIbNtrvON8jA80CyAExabdCCZDvkL_mRA`;

// 默认模型映射
const MODEL_MAP = {
  'gpt-4o': 'qwen2.5-max',
  'gpt-4o-mini': 'qwen2.5-turbo',
  'gpt-4': 'qwen2.5-max',
  'gpt-3.5-turbo': 'qwen2.5-turbo',
  'claude-3-opus': 'qwen2.5-max',
  'claude-3-sonnet': 'qwen2.5-plus',
  'claude-3-haiku': 'qwen2.5-turbo',
};

// 模型别名映射 - 直接使用代理服务支持的模型名称
// 代理服务 (qwen.aikit.club) 支持的模型：
// qwen3.5-plus, qwen3.5-flash, qwen3.5-397b-a17b, qwen3.5-122b-a10b,
// qwen3.5-27b, qwen3.5-35b-a3b, qwen-max-latest, qwq-32b 等
const MODEL_ALIAS = {
  // Qwen3.5 系列 - 直接使用
  'qwen3.5-plus': 'qwen3.5-plus',
  'qwen3.5-flash': 'qwen3.5-flash',
  'qwen3.5-397b-a17b': 'qwen3.5-397b-a17b',
  'qwen3.5-122b-a10b': 'qwen3.5-122b-a10b',
  'qwen3.5-27b': 'qwen3.5-27b',
  'qwen3.5-35b-a3b': 'qwen3.5-35b-a3b',
  
  // Qwen Max 系列
  'qwen-max-latest': 'qwen-max-latest',
  'qwen-max': 'qwen-max-latest',
  
  // Qwen2.5 系列 (如果代理支持)
  'qwen2.5-max': 'qwen-max-latest',
  'qwen2.5-plus': 'qwen3.5-plus',
  'qwen2.5-turbo': 'qwen3.5-flash',
  'qwen-plus': 'qwen3.5-plus',
  'qwen-turbo': 'qwen3.5-flash',
  
  // Qwen3 系列
  'qwen3-max': 'qwen-max-latest',
  
  // 特殊模型
  'qwq-32b': 'qwq-32b',
  'qwen-deep-research': 'qwen-deep-research',
  'qvq-max': 'qvq-max',
  'qwen-web-dev': 'qwen-web-dev',
  'qwen-full-stack': 'qwen-full-stack',
  'qwen3-coder-plus': 'qwen3-coder-plus',
};

// 默认请求头
function getDefaultHeaders() {
  return {
    'accept': 'application/json',
    'authorization': `Bearer ${AUTH_TOKEN}`,
    'content-type': 'application/json',
  };
}

// 获取实际模型名称
function getModelName(model) {
  // 先检查别名映射
  if (MODEL_ALIAS[model]) return MODEL_ALIAS[model];
  // 再检查 OpenAI 模型映射
  if (MODEL_MAP[model]) return MODEL_MAP[model];
  // 如果没有映射，直接返回原模型名（让代理服务处理）
  return model;
}

// OpenAI 格式的模型列表 API
app.get('/v1/models', async (req, res) => {
  try {
    const response = await fetch(`${QWEN_BASE_URL}/v1/models`, {
      method: 'GET',
      headers: getDefaultHeaders(),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ 
      error: {
        message: 'Failed to fetch models',
        type: 'api_error',
        code: 'models_fetch_failed'
      }
    });
  }
});

// Token 验证接口
app.get('/v1/validate', async (req, res) => {
  try {
    const response = await fetch(`${QWEN_BASE_URL}/v1/validate?token=${AUTH_TOKEN}`, {
      method: 'GET',
      headers: getDefaultHeaders(),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error validating token:', error);
    res.status(500).json({ 
      error: {
        message: 'Failed to validate token',
        type: 'api_error',
        code: 'validate_failed'
      }
    });
  }
});

// OpenAI 格式的聊天完成 API
app.post('/v1/chat/completions', async (req, res) => {
  try {
    const { model, messages, stream = false, temperature, max_tokens, tools, enable_thinking, thinking_budget } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ 
        error: {
          message: 'Messages are required',
          type: 'invalid_request_error',
          code: 'missing_messages'
        }
      });
    }

    const actualModel = getModelName(model);

    // 构建请求体
    const requestBody = {
      model: actualModel,
      messages: messages.map(msg => {
        // 处理消息内容
        if (typeof msg.content === 'string') {
          return { role: msg.role, content: msg.content };
        } else if (Array.isArray(msg.content)) {
          // 多模态内容（图片、文件等）
          return { role: msg.role, content: msg.content };
        }
        return msg;
      }),
      stream: stream,
    };

    // 添加可选参数
    if (temperature !== undefined) requestBody.temperature = temperature;
    if (max_tokens !== undefined) requestBody.max_tokens = max_tokens;
    if (tools !== undefined) requestBody.tools = tools;
    if (enable_thinking !== undefined) requestBody.enable_thinking = enable_thinking;
    if (thinking_budget !== undefined) requestBody.thinking_budget = thinking_budget;

    console.log(`Sending request to Qwen API: model=${actualModel}, stream=${stream}`);

    const response = await fetch(`${QWEN_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: getDefaultHeaders(),
      body: JSON.stringify(requestBody),
    });

    const contentType = response.headers.get('content-type') || '';
    console.log(`Qwen API response status: ${response.status}, content-type: ${contentType}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Qwen API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: {
          message: `Qwen API error: ${response.status} - ${errorText}`,
          type: 'api_error',
          code: 'upstream_error'
        }
      });
    }

    // 流式响应
    if (stream && contentType.includes('text/event-stream')) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          res.write(chunk);
        }
      } finally {
        reader.releaseLock();
        res.end();
      }
    } else {
      // 非流式响应
      const data = await response.json();
      res.json(data);
    }
  } catch (error) {
    console.error('Error in chat completions:', error);
    res.status(500).json({ 
      error: {
        message: error.message,
        type: 'internal_error',
        code: 'internal_error'
      }
    });
  }
});

// 图片生成 API
app.post('/v1/images/generations', async (req, res) => {
  try {
    const { prompt, size = '1024x1024' } = req.body;

    if (!prompt) {
      return res.status(400).json({ 
        error: {
          message: 'Prompt is required',
          type: 'invalid_request_error',
          code: 'missing_prompt'
        }
      });
    }

    const response = await fetch(`${QWEN_BASE_URL}/v1/images/generations`, {
      method: 'POST',
      headers: getDefaultHeaders(),
      body: JSON.stringify({ prompt, size }),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error in image generation:', error);
    res.status(500).json({ 
      error: {
        message: error.message,
        type: 'internal_error',
        code: 'internal_error'
      }
    });
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: 'Qwen to OpenAI API Proxy',
    version: '2.0.0',
    backend: 'Using qwen.aikit.club proxy',
    endpoints: {
      models: '/v1/models',
      chat: '/v1/chat/completions',
      images: '/v1/images/generations',
      validate: '/v1/validate',
    },
    supported_models: [
      'qwen-max-latest', 'qwen2.5-max', 'qwen2.5-plus', 'qwen2.5-turbo',
      'qwq-32b', 'qwen3-max', 'qwen-deep-research', 'qvq-max',
      'qwen-web-dev', 'qwen-full-stack', 'qwen3-coder-plus'
    ],
    model_aliases: MODEL_MAP,
  });
});

const PORT = process.env.PORT || 8765;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Qwen2API server running on port ${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/v1/chat/completions`);
  console.log(`Server started at: ${new Date().toISOString()}`);
}).on('error', (err) => {
  console.error('Server error:', err);
});