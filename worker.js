import chatHtml from './chat.html';

/**
 * Cloudflare Workers 入口
 * 
 * 使用方法:
 * 1. 安装 wrangler: npm install -g wrangler
 * 2. 登录: wrangler login
 * 3. 部署: wrangler deploy
 */

// ============================================
// Baxia Token 生成 (CF Worker 内联版本)
// ============================================

const BAXIA_VERSION = '2.5.36';

function randomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  const randomBytes = new Uint8Array(length);
  crypto.getRandomValues(randomBytes);
  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  return result;
}

function generateWebGLFingerprint() {
  const renderers = [
    'ANGLE (Intel, Intel(R) UHD Graphics 630, OpenGL 4.6)',
    'ANGLE (NVIDIA, NVIDIA GeForce GTX 1080, OpenGL 4.6)',
    'ANGLE (AMD, AMD Radeon RX 580, OpenGL 4.6)',
  ];
  return { renderer: renderers[Math.floor(Math.random() * renderers.length)], vendor: 'Google Inc. (Intel)' };
}

async function generateCanvasFingerprint() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  const hashArray = new Uint8Array(hashBuffer);
  return btoa(String.fromCharCode(...hashArray)).substring(0, 32);
}

async function collectFingerprintData() {
  const platforms = ['Win32', 'Linux x86_64', 'MacIntel'];
  const languages = ['en-US', 'zh-CN', 'en-GB'];
  const canvas = await generateCanvasFingerprint();
  
  return {
    p: platforms[Math.floor(Math.random() * platforms.length)],
    l: languages[Math.floor(Math.random() * languages.length)],
    hc: 4 + Math.floor(Math.random() * 12),
    dm: [4, 8, 16, 32][Math.floor(Math.random() * 4)],
    to: [-480, -300, 0, 60, 480][Math.floor(Math.random() * 5)],
    sw: 1920 + Math.floor(Math.random() * 200),
    sh: 1080 + Math.floor(Math.random() * 100),
    cd: 24,
    pr: [1, 1.25, 1.5, 2][Math.floor(Math.random() * 4)],
    wf: generateWebGLFingerprint().renderer.substring(0, 20),
    cf: canvas,
    af: (124.04347527516074 + Math.random() * 0.001).toFixed(14),
    ts: Date.now(),
    r: Math.random(),
  };
}

function encodeBaxiaToken(data) {
  return `${BAXIA_VERSION.replace(/\./g, '')}!${btoa(unescape(encodeURIComponent(JSON.stringify(data))))}`;
}

async function getBaxiaTokens() {
  const bxUa = encodeBaxiaToken(await collectFingerprintData());
  let bxUmidToken;
  try {
    const resp = await fetch('https://sg-wum.alibaba.com/w/wu.json', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    bxUmidToken = resp.headers.get('etag') || 'T2gA' + randomString(40);
  } catch { bxUmidToken = 'T2gA' + randomString(40); }
  return { bxUa, bxUmidToken, bxV: BAXIA_VERSION };
}

// ============================================
// UUID 生成
// ============================================

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// ============================================
// 响应工具
// ============================================

function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', ...extraHeaders }
  });
}

function handleChatPage() {
  return new Response(chatHtml, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Access-Control-Allow-Origin': '*' } });
}

function logChatDetail(runtime, event, detail = {}) {
  const rawFlag = (globalThis && globalThis.__CHAT_DETAIL_LOG) || '';
  const enabled = ['1', 'true', 'yes', 'on'].includes(String(rawFlag).toLowerCase());
  if (!enabled) return;
  const prefix = `[qwen2api][${runtime}][chat]`;
  try {
    console.log(`${prefix} ${event}`, JSON.stringify(detail));
  } catch {
    console.log(`${prefix} ${event}`);
  }
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeMimeType(mimeType) {
  return (mimeType || 'application/octet-stream').toLowerCase();
}

function inferFileCategory(mimeType, explicitType) {
  if (explicitType === 'image' || explicitType === 'audio' || explicitType === 'video' || explicitType === 'document') return explicitType;
  const mime = normalizeMimeType(mimeType);
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('video/')) return 'video';
  return 'document';
}

function fileExtensionFromMime(mimeType) {
  const mime = normalizeMimeType(mimeType);
  const mapping = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'application/pdf': 'pdf',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/aac': 'aac',
    'audio/amr': 'amr',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'video/x-matroska': 'mkv',
    'video/avi': 'avi',
    'image/tiff': 'tif',
    'image/x-icon': 'ico',
    'image/vnd.microsoft.icon': 'ico',
    'image/x-icns': 'icns',
    'image/jp2': 'jp2',
    'image/sgi': 'sgi',
  };
  return mapping[mime] || 'bin';
}

function decodeBase64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function parseDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string') return null;
  const matched = dataUrl.match(/^data:([^;,]+)?;base64,(.+)$/i);
  if (!matched) return null;
  return {
    mimeType: normalizeMimeType(matched[1] || 'application/octet-stream'),
    bytes: decodeBase64ToBytes(matched[2]),
  };
}

function inferFilename(rawFilename, mimeType) {
  const name = normalizeInputString(rawFilename);
  if (name) return name;
  return `attachment-${uuidv4()}.${fileExtensionFromMime(mimeType)}`;
}

function normalizeInputString(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  const lower = trimmed.toLowerCase();
  if (lower === '[undefined]' || lower === 'undefined' || lower === '[null]' || lower === 'null') {
    return '';
  }
  return trimmed;
}

function tryParseRatioString(size) {
  const text = normalizeInputString(size);
  if (!text) return null;
  const m = text.toLowerCase().match(/^(\d+)\s*:\s*(\d+)$/);
  if (!m) return null;
  const w = Number(m[1]);
  const h = Number(m[2]);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
  return `${w}:${h}`;
}

function normalizeReasoningFragments(value) {
  if (typeof value === 'string') {
    const text = normalizeReasoningString(value);
    return text ? [text] : [];
  }
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const item of value) {
    if (typeof item === 'string') {
      const text = normalizeReasoningString(item);
      if (text) out.push(text);
    } else if (item && typeof item === 'object') {
      const text = normalizeReasoningString(item.text || item.content || item.value);
      if (text) out.push(text);
    }
  }
  return out;
}

function normalizeReasoningString(value) {
  if (typeof value !== 'string') return '';
  const lowered = value.trim().toLowerCase();
  if (lowered === '[undefined]' || lowered === 'undefined' || lowered === '[null]' || lowered === 'null') {
    return '';
  }
  return value;
}

function extractReasoningContentFromDelta(delta) {
  if (!delta || typeof delta !== 'object') return '';
  const direct = normalizeReasoningString(delta.reasoning_content || delta.reasoning || '');
  if (direct) return direct;
  const phase = typeof delta.phase === 'string' ? delta.phase : '';
  if (phase !== 'thinking_summary') return '';
  const fromSummary = normalizeReasoningFragments(delta?.extra?.summary_thought?.content);
  if (fromSummary.length > 0) return fromSummary.join('\n');
  return '';
}

function mapUpstreamDeltaToOpenAI(delta) {
  if (!delta || typeof delta !== 'object') return null;
  const mapped = {};
  // OpenAI API 规范: 流式响应中 delta.role 只能是 "assistant" 或不设置
  // 当上游返回 "function"/"tool" 等角色时，不设置 role 字段（兼容但不执行工具）
  if (delta.role === 'assistant') mapped.role = delta.role;
  if (typeof delta.content === 'string') mapped.content = delta.content;
  const reasoningContent = extractReasoningContentFromDelta(delta);
  if (reasoningContent) mapped.reasoning_content = reasoningContent;
  return Object.keys(mapped).length > 0 ? mapped : null;
}

function parseQwenSsePayload(rawPayload) {
  const payload = typeof rawPayload === 'string' ? rawPayload : '';
  const events = [];
  const contentParts = [];
  const reasoningParts = [];
  let usage = null;

  for (const line of payload.split('\n')) {
    const trimmed = line.trimStart();
    if (!trimmed.startsWith('data:')) continue;
    const data = trimmed.slice(5).trim();
    if (!data || data === '[DONE]') continue;
    try {
      const parsed = JSON.parse(data);
      if (parsed?.usage && typeof parsed.usage === 'object') usage = parsed.usage;
      const delta = mapUpstreamDeltaToOpenAI(parsed?.choices?.[0]?.delta);
      const finishReason = parsed?.choices?.[0]?.finish_reason || null;
      if (delta || finishReason) {
        events.push({ delta: delta || {}, finish_reason: finishReason });
      }
      if (delta?.content) contentParts.push(delta.content);
      if (delta?.reasoning_content) reasoningParts.push(delta.reasoning_content);
    } catch (parseError) {
      void parseError;
    }
  }

  return {
    events,
    content: contentParts.join(''),
    reasoning_content: reasoningParts.join(''),
    usage,
  };
}

function mapUsageToOpenAI(usage) {
  const inputTokens = Number(usage?.input_tokens || 0);
  const outputTokens = Number(usage?.output_tokens || 0);
  const totalTokens = Number(usage?.total_tokens || (inputTokens + outputTokens));
  const mapped = {
    prompt_tokens: inputTokens,
    completion_tokens: outputTokens,
    total_tokens: totalTokens,
  };
  const inputDetails = usage?.input_tokens_details && typeof usage.input_tokens_details === 'object'
    ? { ...usage.input_tokens_details }
    : null;
  const outputDetails = usage?.output_tokens_details && typeof usage.output_tokens_details === 'object'
    ? { ...usage.output_tokens_details }
    : null;
  if (inputDetails && Object.keys(inputDetails).length > 0) {
    mapped.prompt_tokens_details = inputDetails;
  }
  if (outputDetails && Object.keys(outputDetails).length > 0) {
    mapped.completion_tokens_details = outputDetails;
  }
  return mapped;
}

function decodeUtf8(bytes) {
  try { return new TextDecoder('utf-8', { fatal: false }).decode(bytes || new Uint8Array()); }
  catch { return ''; }
}

function extractInlineTextFromAttachment(source, mimeType, filename) {
  const mime = normalizeMimeType(mimeType);
  const isTextLike = mime.startsWith('text/') || mime === 'application/json' || mime === 'application/xml' || mime === 'text/markdown';
  if (!isTextLike) return '';
  const parsed = parseDataUrl(source);
  if (!parsed) return '';
  const text = normalizeInputString(decodeUtf8(parsed.bytes));
  if (!text) return '';
  const label = normalizeInputString(filename) || 'unnamed.txt';
  const capped = text.length > 12000 ? `${text.slice(0, 12000)}\n...[truncated]` : text;
  return `[附件文本 ${label}]\n${capped}`;
}

function normalizeContentParts(content) {
  if (typeof content === 'string') {
    return { text: normalizeInputString(content), attachments: [] };
  }
  if (!Array.isArray(content)) {
    return { text: '', attachments: [] };
  }

  const textParts = [];
  const attachments = [];
  for (const part of content) {
    if (!part) continue;
    if (typeof part === 'string') {
      const text = normalizeInputString(part);
      if (text) textParts.push(text);
      continue;
    }
    const type = part.type || '';
    if (type === 'text' || type === 'input_text') {
      const text = normalizeInputString(part.text || part.input_text);
      if (text) textParts.push(text);
      continue;
    }
    if (type === 'image_url' || type === 'input_image') {
      const source = normalizeInputString(part.image_url?.url || part.image_url || part.url || part.file_url || part.file_data);
      if (source) {
        attachments.push({ source, filename: normalizeInputString(part.filename) || normalizeInputString(part.name), mimeType: normalizeInputString(part.mime_type) || normalizeInputString(part.content_type), explicitType: 'image' });
      }
      continue;
    }
    if (type === 'file' || type === 'input_file' || type === 'audio' || type === 'input_audio' || type === 'video' || type === 'input_video') {
      const source = normalizeInputString(part.file_data || part.url || part.file_url || part.data);
      if (source) {
        const normalizedFilename = normalizeInputString(part.filename) || normalizeInputString(part.name);
        const normalizedMimeType = normalizeInputString(part.mime_type) || normalizeInputString(part.content_type);
        const explicitType = type.includes('audio') ? 'audio' : (type.includes('video') ? 'video' : undefined);
        attachments.push({ source, filename: normalizedFilename, mimeType: normalizedMimeType, explicitType });
      }
    }
  }
  return { text: textParts.join('\n'), attachments };
}

function normalizeLegacyFiles(message) {
  const result = [];
  const candidates = [...toArray(message?.attachments), ...toArray(message?.files)];
  for (const item of candidates) {
    if (!item) continue;
    const source = normalizeInputString(item.data || item.file_data || item.url || item.file_url);
    if (!source) continue;
    result.push({ source, filename: normalizeInputString(item.filename) || normalizeInputString(item.name), mimeType: normalizeInputString(item.mime_type) || normalizeInputString(item.content_type) || normalizeInputString(item.type), explicitType: item.type });
  }
  return result;
}

function parseIncomingMessages(messages) {
  const safeMessages = Array.isArray(messages) ? messages : [];
  const normalized = safeMessages.map(message => {
    const parsed = normalizeContentParts(message?.content);
    return { role: message?.role || 'user', text: parsed.text, attachments: [...parsed.attachments, ...normalizeLegacyFiles(message)] };
  });

  if (normalized.length === 0) {
    return { content: '', attachments: [] };
  }

  const last = normalized[normalized.length - 1];
  const history = normalized.slice(0, -1)
    .map(m => {
      if (!m.text) return '';
      const role = m.role === 'assistant' ? 'Assistant' : m.role === 'system' ? 'System' : 'User';
      return `[${role}]: ${m.text}`;
    })
    .filter(Boolean)
    .join('\n\n');
  const lastText = last.text || (last.attachments.length > 0 ? '请结合附件内容回答。' : '');
  return { content: history ? `${history}\n\n[User]: ${lastText}` : lastText, attachments: last.attachments };
}

async function getAttachmentBytes(attachment) {
  const dataParsed = parseDataUrl(attachment.source);
  if (dataParsed) {
    const mimeType = attachment.mimeType || dataParsed.mimeType;
    return { bytes: dataParsed.bytes, mimeType, filename: inferFilename(attachment.filename, mimeType), explicitType: attachment.explicitType };
  }
  if (/^https?:\/\//i.test(attachment.source)) {
    const resp = await fetch(attachment.source);
    if (!resp.ok) throw new Error(`Failed to fetch attachment URL: ${resp.status}`);
    const mimeType = attachment.mimeType || resp.headers.get('content-type') || 'application/octet-stream';
    return { bytes: new Uint8Array(await resp.arrayBuffer()), mimeType, filename: inferFilename(attachment.filename, mimeType), explicitType: attachment.explicitType };
  }
  const mimeType = attachment.mimeType || 'application/octet-stream';
  return { bytes: decodeBase64ToBytes(attachment.source.replace(/\s+/g, '')), mimeType, filename: inferFilename(attachment.filename, mimeType), explicitType: attachment.explicitType };
}

async function requestUploadToken(file, baxiaTokens) {
  const filetype = inferFileCategory(file.mimeType, file.explicitType);
  const resp = await fetch('https://chat.qwen.ai/api/v2/files/getstsToken', {
    method: 'POST',
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      'bx-ua': baxiaTokens.bxUa,
      'bx-umidtoken': baxiaTokens.bxUmidToken,
      'bx-v': baxiaTokens.bxV,
      'source': 'web',
      'timezone': new Date().toUTCString(),
      'Referer': 'https://chat.qwen.ai/',
      'x-request-id': uuidv4(),
    },
    body: JSON.stringify({ filename: file.filename, filesize: file.bytes.length, filetype }),
  });

  const data = await resp.json();
  if (!resp.ok || !data?.success || !data?.data?.file_url) {
    throw new Error(`Failed to get upload token: ${resp.status}`);
  }
  return { tokenData: data.data, filetype };
}

function toHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function formatOssDate(date = new Date()) {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mi = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
}

function formatOssDateScope(date = new Date()) {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

async function sha256Hex(input) {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return toHex(new Uint8Array(hash));
}

async function hmacSha256(keyBytes, content) {
  const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const message = typeof content === 'string' ? new TextEncoder().encode(content) : content;
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, message);
  return new Uint8Array(signature);
}

async function buildOssSignedHeaders(uploadUrlWithQuery, tokenData, file) {
  const parsedUrl = new URL(uploadUrlWithQuery);
  const query = parsedUrl.searchParams;
  const credentialFromQuery = decodeURIComponent(query.get('x-oss-credential') || '');
  const credentialParts = credentialFromQuery.split('/');
  const dateScope = credentialParts[1] || formatOssDateScope();
  const region = credentialParts[2] || 'ap-southeast-1';
  const xOssDate = query.get('x-oss-date') || formatOssDate();

  const hostParts = parsedUrl.hostname.split('.');
  const bucket = hostParts.length > 0 ? hostParts[0] : '';
  const objectPath = parsedUrl.pathname || '/';
  const canonicalUri = bucket ? `/${bucket}${objectPath}` : objectPath;
  const xOssUserAgent = 'aliyun-sdk-js/6.23.0';
  const canonicalHeaders = [
    `content-type:${file.mimeType}`,
    'x-oss-content-sha256:UNSIGNED-PAYLOAD',
    `x-oss-date:${xOssDate}`,
    `x-oss-security-token:${tokenData.security_token}`,
    `x-oss-user-agent:${xOssUserAgent}`,
  ].join('\n') + '\n';
  const canonicalRequest = ['PUT', canonicalUri, '', canonicalHeaders, '', 'UNSIGNED-PAYLOAD'].join('\n');
  const credentialScope = `${dateScope}/${region}/oss/aliyun_v4_request`;
  const stringToSign = ['OSS4-HMAC-SHA256', xOssDate, credentialScope, await sha256Hex(canonicalRequest)].join('\n');

  const kDate = await hmacSha256(new TextEncoder().encode(`aliyun_v4${tokenData.access_key_secret}`), dateScope);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, 'oss');
  const kSigning = await hmacSha256(kService, 'aliyun_v4_request');
  const signature = toHex(await hmacSha256(kSigning, stringToSign));

  return {
    'Accept': '*/*',
    'Content-Type': file.mimeType,
    'authorization': `OSS4-HMAC-SHA256 Credential=${tokenData.access_key_id}/${credentialScope},Signature=${signature}`,
    'x-oss-content-sha256': 'UNSIGNED-PAYLOAD',
    'x-oss-date': xOssDate,
    'x-oss-security-token': tokenData.security_token,
    'x-oss-user-agent': xOssUserAgent,
    'Referer': 'https://chat.qwen.ai/',
  };
}

async function uploadFileToQwenOss(file, tokenData) {
  const uploadUrl = typeof tokenData.file_url === 'string' ? tokenData.file_url.split('?')[0] : '';
  if (!uploadUrl) throw new Error('Upload failed: missing upload URL');
  const signedHeaders = await buildOssSignedHeaders(tokenData.file_url, tokenData, file);
  const resp = await fetch(uploadUrl, { method: 'PUT', headers: signedHeaders, body: file.bytes });
  if (!resp.ok) {
    const detail = await resp.text().catch(() => '');
    throw new Error(`Upload failed with status ${resp.status}${detail ? `: ${detail}` : ''}`);
  }
}

async function parseDocumentIfNeeded(qwenFilePayload, filetype, file, baxiaTokens) {
  if (filetype !== 'document') return;
  const resp = await fetch('https://chat.qwen.ai/api/v2/files/parse', {
    method: 'POST',
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      'bx-ua': baxiaTokens.bxUa,
      'bx-umidtoken': baxiaTokens.bxUmidToken,
      'bx-v': baxiaTokens.bxV,
      'source': 'web',
      'timezone': new Date().toUTCString(),
      'Referer': 'https://chat.qwen.ai/',
      'x-request-id': uuidv4(),
    },
    body: JSON.stringify({ file_id: qwenFilePayload.id }),
  });
  const detail = await resp.text().catch(() => '');
  if (!resp.ok) {
    logChatDetail('cloudflare-worker', 'attachments.parse.document.skip', { fileId: qwenFilePayload.id, filename: file.filename, status: resp.status, detail });
    throw new Error(`Document parse failed with status ${resp.status}${detail ? `: ${detail}` : ''}`);
  }
  let payload = {};
  try {
    payload = detail ? JSON.parse(detail) : {};
  } catch {}
  if (payload && payload.success === false) {
    logChatDetail('cloudflare-worker', 'attachments.parse.document.skip', { fileId: qwenFilePayload.id, filename: file.filename, status: resp.status, detail });
    throw new Error(`Document parse rejected${payload?.msg ? `: ${payload.msg}` : ''}`);
  }
  logChatDetail('cloudflare-worker', 'attachments.parse.document.done', { fileId: qwenFilePayload.id, filename: file.filename });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function ensureUploadStatusForNonVideo(filetype, baxiaTokens) {
  if (filetype === 'video') return;
  const maxAttempts = 6;
  let lastPayload = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const resp = await fetch('https://chat.qwen.ai/api/v2/users/status', {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'bx-v': baxiaTokens.bxV,
        'source': 'web',
        'timezone': new Date().toUTCString(),
        'Referer': 'https://chat.qwen.ai/',
        'x-request-id': uuidv4(),
      },
      body: JSON.stringify({
        typarms: {
          typarm1: 'web',
          typarm2: '',
          typarm3: 'prod',
          typarm4: 'qwen_chat',
          typarm5: 'product',
          orgid: 'tongyi',
        }
      }),
    });
    if (!resp.ok) {
      const detail = await resp.text().catch(() => '');
      throw new Error(`Upload status check failed with status ${resp.status}${detail ? `: ${detail}` : ''}`);
    }
    const payload = await resp.json().catch(() => ({}));
    lastPayload = payload;
    if (payload?.data === true) return;
    if (attempt < maxAttempts) await sleep(400);
  }
  throw new Error(`Upload status not ready for non-video file${lastPayload ? `: ${JSON.stringify(lastPayload)}` : ''}`);
}

function extractUploadedFileId(fileUrl) {
  try {
    const pathname = decodeURIComponent(new URL(fileUrl).pathname);
    const filename = pathname.split('/').pop() || '';
    if (filename.includes('_')) return filename.split('_')[0];
  } catch {}
  return uuidv4();
}

function buildQwenFilePayload(file, tokenData, filetype) {
  const now = Date.now();
  const id = normalizeInputString(tokenData?.file_id) || extractUploadedFileId(tokenData.file_url);
  const isDocument = filetype === 'document';
  const showType = isDocument ? 'file' : filetype;
  const fileClass = isDocument ? 'document' : (filetype === 'image' ? 'vision' : filetype);
  const fileSize = file.bytes.length;
  const fileMimeType = file.mimeType;
  const uploadTaskId = uuidv4();
  return {
    type: showType,
    file: {
      created_at: now,
      data: {},
      filename: file.filename,
      hash: null,
      id,
      meta: { name: file.filename, size: fileSize, content_type: fileMimeType },
      update_at: now,
    },
    id,
    url: tokenData.file_url,
    name: file.filename,
    collection_name: '',
    progress: 0,
    status: 'uploaded',
    is_uploading: false,
    error: '',
    showType,
    file_class: fileClass,
    itemId: uuidv4(),
    greenNet: 'success',
    size: fileSize,
    file_type: fileMimeType,
    uploadTaskId,
  };
}

async function uploadAttachments(attachments, baxiaTokens) {
  logChatDetail('cloudflare-worker', 'attachments.upload.start', { count: attachments.length });
  const files = [];
  for (let i = 0; i < attachments.length; i++) {
    const attachment = attachments[i];
    const loaded = await getAttachmentBytes(attachment);
    logChatDetail('cloudflare-worker', 'attachments.upload.file.prepare', {
      index: i,
      filename: loaded.filename,
      mimeType: loaded.mimeType,
      size: loaded.bytes.length,
    });
    const { tokenData, filetype } = await requestUploadToken(loaded, baxiaTokens);
    await uploadFileToQwenOss(loaded, tokenData);
    const qwenFilePayload = buildQwenFilePayload(loaded, tokenData, filetype);
    await ensureUploadStatusForNonVideo(filetype, baxiaTokens);
    await parseDocumentIfNeeded(qwenFilePayload, filetype, loaded, baxiaTokens);
    if (filetype === 'document') await ensureUploadStatusForNonVideo(filetype, baxiaTokens);
    files.push(qwenFilePayload);
    logChatDetail('cloudflare-worker', 'attachments.upload.file.done', { index: i, filetype, filename: loaded.filename });
  }
  logChatDetail('cloudflare-worker', 'attachments.upload.done', { uploaded: files.length });
  return files;
}

function streamResponse(body) {
  return new Response(body, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Access-Control-Allow-Origin': '*' }
  });
}

// ============================================
// 认证
// ============================================

function validateToken(authHeader, env) {
  const tokens = env.API_TOKENS ? env.API_TOKENS.split(',').filter(t => t.trim()) : [];
  if (tokens.length === 0) return true;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  return tokens.includes(token);
}

// ============================================
// API Handlers
// ============================================

async function handleModels(authHeader, env) {
  if (!validateToken(authHeader, env)) {
    return jsonResponse({ error: { message: 'Incorrect API key provided.', type: 'invalid_request_error' } }, 401);
  }
  try {
    const resp = await fetch('https://chat.qwen.ai/api/models', {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
    });
    return jsonResponse(await resp.json());
  } catch {
    return jsonResponse({ error: { message: 'Failed to fetch models', type: 'api_error' } }, 500);
  }
}

async function handleChatCompletions(body, authHeader, env) {
  logChatDetail('cloudflare-worker', 'request.entry', {
    hasAuthHeader: !!authHeader,
    bodyType: typeof body,
    hasMessages: !!body?.messages,
  });

  if (!validateToken(authHeader, env)) {
    logChatDetail('cloudflare-worker', 'request.auth.failed', {});
    return jsonResponse({ error: { message: 'Incorrect API key provided.', type: 'invalid_request_error' } }, 401);
  }

  const { model, messages, stream = true, tools } = body;
  if (!messages?.length) {
    logChatDetail('cloudflare-worker', 'request.validation.failed', { reason: 'Messages are required' });
    return jsonResponse({ error: { message: 'Messages are required', type: 'invalid_request_error' } }, 400);
  }
  logChatDetail('cloudflare-worker', 'request.received', {
    stream: !!stream,
    model: model || 'qwen3.5-plus',
    messageCount: Array.isArray(messages) ? messages.length : 0,
    hasTools: !!(tools && Array.isArray(tools) && tools.length > 0),
  });

  const actualModel = model || 'qwen3.5-plus';
  const { bxUa, bxUmidToken, bxV } = await getBaxiaTokens();

  // 检查是否启用搜索
  const enableSearch = (env.ENABLE_SEARCH || '').toLowerCase() === 'true';
  const chatType = enableSearch ? 'search' : 't2t';
  logChatDetail('cloudflare-worker', 'request.config', { actualModel, chatType, enableSearch });

  // 创建会话
  const createResp = await fetch('https://chat.qwen.ai/api/v2/chats/new', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'bx-ua': bxUa, 'bx-umidtoken': bxUmidToken, 'bx-v': bxV,
      'Referer': 'https://chat.qwen.ai/c/guest', 'source': 'web',
      'x-request-id': uuidv4()
    },
    body: JSON.stringify({
      title: '新建对话', models: [actualModel], chat_mode: 'guest', chat_type: chatType,
      timestamp: Date.now(), project_id: ''
    })
  });
  const createData = await createResp.json();
  logChatDetail('cloudflare-worker', 'chat.create.response', {
    status: createResp.status,
    success: !!createData?.success,
    hasChatId: !!createData?.data?.id,
  });
  if (!createData.success || !createData.data?.id) {
    return jsonResponse({ error: { message: 'Failed to create chat session', type: 'api_error', details: createData } }, 500);
  }
  const chatId = createData.data.id;

  const parsedMessages = parseIncomingMessages(messages);
  const content = parsedMessages.content;
  logChatDetail('cloudflare-worker', 'message.parsed', {
    contentLength: content.length,
    attachmentCount: parsedMessages.attachments.length,
  });
  const uploadedFiles = parsedMessages.attachments.length > 0
    ? await uploadAttachments(parsedMessages.attachments, { bxUa, bxUmidToken, bxV })
    : [];
  logChatDetail('cloudflare-worker', 'message.ready', { uploadedFileCount: uploadedFiles.length });

  // 发送请求
  const chatResp = await fetch(`https://chat.qwen.ai/api/v2/chat/completions?chat_id=${chatId}`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json', 'Content-Type': 'application/json',
      'bx-ua': bxUa, 'bx-umidtoken': bxUmidToken, 'bx-v': bxV,
      'source': 'web', 'version': '0.2.9', 'Referer': 'https://chat.qwen.ai/c/guest', 'x-request-id': uuidv4()
    },
    body: JSON.stringify({
      stream: true, version: '2.1', incremental_output: true,
      chat_id: chatId, chat_mode: 'guest', model: actualModel, parent_id: null,
      messages: [{
        fid: uuidv4(), parentId: null, childrenIds: [uuidv4()], role: 'user', content,
        user_action: 'chat', files: uploadedFiles, timestamp: Date.now(), models: [actualModel], chat_type: chatType,
        feature_config: { thinking_enabled: true, output_schema: 'phase', research_mode: 'normal', auto_thinking: true, thinking_format: 'summary', auto_search: enableSearch },
        extra: { meta: { subChatType: chatType } }, sub_chat_type: chatType, parent_id: null
      }],
      timestamp: Date.now()
    })
  });

  if (!chatResp.ok) {
    logChatDetail('cloudflare-worker', 'chat.completion.error', { status: chatResp.status, chatId });
    return jsonResponse({ error: { message: await chatResp.text(), type: 'api_error' } }, chatResp.status);
  }
  logChatDetail('cloudflare-worker', 'chat.completion.started', { status: chatResp.status, chatId, stream: !!stream });

  const responseId = `chatcmpl-${uuidv4()}`;
  const created = Math.floor(Date.now() / 1000);

  // 流式响应
  if (stream) {
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    
    // 后台处理流
    (async () => {
      const reader = chatResp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let doneWritten = false;

      try {
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
              await writer.write(encoder.encode('data: [DONE]\n\n'));
              doneWritten = true;
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed?.error) {
                const upstreamError = typeof parsed.error === 'string' ? { message: parsed.error } : parsed.error;
                const errorMsg = upstreamError.message || upstreamError.details || '请求失败';
                // 内容安全警告作为正常输出而不是错误
                if (upstreamError.code === 'data_inspection_failed' || upstreamError.details) {
                  const warningChunk = {
                    id: responseId,
                    object: 'chat.completion.chunk',
                    created,
                    model: actualModel,
                    choices: [{
                      index: 0,
                      delta: { role: 'assistant', content: errorMsg },
                      finish_reason: 'stop',
                    }],
                  };
                  await writer.write(encoder.encode(`data: ${JSON.stringify(warningChunk)}\n\n`));
                  doneWritten = true;
                  await writer.write(encoder.encode('data: [DONE]\n\n'));
                  continue;
                }
                const errObj = {
                  error: {
                    message: errorMsg,
                    type: upstreamError.type || 'api_error',
                    code: upstreamError.code,
                  }
                };
                await writer.write(encoder.encode(`data: ${JSON.stringify(errObj)}\n\n`));
                continue;
              }
              const delta = mapUpstreamDeltaToOpenAI(parsed?.choices?.[0]?.delta);
              if (delta || parsed.choices?.[0]?.finish_reason) {
                const chunk = {
                  id: responseId,
                  object: 'chat.completion.chunk',
                  created,
                  model: actualModel,
                  choices: [{
                    index: 0,
                    delta: delta || {},
                    finish_reason: parsed.choices[0].finish_reason || null
                  }]
                };
                await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
              }
            } catch (streamParseError) {
              void streamParseError;
            }
          }
        }
      } catch (err) {
        const message = err && err.message ? err.message : 'stream proxy error';
        await writer.write(encoder.encode(`data: ${JSON.stringify({ error: { message, type: 'api_error' } })}\n\n`));
      } finally {
        if (!doneWritten) {
          await writer.write(encoder.encode('data: [DONE]\n\n'));
        }
        await writer.close();
      }
    })();
    logChatDetail('cloudflare-worker', 'stream.proxy.started', { chatId, model: actualModel });
    
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  // 非流式响应 - 收集完整内容
  const reader = chatResp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
  }
  const parsedSse = parseQwenSsePayload(buffer);
  logChatDetail('cloudflare-worker', 'chat.completion.collected', {
    chunkCount: parsedSse.events.length,
    outputLength: parsedSse.content.length,
  });

  return jsonResponse({
    id: responseId, object: 'chat.completion', created, model: actualModel,
    choices: [{ index: 0, message: { role: 'assistant', content: parsedSse.content, ...(parsedSse.reasoning_content ? { reasoning_content: parsedSse.reasoning_content } : {}) }, finish_reason: 'stop' }],
    usage: mapUsageToOpenAI(parsedSse.usage)
  });
}

async function handleImageGenerations(body, authHeader, env) {
  // OpenAI Images API compatible: POST /v1/images/generations
  if (!validateToken(authHeader, env)) {
    return jsonResponse({ error: { message: 'Incorrect API key provided.', type: 'invalid_request_error' } }, 401);
  }

  const prompt = normalizeInputString(body?.prompt);
  if (!prompt) {
    return jsonResponse({ error: { message: 'prompt is required', type: 'invalid_request_error' } }, 400);
  }

  const actualModel = normalizeInputString(body?.model) || 'qwen3.5-plus';
  const nRaw = body?.n;
  let n = Number.isFinite(nRaw) ? Number(nRaw) : Number.parseInt(String(nRaw || ''), 10);
  if (!Number.isFinite(n) || n <= 0) n = 1;
  if (n > 10) n = 10;

  const responseFormat = normalizeInputString(body?.response_format) || 'url';
  if (responseFormat !== 'url' && responseFormat !== 'b64_json') {
    return jsonResponse({ error: { message: 'response_format must be one of url or b64_json', type: 'invalid_request_error' } }, 400);
  }

  const qwenRatio = mapOpenAiImageSizeToQwenRatio(body?.size);
  const { bxUa, bxUmidToken, bxV } = await getBaxiaTokens();

  const createResp = await fetch('https://chat.qwen.ai/api/v2/chats/new', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'bx-ua': bxUa,
      'bx-umidtoken': bxUmidToken,
      'bx-v': bxV,
      'Referer': 'https://chat.qwen.ai/c/guest',
      'source': 'web',
      'x-request-id': uuidv4(),
    },
    body: JSON.stringify({
      title: '新建对话',
      models: [actualModel],
      chat_mode: 'guest',
      chat_type: 't2i',
      timestamp: Date.now(),
      project_id: '',
    }),
  });
  const createData = await createResp.json().catch(() => ({}));
  if (!createResp.ok || !createData?.success || !createData?.data?.id) {
    return jsonResponse({ error: { message: 'Failed to create image chat session', type: 'api_error', details: createData } }, 500);
  }
  const chatId = createData.data.id;

  const finalPrompt = n === 1 ? prompt : `${prompt}\n\n(Generate ${n} images.)`;
  const chatResp = await fetch(`https://chat.qwen.ai/api/v2/chat/completions?chat_id=${chatId}` , {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'bx-ua': bxUa,
      'bx-umidtoken': bxUmidToken,
      'bx-v': bxV,
      'source': 'web',
      'version': '0.2.9',
      'Referer': 'https://chat.qwen.ai/c/guest',
      'x-request-id': uuidv4(),
    },
    body: JSON.stringify({
      stream: true,
      version: '2.1',
      incremental_output: true,
      chat_id: chatId,
      chat_mode: 'guest',
      model: actualModel,
      parent_id: null,
      messages: [{
        fid: uuidv4(),
        parentId: null,
        childrenIds: [uuidv4()],
        role: 'user',
        content: finalPrompt,
        user_action: 'chat',
        files: [],
        timestamp: Date.now(),
        models: [actualModel],
        chat_type: 't2i',
        feature_config: { thinking_enabled: true, output_schema: 'phase', research_mode: 'normal', auto_thinking: true, thinking_mode: 'Auto', thinking_format: 'summary', auto_search: true },
        extra: { meta: { subChatType: 't2i' } },
        sub_chat_type: 't2i',
        parent_id: null,
      }],
      timestamp: Date.now(),
      size: qwenRatio,
    }),
  });

  if (!chatResp.ok) {
    return jsonResponse({ error: { message: await chatResp.text().catch(() => ''), type: 'api_error' } }, chatResp.status);
  }

  const reader = chatResp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
  }
  const urls = extractImageUrlsFromUpstreamSse(buffer);
  if (!urls || urls.length === 0) {
    return jsonResponse({ error: { message: 'Upstream returned no image URLs', type: 'api_error' } }, 502);
  }

  const created = Math.floor(Date.now() / 1000);
  if (responseFormat === 'url') {
    return jsonResponse({ created, data: urls.slice(0, n).map((u) => ({ url: u })) });
  }

  // b64_json
  try {
    const items = [];
    for (const u of urls.slice(0, n)) {
      const resp = await fetch(u);
      if (!resp.ok) throw new Error(`Failed to fetch image: HTTP ${resp.status}`);
      const bytes = new Uint8Array(await resp.arrayBuffer());
      let b64 = '';
      // btoa expects binary string
      let chunk = '';
      for (let i = 0; i < bytes.length; i++) {
        chunk += String.fromCharCode(bytes[i]);
        if (chunk.length > 0x8000) {
          b64 += btoa(chunk);
          chunk = '';
        }
      }
      if (chunk) b64 += btoa(chunk);
      items.push({ b64_json: b64 });
    }
    return jsonResponse({ created, data: items });
  } catch (err) {
    const message = err && err.message ? err.message : 'Failed to fetch image bytes';
    return jsonResponse({ error: { message, type: 'api_error' } }, 502);
  }
}

function tryParseOpenAiImageSize(size) {
  const text = normalizeInputString(size);
  if (!text) return null;
  const m = text.toLowerCase().match(/^(\d{2,5})\s*x\s*(\d{2,5})$/);
  if (!m) return null;
  const width = Number(m[1]);
  const height = Number(m[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
  return { width, height };
}

function mapOpenAiImageSizeToQwenRatio(size) {
  const ratio = tryParseRatioString(size);
  if (ratio) {
    const validRatios = ['1:1', '16:9', '9:16', '4:3', '3:4'];
    if (validRatios.includes(ratio)) return ratio;
  }
  const parsed = tryParseOpenAiImageSize(size);
  if (!parsed) return '1:1';
  const { width, height } = parsed;
  const r = width / height;
  const candidates = [
    { key: '1:1', r: 1 },
    { key: '16:9', r: 16 / 9 },
    { key: '9:16', r: 9 / 16 },
    { key: '4:3', r: 4 / 3 },
    { key: '3:4', r: 3 / 4 },
  ];
  let best = candidates[0];
  let bestDiff = Infinity;
  for (const c of candidates) {
    const diff = Math.abs(r - c.r);
    if (diff < bestDiff) {
      best = c;
      bestDiff = diff;
    }
  }
  return best.key;
}

function extractImageUrlsFromUpstreamSse(rawPayload) {
  const payload = typeof rawPayload === 'string' ? rawPayload : '';
  const urls = [];
  for (const line of payload.split('\n')) {
    const trimmed = line.trimStart();
    if (!trimmed.startsWith('data:')) continue;
    const data = trimmed.slice(5).trim();
    if (!data || data === '[DONE]') continue;
    try {
      const parsed = JSON.parse(data);
      const delta = parsed?.choices?.[0]?.delta;
      if (!delta || typeof delta !== 'object') continue;
      const phase = typeof delta.phase === 'string' ? delta.phase : '';
      if (phase !== 'image_gen') continue;
      const content = delta.content;
      if (typeof content !== 'string') continue;
      const url = content.trim();
      if (!url) continue;
      if (!/^https?:\/\//i.test(url)) continue;
      urls.push(url);
    } catch {}
  }
  const seen = new Set();
  const out = [];
  for (const u of urls) {
    if (seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}

async function handleChatCompletionsWithLogs(body, authHeader, env) {
  const baseResponse = await handleChatCompletions(body, authHeader, env);
  const contentType = String(baseResponse?.headers?.get('Content-Type') || '').toLowerCase();
  if (!contentType.startsWith('text/event-stream') || !baseResponse?.body) {
    return baseResponse;
  }

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  const reader = baseResponse.body.getReader();

  (async () => {
    try {
      const logEvent = {
        event: 'request.received',
        timestamp: Date.now(),
        model: body?.model || 'qwen3.5-plus',
        messageCount: Array.isArray(body?.messages) ? body.messages.length : 0,
        chatType: body?.chat_type || 't2t',
        enableSearch: !!body?.enable_search,
        ...(body?.video_url ? { videoUrl: body.video_url } : {}),
      };
      await writer.write(encoder.encode('event: log\n'));
      await writer.write(encoder.encode(`data: ${JSON.stringify(logEvent)}\n\n`));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        await writer.write(value);
      }
    } finally {
      await writer.close();
    }
  })();

  const headers = new Headers(baseResponse.headers);
  headers.set('Content-Type', 'text/event-stream');
  return new Response(readable, { status: baseResponse.status, headers });
}

// ============================================
// Worker 入口
// ============================================

export default {
  async fetch(request, env, ctx) {
    globalThis.__CHAT_DETAIL_LOG = env?.CHAT_DETAIL_LOG || '';
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' }
      });
    }

    const url = new URL(request.url);
    const rawPath = url.pathname;
    const apiPrefix = '/api';
    const path = rawPath === apiPrefix
      ? '/'
      : (rawPath.startsWith(apiPrefix + '/') ? rawPath.slice(apiPrefix.length) : rawPath);
    const authHeader = request.headers.get('Authorization') || '';

    if (request.method === 'GET' && path === '/v1/models') {
      return handleModels(authHeader, env);
    }
    if (request.method === 'POST' && path === '/v1/chat/completions/log') {
      let body;
      try {
        body = await request.json();
      } catch {
        return jsonResponse({ error: { message: 'Invalid JSON body.', type: 'invalid_request_error' } }, 400);
      }
      return handleChatCompletionsWithLogs(body, authHeader, env);
    }
    if (request.method === 'POST' && path === '/v1/chat/completions') {
      let body;
      try {
        body = await request.json();
      } catch {
        return jsonResponse({ error: { message: 'Invalid JSON body.', type: 'invalid_request_error' } }, 400);
      }
      return handleChatCompletions(body, authHeader, env);
    }
    if (request.method === 'POST' && path === '/v1/images/generations') {
      let body;
      try {
        body = await request.json();
      } catch {
        return jsonResponse({ error: { message: 'Invalid JSON body.', type: 'invalid_request_error' } }, 400);
      }
      return handleImageGenerations(body, authHeader, env);
    }
    if (request.method === 'GET' && (path === '/chat' || path === '/chat/')) {
      return handleChatPage();
    }
    if (request.method === 'GET' && (path === '/' || path === '')) {
      return new Response('<html><head><title>200 OK</title></head><body><center><h1>200 OK</h1></center><hr><center>nginx</center></body></html>', { headers: { 'Content-Type': 'text/html' } });
    }
    return jsonResponse({ error: { message: 'Not found', type: 'invalid_request_error' } }, 404);
  }
};
