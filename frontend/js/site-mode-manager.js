/**
 * Site Mode Manager - Gerencia alternância entre modos do site
 * Permite alternar entre Captação Geral e Workshop/Eventos
 */

class SiteModeManager {
    constructor() {
        this.currentMode = 'general';
        this.workshopConfig = {
            eventName: 'Workshop Mês do Programador',
            eventDate: '17 e 18 de Setembro', 
            eventMainTitle: 'PROGRAMAÇÃO COM PYTHON',
            eventSubtitle: 'Workshop Mês do Programador'
        };
        this.apiUrl = this.detectApiUrl();
        
        this.init();
    }
    
    detectApiUrl() {
        const hostname = window.location.hostname;
        const port = window.location.port;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return port === '3000' ? 'http://localhost:3001/api' : '/api';
        }
        
        return '/api'; // Produção
    }
    
    async init() {
        console.log('🎯 Inicializando Site Mode Manager...');
        await this.loadCurrentMode();
        this.applyMode();
    }
    
    // Carregar configuração atual do backend
    async loadCurrentMode() {
        try {
            const response = await fetch(`${this.apiUrl}/config`);
            const data = await response.json();
            
            if (data.success && data.data) {
                this.currentMode = data.data.mode || 'general';
                if (data.data.workshopConfig) {
                    this.workshopConfig = { ...this.workshopConfig, ...data.data.workshopConfig };
                }
                console.log(`✅ Modo carregado: ${this.currentMode}`, this.workshopConfig);
            }
        } catch (error) {
            console.warn('⚠️ Erro ao carregar configuração, usando modo padrão:', error);
            this.currentMode = 'general';
        }
    }
    
    // Aplicar configurações baseadas no modo
    applyMode() {
        console.log(`🔄 Aplicando modo: ${this.currentMode}`);
        
        if (this.currentMode === 'workshop') {
            this.applyWorkshopMode();
        } else {
            this.applyGeneralMode();
        }
        
        // Adicionar campo específico do workshop se necessário
        this.updateForm();
    }
    
    // Aplicar modo de captação geral
    applyGeneralMode() {
        // Título principal
        const heroTitle = document.querySelector('.hero-title');
        if (heroTitle) {
            heroTitle.innerHTML = `
                <span class="glitch" data-text="DOMINE">DOMINE</span>
                <span class="highlight">PYTHON</span>
                <span class="glitch" data-text="AGORA">AGORA</span>
            `;
        }
        
        // Título do formulário
        const formTitle = document.querySelector('.form-title .cyber-text');
        if (formTitle) {
            formTitle.textContent = 'ACESSE O FUTURO';
        }
        
        // Subtítulo do formulário
        const formSubtitle = document.querySelector('.form-subtitle');
        if (formSubtitle) {
            formSubtitle.textContent = 'Comece sua jornada na programação Python';
        }
        
        // Botão de submit
        const submitBtnText = document.querySelector('.submit-btn .btn-text');
        if (submitBtnText) {
            submitBtnText.textContent = 'INICIAR JORNADA';
        }
        
        // Descrição hero
        const heroDescription = document.querySelector('.hero-description');
        if (heroDescription) {
            heroDescription.textContent = 'Domine Python para moldar seu futuro e se destacar em qualquer área!';
        }
    }
    
    // Aplicar modo workshop
    applyWorkshopMode() {
        // Título principal
        const heroTitle = document.querySelector('.hero-title');
        if (heroTitle) {
            const mainTitle = this.workshopConfig.eventMainTitle.split(' ');
            if (mainTitle.length >= 2) {
                heroTitle.innerHTML = `
                    <span class="glitch" data-text="${mainTitle[0]}">${mainTitle[0]}</span>
                    <span class="highlight">${mainTitle.slice(1).join(' ')}</span>
                `;
            } else {
                heroTitle.innerHTML = `
                    <span class="highlight">${this.workshopConfig.eventMainTitle}</span>
                `;
            }
        }
        
        // Título do formulário
        const formTitle = document.querySelector('.form-title .cyber-text');
        if (formTitle) {
            formTitle.textContent = 'INSCREVA-SE';
        }
        
        // Subtítulo do formulário
        const formSubtitle = document.querySelector('.form-subtitle');
        if (formSubtitle) {
            formSubtitle.textContent = this.workshopConfig.eventSubtitle;
        }
        
        // Botão de submit
        const submitBtnText = document.querySelector('.submit-btn .btn-text');
        if (submitBtnText) {
            submitBtnText.textContent = 'INSCREVA-SE';
        }
        
        // Descrição hero
        const heroDescription = document.querySelector('.hero-description');
        if (heroDescription) {
            heroDescription.textContent = `Participe do ${this.workshopConfig.eventName} nos dias ${this.workshopConfig.eventDate}!`;
        }
    }
    
    // Atualizar formulário baseado no modo
    updateForm() {
        if (this.currentMode === 'workshop') {
            this.addWorkshopFields();
            this.updateFormValidation();
        } else {
            this.removeWorkshopFields();
        }
    }
    
    // Adicionar campos específicos do workshop
    addWorkshopFields() {
        const formGrid = document.querySelector('.form-grid');
        if (!formGrid) return;
        
        // Verificar se o campo já existe
        if (document.getElementById('dia_evento')) return;
        
        // Criar campo de seleção de dia
        const diaEventoGroup = document.createElement('div');
        diaEventoGroup.className = 'input-group';
        diaEventoGroup.innerHTML = `
            <select id="dia_evento" name="dia_evento" required>
                <option value="">Selecione o dia</option>
                <option value="17">17 de Setembro</option>
                <option value="18">18 de Setembro</option>
            </select>
            <label for="dia_evento" class="select-label">Dia de Preferência</label>
            <span class="input-line"></span>
        `;
        
        // Inserir antes do último campo (idade)
        const lastChild = formGrid.lastElementChild;
        formGrid.insertBefore(diaEventoGroup, lastChild);
        
        // Aplicar estilo ao select
        const select = diaEventoGroup.querySelector('select');
        select.style.cssText = `
            width: 100%;
            padding: 18px 12px 8px 0;
            border: none;
            border-bottom: 2px solid rgba(255, 255, 255, 0.2);
            background: transparent;
            color: white;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 16px;
            outline: none;
            transition: all 0.3s ease;
            appearance: none;
            cursor: pointer;
            position: relative;
            z-index: 1;
        `;
        
        // Estilizar as opções do select
        const style = document.createElement('style');
        style.textContent = `
            select#dia_evento option {
                background: #1a1a2e !important;
                color: white !important;
                padding: 10px !important;
                font-size: 16px !important;
                border: none !important;
            }
            
            select#dia_evento option:hover {
                background: #00d4ff !important;
                color: #000 !important;
            }
            
            select#dia_evento option:checked {
                background: #00d4ff !important;
                color: #000 !important;
            }
            
            select#dia_evento:focus {
                border-bottom-color: #00d4ff;
                box-shadow: 0 2px 0 #00d4ff;
            }
            
            /* Estilo específico para label do select */
            .input-group .select-label {
                position: absolute;
                top: 2px;
                left: 0;
                color: #00d4ff;
                font-size: 12px;
                font-weight: 500;
                transition: all 0.3s ease;
                pointer-events: none;
                z-index: 2;
                transform: scale(0.8);
            }
            
            /* Ajustar posicionamento do input-group para o select */
            .input-group:has(select) {
                position: relative;
                margin-bottom: 25px;
            }
        `;
        document.head.appendChild(style);
        
        // Evento de mudança para label
        select.addEventListener('change', function() {
            const label = this.parentNode.querySelector('label');
            if (this.value) {
                label.style.transform = 'translateY(-20px) scale(0.8)';
                label.style.color = '#00d4ff';
            } else {
                label.style.transform = '';
                label.style.color = '';
            }
        });
    }
    
    // Remover campos específicos do workshop
    removeWorkshopFields() {
        const diaEventoField = document.getElementById('dia_evento');
        if (diaEventoField) {
            diaEventoField.closest('.input-group').remove();
        }
    }
    
    // Atualizar validação do formulário
    updateFormValidation() {
        if (window.incodeFormHandler && this.currentMode === 'workshop') {
            // Adicionar validação para dia_evento
            window.incodeFormHandler.validations.dia_evento = {
                required: true,
                message: 'Selecione o dia de sua preferência'
            };
        }
    }
    
    // Atualizar modal de sucesso
    updateSuccessModal() {
        const modal = document.getElementById('success-modal');
        if (!modal) return;
        
        const modalContent = modal.querySelector('.modal-content');
        if (!modalContent) return;
        
        if (this.currentMode === 'workshop') {
            modalContent.innerHTML = `
                <div class="success-animation">
                    <div class="checkmark">
                        <svg viewBox="0 0 52 52">
                            <circle cx="26" cy="26" r="25" fill="none"/>
                            <path fill="none" d="m14.1,27.2l7.1,7.2 16.7-16.8"/>
                        </svg>
                    </div>
                </div>
                <h3>Inscrição realizada com sucesso! 🎓</h3>
                <p><strong>A Incode Academy agradece seu interesse no workshop!</strong></p>
                <p>Sua inscrição foi registrada. Temos apenas <strong>16 vagas para cada dia</strong> (17 e 18 de setembro), por isso nossa equipe analisará as inscrições e entrará em contato apenas com os selecionados.</p>
                <p style="color: #00d4ff; font-weight: 500; margin-top: 15px;">📱📧 Fique atento ao seu WhatsApp e seu e-mail nos próximos dias!</p>
                <button id="close-modal" class="modal-btn">Continuar</button>
            `;
            
            // Re-adicionar event listener no botão close
            const closeModalBtn = modal.querySelector('#close-modal');
            if (closeModalBtn && window.incodeAnimations) {
                closeModalBtn.addEventListener('click', () => {
                    window.incodeAnimations.hideSuccessModal();
                });
            }
        } else {
            // Modal original
            modalContent.innerHTML = `
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
                <button id="close-modal" class="modal-btn">Continuar Explorando</button>
            `;
            
            // Re-adicionar event listener no botão close
            const closeModalBtn = modal.querySelector('#close-modal');
            if (closeModalBtn && window.incodeAnimations) {
                closeModalBtn.addEventListener('click', () => {
                    window.incodeAnimations.hideSuccessModal();
                });
            }
        }
    }
    
    // Método público para obter dados do formulário com campos específicos do modo
    getFormData() {
        const formData = new FormData(document.getElementById('lead-form'));
        const leadData = {
            nome: formData.get('nome')?.trim(),
            email: formData.get('email')?.trim().toLowerCase(),
            telefone: formData.get('telefone')?.replace(/\D/g, ''),
            idade: parseInt(formData.get('idade'))
        };
        
        // Adicionar campos específicos do workshop
        if (this.currentMode === 'workshop') {
            leadData.dia_evento = formData.get('dia_evento');
            leadData.evento = this.workshopConfig.eventName;
            leadData.tipo_lead = 'workshop';
        } else {
            leadData.tipo_lead = 'geral';
            leadData.curso_pretendido = 'Python'; // Campo padrão
        }
        
        return leadData;
    }
    
    // Recarregar configuração (para uso do admin)
    async reload() {
        console.log('🔄 Recarregando configuração do site...');
        await this.loadCurrentMode();
        this.applyMode();
        this.updateSuccessModal();
        
        // Disparar evento personalizado
        document.dispatchEvent(new CustomEvent('siteModeChanged', {
            detail: { 
                mode: this.currentMode, 
                config: this.workshopConfig 
            }
        }));
    }
}

// Inicializar quando DOM carregar
let siteModeManager;

document.addEventListener('DOMContentLoaded', () => {
    siteModeManager = new SiteModeManager();
    window.siteModeManager = siteModeManager;
    
    console.log('✅ Site Mode Manager inicializado!');
    
    // Atualizar modal depois que tudo estiver carregado
    setTimeout(() => {
        if (siteModeManager) {
            siteModeManager.updateSuccessModal();
        }
    }, 1000);
});

// Event listener para mudanças de modo
document.addEventListener('siteModeChanged', (event) => {
    console.log('📢 Modo do site alterado:', event.detail);
    
    // Reativar animações se necessário
    if (window.incodeAnimations) {
        window.incodeAnimations.init();
    }
});