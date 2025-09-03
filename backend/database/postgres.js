const { Pool } = require('pg');

// Configuração do PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    acquireTimeoutMillis: 10000,
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

// Função para adicionar novos campos se não existirem (migração)
const addNewColumnsIfNotExists = async () => {
    try {
        console.log('🔄 Verificando se novos campos precisam ser adicionados...');
        
        // Verificar quais colunas existem
        const result = await query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'leads' 
            AND table_schema = 'public'
        `);
        
        const existingColumns = result.rows.map(row => row.column_name);
        console.log('📋 Colunas existentes no PostgreSQL:', existingColumns);
        
        const newColumns = [
            { name: 'tipo_lead', definition: 'VARCHAR(50) DEFAULT \'geral\'' },
            { name: 'evento', definition: 'VARCHAR(255)' },
            { name: 'dia_evento', definition: 'VARCHAR(10)' }
        ];
        
        const columnsToAdd = newColumns.filter(col => !existingColumns.includes(col.name));
        
        if (columnsToAdd.length === 0) {
            console.log('✅ Schema PostgreSQL já está atualizado!');
            return;
        }
        
        console.log('🆕 Colunas a serem adicionadas no PostgreSQL:', columnsToAdd.map(col => col.name));
        
        // Adicionar colunas
        for (const column of columnsToAdd) {
            try {
                await query(`ALTER TABLE leads ADD COLUMN ${column.name} ${column.definition}`);
                console.log(`✅ Coluna ${column.name} adicionada no PostgreSQL`);
            } catch (error) {
                console.error(`❌ Erro ao adicionar coluna ${column.name}:`, error.message);
            }
        }
        
        // Atualizar registros existentes que não têm tipo_lead
        if (columnsToAdd.some(col => col.name === 'tipo_lead')) {
            await query(`UPDATE leads SET tipo_lead = 'geral' WHERE tipo_lead IS NULL`);
            console.log('✅ Registros existentes atualizados com tipo_lead = "geral"');
        }
        
    } catch (error) {
        console.error('❌ Erro na migração PostgreSQL:', error);
        // Não propagar erro para não quebrar a inicialização
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
                observacoes TEXT,
                tipo_lead VARCHAR(50) DEFAULT 'geral',
                evento VARCHAR(255),
                dia_evento VARCHAR(10)
            )
        `);
        
        // Adicionar novos campos se a tabela já existe (migration)
        await addNewColumnsIfNotExists();
        
        // Criar índices
        await query(`
            CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
            CREATE INDEX IF NOT EXISTS idx_leads_data_criacao ON leads(data_criacao);
            CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
            CREATE INDEX IF NOT EXISTS idx_leads_curso ON leads(curso);
            CREATE INDEX IF NOT EXISTS idx_leads_tipo_lead ON leads(tipo_lead);
            CREATE INDEX IF NOT EXISTS idx_leads_evento ON leads(evento);
            CREATE INDEX IF NOT EXISTS idx_leads_dia_evento ON leads(dia_evento);
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
        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as current_time');
        client.release();
        console.log('✅ Conexão PostgreSQL testada:', result.rows[0].current_time);
        return true;
    } catch (error) {
        console.error('❌ Erro ao testar conexão PostgreSQL:', error.message);
        return false;
    }
};

// Função para obter estatísticas
const getStats = async () => {
    try {
        const queries = {
            total: 'SELECT COUNT(*) as count FROM leads',
            hoje: `SELECT COUNT(*) as count FROM leads 
                   WHERE DATE(data_criacao AT TIME ZONE 'America/Sao_Paulo') = 
                   DATE(NOW() AT TIME ZONE 'America/Sao_Paulo')`,
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
                results[key] = result.rows.map(row => ({
                    ...row,
                    count: parseInt(row.count)
                }));
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