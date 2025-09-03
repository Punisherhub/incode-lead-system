// Script para migrar PostgreSQL em produção com novos campos workshop
const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
    console.log('⚠️ DATABASE_URL não configurada. Este script é para PostgreSQL em produção.');
    process.exit(0);
}

console.log('🔄 Iniciando migração do PostgreSQL...');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function migratePostgreSQL() {
    try {
        console.log('✅ Conectando ao PostgreSQL...');
        
        // Verificar quais colunas existem
        const result = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'leads' 
            AND table_schema = 'public'
        `);
        
        const existingColumns = result.rows.map(row => row.column_name);
        console.log('📋 Colunas existentes:', existingColumns);
        
        const newColumns = [
            { name: 'tipo_lead', definition: 'VARCHAR(50) DEFAULT \'geral\'' },
            { name: 'evento', definition: 'VARCHAR(255)' },
            { name: 'dia_evento', definition: 'VARCHAR(10)' }
        ];
        
        const columnsToAdd = newColumns.filter(col => !existingColumns.includes(col.name));
        
        if (columnsToAdd.length === 0) {
            console.log('✅ Schema PostgreSQL já está atualizado!');
            pool.end();
            return;
        }
        
        console.log('🆕 Colunas a serem adicionadas:', columnsToAdd.map(col => col.name));
        
        // Iniciar transação
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Adicionar colunas
            for (const column of columnsToAdd) {
                try {
                    await client.query(`ALTER TABLE leads ADD COLUMN ${column.name} ${column.definition}`);
                    console.log(`✅ Coluna ${column.name} adicionada com sucesso`);
                } catch (error) {
                    console.error(`❌ Erro ao adicionar coluna ${column.name}:`, error.message);
                    throw error;
                }
            }
            
            // Atualizar registros existentes
            if (columnsToAdd.some(col => col.name === 'tipo_lead')) {
                const updateResult = await client.query(`
                    UPDATE leads 
                    SET tipo_lead = 'geral' 
                    WHERE tipo_lead IS NULL
                `);
                console.log(`✅ ${updateResult.rowCount} registros atualizados com tipo_lead = "geral"`);
            }
            
            // Criar novos índices
            const indexes = [
                'CREATE INDEX IF NOT EXISTS idx_leads_tipo_lead ON leads(tipo_lead)',
                'CREATE INDEX IF NOT EXISTS idx_leads_evento ON leads(evento)',
                'CREATE INDEX IF NOT EXISTS idx_leads_dia_evento ON leads(dia_evento)'
            ];
            
            for (const indexQuery of indexes) {
                try {
                    await client.query(indexQuery);
                    console.log('✅ Índice criado com sucesso');
                } catch (error) {
                    console.log('⚠️ Erro ao criar índice (pode já existir):', error.message);
                }
            }
            
            await client.query('COMMIT');
            console.log('🎉 Migração PostgreSQL concluída com sucesso!');
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Erro na migração:', error);
        process.exit(1);
    } finally {
        pool.end();
    }
}

// Executar migração
migratePostgreSQL();