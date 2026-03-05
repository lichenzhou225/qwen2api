/**
 * Netlify Functions 入口
 */

const { handleModels, handleChatCompletions, handleChatCompletionsWithLogs, handleRoot, handleChatPage, createResponse } = require('../../core.js');

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: ''
    };
  }

  const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
  const path = event.path || '';
  const pathname = typeof path === 'string' ? path.split('?')[0] : '';
  const bodySource = (event.isBase64Encoded && typeof event.body === 'string')
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;
  const fnPrefix = '/.netlify/functions/api';
  const apiPrefix = '/api';
  const strippedFnPath = pathname === fnPrefix
    ? '/'
    : (pathname.startsWith(fnPrefix + '/') ? pathname.slice(fnPrefix.length) : pathname);
  const normalizedPathname = strippedFnPath === apiPrefix
    ? '/'
    : (strippedFnPath.startsWith(apiPrefix + '/') ? strippedFnPath.slice(apiPrefix.length) : strippedFnPath);

  if (event.httpMethod === 'GET' && normalizedPathname === '/v1/models') {
    return handleModels(authHeader);
  }
  if (event.httpMethod === 'POST' && normalizedPathname === '/v1/chat/completions/log') {
    let body;
    try {
      body = typeof bodySource === 'string' ? JSON.parse(bodySource) : (bodySource || {});
    } catch {
      return createResponse({ error: { message: 'Invalid JSON body.', type: 'invalid_request_error' } }, 400);
    }
    return handleChatCompletionsWithLogs(body, authHeader);
  }
  if (event.httpMethod === 'POST' && normalizedPathname === '/v1/chat/completions') {
    let body;
    try {
      body = typeof bodySource === 'string' ? JSON.parse(bodySource) : (bodySource || {});
    } catch {
      return createResponse({ error: { message: 'Invalid JSON body.', type: 'invalid_request_error' } }, 400);
    }
    return handleChatCompletions(body, authHeader);
  }
  if (event.httpMethod === 'GET' && (normalizedPathname === '/' || normalizedPathname === '')) {
    return handleRoot();
  }
  if (event.httpMethod === 'GET' && (normalizedPathname === '/chat' || normalizedPathname === '/chat/')) {
    return handleChatPage();
  }
  
  return createResponse({ error: { message: 'Not found', type: 'invalid_request_error' } }, 404);
};
