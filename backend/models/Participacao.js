// Modelo de Participação para sistema de eventos múltiplos
const { runQuery, getQuery, allQuery } = require('../database/init');

class Participacao {
    constructor(data) {
        this.lead_id = data.lead_id;
        this.evento_nome = data.evento_nome;
        this.evento_data = data.evento_data;
        this.tipo_evento = data.tipo_evento || 'sorteio';
        this.ip_address = data.ip_address;
        this.user_agent = data.user_agent;
        this.metadata = data.metadata || {};
    }

    // Salvar participação
    async save() {
        try {
            const insertQuery = `
                INSERT INTO participacoes (
                    lead_id, evento_nome, evento_data, tipo_evento,
                    ip_address, user_agent, metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            const params = [
                this.lead_id,
                this.evento_nome,
                this.evento_data,
                this.tipo_evento,
                this.ip_address,
                this.user_agent,
                JSON.stringify(this.metadata)
            ];

            const result = await runQuery(insertQuery, params);

            return {
                id: result.id,
                success: true,
                message: 'Participação registrada com sucesso!'
            };

        } catch (error) {
            console.error('Erro ao salvar participação:', error);
            throw error;
        }
    }

    // Verificar se já participou de um evento específico
    static async jaParticipou(leadId, eventoNome) {
        try {
            const query = `
                SELECT id FROM participacoes
                WHERE lead_id = ? AND evento_nome = ?
                LIMIT 1
            `;

            const result = await getQuery(query, [leadId, eventoNome]);
            return !!result;

        } catch (error) {
            console.error('Erro ao verificar participação:', error);
            throw error;
        }
    }

    // Buscar participações de um lead
    static async buscarPorLead(leadId) {
        try {
            const query = `
                SELECT * FROM participacoes
                WHERE lead_id = ?
                ORDER BY data_participacao DESC
            `;

            const result = await allQuery(query, [leadId]);
            return result;

        } catch (error) {
            console.error('Erro ao buscar participações do lead:', error);
            throw error;
        }
    }

    // Buscar participações de um evento
    static async buscarPorEvento(eventoNome) {
        try {
            const query = `
                SELECT p.*, l.nome, l.email, l.telefone, l.idade
                FROM participacoes p
                JOIN leads l ON p.lead_id = l.id
                WHERE p.evento_nome = ?
                ORDER BY p.data_participacao DESC
            `;

            const result = await allQuery(query, [eventoNome]);
            return result;

        } catch (error) {
            console.error('Erro ao buscar participações do evento:', error);
            throw error;
        }
    }

    // Listar todos os eventos
    static async listarEventos() {
        try {
            const query = `
                SELECT
                    evento_nome,
                    evento_data,
                    tipo_evento,
                    COUNT(*) as total_participacoes,
                    MIN(data_participacao) as primeira_participacao,
                    MAX(data_participacao) as ultima_participacao
                FROM participacoes
                GROUP BY evento_nome, evento_data, tipo_evento
                ORDER BY MAX(data_participacao) DESC
            `;

            const result = await allQuery(query);
            return result;

        } catch (error) {
            console.error('Erro ao listar eventos:', error);
            throw error;
        }
    }

    // Estatísticas de participações
    static async getEstatisticas() {
        try {
            const queries = {
                total_participacoes: 'SELECT COUNT(*) as count FROM participacoes',
                participacoes_hoje: 'SELECT COUNT(*) as count FROM participacoes WHERE DATE(data_participacao) = DATE("now")',
                participacoes_semana: 'SELECT COUNT(*) as count FROM participacoes WHERE data_participacao >= datetime("now", "-7 days")',
                eventos_ativos: 'SELECT COUNT(DISTINCT evento_nome) as count FROM participacoes',
                leads_participantes: 'SELECT COUNT(DISTINCT lead_id) as count FROM participacoes'
            };

            const stats = {};

            for (const [key, query] of Object.entries(queries)) {
                const result = await getQuery(query);
                stats[key] = result.count;
            }

            // Top eventos
            const topEventos = await allQuery(`
                SELECT evento_nome, COUNT(*) as participacoes
                FROM participacoes
                GROUP BY evento_nome
                ORDER BY participacoes DESC
                LIMIT 5
            `);

            stats.top_eventos = topEventos;

            return stats;

        } catch (error) {
            console.error('Erro ao obter estatísticas de participações:', error);
            throw error;
        }
    }

    // Remover participação
    static async remover(id) {
        try {
            const deleteQuery = 'DELETE FROM participacoes WHERE id = ?';
            const result = await runQuery(deleteQuery, [id]);

            if (result.changes === 0) {
                throw new Error('Participação não encontrada');
            }

            return { success: true, message: 'Participação removida com sucesso' };

        } catch (error) {
            console.error('Erro ao remover participação:', error);
            throw error;
        }
    }
}

module.exports = Participacao;