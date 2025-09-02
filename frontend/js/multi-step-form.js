// Sistema Multi-step Form - Incode Academy
class MultiStepForm {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 2;
        this.formData = {};
        this.isTransitioning = false;
        
        this.init();
    }
    
    init() {
        this.createMultiStepStructure();
        this.setupEventListeners();
        this.setupValidation();
        this.initializeStep(1);
    }
    
    createMultiStepStructure() {
        const formContainer = document.querySelector('.form-container');
        const existingForm = document.getElementById('lead-form');
        
        // Criar nova estrutura multi-step
        const multiStepHTML = `
            <div class="form-header">
                <h3 class="form-title">
                    <span class="cyber-text">ACESSE O FUTURO</span>
                </h3>
                <p class="form-subtitle">Comece sua jornada na programação Python</p>
                
                <!-- Progress Bar -->
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 50%"></div>
                    </div>
                    <div class="progress-steps">
                        <div class="progress-step active" data-step="1">
                            <span class="step-number">1</span>
                            <span class="step-label">Dados Básicos</span>
                        </div>
                        <div class="progress-step" data-step="2">
                            <span class="step-number">2</span>
                            <span class="step-label">Contato</span>
                        </div>
                    </div>
                </div>
            </div>

            <form id="multi-step-form" class="multi-step-form">
                <!-- Step 1: Dados Básicos -->
                <div class="form-step active" data-step="1">
                    <div class="step-content">
                        <div class="step-title">
                            <h4>Vamos nos conhecer! 👋</h4>
                            <p>Como podemos te chamar e onde te encontrar?</p>
                        </div>
                        
                        <div class="input-group">
                            <input type="text" id="nome" name="nome" required>
                            <label for="nome">Nome Completo *</label>
                            <span class="input-line"></span>
                            <div class="validation-feedback"></div>
                        </div>

                        <div class="input-group">
                            <input type="email" id="email" name="email" required>
                            <label for="email">Seu melhor E-mail *</label>
                            <span class="input-line"></span>
                            <div class="validation-feedback"></div>
                        </div>
                    </div>
                    
                    <div class="step-actions">
                        <button type="button" class="btn-next" data-next="2">
                            <span>Continuar</span>
                            <svg class="btn-arrow" viewBox="0 0 24 24">
                                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Step 2: Contato -->
                <div class="form-step" data-step="2">
                    <div class="step-content">
                        <div class="step-title">
                            <h4>Quase lá! 📱</h4>
                            <p>Precisamos desses dados para entrar em contato</p>
                        </div>
                        
                        <div class="input-group">
                            <input type="tel" id="telefone" name="telefone" required>
                            <label for="telefone">WhatsApp *</label>
                            <span class="input-line"></span>
                            <div class="validation-feedback"></div>
                            <div class="input-hint">Ex: (11) 99999-9999</div>
                        </div>

                        <div class="input-group">
                            <input type="number" id="idade" name="idade" min="12" max="99" required>
                            <label for="idade">Idade *</label>
                            <span class="input-line"></span>
                            <div class="validation-feedback"></div>
                        </div>
                    </div>
                    
                    <div class="step-actions">
                        <button type="button" class="btn-prev" data-prev="1">
                            <svg class="btn-arrow-left" viewBox="0 0 24 24">
                                <path d="M12 20l1.41-1.41L7.83 13H20v-2H7.83l5.58-5.59L12 4l-8 8z"/>
                            </svg>
                            <span>Voltar</span>
                        </button>
                        
                        <button type="submit" class="btn-submit">
                            <span class="btn-text">INICIAR JORNADA</span>
                            <span class="btn-loading">PROCESSANDO...</span>
                            <div class="btn-particles"></div>
                        </button>
                    </div>
                </div>
            </form>
        `;
        
        // Substituir conteúdo
        formContainer.innerHTML = multiStepHTML;
    }
    
    setupEventListeners() {
        const form = document.getElementById('multi-step-form');
        
        // Botões de navegação
        form.addEventListener('click', (e) => {
            if (e.target.closest('.btn-next')) {
                const nextStep = parseInt(e.target.closest('.btn-next').dataset.next);
                this.goToStep(nextStep);
            }
            
            if (e.target.closest('.btn-prev')) {
                const prevStep = parseInt(e.target.closest('.btn-prev').dataset.prev);
                this.goToStep(prevStep);
            }
        });
        
        // Submit do formulário
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
        
        // Validação em tempo real
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.validateField(input));
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('focus', () => this.clearFieldError(input));
        });
        
        // Enter para próximo step
        form.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.currentStep === 1) {
                e.preventDefault();
                const nextBtn = form.querySelector('.btn-next');
                if (nextBtn && !nextBtn.disabled) {
                    nextBtn.click();
                }
            }
        });
    }
    
    setupValidation() {
        this.validationRules = {
            nome: {
                required: true,
                minLength: 2,
                maxLength: 100,
                pattern: /^[a-zA-ZÀ-ÿ\u00C0-\u017F\s'-]+$/,
                messages: {
                    required: 'Nome é obrigatório',
                    minLength: 'Nome deve ter pelo menos 2 caracteres',
                    maxLength: 'Nome muito longo (máx 100 caracteres)',
                    pattern: 'Nome deve conter apenas letras'
                }
            },
            email: {
                required: true,
                pattern: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
                messages: {
                    required: 'E-mail é obrigatório',
                    pattern: 'Digite um e-mail válido'
                }
            },
            telefone: {
                required: true,
                minLength: 10,
                pattern: /^(\(\d{2}\)\s?)?\d{4,5}-?\d{4}$/,
                messages: {
                    required: 'WhatsApp é obrigatório',
                    minLength: 'Digite um número válido',
                    pattern: 'Formato: (11) 99999-9999'
                }
            },
            idade: {
                required: true,
                min: 12,
                max: 99,
                messages: {
                    required: 'Idade é obrigatória',
                    min: 'Idade mínima: 12 anos',
                    max: 'Idade máxima: 99 anos'
                }
            }
        };
    }
    
    validateField(field) {
        const rules = this.validationRules[field.name];
        if (!rules) return true;
        
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';
        
        // Required
        if (rules.required && !value) {
            isValid = false;
            errorMessage = rules.messages.required;
        }
        
        // MinLength
        else if (value && rules.minLength && value.length < rules.minLength) {
            isValid = false;
            errorMessage = rules.messages.minLength;
        }
        
        // MaxLength
        else if (value && rules.maxLength && value.length > rules.maxLength) {
            isValid = false;
            errorMessage = rules.messages.maxLength;
        }
        
        // Min (números)
        else if (value && rules.min && parseInt(value) < rules.min) {
            isValid = false;
            errorMessage = rules.messages.min;
        }
        
        // Max (números)
        else if (value && rules.max && parseInt(value) > rules.max) {
            isValid = false;
            errorMessage = rules.messages.max;
        }
        
        // Pattern
        else if (value && rules.pattern && !rules.pattern.test(value)) {
            isValid = false;
            errorMessage = rules.messages.pattern;
        }
        
        this.showValidationFeedback(field, isValid, errorMessage);
        this.updateStepNavigation();
        
        return isValid;
    }
    
    showValidationFeedback(field, isValid, message) {
        const inputGroup = field.closest('.input-group');
        const feedback = inputGroup.querySelector('.validation-feedback');
        const inputLine = inputGroup.querySelector('.input-line');
        
        // Remover classes anteriores
        inputGroup.classList.remove('valid', 'invalid');
        feedback.classList.remove('show');
        
        if (!isValid && message) {
            // Campo inválido
            inputGroup.classList.add('invalid');
            feedback.textContent = message;
            feedback.classList.add('show', 'error');
            inputLine.style.background = '#ff4444';
        } else if (field.value.trim() && isValid) {
            // Campo válido
            inputGroup.classList.add('valid');
            feedback.textContent = '✓ Perfeito!';
            feedback.classList.add('show', 'success');
            inputLine.style.background = '#00ff88';
        } else {
            // Estado neutro
            inputLine.style.background = '';
        }
    }
    
    clearFieldError(field) {
        const inputGroup = field.closest('.input-group');
        const feedback = inputGroup.querySelector('.validation-feedback');
        const inputLine = inputGroup.querySelector('.input-line');
        
        inputGroup.classList.remove('invalid');
        feedback.classList.remove('show', 'error');
        inputLine.style.background = '';
    }
    
    validateCurrentStep() {
        const currentStepElement = document.querySelector(`.form-step[data-step="${this.currentStep}"]`);
        const inputs = currentStepElement.querySelectorAll('input[required]');
        let stepIsValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                stepIsValid = false;
            }
        });
        
        return stepIsValid;
    }
    
    updateStepNavigation() {
        const nextBtn = document.querySelector('.btn-next');
        
        if (nextBtn) {
            const isValid = this.validateCurrentStep();
            nextBtn.disabled = !isValid;
            nextBtn.classList.toggle('disabled', !isValid);
        }
    }
    
    goToStep(stepNumber) {
        if (this.isTransitioning) return;
        
        // Validar step atual antes de avançar
        if (stepNumber > this.currentStep && !this.validateCurrentStep()) {
            this.shakeCurrentStep();
            return;
        }
        
        this.isTransitioning = true;
        
        // Salvar dados do step atual
        this.saveCurrentStepData();
        
        // Animar transição
        this.animateStepTransition(this.currentStep, stepNumber);
        
        // Atualizar estado
        this.currentStep = stepNumber;
        
        // Atualizar progress bar
        this.updateProgressBar();
        
        // Focar no primeiro input do novo step
        setTimeout(() => {
            this.focusFirstInput();
            this.isTransitioning = false;
        }, 400);
    }
    
    animateStepTransition(fromStep, toStep) {
        const fromElement = document.querySelector(`.form-step[data-step="${fromStep}"]`);
        const toElement = document.querySelector(`.form-step[data-step="${toStep}"]`);
        const direction = toStep > fromStep ? 'left' : 'right';
        
        // Animar saída
        fromElement.classList.add(`slide-out-${direction}`);
        
        setTimeout(() => {
            fromElement.classList.remove('active', `slide-out-${direction}`);
            toElement.classList.add('active');
            toElement.classList.add(`slide-in-${direction === 'left' ? 'right' : 'left'}`);
            
            setTimeout(() => {
                toElement.classList.remove(`slide-in-${direction === 'left' ? 'right' : 'left'}`);
            }, 50);
        }, 200);
    }
    
    shakeCurrentStep() {
        const currentStepElement = document.querySelector(`.form-step[data-step="${this.currentStep}"]`);
        currentStepElement.classList.add('shake');
        
        setTimeout(() => {
            currentStepElement.classList.remove('shake');
        }, 500);
    }
    
    updateProgressBar() {
        const progressFill = document.querySelector('.progress-fill');
        const progressSteps = document.querySelectorAll('.progress-step');
        
        // Atualizar barra
        const percentage = (this.currentStep / this.totalSteps) * 100;
        progressFill.style.width = `${percentage}%`;
        
        // Atualizar steps
        progressSteps.forEach((step, index) => {
            const stepNumber = index + 1;
            step.classList.toggle('active', stepNumber <= this.currentStep);
            step.classList.toggle('completed', stepNumber < this.currentStep);
        });
    }
    
    focusFirstInput() {
        const currentStepElement = document.querySelector(`.form-step[data-step="${this.currentStep}"]`);
        const firstInput = currentStepElement.querySelector('input');
        if (firstInput) {
            firstInput.focus();
        }
    }
    
    saveCurrentStepData() {
        const currentStepElement = document.querySelector(`.form-step[data-step="${this.currentStep}"]`);
        const inputs = currentStepElement.querySelectorAll('input');
        
        inputs.forEach(input => {
            this.formData[input.name] = input.value.trim();
        });
    }
    
    async handleSubmit() {
        // Salvar dados do último step
        this.saveCurrentStepData();
        
        // Validar todos os dados
        if (!this.validateAllData()) {
            return;
        }
        
        // Mostrar loading
        const submitBtn = document.querySelector('.btn-submit');
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        
        try {
            // Preparar dados para envio
            const leadData = {
                nome: this.formData.nome,
                email: this.formData.email.toLowerCase(),
                telefone: this.formData.telefone.replace(/\D/g, ''),
                idade: parseInt(this.formData.idade)
            };
            
            // Enviar para API (reutilizar lógica existente)
            const response = await this.sendToAPI(leadData);
            
            if (response.success) {
                this.showSuccess();
                
                // Disparar evento
                document.dispatchEvent(new CustomEvent('leadCaptured', {
                    detail: { leadData, response }
                }));
            } else {
                throw new Error(response.error || 'Erro desconhecido');
            }
            
        } catch (error) {
            this.showError(error.message);
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }
    
    validateAllData() {
        // Implementar validação completa se necessário
        return true;
    }
    
    async sendToAPI(data) {
        // Reutilizar lógica do form-handler existente
        const apiUrl = this.detectApiUrl();
        
        const response = await fetch(`${apiUrl}/leads`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        return await response.json();
    }
    
    detectApiUrl() {
        const hostname = window.location.hostname;
        const port = window.location.port;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return port === '3000' ? 'http://localhost:3001/api' : '/api';
        }
        
        return '/api';
    }
    
    showSuccess() {
        // Mostrar modal de sucesso (reutilizar existente)
        if (window.incodeAnimations) {
            window.incodeAnimations.showSuccessModal();
        }
    }
    
    showError(message) {
        // Implementar feedback de erro
        console.error('Erro:', message);
    }
    
    initializeStep(stepNumber) {
        this.currentStep = stepNumber;
        this.updateProgressBar();
        this.focusFirstInput();
        
        // Setup máscaras de input
        this.setupInputMasks();
    }
    
    setupInputMasks() {
        const telefoneInput = document.getElementById('telefone');
        if (telefoneInput) {
            telefoneInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                
                if (value.length >= 11) {
                    value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
                } else if (value.length >= 7) {
                    value = value.replace(/(\d{2})(\d{4})(\d+)/, '($1) $2-$3');
                } else if (value.length >= 3) {
                    value = value.replace(/(\d{2})(\d+)/, '($1) $2');
                }
                
                e.target.value = value;
            });
        }
    }
}

// Inicializar quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se deve usar multi-step (pode ser configurável)
    if (document.querySelector('.form-container')) {
        window.multiStepForm = new MultiStepForm();
    }
});