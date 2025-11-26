# Meliora Notify API

API ultra leve de notificações com Fastify + Node.js Alpine.

## 🚀 Features

- ⚡ **Rápido**: Fastify + Node.js Alpine (~50MB)
- 🐳 **Docker**: Pronto para deploy no Coolify
- 📦 **Simples**: Apenas um webhook `/notify`
- 🔍 **Health check**: Endpoint `/health` incluído

## 📡 Endpoints

### POST /notify

Envia uma notificação.

**Request body:**
```json
{
  "title": "Título opcional",
  "message": "Mensagem obrigatória",
  "to": "destinatário opcional"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Notificação recebida e processada",
  "data": {
    "title": "Título opcional",
    "message": "Mensagem obrigatória",
    "to": "destinatário opcional"
  }
}
```

**Response (400):**
```json
{
  "error": "Bad Request",
  "message": "O campo \"message\" é obrigatório"
}
```

### GET /health

Health check para monitoramento.

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2025-11-26T12:00:00.000Z"
}
```

## 🏃 Rodando localmente

```bash
# Instalar dependências
npm install

# Rodar
npm start

# Ou modo dev (com auto-reload no Node 18+)
npm run dev
```

## 🐳 Docker

```bash
# Build
docker build -t meliora-notify .

# Run
docker run -p 3000:3000 meliora-notify
```

## ☁️ Deploy no Coolify

1. Conecte seu repositório Git ao Coolify
2. Coolify detectará o Dockerfile automaticamente
3. Configure a porta 3000
4. Deploy! 🚀

## 🔧 Variáveis de ambiente

- `PORT`: Porta do servidor (default: 3000)
- `HOST`: Host do servidor (default: 0.0.0.0)

## 📝 Exemplo de uso

```bash
curl -X POST http://localhost:3000/notify \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Alerta",
    "message": "Algo importante aconteceu!",
    "to": "admin@example.com"
  }'
```

## 📦 Tamanho

- **Imagem Docker**: ~50-60MB
- **Memória em idle**: ~30-40MB
- **Startup**: ~100ms

## 🔜 Próximos passos

- [ ] Adicionar integração com email (Nodemailer)
- [ ] Adicionar integração com Slack/Discord/Telegram
- [ ] Adicionar autenticação (API Key)
- [ ] Adicionar rate limiting
- [ ] Adicionar fila de processamento (Bull/BullMQ)

