const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(body)
});

const parseJson = (input) => {
  try {
    return JSON.parse(input);
  } catch (error) {
    return null;
  }
};

const isJsonContentType = (headers = {}) => {
  const contentType = headers['content-type'] || headers['Content-Type'];
  if (typeof contentType !== 'string') {
    return false;
  }
  return contentType.toLowerCase().includes('application/json');
};

export async function handler(event = {}) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method Not Allowed' });
  }

  if (!isJsonContentType(event.headers)) {
    return jsonResponse(415, { error: 'Unsupported Media Type' });
  }

  const payload = parseJson(event.body || '{}');
  if (!payload || typeof payload !== 'object') {
    return jsonResponse(400, { error: 'Invalid JSON payload' });
  }

  const { message, stack = null, url, userAgent, timestamp } = payload;

  const logPayload = {
    message: typeof message === 'string' ? message : 'Unknown client error',
    stack: typeof stack === 'string' ? stack : null,
    url: typeof url === 'string' ? url : '',
    userAgent: typeof userAgent === 'string' ? userAgent : '',
    timestamp: typeof timestamp === 'string' ? timestamp : new Date().toISOString()
  };

  console.error(
    '[client-error]',
    JSON.stringify({ ...logPayload, receivedAt: new Date().toISOString() })
  );

  return jsonResponse(200, { ok: true });
}
