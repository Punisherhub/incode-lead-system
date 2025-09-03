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
        
        // Fechar modal
        const closeModal = document.getElementById('close-modal');
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                if (window.incodeAnimations) {
                    window.incodeAnimations.hideSuccessModal();
                }
            });
        }
        
        // Fechar modal clicando fora
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    if (window.incodeAnimations) {
                        window.incodeAnimations.hideSuccessModal();
                    }
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
        
        // Validar formulário
        if (!this.validateForm()) {
            this.showFormError('Por favor, corrija os erros antes de continuar.');
            return;
        }
        
        // Mostrar loading
        this.setSubmitLoading(true);
        
        try {
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
                nome: leadData.nome
            });
            
            // Enviar para API
            const response = await this.sendToAPI(leadData);
            
            if (response.success) {
                console.log('✅ Lead cadastrado com sucesso!');
                
                // Mostrar modal de sucesso
                if (window.incodeAnimations) {
                    window.incodeAnimations.showSuccessModal();
                }
                
                // Limpar formulário
                this.form.reset();
                
                // Remover todos os erros
                this.clearAllErrors();
                
                // Disparar evento personalizado
                document.dispatchEvent(new CustomEvent('leadCaptured', {
                    detail: { leadData, response }
                }));
                
            } else {
                throw new Error(response.error || 'Erro desconhecido');
            }
            
        } catch (error) {
            console.error('❌ Erro ao enviar formulário:', error);
            
            let errorMessage = 'Erro ao processar sua solicitação. Tente novamente.';
            
            if (error.message.includes('já cadastrado')) {
                errorMessage = 'Este email já está cadastrado! Entre em contato conosco.';
            } else if (error.message.includes('inválidos')) {
                errorMessage = 'Dados inválidos. Verifique as informações.';
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
            }
            
            this.showFormError(errorMessage);
            
        } finally {
            this.setSubmitLoading(false);
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