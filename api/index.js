/**
 * Vercel / Node.js Serverless 入口
 */

const { handleModels, handleChatCompletions, handleRoot, createResponse } = require('../core.js');

module.exports = async function handler(req, res) {
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
  return res ? res.status(404).json({ error: { message: 'Not found' } }) : createResponse({ error: { message: 'Not found' } }, 404);
};
