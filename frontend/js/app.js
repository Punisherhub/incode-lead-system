// Aplicação Principal - Incode Academy Lead System
class IncodeApp {
    constructor() {
        this.isLoaded = false;
        this.components = {
            threeScene: null,
            animations: null,
            formHandler: null
        };
        
        this.init();
    }
    
    init() {
        // Aguardar carregamento completo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
        } else {
            this.onDOMReady();
        }
    }
    
    onDOMReady() {
        // Aguardar um pouco para evitar conflitos
        setTimeout(() => {
            this.initializeComponents();
            this.setupGlobalEvents();
            this.checkPerformance();
        }, 100);
    }
    
    initializeComponents() {
        // Os componentes são inicializados pelos próprios scripts
        // Aqui apenas referenciamos eles
        
        setTimeout(() => {
            this.components.threeScene = window.incodeThreeScene;
            this.components.animations = window.incodeAnimations;
            this.components.formHandler = window.incodeFormHandler;
            
            // Componentes inicializados silenciosamente
            
            this.isLoaded = true;
            this.onAppReady();
        }, 1000);
    }
    
    onAppReady() {
        
        // Disparar evento customizado
        document.dispatchEvent(new CustomEvent('incodeAppReady', {
            detail: { 
                components: this.components,
                timestamp: new Date().toISOString()
            }
        }));
        
        // Analytics de carregamento
        this.trackPageLoad();
        
        // Iniciar experiências interativas
        this.startInteractiveExperiences();
    }
    
    setupGlobalEvents() {
        // Eventos de visibilidade da página
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.onPageHidden();
            } else {
                this.onPageVisible();
            }
        });
        
        // Eventos de scroll para otimização
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.onScrollEnd();
            }, 150);
        });
        
        // Eventos de resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.onResize();
            }, 250);
        });
        
        // Eventos de teclado para acessibilidade
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });
        
        // Eventos de mouse para efeitos especiais
        document.addEventListener('mousemove', (e) => {
            this.onMouseMove(e);
        });
        
        // Eventos de clique para analytics
        document.addEventListener('click', (e) => {
            this.trackUserInteraction(e);
        });
    }
    
    onPageHidden() {
        // Página oculta - pausando animações
        
        // Pausar animações Three.js se disponível
        if (this.components.threeScene && this.components.threeScene.pauseAnimations) {
            this.components.threeScene.pauseAnimations();
        }
    }
    
    onPageVisible() {
        // Página visível - retomando animações
        
        // Retomar animações Three.js se disponível
        if (this.components.threeScene && this.components.threeScene.resumeAnimations) {
            this.components.threeScene.resumeAnimations();
        }
    }
    
    onScrollEnd() {
        const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        
        // Marcar marcos de scroll para analytics
        if (scrollPercent > 25 && !this.scrollMarks?.quarter) {
            this.trackScrollMilestone('25%');
            if (!this.scrollMarks) this.scrollMarks = {};
            this.scrollMarks.quarter = true;
        }
        
        if (scrollPercent > 50 && !this.scrollMarks?.half) {
            this.trackScrollMilestone('50%');
            if (!this.scrollMarks) this.scrollMarks = {};
            this.scrollMarks.half = true;
        }
        
        if (scrollPercent > 75 && !this.scrollMarks?.threeQuarters) {
            this.trackScrollMilestone('75%');
            if (!this.scrollMarks) this.scrollMarks = {};
            this.scrollMarks.threeQuarters = true;
        }
    }
    
    onResize() {
        // Redimensionamento detectado
        
        // Notificar componentes sobre resize
        if (this.components.threeScene && this.components.threeScene.handleResize) {
            this.components.threeScene.handleResize();
        }
    }
    
    handleKeyboardNavigation(e) {
        // ESC para fechar modal
        if (e.key === 'Escape') {
            const modal = document.getElementById('success-modal');
            if (modal && modal.style.display !== 'none') {
                if (this.components.animations) {
                    this.components.animations.hideSuccessModal();
                }
            }
        }
        
        // Tab navigation enhancement
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    }
    
    onMouseMove(e) {
        // Remover classe de navegação por teclado
        document.body.classList.remove('keyboard-navigation');
        
        // Efeitos de mouse para Three.js
        if (this.components.threeScene && this.components.threeScene.updateMouse) {
            this.components.threeScene.updateMouse(e.clientX, e.clientY);
        }
    }
    
    trackUserInteraction(e) {
        const element = e.target;
        
        // Track cliques em elementos importantes
        if (element.matches('button, .submit-btn')) {
            this.trackEvent('button_click', {
                button_text: element.textContent.trim(),
                button_class: element.className
            });
        }
        
        if (element.matches('a')) {
            this.trackEvent('link_click', {
                link_text: element.textContent.trim(),
                link_href: element.href
            });
        }
        
        if (element.matches('.social-icon')) {
            this.trackEvent('social_click', {
                social_platform: element.textContent.trim()
            });
        }
    }
    
    startInteractiveExperiences() {
        // Iniciar experiências interativas após carregamento
        setTimeout(() => {
            this.addMagicCursor();
            this.addKeyboardShortcuts();
            this.initializeEasterEggs();
        }, 2000);
    }
    
    addMagicCursor() {
        // Cursor personalizado com trail de partículas
        let lastX = 0;
        let lastY = 0;
        
        document.addEventListener('mousemove', (e) => {
            const deltaX = e.clientX - lastX;
            const deltaY = e.clientY - lastY;
            const speed = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            if (speed > 5) { // Só criar partículas se o mouse estiver se movendo rápido
                this.createCursorParticle(e.clientX, e.clientY);
            }
            
            lastX = e.clientX;
            lastY = e.clientY;
        });
    }
    
    createCursorParticle(x, y) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            width: 4px;
            height: 4px;
            background: #00ff88;
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            top: ${y}px;
            left: ${x}px;
            box-shadow: 0 0 6px #00ff88;
        `;
        
        document.body.appendChild(particle);
        
        // Animar e remover
        gsap.to(particle, {
            scale: 0,
            opacity: 0,
            duration: 1,
            ease: "power2.out",
            onComplete: () => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }
        });
    }
    
    addKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl + K para mostrar estatísticas de debug
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                this.showDebugInfo();
            }
            
            // Ctrl + Shift + I para modo god
            if (e.ctrlKey && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                this.toggleGodMode();
            }
        });
    }
    
    initializeEasterEggs() {
        // Easter egg: Konami Code
        const konamiCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
        let konamiIndex = 0;
        
        document.addEventListener('keydown', (e) => {
            if (e.keyCode === konamiCode[konamiIndex]) {
                konamiIndex++;
                if (konamiIndex === konamiCode.length) {
                    this.activateKonamiMode();
                    konamiIndex = 0;
                }
            } else {
                konamiIndex = 0;
            }
        });
        
        // Easter egg: Clique triplo no logo
        const logo = document.querySelector('.logo');
        if (logo) {
            let clickCount = 0;
            logo.addEventListener('click', () => {
                clickCount++;
                if (clickCount === 3) {
                    this.showSecretMessage();
                    clickCount = 0;
                }
                setTimeout(() => { clickCount = 0; }, 2000);
            });
        }
    }
    
    activateKonamiMode() {
        // Código especial ativado
        
        // Efeitos especiais
        if (this.components.threeScene) {
            this.components.threeScene.intensifyEffects();
        }
        
        // Mostrar mensagem
        this.showNotification('🎮 MODO KONAMI ATIVADO! Efeitos intensificados!', 'success');
        
        // Analytics
        this.trackEvent('easter_egg', { type: 'konami_code' });
    }
    
    showSecretMessage() {
        const messages = [
            '🐍 A programação é a arte de transformar ideias em realidade digital!',
            '💻 Todo programador foi um iniciante um dia. O importante é começar!',
            '🚀 Python não é só uma linguagem, é uma filosofia de simplicidade!',
            '⭐ Incode Academy: Onde futuros desenvolvedores nascem!'
        ];
        
        const message = messages[Math.floor(Math.random() * messages.length)];
        this.showNotification(message, 'info');
        
        this.trackEvent('easter_egg', { type: 'logo_clicks' });
    }
    
    showDebugInfo() {
        const info = {
            loaded: this.isLoaded,
            components: Object.keys(this.components).reduce((acc, key) => {
                acc[key] = !!this.components[key];
                return acc;
            }, {}),
            performance: performance.now(),
            memory: navigator?.deviceMemory || 'unknown',
            connection: navigator?.connection?.effectiveType || 'unknown'
        };
        
        // Debug info disponível
        this.showNotification('Debug info no console! 🐛', 'info');
    }
    
    toggleGodMode() {
        document.body.classList.toggle('god-mode');
        const isActive = document.body.classList.contains('god-mode');
        
        if (isActive) {
            // Adicionar estilos para god mode
            const style = document.createElement('style');
            style.id = 'god-mode-styles';
            style.textContent = `
                .god-mode * {
                    outline: 1px solid #00ff88 !important;
                }
                .god-mode .form-container {
                    box-shadow: 0 0 30px #00ff88 !important;
                }
            `;
            document.head.appendChild(style);
        } else {
            const style = document.getElementById('god-mode-styles');
            if (style) style.remove();
        }
        
        this.showNotification(`God Mode ${isActive ? 'ON' : 'OFF'} ⚡`, 'success');
    }
    
    addMultipleLogosBackground() {
        // Criar múltiplas logos de fundo em posições diferentes
        const logoPositions = [
            { top: '10%', left: '10%', rotation: 45, opacity: 0.02 },
            { top: '20%', right: '15%', rotation: -30, opacity: 0.025 },
            { bottom: '15%', left: '20%', rotation: 60, opacity: 0.02 },
            { bottom: '25%', right: '10%', rotation: -45, opacity: 0.03 },
            { top: '60%', left: '5%', rotation: 15, opacity: 0.015 }
        ];

        logoPositions.forEach((pos, index) => {
            const logoElement = document.createElement('div');
            logoElement.className = 'background-logo-extra';
            logoElement.style.cssText = `
                position: fixed;
                width: 300px;
                height: 300px;
                background-image: url('assets/images/logo-incode.png');
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
                opacity: ${pos.opacity};
                transform: rotate(${pos.rotation}deg);
                z-index: -2;
                pointer-events: none;
                transition: all 0.3s ease;
                ${pos.top ? `top: ${pos.top};` : ''}
                ${pos.bottom ? `bottom: ${pos.bottom};` : ''}
                ${pos.left ? `left: ${pos.left};` : ''}
                ${pos.right ? `right: ${pos.right};` : ''}
            `;

            document.body.appendChild(logoElement);

            // Adicionar animação sutil de flutuação
            gsap.to(logoElement, {
                y: Math.sin(index) * 20,
                x: Math.cos(index) * 15,
                rotation: pos.rotation + (Math.random() * 10 - 5),
                duration: 8 + (index * 2),
                ease: "sine.inOut",
                repeat: -1,
                yoyo: true,
                delay: index * 0.5
            });

            // Efeito de hover - aumentar opacidade levemente
            document.addEventListener('mousemove', (e) => {
                const rect = logoElement.getBoundingClientRect();
                const distance = Math.sqrt(
                    Math.pow(e.clientX - (rect.left + rect.width/2), 2) +
                    Math.pow(e.clientY - (rect.top + rect.height/2), 2)
                );

                if (distance < 200) {
                    logoElement.style.opacity = pos.opacity * 2;
                } else {
                    logoElement.style.opacity = pos.opacity;
                }
            });
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#00ff88' : type === 'error' ? '#ff4444' : '#0099ff'};
            color: #0a0a0a;
            padding: 1rem 2rem;
            border-radius: 8px;
            font-weight: bold;
            z-index: 10000;
            opacity: 0;
            transform: translateX(100px);
            transition: all 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animar entrada
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        });
        
        // Auto remover
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    checkPerformance() {
        // Monitorar performance
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                if (entry.entryType === 'navigation') {
                    // Métricas de performance registradas silenciosamente
                    const metrics = {
                        domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
                        loadComplete: entry.loadEventEnd - entry.loadEventStart,
                        total: entry.loadEventEnd - entry.navigationStart
                    };
                }
            });
        });
        
        try {
            observer.observe({ entryTypes: ['navigation'] });
        } catch (e) {
            // Performance API não suportada
        }
    }
    
    trackPageLoad() {
        const loadTime = performance.now();
        this.trackEvent('page_load', {
            load_time: Math.round(loadTime),
            user_agent: navigator.userAgent,
            screen_resolution: `${screen.width}x${screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`
        });
    }
    
    trackScrollMilestone(percentage) {
        this.trackEvent('scroll_milestone', { percentage });
    }
    
    trackEvent(eventName, data) {
        console.log('📊 Event tracked:', eventName, data);
        
        // Aqui você pode integrar com Google Analytics, Facebook Pixel, etc.
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, data);
        }
    }
    
    // API pública
    getStatus() {
        return {
            isLoaded: this.isLoaded,
            components: this.components,
            version: '1.0.0'
        };
    }
    
    // Cleanup
    destroy() {
        if (this.components.animations) {
            this.components.animations.destroy();
        }
        
        console.log('🧹 Aplicação limpa e encerrada');
    }
}

// Inicializar aplicação
window.incodeApp = new IncodeApp();

// Expor globalmente para debug
window.debugIncode = () => {
    console.log('🐛 Incode Debug Info:');
    console.table(window.incodeApp.getStatus());
    return window.incodeApp;
};

console.log(`
🎓 INCODE ACADEMY LEAD SYSTEM
============================
✨ Frontend inicializado com sucesso!
🎯 Sistema de captação extraordinário
🐍 Transformando futuros com Python
============================
Digite debugIncode() no console para debug
`);

// Handle de erros globais
window.addEventListener('error', (e) => {
    console.error('❌ Erro global capturado:', e.error);
    
    // Track erro (não expor dados sensíveis)
    if (window.incodeApp) {
        window.incodeApp.trackEvent('javascript_error', {
            message: e.message,
            filename: e.filename,
            line: e.lineno
        });
    }
});

// Service Worker removido - não necessário para este projeto
// Se precisar no futuro, criar arquivo sw.js na raiz do frontend