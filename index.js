/**
 * Qwen2API - 统一入口
 * 
 * 支持: Docker (Express) / Vercel / Netlify
 */

const { handleModels, handleChatCompletions, handleRoot, createExpressStreamHandler, createResponse } = require('./lib/qwen');

// ============================================
// Serverless Handler (Vercel / Netlify)
// ============================================
async function serverlessHandler(req, res) {
  // 处理 CORS preflight
  if (req.method === 'OPTIONS') {
    return res ? res.status(200).end() : createResponse('', 200);
  }
  
  const authHeader = req.headers?.authorization || req.headers?.Authorization || '';
  const path = req.url || req.path || '';
  
  // 模型列表
  if (req.method === 'GET' && path.includes('/v1/models')) {
    const result = await handleModels(authHeader);
    if (res) return res.status(result.statusCode).set(result.headers).send(result.body);
    return result;
  }
  
  // 聊天完成
  if (req.method === 'POST' && path.includes('/v1/chat/completions')) {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const result = await handleChatCompletions(body, authHeader);
    if (res) return res.status(result.statusCode).set(result.headers).send(result.body);
    return result;
  }
  
  // 根路径
  if (req.method === 'GET' && (path === '/' || path.endsWith('/'))) {
    const result = handleRoot();
    if (res) return res.status(200).set(result.headers).send(result.body);
    return result;
  }
  
  // 404
  const notFound = { error: { message: 'Not found', type: 'not_found' } };
  if (res) return res.status(404).json(notFound);
  return createResponse(notFound, 404);
}

// ============================================
// Express Server (Docker / 本地开发)
// ============================================
function startExpressServer() {
  const express = require('express');
  const { getApiTokens } = require('./lib/config');
  
  const app = express();
  app.use(express.json());

  // Token 验证中间件
  function authMiddleware(req, res, next) {
    const tokens = getApiTokens();
    if (tokens.length === 0) return next();
    
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    
    if (!token || !tokens.includes(token)) {
      return res.status(401).json({
        error: { message: 'Incorrect API key provided.', type: 'invalid_request_error', code: 'invalid_api_key' }
      });
    }
    next();
  }

  // 模型列表
  app.get('/v1/models', authMiddleware, async (req, res) => {
    const result = await handleModels(req.headers.authorization);
    res.status(result.statusCode).set(result.headers).send(result.body);
  });

  // 聊天完成 (支持真正的流式)
  app.post('/v1/chat/completions', authMiddleware, async (req, res) => {
    const streamHandler = createExpressStreamHandler(res);
    await handleChatCompletions(req.body, req.headers.authorization, { streamHandler });
  });

  // 根路径
  app.get('/', (req, res) => {
    const result = handleRoot();
    res.status(200).set(result.headers).send(result.body);
  });

  const PORT = process.env.PORT || 8765;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Qwen2API server running on port ${PORT}`);
  }).on('error', (err) => {
    console.error('Server error:', err);
  });
}

// ============================================
// 导出 & 入口判断
// ============================================

module.exports = serverlessHandler;
module.exports.handleModels = handleModels;
module.exports.handleChatCompletions = handleChatCompletions;
module.exports.handleRoot = handleRoot;
module.exports.createResponse = createResponse;

// 判断运行环境
const isVercel = process.env.VERCEL === '1';
const isNetlify = process.env.NETLIFY === 'true';
const isServerless = isVercel || isNetlify;

// 如果不是 serverless 环境，启动 Express 服务器
if (!isServerless && require.main === module) {
  startExpressServer();
}
