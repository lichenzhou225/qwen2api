const handler = require('../index.js');

exports.handler = async (event, context) => {
  const req = {
    method: event.httpMethod,
    headers: event.headers || {},
    body: event.body ? (event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body) : {},
    url: event.path,
    path: event.path,
    query: event.queryStringParameters || {},
  };

  let responseResult = null;
  const res = {
    status: (code) => ({
      set: (headers) => ({
        send: (body) => { responseResult = { statusCode: code, headers, body }; return responseResult; },
        end: () => { responseResult = { statusCode: code, headers: {}, body: '' }; return responseResult; }
      }),
      json: (body) => { responseResult = { statusCode: code, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }; return responseResult; }
    })
  };

  await handler(req, res);
  return responseResult || { statusCode: 404, body: 'Not Found' };
};