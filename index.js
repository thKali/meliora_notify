const fastify = require('fastify')({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
        colorize: true
      }
    }
  }
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Configuração do WhatsApp API
const WHATSAPP_API_URL = 'https://zap.palmapp.com.br/message/sendText/suporte.palm';
const WHATSAPP_API_KEY = '1C6E75499C5B-42E3-8BDB-585C05F2726E';

// Lista de números para receber notificações
const NUMBERS_TO_NOTIFY = [
  '5511972648356',
  '5511957077700'
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

// Função para formatar mensagem baseada no evento
function formatWhatsAppMessage(payload) {
  const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const event = payload.event || 'unknown';

  // Mensagens específicas por tipo de evento
  switch (event) {
    case 'deployment_success':
      return `
✅ *Deploy Concluído com Sucesso!*

📦 *Aplicação:* ${payload.application_name || 'N/A'}
🏷️ *Projeto:* ${payload.project || 'N/A'}
🌍 *Ambiente:* ${payload.environment || 'N/A'}

🔗 *Link:* ${payload.fqdn || 'N/A'}

⏰ ${timestamp}
      `.trim();

    case 'deployment_failed':
      return `
❌ *Falha no Deploy!*

📦 *Aplicação:* ${payload.application_name || 'N/A'}
🏷️ *Projeto:* ${payload.project || 'N/A'}
🌍 *Ambiente:* ${payload.environment || 'N/A'}

⚠️ *Erro:* ${payload.message || 'Erro desconhecido'}

🔗 *Ver detalhes:* ${payload.deployment_url || 'N/A'}

⏰ ${timestamp}
      `.trim();

    case 'test':
      return `
🧪 *Teste de Webhook*

${payload.message || 'Webhook de teste do Coolify'}

⏰ ${timestamp}
      `.trim();

    case 'status_changed':
      return `
🔄 *Status Alterado*

📦 *Aplicação:* ${payload.application_name || 'N/A'}
🏷️ *Status:* ${payload.status || 'N/A'}

${payload.message || ''}

⏰ ${timestamp}
      `.trim();

    case 'backup_success':
      return `
💾 *Backup Concluído!*

📦 *Aplicação:* ${payload.application_name || 'N/A'}
✅ ${payload.message || 'Backup realizado com sucesso'}

⏰ ${timestamp}
      `.trim();

    case 'backup_failed':
    case 'backup_failure':
      return `
💾❌ *Falha no Backup!*

📦 *Aplicação:* ${payload.application_name || payload.resource_name || 'N/A'}
${payload.server_name ? `🖥️ *Servidor:* ${payload.server_name}` : ''}
⚠️ ${payload.message || 'Erro no backup'}

⏰ ${timestamp}
      `.trim();

    case 'scheduled_task_failure':
      return `
⏰❌ *Falha em Tarefa Agendada!*

📦 *Aplicação:* ${payload.application_name || 'N/A'}
📋 *Tarefa:* ${payload.task_name || 'N/A'}
⚠️ ${payload.message || 'Erro ao executar tarefa'}

⏰ ${timestamp}
      `.trim();

    case 'docker_cleanup_failure':
      return `
🐳❌ *Falha na Limpeza Docker!*

${payload.server_name ? `🖥️ *Servidor:* ${payload.server_name}` : ''}
⚠️ ${payload.message || 'Erro ao limpar recursos Docker'}

⏰ ${timestamp}
      `.trim();

    case 'server_disk_usage':
      return `
💿⚠️ *Alerta de Disco!*

🖥️ *Servidor:* ${payload.server_name || 'N/A'}
📊 *Uso:* ${payload.disk_usage || 'N/A'}%
${payload.threshold ? `⚡ *Limite:* ${payload.threshold}%` : ''}

⚠️ ${payload.message || 'Espaço em disco crítico!'}

⏰ ${timestamp}
      `.trim();

    case 'server_unreachable':
      return `
🔴 *Servidor Inalcançável!*

🖥️ *Servidor:* ${payload.server_name || 'N/A'}
${payload.server_ip ? `🌐 *IP:* ${payload.server_ip}` : ''}
⚠️ ${payload.message || 'Servidor não está respondendo'}

⏰ ${timestamp}
      `.trim();

    default:
      // Mensagem genérica para eventos desconhecidos
      return `
🔔 *Notificação Coolify*

${payload.message || 'Notificação recebida'}

📌 *Evento:* ${event}
${payload.application_name ? `📦 *App:* ${payload.application_name}` : ''}
${payload.project ? `🏷️ *Projeto:* ${payload.project}` : ''}

⏰ ${timestamp}
      `.trim();
  }
}

// Main notify webhook
fastify.post('/notify', async (request, reply) => {
  // Log do webhook recebido
  fastify.log.info({
    event: 'webhook_received',
    payload: request.body,
    timestamp: new Date().toISOString()
  });

  // Monta a mensagem do WhatsApp baseada no tipo de evento
  const whatsappMessage = formatWhatsAppMessage(request.body);

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

