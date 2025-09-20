// Script para inicializar TODAS as tabelas no PostgreSQL do Railway
const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
    console.log('⚠️ DATABASE_URL não configurada. Este script é para PostgreSQL em produção.');
    process.exit(0);
}

console.log('🚀 Iniciando inicialização completa do PostgreSQL...');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function initPostgreSQL() {
    try {
        console.log('✅ Conectando ao PostgreSQL...');
        
        // Tabela LEADS
        const createLeadsTable = `
            CREATE TABLE IF NOT EXISTS leads (
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
                
                -- Novos campos para workshop
                tipo_lead VARCHAR(50) DEFAULT 'geral',
                evento VARCHAR(255),
                dia_evento VARCHAR(10)
            )
        `;
        
        // Tabela ANALYTICS
        const createAnalyticsTable = `
            CREATE TABLE IF NOT EXISTS analytics (
                id SERIAL PRIMARY KEY,
                evento VARCHAR(255) NOT NULL,
                dados TEXT,
                ip_address VARCHAR(45),
                user_agent TEXT,
                data_evento TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo')
            )
        `;
        
        // Executar criação das tabelas
        console.log('📋 Criando tabela LEADS...');
        await pool.query(createLeadsTable);
        console.log('✅ Tabela LEADS criada!');
        
        console.log('📊 Criando tabela ANALYTICS...');
        await pool.query(createAnalyticsTable);
        console.log('✅ Tabela ANALYTICS criada!');
        
        // Criar índices para performance
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email)',
            'CREATE INDEX IF NOT EXISTS idx_leads_data_criacao ON leads(data_criacao)',
            'CREATE INDEX IF NOT EXISTS idx_leads_curso ON leads(curso)',
            'CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)',
            'CREATE INDEX IF NOT EXISTS idx_leads_tipo ON leads(tipo_lead)',
            'CREATE INDEX IF NOT EXISTS idx_analytics_evento ON analytics(evento)',
            'CREATE INDEX IF NOT EXISTS idx_analytics_data ON analytics(data_evento)'
        ];
        
        console.log('🔍 Criando índices...');
        for (const index of indexes) {
            await pool.query(index);
        }
        console.log('✅ Índices criados!');
        
        // Verificar tabelas criadas
        const result = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);
        
        console.log('📋 Tabelas no banco:', result.rows.map(row => row.table_name));
        
        // Verificar colunas da tabela leads
        const columns = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'leads' 
            AND table_schema = 'public'
            ORDER BY ordinal_position
        `);
        
        console.log('📋 Colunas da tabela LEADS:');
        columns.rows.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type})`);
        });
        
        console.log('🎉 PostgreSQL inicializado com sucesso!');
        console.log('✅ Todas as tabelas e índices foram criados!');
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        process.exit(1);
        
    } finally {
        await pool.end();
        console.log('🔌 Conexão encerrada.');
    }
}

// Executar inicialização
initPostgreSQL();