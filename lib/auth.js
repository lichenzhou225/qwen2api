/**
 * 认证模块
 */

const { getApiTokens } = require('./config');

/**
 * Token 验证 (OpenAI 兼容格式: Authorization: Bearer <token>)
 */
function validateToken(authHeader) {
  const tokens = getApiTokens();
  
  // 如果没有配置 token，跳过验证
  if (tokens.length === 0) {
    return true;
  }
  
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7).trim() 
    : '';
  
  return tokens.includes(token);
}

/**
 * 创建认证错误响应
 */
function createAuthError() {
  return {
    error: {
      message: 'Incorrect API key provided. You can find your API key at https://platform.openai.com/account/api-keys.',
      type: 'invalid_request_error',
      param: null,
      code: 'invalid_api_key'
    }
  };
}

module.exports = {
  validateToken,
  createAuthError,
};
