export default {
  async fetch(request, env) {
    // Manejo de preflight para CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Solo aceptar POST
    if (request.method === "POST") {
      try {
        // Leer el body como JSON
        const data = await request.json();
        console.log("📦 Pedido recibido:", data);

        // Reenviar a tu webhook n8n usando el secreto
        const n8nWebhook = env.N8N_WEBHOOK_URL;
        const n8nResponse = await fetch(n8nWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const n8nResult = await n8nResponse.text();

        return new Response(n8nResult, {
          status: n8nResponse.status,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
        });
      } catch (err) {
        console.error("❌ Error:", err);
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Access-Control-Allow-Origin": "*" },
        });
      }
    }

    // Si no es POST ni OPTIONS
    return new Response("Método no permitido", {
      status: 405,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  },
};
