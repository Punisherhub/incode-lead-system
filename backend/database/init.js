const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Caminho para o banco de dados - usar diretório persistente em produção
const DB_PATH = process.env.DATABASE_PATH || 
    (process.env.NODE_ENV === 'production' 
        ? '/app/data/leads.db'  // Caminho persistente no Railway
        : path.join(__dirname, 'leads.db')  // Local para desenvolvimento
    );

// Garantir que o diretório existe
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

let db = null;

// Inicializar banco de dados
const initDatabase = () => {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('❌ Erro ao conectar com SQLite:', err);
                reject(err);
                return;
            }
            
            console.log('✅ Conectado ao banco SQLite:', DB_PATH);
            
            // Criar tabelas
            createTables()
                .then(() => {
                    console.log('✅ Tabelas criadas/verificadas com sucesso!');
                    resolve();
                })
                .catch(reject);
        });
    });
};

// Criar tabelas necessárias
const createTables = () => {
    return new Promise((resolve, reject) => {
        const createLeadsTable = `
            CREATE TABLE IF NOT EXISTS leads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                telefone TEXT NOT NULL,
                idade INTEGER NOT NULL,
                curso TEXT NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                origem TEXT DEFAULT 'website',
                status TEXT DEFAULT 'novo',
                data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
                data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP,
                enviado_n8n BOOLEAN DEFAULT FALSE,
                tentativas_n8n INTEGER DEFAULT 0,
                ultimo_erro_n8n TEXT
            )
        `;
        
        const createAnalyticsTable = `
            CREATE TABLE IF NOT EXISTS analytics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                evento TEXT NOT NULL,
                dados TEXT,
                ip_address TEXT,
                user_agent TEXT,
                data_evento DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        const createIndexes = [
            'CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email)',
            'CREATE INDEX IF NOT EXISTS idx_leads_data_criacao ON leads(data_criacao)',
            'CREATE INDEX IF NOT EXISTS idx_leads_curso ON leads(curso)',
            'CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)',
            'CREATE INDEX IF NOT EXISTS idx_analytics_evento ON analytics(evento)',
            'CREATE INDEX IF NOT EXISTS idx_analytics_data ON analytics(data_evento)'
        ];
        
        // Executar criação da tabela de leads
        db.run(createLeadsTable, (err) => {
            if (err) {
                console.error('❌ Erro ao criar tabela leads:', err);
                reject(err);
                return;
            }
            
            // Executar criação da tabela de analytics
            db.run(createAnalyticsTable, (err) => {
                if (err) {
                    console.error('❌ Erro ao criar tabela analytics:', err);
                    reject(err);
                    return;
                }
                
                // Criar índices
                let indexCount = 0;
                createIndexes.forEach((indexQuery) => {
                    db.run(indexQuery, (err) => {
                        if (err) {
                            console.error('❌ Erro ao criar índice:', err);
                            reject(err);
                            return;
                        }
                        
                        indexCount++;
                        if (indexCount === createIndexes.length) {
                            // Verificar/atualizar schema se necessário
                            updateSchema()
                                .then(resolve)
                                .catch(reject);
                        }
                    });
                });
            });
        });
    });
};

// Atualizar schema se necessário (migrations)
const updateSchema = () => {
    return new Promise((resolve, reject) => {
        // Verificar se colunas necessárias existem
        db.all("PRAGMA table_info(leads)", (err, columns) => {
            if (err) {
                reject(err);
                return;
            }
            
            const columnNames = columns.map(col => col.name);
            const requiredColumns = [
                { name: 'enviado_n8n', type: 'BOOLEAN DEFAULT FALSE' },
                { name: 'tentativas_n8n', type: 'INTEGER DEFAULT 0' },
                { name: 'ultimo_erro_n8n', type: 'TEXT' }
            ];
            
            let addColumnPromises = [];
            
            requiredColumns.forEach(column => {
                if (!columnNames.includes(column.name)) {
                    const addColumnQuery = `ALTER TABLE leads ADD COLUMN ${column.name} ${column.type}`;
                    
                    addColumnPromises.push(new Promise((resolveCol, rejectCol) => {
                        db.run(addColumnQuery, (err) => {
                            if (err) {
                                console.error(`❌ Erro ao adicionar coluna ${column.name}:`, err);
                                rejectCol(err);
                            } else {
                                console.log(`✅ Coluna ${column.name} adicionada com sucesso!`);
                                resolveCol();
                            }
                        });
                    }));
                }
            });
            
            Promise.all(addColumnPromises)
                .then(() => {
                    console.log('✅ Schema atualizado com sucesso!');
                    resolve();
                })
                .catch(reject);
        });
    });
};

// Função para obter conexão com o banco
const getDatabase = () => {
    if (!db) {
        throw new Error('Banco de dados não inicializado. Chame initDatabase() primeiro.');
    }
    return db;
};

// Função para executar queries com promessa
const runQuery = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ 
                    id: this.lastID, 
                    changes: this.changes 
                });
            }
        });
    });
};

// Função para executar SELECT com promessa
const getQuery = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
};

// Função para executar SELECT ALL com promessa
const allQuery = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

// Fechar conexão com banco
const closeDatabase = () => {
    return new Promise((resolve, reject) => {
        if (db) {
            db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('✅ Conexão com SQLite fechada');
                    resolve();
                }
            });
        } else {
            resolve();
        }
    });
};

// Função de backup do banco
const backupDatabase = (backupPath) => {
    return new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(DB_PATH);
        const writeStream = fs.createWriteStream(backupPath);
        
        readStream.pipe(writeStream);
        
        writeStream.on('finish', () => {
            console.log(`✅ Backup criado: ${backupPath}`);
            resolve();
        });
        
        writeStream.on('error', reject);
        readStream.on('error', reject);
    });
};

// Função para obter estatísticas do banco
const getDatabaseStats = () => {
    return new Promise((resolve, reject) => {
        const queries = [
            { name: 'total_leads', query: 'SELECT COUNT(*) as count FROM leads' },
            { name: 'leads_hoje', query: 'SELECT COUNT(*) as count FROM leads WHERE DATE(data_criacao) = DATE("now")' },
            { name: 'leads_mes', query: 'SELECT COUNT(*) as count FROM leads WHERE strftime("%Y-%m", data_criacao) = strftime("%Y-%m", "now")' },
            { name: 'cursos_populares', query: 'SELECT curso, COUNT(*) as count FROM leads GROUP BY curso ORDER BY count DESC LIMIT 5' }
        ];
        
        const stats = {};
        let completedQueries = 0;
        
        queries.forEach(({ name, query }) => {
            if (name === 'cursos_populares') {
                allQuery(query).then(rows => {
                    stats[name] = rows;
                    completedQueries++;
                    if (completedQueries === queries.length) resolve(stats);
                }).catch(reject);
            } else {
                getQuery(query).then(row => {
                    stats[name] = row.count;
                    completedQueries++;
                    if (completedQueries === queries.length) resolve(stats);
                }).catch(reject);
            }
        });
    });
};

module.exports = {
    initDatabase,
    getDatabase,
    runQuery,
    getQuery,
    allQuery,
    closeDatabase,
    backupDatabase,
    getDatabaseStats
};