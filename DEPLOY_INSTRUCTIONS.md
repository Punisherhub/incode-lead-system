# 🚀 INSTRUÇÕES DE DEPLOY - CORREÇÃO TIMEZONE

## ⚠️ IMPORTANTE: Execute estes comandos APÓS fazer push para git

### 1. 📤 FAZER PUSH PARA GIT
```bash
git push origin master
```

### 2. 🗄️ ATUALIZAR BANCO POSTGRESQL EM PRODUÇÃO

**⚡ COMANDO CRÍTICO - Execute IMEDIATAMENTE após deploy:**

```bash
# Navegar até o diretório do projeto em produção
cd /app  # ou onde estiver o projeto

# Executar script de correção de timezone
node backend/database/fix-timezone-postgres.js
```

### 3. ✅ VERIFICAR SE FUNCIONOU

Após executar o script, teste:
```bash
# Verificar health check
curl https://seudominio.com/api/health

# Criar um lead de teste
curl -X POST https://seudominio.com/api/leads \
  -H "Content-Type: application/json" \
  -d '{"nome":"Teste Deploy","email":"teste.deploy@teste.com","telefone":"11999999999","idade":25,"curso":"Python"}'

# Verificar se o timestamp está correto (deve estar em horário brasileiro)
curl https://seudominio.com/api/leads?page=1&limit=1
```

### 4. 🔧 SE ALGO DER ERRADO

**Rollback rápido:**
```bash
# Se precisar reverter as alterações de timezone
ALTER TABLE leads
ALTER COLUMN data_criacao SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE leads
ALTER COLUMN data_atualizacao SET DEFAULT CURRENT_TIMESTAMP;
```

---

## 📋 CHECKLIST PÓS-DEPLOY

- [ ] ✅ Push para git realizado
- [ ] ✅ Script `fix-timezone-postgres.js` executado
- [ ] ✅ Health check funcionando
- [ ] ✅ Teste de lead novo com timestamp brasileiro
- [ ] ✅ Admin mostrando timestamps corretos
- [ ] ✅ Sistema de sorteio funcionando

---

## 🎯 PARA O SORTEIO DE SEGUNDA-FEIRA

### Acessar:
- **Site**: https://seudominio.com
- **Admin**: https://seudominio.com/admin

### Exportar participantes:
1. Ir para `/admin`
2. Clicar em "Exportar"
3. Escolher formato JSON ou CSV
4. Usar lista para sorteio ao vivo

---

## 🚨 CONTATOS DE EMERGÊNCIA

Se algo der errado no deploy:
1. Verificar logs: `railway logs --follow`
2. Reverter commit se necessário
3. Aplicar rollback no banco

**Sistema testado e aprovado para sorteio! 🎯**