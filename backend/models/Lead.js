// Usar PostgreSQL em produção, SQLite em desenvolvimento
let dbQuery, dbGetQuery, dbAllQuery;

if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
    // PostgreSQL
    const { query } = require('../database/postgres');
    dbQuery = query;
    dbGetQuery = async (sql, params = []) => {
        const result = await query(sql, params);
        return result.rows[0];
    };
    dbAllQuery = async (sql, params = []) => {
        const result = await query(sql, params);
        return result.rows;
    };
} else {
    // SQLite
    const { runQuery, getQuery, allQuery } = require('../database/init');
    dbQuery = runQuery;
    dbGetQuery = getQuery;
    dbAllQuery = allQuery;
}

// Helper para obter timestamp do Brasil - consistente com routes/leads.js
const getBrazilTimestamp = () => {
    return new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
};

// Helper para obter data formatada para SQL (YYYY-MM-DD HH:MM:SS)
const getBrazilSQLTimestamp = () => {
    const now = new Date();
    // Usar o mesmo método do getBrazilTimestamp mas formatado para SQL
    const brazilString = now.toLocaleString('sv-SE', {
        timeZone: 'America/Sao_Paulo'
    }); // sv-SE retorna formato YYYY-MM-DD HH:MM:SS
    return brazilString;
};

class Lead {
    constructor(data) {
        this.nome = data.nome;
        this.email = data.email;
        this.telefone = data.telefone;
        this.idade = data.idade;
        this.curso = data.curso || data.curso_pretendido; // Compatibilidade
        this.ip_address = data.ip_address;
        this.user_agent = data.user_agent;
        this.origem = data.origem || 'website';
        this.status = data.status || 'novo';
        
        // Novos campos para workshop/eventos
        this.tipo_lead = data.tipo_lead || 'geral'; // 'geral' ou 'workshop'
        this.evento = data.evento || null; // Nome do evento/workshop
        this.dia_evento = data.dia_evento || null; // Dia preferido para workshop
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
        
        // Campo curso é opcional agora - definir valor padrão baseado no tipo
        if (!this.curso) {
            if (this.tipo_lead === 'workshop') {
                this.curso = this.evento || 'Workshop Python';
            } else {
                this.curso = 'Python - Interesse Geral';
            }
        }
        
        // Validar campos específicos do workshop
        if (this.tipo_lead === 'workshop') {
            if (this.dia_evento && !['17', '18'].includes(this.dia_evento)) {
                errors.push('Dia do evento deve ser 17 ou 18');
            }
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
        this.nome = this.nome.replace(/[<>"']/g, '');
        
        return this;
    }
    
    // Salvar lead no banco (novo sistema com participações)
    async save(eventoInfo = null) {
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

            let leadId;
            let isNewLead = false;

            if (existingLead) {
                // Lead já existe, usar o ID existente
                leadId = existingLead.id;
                console.log(`✅ Lead existente encontrado: ${this.email} (ID: ${leadId})`);

                // Atualizar dados se necessário (nome, telefone, idade podem ter mudado)
                await this.updateExistingLead(leadId);
            } else {
                // Novo lead, criar registro
                leadId = await this.createNewLead();
                isNewLead = true;
            }

            // Se há informação de evento, criar participação
            if (eventoInfo) {
                const Participacao = require('./Participacao');

                // Verificar se já participou deste evento específico
                const jaParticipou = await Participacao.jaParticipou(leadId, eventoInfo.evento_nome);

                if (jaParticipou) {
                    return {
                        id: leadId,
                        success: true,
                        isNewLead: false,
                        isNewParticipation: false,
                        message: 'Você já está participando deste evento! Obrigado pelo interesse.',
                        existingParticipation: true
                    };
                }

                // Criar nova participação
                const participacao = new Participacao({
                    lead_id: leadId,
                    evento_nome: eventoInfo.evento_nome,
                    evento_data: eventoInfo.evento_data,
                    tipo_evento: eventoInfo.tipo_evento || 'sorteio',
                    ip_address: this.ip_address,
                    user_agent: this.user_agent,
                    metadata: eventoInfo.metadata || {}
                });

                await participacao.save();

                return {
                    id: leadId,
                    success: true,
                    isNewLead: isNewLead,
                    isNewParticipation: true,
                    message: isNewLead ?
                        'Cadastro realizado e participação registrada com sucesso!' :
                        'Nova participação registrada com sucesso!'
                };
            }

            // Registro simples sem evento específico
            return {
                id: leadId,
                success: true,
                isNewLead: isNewLead,
                isNewParticipation: false,
                message: isNewLead ?
                    'Lead cadastrado com sucesso!' :
                    'Dados atualizados com sucesso!'
            };
            
        } catch (error) {
            console.error('Erro ao salvar lead:', error);
            throw error;
        }
    }

    // Criar novo lead (agora com timestamp de envio)
    async createNewLead() {
        const isProduction = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;
        let insertQuery, params, result;

        // Criar timestamp brasileiro usando helpers consistentes
        const dataFormatada = getBrazilSQLTimestamp();
        const agora = new Date();
        const horaFormatada = agora.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        const diaFormatado = agora.toLocaleDateString('pt-BR', { weekday: 'long', timeZone: 'America/Sao_Paulo' });

        if (isProduction) {
            // PostgreSQL
            insertQuery = `
                INSERT INTO leads (
                    nome, email, telefone, idade, curso,
                    ip_address, user_agent, origem, status,
                    tipo_lead, evento, dia_evento,
                    ultimo_envio_data, ultimo_envio_hora, ultimo_envio_dia, total_envios
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
                         NOW() AT TIME ZONE 'America/Sao_Paulo', $13, $14, 1)
                RETURNING id
            `;

            params = [
                this.nome, this.email, this.telefone, this.idade, this.curso,
                this.ip_address, this.user_agent, this.origem, this.status,
                this.tipo_lead, this.evento, this.dia_evento,
                horaFormatada, diaFormatado
            ];

            result = await dbQuery(insertQuery, params);

            // Log da criação
            await this.logEvent('lead_created', {
                lead_id: result.rows[0].id,
                curso: this.curso,
                idade: this.idade
            });

            return result.rows[0].id;
        } else {
            // SQLite
            insertQuery = `
                INSERT INTO leads (
                    nome, email, telefone, idade, curso,
                    ip_address, user_agent, origem, status,
                    tipo_lead, evento, dia_evento,
                    ultimo_envio_data, ultimo_envio_hora, ultimo_envio_dia, total_envios,
                    data_criacao, data_atualizacao
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
            `;

            params = [
                this.nome, this.email, this.telefone, this.idade, this.curso,
                this.ip_address, this.user_agent, this.origem, this.status,
                this.tipo_lead, this.evento, this.dia_evento,
                dataFormatada, horaFormatada, diaFormatado,
                dataFormatada, dataFormatada  // data_criacao, data_atualizacao
            ];

            result = await dbQuery(insertQuery, params);

            // Log da criação
            await this.logEvent('lead_created', {
                lead_id: result.id,
                curso: this.curso,
                idade: this.idade
            });

            return result.id;
        }
    }

    // Atualizar lead existente (agora sempre atualiza timestamp de envio)
    async updateExistingLead(leadId) {
        const isProduction = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;
        let updateQuery, params;

        // Criar timestamp brasileiro usando helpers consistentes
        const dataFormatada = getBrazilSQLTimestamp();
        const agora = new Date();
        const horaFormatada = agora.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        const diaFormatado = agora.toLocaleDateString('pt-BR', { weekday: 'long', timeZone: 'America/Sao_Paulo' });

        if (isProduction) {
            updateQuery = `
                UPDATE leads
                SET nome = $1, telefone = $2, idade = $3,
                    ultimo_envio_data = NOW() AT TIME ZONE 'America/Sao_Paulo',
                    ultimo_envio_hora = $4,
                    ultimo_envio_dia = $5,
                    total_envios = COALESCE(total_envios, 0) + 1,
                    data_atualizacao = NOW() AT TIME ZONE 'America/Sao_Paulo'
                WHERE id = $6
            `;
            params = [this.nome, this.telefone, this.idade, horaFormatada, diaFormatado, leadId];
        } else {
            updateQuery = `
                UPDATE leads
                SET nome = ?, telefone = ?, idade = ?,
                    ultimo_envio_data = ?,
                    ultimo_envio_hora = ?,
                    ultimo_envio_dia = ?,
                    total_envios = COALESCE(total_envios, 0) + 1,
                    data_atualizacao = ?
                WHERE id = ?
            `;
            params = [this.nome, this.telefone, this.idade, dataFormatada, horaFormatada, diaFormatado, dataFormatada, leadId];
        }

        await dbQuery(updateQuery, params);

        // Log da atualização
        await this.logEvent('lead_updated', {
            lead_id: leadId,
            campos_atualizados: ['nome', 'telefone', 'idade', 'timestamp_envio']
        });
    }
    
    // Buscar lead por email
    static async findByEmail(email) {
        try {
            const isProduction = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;
            const query = isProduction ? 'SELECT * FROM leads WHERE email = $1' : 'SELECT * FROM leads WHERE email = ?';
            const result = await dbGetQuery(query, [email.toLowerCase()]);
            return result;
        } catch (error) {
            console.error('Erro ao buscar lead por email:', error);
            throw error;
        }
    }
    
    // Buscar lead por ID
    static async findById(id) {
        try {
            const isProduction = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;
            const query = isProduction ? 'SELECT * FROM leads WHERE id = $1' : 'SELECT * FROM leads WHERE id = ?';
            const result = await dbGetQuery(query, [id]);
            return result;
        } catch (error) {
            console.error('Erro ao buscar lead por ID:', error);
            throw error;
        }
    }
    
    // Listar todos os leads com paginação e filtros melhorados
    static async findAll(page = 1, limit = 20, filters = {}) {
        try {
            const offset = (page - 1) * limit;
            const isProduction = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;

            let selectQuery = 'SELECT * FROM leads';
            let countQuery = 'SELECT COUNT(*) as total FROM leads';
            const params = [];
            const whereConditions = [];
            let paramIndex = 1;

            // Aplicar filtros melhorados
            if (filters.curso) {
                whereConditions.push(isProduction ? `curso = $${paramIndex++}` : 'curso = ?');
                params.push(filters.curso);
            }

            if (filters.status) {
                whereConditions.push(isProduction ? `status = $${paramIndex++}` : 'status = ?');
                params.push(filters.status);
            }

            if (filters.tipo_lead) {
                whereConditions.push(isProduction ? `tipo_lead = $${paramIndex++}` : 'tipo_lead = ?');
                params.push(filters.tipo_lead);
            }

            if (filters.dia_evento) {
                whereConditions.push(isProduction ? `dia_evento = $${paramIndex++}` : 'dia_evento = ?');
                params.push(filters.dia_evento);
            }

            if (filters.data_inicio) {
                if (isProduction) {
                    whereConditions.push(`DATE(data_criacao AT TIME ZONE 'America/Sao_Paulo') >= $${paramIndex++}`);
                } else {
                    whereConditions.push('DATE(data_criacao) >= ?');
                }
                params.push(filters.data_inicio);
            }

            if (filters.data_fim) {
                if (isProduction) {
                    whereConditions.push(`DATE(data_criacao AT TIME ZONE 'America/Sao_Paulo') <= $${paramIndex++}`);
                } else {
                    whereConditions.push('DATE(data_criacao) <= ?');
                }
                params.push(filters.data_fim);
            }

            if (filters.search) {
                if (isProduction) {
                    whereConditions.push(`(nome ILIKE $${paramIndex} OR email ILIKE $${paramIndex + 1} OR telefone ILIKE $${paramIndex + 2})`);
                    params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
                    paramIndex += 3;
                } else {
                    whereConditions.push('(nome LIKE ? OR email LIKE ? OR telefone LIKE ?)');
                    params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
                }
            }

            // Adicionar WHERE se há condições
            if (whereConditions.length > 0) {
                const whereClause = ' WHERE ' + whereConditions.join(' AND ');
                selectQuery += whereClause;
                countQuery += whereClause;
            }

            // Ordenação melhorada - mais recentes primeiro
            selectQuery += ' ORDER BY data_criacao DESC, id DESC';

            // Paginação
            if (isProduction) {
                selectQuery += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
            } else {
                selectQuery += ' LIMIT ? OFFSET ?';
            }
            const queryParams = [...params, limit, offset];

            console.log(`📄 Executando query de leads - Página: ${page}, Filtros aplicados: ${whereConditions.length}`);

            // Executar queries
            const [leads, countResult] = await Promise.all([
                dbAllQuery(selectQuery, queryParams),
                dbGetQuery(countQuery, params)
            ]);

            const totalRecords = parseInt(countResult.total) || 0;
            const totalPages = Math.ceil(totalRecords / limit);

            return {
                leads: leads || [],
                pagination: {
                    currentPage: page,
                    totalPages: totalPages,
                    totalRecords: totalRecords,
                    limit: limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1,
                    offset: offset
                }
            };

        } catch (error) {
            console.error('❌ Erro ao listar leads:', error);
            throw error;
        }
    }
    
    // Atualizar status do lead
    static async updateStatus(id, status) {
        try {
            const isProduction = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;
            
            let updateQuery, result;
            if (isProduction) {
                updateQuery = `
                    UPDATE leads 
                    SET status = $1, data_atualizacao = NOW() AT TIME ZONE 'America/Sao_Paulo' 
                    WHERE id = $2
                `;
                result = await dbQuery(updateQuery, [status, id]);
                
                if (result.rowCount === 0) {
                    throw new Error('Lead não encontrado');
                }
            } else {
                updateQuery = `
                    UPDATE leads
                    SET status = ?, data_atualizacao = ?
                    WHERE id = ?
                `;
                result = await dbQuery(updateQuery, [status, getBrazilSQLTimestamp(), id]);
                
                if (result.changes === 0) {
                    throw new Error('Lead não encontrado');
                }
            }
            
            return { success: true, message: 'Status atualizado com sucesso' };
            
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            throw error;
        }
    }
    
    // Deletar lead
    static async delete(id) {
        try {
            const isProduction = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;
            
            let deleteQuery, result;
            if (isProduction) {
                deleteQuery = 'DELETE FROM leads WHERE id = $1';
                result = await dbQuery(deleteQuery, [id]);
                
                if (result.rowCount === 0) {
                    throw new Error('Lead não encontrado');
                }
            } else {
                deleteQuery = 'DELETE FROM leads WHERE id = ?';
                result = await dbQuery(deleteQuery, [id]);
                
                if (result.changes === 0) {
                    throw new Error('Lead não encontrado');
                }
            }
            
            return { success: true, message: 'Lead deletado com sucesso' };
            
        } catch (error) {
            console.error('Erro ao deletar lead:', error);
            throw error;
        }
    }
    
    // Marcar como enviado para n8n
    static async markAsSentToN8N(id, success = true, error = null) {
        try {
            const isProduction = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;
            
            let updateQuery, params;
            
            if (success) {
                if (isProduction) {
                    updateQuery = `
                        UPDATE leads 
                        SET enviado_n8n = TRUE, 
                            tentativas_n8n = tentativas_n8n + 1,
                            ultimo_erro_n8n = NULL,
                            data_atualizacao = NOW() AT TIME ZONE 'America/Sao_Paulo' 
                        WHERE id = $1
                    `;
                    params = [id];
                } else {
                    updateQuery = `
                        UPDATE leads 
                        SET enviado_n8n = TRUE,
                            tentativas_n8n = tentativas_n8n + 1,
                            ultimo_erro_n8n = NULL,
                            data_atualizacao = ?
                        WHERE id = ?
                    `;
                    params = [getBrazilSQLTimestamp(), id];
                }
            } else {
                if (isProduction) {
                    updateQuery = `
                        UPDATE leads 
                        SET tentativas_n8n = tentativas_n8n + 1,
                            ultimo_erro_n8n = $1,
                            data_atualizacao = NOW() AT TIME ZONE 'America/Sao_Paulo' 
                        WHERE id = $2
                    `;
                    params = [error, id];
                } else {
                    updateQuery = `
                        UPDATE leads 
                        SET tentativas_n8n = tentativas_n8n + 1,
                            ultimo_erro_n8n = ?,
                            data_atualizacao = ?
                        WHERE id = ?
                    `;
                    params = [error, getBrazilSQLTimestamp(), id];
                }
            }
            
            await dbQuery(updateQuery, params);
            
        } catch (error) {
            console.error('Erro ao marcar envio para n8n:', error);
            throw error;
        }
    }
    
    // Obter leads não enviados para n8n
    static async getUnsentToN8N() {
        try {
            const selectQuery = `
                SELECT * FROM leads 
                WHERE enviado_n8n = FALSE 
                AND tentativas_n8n < 3
                ORDER BY data_criacao DESC
            `;
            
            const result = await dbAllQuery(selectQuery);
            return result;
            
        } catch (error) {
            console.error('Erro ao buscar leads não enviados:', error);
            throw error;
        }
    }
    
    // Log de eventos
    async logEvent(evento, dados = {}) {
        try {
            const isProduction = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;
            
            let insertQuery, params;
            if (isProduction) {
                insertQuery = `
                    INSERT INTO analytics (evento, dados, ip_address, user_agent)
                    VALUES ($1, $2, $3, $4)
                `;
            } else {
                insertQuery = `
                    INSERT INTO analytics (evento, dados, ip_address, user_agent)
                    VALUES (?, ?, ?, ?)
                `;
            }
            
            params = [
                evento,
                JSON.stringify(dados),
                this.ip_address || null,
                this.user_agent || null
            ];
            
            await dbQuery(insertQuery, params);
            
        } catch (error) {
            console.error('Erro ao registrar evento:', error);
            // Não propagar erro de log
        }
    }
    
    // Estatísticas
    static async getStats() {
        try {
            const isProduction = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;
            
            if (isProduction) {
                // Usar a função de estatísticas do módulo postgres
                const { getStats } = require('../database/postgres');
                return await getStats();
            } else {
                // Usar queries SQLite
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
                        stats[key] = await dbAllQuery(query);
                    } else {
                        const result = await dbGetQuery(query);
                        stats[key] = result.count;
                    }
                }
                
                return stats;
            }
            
        } catch (error) {
            console.error('Erro ao obter estatísticas:', error);
            throw error;
        }
    }
}

module.exports = Lead;