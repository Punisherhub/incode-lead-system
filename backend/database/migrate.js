const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { query, initializeTables } = require('./postgres');

// Função para migrar dados do SQLite para PostgreSQL
const migrateFromSQLiteToPostgreSQL = async () => {
    console.log('🔄 Iniciando migração do SQLite para PostgreSQL...');
    
    try {
        // Caminho do banco SQLite
        const sqlitePath = process.env.DATABASE_PATH || 
            (process.env.NODE_ENV === 'production' 
                ? '/app/data/leads.db'
                : path.join(__dirname, '../database/leads.db')
            );
        
        console.log(`📂 Verificando SQLite: ${sqlitePath}`);
        
        // Verificar se o arquivo SQLite existe
        const fs = require('fs');
        if (!fs.existsSync(sqlitePath)) {
            console.log('ℹ️ Arquivo SQLite não encontrado. Criando apenas estrutura PostgreSQL...');
            await initializeTables();
            console.log('✅ Estrutura PostgreSQL criada com sucesso!');
            return;
        }
        
        // Conectar ao SQLite
        const db = new sqlite3.Database(sqlitePath);
        
        // Primeiro, inicializar as tabelas no PostgreSQL
        console.log('🏗️ Inicializando tabelas PostgreSQL...');
        await initializeTables();
        
        // Buscar todos os leads do SQLite
        console.log('📊 Buscando leads do SQLite...');
        const leads = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM leads', (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
        
        console.log(`📋 Encontrados ${leads.length} leads para migrar`);
        
        if (leads.length > 0) {
            // Migrar cada lead
            let migratedCount = 0;
            let errorCount = 0;
            
            for (const lead of leads) {
                try {
                    // Verificar se o lead já existe no PostgreSQL
                    const existingLead = await query(
                        'SELECT id FROM leads WHERE email = $1',
                        [lead.email]
                    );
                    
                    if (existingLead.rows.length > 0) {
                        console.log(`⚠️ Lead ${lead.email} já existe no PostgreSQL, pulando...`);
                        continue;
                    }
                    
                    // Inserir no PostgreSQL
                    const insertQuery = `
                        INSERT INTO leads (
                            nome, email, telefone, idade, curso,
                            ip_address, user_agent, origem, status,
                            data_criacao, data_atualizacao,
                            enviado_n8n, tentativas_n8n, ultimo_erro_n8n
                        ) VALUES (
                            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
                        )
                    `;
                    
                    await query(insertQuery, [
                        lead.nome,
                        lead.email,
                        lead.telefone,
                        lead.idade,
                        lead.curso || 'Python - Interesse Geral',
                        lead.ip_address,
                        lead.user_agent,
                        lead.origem || 'website',
                        lead.status || 'novo',
                        lead.data_criacao || new Date().toISOString(),
                        lead.data_atualizacao || new Date().toISOString(),
                        lead.enviado_n8n || false,
                        lead.tentativas_n8n || 0,
                        lead.ultimo_erro_n8n
                    ]);
                    
                    migratedCount++;
                    console.log(`✅ Lead ${lead.email} migrado com sucesso`);
                    
                } catch (error) {
                    errorCount++;
                    console.error(`❌ Erro ao migrar lead ${lead.email}:`, error.message);
                }
            }
            
            console.log(`📊 Migração concluída:`);
            console.log(`   - Leads migrados: ${migratedCount}`);
            console.log(`   - Erros: ${errorCount}`);
        }
        
        // Buscar analytics do SQLite (se existir)
        console.log('📊 Verificando analytics...');
        const analytics = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM analytics', (err, rows) => {
                if (err) {
                    if (err.message.includes('no such table: analytics')) {
                        console.log('ℹ️ Tabela analytics não existe no SQLite');
                        resolve([]);
                    } else {
                        reject(err);
                    }
                } else {
                    resolve(rows || []);
                }
            });
        });
        
        if (analytics.length > 0) {
            console.log(`📈 Encontrados ${analytics.length} registros de analytics para migrar`);
            
            // Criar tabela analytics no PostgreSQL se não existir
            await query(`
                CREATE TABLE IF NOT EXISTS analytics (
                    id SERIAL PRIMARY KEY,
                    evento VARCHAR(255) NOT NULL,
                    dados JSONB,
                    ip_address INET,
                    user_agent TEXT,
                    data_evento TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            `);
            
            let analyticsCount = 0;
            for (const analytic of analytics) {
                try {
                    await query(`
                        INSERT INTO analytics (evento, dados, ip_address, user_agent, data_evento)
                        VALUES ($1, $2, $3, $4, $5)
                    `, [
                        analytic.evento,
                        analytic.dados,
                        analytic.ip_address,
                        analytic.user_agent,
                        analytic.data_evento || new Date().toISOString()
                    ]);
                    
                    analyticsCount++;
                } catch (error) {
                    console.error(`❌ Erro ao migrar analytic:`, error.message);
                }
            }
            
            console.log(`📈 Analytics migrados: ${analyticsCount}`);
        }
        
        // Fechar conexão SQLite
        db.close();
        
        console.log('🎉 Migração concluída com sucesso!');
        
        // Criar backup do SQLite
        if (leads.length > 0) {
            const backupPath = sqlitePath + '.backup.' + new Date().toISOString().split('T')[0];
            fs.copyFileSync(sqlitePath, backupPath);
            console.log(`💾 Backup do SQLite criado: ${backupPath}`);
        }
        
    } catch (error) {
        console.error('❌ Erro na migração:', error);
        throw error;
    }
};

// Função para testar a migração
const testMigration = async () => {
    try {
        console.log('🧪 Testando conexão PostgreSQL...');
        
        // Testar estatísticas
        const { getStats } = require('./postgres');
        const stats = await getStats();
        
        console.log('📊 Estatísticas PostgreSQL:');
        console.log(`   - Total de leads: ${stats.total}`);
        console.log(`   - Leads hoje: ${stats.hoje}`);
        console.log(`   - Leads esta semana: ${stats.semana}`);
        console.log(`   - Leads este mês: ${stats.mes}`);
        
        if (stats.por_curso && stats.por_curso.length > 0) {
            console.log('📚 Leads por curso:');
            stats.por_curso.forEach(curso => {
                console.log(`   - ${curso.curso}: ${curso.count}`);
            });
        }
        
        console.log('✅ Teste da migração concluído com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
        throw error;
    }
};

// Executar migração se chamado diretamente
if (require.main === module) {
    (async () => {
        try {
            await migrateFromSQLiteToPostgreSQL();
            await testMigration();
            process.exit(0);
        } catch (error) {
            console.error('❌ Erro na execução:', error);
            process.exit(1);
        }
    })();
}

module.exports = {
    migrateFromSQLiteToPostgreSQL,
    testMigration
};