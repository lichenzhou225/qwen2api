/**
 * Qwen2API - 统一入口
 * 
 * 支持: Docker (Express) / Vercel / Netlify
 */

const { handleModels, handleChatCompletions, handleChatCompletionsWithLogs, handleRoot, handleChatPage, createResponse, validateToken, uuidv4 } = require('./core.js');

function logRequestPathBegin(runtime, path) {
  console.log(`[qwen2api][${runtime}][request.begin] path=${path}`);
}

function isHuggingFaceRuntime() {
  const hasPrimarySpaceId = Boolean(process.env.SPACE_ID);
  const hasAuthorRepo = Boolean(process.env.SPACE_AUTHOR_NAME && process.env.SPACE_REPO_NAME);
  const hasCreatorId = Boolean(process.env.SPACES_CREATOR_USER_ID);
  return Boolean(
    hasPrimarySpaceId ||
    hasAuthorRepo ||
    hasCreatorId ||
    process.env.HF_SPACE_ID ||
    process.env.HF_HOME ||
    process.env.HUGGINGFACE_SPACE_ID
  );
}

function patchDnsForHuggingFace() {
  if (!isHuggingFaceRuntime()) return;
  if (process.platform !== 'linux') return;

  const fs = require('fs');
  const resolvPath = '/etc/resolv.conf';
  const backupPath = '/etc/resolv.conf.bak';

  try {
    if (!fs.existsSync(resolvPath)) {
      console.log('[qwen2api][startup][dns] /etc/resolv.conf 不存在，跳过');
      return;
    }

    const stat = fs.lstatSync(resolvPath);
    if (!stat.isFile()) {
      console.log('[qwen2api][startup][dns] /etc/resolv.conf 非普通文件，跳过');
      return;
    }

    const original = fs.readFileSync(resolvPath, 'utf8');
    if (!fs.existsSync(backupPath)) {
      fs.writeFileSync(backupPath, original, 'utf8');
      console.log('✅ 已备份 /etc/resolv.conf 到 /etc/resolv.conf.bak');
    }

    let resolvContent = original;
    let changed = false;

    if (!/\b8\.8\.8\.8\b/.test(resolvContent)) {
      resolvContent = `nameserver 8.8.8.8\n${resolvContent}`;
      changed = true;
      console.log('✅ 已添加 DNS 8.8.8.8');
    }

    if (!/\b8\.8\.4\.4\b/.test(resolvContent)) {
      const lines = resolvContent.split(/\r?\n/);
      lines.splice(1, 0, 'nameserver 8.8.4.4');
      resolvContent = lines.join('\n');
      changed = true;
      console.log('✅ 已添加 DNS 8.8.4.4');
    }

    if (!changed) {
      console.log('[qwen2api][startup][dns] DNS 已包含 8.8.8.8 / 8.8.4.4，无需修改');
      return;
    }

    if (!resolvContent.endsWith('\n')) {
      resolvContent += '\n';
    }

    fs.writeFileSync(resolvPath, resolvContent, 'utf8');
  } catch (err) {
    console.log(`[qwen2api][startup][dns] 跳过 DNS 配置: ${err && err.message ? err.message : String(err)}`);
  }
}

// ============================================
// Express Stream Handler
// ============================================

function createExpressStreamHandler(res) {
  return async (response, model, responseId, created) => {
    const rawFlag = process.env.CHAT_DETAIL_LOG || '';
    const debugEnabled = ['1', 'true', 'yes', 'on'].includes(String(rawFlag).toLowerCase());
    let hasStreamContent = false;

    const writeStreamContent = (content) => {
      if (!debugEnabled || !content) return;
      hasStreamContent = true;
      process.stdout.write(content);
    };

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    
    const reader = response.body?.getReader ? response.body.getReader() : null;
    const decoder = new TextDecoder();
    let buffer = '';
    let doneWritten = false;

    try {
      if (!reader) {
        throw new Error('Upstream response has no readable body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trimStart();
          if (!trimmed.startsWith('data:')) continue;
          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') {
            res.write('data: [DONE]\n\n');
            doneWritten = true;
            continue;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed?.error) {
              const errObj = typeof parsed.error === 'string'
                ? { error: { message: parsed.error, type: 'api_error' } }
                : { error: parsed.error };
              res.write(`data: ${JSON.stringify(errObj)}\n\n`);
              continue;
            }

            const delta = parsed?.choices?.[0]?.delta;
            if (delta && typeof delta === 'object') {
              if (typeof delta.content === 'string' && delta.content) {
                writeStreamContent(delta.content);
              }
              const chunk = {
                id: responseId,
                object: 'chat.completion.chunk',
                created,
                model,
                choices: [{
                  index: 0,
                  delta: {
                    ...(typeof delta.role === 'string' ? { role: delta.role } : {}),
                    ...(typeof delta.content === 'string' ? { content: delta.content } : {}),
                  },
                  finish_reason: parsed?.choices?.[0]?.finish_reason || null,
                }],
              };
              res.write(`data: ${JSON.stringify(chunk)}\n\n`);
            }
          } catch {}
        }
      }
    } catch (err) {
      if (!res.writableEnded) {
        const message = err && err.message ? err.message : 'stream proxy error';
        res.write(`data: ${JSON.stringify({ error: { message, type: 'api_error' } })}\n\n`);
      }
    } finally {
      if (!doneWritten && !res.writableEnded) {
        res.write('data: [DONE]\n\n');
      }
      if (!res.writableEnded) {
        res.end();
      }
    }

    if (debugEnabled && hasStreamContent) {
      process.stdout.write('\n');
      console.log('[qwen2api][express][stream] 输出完毕');
    }
  };
}

// 带日志流式返回的 Express Handler
function createExpressLogStreamHandler(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  const streamWriter = {
    write: (data) => {
      if (!res.writableEnded) {
        res.write(data);
      }
    },
    log: (logData) => {
      if (!res.writableEnded) {
        res.write(`event: log\n`);
        res.write(`data: ${logData}\n\n`);
      }
    },
    end: () => {
      if (!res.writableEnded) {
        res.end();
      }
    }
  };

  return streamWriter;
}

// ============================================
// Serverless Handler (Vercel / Netlify)
// ============================================

async function serverlessHandler(req, res) {
  if (req.method === 'OPTIONS') {
    if (res) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      return res.status(200).end();
    }
    return createResponse('', 200);
  }
  
  const authHeader = req.headers?.authorization || req.headers?.Authorization || '';
  const path = req.url || req.path || '';
  let pathname = path;
  try {
    pathname = new URL(path, 'http://localhost').pathname;
  } catch {}

  const netlifyFnPrefix = '/.netlify/functions/api';
  const apiPrefix = '/api';
  const strippedFnPath = pathname === netlifyFnPrefix
    ? '/'
    : (pathname.startsWith(netlifyFnPrefix + '/') ? pathname.slice(netlifyFnPrefix.length) : pathname);
  const normalizedPathname = strippedFnPath === apiPrefix
    ? '/'
    : (strippedFnPath.startsWith(apiPrefix + '/') ? strippedFnPath.slice(apiPrefix.length) : strippedFnPath);

  if (req.method === 'GET' && normalizedPathname === '/v1/models') {
    const result = await handleModels(authHeader);
    if (res) return res.status(result.statusCode).set(result.headers).send(result.body);
    return result;
  }

  if (req.method === 'POST' && normalizedPathname === '/v1/chat/completions/log') {
    logRequestPathBegin('serverless', normalizedPathname);
    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    } catch {
      const bad = createResponse({ error: { message: 'Invalid JSON body.', type: 'invalid_request_error' } }, 400);
      if (res) return res.status(bad.statusCode).set(bad.headers).send(bad.body);
      return bad;
    }
    const result = await handleChatCompletionsWithLogs(body, authHeader);
    if (res) {
      if (result && result.body && result.headers && String(result.headers['Content-Type'] || '').indexOf('text/event-stream') === 0) {
        res.status(result.statusCode).set(result.headers).send(result.body);
        return;
      }
      return res.status(result.statusCode).set(result.headers).send(result.body);
    }
    return result;
  }

  if (req.method === 'POST' && normalizedPathname === '/v1/chat/completions') {
    logRequestPathBegin('serverless', normalizedPathname);
    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    } catch {
      const bad = createResponse({ error: { message: 'Invalid JSON body.', type: 'invalid_request_error' } }, 400);
      if (res) return res.status(bad.statusCode).set(bad.headers).send(bad.body);
      return bad;
    }
    const result = await handleChatCompletions(body, authHeader);
    if (res) {
      if (result && result.body && result.headers && String(result.headers['Content-Type'] || '').indexOf('text/event-stream') === 0) {
        res.status(result.statusCode).set(result.headers).send(result.body);
        return;
      }
      return res.status(result.statusCode).set(result.headers).send(result.body);
    }
    return result;
  }

  if (req.method === 'GET' && (normalizedPathname === '/chat' || normalizedPathname === '/chat/')) {
    const result = handleChatPage();
    if (res) return res.status(200).set(result.headers).send(result.body);
    return result;
  }

  if (req.method === 'GET' && normalizedPathname === '/') {
    const result = handleRoot();
    if (res) return res.status(200).set(result.headers).send(result.body);
    return result;
  }
  
  return res ? res.status(404).json({ error: { message: 'Not found', type: 'invalid_request_error' } }) : createResponse({ error: { message: 'Not found', type: 'invalid_request_error' } }, 404);
}

// ============================================
// Express Server (Docker / 本地开发)
// ============================================

function startExpressServer() {
  patchDnsForHuggingFace();

  const express = require('express');
  const app = express();
  const jsonLimit = process.env.JSON_BODY_LIMIT || '100mb';

  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    next();
  });

  app.use(express.json({ limit: jsonLimit }));

  app.use((error, req, res, next) => {
    if (!error) return next();
    if (error.type === 'entity.too.large' || error.status === 413) {
      return res.status(413).json({
        error: {
          message: `Payload too large. Current JSON body limit is ${jsonLimit}. You can increase it with JSON_BODY_LIMIT.`,
          type: 'invalid_request_error',
        },
      });
    }
    if (error.type === 'entity.parse.failed' || error.status === 400) {
      return res.status(400).json({
        error: {
          message: 'Invalid JSON body.',
          type: 'invalid_request_error',
        },
      });
    }
    return next(error);
  });

  // Token 验证中间件
  function authMiddleware(req, res, next) {
    if (!validateToken(req.headers.authorization)) {
      return res.status(401).json({ error: { message: 'Incorrect API key provided.', type: 'invalid_request_error' } });
    }
    next();
  }

  app.get('/v1/models', authMiddleware, async (req, res) => {
    const result = await handleModels(req.headers.authorization);
    res.status(result.statusCode).set(result.headers).send(result.body);
  });

  app.post('/v1/chat/completions', authMiddleware, async (req, res) => {
    logRequestPathBegin('express', req.path || '/v1/chat/completions');
    const result = await handleChatCompletions(req.body, req.headers.authorization, null, createExpressStreamHandler(res));
    if (result && typeof result.statusCode === 'number') {
      res.status(result.statusCode).set(result.headers).send(result.body);
    }
  });

  app.post('/v1/chat/completions/log', authMiddleware, async (req, res) => {
    logRequestPathBegin('express', req.path || '/v1/chat/completions/log');
    const result = await handleChatCompletionsWithLogs(req.body, req.headers.authorization, null, createExpressLogStreamHandler(res));
    if (res.headersSent) {
      if (!res.writableEnded && result && typeof result.statusCode === 'number') {
        let payload = { error: { message: `HTTP ${result.statusCode}`, type: 'api_error' } };
        try {
          const parsed = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
          if (parsed && parsed.error) {
            payload = parsed;
          }
        } catch {}
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      }
      return;
    }
    if (result && typeof result.statusCode === 'number') {
      res.status(result.statusCode).set(result.headers).send(result.body);
    }
  });

  app.get('/', (req, res) => {
    const result = handleRoot();
    res.status(200).set(result.headers).send(result.body);
  });

  app.get('/chat', (req, res) => {
    const result = handleChatPage();
    res.status(200).set(result.headers).send(result.body);
  });

  app.get('/chat/', (req, res) => {
    const result = handleChatPage();
    res.status(200).set(result.headers).send(result.body);
  });

  const PORT = process.env.PORT || 8765;
  app.listen(PORT, '0.0.0.0', () => console.log(`Qwen2API server running on port ${PORT}`));
}

// ============================================
// 导出 & 入口判断
// ============================================

module.exports = serverlessHandler;
module.exports.handleModels = handleModels;
module.exports.handleChatCompletions = handleChatCompletions;
module.exports.handleChatCompletionsWithLogs = handleChatCompletionsWithLogs;
module.exports.handleRoot = handleRoot;
module.exports.createResponse = createResponse;

const isServerless = process.env.VERCEL === '1' || process.env.NETLIFY === 'true';
if (!isServerless && require.main === module) {
  startExpressServer();
}
