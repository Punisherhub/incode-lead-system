// Script para atualizar schema do banco de dados com novos campos workshop
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

// Caminho para o banco de dados
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'leads.db');

console.log('🔄 Iniciando atualização do schema do banco de dados...');
console.log('📂 Banco de dados:', DB_PATH);

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Erro ao conectar com SQLite:', err);
        process.exit(1);
    }
    
    console.log('✅ Conectado ao banco SQLite');
    updateSchema();
});

function updateSchema() {
    // Verificar se as colunas já existem
    db.all("PRAGMA table_info(leads)", (err, columns) => {
        if (err) {
            console.error('❌ Erro ao obter informações da tabela:', err);
            db.close();
            process.exit(1);
        }
        
        const existingColumns = columns.map(col => col.name);
        console.log('📋 Colunas existentes:', existingColumns);
        
        const newColumns = [
            { name: 'tipo_lead', type: 'TEXT DEFAULT "geral"' },
            { name: 'evento', type: 'TEXT' },
            { name: 'dia_evento', type: 'TEXT' }
        ];
        
        let columnsToAdd = newColumns.filter(col => !existingColumns.includes(col.name));
        
        if (columnsToAdd.length === 0) {
            console.log('✅ Schema já está atualizado!');
            db.close();
            return;
        }
        
        console.log('🆕 Colunas a serem adicionadas:', columnsToAdd.map(col => col.name));
        
        // Adicionar colunas uma por uma
        let addedCount = 0;
        
        columnsToAdd.forEach(column => {
            const alterQuery = `ALTER TABLE leads ADD COLUMN ${column.name} ${column.type}`;
            
            db.run(alterQuery, (err) => {
                if (err) {
                    console.error(`❌ Erro ao adicionar coluna ${column.name}:`, err);
                } else {
                    console.log(`✅ Coluna ${column.name} adicionada com sucesso`);
                }
                
                addedCount++;
                
                if (addedCount === columnsToAdd.length) {
                    // Todas as colunas foram processadas
                    updateExistingRecords();
                }
            });
        });
    });
}

function updateExistingRecords() {
    console.log('🔄 Atualizando registros existentes...');
    
    // Atualizar registros que não têm tipo_lead definido
    db.run(`UPDATE leads SET tipo_lead = 'geral' WHERE tipo_lead IS NULL`, (err) => {
        if (err) {
            console.error('❌ Erro ao atualizar registros:', err);
        } else {
            console.log('✅ Registros existentes atualizados com tipo_lead = "geral"');
        }
        
        // Criar novos índices
        createNewIndexes();
    });
}

function createNewIndexes() {
    console.log('🔄 Criando novos índices...');
    
    const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_leads_tipo_lead ON leads(tipo_lead)',
        'CREATE INDEX IF NOT EXISTS idx_leads_evento ON leads(evento)',
        'CREATE INDEX IF NOT EXISTS idx_leads_dia_evento ON leads(dia_evento)'
    ];
    
    let indexCount = 0;
    
    indexes.forEach(indexQuery => {
        db.run(indexQuery, (err) => {
            if (err) {
                console.error('❌ Erro ao criar índice:', err);
            } else {
                console.log('✅ Índice criado com sucesso');
            }
            
            indexCount++;
            
            if (indexCount === indexes.length) {
                console.log('🎉 Atualização do schema concluída com sucesso!');
                db.close();
            }
        });
    });
}

// Tratamento de erros
process.on('uncaughtException', (error) => {
    console.error('❌ Erro não capturado:', error);
    if (db) db.close();
    process.exit(1);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Interrompido pelo usuário');
    if (db) db.close();
    process.exit(0);
});