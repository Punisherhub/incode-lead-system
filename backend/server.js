const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const leadRoutes = require('./routes/leads');
const configRoutes = require('./routes/config');
const participacoesRoutes = require('./routes/participacoes');
const exportRoutes = require('./routes/export');
const monitor = require('./middleware/monitor');

// Usar PostgreSQL em produção, SQLite em desenvolvimento
let dbModule;
if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
    // Executar inicialização do PostgreSQL automaticamente
    console.log('🔄 Inicializando PostgreSQL...');
    require('./database/init-postgres-auto');
    dbModule = require('./database/postgres');
} else {
    dbModule = require('./database/init');
}

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware de segurança
app.use(helmet({
    contentSecurityPolicy: false, // Permitir recursos externos para desenvolvimento
    crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [
        'http://localhost:3000', 
        'http://127.0.0.1:5500',
        'https://incodeacademy.netlify.app',
        'https://mellow-flan-25d5dd.netlify.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Compressão gzip para reduzir tamanho das respostas
app.use(compression({
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    },
    level: 6,
    threshold: 1024
}));

// Rate limiting otimizado para eventos de alta carga
const eventLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: process.env.NODE_ENV === 'production' ? 200 : 500, // Mais permissivo em dev
    message: {
        error: 'Muitas tentativas. Aguarde 1 minuto.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Em desenvolvimento, usar User-Agent para simular IPs diferentes
        if (process.env.NODE_ENV !== 'production') {
            return req.get('User-Agent') || req.ip;
        }
        return req.ip;
    },
    skip: (req) => {
        // Pular rate limiting para health checks e status
        return req.path === '/api/health' || req.path === '/api/status';
    }
});

// Rate limiting mais permissivo para APIs de leitura
const readLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: process.env.API_RATE_LIMIT || 2000, // Aumentado para eventos
    message: {
        error: 'Muitas tentativas. Tente novamente em 15 minutos.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Aplicar rate limiting específico para endpoints críticos
// Verificar se está em modo evento
const isEventMode = process.env.EVENT_MODE === 'true';

if (!isEventMode) {
    app.use('/api/leads', eventLimiter);
    app.use('/api/participacoes', eventLimiter);
    app.use('/api/', readLimiter);
    console.log('✅ Rate limiting ativado (modo normal)');
} else {
    console.log('🚨 MODO EVENTO: Rate limiting desativado para alta carga!');
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos com cache otimizado
app.use(express.static(path.join(__dirname, '../frontend'), {
    setHeaders: (res, filePath) => {
        const ext = path.extname(filePath);

        // Cache agressivo para assets estáticos
        if (ext === '.css' || ext === '.js' || ext === '.png' || ext === '.jpg' || ext === '.ico') {
            res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 ano
            res.setHeader('ETag', '"' + Date.now() + '"');
        }
        // Cache curto para HTML
        else if (ext === '.html') {
            res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutos
        }
        // Sem cache apenas para arquivos específicos
        else {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }
}));

// Sistema de monitoramento
app.use(monitor.requestMonitor());

// Logging middleware (simplificado, o monitor já faz logs detalhados)
app.use((req, res, next) => {
    // Log apenas para APIs não críticas para reduzir noise
    if (!req.path.includes('/api/leads') && !req.path.includes('/api/participacoes')) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
    }
    next();
});

// Health check endpoint com monitoramento
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        message: 'Incode Academy Lead System is running! 🚀'
    });
});

// Endpoint de status do sistema (monitoramento)
app.get('/api/status', (req, res) => {
    try {
        const status = monitor.getStatus();
        res.json(status);
    } catch (error) {
        res.status(500).json({
            error: 'Erro ao obter status do sistema',
            message: error.message
        });
    }
});

// Endpoint para executar migração PostgreSQL (apenas em produção)
app.get('/api/migrate-schema', async (req, res) => {
    if (process.env.NODE_ENV !== 'production' || !process.env.DATABASE_URL) {
        return res.status(400).json({
            error: 'Migration endpoint only available in production with PostgreSQL',
            timestamp: new Date().toISOString()
        });
    }

    try {
        console.log('🔄 Executando migração de schema via endpoint...');
        const { fixPostgresSchema } = require('./database/fix-postgres-schema');
        await fixPostgresSchema();

        res.json({
            success: true,
            message: 'Schema PostgreSQL corrigido com sucesso! 🎉',
            timestamp: new Date().toISOString(),
            actions: [
                'Colunas total_envios, ultimo_envio_data, ultimo_envio_hora, ultimo_envio_dia adicionadas',
                'Colunas tipo_lead, evento, dia_evento verificadas',
                'Tabela participacoes criada se necessário',
                'Valores padrão atualizados'
            ]
        });
    } catch (error) {
        console.error('❌ Erro na migração via endpoint:', error);
        res.status(500).json({
            error: 'Erro ao executar migração',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// API Routes
app.use('/api/leads', leadRoutes);
app.use('/api/config', configRoutes);
app.use('/api/participacoes', participacoesRoutes);
app.use('/api/export', exportRoutes);

// Webhook endpoint para n8n (será configurado depois)
app.post('/api/webhook/n8n', (req, res) => {
    console.log('Webhook n8n recebido:', req.body);
    res.json({ 
        success: true, 
        message: 'Webhook recebido com sucesso',
        timestamp: new Date().toISOString()
    });
});

// Rotas específicas para páginas HTML
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

app.get('/admin/sorteio', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/sorteio.html'));
});

app.get('/qrcodes', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/qrcodes.html'));
});

app.get('/sorteio', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/sorteio.html'));
});

// Servir a aplicação frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Erro no servidor:', err);
    
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            error: 'Dados JSON inválidos',
            code: 'INVALID_JSON'
        });
    }
    
    if (err.code === 'SQLITE_CONSTRAINT') {
        return res.status(400).json({
            error: 'Dados duplicados ou inválidos',
            code: 'DATA_CONSTRAINT'
        });
    }
    
    res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString()
    });
});

// 404 handler para API
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint não encontrado',
        code: 'ENDPOINT_NOT_FOUND',
        path: req.path
    });
});

// Inicializar banco de dados e servidor
async function startServer() {
    try {
        if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
            // Usar PostgreSQL em produção
            try {
                console.log('🔌 Testando conexão PostgreSQL...');
                const { testConnection, initializeTables } = require('./database/postgres');
                
                const isConnected = await testConnection();
                if (!isConnected) {
                    console.log('⚠️ PostgreSQL não disponível, usando SQLite como fallback');
                    const { initDatabase } = require('./database/init');
                    await initDatabase();
                    console.log('✅ SQLite inicializado com sucesso!');
                    return;
                }
                
                console.log('🏗️ Inicializando tabelas PostgreSQL...');
                await initializeTables();
                
                // Migrar dados do SQLite se necessário
                if (process.env.MIGRATE_FROM_SQLITE === 'true') {
                    try {
                        console.log('📦 Executando migração do SQLite...');
                        const { migrateFromSQLiteToPostgreSQL } = require('./database/migrate');
                        await migrateFromSQLiteToPostgreSQL();
                    } catch (migrationError) {
                        console.log('⚠️ Erro na migração (continuando sem migrar):', migrationError.message);
                    }
                }
                
                console.log('✅ PostgreSQL inicializado com sucesso!');
            } catch (error) {
                console.log('⚠️ Erro com PostgreSQL, usando SQLite como fallback:', error.message);
                const { initDatabase } = require('./database/init');
                await initDatabase();
                console.log('✅ SQLite inicializado como fallback!');
            }
        } else {
            // Usar SQLite em desenvolvimento
            console.log('🔌 Usando SQLite para desenvolvimento...');
            const { initDatabase } = require('./database/init');
            await initDatabase();
            console.log('✅ SQLite inicializado com sucesso!');
        }
        
        // Criar diretório de logs se não existir
        const logsDir = path.join(__dirname, 'logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir);
        }
        
        // Iniciar servidor
        app.listen(PORT, () => {
            console.log(`
🚀 INCODE ACADEMY LEAD SYSTEM
================================
✅ Servidor rodando na porta: ${PORT}
✅ Ambiente: ${process.env.NODE_ENV || 'development'}
✅ Frontend: http://localhost:${PORT}
✅ API Health: http://localhost:${PORT}/api/health
✅ Database: Conectado e pronto!
================================
Sistema extraordinário de captação online! 🎯
            `);
        });
        
    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Encerrando servidor graciosamente...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Servidor encerrado pelo sistema...');
    process.exit(0);
});

// Capturar erros não tratados
process.on('uncaughtException', (error) => {
    console.error('❌ Erro não capturado:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rejeitada não tratada:', reason);
    process.exit(1);
});

startServer();