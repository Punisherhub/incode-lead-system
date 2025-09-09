// Performance Manager - Sistema Adaptativo de Performance
class PerformanceManager {
    constructor() {
        this.isMobile = this.detectMobile();
        this.isLowPerformance = this.detectLowPerformance();
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Performance tiers
        this.performanceTier = this.calculatePerformanceTier();
        
        // Frame rate monitoring
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.currentFPS = 60;
        this.avgFPS = 60;
        this.fpsHistory = [];
        
        this.init();
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               window.innerWidth < 768;
    }
    
    detectLowPerformance() {
        // Verificar WebGL
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) return true;
        
        // Verificar limitações de GPU
        const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        const maxRenderBufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
        
        if (maxTextureSize < 4096 || maxRenderBufferSize < 4096) return true;
        
        // Verificar renderer
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            if (/Mali-[0-9]00|Adreno [0-9][0-9][0-9]|PowerVR|Intel.*HD|SwiftShader/i.test(renderer)) {
                return true;
            }
        }
        
        // Verificar hardware
        return this.isMobile || 
               navigator.hardwareConcurrency < 4 || 
               navigator.deviceMemory < 4 ||
               /Android [0-6]\.|iPhone [0-9]\.|iPad.*OS [0-9]\./.test(navigator.userAgent);
    }
    
    calculatePerformanceTier() {
        if (this.reducedMotion) return 'minimal';
        if (this.isLowPerformance) return 'low';
        if (this.isMobile) return 'medium';
        return 'high';
    }
    
    init() {
        this.applyPerformanceSettings();
        this.startFPSMonitoring();
        this.setupAdaptiveThrottling();
        
        // Log performance tier
        console.log(`🚀 Performance Tier: ${this.performanceTier.toUpperCase()}`);
        console.log(`📱 Mobile: ${this.isMobile}`);
        console.log(`⚡ Low Performance: ${this.isLowPerformance}`);
        console.log(`🎯 Reduced Motion: ${this.reducedMotion}`);
    }
    
    applyPerformanceSettings() {
        const settings = this.getSettingsForTier(this.performanceTier);
        
        // Aplicar CSS custom properties para controle de performance
        document.documentElement.style.setProperty('--animation-duration-multiplier', settings.animationSpeed);
        document.documentElement.style.setProperty('--particle-count-multiplier', settings.particleMultiplier);
        document.documentElement.style.setProperty('--effect-opacity', settings.effectOpacity);
        
        // Configurar classe CSS para controle condicional
        document.body.classList.add(`perf-${this.performanceTier}`);
        
        if (this.isMobile) document.body.classList.add('is-mobile');
        if (this.isLowPerformance) document.body.classList.add('is-low-performance');
    }
    
    getSettingsForTier(tier) {
        const settings = {
            minimal: {
                animationSpeed: '0.3',
                particleMultiplier: '0',
                effectOpacity: '0.1',
                maxFPS: 30,
                enableEffects: false
            },
            low: {
                animationSpeed: '0.5',
                particleMultiplier: '0.2',
                effectOpacity: '0.3',
                maxFPS: 30,
                enableEffects: false
            },
            medium: {
                animationSpeed: '0.8',
                particleMultiplier: '0.6',
                effectOpacity: '0.6',
                maxFPS: 45,
                enableEffects: true
            },
            high: {
                animationSpeed: '1',
                particleMultiplier: '1',
                effectOpacity: '1',
                maxFPS: 60,
                enableEffects: true
            }
        };
        
        return settings[tier];
    }
    
    startFPSMonitoring() {
        const monitor = () => {
            this.frameCount++;
            const now = performance.now();
            
            if (now - this.lastTime >= 1000) {
                this.currentFPS = this.frameCount;
                this.fpsHistory.push(this.currentFPS);
                
                // Manter apenas os últimos 10 segundos
                if (this.fpsHistory.length > 10) {
                    this.fpsHistory.shift();
                }
                
                // Calcular FPS médio
                this.avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
                
                // Auto-degradar performance se FPS muito baixo
                if (this.avgFPS < 20 && this.performanceTier !== 'minimal') {
                    this.degradePerformance();
                }
                
                this.frameCount = 0;
                this.lastTime = now;
            }
            
            requestAnimationFrame(monitor);
        };
        
        requestAnimationFrame(monitor);
    }
    
    degradePerformance() {
        console.log('⚠️ Performance baixa detectada, degradando automaticamente...');
        
        const tierOrder = ['high', 'medium', 'low', 'minimal'];
        const currentIndex = tierOrder.indexOf(this.performanceTier);
        
        if (currentIndex < tierOrder.length - 1) {
            this.performanceTier = tierOrder[currentIndex + 1];
            this.applyPerformanceSettings();
            
            // Notificar outros sistemas
            window.dispatchEvent(new CustomEvent('performanceDegraded', {
                detail: { newTier: this.performanceTier }
            }));
        }
    }
    
    setupAdaptiveThrottling() {
        // Throttle baseado na visibilidade da página
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                document.body.classList.add('page-hidden');
            } else {
                document.body.classList.remove('page-hidden');
            }
        });
        
        // Throttle baseado no scroll
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            document.body.classList.add('is-scrolling');
            
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                document.body.classList.remove('is-scrolling');
            }, 150);
        }, { passive: true });
    }
    
    // Métodos públicos para outros módulos
    shouldEnableEffect(effectName) {
        const settings = this.getSettingsForTier(this.performanceTier);
        return settings.enableEffects && this.avgFPS > 25;
    }
    
    getAnimationDuration(baseDuration) {
        const multiplier = parseFloat(this.getSettingsForTier(this.performanceTier).animationSpeed);
        return baseDuration * multiplier;
    }
    
    getParticleCount(baseCount) {
        const multiplier = parseFloat(this.getSettingsForTier(this.performanceTier).particleMultiplier);
        return Math.floor(baseCount * multiplier);
    }
    
    getCurrentFPS() {
        return this.avgFPS;
    }
    
    getPerformanceTier() {
        return this.performanceTier;
    }
}

// Instanciar globalmente
window.performanceManager = new PerformanceManager();

// Exportar para outros módulos
window.PerformanceManager = PerformanceManager;