/**
 * OpenAI API 兼容的响应格式化模块
 */

const { v4: uuidv4 } = require('uuid');

/**
 * 创建标准 JSON 响应
 */
function createResponse(body, status = 200, headers = {}) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      ...headers,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  };
}

/**
 * 创建错误响应
 */
function createErrorResponse(message, type = 'api_error', status = 500) {
  return createResponse({
    error: { message, type }
  }, status);
}

/**
 * 创建 OpenAI 格式的聊天完成响应
 */
function createChatCompletionResponse(content, model) {
  return {
    id: `chatcmpl-${uuidv4()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: model,
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: content,
      },
      finish_reason: 'stop',
    }],
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  };
}

/**
 * 创建 OpenAI 格式的流式响应块
 */
function createStreamChunk(content, model, responseId, created, finishReason = null) {
  return {
    id: responseId,
    object: 'chat.completion.chunk',
    created: created,
    model: model,
    choices: [{
      index: 0,
      delta: content ? { content } : {},
      finish_reason: finishReason,
    }],
  };
}

/**
 * 格式化流式响应数据
 */
function formatStreamData(chunk) {
  return `data: ${JSON.stringify(chunk)}\n\n`;
}

/**
 * 创建流式结束标记
 */
function createStreamEnd() {
  return 'data: [DONE]\n\n';
}

/**
 * 解析 Qwen API 的流式响应
 */
async function parseStreamResponse(reader, onChunk) {
  const decoder = new TextDecoder();
  let buffer = '';
  let contentChunks = [];
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;
      
      try {
        const parsed = JSON.parse(data);
        if (parsed.choices && parsed.choices[0]?.delta?.content) {
          const content = parsed.choices[0].delta.content;
          contentChunks.push(content);
          if (onChunk) await onChunk(content, parsed.choices[0].finish_reason);
        }
      } catch (e) {}
    }
  }
  
  return contentChunks;
}

/**
 * 创建响应 ID
 */
function createResponseId() {
  return `chatcmpl-${uuidv4()}`;
}

module.exports = {
  createResponse,
  createErrorResponse,
  createChatCompletionResponse,
  createStreamChunk,
  formatStreamData,
  createStreamEnd,
  parseStreamResponse,
  createResponseId,
};
