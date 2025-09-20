// Migration para corrigir schema PostgreSQL em produção
const { query } = require('./postgres');

const fixPostgresSchema = async () => {
    try {
        console.log('🔄 Corrigindo schema PostgreSQL em produção...');

        // Verificar e adicionar colunas que faltam na tabela leads
        console.log('📋 Verificando colunas da tabela leads...');

        // Lista de colunas que devem existir
        const requiredColumns = [
            { name: 'ultimo_envio_data', type: 'TEXT' },
            { name: 'ultimo_envio_dia', type: 'TEXT' },
            { name: 'ultimo_envio_hora', type: 'TEXT' },
            { name: 'total_envios', type: 'INTEGER DEFAULT 0' },
            { name: 'tipo_lead', type: 'VARCHAR(50) DEFAULT \'geral\'' },
            { name: 'evento', type: 'TEXT' },
            { name: 'dia_evento', type: 'TEXT' }
        ];

        // Verificar quais colunas existem
        const existingColumns = await query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'leads' AND table_schema = 'public'
        `);

        const existingColumnNames = existingColumns.rows.map(row => row.column_name);
        console.log('✅ Colunas existentes:', existingColumnNames);

        // Adicionar colunas que faltam
        for (const column of requiredColumns) {
            if (!existingColumnNames.includes(column.name)) {
                console.log(`➕ Adicionando coluna: ${column.name}`);
                await query(`ALTER TABLE leads ADD COLUMN ${column.name} ${column.type}`);
                console.log(`✅ Coluna ${column.name} adicionada com sucesso!`);
            } else {
                console.log(`⚠️  Coluna ${column.name} já existe, pulando...`);
            }
        }

        // Verificar se tabela participacoes existe, se não, criar
        console.log('📋 Verificando tabela participacoes...');

        const participacoesExists = await query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'participacoes'
            )
        `);

        if (!participacoesExists.rows[0].exists) {
            console.log('➕ Criando tabela participacoes...');
            await query(`
                CREATE TABLE participacoes (
                    id SERIAL PRIMARY KEY,
                    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
                    evento_nome VARCHAR(255) NOT NULL,
                    evento_data DATE,
                    tipo_evento VARCHAR(100) DEFAULT 'sorteio',
                    data_participacao TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
                    metadata JSONB,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo')
                )
            `);

            // Criar índices para performance
            await query(`CREATE INDEX idx_participacoes_lead_id ON participacoes(lead_id)`);
            await query(`CREATE INDEX idx_participacoes_evento ON participacoes(evento_nome)`);
            await query(`CREATE INDEX idx_participacoes_data ON participacoes(data_participacao)`);

            console.log('✅ Tabela participacoes criada com sucesso!');
        } else {
            console.log('⚠️  Tabela participacoes já existe, pulando...');
        }

        // Atualizar valores padrão para colunas que podem estar NULL
        console.log('🔄 Atualizando valores padrão...');

        await query(`UPDATE leads SET total_envios = 0 WHERE total_envios IS NULL`);
        await query(`UPDATE leads SET tipo_lead = 'geral' WHERE tipo_lead IS NULL`);

        console.log('✅ Schema PostgreSQL corrigido com sucesso!');
        console.log('📝 Todas as colunas necessárias agora existem na produção.');

    } catch (error) {
        console.error('❌ Erro ao corrigir schema PostgreSQL:', error);
        throw error;
    }
};

// Executar migration se o arquivo for executado diretamente
if (require.main === module) {
    fixPostgresSchema()
        .then(() => {
            console.log('🎉 Migration de schema PostgreSQL executada com sucesso!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Erro na migration de schema:', error);
            process.exit(1);
        });
}

module.exports = { fixPostgresSchema };