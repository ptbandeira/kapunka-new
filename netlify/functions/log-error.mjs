const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(body)
});

const isJsonContentType = (headers = {}) => {
  const contentType = headers['content-type'] || headers['Content-Type'];
  if (typeof contentType !== 'string') {
    return false;
  }

  return contentType.toLowerCase().startsWith('application/json');
};

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method Not Allowed' });
  }

  if (!isJsonContentType(event.headers)) {
    return jsonResponse(415, { error: 'Unsupported Media Type' });
  }

  if (!event.body) {
    return jsonResponse(400, { error: 'Missing JSON body' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (error) {
    return jsonResponse(400, { error: 'Invalid JSON payload' });
  }

  if (payload === null || typeof payload !== 'object') {
    return jsonResponse(400, { error: 'Invalid payload structure' });
  }

  console.error(
    '[client-error]',
    JSON.stringify({
      ...payload,
      receivedAt: new Date().toISOString()
    })
  );

  return jsonResponse(200, { ok: true });
};
