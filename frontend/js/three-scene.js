// Three.js Scene - Efeitos 3D Extraordinários
class IncodeThreeScene {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = null;
        this.cubes = [];
        this.lines = [];
        this.mouse = { x: 0, y: 0 };
        this.windowHalf = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        
        this.init();
        this.animate();
        this.addEventListeners();
    }
    
    init() {
        // Criar cena
        this.scene = new THREE.Scene();
        
        // Configurar câmera
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            1, 
            3000
        );
        this.camera.position.z = 1000;
        
        // Configurar renderer
        this.renderer = new THREE.WebGLRenderer({ 
            alpha: true, 
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        // Adicionar ao container
        const container = document.getElementById('threejs-container');
        container.appendChild(this.renderer.domElement);
        
        // Criar elementos 3D
        this.createParticles();
        this.createFloatingCubes();
        this.createConnectingLines();
        this.createPyramids();
    }
    
    createParticles() {
        const particleCount = 2000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        // Cores neon para as partículas
        const neonColors = [
            new THREE.Color(0x00ff88), // Verde neon
            new THREE.Color(0x0099ff), // Azul neon
            new THREE.Color(0xff0099), // Rosa neon
            new THREE.Color(0x88ff00), // Verde limão
            new THREE.Color(0xff8800)  // Laranja neon
        ];
        
        for (let i = 0; i < particleCount; i++) {
            // Posições aleatórias
            positions[i * 3] = (Math.random() - 0.5) * 4000;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 4000;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 2000;
            
            // Cores aleatórias do array neon
            const color = neonColors[Math.floor(Math.random() * neonColors.length)];
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        // Material das partículas
        const material = new THREE.PointsMaterial({
            size: 3,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }
    
    createFloatingCubes() {
        const cubeCount = 50;
        
        for (let i = 0; i < cubeCount; i++) {
            // Geometria do cubo
            const geometry = new THREE.BoxGeometry(
                Math.random() * 40 + 10,
                Math.random() * 40 + 10,
                Math.random() * 40 + 10
            );
            
            // Material com wireframe neon
            const material = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(Math.random(), 1, 0.5),
                wireframe: true,
                transparent: true,
                opacity: 0.3
            });
            
            const cube = new THREE.Mesh(geometry, material);
            
            // Posição aleatória
            cube.position.x = (Math.random() - 0.5) * 3000;
            cube.position.y = (Math.random() - 0.5) * 3000;
            cube.position.z = (Math.random() - 0.5) * 1500;
            
            // Rotação aleatória
            cube.rotation.x = Math.random() * Math.PI;
            cube.rotation.y = Math.random() * Math.PI;
            cube.rotation.z = Math.random() * Math.PI;
            
            // Velocidade de rotação
            cube.userData = {
                rotationSpeed: {
                    x: (Math.random() - 0.5) * 0.02,
                    y: (Math.random() - 0.5) * 0.02,
                    z: (Math.random() - 0.5) * 0.02
                }
            };
            
            this.cubes.push(cube);
            this.scene.add(cube);
        }
    }
    
    createConnectingLines() {
        const lineCount = 30;
        
        for (let i = 0; i < lineCount; i++) {
            const geometry = new THREE.BufferGeometry();
            const points = [];
            
            // Criar linha ondulada
            for (let j = 0; j <= 100; j++) {
                const x = (j / 100) * 2000 - 1000;
                const y = Math.sin(j * 0.1) * 100;
                const z = (Math.random() - 0.5) * 1000;
                
                points.push(new THREE.Vector3(x, y, z));
            }
            
            geometry.setFromPoints(points);
            
            const material = new THREE.LineBasicMaterial({
                color: new THREE.Color().setHSL(Math.random(), 1, 0.5),
                transparent: true,
                opacity: 0.2
            });
            
            const line = new THREE.Line(geometry, material);
            line.userData = { 
                originalOpacity: 0.2,
                phase: Math.random() * Math.PI * 2
            };
            
            this.lines.push(line);
            this.scene.add(line);
        }
    }
    
    createPyramids() {
        const pyramidCount = 20;
        
        for (let i = 0; i < pyramidCount; i++) {
            const geometry = new THREE.ConeGeometry(
                Math.random() * 30 + 15,
                Math.random() * 60 + 30,
                4
            );
            
            const material = new THREE.MeshBasicMaterial({
                color: 0x00ff88,
                transparent: true,
                opacity: 0.1,
                wireframe: true
            });
            
            const pyramid = new THREE.Mesh(geometry, material);
            
            pyramid.position.x = (Math.random() - 0.5) * 2500;
            pyramid.position.y = (Math.random() - 0.5) * 2500;
            pyramid.position.z = (Math.random() - 0.5) * 1000;
            
            pyramid.rotation.x = Math.random() * Math.PI;
            pyramid.rotation.z = Math.random() * Math.PI;
            
            pyramid.userData = {
                rotationSpeed: (Math.random() - 0.5) * 0.01,
                floatSpeed: Math.random() * 0.02 + 0.01
            };
            
            this.scene.add(pyramid);
            this.cubes.push(pyramid); // Reutilizar array para animação
        }
    }
    
    addEventListeners() {
        // Mouse movement
        document.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX - this.windowHalf.x) / 100;
            this.mouse.y = (event.clientY - this.windowHalf.y) / 100;
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.windowHalf.x = window.innerWidth / 2;
            this.windowHalf.y = window.innerHeight / 2;
            
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        // Scroll effect
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            this.camera.position.z = 1000 + scrollY * 0.5;
            this.camera.rotation.x = scrollY * 0.0002;
        });
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const time = Date.now() * 0.001;
        
        // Animar partículas
        if (this.particles) {
            this.particles.rotation.x = time * 0.1;
            this.particles.rotation.y = time * 0.05;
            
            // Efeito de respiração
            const scale = 1 + Math.sin(time * 2) * 0.1;
            this.particles.scale.setScalar(scale);
        }
        
        // Animar cubos
        this.cubes.forEach((cube, index) => {
            if (cube.userData.rotationSpeed) {
                cube.rotation.x += cube.userData.rotationSpeed.x;
                cube.rotation.y += cube.userData.rotationSpeed.y;
                cube.rotation.z += cube.userData.rotationSpeed.z;
            }
            
            // Movimento flutuante
            if (cube.userData.floatSpeed) {
                cube.position.y += Math.sin(time + index) * cube.userData.floatSpeed;
            }
            
            // Efeito de pulse baseado no mouse
            const distance = Math.sqrt(
                Math.pow(cube.position.x - this.mouse.x * 10, 2) +
                Math.pow(cube.position.y - this.mouse.y * 10, 2)
            );
            
            if (distance < 200) {
                cube.material.opacity = 0.6;
                cube.scale.setScalar(1.2);
            } else {
                cube.material.opacity = 0.3;
                cube.scale.setScalar(1);
            }
        });
        
        // Animar linhas
        this.lines.forEach((line, index) => {
            if (line.userData.phase !== undefined) {
                const opacity = 0.2 + Math.sin(time + line.userData.phase) * 0.15;
                line.material.opacity = Math.max(0.05, opacity);
            }
            
            line.rotation.z += 0.001;
        });
        
        // Movimento suave da câmera baseado no mouse
        this.camera.position.x += (this.mouse.x - this.camera.position.x) * 0.02;
        this.camera.position.y += (-this.mouse.y - this.camera.position.y) * 0.02;
        this.camera.lookAt(this.scene.position);
        
        this.renderer.render(this.scene, this.camera);
    }
    
    // Métodos públicos para controle externo
    intensifyEffects() {
        this.cubes.forEach(cube => {
            if (cube.material) {
                cube.material.opacity = 0.8;
                cube.material.color.setHex(0x00ff88);
            }
        });
        
        if (this.particles) {
            this.particles.material.opacity = 1;
        }
    }
    
    normalizeEffects() {
        this.cubes.forEach(cube => {
            if (cube.material) {
                cube.material.opacity = 0.3;
            }
        });
        
        if (this.particles) {
            this.particles.material.opacity = 0.8;
        }
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar um pouco para evitar conflitos
    setTimeout(() => {
        window.incodeThreeScene = new IncodeThreeScene();
    }, 100);
});