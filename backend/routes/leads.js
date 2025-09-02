const express = require('express');
const Lead = require('../models/Lead');
const { getDatabaseStats } = require('../database/init');
const router = express.Router();

// Middleware para capturar IP e User-Agent
const captureClientInfo = (req, res, next) => {
    req.clientInfo = {
        ip_address: req.ip || req.connection.remoteAddress || 'unknown',
        user_agent: req.get('User-Agent') || 'unknown'
    };
    next();
};

// Aplicar middleware a todas as rotas
router.use(captureClientInfo);

// POST /api/leads - Criar novo lead
router.post('/', async (req, res) => {
    try {
        console.log('📝 Novo lead recebido:', {
            nome: req.body.nome,
            email: req.body.email,
            ip: req.clientInfo.ip_address
        });
        
        // Criar instância do lead com dados do request
        const leadData = {
            ...req.body,
            ip_address: req.clientInfo.ip_address,
            user_agent: req.clientInfo.user_agent,
            origem: 'website'
        };
        
        const lead = new Lead(leadData);
        
        // Salvar lead
        const result = await lead.save();
        
        // Tentar enviar para n8n (não bloquear se falhar)
        try {
            await sendToN8N(result.id, leadData);
        } catch (n8nError) {
            console.error('⚠️  Erro ao enviar para n8n:', n8nError);
            // Não falhar a requisição por causa do n8n
        }
        
        res.status(201).json({
            success: true,
            message: 'Lead cadastrado com sucesso! 🎉',
            data: {
                id: result.id,
                nome: req.body.nome,
                email: req.body.email
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro ao criar lead:', error);
        
        // Determinar status code baseado no erro
        let statusCode = 500;
        let errorMessage = 'Erro interno do servidor';
        
        if (error.message.includes('Dados inválidos')) {
            statusCode = 400;
            errorMessage = error.message;
        } else if (error.message.includes('já cadastrado')) {
            statusCode = 409;
            errorMessage = 'Este email já está cadastrado em nossa base!';
        }
        
        res.status(statusCode).json({
            success: false,
            error: errorMessage,
            code: 'LEAD_CREATION_ERROR',
            timestamp: new Date().toISOString()
        });
    }
});

// GET /api/leads - Listar leads (com paginação e filtros)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        
        // Filtros opcionais
        const filters = {};
        if (req.query.curso) filters.curso = req.query.curso;
        if (req.query.status) filters.status = req.query.status;
        if (req.query.data_inicio) filters.data_inicio = req.query.data_inicio;
        if (req.query.data_fim) filters.data_fim = req.query.data_fim;
        if (req.query.search) filters.search = req.query.search;
        
        const result = await Lead.findAll(page, limit, filters);
        
        res.json({
            success: true,
            data: result.leads,
            pagination: result.pagination,
            filters: filters,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro ao listar leads:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao carregar leads',
            code: 'LEADS_FETCH_ERROR'
        });
    }
});

// GET /api/leads/stats - Obter estatísticas
router.get('/stats', async (req, res) => {
    try {
        const [leadStats, dbStats] = await Promise.all([
            Lead.getStats(),
            getDatabaseStats()
        ]);
        
        res.json({
            success: true,
            data: {
                ...leadStats,
                database: dbStats
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro ao obter estatísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao carregar estatísticas',
            code: 'STATS_ERROR'
        });
    }
});

// GET /api/leads/:id - Buscar lead por ID
router.get('/:id', async (req, res) => {
    try {
        const leadId = parseInt(req.params.id);
        
        if (isNaN(leadId)) {
            return res.status(400).json({
                success: false,
                error: 'ID do lead deve ser um número',
                code: 'INVALID_LEAD_ID'
            });
        }
        
        const lead = await Lead.findById(leadId);
        
        if (!lead) {
            return res.status(404).json({
                success: false,
                error: 'Lead não encontrado',
                code: 'LEAD_NOT_FOUND'
            });
        }
        
        res.json({
            success: true,
            data: lead,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro ao buscar lead:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar lead',
            code: 'LEAD_FETCH_ERROR'
        });
    }
});

// PUT /api/leads/:id/status - Atualizar status do lead
router.put('/:id/status', async (req, res) => {
    try {
        const leadId = parseInt(req.params.id);
        const { status } = req.body;
        
        if (isNaN(leadId)) {
            return res.status(400).json({
                success: false,
                error: 'ID do lead deve ser um número',
                code: 'INVALID_LEAD_ID'
            });
        }
        
        const validStatuses = ['novo', 'contatado', 'interessado', 'matriculado', 'desistente'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Status inválido',
                code: 'INVALID_STATUS'
            });
        }
        
        await Lead.updateStatus(leadId, status);
        
        res.json({
            success: true,
            message: `Status atualizado para: ${status}`,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro ao atualizar status:', error);
        
        if (error.message.includes('não encontrado')) {
            return res.status(404).json({
                success: false,
                error: 'Lead não encontrado',
                code: 'LEAD_NOT_FOUND'
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Erro ao atualizar status',
            code: 'STATUS_UPDATE_ERROR'
        });
    }
});

// POST /api/leads/resend-n8n - Reenviar leads não enviados para n8n
router.post('/resend-n8n', async (req, res) => {
    try {
        const unsentLeads = await Lead.getUnsentToN8N();
        
        let successCount = 0;
        let errorCount = 0;
        
        for (const lead of unsentLeads) {
            try {
                await sendToN8N(lead.id, lead);
                successCount++;
            } catch (error) {
                errorCount++;
                console.error(`❌ Erro ao reenviar lead ${lead.id} para n8n:`, error);
            }
        }
        
        res.json({
            success: true,
            message: `Reenvio concluído: ${successCount} sucessos, ${errorCount} falhas`,
            data: {
                total: unsentLeads.length,
                success: successCount,
                errors: errorCount
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro ao reenviar para n8n:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao reenviar leads',
            code: 'N8N_RESEND_ERROR'
        });
    }
});

// GET /api/leads/export/csv - Exportar leads em CSV
router.get('/export/csv', async (req, res) => {
    try {
        const filters = {};
        if (req.query.curso) filters.curso = req.query.curso;
        if (req.query.status) filters.status = req.query.status;
        if (req.query.data_inicio) filters.data_inicio = req.query.data_inicio;
        if (req.query.data_fim) filters.data_fim = req.query.data_fim;
        
        const result = await Lead.findAll(1, 10000, filters); // Exportar até 10k registros
        const leads = result.leads;
        
        // Gerar CSV
        const csvHeader = 'ID,Nome,Email,Telefone,Idade,Curso,Status,Data Criacao,Enviado N8N\n';
        const csvRows = leads.map(lead => {
            return [
                lead.id,
                `"${lead.nome}"`,
                lead.email,
                lead.telefone,
                lead.idade,
                `"${lead.curso}"`,
                lead.status,
                lead.data_criacao,
                lead.enviado_n8n ? 'Sim' : 'Não'
            ].join(',');
        }).join('\n');
        
        const csv = csvHeader + csvRows;
        
        // Headers para download
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `incode_leads_${timestamp}.csv`;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
        
    } catch (error) {
        console.error('❌ Erro ao exportar CSV:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao exportar dados',
            code: 'CSV_EXPORT_ERROR'
        });
    }
});

// Função para enviar lead para n8n
async function sendToN8N(leadId, leadData) {
    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
    
    if (!N8N_WEBHOOK_URL || N8N_WEBHOOK_URL === 'https://your-n8n-webhook-url-here') {
        console.log('⚠️  URL do webhook n8n não configurada');
        return;
    }
    
    try {
        const fetch = require('node-fetch').default || require('node-fetch');
        
        const payload = {
            lead_id: leadId,
            nome: leadData.nome,
            email: leadData.email,
            telefone: leadData.telefone,
            idade: leadData.idade,
            curso: leadData.curso,
            origem: leadData.origem || 'website',
            timestamp: new Date().toISOString(),
            empresa: 'Incode Academy'
        };
        
        console.log('🔗 Enviando lead para n8n:', leadId);
        
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            timeout: 10000 // 10 segundos timeout
        });
        
        if (response.ok) {
            console.log('✅ Lead enviado para n8n com sucesso:', leadId);
            await Lead.markAsSentToN8N(leadId, true);
        } else {
            throw new Error(`n8n respondeu com status: ${response.status}`);
        }
        
    } catch (error) {
        console.error('❌ Erro ao enviar para n8n:', error);
        await Lead.markAsSentToN8N(leadId, false, error.message);
        throw error;
    }
}

// ENDPOINT TEMPORÁRIO PARA LIMPEZA (REMOVER DEPOIS)
router.delete('/admin/clear-test-data', async (req, res) => {
    try {
        // Verificar se é ambiente de desenvolvimento ou se tem permissão
        const adminKey = req.headers['x-admin-key'];
        if (adminKey !== 'incode2025-clear-db') {
            return res.status(403).json({
                success: false,
                error: 'Acesso negado. Chave de administrador inválida.',
                code: 'ADMIN_ACCESS_DENIED'
            });
        }
        
        console.log('🧹 Iniciando limpeza de dados de teste...');
        
        // Importar sqlite diretamente para executar comando SQL
        const { getDatabase } = require('../database/init');
        const db = getDatabase();
        
        // Limpar todos os leads
        const result = await new Promise((resolve, reject) => {
            db.run('DELETE FROM leads', function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ deletedRows: this.changes });
                }
            });
        });
        
        // Reset do auto-increment
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM sqlite_sequence WHERE name="leads"', function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
        
        console.log(`✅ Limpeza concluída: ${result.deletedRows} leads removidos`);
        
        res.json({
            success: true,
            message: `Base de dados limpa com sucesso! ${result.deletedRows} leads removidos.`,
            deletedCount: result.deletedRows,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro ao limpar base de dados:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao limpar base de dados',
            code: 'DATABASE_CLEAR_ERROR',
            details: error.message
        });
    }
});

module.exports = router;