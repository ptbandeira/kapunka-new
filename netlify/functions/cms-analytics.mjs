export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Allow': 'POST' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const { eventType, timestamp, source = 'decap-admin', data = {} } = payload;

    console.log('[cms-analytics]', JSON.stringify({
      eventType,
      timestamp,
      source,
      data,
      receivedAt: new Date().toISOString(),
    }));

    return {
      statusCode: 204,
      body: '',
    };
  } catch (error) {
    console.error('[cms-analytics] Failed to process payload', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid payload' }),
    };
  }
}
