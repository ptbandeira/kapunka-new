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

  const parsedPayload = parseJson(event.body || '{}');
  if (!parsedPayload || typeof parsedPayload !== 'object') {
    return jsonResponse(400, { error: 'Invalid JSON payload' });
  }

  const { message, stack = null, url, userAgent, timestamp, route, referrer, buildId } = parsedPayload;

  const payload = {
    message: typeof message === 'string' ? message : 'Unknown client error',
    stack: typeof stack === 'string' ? stack : null,
    url: typeof url === 'string' ? url : '',
    userAgent: typeof userAgent === 'string' ? userAgent : '',
    timestamp: typeof timestamp === 'string' ? timestamp : new Date().toISOString(),
    route: typeof route === 'string' ? route : '',
    referrer: typeof referrer === 'string' ? referrer : '',
    buildId: typeof buildId === 'string' ? buildId : ''
  };

  console.error(
    '[client-error]',
    JSON.stringify({
      ...payload,
      ua: (event.headers && typeof event.headers['user-agent'] === 'string') ? event.headers['user-agent'] : '',
      path: typeof event.path === 'string' ? event.path : '',
      receivedAt: new Date().toISOString()
    })
  );

  return jsonResponse(200, { ok: true });
}
