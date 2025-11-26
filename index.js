const fastify = require('fastify')({
  logger: true
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Configuração do WhatsApp API
const WHATSAPP_API_URL = 'https://zap.palmapp.com.br/message/sendText/suporte.palm';
const WHATSAPP_API_KEY = '1C6E75499C5B-42E3-8BDB-585C05F2726E';

// Lista de números para receber notificações
const NUMBERS_TO_NOTIFY = [
  '5511972648356'
];

// Função para enviar mensagem via WhatsApp
async function sendWhatsAppMessage(number, text) {
  const options = {
    method: 'POST',
    headers: {
      'apikey': WHATSAPP_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      number: number,
      text: text,
      delay: 1000,
      linkPreview: true
    })
  };

  try {
    const response = await fetch(WHATSAPP_API_URL, options);
    const data = await response.json();
    return { success: true, number, data };
  } catch (error) {
    fastify.log.error({ error: error.message, number }, 'Erro ao enviar WhatsApp');
    return { success: false, number, error: error.message };
  }
}

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Main notify webhook
fastify.post('/notify', async (request, reply) => {
  const { message, event, url } = request.body;

  // Log do webhook recebido
  fastify.log.info({
    event: 'webhook_received',
    payload: request.body,
    timestamp: new Date().toISOString()
  });

  // Monta a mensagem do WhatsApp
  const whatsappMessage = `
🔔 *Notificação Coolify*

${message || 'Sem mensagem'}

📌 *Evento:* ${event || 'N/A'}
🔗 *URL:* ${url || 'N/A'}
⏰ *Data:* ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
  `.trim();

  // Envia para todos os números da lista
  fastify.log.info({ 
    event: 'sending_whatsapp', 
    total_numbers: NUMBERS_TO_NOTIFY.length 
  });

  const results = await Promise.all(
    NUMBERS_TO_NOTIFY.map(number => sendWhatsAppMessage(number, whatsappMessage))
  );

  // Log dos resultados
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  fastify.log.info({
    event: 'whatsapp_sent',
    successful,
    failed,
    results
  });

  return {
    success: true,
    message: 'Webhook recebido e notificações enviadas',
    sent_to: NUMBERS_TO_NOTIFY.length,
    successful,
    failed,
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

