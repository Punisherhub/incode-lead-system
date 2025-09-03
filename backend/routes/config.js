const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Arquivo de configuração (JSON local)
const CONFIG_FILE = path.join(__dirname, '../data/site-config.json');

// Configuração padrão
const DEFAULT_CONFIG = {
    mode: 'general',
    workshopConfig: {
        eventName: 'Workshop Mês do Programador',
        eventDate: '17 e 18 de Setembro',
        eventMainTitle: 'PROGRAMAÇÃO COM PYTHON',
        eventSubtitle: 'Workshop Mês do Programador'
    },
    lastUpdated: new Date().toISOString()
};

// Função para garantir que o diretório data existe
async function ensureDataDirectory() {
    const dataDir = path.join(__dirname, '../data');
    try {
        await fs.access(dataDir);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.mkdir(dataDir, { recursive: true });
            console.log('📁 Diretório data criado.');
        }
    }
}

// Função para carregar configuração
async function loadConfig() {
    try {
        await ensureDataDirectory();
        const configData = await fs.readFile(CONFIG_FILE, 'utf8');
        const config = JSON.parse(configData);
        
        // Mesclar com configuração padrão para garantir compatibilidade
        return {
            ...DEFAULT_CONFIG,
            ...config,
            workshopConfig: {
                ...DEFAULT_CONFIG.workshopConfig,
                ...(config.workshopConfig || {})
            }
        };
    } catch (error) {
        if (error.code === 'ENOENT') {
            // Arquivo não existe, criar com configuração padrão
            console.log('📝 Criando arquivo de configuração padrão...');
            await saveConfig(DEFAULT_CONFIG);
            return DEFAULT_CONFIG;
        }
        console.error('❌ Erro ao carregar configuração:', error);
        return DEFAULT_CONFIG;
    }
}

// Função para salvar configuração
async function saveConfig(config) {
    try {
        await ensureDataDirectory();
        config.lastUpdated = new Date().toISOString();
        await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
        console.log('💾 Configuração salva:', config.mode);
        return true;
    } catch (error) {
        console.error('❌ Erro ao salvar configuração:', error);
        return false;
    }
}

// GET /api/config - Obter configuração atual
router.get('/', async (req, res) => {
    try {
        const config = await loadConfig();
        
        res.json({
            success: true,
            data: config,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Erro ao obter configuração:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            code: 'CONFIG_LOAD_ERROR'
        });
    }
});

// POST /api/config - Salvar nova configuração
router.post('/', async (req, res) => {
    try {
        const { mode, workshopConfig } = req.body;
        
        // Validação básica
        if (!mode || !['general', 'workshop'].includes(mode)) {
            return res.status(400).json({
                success: false,
                error: 'Modo inválido. Use "general" ou "workshop".',
                code: 'INVALID_MODE'
            });
        }
        
        // Validar configuração do workshop se modo workshop
        if (mode === 'workshop' && workshopConfig) {
            const requiredFields = ['eventName', 'eventDate', 'eventMainTitle', 'eventSubtitle'];
            const missingFields = requiredFields.filter(field => !workshopConfig[field]);
            
            if (missingFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: `Campos obrigatórios do workshop faltando: ${missingFields.join(', ')}`,
                    code: 'MISSING_WORKSHOP_FIELDS'
                });
            }
        }
        
        // Carregar configuração atual para preservar outros dados
        const currentConfig = await loadConfig();
        
        // Criar nova configuração
        const newConfig = {
            ...currentConfig,
            mode,
            workshopConfig: mode === 'workshop' ? {
                ...currentConfig.workshopConfig,
                ...workshopConfig
            } : currentConfig.workshopConfig
        };
        
        // Salvar configuração
        const saved = await saveConfig(newConfig);
        
        if (!saved) {
            throw new Error('Falha ao salvar configuração');
        }
        
        console.log(`✅ Configuração atualizada para modo: ${mode}`);
        
        res.json({
            success: true,
            data: newConfig,
            message: `Configuração salva com sucesso! Modo: ${mode}`,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Erro ao salvar configuração:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            code: 'CONFIG_SAVE_ERROR'
        });
    }
});

// PUT /api/config/mode - Trocar apenas o modo (endpoint rápido)
router.put('/mode', async (req, res) => {
    try {
        const { mode } = req.body;
        
        if (!mode || !['general', 'workshop'].includes(mode)) {
            return res.status(400).json({
                success: false,
                error: 'Modo inválido. Use "general" ou "workshop".',
                code: 'INVALID_MODE'
            });
        }
        
        const currentConfig = await loadConfig();
        currentConfig.mode = mode;
        
        const saved = await saveConfig(currentConfig);
        
        if (!saved) {
            throw new Error('Falha ao salvar configuração');
        }
        
        console.log(`🔄 Modo alterado para: ${mode}`);
        
        res.json({
            success: true,
            data: currentConfig,
            message: `Modo alterado para: ${mode}`,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Erro ao alterar modo:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            code: 'MODE_CHANGE_ERROR'
        });
    }
});

// GET /api/config/status - Status da configuração (endpoint público)
router.get('/status', async (req, res) => {
    try {
        const config = await loadConfig();
        
        // Retornar apenas informações básicas (não sensíveis)
        res.json({
            success: true,
            data: {
                mode: config.mode,
                lastUpdated: config.lastUpdated,
                isWorkshopMode: config.mode === 'workshop',
                eventName: config.mode === 'workshop' ? config.workshopConfig.eventName : null
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Erro ao obter status:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            code: 'STATUS_ERROR'
        });
    }
});

// DELETE /api/config/reset - Reset para configuração padrão (cuidado!)
router.delete('/reset', async (req, res) => {
    try {
        const saved = await saveConfig(DEFAULT_CONFIG);
        
        if (!saved) {
            throw new Error('Falha ao resetar configuração');
        }
        
        console.log('🔄 Configuração resetada para padrão');
        
        res.json({
            success: true,
            data: DEFAULT_CONFIG,
            message: 'Configuração resetada para padrão',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Erro ao resetar configuração:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            code: 'RESET_ERROR'
        });
    }
});

module.exports = router;