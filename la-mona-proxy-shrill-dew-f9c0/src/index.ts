export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Manejar CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    // Solo manejar POST en /api/pedidos
    if (url.pathname === "/api/pedidos" && request.method === "POST") {
      const body = await request.text();
      const resp = await fetch(env.N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body
      });
      const text = await resp.text();
      return new Response(text, {
        status: resp.status,
        headers: { "Access-Control-Allow-Origin": "*" }
      });
    }

    // Todo lo demás sigue sirviendo estáticos
    return new Response("Not found", { status: 404 });
  }
};
