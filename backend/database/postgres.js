const { Pool } = require('pg');

// Configuração do PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Eventos de conexão
pool.on('connect', () => {
    console.log('✅ Conectado ao PostgreSQL');
});

pool.on('error', (err) => {
    console.error('❌ Erro inesperado no PostgreSQL:', err);
    process.exit(-1);
});

// Função para executar queries
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('📊 Query executada', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('❌ Erro na query:', error);
        throw error;
    }
};

// Função para criar tabelas
const initializeTables = async () => {
    try {
        console.log('🏗️ Criando tabelas PostgreSQL...');
        
        // Criar tabela leads
        await query(`
            CREATE TABLE IF NOT EXISTS leads (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                telefone VARCHAR(50) NOT NULL,
                idade INTEGER NOT NULL CHECK (idade >= 12 AND idade <= 99),
                curso VARCHAR(255) DEFAULT 'Python - Interesse Geral',
                ip_address INET,
                user_agent TEXT,
                origem VARCHAR(50) DEFAULT 'website',
                status VARCHAR(50) DEFAULT 'novo',
                data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                enviado_n8n BOOLEAN DEFAULT FALSE,
                tentativas_n8n INTEGER DEFAULT 0,
                ultimo_erro_n8n TEXT,
                observacoes TEXT
            )
        `);
        
        // Criar índices
        await query(`
            CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
            CREATE INDEX IF NOT EXISTS idx_leads_data_criacao ON leads(data_criacao);
            CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
            CREATE INDEX IF NOT EXISTS idx_leads_curso ON leads(curso);
        `);
        
        // Criar trigger para data_atualizacao
        await query(`
            CREATE OR REPLACE FUNCTION update_data_atualizacao()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.data_atualizacao = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
            
            DROP TRIGGER IF EXISTS trigger_update_data_atualizacao ON leads;
            CREATE TRIGGER trigger_update_data_atualizacao
                BEFORE UPDATE ON leads
                FOR EACH ROW
                EXECUTE FUNCTION update_data_atualizacao();
        `);
        
        console.log('✅ Tabelas PostgreSQL criadas/verificadas com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao criar tabelas:', error);
        throw error;
    }
};

// Função para testar conexão
const testConnection = async () => {
    try {
        const result = await query('SELECT NOW() as current_time, version() as pg_version');
        console.log('✅ Conexão PostgreSQL testada:', result.rows[0]);
        return true;
    } catch (error) {
        console.error('❌ Erro ao testar conexão PostgreSQL:', error);
        return false;
    }
};

// Função para obter estatísticas
const getStats = async () => {
    try {
        const queries = {
            total: 'SELECT COUNT(*) as count FROM leads',
            hoje: `SELECT COUNT(*) as count FROM leads 
                   WHERE DATE(data_criacao AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE`,
            semana: `SELECT COUNT(*) as count FROM leads 
                     WHERE data_criacao >= NOW() - INTERVAL '7 days'`,
            mes: `SELECT COUNT(*) as count FROM leads 
                  WHERE DATE_TRUNC('month', data_criacao) = DATE_TRUNC('month', NOW())`,
            por_curso: `SELECT curso, COUNT(*) as count FROM leads 
                       GROUP BY curso ORDER BY count DESC`,
            por_status: `SELECT status, COUNT(*) as count FROM leads 
                        GROUP BY status ORDER BY count DESC`,
            enviados_n8n: 'SELECT COUNT(*) as count FROM leads WHERE enviado_n8n = true'
        };
        
        const results = {};
        
        for (const [key, sql] of Object.entries(queries)) {
            const result = await query(sql);
            if (key === 'por_curso' || key === 'por_status') {
                results[key] = result.rows;
            } else {
                results[key] = parseInt(result.rows[0].count);
            }
        }
        
        return results;
        
    } catch (error) {
        console.error('❌ Erro ao obter estatísticas:', error);
        throw error;
    }
};

// Função de fechamento gracioso
const closePool = async () => {
    try {
        await pool.end();
        console.log('✅ Pool PostgreSQL fechado');
    } catch (error) {
        console.error('❌ Erro ao fechar pool:', error);
    }
};

module.exports = {
    query,
    pool,
    initializeTables,
    testConnection,
    getStats,
    closePool
};