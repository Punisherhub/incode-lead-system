const { runQuery, getQuery, allQuery } = require('../database/init');

class Lead {
    constructor(data) {
        this.nome = data.nome;
        this.email = data.email;
        this.telefone = data.telefone;
        this.idade = data.idade;
        this.curso = data.curso;
        this.ip_address = data.ip_address;
        this.user_agent = data.user_agent;
        this.origem = data.origem || 'website';
        this.status = data.status || 'novo';
    }
    
    // Validar dados do lead
    validate() {
        const errors = [];
        
        // Validar nome
        if (!this.nome || this.nome.trim().length < 2) {
            errors.push('Nome deve ter pelo menos 2 caracteres');
        }
        
        if (this.nome && this.nome.length > 100) {
            errors.push('Nome deve ter no máximo 100 caracteres');
        }
        
        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!this.email || !emailRegex.test(this.email)) {
            errors.push('Email deve ser válido');
        }
        
        // Validar telefone
        const phoneRegex = /^[\d\s\(\)\-\+]{10,20}$/;
        if (!this.telefone || !phoneRegex.test(this.telefone.replace(/\s/g, ''))) {
            errors.push('Telefone deve ser válido');
        }
        
        // Validar idade
        if (!this.idade || this.idade < 12 || this.idade > 99) {
            errors.push('Idade deve estar entre 12 e 99 anos');
        }
        
        // Campo curso é opcional agora - definir valor padrão
        if (!this.curso) {
            this.curso = 'Python - Interesse Geral';
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    // Sanitizar dados
    sanitize() {
        this.nome = this.nome ? this.nome.trim() : '';
        this.email = this.email ? this.email.trim().toLowerCase() : '';
        this.telefone = this.telefone ? this.telefone.trim() : '';
        
        // Remover caracteres especiais do nome
        this.nome = this.nome.replace(/[<>\"']/g, '');
        
        return this;
    }
    
    // Salvar lead no banco
    async save() {
        try {
            // Sanitizar dados
            this.sanitize();
            
            // Validar dados
            const validation = this.validate();
            if (!validation.isValid) {
                throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
            }
            
            // Verificar se email já existe
            const existingLead = await Lead.findByEmail(this.email);
            if (existingLead) {
                throw new Error('Email já cadastrado no sistema');
            }
            
            const query = `
                INSERT INTO leads (
                    nome, email, telefone, idade, curso, 
                    ip_address, user_agent, origem, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const params = [
                this.nome,
                this.email,
                this.telefone,
                this.idade,
                this.curso,
                this.ip_address,
                this.user_agent,
                this.origem,
                this.status
            ];
            
            const result = await runQuery(query, params);
            
            // Log da criação
            await this.logEvent('lead_created', {
                lead_id: result.id,
                curso: this.curso,
                idade: this.idade
            });
            
            return {
                id: result.id,
                success: true,
                message: 'Lead cadastrado com sucesso!'
            };
            
        } catch (error) {
            console.error('Erro ao salvar lead:', error);
            throw error;
        }
    }
    
    // Buscar lead por email
    static async findByEmail(email) {
        try {
            const query = 'SELECT * FROM leads WHERE email = ?';
            const result = await getQuery(query, [email.toLowerCase()]);
            return result;
        } catch (error) {
            console.error('Erro ao buscar lead por email:', error);
            throw error;
        }
    }
    
    // Buscar lead por ID
    static async findById(id) {
        try {
            const query = 'SELECT * FROM leads WHERE id = ?';
            const result = await getQuery(query, [id]);
            return result;
        } catch (error) {
            console.error('Erro ao buscar lead por ID:', error);
            throw error;
        }
    }
    
    // Listar todos os leads com paginação
    static async findAll(page = 1, limit = 50, filters = {}) {
        try {
            const offset = (page - 1) * limit;
            let query = 'SELECT * FROM leads';
            let countQuery = 'SELECT COUNT(*) as total FROM leads';
            const params = [];
            const whereConditions = [];
            
            // Aplicar filtros
            if (filters.curso) {
                whereConditions.push('curso = ?');
                params.push(filters.curso);
            }
            
            if (filters.status) {
                whereConditions.push('status = ?');
                params.push(filters.status);
            }
            
            if (filters.data_inicio) {
                whereConditions.push('DATE(data_criacao) >= ?');
                params.push(filters.data_inicio);
            }
            
            if (filters.data_fim) {
                whereConditions.push('DATE(data_criacao) <= ?');
                params.push(filters.data_fim);
            }
            
            if (filters.search) {
                whereConditions.push('(nome LIKE ? OR email LIKE ?)');
                params.push(`%${filters.search}%`, `%${filters.search}%`);
            }
            
            // Adicionar WHERE se há condições
            if (whereConditions.length > 0) {
                const whereClause = ' WHERE ' + whereConditions.join(' AND ');
                query += whereClause;
                countQuery += whereClause;
            }
            
            // Ordenação
            query += ' ORDER BY data_criacao DESC';
            
            // Paginação
            query += ' LIMIT ? OFFSET ?';
            params.push(limit, offset);
            
            // Executar queries
            const [leads, countResult] = await Promise.all([
                allQuery(query, params),
                getQuery(countQuery, params.slice(0, -2)) // Remove limit e offset do count
            ]);
            
            return {
                leads: leads,
                pagination: {
                    page: page,
                    limit: limit,
                    total: countResult.total,
                    totalPages: Math.ceil(countResult.total / limit)
                }
            };
            
        } catch (error) {
            console.error('Erro ao listar leads:', error);
            throw error;
        }
    }
    
    // Atualizar status do lead
    static async updateStatus(id, status) {
        try {
            const query = `
                UPDATE leads 
                SET status = ?, data_atualizacao = CURRENT_TIMESTAMP 
                WHERE id = ?
            `;
            
            const result = await runQuery(query, [status, id]);
            
            if (result.changes === 0) {
                throw new Error('Lead não encontrado');
            }
            
            return { success: true, message: 'Status atualizado com sucesso' };
            
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            throw error;
        }
    }
    
    // Marcar como enviado para n8n
    static async markAsSentToN8N(id, success = true, error = null) {
        try {
            let query, params;
            
            if (success) {
                query = `
                    UPDATE leads 
                    SET enviado_n8n = TRUE, 
                        tentativas_n8n = tentativas_n8n + 1,
                        ultimo_erro_n8n = NULL,
                        data_atualizacao = CURRENT_TIMESTAMP 
                    WHERE id = ?
                `;
                params = [id];
            } else {
                query = `
                    UPDATE leads 
                    SET tentativas_n8n = tentativas_n8n + 1,
                        ultimo_erro_n8n = ?,
                        data_atualizacao = CURRENT_TIMESTAMP 
                    WHERE id = ?
                `;
                params = [error, id];
            }
            
            await runQuery(query, params);
            
        } catch (error) {
            console.error('Erro ao marcar envio para n8n:', error);
            throw error;
        }
    }
    
    // Obter leads não enviados para n8n
    static async getUnsentToN8N() {
        try {
            const query = `
                SELECT * FROM leads 
                WHERE enviado_n8n = FALSE 
                AND tentativas_n8n < 3
                ORDER BY data_criacao DESC
            `;
            
            const result = await allQuery(query);
            return result;
            
        } catch (error) {
            console.error('Erro ao buscar leads não enviados:', error);
            throw error;
        }
    }
    
    // Log de eventos
    async logEvent(evento, dados = {}) {
        try {
            const query = `
                INSERT INTO analytics (evento, dados, ip_address, user_agent)
                VALUES (?, ?, ?, ?)
            `;
            
            const params = [
                evento,
                JSON.stringify(dados),
                this.ip_address || null,
                this.user_agent || null
            ];
            
            await runQuery(query, params);
            
        } catch (error) {
            console.error('Erro ao registrar evento:', error);
            // Não propagar erro de log
        }
    }
    
    // Estatísticas
    static async getStats() {
        try {
            const queries = {
                total: 'SELECT COUNT(*) as count FROM leads',
                hoje: 'SELECT COUNT(*) as count FROM leads WHERE DATE(data_criacao) = DATE("now")',
                semana: 'SELECT COUNT(*) as count FROM leads WHERE data_criacao >= datetime("now", "-7 days")',
                mes: 'SELECT COUNT(*) as count FROM leads WHERE strftime("%Y-%m", data_criacao) = strftime("%Y-%m", "now")',
                por_curso: 'SELECT curso, COUNT(*) as count FROM leads GROUP BY curso ORDER BY count DESC',
                por_status: 'SELECT status, COUNT(*) as count FROM leads GROUP BY status',
                enviados_n8n: 'SELECT COUNT(*) as count FROM leads WHERE enviado_n8n = TRUE'
            };
            
            const stats = {};
            
            // Executar queries simples
            for (const [key, query] of Object.entries(queries)) {
                if (key.includes('por_')) {
                    stats[key] = await allQuery(query);
                } else {
                    const result = await getQuery(query);
                    stats[key] = result.count;
                }
            }
            
            return stats;
            
        } catch (error) {
            console.error('Erro ao obter estatísticas:', error);
            throw error;
        }
    }
}

module.exports = Lead;