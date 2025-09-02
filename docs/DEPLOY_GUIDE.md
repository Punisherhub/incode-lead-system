# 🚀 Guia de Deploy - Incode Academy Lead System

Deploy 100% gratuito usando Netlify + Railway + n8n Cloud.

## 📋 Visão Geral

Este guia te ajudará a colocar o sistema no ar usando apenas serviços gratuitos:

- 🎨 **Frontend**: Netlify (gratuito)
- ⚙️ **Backend**: Railway (gratuito) 
- 🤖 **Automação**: n8n Cloud (gratuito)
- 🗄️ **Banco**: SQLite (incluído no Railway)

## 🎯 Pré-requisitos

- [ ] Conta no GitHub
- [ ] Conta no Netlify
- [ ] Conta no Railway
- [ ] Conta no n8n Cloud (opcional)

## 1️⃣ Deploy do Backend (Railway)

### Passo 1: Preparar Repositório

```bash
# Fazer fork/clone do repositório
git clone https://github.com/seu-usuario/incode-lead-system.git
cd incode-lead-system

# Fazer commit das suas personalizações
git add .
git commit -m "feat: configuração personalizada Incode"
git push origin main
```

### Passo 2: Deploy no Railway

1. **Acesse**: [railway.app](https://railway.app)
2. **Login** com GitHub
3. **New Project** > **Deploy from GitHub repo**
4. **Selecione** seu repositório
5. **Configure** as variáveis de ambiente:

```env
NODE_ENV=production
PORT=3001
DATABASE_PATH=/app/data/leads.db
CORS_ORIGIN=https://seu-dominio-netlify.app
API_RATE_LIMIT=100
N8N_WEBHOOK_URL=https://seu-webhook-n8n.com
```

### Passo 3: Configurar Domínio

1. Em **Settings** > **Environment**
2. **Generate Domain**
3. **Anote a URL**: `https://incode-leads-api.railway.app`

## 2️⃣ Deploy do Frontend (Netlify)

### Passo 1: Configurar Build

1. **Acesse**: [netlify.com](https://netlify.com)
2. **New site from Git**
3. **Connect to GitHub** e selecione seu repo
4. **Configure build**:

```
Build command: echo 'Static site ready'
Publish directory: frontend
```

### Passo 2: Configurar Variáveis

Em **Site settings** > **Environment variables**:

```env
NODE_VERSION=18
API_URL=https://sua-api-railway.com
```

### Passo 3: Configurar Domínio

1. **Site settings** > **Domain management**
2. **Add custom domain** (opcional)
3. **Anote a URL**: `https://incode-academy-leads.netlify.app`

## 3️⃣ Configurar n8n (Opcional)

### Opção A: n8n Cloud (Recomendado)

1. **Acesse**: [n8n.cloud](https://n8n.cloud)
2. **Crie conta gratuita** (5000 execuções/mês)
3. **Create workflow**
4. **Add Webhook node**:
   - Method: POST
   - Path: `/webhook/incode-leads`
5. **Copie webhook URL**
6. **Atualize** variável `N8N_WEBHOOK_URL` no Railway

### Opção B: n8n Self-Hosted (Railway)

```bash
# Criar novo projeto Railway para n8n
# Deploy direto: railway-n8n-template
```

### Workflow Básico

Importe este workflow no n8n:

```json
{
  "name": "Incode Leads Workflow",
  "nodes": [
    {
      "parameters": {
        "path": "incode-leads",
        "options": {}
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300]
    },
    {
      "parameters": {
        "fromEmail": "noreply@incodeacademy.com",
        "toEmail": "={{ $json.email }}",
        "subject": "🎉 Bem-vindo à Incode Academy!",
        "emailType": "html",
        "message": "Olá {{ $json.nome }}, obrigado pelo interesse no {{ $json.curso }}!"
      },
      "name": "Send Welcome Email",
      "type": "n8n-nodes-base.emailSend",
      "position": [450, 300]
    }
  ]
}
```

## 4️⃣ Configurar Domínio Próprio (Opcional)

### Netlify Custom Domain

1. **Compre domínio** (Namecheap, GoDaddy, etc.)
2. **Netlify** > **Domain settings** > **Add custom domain**
3. **Configure DNS**:

```
Type: CNAME
Name: www
Value: seu-site.netlify.app

Type: A
Name: @
Value: 75.2.60.5
```

### Railway Custom Domain

1. **Upgrade para Pro** ($5/mês - opcional)
2. **Settings** > **Domains** > **Custom Domain**

## 5️⃣ SSL e Segurança

### Netlify (Automático)

- SSL automático via Let's Encrypt
- HTTPS forçado por padrão

### Railway (Automático)

- SSL automático para domínios .railway.app
- Para domínio próprio: certificado automático

## 6️⃣ Testes Pós-Deploy

### Checklist de Testes

```bash
# 1. Testar API Health
curl https://sua-api.railway.app/api/health

# 2. Testar Frontend
curl -I https://seu-site.netlify.app

# 3. Testar submissão de lead
curl -X POST https://sua-api.railway.app/api/leads \
  -H "Content-Type: application/json" \
  -d '{"nome":"Teste","email":"teste@teste.com","telefone":"11999999999","idade":25,"curso":"Python Básico"}'

# 4. Testar webhook n8n
curl -X POST https://seu-webhook-n8n.com \
  -H "Content-Type: application/json" \
  -d '{"teste": true}'
```

### Dashboard de Monitoramento

Acesse: `https://sua-api.railway.app/api/leads/stats`

## 7️⃣ Configurações Avançadas

### Analytics (Opcional)

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_TRACKING_ID');
</script>
```

### Facebook Pixel (Opcional)

```html
<!-- Facebook Pixel -->
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'YOUR_PIXEL_ID');
  fbq('track', 'PageView');
</script>
```

## 8️⃣ Monitoramento e Manutenção

### Logs Railway

```bash
# Ver logs em tempo real
railway logs --follow

# Ver logs de erro
railway logs --filter error
```

### Backup Automático

Crie workflow n8n para backup diário:

```json
{
  "nodes": [
    {
      "name": "Daily Trigger",
      "type": "n8n-nodes-base.cron",
      "parameters": {
        "triggerTimes": {
          "hour": 2,
          "minute": 0
        }
      }
    },
    {
      "name": "Export Leads",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://sua-api.railway.app/api/leads/export/csv"
      }
    }
  ]
}
```

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. CORS Error
```javascript
// No Railway, verificar variável CORS_ORIGIN
CORS_ORIGIN=https://seu-site.netlify.app,https://outro-dominio.com
```

#### 2. 404 no Frontend
```toml
# netlify.toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### 3. Database não inicializa
```bash
# Verificar permissões de escrita
chmod 755 /app/backend/database/
```

#### 4. Webhook n8n não funciona
- Verificar URL no .env
- Testar conectividade: `ping seu-n8n-domain.com`
- Verificar logs do Railway

### Comandos Úteis

```bash
# Railway CLI
npm install -g @railway/cli
railway login
railway deploy
railway logs
railway shell

# Netlify CLI
npm install -g netlify-cli
netlify deploy
netlify logs
netlify open
```

## 💰 Custos e Limites Gratuitos

### Netlify Free
- ✅ 100GB bandwidth/mês
- ✅ 300 build minutes/mês  
- ✅ Domínio personalizado
- ✅ SSL automático

### Railway Free (Hobbyist)
- ✅ $5 crédito/mês
- ✅ Até 500h CPU/mês
- ✅ 1GB RAM
- ✅ 1GB storage

### n8n Cloud Free
- ✅ 5,000 execuções/mês
- ✅ 2 workflows ativos

## 📈 Upgrade Path

### Quando escalar?

**Netlify Pro ($19/mês)**:
- Mais bandwidth
- Analytics avançado
- Formulários

**Railway Pro ($5/mês)**:
- Mais recursos
- Domínio personalizado
- Prioridade no suporte

**n8n Cloud Starter ($20/mês)**:
- 30,000 execuções/mês
- Workflows ilimitados

## ✅ Checklist Final

- [ ] Backend no Railway funcionando
- [ ] Frontend no Netlify funcionando  
- [ ] SSL ativo em ambos
- [ ] n8n configurado (opcional)
- [ ] Teste de submissão completo
- [ ] Analytics configurado (opcional)
- [ ] Backup configurado (opcional)
- [ ] Documentação atualizada
- [ ] Equipe treinada

## 🆘 Suporte

### Canais de Ajuda

- **Railway**: [discord.gg/railway](https://discord.gg/railway)
- **Netlify**: [community.netlify.com](https://community.netlify.com)
- **n8n**: [community.n8n.io](https://community.n8n.io)

### Logs de Debug

```javascript
// Ativar logs detalhados
DEBUG=* npm start

// Logs específicos
DEBUG=incode:* npm start
```

---

## 🎉 Parabéns!

Seu sistema extraordinário de captação de leads está no ar! 🚀

**URLs de acesso**:
- 🎨 Frontend: https://seu-site.netlify.app
- ⚙️ API: https://sua-api.railway.app
- 📊 Stats: https://sua-api.railway.app/api/leads/stats

**Próximos passos**:
1. Compartilhe com sua equipe
2. Configure domínio próprio
3. Implemente analytics avançado
4. Configure automações n8n
5. Colete feedback dos usuários

---
**🎓 Sistema desenvolvido com ❤️ para Incode Academy**