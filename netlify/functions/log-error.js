const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(body)
});

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method Not Allowed' });
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

  if (payload == null || typeof payload !== 'object') {
    return jsonResponse(400, { error: 'Invalid payload structure' });
  }

  const { message, stack, url, userAgent, timestamp } = payload;

  if (
    typeof message !== 'string' ||
    (stack != null && typeof stack !== 'string') ||
    typeof url !== 'string' ||
    typeof userAgent !== 'string' ||
    typeof timestamp !== 'string'
  ) {
    return jsonResponse(400, { error: 'Invalid payload fields' });
  }

  console.error('[client-error]', JSON.stringify({ message, stack, url, userAgent, timestamp }));

  return jsonResponse(200, { ok: true });
};
