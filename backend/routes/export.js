const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const Participacao = require('../models/Participacao');

// Função para converter dados para CSV
const convertToCSV = (data, headers) => {
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => {
        return headers.map(header => {
            const value = row[header] || '';
            // Escapar vírgulas e aspas
            const stringValue = String(value).replace(/"/g, '""');
            return `"${stringValue}"`;
        }).join(',');
    });

    return [csvHeaders, ...csvRows].join('\n');
};

// Formatar data para o formato brasileiro
const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Exportar todos os leads
router.get('/leads', async (req, res) => {
    try {
        const { formato = 'csv' } = req.query;

        // Buscar todos os leads sem paginação
        const result = await Lead.findAll(1, 10000);
        const leads = result.leads;

        if (leads.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Nenhum lead encontrado para exportar'
            });
        }

        // Processar dados para export - apenas campos solicitados
        const dadosExport = leads.map(lead => ({
            'Nome': lead.nome,
            'Email': lead.email,
            'Telefone': lead.telefone,
            'Idade': lead.idade
        }));

        if (formato === 'csv') {
            const headers = Object.keys(dadosExport[0]);
            const csv = convertToCSV(dadosExport, headers);

            // Adicionar BOM para UTF-8 (importante para Excel)
            const bom = '\uFEFF';
            const csvWithBom = bom + csv;

            const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="Leads_Incode_Academy_${dataAtual}.csv"`);
            res.send(csvWithBom);
        } else {
            // JSON format
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="leads_incode_${new Date().toISOString().split('T')[0]}.json"`);
            res.json({
                success: true,
                exportDate: new Date().toISOString(),
                totalLeads: leads.length,
                data: dadosExport
            });
        }

    } catch (error) {
        console.error('Erro ao exportar leads:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
});

// Exportar participações de um evento específico
router.get('/evento/:evento', async (req, res) => {
    try {
        const { evento } = req.params;
        const { formato = 'csv' } = req.query;

        const participacoes = await Participacao.buscarPorEvento(evento);

        if (participacoes.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Nenhuma participação encontrada para o evento: ${evento}`
            });
        }

        // Processar dados para export
        const dadosExport = participacoes.map(p => ({
            'ID Participação': p.id,
            'ID Lead': p.lead_id,
            'Nome': p.nome,
            'Email': p.email,
            'Telefone': p.telefone,
            'Idade': p.idade,
            'Evento': p.evento_nome,
            'Data Evento': p.evento_data || '',
            'Tipo Evento': p.tipo_evento,
            'Data Participação': formatDate(p.data_participacao),
            'Metadata': p.metadata || ''
        }));

        if (formato === 'csv') {
            const headers = Object.keys(dadosExport[0]);
            const csv = convertToCSV(dadosExport, headers);

            // Adicionar BOM para UTF-8
            const bom = '\uFEFF';
            const csvWithBom = bom + csv;

            const nomeArquivo = evento.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="participacoes_${nomeArquivo}_${new Date().toISOString().split('T')[0]}.csv"`);
            res.send(csvWithBom);
        } else {
            // JSON format
            const nomeArquivo = evento.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="participacoes_${nomeArquivo}_${new Date().toISOString().split('T')[0]}.json"`);
            res.json({
                success: true,
                evento: evento,
                exportDate: new Date().toISOString(),
                totalParticipacoes: participacoes.length,
                data: dadosExport
            });
        }

    } catch (error) {
        console.error('Erro ao exportar participações:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
});

// Exportar relatório completo (leads + participações)
router.get('/completo', async (req, res) => {
    try {
        const { formato = 'csv' } = req.query;

        // Buscar todos os leads
        const resultLeads = await Lead.findAll(1, 10000);
        const leads = resultLeads.leads;

        // Buscar todas as participações
        const eventos = await Participacao.listarEventos();

        const relatorio = {
            resumo: {
                totalLeads: leads.length,
                totalEventos: eventos.length,
                dataExport: formatDate(new Date().toISOString())
            },
            leads: leads.map(lead => ({
                'ID': lead.id,
                'Nome': lead.nome,
                'Email': lead.email,
                'Telefone': lead.telefone,
                'Idade': lead.idade,
                'Data Cadastro': formatDate(lead.data_criacao)
            })),
            eventos: eventos.map(evento => ({
                'Evento': evento.evento_nome,
                'Data Evento': evento.evento_data || '',
                'Tipo': evento.tipo_evento,
                'Total Participações': evento.total_participacoes,
                'Primeira Participação': formatDate(evento.primeira_participacao),
                'Última Participação': formatDate(evento.ultima_participacao)
            }))
        };

        if (formato === 'json') {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="relatorio_completo_incode_${new Date().toISOString().split('T')[0]}.json"`);
            res.json({
                success: true,
                ...relatorio
            });
        } else {
            // Para CSV, apenas leads (mais simples para planilha)
            const dadosExport = relatorio.leads;
            const headers = Object.keys(dadosExport[0]);
            const csv = convertToCSV(dadosExport, headers);

            const bom = '\uFEFF';
            const csvWithBom = bom + csv;

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="relatorio_leads_${new Date().toISOString().split('T')[0]}.csv"`);
            res.send(csvWithBom);
        }

    } catch (error) {
        console.error('Erro ao exportar relatório completo:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
});

module.exports = router;