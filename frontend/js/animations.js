// Sistema de Animações Avançado para Incode Academy
class IncodeAnimations {
    constructor() {
        this.typedInstance = null;
        this.matrixInterval = null;
        this.particleAnimations = [];
        
        this.init();
    }
    
    init() {
        this.initLoadingAnimation();
        this.initCodeTyping();
        this.initMatrixEffect();
        this.initParticleEffects();
        this.initScrollAnimations();
        this.initFormAnimations();
    }
    
    initLoadingAnimation() {
        const loadingScreen = document.getElementById('loading');
        
        // Simular carregamento
        setTimeout(() => {
            gsap.to(loadingScreen, {
                opacity: 0,
                duration: 1,
                ease: "power2.out",
                onComplete: () => {
                    loadingScreen.style.display = 'none';
                    this.startMainAnimations();
                }
            });
        }, 2500);
    }
    
    startMainAnimations() {
        // Animar entrada dos elementos principais
        const tl = gsap.timeline();
        
        tl.from('.header', {
            y: -100,
            opacity: 0,
            duration: 1,
            ease: "back.out(1.7)"
        })
        .from('.hero-title .glitch', {
            scale: 0,
            rotation: 360,
            opacity: 0,
            duration: 1,
            stagger: 0.3,
            ease: "elastic.out(1, 0.3)"
        }, "-=0.5")
        .from('.code-preview', {
            y: 100,
            opacity: 0,
            scale: 0.8,
            duration: 1,
            ease: "back.out(1.7)"
        }, "-=0.3")
        .from('.hero-description', {
            opacity: 0,
            y: 50,
            duration: 1,
            ease: "power2.out"
        }, "-=0.3");
    }
    
    initCodeTyping() {
        const pythonCodes = [
            `# Bem-vindo à Incode Academy! 🐍
class FuturoDesenvolvedor:
    def __init__(self, nome):
        self.nome = nome
        self.nivel = "Iniciante"
        self.sonhos = ["Criar apps", "IA", "Web"]
    
    def aprender_python(self):
        self.nivel = "Profissional"
        print(f"{self.nome} dominou Python!")
        return "Sucesso garantido! 🚀"

# Sua jornada começa aqui
dev = FuturoDesenvolvedor("Seu Nome")
resultado = dev.aprender_python()`,

            `# Machine Learning com Python
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split

# Carregando dados do futuro
dados = pd.read_csv('seu_sucesso.csv')

# Preparando para o sucesso
X = dados[['dedicacao', 'pratica', 'paixao']]
y = dados['conquista_profissional']

# Treinando o modelo do sucesso
modelo = TrainingModel()
modelo.fit(X, y)

# Previsão: 99.9% de chance de sucesso! 🎯`,

            `# Desenvolvimento Web Moderno
from flask import Flask, render_template
from incode_academy import *

app = Flask(__name__)

@app.route('/sucesso')
def sua_carreira():
    habilidades = [
        'Python Avançado',
        'Web Development', 
        'Data Science',
        'Machine Learning',
        'APIs RESTful'
    ]
    return render_template('futuro_brilhante.html', 
                         skills=habilidades)

if __name__ == '__main__':
    app.run(debug=False, success=True) 🌟`
        ];
        
        let currentCodeIndex = 0;
        
        const startTyping = () => {
            if (this.typedInstance) {
                this.typedInstance.destroy();
            }
            
            this.typedInstance = new Typed('#typed-code', {
                strings: [pythonCodes[currentCodeIndex]],
                typeSpeed: 30,
                backSpeed: 15,
                backDelay: 3000,
                startDelay: 500,
                loop: false,
                showCursor: true,
                cursorChar: '|',
                onComplete: () => {
                    setTimeout(() => {
                        currentCodeIndex = (currentCodeIndex + 1) % pythonCodes.length;
                        startTyping();
                    }, 4000);
                }
            });
        };
        
        // Iniciar após um delay
        setTimeout(startTyping, 1000);
    }
    
    initMatrixEffect() {
        const matrixContainer = document.getElementById('matrix-code');
        if (!matrixContainer) {
            console.log('⚠️ Matrix container não encontrado - elemento foi removido para otimização');
            return;
        }
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>?';
        const pythonKeywords = ['def', 'class', 'import', 'from', 'if', 'else', 'for', 'while', 'print', 'return'];
        
        const createMatrixColumn = () => {
            const column = document.createElement('div');
            column.style.cssText = `
                position: absolute;
                top: -100px;
                font-family: 'Courier New', monospace;
                font-size: 14px;
                color: #00ff88;
                opacity: 0.7;
                white-space: pre;
                pointer-events: none;
                text-shadow: 0 0 5px #00ff88;
            `;
            
            let text = '';
            const isKeyword = Math.random() < 0.3;
            
            if (isKeyword) {
                text = pythonKeywords[Math.floor(Math.random() * pythonKeywords.length)];
                column.style.color = '#0099ff';
                column.style.textShadow = '0 0 5px #0099ff';
            } else {
                const length = Math.floor(Math.random() * 15) + 5;
                for (let i = 0; i < length; i++) {
                    text += characters[Math.floor(Math.random() * characters.length)];
                }
            }
            
            column.textContent = text;
            column.style.left = Math.random() * window.innerWidth + 'px';
            
            matrixContainer.appendChild(column);
            
            // Animar descida
            gsap.to(column, {
                y: window.innerHeight + 100,
                duration: Math.random() * 3 + 2,
                ease: "none",
                onComplete: () => {
                    if (column.parentNode) {
                        column.parentNode.removeChild(column);
                    }
                }
            });
            
            // Efeito de fade
            gsap.to(column, {
                opacity: 0,
                duration: 1,
                delay: Math.random() * 2 + 1
            });
        };
        
        // Criar colunas continuamente
        this.matrixInterval = setInterval(createMatrixColumn, 200);
    }
    
    initParticleEffects() {
        const createFloatingParticle = (container, color = '#00ff88') => {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: ${color};
                border-radius: 50%;
                pointer-events: none;
                box-shadow: 0 0 6px ${color};
            `;
            
            const startX = Math.random() * window.innerWidth;
            const startY = window.innerHeight + 10;
            
            particle.style.left = startX + 'px';
            particle.style.top = startY + 'px';
            
            container.appendChild(particle);
            
            // Animação de flutuação
            gsap.to(particle, {
                y: -window.innerHeight - 100,
                x: startX + (Math.random() - 0.5) * 200,
                duration: Math.random() * 5 + 3,
                ease: "none",
                onComplete: () => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }
            });
            
            // Efeito de opacidade pulsante
            gsap.to(particle, {
                opacity: Math.random() * 0.5 + 0.3,
                duration: Math.random() * 2 + 1,
                yoyo: true,
                repeat: -1,
                ease: "sine.inOut"
            });
        };
        
        const particlesContainer = document.getElementById('particles');
        if (!particlesContainer) {
            console.log('⚠️ Particles container não encontrado - elemento foi removido para otimização');
            return;
        }
        
        // Criar partículas continuamente
        setInterval(() => {
            const colors = ['#00ff88', '#0099ff', '#ff0099', '#88ff00'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            createFloatingParticle(particlesContainer, color);
        }, 300);
    }
    
    initScrollAnimations() {
        // Registrar plugin ScrollTrigger se disponível
        if (typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
        }
        
        // Animações ao scroll
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (entry.target.classList.contains('lead-form-section')) {
                        this.animateFormEntry();
                    }
                }
            });
        }, observerOptions);
        
        // Observar seções
        document.querySelectorAll('.lead-form-section').forEach(section => {
            observer.observe(section);
        });
    }
    
    animateFormEntry() {
        const formContainer = document.querySelector('.form-container');
        const inputGroups = document.querySelectorAll('.input-group');
        const submitBtn = document.querySelector('.submit-btn');
        
        // Animar container do form
        gsap.from(formContainer, {
            scale: 0.8,
            opacity: 0,
            y: 100,
            duration: 1,
            ease: "back.out(1.7)"
        });
        
        // Animar inputs em sequência
        gsap.from(inputGroups, {
            x: -100,
            opacity: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "power2.out",
            delay: 0.3
        });
        
        // Animar botão
        gsap.from(submitBtn, {
            scale: 0,
            rotation: 360,
            opacity: 0,
            duration: 1,
            ease: "back.out(1.7)",
            delay: 0.8
        });
    }
    
    initFormAnimations() {
        const inputs = document.querySelectorAll('.input-group input, .input-group select');
        const submitBtn = document.querySelector('.submit-btn');
        
        // Animações de foco nos inputs
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                gsap.to(input.closest('.input-group'), {
                    scale: 1.02,
                    duration: 0.3,
                    ease: "power2.out"
                });
                
                // Intensificar efeitos 3D
                if (window.incodeThreeScene) {
                    window.incodeThreeScene.intensifyEffects();
                }
            });
            
            input.addEventListener('blur', () => {
                gsap.to(input.closest('.input-group'), {
                    scale: 1,
                    duration: 0.3,
                    ease: "power2.out"
                });
                
                // Normalizar efeitos 3D
                if (window.incodeThreeScene) {
                    window.incodeThreeScene.normalizeEffects();
                }
            });
        });
        
        // Animação do botão de envio
        if (submitBtn) {
            submitBtn.addEventListener('mouseenter', () => {
                gsap.to(submitBtn, {
                    scale: 1.05,
                    duration: 0.3,
                    ease: "power2.out"
                });
                
                // Criar partículas no botão
                this.createButtonParticles(submitBtn);
            });
            
            submitBtn.addEventListener('mouseleave', () => {
                gsap.to(submitBtn, {
                    scale: 1,
                    duration: 0.3,
                    ease: "power2.out"
                });
            });
        }
    }
    
    createButtonParticles(button) {
        const rect = button.getBoundingClientRect();
        const particlesContainer = document.querySelector('.btn-particles');
        
        for (let i = 0; i < 5; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: 3px;
                height: 3px;
                background: #ffffff;
                border-radius: 50%;
                pointer-events: none;
                top: 50%;
                left: 50%;
            `;
            
            particlesContainer.appendChild(particle);
            
            gsap.to(particle, {
                x: (Math.random() - 0.5) * 100,
                y: (Math.random() - 0.5) * 100,
                opacity: 0,
                scale: 0,
                duration: 1,
                ease: "power2.out",
                onComplete: () => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }
            });
        }
    }
    
    showSuccessModal() {
        const modal = document.getElementById('success-modal');
        
        // Mostrar modal
        modal.style.display = 'block';
        
        // Animar entrada
        gsap.from('.modal-content', {
            scale: 0,
            rotation: 360,
            opacity: 0,
            duration: 1,
            ease: "back.out(1.7)"
        });
        
        // Animar checkmark
        gsap.from('.checkmark', {
            scale: 0,
            duration: 0.8,
            delay: 0.5,
            ease: "back.out(1.7)"
        });
        
        // Animar texto
        gsap.from('.modal-content h3, .modal-content p', {
            y: 30,
            opacity: 0,
            duration: 0.8,
            stagger: 0.2,
            delay: 0.8,
            ease: "power2.out"
        });
    }
    
    hideSuccessModal() {
        const modal = document.getElementById('success-modal');
        
        gsap.to('.modal-content', {
            scale: 0,
            opacity: 0,
            duration: 0.5,
            ease: "power2.in",
            onComplete: () => {
                modal.style.display = 'none';
            }
        });
    }
    
    // Limpeza
    destroy() {
        if (this.typedInstance) {
            this.typedInstance.destroy();
        }
        
        if (this.matrixInterval) {
            clearInterval(this.matrixInterval);
        }
        
        this.particleAnimations.forEach(animation => {
            if (animation.kill) animation.kill();
        });
    }
}

// Inicializar animações
document.addEventListener('DOMContentLoaded', () => {
    window.incodeAnimations = new IncodeAnimations();
});