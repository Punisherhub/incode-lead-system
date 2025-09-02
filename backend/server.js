const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const leadRoutes = require('./routes/leads');

// Usar PostgreSQL em produção, SQLite em desenvolvimento
let dbModule;
if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
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

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: process.env.API_RATE_LIMIT || 100, // máximo de requests por IP
    message: {
        error: 'Muitas tentativas. Tente novamente em 15 minutos.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../frontend')));

// Logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        message: 'Incode Academy Lead System is running! 🚀'
    });
});

// API Routes
app.use('/api/leads', leadRoutes);

// Webhook endpoint para n8n (será configurado depois)
app.post('/api/webhook/n8n', (req, res) => {
    console.log('Webhook n8n recebido:', req.body);
    res.json({ 
        success: true, 
        message: 'Webhook recebido com sucesso',
        timestamp: new Date().toISOString()
    });
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