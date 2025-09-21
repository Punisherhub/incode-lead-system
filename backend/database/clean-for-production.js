const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

console.log('🧹 LIMPEZA PARA PRODUÇÃO - Incode Academy Lead System');
console.log('====================================================');

// Caminho do banco
const dbPath = path.join(__dirname, 'leads.db');

// Verificar se banco existe
if (!fs.existsSync(dbPath)) {
    console.log('❌ Banco de dados não encontrado!');
    process.exit(1);
}

// Conectar ao banco
const db = new sqlite3.Database(dbPath);

// Verificar dados atuais
db.get('SELECT COUNT(*) as count FROM leads', (err, leadsRow) => {
    if (err) {
        console.error('❌ Erro ao verificar leads:', err.message);
        process.exit(1);
    }

    db.get('SELECT COUNT(*) as count FROM participacoes', (err, participacoesRow) => {
        if (err) {
            console.error('❌ Erro ao verificar participações:', err.message);
            process.exit(1);
        }

        console.log(`📊 DADOS ATUAIS:`);
        console.log(`   → Leads: ${leadsRow.count}`);
        console.log(`   → Participações: ${participacoesRow.count}`);

        if (leadsRow.count === 0 && participacoesRow.count === 0) {
            console.log('✅ Banco já está limpo!');
            db.close();
            return;
        }

        console.log('\n🧹 INICIANDO LIMPEZA...');

        // Backup automático antes da limpeza
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        const backupPath = path.join(__dirname, `leads_backup_pre_clean_${timestamp}.db`);

        try {
            fs.copyFileSync(dbPath, backupPath);
            console.log(`✅ Backup criado: leads_backup_pre_clean_${timestamp}.db`);
        } catch (err) {
            console.log(`⚠️ Erro no backup: ${err.message}`);
        }

        // Executar limpeza em sequência
        db.serialize(() => {
            // Limpar participações primeiro (foreign key)
            db.run('DELETE FROM participacoes', (err) => {
                if (err) {
                    console.error('❌ Erro ao limpar participações:', err.message);
                } else {
                    console.log('🗑️ Participações removidas');
                }
            });

            // Limpar leads
            db.run('DELETE FROM leads', (err) => {
                if (err) {
                    console.error('❌ Erro ao limpar leads:', err.message);
                } else {
                    console.log('🗑️ Leads removidos');
                }
            });

            // Reset dos auto-increment
            db.run('DELETE FROM sqlite_sequence WHERE name IN ("leads", "participacoes")', (err) => {
                if (err) {
                    console.error('❌ Erro ao resetar sequence:', err.message);
                } else {
                    console.log('🔄 Auto-increment resetado');
                }
            });

            // Otimizar banco
            db.run('VACUUM', (err) => {
                if (err) {
                    console.error('❌ Erro ao otimizar:', err.message);
                } else {
                    console.log('⚡ Banco otimizado');
                }

                // Verificar limpeza final
                db.get('SELECT COUNT(*) as count FROM leads', (err, finalLeads) => {
                    if (err) {
                        console.error('❌ Erro verificação final:', err.message);
                        process.exit(1);
                    }

                    db.get('SELECT COUNT(*) as count FROM participacoes', (err, finalParticipacoes) => {
                        if (err) {
                            console.error('❌ Erro verificação final:', err.message);
                            process.exit(1);
                        }

                        console.log('\n✅ LIMPEZA CONCLUÍDA!');
                        console.log(`📊 DADOS FINAIS:`);
                        console.log(`   → Leads: ${finalLeads.count}`);
                        console.log(`   → Participações: ${finalParticipacoes.count}`);

                        console.log('\n🚀 SISTEMA PRONTO PARA PRODUÇÃO!');
                        console.log('💡 Próximos passos:');
                        console.log('   1. Testar o sorteio com banco limpo');
                        console.log('   2. Verificar configurações .env');
                        console.log('   3. Fazer deploy para produção');

                        db.close();
                    });
                });
            });
        });
    });
});