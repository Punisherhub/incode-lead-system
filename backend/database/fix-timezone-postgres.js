// Migration para corrigir timezone em PostgreSQL
const { query } = require('./postgres');

const fixTimezoneDefaults = async () => {
    try {
        console.log('🔄 Corrigindo defaults de timezone no PostgreSQL...');

        // Alterar defaults da tabela leads
        await query(`
            ALTER TABLE leads
            ALTER COLUMN data_criacao SET DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo')
        `);

        await query(`
            ALTER TABLE leads
            ALTER COLUMN data_atualizacao SET DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo')
        `);

        // Alterar defaults da tabela analytics (se existir)
        try {
            await query(`
                ALTER TABLE analytics
                ALTER COLUMN data_evento SET DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo')
            `);
        } catch (error) {
            console.log('⚠️  Tabela analytics não encontrada, ignorando...');
        }

        // Alterar defaults da tabela participacoes (se existir)
        try {
            await query(`
                ALTER TABLE participacoes
                ALTER COLUMN data_participacao SET DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo')
            `);
        } catch (error) {
            console.log('⚠️  Tabela participacoes não encontrada, ignorando...');
        }

        console.log('✅ Defaults de timezone corrigidos com sucesso!');
        console.log('📝 Agora todas as novas inserções usarão timezone brasileiro automaticamente.');

    } catch (error) {
        console.error('❌ Erro ao corrigir timezone:', error);
        throw error;
    }
};

// Executar migration se o arquivo for executado diretamente
if (require.main === module) {
    fixTimezoneDefaults()
        .then(() => {
            console.log('🎉 Migration de timezone executada com sucesso!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Erro na migration:', error);
            process.exit(1);
        });
}

module.exports = { fixTimezoneDefaults };