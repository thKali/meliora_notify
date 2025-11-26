const fastify = require('fastify')({
  logger: true
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Main notify webhook
fastify.post('/notify', async (request, reply) => {
  // Log COMPLETO do que chegou (para debug do Coolify)
  fastify.log.info({
    event: 'webhook_received',
    payload: request.body,
    headers: request.headers,
    timestamp: new Date().toISOString()
  });

  // Retorna sempre sucesso para aceitar qualquer payload
  return {
    success: true,
    message: 'Webhook recebido e logado',
    received_at: new Date().toISOString()
  };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info(`🚀 Meliora Notify API rodando em http://${HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

