// Migration para sistema de participações múltiplas
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'leads.db');

const migrationParticipacoes = () => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);

        // Criar tabela de participações
        const createParticipacoes = `
            CREATE TABLE IF NOT EXISTS participacoes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                lead_id INTEGER NOT NULL,
                evento_nome TEXT NOT NULL,
                evento_data TEXT,
                tipo_evento TEXT DEFAULT 'sorteio',
                data_participacao DATETIME DEFAULT CURRENT_TIMESTAMP,
                ip_address TEXT,
                user_agent TEXT,
                metadata TEXT,
                FOREIGN KEY (lead_id) REFERENCES leads (id) ON DELETE CASCADE
            )
        `;

        // Criar índices para performance
        const createIndexes = [
            'CREATE INDEX IF NOT EXISTS idx_participacoes_lead_id ON participacoes(lead_id)',
            'CREATE INDEX IF NOT EXISTS idx_participacoes_evento ON participacoes(evento_nome)',
            'CREATE INDEX IF NOT EXISTS idx_participacoes_data ON participacoes(data_participacao)',
            'CREATE INDEX IF NOT EXISTS idx_participacoes_tipo ON participacoes(tipo_evento)'
        ];

        console.log('🔄 Criando tabela de participações...');

        db.run(createParticipacoes, (err) => {
            if (err) {
                console.error('❌ Erro ao criar tabela participacoes:', err);
                reject(err);
                return;
            }

            console.log('✅ Tabela participacoes criada com sucesso!');

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
                        console.log('✅ Índices criados com sucesso!');

                        db.close((err) => {
                            if (err) {
                                reject(err);
                            } else {
                                console.log('✅ Migration de participações concluída!');
                                resolve();
                            }
                        });
                    }
                });
            });
        });
    });
};

// Executar migration se o arquivo for executado diretamente
if (require.main === module) {
    migrationParticipacoes()
        .then(() => {
            console.log('🎉 Migration executada com sucesso!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Erro na migration:', error);
            process.exit(1);
        });
}

module.exports = { migrationParticipacoes };