/**
 * EFEITO MATRIX - CÓDIGOS PYTHON CAINDO
 * Sistema avançado de animação Matrix com códigos Python reais
 */

class MatrixRain {
    constructor() {
        this.container = document.getElementById('matrix-rain');
        this.columns = [];
        this.columnCount = 0;
        this.pythonCodes = [
            'def hello_world():',
            '    print("Hello World")',
            'import numpy as np',
            'import pandas as pd',
            'from flask import Flask',
            'app = Flask(__name__)',
            'class IncodeAcademy:',
            '    def __init__(self):',
            '        self.students = []',
            'for i in range(100):',
            '    if i % 2 == 0:',
            '        print(f"{i}")',
            'def fibonacci(n):',
            '    if n <= 1:',
            '        return n',
            '    return fib(n-1) + fib(n-2)',
            'lambda x: x**2',
            'list(map(lambda x: x*2, nums))',
            'try:',
            '    result = calculate()',
            'except Exception as e:',
            '    print(f"Error: {e}")',
            'finally:',
            '    cleanup()',
            'with open("file.txt") as f:',
            '    data = f.read()',
            'async def fetch_data():',
            '    await asyncio.sleep(1)',
            '    return {"status": "success"}',
            'df = pd.DataFrame(data)',
            'df.groupby("category").sum()',
            'plt.plot(x, y)',
            'plt.show()',
            'np.array([[1, 2], [3, 4]])',
            'sklearn.model_selection',
            'from datetime import datetime',
            'datetime.now().isoformat()',
            '@app.route("/api/leads")',
            'def get_leads():',
            '    return jsonify(leads)',
            'cursor.execute(query, params)',
            'conn.commit()',
            'redis.get("cache_key")',
            'os.path.join(dir, file)',
            'json.loads(response.text)',
            'requests.post(url, data=payload)',
            'threading.Thread(target=worker)',
            'queue.put(item)',
            'regex = r"^[a-zA-Z0-9]+$"',
            're.match(regex, text)',
            'hashlib.sha256(password)',
            'base64.b64encode(data)',
            '__init__.py',
            '__main__.py',
            'if __name__ == "__main__":',
            '    main()',
            '# Incode Academy',
            '# Python Programming',
            '# Machine Learning',
            '# Data Science',
            '# Web Development',
            '# API Development'
        ];
        
        this.init();
    }
    
    init() {
        this.calculateColumns();
        this.createColumns();
        this.startAnimation();
        
        // Recriar colunas quando a janela redimensionar
        window.addEventListener('resize', () => {
            this.destroy();
            setTimeout(() => {
                this.calculateColumns();
                this.createColumns();
                this.startAnimation();
            }, 100);
        });
    }
    
    calculateColumns() {
        const columnWidth = 20; // pixels
        this.columnCount = Math.floor(window.innerWidth / columnWidth);
    }
    
    createColumns() {
        this.container.innerHTML = '';
        this.columns = [];
        
        for (let i = 0; i < this.columnCount; i++) {
            const column = document.createElement('div');
            column.className = 'matrix-column';
            column.style.left = `${i * 20}px`;
            
            // Delay aleatório para cada coluna
            const delay = Math.random() * 5;
            column.style.animationDelay = `${delay}s`;
            
            // Duração aleatória entre 8 e 15 segundos
            const duration = 8 + Math.random() * 7;
            column.style.animationDuration = `${duration}s`;
            
            this.generateColumnContent(column);
            this.container.appendChild(column);
            this.columns.push(column);
        }
    }
    
    generateColumnContent(column) {
        const codeLines = [];
        const lineCount = 15 + Math.floor(Math.random() * 10); // 15-25 linhas
        
        for (let i = 0; i < lineCount; i++) {
            const randomCode = this.pythonCodes[Math.floor(Math.random() * this.pythonCodes.length)];
            codeLines.push(randomCode);
        }
        
        column.innerHTML = codeLines.join('<br>');
        
        // Adicionar caracteres especiais ocasionalmente
        if (Math.random() > 0.7) {
            const specialChars = ['λ', 'Σ', 'Π', 'Ω', 'α', 'β', 'γ', 'δ', '∞', '∑'];
            const specialChar = specialChars[Math.floor(Math.random() * specialChars.length)];
            column.innerHTML += `<br><span style="color: #ff0080; text-shadow: 0 0 5px #ff0080;">${specialChar}</span>`;
        }
    }
    
    startAnimation() {
        // Recriar conteúdo das colunas periodicamente para variação
        setInterval(() => {
            this.columns.forEach(column => {
                if (Math.random() > 0.8) { // 20% de chance de recriar
                    this.generateColumnContent(column);
                }
            });
        }, 3000);
        
        // Adicionar novas colunas ocasionalmente
        setInterval(() => {
            if (Math.random() > 0.9) { // 10% de chance
                this.addRandomColumn();
            }
        }, 5000);
    }
    
    addRandomColumn() {
        const column = document.createElement('div');
        column.className = 'matrix-column';
        column.style.left = `${Math.random() * window.innerWidth}px`;
        column.style.animationDuration = `${6 + Math.random() * 4}s`;
        column.style.color = Math.random() > 0.5 ? '#00ff88' : '#00d4ff';
        
        this.generateColumnContent(column);
        this.container.appendChild(column);
        
        // Remover após a animação
        setTimeout(() => {
            if (column.parentNode) {
                column.parentNode.removeChild(column);
            }
        }, 10000);
    }
    
    destroy() {
        this.container.innerHTML = '';
        this.columns = [];
    }
    
    // Controlar intensidade do efeito
    setIntensity(level) {
        // level: 0.1 (muito sutil) a 0.5 (intenso)
        this.container.style.opacity = level;
    }
    
    // Pausar/retomar
    pause() {
        this.container.style.animationPlayState = 'paused';
        this.columns.forEach(col => col.style.animationPlayState = 'paused');
    }
    
    resume() {
        this.container.style.animationPlayState = 'running';
        this.columns.forEach(col => col.style.animationPlayState = 'running');
    }
}

// Inicializar efeito Matrix quando DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar um pouco para evitar conflitos com outros scripts
    setTimeout(() => {
        window.matrixRain = new MatrixRain();
        
        // Controle opcional via console
        console.log('🎭 Efeito Matrix carregado!');
        console.log('💡 Controles disponíveis:');
        console.log('   matrixRain.setIntensity(0.2) - Ajustar intensidade');
        console.log('   matrixRain.pause() - Pausar');
        console.log('   matrixRain.resume() - Retomar');
    }, 1000);
});