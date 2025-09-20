const express = require('express');
const router = express.Router();
const Participacao = require('../models/Participacao');
const Lead = require('../models/Lead');

// Listar todas as participações
router.get('/', async (req, res) => {
    try {
        const { evento, page = 1, limit = 50 } = req.query;

        if (evento) {
            // Buscar participações de um evento específico
            const participacoes = await Participacao.buscarPorEvento(evento);
            res.json({
                success: true,
                data: participacoes,
                total: participacoes.length
            });
        } else {
            // Listar todos os eventos
            const eventos = await Participacao.listarEventos();
            res.json({
                success: true,
                data: eventos
            });
        }
    } catch (error) {
        console.error('Erro ao listar participações:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
});

// Buscar participações de um lead
router.get('/lead/:leadId', async (req, res) => {
    try {
        const { leadId } = req.params;
        const participacoes = await Participacao.buscarPorLead(leadId);

        res.json({
            success: true,
            data: participacoes
        });
    } catch (error) {
        console.error('Erro ao buscar participações do lead:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
});

// Estatísticas de participações
router.get('/stats', async (req, res) => {
    try {
        const stats = await Participacao.getEstatisticas();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
});

// Verificar se lead já participou de evento
router.get('/verificar/:leadId/:evento', async (req, res) => {
    try {
        const { leadId, evento } = req.params;
        const jaParticipou = await Participacao.jaParticipou(leadId, evento);

        res.json({
            success: true,
            jaParticipou: jaParticipou
        });
    } catch (error) {
        console.error('Erro ao verificar participação:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
});

// Remover participação
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Participacao.remover(id);

        res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error('Erro ao remover participação:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
});

module.exports = router;