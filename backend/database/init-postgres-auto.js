// Script para inicializar PostgreSQL automaticamente no startup do Railway
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
    console.log('⚠️ DATABASE_URL não configurada.');
    process.exit(0);
}

console.log('🚀 Auto-inicializando PostgreSQL...');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function autoInitPostgreSQL() {
    try {
        // Verificar se tabelas já existem
        const tablesResult = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_name IN ('leads', 'analytics')
        `);
        
        const existingTables = tablesResult.rows.map(row => row.table_name);
        console.log('📋 Tabelas existentes:', existingTables);
        
        if (existingTables.includes('leads') && existingTables.includes('analytics')) {
            console.log('✅ PostgreSQL já inicializado!');
            return; // pool.end() será chamado no finally
        }
        
        console.log('🔧 Criando tabelas em falta...');
        
        // Tabela LEADS
        if (!existingTables.includes('leads')) {
            const createLeadsTable = `
                CREATE TABLE leads (
                    id SERIAL PRIMARY KEY,
                    nome VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    telefone VARCHAR(20) NOT NULL,
                    idade INTEGER NOT NULL,
                    curso VARCHAR(255) NOT NULL,
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    origem VARCHAR(50) DEFAULT 'website',
                    status VARCHAR(50) DEFAULT 'novo',
                    data_criacao TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
                    data_atualizacao TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
                    enviado_n8n BOOLEAN DEFAULT FALSE,
                    tentativas_n8n INTEGER DEFAULT 0,
                    ultimo_erro_n8n TEXT,
                    tipo_lead VARCHAR(50) DEFAULT 'geral',
                    evento VARCHAR(255),
                    dia_evento VARCHAR(10)
                )
            `;
            
            await pool.query(createLeadsTable);
            console.log('✅ Tabela LEADS criada!');
            
            // Índices para LEADS
            const leadsIndexes = [
                'CREATE INDEX idx_leads_email ON leads(email)',
                'CREATE INDEX idx_leads_data_criacao ON leads(data_criacao)',
                'CREATE INDEX idx_leads_curso ON leads(curso)',
                'CREATE INDEX idx_leads_status ON leads(status)',
                'CREATE INDEX idx_leads_tipo ON leads(tipo_lead)'
            ];
            
            for (const index of leadsIndexes) {
                await pool.query(index);
            }
        }
        
        // Tabela ANALYTICS
        if (!existingTables.includes('analytics')) {
            const createAnalyticsTable = `
                CREATE TABLE analytics (
                    id SERIAL PRIMARY KEY,
                    evento VARCHAR(255) NOT NULL,
                    dados TEXT,
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    data_evento TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo')
                )
            `;
            
            await pool.query(createAnalyticsTable);
            console.log('✅ Tabela ANALYTICS criada!');
            
            // Índices para ANALYTICS
            const analyticsIndexes = [
                'CREATE INDEX idx_analytics_evento ON analytics(evento)',
                'CREATE INDEX idx_analytics_data ON analytics(data_evento)'
            ];
            
            for (const index of analyticsIndexes) {
                await pool.query(index);
            }
        }
        
        console.log('🎉 PostgreSQL auto-inicializado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro na auto-inicialização PostgreSQL:', error.message);
        // Não falhar o startup por causa disso
        
    } finally {
        await pool.end();
    }
}

// Executar inicialização (sem await para não bloquear o startup)
autoInitPostgreSQL().catch(console.error);