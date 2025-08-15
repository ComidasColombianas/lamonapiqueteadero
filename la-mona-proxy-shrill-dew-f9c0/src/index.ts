export default {
  async fetch(request, env) {
    // Manejo de preflight CORS
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

    if (request.method === "POST") {
      try {
        // 📌 Leer body JSON
        const body = await request.json();
        console.log("📦 Pedido recibido:", body);

        // 📌 Reenviar a n8n usando el secreto
        const n8nWebhook = env.N8N_WEBHOOK_URL;
        const n8nResponse = await fetch(n8nWebhook, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        const resultText = await n8nResponse.text();

        return new Response(resultText, {
          status: n8nResponse.status,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
        });
      } catch (err) {
        console.error("❌ Error procesando pedido:", err);
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Access-Control-Allow-Origin": "*" },
        });
      }
    }

    return new Response("Método no permitido", {
      status: 405,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  },
};
