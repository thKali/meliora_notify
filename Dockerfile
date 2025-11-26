FROM node:20-alpine

# Metadata
LABEL maintainer="meliora-notify"
LABEL description="API leve de notificações com Fastify"

# Diretório de trabalho
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências (production only)
RUN npm ci --only=production && npm cache clean --force

# Copiar código
COPY index.js ./

# Expor porta
EXPOSE 3000

# Usuário não-root para segurança
USER node

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start
CMD ["node", "index.js"]

