// Sistema Avançado de Captação de Leads - Form Handler
class IncodeFormHandler {
    constructor() {
        this.form = document.getElementById('lead-form');
        this.submitBtn = document.querySelector('.submit-btn');
        this.modal = document.getElementById('success-modal');
        this.apiUrl = this.detectApiUrl();
        
        this.init();
    }
    
    detectApiUrl() {
        // Detectar se estamos em produção ou desenvolvimento
        const hostname = window.location.hostname;
        const port = window.location.port;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return port === '3000' ? 'http://localhost:3001/api' : '/api';
        }
        
        return '/api'; // Produção
    }
    
    init() {
        if (this.form) {
            this.setupEventListeners();
            this.setupFormValidation();
            this.setupInputMasks();
        }
    }
    
    setupEventListeners() {
        // Submit do formulário
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });
        
        // Fechar modal - event listener será adicionado dinamicamente no showCustomModal
        // Mantendo este espaço para compatibilidade com modals estáticos

        // Fechar modal clicando fora - usando método confiável
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    console.log('🔄 Fechando modal clicando fora...');
                    this.hideModalCompletely();
                }
            });
        }
        
        // Eventos de input para validação em tempo real
        const inputs = this.form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }
    
    setupFormValidation() {
        // Validação personalizada para cada campo
        const validations = {
            nome: {
                required: true,
                minLength: 2,
                maxLength: 100,
                pattern: /^[a-zA-ZÀ-ÿ\s]+$/,
                message: 'Nome deve ter entre 2-100 caracteres e conter apenas letras'
            },
            email: {
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Digite um email válido'
            },
            telefone: {
                required: true,
                minLength: 10,
                message: 'Digite um telefone válido com DDD'
            },
            idade: {
                required: true,
                min: 12,
                max: 99,
                message: 'Idade deve estar entre 12 e 99 anos'
            },
        };
        
        this.validations = validations;
    }
    
    setupInputMasks() {
        const telefoneInput = document.getElementById('telefone');
        
        if (telefoneInput) {
            // Máscara para telefone brasileiro
            telefoneInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                
                if (value.length <= 11) {
                    if (value.length <= 10) {
                        value = value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
                    } else {
                        value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
                    }
                }
                
                e.target.value = value;
            });
        }
    }
    
    validateField(field) {
        const validation = this.validations[field.name];
        if (!validation) return true;
        
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';
        
        // Required
        if (validation.required && !value) {
            isValid = false;
            errorMessage = 'Este campo é obrigatório';
        }
        
        // Min/Max length
        if (value && validation.minLength && value.length < validation.minLength) {
            isValid = false;
            errorMessage = validation.message;
        }
        
        if (value && validation.maxLength && value.length > validation.maxLength) {
            isValid = false;
            errorMessage = validation.message;
        }
        
        // Min/Max value (for numbers)
        if (value && validation.min && parseInt(value) < validation.min) {
            isValid = false;
            errorMessage = validation.message;
        }
        
        if (value && validation.max && parseInt(value) > validation.max) {
            isValid = false;
            errorMessage = validation.message;
        }
        
        // Pattern
        if (value && validation.pattern && !validation.pattern.test(value)) {
            isValid = false;
            errorMessage = validation.message;
        }
        
        // Mostrar/ocultar erro
        this.showFieldError(field, isValid ? '' : errorMessage);
        
        return isValid;
    }
    
    showFieldError(field, message) {
        const inputGroup = field.closest('.input-group');
        let errorElement = inputGroup.querySelector('.field-error');
        
        if (message) {
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.className = 'field-error';
                errorElement.style.cssText = `
                    color: #ff4444;
                    font-size: 0.85rem;
                    margin-top: 0.5rem;
                    opacity: 0;
                    transform: translateY(-10px);
                    transition: all 0.3s ease;
                `;
                inputGroup.appendChild(errorElement);
            }
            
            errorElement.textContent = message;
            
            // Animar entrada
            requestAnimationFrame(() => {
                errorElement.style.opacity = '1';
                errorElement.style.transform = 'translateY(0)';
            });
            
            // Adicionar borda vermelha
            field.style.borderBottomColor = '#ff4444';
            
        } else {
            if (errorElement) {
                errorElement.style.opacity = '0';
                errorElement.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    if (errorElement.parentNode) {
                        errorElement.parentNode.removeChild(errorElement);
                    }
                }, 300);
            }
            
            // Remover borda vermelha
            field.style.borderBottomColor = '';
        }
    }
    
    clearFieldError(field) {
        const inputGroup = field.closest('.input-group');
        const errorElement = inputGroup.querySelector('.field-error');
        
        if (errorElement) {
            errorElement.style.opacity = '0';
            setTimeout(() => {
                if (errorElement.parentNode) {
                    errorElement.parentNode.removeChild(errorElement);
                }
            }, 300);
        }
        
        field.style.borderBottomColor = '';
    }
    
    validateForm() {
        const inputs = this.form.querySelectorAll('input[required], select[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    async handleFormSubmit() {
        console.log('🚀 Processando envio do formulário...');

        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
            try {
                // Validar formulário
                if (!this.validateForm()) {
                    this.showFormError('Por favor, corrija os erros antes de continuar.');
                    return;
                }

                // Mostrar loading
                this.setSubmitLoading(true);

                // Coletar dados do formulário (usando Site Mode Manager se disponível)
                let leadData;
                if (window.siteModeManager) {
                    leadData = window.siteModeManager.getFormData();
                } else {
                    // Fallback se o mode manager não estiver disponível
                    const formData = new FormData(this.form);
                    leadData = {
                        nome: formData.get('nome').trim(),
                        email: formData.get('email').trim().toLowerCase(),
                        telefone: formData.get('telefone').replace(/\D/g, ''),
                        idade: parseInt(formData.get('idade')),
                        tipo_lead: 'geral',
                        curso_pretendido: 'Python'
                    };
                }

                console.log('📤 Enviando dados:', {
                    email: leadData.email,
                    nome: leadData.nome,
                    tentativa: retryCount + 1
                });

                // Enviar para API com timeout
                const response = await Promise.race([
                    this.sendToAPI(leadData),
                    this.timeout(10000, { success: false, message: 'Timeout' })
                ]);

                console.log('🔍 Resposta completa da API:', response);

            if (response.success) {
                console.log('✅ Lead processado com sucesso!', response);

                // Disparar evento personalizado
                document.dispatchEvent(new CustomEvent('leadCaptured', {
                    detail: { leadData, response }
                }));

                // Mostrar modal diretamente baseado na resposta
                this.showCustomModal(response);

                // Limpar formulário apenas se não for participação existente
                if (!response.existingParticipation) {
                    this.form.reset();
                }

                // Remover todos os erros
                this.clearAllErrors();

                return; // Sucesso, sair do loop

            } else {
                console.error('❌ Response.success = false:', response);
                throw new Error(response.error || response.message || 'Erro desconhecido');
            }

        } catch (error) {
            retryCount++;
            console.error(`❌ Tentativa ${retryCount} falhou:`, error);

            if (retryCount >= maxRetries) {
                let errorMessage = 'Sistema temporariamente indisponível. Tente novamente em alguns minutos.';

                if (error.message.includes('já cadastrado')) {
                    errorMessage = 'Este email já está cadastrado! Entre em contato conosco.';
                } else if (error.message.includes('inválidos')) {
                    errorMessage = 'Dados inválidos. Verifique as informações.';
                } else if (error.message.includes('Failed to fetch') || error.message.includes('Timeout')) {
                    errorMessage = 'Erro de conexão. Seus dados foram salvos localmente. Tente novamente.';
                    // Salvar dados localmente como backup
                    this.saveToLocalStorage(leadData);
                }

                this.showFormError(errorMessage);
                break;
            } else {
                // Aguardar antes de tentar novamente (backoff exponencial)
                await this.delay(1000 * Math.pow(2, retryCount - 1));
                continue;
            }

        } finally {
            this.setSubmitLoading(false);
        }
        }
    }

    // Timeout helper
    timeout(ms, fallbackValue) {
        return new Promise(resolve => setTimeout(() => resolve(fallbackValue), ms));
    }

    // Delay helper
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Salvar dados localmente em caso de falha
    saveToLocalStorage(data) {
        try {
            const backupData = {
                ...data,
                timestamp: new Date().toISOString(),
                status: 'backup'
            };
            localStorage.setItem('incode_lead_backup', JSON.stringify(backupData));
            console.log('💾 Dados salvos localmente como backup');
        } catch (error) {
            console.error('Erro ao salvar backup local:', error);
        }
    }
    
    async sendToAPI(leadData) {
        const response = await fetch(`${this.apiUrl}/leads`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(leadData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        return await response.json();
    }
    
    setSubmitLoading(isLoading) {
        if (isLoading) {
            this.submitBtn.classList.add('loading');
            this.submitBtn.disabled = true;
            
            // Adicionar efeito de partículas
            if (window.incodeAnimations) {
                window.incodeAnimations.createButtonParticles(this.submitBtn);
            }
            
        } else {
            this.submitBtn.classList.remove('loading');
            this.submitBtn.disabled = false;
        }
    }
    
    showFormError(message) {
        // Remover erro anterior
        this.clearFormError();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-error';
        errorDiv.style.cssText = `
            background: rgba(255, 68, 68, 0.1);
            border: 1px solid #ff4444;
            border-radius: 8px;
            padding: 1rem;
            margin-top: 1rem;
            color: #ff4444;
            text-align: center;
            font-weight: 500;
            opacity: 0;
            transform: translateY(-10px);
            transition: all 0.3s ease;
        `;
        
        errorDiv.textContent = message;
        this.form.appendChild(errorDiv);
        
        // Animar entrada
        requestAnimationFrame(() => {
            errorDiv.style.opacity = '1';
            errorDiv.style.transform = 'translateY(0)';
        });
        
        // Auto-remover após 5 segundos
        setTimeout(() => {
            this.clearFormError();
        }, 5000);
    }
    
    clearFormError() {
        const errorElement = this.form.querySelector('.form-error');
        if (errorElement) {
            errorElement.style.opacity = '0';
            setTimeout(() => {
                if (errorElement.parentNode) {
                    errorElement.parentNode.removeChild(errorElement);
                }
            }, 300);
        }
    }
    
    clearAllErrors() {
        const errorElements = this.form.querySelectorAll('.field-error, .form-error');
        errorElements.forEach(element => {
            element.style.opacity = '0';
            setTimeout(() => {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            }, 300);
        });
        
        // Limpar bordas coloridas
        const inputs = this.form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.style.borderBottomColor = '';
        });
    }
    
    // Mostrar modal personalizado baseado na resposta (versão simplificada e confiável)
    showCustomModal(response) {
        console.log('🎭 showCustomModal chamado com:', response);

        const modal = document.getElementById('success-modal');
        if (!modal) {
            console.error('❌ Modal não encontrado!');
            return;
        }

        const modalContent = modal.querySelector('.modal-content');
        if (!modalContent) {
            console.error('❌ Modal content não encontrado!');
            return;
        }

        // Determinar qual modal mostrar baseado na resposta
        let modalHTML = '';

        // Lead já existe (re-cadastro)
        if (!response.isNewLead && !response.isNewParticipation) {
            console.log('🔄 Preparando modal para lead existente...');
            const timestampInfo = response.timestamp ? `<small style="color: #666; margin-top: 10px; display: block;">Atualizado em: ${response.timestamp}</small>` : '';
            modalHTML = `
                <div class="success-animation">
                    <div class="checkmark">
                        <svg viewBox="0 0 52 52">
                            <circle cx="26" cy="26" r="25" fill="none"/>
                            <path fill="none" d="m14.1,27.2l7.1,7.2 16.7-16.8"/>
                        </svg>
                    </div>
                </div>
                <h3>Bem-vindo de volta! 🎯</h3>
                <p><strong>${response.message}</strong></p>
                <p>Seus dados foram atualizados em nosso sistema. Nossa equipe entrará em contato em breve!</p>
                ${timestampInfo}
                <button id="close-modal" class="modal-btn">Continuar</button>
            `;
        } else {
            // Lead novo - modal padrão
            console.log('✨ Preparando modal para lead novo...');
            const timestampInfo = response.timestamp ? `<small style="color: #666; margin-top: 10px; display: block;">Cadastrado em: ${response.timestamp}</small>` : '';
            modalHTML = `
                <div class="success-animation">
                    <div class="checkmark">
                        <svg viewBox="0 0 52 52">
                            <circle cx="26" cy="26" r="25" fill="none"/>
                            <path fill="none" d="m14.1,27.2l7.1,7.2 16.7-16.8"/>
                        </svg>
                    </div>
                </div>
                <h3>Bem-vindo à Incode Academy! 🚀</h3>
                <p>Seus dados foram salvos com sucesso! Em breve nossa equipe entrará em contato.</p>
                ${timestampInfo}
                <button id="close-modal" class="modal-btn">Continuar Explorando</button>
            `;
        }

        // STEP 1: Esconder modal completamente primeiro
        console.log('🔄 Escondendo modal primeiro...');
        modal.style.display = 'none';
        modal.style.opacity = '0';

        // Parar qualquer animação GSAP em andamento
        if (window.gsap) {
            window.gsap.killTweensOf(modal);
            window.gsap.killTweensOf('.modal-content');
            window.gsap.killTweensOf('.checkmark');
            window.gsap.killTweensOf('.modal-content h3, .modal-content p');
        }

        // STEP 2: Atualizar conteúdo
        modalContent.innerHTML = modalHTML;

        // STEP 3: Configurar event listener limpo do botão fechar
        const closeBtn = modal.querySelector('#close-modal');
        if (closeBtn) {
            // Remover listeners antigos clonando o botão
            const newCloseBtn = closeBtn.cloneNode(true);
            closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);

            // Adicionar listener limpo
            newCloseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔄 Fechando modal via botão...');
                this.hideModalCompletely();
            });
        }

        // STEP 4: Aguardar e mostrar modal
        setTimeout(() => {
            console.log('🎭 Exibindo modal agora...');

            // Mostrar o modal com CSS direto (sem animação complexa)
            modal.style.display = 'block';
            modal.style.opacity = '1';
            modal.style.zIndex = '999999';
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';

            // Garantir posicionamento central correto
            const content = modal.querySelector('.modal-content');
            if (content) {
                content.style.position = 'fixed';
                content.style.top = '50%';
                content.style.left = '50%';
                content.style.transform = 'translate(-50%, -50%)';
                content.style.zIndex = '1001';
                content.style.opacity = '1';
            }

            console.log('✅ Modal exibido com CSS direto!');

            // Verificar se está visível
            const isVisible = modal.offsetHeight > 0;
            console.log('🔍 Modal visível:', isVisible);

        }, 200); // Delay menor para resposta mais rápida
    }

    // Método para esconder modal completamente
    hideModalCompletely() {
        const modal = document.getElementById('success-modal');
        if (modal) {
            console.log('🔄 Escondendo modal completamente...');

            // Parar animações
            if (window.gsap) {
                window.gsap.killTweensOf(modal);
                window.gsap.killTweensOf('.modal-content');
            }

            // Esconder com CSS direto
            modal.style.display = 'none';
            modal.style.opacity = '0';
        }
    }

    // Método público para analytics
    trackEvent(eventName, data) {
        // Integração com Google Analytics, Facebook Pixel, etc.
        console.log('📊 Evento:', eventName, data);

        // Google Analytics (se disponível)
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, data);
        }

        // Facebook Pixel (se disponível)
        if (typeof fbq !== 'undefined') {
            fbq('track', eventName, data);
        }
    }
}

// Event listeners para analytics
document.addEventListener('leadCaptured', (event) => {
    const { leadData } = event.detail;
    
    // Track no analytics
    if (window.incodeFormHandler) {
        window.incodeFormHandler.trackEvent('lead_captured', {
            idade: leadData.idade,
            value: 100 // Valor estimado do lead
        });
    }
});

// Inicializar quando DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    window.incodeFormHandler = new IncodeFormHandler();
    console.log('✅ Form handler inicializado!');
});