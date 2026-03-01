/**
 * Qwen API 核心业务逻辑
 */

const { v4: uuidv4 } = require('uuid');
const { getBaxiaTokens } = require('./baxia');
const { validateToken, createAuthError } = require('./auth');
const { 
  createResponse, 
  createErrorResponse,
  createChatCompletionResponse,
  createStreamChunk,
  formatStreamData,
  createStreamEnd,
  parseStreamResponse,
  createResponseId
} = require('./response');

/**
 * 获取模型列表
 */
async function handleModels(authHeader) {
  if (!validateToken(authHeader)) {
    return createResponse(createAuthError(), 401);
  }

  try {
    const response = await fetch('https://chat.qwen.ai/api/models', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return createResponse(data);
  } catch (error) {
    console.error('Error fetching models:', error);
    return createErrorResponse('Failed to fetch models', 'api_error', 500);
  }
}

/**
 * 处理聊天请求
 */
async function handleChatCompletions(body, authHeader, options = {}) {
  const { streamHandler } = options;
  
  if (!validateToken(authHeader)) {
    return createResponse(createAuthError(), 401);
  }

  const startTime = Date.now();
  
  try {
    const { model, messages, stream = true } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return createErrorResponse('Messages are required', 'invalid_request_error', 400);
    }

    const actualModel = model || 'qwen3.5-plus';
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    const userContent = lastUserMessage ? lastUserMessage.content : 'hello';
    
    // 获取 baxia tokens
    const { bxUa, bxUmidToken, bxV } = await getBaxiaTokens({ silent: true });
    console.log(`[Step 1] Get baxia tokens: ${Date.now() - startTime}ms`);
    
    // 创建 chat 会话
    const chatId = await createChatSession(actualModel, bxUa, bxUmidToken, bxV);
    console.log(`[Step 2] Create chat session: ${Date.now() - startTime}ms`);
    
    if (!chatId) {
      return createErrorResponse('Failed to create chat session', 'api_error', 500);
    }
    
    // 合并多轮对话
    const combinedContent = combineMessages(messages, userContent);
    
    // 发送聊天请求
    const response = await sendChatRequest(chatId, actualModel, combinedContent, bxUa, bxUmidToken, bxV);
    console.log(`[Step 3] Send chat request: ${Date.now() - startTime}ms`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Chat error:', response.status, errorText);
      return createErrorResponse(errorText, 'api_error', response.status);
    }

    // 生成响应 ID 和时间戳
    const responseId = createResponseId();
    const created = Math.floor(Date.now() / 1000);

    // 如果提供了流处理器，使用它
    if (streamHandler) {
      return streamHandler(response, actualModel, responseId, created, startTime);
    }

    // 默认处理：收集完整响应
    return await handleDefaultResponse(response, actualModel, responseId, created, stream, startTime);
  } catch (error) {
    console.error('Error in chat completions:', error);
    return createErrorResponse(error.message, 'internal_error', 500);
  }
}

/**
 * 创建聊天会话
 */
async function createChatSession(model, bxUa, bxUmidToken, bxV) {
  const createChatBody = {
    title: '新建对话',
    models: [model],
    chat_mode: 'guest',
    chat_type: 't2t',
    timestamp: Date.now(),
    project_id: '',
  };
  
  const createHeaders = {
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    'bx-ua': bxUa,
    'bx-umidtoken': bxUmidToken,
    'bx-v': bxV,
    'Referer': 'https://chat.qwen.ai/c/guest',
    'source': 'web',
    'timezone': new Date().toUTCString(),
    'x-request-id': uuidv4(),
  };
  
  const response = await fetch('https://chat.qwen.ai/api/v2/chats/new', {
    method: 'POST',
    headers: createHeaders,
    body: JSON.stringify(createChatBody),
  });
  
  const data = await response.json();
  return data.success && data.data?.id ? data.data.id : null;
}

/**
 * 合并多轮对话
 */
function combineMessages(messages, userContent) {
  if (messages.length === 1) {
    return userContent;
  }
  
  const historyParts = [];
  for (let i = 0; i < messages.length - 1; i++) {
    const msg = messages[i];
    const roleLabel = msg.role === 'user' ? 'User' : 'Assistant';
    historyParts.push(`[${roleLabel}]: ${msg.content}`);
  }
  
  return historyParts.join('\n\n') + '\n\n[User]: ' + messages[messages.length - 1].content;
}

/**
 * 发送聊天请求
 */
async function sendChatRequest(chatId, model, content, bxUa, bxUmidToken, bxV) {
  const fid = uuidv4();
  const responseFid = uuidv4();
  
  const requestBody = {
    stream: true,
    version: '2.1',
    incremental_output: true,
    chat_id: chatId,
    chat_mode: 'guest',
    model: model,
    parent_id: null,
    messages: [{
      fid: fid,
      parentId: null,
      childrenIds: [responseFid],
      role: 'user',
      content: content,
      user_action: 'chat',
      files: [],
      timestamp: Date.now(),
      models: [model],
      chat_type: 't2t',
      feature_config: {
        thinking_enabled: true,
        output_schema: 'phase',
        research_mode: 'normal',
        auto_thinking: true,
        thinking_format: 'summary',
        auto_search: true,
      },
      extra: { meta: { subChatType: 't2t' } },
      sub_chat_type: 't2t',
      parent_id: null,
    }],
    timestamp: Date.now(),
  };
  
  const headers = {
    'Accept': 'application/json',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'bx-ua': bxUa,
    'bx-umidtoken': bxUmidToken,
    'bx-v': bxV,
    'Content-Type': 'application/json',
    'sec-ch-ua': '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'source': 'web',
    'version': '0.2.9',
    'timezone': new Date().toUTCString(),
    'x-accel-buffering': 'no',
    'x-request-id': uuidv4(),
    'Cookie': '',
    'Referer': 'https://chat.qwen.ai/c/guest',
  };
  
  return fetch(`https://chat.qwen.ai/api/v2/chat/completions?chat_id=${chatId}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });
}

/**
 * 默认响应处理
 */
async function handleDefaultResponse(response, model, responseId, created, stream, startTime) {
  const reader = response.body.getReader();
  const contentChunks = await parseStreamResponse(reader);
  
  console.log(`[Done] Total time: ${Date.now() - startTime}ms`);

  if (stream) {
    // 构建模拟流式响应
    const streamBody = contentChunks.map((content, i) => {
      const chunk = createStreamChunk(
        content, 
        model, 
        responseId, 
        created, 
        i === contentChunks.length - 1 ? 'stop' : null
      );
      return formatStreamData(chunk);
    }).join('') + createStreamEnd();
    
    return createResponse(streamBody, 200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache'
    });
  }
  
  // 非流式响应
  const fullContent = contentChunks.join('');
  return createResponse(createChatCompletionResponse(fullContent, model));
}

/**
 * 创建流式处理器 (用于 Express)
 */
function createExpressStreamHandler(res) {
  return async (response, model, responseId, created, startTime) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log(`[Done] Total time: ${Date.now() - startTime}ms`);
        break;
      }
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') {
          res.write(createStreamEnd());
          continue;
        }
        
        try {
          const parsed = JSON.parse(data);
          if (parsed.choices && parsed.choices[0]?.delta?.content) {
            const chunk = createStreamChunk(
              parsed.choices[0].delta.content,
              model,
              responseId,
              created,
              parsed.choices[0].finish_reason
            );
            res.write(formatStreamData(chunk));
          }
        } catch (e) {}
      }
    }
    
    res.write(createStreamEnd());
    res.end();
  };
}

/**
 * 根路径响应
 */
function handleRoot() {
  const html = '<html>\n<head><title>200 OK</title></head>\n<body>\n<center><h1>200 OK</h1></center>\n<hr><center>nginx</center>\n</body>\n</html>\n';
  return createResponse(html, 200, { 'Content-Type': 'text/html' });
}

module.exports = {
  handleModels,
  handleChatCompletions,
  handleRoot,
  createExpressStreamHandler,
  createResponse,
};
