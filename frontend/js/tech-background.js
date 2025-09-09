/**
 * Tech Background Effects Controller
 * Gera e controla os efeitos visuais tecnológicos de fundo
 */

class TechBackgroundController {
    constructor() {
        this.isActive = true;
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Detecção de performance para reduzir ainda mais efeitos
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
        this.isLowPerformance = this.isMobile || navigator.hardwareConcurrency < 4;
        
        if (!this.reducedMotion && !this.isLowPerformance) {
            this.init();
        } else if (!this.reducedMotion && this.isLowPerformance) {
            this.initMinimal(); 
        }
        // Matrix Rain removido para simplificação
    }

    init() {
        // MODO EQUILIBRADO - Logos + elementos leves para profundidade
        // Criar apenas os elementos leves que sobraram
        this.createCircuitLines();
        // holographic-overlay será controlado via CSS apenas
    }

    // Versão ultra-minimalista para dispositivos fracos
    initMinimal() {
        // Apenas circuit lines para dispositivos fracos
        this.createCircuitLines();
    }

    // Elementos tecnológicos flutuantes - REDUZIDO DRASTICAMENTE
    createTechElements() {
        const container = document.querySelector('.tech-elements');
        const elementCount = window.innerWidth < 768 ? 3 : 6; // Era 15:30, agora 3:6

        for (let i = 0; i < elementCount; i++) {
            const element = document.createElement('div');
            element.className = 'tech-element';
            element.style.left = Math.random() * 100 + '%';
            element.style.top = Math.random() * 100 + '%';
            element.style.animationDelay = Math.random() * 15 + 's';
            element.style.animationDuration = (15 + Math.random() * 10) + 's';
            container.appendChild(element);
        }
    }

    // Linhas de circuito - ULTRA LEVES para profundidade sutil
    createCircuitLines() {
        const container = document.querySelector('.circuit-lines');
        const lineCount = window.innerWidth < 768 ? 1 : 2; // Ainda mais reduzido: 1:2

        for (let i = 0; i < lineCount; i++) {
            const line = document.createElement('div');
            line.className = 'circuit-line';
            
            if (Math.random() > 0.5) {
                line.classList.add('vertical');
                line.style.left = Math.random() * 100 + '%';
            } else {
                line.style.top = Math.random() * 100 + '%';
                line.style.width = (20 + Math.random() * 60) + '%';
            }
            
            line.style.animationDelay = Math.random() * 8 + 's';
            line.style.animationDuration = (8 + Math.random() * 4) + 's';
            container.appendChild(line);
        }
    }

    // Streams de dados - REDUZIDO
    createDataStreams() {
        const streamCount = window.innerWidth < 768 ? 1 : 2; // Era 3:6, agora 1:2

        for (let i = 0; i < streamCount; i++) {
            const stream = document.createElement('div');
            stream.className = 'data-stream';
            stream.style.left = Math.random() * 100 + '%';
            stream.style.animationDelay = Math.random() * 6 + 's';
            stream.style.animationDuration = (6 + Math.random() * 3) + 's';
            document.body.appendChild(stream);
        }
    }

    // Orbes brilhantes - REDUZIDO
    createGlowOrbs() {
        const orbCount = window.innerWidth < 768 ? 1 : 2; // Era 4:8, agora 1:2

        for (let i = 0; i < orbCount; i++) {
            const orb = document.createElement('div');
            orb.className = 'glow-orb';
            orb.style.left = Math.random() * 100 + '%';
            orb.style.top = Math.random() * 100 + '%';
            orb.style.animationDelay = Math.random() * 20 + 's';
            orb.style.animationDuration = (20 + Math.random() * 10) + 's';
            document.body.appendChild(orb);
        }
    }

    // Linhas de scanner - REDUZIDO
    createScanLines() {
        const scanCount = window.innerWidth < 768 ? 0 : 1; // Era 2:3, agora 0:1

        for (let i = 0; i < scanCount; i++) {
            const scan = document.createElement('div');
            scan.className = 'scan-line';
            scan.style.animationDelay = i * 5 + 's';
            scan.style.animationDuration = (15 + Math.random() * 5) + 's';
            document.body.appendChild(scan);
        }
    }

    // Nós tecnológicos - REDUZIDO DRASTICAMENTE
    createTechNodes() {
        const nodeCount = window.innerWidth < 768 ? 2 : 4; // Era 10:20, agora 2:4

        for (let i = 0; i < nodeCount; i++) {
            const node = document.createElement('div');
            node.className = 'tech-node';
            node.style.left = Math.random() * 100 + '%';
            node.style.top = Math.random() * 100 + '%';
            node.style.animationDelay = Math.random() * 4 + 's';
            node.style.animationDuration = (4 + Math.random() * 2) + 's';
            document.body.appendChild(node);
        }
    }

    // Chuva da matrix - MUITO REDUZIDO
    createMatrixRain() {
        const container = document.querySelector('.matrix-rain');
        const dropCount = window.innerWidth < 768 ? 5 : 8; // Era 20:40, agora 5:8
        const characters = '01';

        for (let i = 0; i < dropCount; i++) {
            const drop = document.createElement('div');
            drop.className = 'matrix-drop';
            drop.textContent = characters.charAt(Math.floor(Math.random() * characters.length));
            drop.style.left = Math.random() * 100 + '%';
            drop.style.animationDelay = Math.random() * 8 + 's';
            drop.style.animationDuration = (8 + Math.random() * 4) + 's';
            container.appendChild(drop);
        }
    }

    // Matrix Rain removido para simplificação

    // Pausar/despausar animações (para compatibilidade mobile)
    pause() {
        this.isActive = false;
        document.body.style.setProperty('--animation-play-state', 'paused');
    }

    resume() {
        this.isActive = true;
        document.body.style.setProperty('--animation-play-state', 'running');
    }

    // Destruir elementos (para limpeza)
    destroy() {
        const elements = document.querySelectorAll(
            '.tech-element, .circuit-line, .data-stream, .glow-orb, .scan-line, .tech-node, .matrix-drop, .green-letter, .matrix-column'
        );
        elements.forEach(el => el.remove());
    }

    // Redimensionamento responsivo
    handleResize() {
        this.destroy();
        if (!this.reducedMotion && this.isActive) {
            setTimeout(() => this.init(), 100);
        }
    }
}

// Inicializar quando o DOM estiver pronto
let techBackground;

document.addEventListener('DOMContentLoaded', () => {
    techBackground = new TechBackgroundController();

    // Redimensionamento
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (techBackground) {
                techBackground.handleResize();
            }
        }, 250);
    });
});

// Integração com o sistema existente de input mobile
if (typeof window.threeScene !== 'undefined') {
    // Se o three-scene existir, sincronizar o pause/resume
    const originalPause = window.threeScene.pauseAnimations;
    const originalResume = window.threeScene.resumeAnimations;

    if (originalPause) {
        window.threeScene.pauseAnimations = function() {
            originalPause.call(this);
            if (techBackground) techBackground.pause();
        };
    }

    if (originalResume) {
        window.threeScene.resumeAnimations = function() {
            originalResume.call(this);
            if (techBackground) techBackground.resume();
        };
    }
}