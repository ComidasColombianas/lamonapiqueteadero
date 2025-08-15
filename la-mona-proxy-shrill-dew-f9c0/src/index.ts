// worker.js
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const body = await request.text();

    // Reenvía al webhook de n8n guardado como secreto
    const resp = await fetch(env.N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });

    const text = await resp.text();
    return new Response(text, {
      status: resp.status,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}
