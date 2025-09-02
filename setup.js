#!/usr/bin/env node

/**
 * 🚀 Setup Script - Incode Academy Lead System
 * Script automático para configurar e inicializar o projeto
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Cores para output colorido
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

const log = {
    info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    warn: (msg) => console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    title: (msg) => console.log(`${colors.cyan}${colors.bright}🎓 ${msg}${colors.reset}\n`)
};

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkNodeVersion() {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 16) {
        log.error(`Node.js ${nodeVersion} detectado. Versão mínima requerida: 16.x`);
        log.info('Atualize o Node.js: https://nodejs.org');
        process.exit(1);
    }
    
    log.success(`Node.js ${nodeVersion} ✓`);
}

async function checkDependencies() {
    log.info('Verificando dependências...');
    
    try {
        // Verificar se package.json existe
        if (!fs.existsSync('package.json')) {
            log.error('package.json não encontrado!');
            process.exit(1);
        }
        
        // Verificar se node_modules existe
        if (!fs.existsSync('node_modules')) {
            log.warn('node_modules não encontrado. Instalando dependências...');
            execSync('npm install', { stdio: 'inherit' });
        }
        
        log.success('Dependências verificadas ✓');
        
    } catch (error) {
        log.error('Erro ao verificar dependências:', error.message);
        process.exit(1);
    }
}

async function checkEnvFile() {
    log.info('Verificando arquivo de configuração...');
    
    const envFile = '.env';
    const envExampleFile = '.env.example';
    
    if (!fs.existsSync(envFile)) {
        if (fs.existsSync(envExampleFile)) {
            fs.copyFileSync(envExampleFile, envFile);
            log.success('Arquivo .env criado a partir do .env.example ✓');
        } else {
            log.warn('Arquivo .env não encontrado e .env.example não existe');
            log.info('Criando .env básico...');
            
            const basicEnv = `PORT=3001
NODE_ENV=development
DATABASE_PATH=./backend/database/leads.db
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:5500
API_RATE_LIMIT=100
N8N_WEBHOOK_URL=https://your-n8n-webhook-url-here
`;
            fs.writeFileSync(envFile, basicEnv);
            log.success('Arquivo .env básico criado ✓');
        }
    } else {
        log.success('Arquivo .env encontrado ✓');
    }
}

async function createDirectories() {
    log.info('Criando diretórios necessários...');
    
    const directories = [
        'backend/database',
        'backend/logs',
        'frontend/assets/images',
        'frontend/assets/fonts'
    ];
    
    directories.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            log.success(`Diretório criado: ${dir}`);
        }
    });
}

async function testDatabase() {
    log.info('Testando conexão com banco de dados...');
    
    try {
        const { initDatabase } = require('./backend/database/init');
        await initDatabase();
        log.success('Banco de dados inicializado ✓');
    } catch (error) {
        log.error('Erro ao inicializar banco:', error.message);
        process.exit(1);
    }
}

async function checkPorts() {
    log.info('Verificando portas disponíveis...');
    
    const net = require('net');
    
    const checkPort = (port) => {
        return new Promise((resolve) => {
            const server = net.createServer();
            server.listen(port, () => {
                server.once('close', () => resolve(true));
                server.close();
            });
            server.on('error', () => resolve(false));
        });
    };
    
    const port = process.env.PORT || 3001;
    const isPortAvailable = await checkPort(port);
    
    if (!isPortAvailable) {
        log.warn(`Porta ${port} está em uso. Considere mudar a variável PORT no .env`);
    } else {
        log.success(`Porta ${port} disponível ✓`);
    }
}

async function showInstructions() {
    console.log(`
${colors.cyan}${colors.bright}🎯 SETUP COMPLETO - PRÓXIMOS PASSOS:${colors.reset}

${colors.green}1. DESENVOLVIMENTO LOCAL:${colors.reset}
   npm run dev          # Iniciar servidor de desenvolvimento
   
${colors.green}2. PRODUÇÃO:${colors.reset}
   npm start           # Iniciar servidor de produção
   
${colors.green}3. CONFIGURAR N8N:${colors.reset}
   - Acesse: https://n8n.cloud
   - Crie um workflow com webhook
   - Atualize N8N_WEBHOOK_URL no arquivo .env
   
${colors.green}4. DEPLOY GRATUITO:${colors.reset}
   - Frontend: Netlify (docs/DEPLOY_GUIDE.md)
   - Backend: Railway (docs/DEPLOY_GUIDE.md)
   
${colors.green}5. PERSONALIZAÇÃO:${colors.reset}
   - Logo: frontend/assets/images/
   - Cores: frontend/css/style.css (variáveis CSS)
   - Textos: frontend/index.html
   
${colors.yellow}📖 DOCUMENTAÇÃO COMPLETA:${colors.reset}
   - README.md - Visão geral
   - docs/N8N_INTEGRATION.md - Integração n8n
   - docs/DEPLOY_GUIDE.md - Deploy gratuito
   
${colors.cyan}🎓 TRANSFORME O FUTURO COM PYTHON! 🐍${colors.reset}
`);
}

async function main() {
    log.title('INCODE ACADEMY - LEAD SYSTEM SETUP');
    
    console.log(`${colors.cyan}Sistema extraordinário de captação de leads${colors.reset}`);
    console.log(`${colors.cyan}Transformando futuros através da programação!${colors.reset}\n`);
    
    try {
        await checkNodeVersion();
        await sleep(500);
        
        await checkDependencies();
        await sleep(500);
        
        await checkEnvFile();
        await sleep(500);
        
        await createDirectories();
        await sleep(500);
        
        await testDatabase();
        await sleep(500);
        
        await checkPorts();
        await sleep(500);
        
        log.success('Setup completo! Sistema pronto para uso! 🚀\n');
        
        await showInstructions();
        
    } catch (error) {
        log.error('Erro durante o setup:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = { main };