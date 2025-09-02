# Dockerfile para Incode Academy Lead System
# Imagem otimizada para produção

# Usar Node.js LTS Alpine (menor tamanho)
FROM node:18-alpine

# Metadados
LABEL maintainer="Incode Academy <contato@incodeacademy.com>"
LABEL description="Sistema extraordinário de captação de leads"
LABEL version="1.0.0"

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs
RUN adduser -S incode -u 1001

# Diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências de produção
RUN npm ci --only=production && npm cache clean --force

# Copiar código da aplicação
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Criar diretórios necessários
RUN mkdir -p backend/database backend/logs

# Definir permissões
RUN chown -R incode:nodejs /app

# Mudar para usuário não-root
USER incode

# Expor porta
EXPOSE 3001

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_PATH=./backend/database/leads.db

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { \
    process.exit(res.statusCode === 200 ? 0 : 1) \
  }).on('error', () => process.exit(1))"

# Comando de inicialização
CMD ["npm", "start"]

# Multi-stage build para otimização (alternativo)
# FROM node:18-alpine as builder
# WORKDIR /app
# COPY package*.json ./
# RUN npm ci --only=production

# FROM node:18-alpine as runtime
# WORKDIR /app
# COPY --from=builder /app/node_modules ./node_modules
# COPY . .
# USER node
# EXPOSE 3001
# CMD ["npm", "start"]