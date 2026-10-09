import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// 1. Configuración Básica de la Escena
const canvas = document.querySelector('#gameCanvas');
const scene = new THREE.Scene();

// Añadir un color de fondo al cielo (Cueva)
scene.background = new THREE.Color('#1a1a2e'); 
// Alejar la niebla para que se pueda ver bien por dónde caminar
scene.fog = new THREE.Fog('#1a1a2e', 20, 80);

// 2. Configuración de la Cámara
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

// 3. Renderizador
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true; // Activar sombras

// 4. Iluminación (Misteriosa pero visible)
// Luz ambiental más fuerte para no perder detalles del modelo 3D y resaltar el suelo
const ambientLight = new THREE.AmbientLight('#ffffff', 2.0);
scene.add(ambientLight);

// Luz direccional tenue (luz de luna filtrándose)
const directionalLight = new THREE.DirectionalLight('#8899cc', 1.5);
directionalLight.position.set(10, 20, -10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
scene.add(directionalLight);

// Luz de "Ámbar/Resina" brillando cerca del inicio
const amberLight = new THREE.PointLight('#ffaa00', 3, 30);
amberLight.position.set(2, 2, 2);
scene.add(amberLight);

// --- SISTEMA DE PARTÍCULAS (Esporas) ---
const particleCount = 1000;
const particleGeo = new THREE.BufferGeometry();
const particlePos = new Float32Array(particleCount * 3);
for(let i=0; i<particleCount*3; i++) {
    particlePos[i] = (Math.random() - 0.5) * 100; // X
    if(i % 3 === 1) particlePos[i] = Math.random() * 20; // Y (Altura)
}
particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
const particleMat = new THREE.PointsMaterial({
    color: '#ffaa00',
    size: 0.15,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
});
const spores = new THREE.Points(particleGeo, particleMat);
scene.add(spores);

// 5. Entorno (Piso / Terreno Base - Tumbas de Resina)
const textureLoader = new THREE.TextureLoader();
const floorTexture = textureLoader.load('/suelo.jpg', (texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 20); // Repetir la imagen 20 veces para que no se vea estirada
}, undefined, (e) => console.log("Textura 'suelo.jpg' no encontrada. Usando color base."));

const floorGeometry = new THREE.PlaneGeometry(100, 100);
const floorMaterial = new THREE.MeshStandardMaterial({ 
    color: '#885522', // Color más claro para que resalte
    map: floorTexture,
    roughness: 0.8,
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI * 0.5; // Acostar el plano
floor.receiveShadow = true;
scene.add(floor);

// --- GENERACIÓN DEL NIVEL (Cristales Morados) ---
const obstacles = [];
const pillarGeo = new THREE.BoxGeometry(2, 10, 2);
const pillarMat = new THREE.MeshStandardMaterial({ 
    color: '#aa00ff', 
    emissive: '#440088', // Los pilares ahora brillan como cristales
    roughness: 0.1,
    metalness: 0.8 
});
for(let i = 0; i < 40; i++) {
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.set(
        (Math.random() - 0.5) * 80,
        5,
        (Math.random() - 0.5) * 80
    );
    // Evitar que aparezcan justo donde empezamos
    if(pillar.position.length() < 10) continue; 
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    scene.add(pillar);
    obstacles.push(pillar);
}

// Contenedor físico del jugador (Cubo invisible para colisiones)
const playerGeometry = new THREE.BoxGeometry(1, 2, 1);
const playerMaterial = new THREE.MeshStandardMaterial({ visible: false }); // Lo ocultamos
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.y = 1; // Subir el cubo para que repose sobre el piso
scene.add(player);

// Cargar el modelo 3D del Nailmaster
let playerModel = null;
const loader = new GLTFLoader();
loader.load('/hollow_knight__nailmaster_oromato.glb', (gltf) => {
    playerModel = gltf.scene;
    
    // Escalar el modelo (seguramente sea muy grande, así que lo achicamos)
    playerModel.scale.set(0.5, 0.5, 0.5); 
    
    // Configurar sombras para el modelo
    playerModel.traverse((node) => {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
        }
    });

    // Agregar el modelo dentro de nuestro "cubo" invisible para que se mueva con él
    player.add(playerModel);
    
    // Ajustar posición vertical del modelo respecto al cubo
    playerModel.position.y = -1; 
}, undefined, (error) => {
    console.error('Error cargando el modelo:', error);
});

document.querySelector('#ui h1').innerText = "WASD Mover | CLIC Atacar | SHIFT Dash | Q Curar | ANTICLIC Saltar";

// --- CONTROLES Y FÍSICAS ---
const keys = { w: false, a: false, s: false, d: false, space: false, shift: false, q: false };
const velocity = new THREE.Vector3();
let isJumping = false;
let gameStarted = false;
let isPaused = false;

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) keys[key] = true;
    if (e.code === 'Space') keys.space = true;
    if (e.key === 'Shift') keys.shift = true;
    
    // Controles del Sistema (F1 y F2)
    if (e.key === 'F1') {
        e.preventDefault();
        window.location.reload(); // Salir del juego (recarga)
    }
    if (e.key === 'F2') {
        e.preventDefault();
        if (gameStarted && !isDead) {
            isPaused = !isPaused;
            if (isPaused) {
                document.querySelector('#ui h1').innerText = "** JUEGO EN PAUSA **";
                document.querySelector('#ui h1').style.color = "#ffff00";
            } else {
                document.querySelector('#ui h1').innerText = "WASD Mover | CLIC Atacar | SHIFT Dash | Q Curar | ANTICLIC Saltar";
                document.querySelector('#ui h1').style.color = "#ccc";
            }
        }
    }
    
    // Si estás muerto, presiona Enter para salir/reiniciar
    if (isDead && e.key === 'Enter') {
        window.location.reload();
    }
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) keys[key] = false;
    if (e.code === 'Space') keys.space = false;
    if (e.key === 'Shift') keys.shift = false;
});

// Salto con Clic Derecho (Anticlic)
window.addEventListener('contextmenu', (e) => {
    e.preventDefault(); // Prevenir el menú por defecto
    if (gameStarted && !isJumping && !isDead) {
        velocity.y = 8;
        isJumping = true;
    }
});

// --- SISTEMA DE VIDA Y ÁMBAR ---
let playerHealth = 100;
let playerAmber = 0;
let isInvulnerable = false;
let isDead = false;

// Variables de Curación y Dash
let isHealing = false;
let healTimer = 0;
let isDashing = false;
let dashTime = 0;
let dashCooldown = 0;
let dashDirection = new THREE.Vector3(0,0,-1);

function takeDamage(amount = 1) {
    if (isDead) return;
    
    // Si recibe daño, se cancela la curación
    isHealing = false;
    healTimer = 0;
    
    playerHealth -= amount;
    if (playerHealth <= 0) {
        playerHealth = 0;
        isDead = true;
    }
    
    document.getElementById('health-value').innerText = playerHealth;
    
    // Parpadeo rojo de daño (efecto visual rápido de 150ms)
    if (playerModel) {
        playerModel.traverse((node) => {
            if (node.isMesh && node.material) {
                if (!node.userData.originalEmissive) {
                    node.userData.originalEmissive = node.material.emissive.getHex();
                }
                node.material.emissive.setHex(0xff0000);
            }
        });
        setTimeout(() => {
            if (playerModel && !isDead) {
                playerModel.traverse((node) => {
                    if (node.isMesh && node.material && node.userData.originalEmissive !== undefined) {
                        node.material.emissive.setHex(node.userData.originalEmissive);
                    }
                });
            }
        }, 150);
    }

    if (isDead) {
        document.querySelector('#ui h1').innerText = "¡HAS MUERTO! PRESIONA ENTER O HAZ CLIC EN REINICIAR";
        document.querySelector('#ui h1').style.color = "#ff0000";
        document.getElementById('game-over-menu').style.display = 'flex';
    }
}

// 6. Enemigos y Combate
let isAttacking = false;
let attackCooldown = 0;

// Sistema de Enemigos
const enemies = [];

// Pre-cargar modelos de enemigos (Varios tipos para evitar la monotonía)
const enemyModels = [];
const enemyFiles = [
    { file: encodeURI('/hollow_knight (1).glb'), scale: 0.6 },
    { file: encodeURI('/hornet.glb'), scale: 0.3 },
    { file: encodeURI('/hollow_knight_grimmchild_animation.glb'), scale: 0.8 }
];

enemyFiles.forEach((info) => {
    loader.load(info.file, (gltf) => {
        const model = gltf.scene;
        model.scale.set(info.scale, info.scale, info.scale);
        model.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
            }
        });
        enemyModels.push(model);
    }, undefined, (e) => console.error('Error cargando bot:', info.file, e));
});

function spawnEnemy() {
    // Buscar un enemigo "muerto" (invisible) para reciclar (Object Pooling)
    let enemy = enemies.find(e => !e.visible);

    if (enemy) {
        // Reciclar enemigo existente
        enemy.position.set((Math.random() - 0.5) * 60, 1, (Math.random() - 0.5) * 60);
        if(enemy.position.length() < 15) enemy.position.z += 20; 
        enemy.userData.speed = 2 + Math.random() * 3;
        enemy.userData.damage = Math.floor(Math.random() * 6) + 5;
        enemy.userData.lastAttackTime = 0;
        enemy.visible = true;
    } else {
        // Si no hay reciclables, crear uno nuevo solo si no hemos llegado al límite
        if (enemies.length >= 20) return;

        // Contenedor físico (Visible temporalmente en rojo para evitar que sean invisibles si falla)
        const enemyGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        const enemyMat = new THREE.MeshStandardMaterial({ color: '#ff0000', wireframe: true }); 
        const newEnemy = new THREE.Mesh(enemyGeo, enemyMat);
        newEnemy.position.set((Math.random() - 0.5) * 60, 1, (Math.random() - 0.5) * 60);
        if(newEnemy.position.length() < 15) newEnemy.position.z += 20; 
        
        // Asignar estadísticas aleatorias (Poder de ataque 5 a 10)
        newEnemy.userData.speed = 2 + Math.random() * 3; 
        newEnemy.userData.damage = Math.floor(Math.random() * 6) + 5; 
        newEnemy.userData.lastAttackTime = 0;

        scene.add(newEnemy);
        enemies.push(newEnemy);

        // Adjuntar modelo 3D cuando cargue
        const attachModel = () => {
            if(enemyModels.length > 0) {
                newEnemy.material.visible = false; // Ocultar la caja roja temporal
                const randomModel = enemyModels[Math.floor(Math.random() * enemyModels.length)];
                const modelClone = randomModel.clone();
                modelClone.position.y = -0.75;
                newEnemy.add(modelClone);
                newEnemy.userData.model = modelClone;
            } else {
                setTimeout(attachModel, 500); // Reintentar si aún no cargó
            }
        };
        attachModel();
    }
}
// Crear 10 enemigos iniciales
for(let i=0; i<10; i++) spawnEnemy();

// Sistema de Ataque (Efecto visual de tajo)
const slashGeo = new THREE.BoxGeometry(6, 0.2, 6);
const slashMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0 });
const slashHitbox = new THREE.Mesh(slashGeo, slashMat);
player.add(slashHitbox);

let bossActive = false;
let boss = null;
let bossHealth = 10; // Reducido para que no sea inmortal

// Pre-cargar Jefe Final (Reemplazado por Grimmchild para cargar rápido)
let baseBossModel = null;
loader.load(encodeURI('/hollow_knight_grimmchild_animation.glb'), (gltf) => {
    baseBossModel = gltf.scene;
    baseBossModel.scale.set(15, 15, 15); // Escalado gigantesco para intimidar
    baseBossModel.position.y = -2;
    baseBossModel.traverse((node) => {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
        }
    });
});

function spawnBoss() {
    bossActive = true;
    document.querySelector('#ui h1').innerText = "¡EL JEFE HA DESPERTADO!";
    document.querySelector('#ui h1').style.color = "#ff00ff";
    
    // Mostrar la barra de vida del Jefe en la UI
    document.getElementById('boss-health-bar').style.display = 'block';
    document.getElementById('boss-health-value').innerText = bossHealth;
    
    // Contenedor físico del jefe (Cubo rojo gigante por si tarda en cargar)
    const bossGeo = new THREE.BoxGeometry(6, 8, 6);
    const bossMat = new THREE.MeshStandardMaterial({ color: '#ff0000', wireframe: true });
    boss = new THREE.Mesh(bossGeo, bossMat);
    boss.position.set(0, 3, -30);
    boss.userData.lastAttackTime = 0;
    scene.add(boss);

    // Adjuntar el modelo cuando termine de descargar
    const attachBoss = () => {
        if(baseBossModel) {
            boss.material.visible = false; // Ocultar el cubo rojo
            boss.add(baseBossModel);
            boss.userData.model = baseBossModel;
        } else {
            setTimeout(attachBoss, 500); // Esperar medio segundo
        }
    };
    attachBoss();
}

window.addEventListener('mousedown', () => {
    if(attackCooldown <= 0) {
        isAttacking = true;
        attackCooldown = 0.5; // Medio segundo de enfriamiento
        slashHitbox.material.opacity = 0.8;
        
        // Detectar impacto con enemigos
        for(let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            if(!enemy.visible) continue; // Ignorar enemigos reciclados

            const dist = player.position.distanceTo(enemy.position);
            if(dist < 5) { // Rango del ataque
                // En lugar de remover de la escena, usamos Object Pooling (ocultamos)
                enemy.visible = false;
                
                // Recompensa: Recolectar Ámbar
                playerAmber += 10;
                document.getElementById('amber-value').innerText = playerAmber;
            }
        }

        // Detectar impacto con el Jefe
        if(bossActive && boss) {
            const dist = player.position.distanceTo(boss.position);
            if(dist < 12) { // Rango del ataque aumentado para el jefe
                bossHealth--;
                document.getElementById('boss-health-value').innerText = bossHealth;
                
                if(boss.userData.model) {
                    boss.userData.model.traverse(node => {
                        if(node.isMesh && node.material) node.material.emissive.setHex(0xffffff);
                    });
                    setTimeout(() => {
                        if(boss && boss.userData.model) {
                            boss.userData.model.traverse(node => {
                                if(node.isMesh && node.material) node.material.emissive.setHex(0x000000);
                            });
                        }
                    }, 200);
                }
                
                if(bossHealth <= 0) {
                    scene.remove(boss);
                    bossActive = false;
                    boss = null;
                    document.getElementById('boss-health-bar').style.display = 'none';
                    document.querySelector('#ui h1').innerText = "¡HAS GANADO! EL CAPÍTULO 1 ESTÁ COMPLETO";
                    document.querySelector('#ui h1').style.color = "#ffff00";
                }
            }
        }
    }
});

// 7. Ciclo de Animación (Game Loop)
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta(); // Consumir el delta siempre

    if (!gameStarted || isPaused) return; // Pausado o no iniciado
    if (isDead) return; // Detener lógica si el jugador murió

    // --- OLEADAS DE ENEMIGOS CADA 4 SEGUNDOS ---
    const timeSecs = clock.getElapsedTime();
    if (Math.floor(timeSecs) > 0 && Math.floor(timeSecs) % 4 === 0) {
        if (!window.waveSpawnedForThisSecond) {
            window.waveSpawnedForThisSecond = Math.floor(timeSecs);
            // Spawnear 1 o 2 enemigos
            spawnEnemy();
            if(Math.random() > 0.5) spawnEnemy();
        }
    } else {
        if (window.waveSpawnedForThisSecond !== Math.floor(timeSecs)) {
            window.waveSpawnedForThisSecond = null;
        }
    }

    // --- JEFE FINAL AL MINUTO 2 (120 Segundos) ---
    if (Math.floor(timeSecs) === 120 && !bossActive && !window.bossSpawned) {
        window.bossSpawned = true;
        spawnBoss();
    }

    // Paredes invisibles (Límites del mapa 50x50)
    if (player.position.x > 49) player.position.x = 49;
    if (player.position.x < -49) player.position.x = -49;
    if (player.position.z > 49) player.position.z = 49;
    if (player.position.z < -49) player.position.z = -49;
    
    // Colisión básica con el suelo
    if (player.position.y < 1) {
        player.position.y = 1;
        velocity.y = 0;
        isJumping = false;
    }
    if (keys.q && playerHealth < 5 && playerAmber >= 30 && !isDashing && !isJumping) {
        isHealing = true;
        healTimer += deltaTime;
        
        // Efecto visual de curación (parpadeo blanco)
        if (playerModel && Math.floor(healTimer * 10) % 2 === 0) {
             playerModel.traverse((node) => {
                if (node.isMesh && node.material) node.material.emissive.setHex(0xffffff);
             });
        }
        
        if (healTimer >= 1.5) { // Tarda 1.5s en curarse
            playerHealth++;
            playerAmber -= 30;
            document.getElementById('health-value').innerText = playerHealth;
            document.getElementById('amber-value').innerText = playerAmber;
            healTimer = 0;
            isHealing = false; // Listo
        }
    } else {
        if (isHealing) {
            // Cancelado por soltar la Q o moverse
            isHealing = false;
            healTimer = 0;
        }
        // Limpiar color si no está recibiendo daño
        if (!isInvulnerable && playerModel) {
            playerModel.traverse((node) => {
                if (node.isMesh && node.material && node.userData.originalEmissive !== undefined) {
                    node.material.emissive.setHex(node.userData.originalEmissive);
                }
            });
        }
    }

    // --- LÓGICA DE MOVIMIENTO ---
    const direction = new THREE.Vector3();
    if (!isHealing) { // No puedes caminar mientras te curas
        if (keys.w) direction.z -= 1;
        if (keys.s) direction.z += 1;
        if (keys.a) direction.x -= 1;
        if (keys.d) direction.x += 1;
    }

    if (direction.length() > 0) {
        direction.normalize();
    }

    // --- LÓGICA DE DASH (SHIFT) ---
    if (dashCooldown > 0) dashCooldown -= deltaTime;
    
    if (keys.shift && dashCooldown <= 0 && !isDashing && !isHealing) {
        isDashing = true;
        dashTime = 0.2; // Duración del dash rápido
        dashCooldown = 1.0; // Enfriamiento de 1s
        isInvulnerable = true; // Eres inmune al daño durante el dash!
        
        if (direction.length() === 0) {
            // Dash hacia donde mira el modelo si está quieto
            dashDirection.set(0, 0, 1).applyAxisAngle(new THREE.Vector3(0,1,0), playerModel ? playerModel.rotation.y : 0);
        } else {
            dashDirection.copy(direction);
        }
    }

    if (isDashing) {
        dashTime -= deltaTime;
        player.position.addScaledVector(dashDirection, 40 * deltaTime); // Velocidad brutal
        if (dashTime <= 0) {
            isDashing = false;
            isInvulnerable = false; // Pierdes inmunidad al terminar
        }
    } else {
        // Aplicar movimiento normal
        player.position.addScaledVector(direction, 10 * deltaTime);
    }

    // Hacer que el modelo 3D gire hacia donde camina
    if (playerModel && direction.length() > 0) {
        const targetAngle = Math.atan2(direction.x, direction.z);
        playerModel.rotation.y = targetAngle;
    }

    // Animar Esporas (Rotación lenta)
    spores.rotation.y += 0.05 * deltaTime;
    spores.position.y = Math.sin(clock.getElapsedTime()) * 0.5;

    // IA Enemigos: Perseguir al jugador y atacar
    enemies.forEach(enemy => {
        if (!enemy.visible) return; // Ignorar enemigos reciclados/muertos

        const enemyDir = new THREE.Vector3().subVectors(player.position, enemy.position);
        enemyDir.y = 0; // No volar
        const dist = enemyDir.length();
        if (dist > 1.5) {
            enemyDir.normalize();
            const spd = enemy.userData.speed || 3;
            enemy.position.addScaledVector(enemyDir, spd * deltaTime); // Velocidad enemigo
        } else {
            // Rango de ataque (primer contacto inmediato, y luego cada 0.5 segundos)
            if (!isInvulnerable) {
                const lastAttack = enemy.userData.lastAttackTime || 0;
                if (timeSecs - lastAttack >= 0.5) {
                    enemy.userData.lastAttackTime = timeSecs;
                    takeDamage(enemy.userData.damage || 5);
                }
            }
        }
        enemy.rotation.y = Math.atan2(enemyDir.x, enemyDir.z);
    });

    // IA del JEFE FINAL
    if (bossActive && boss) {
        const dir = new THREE.Vector3().subVectors(player.position, boss.position);
        dir.y = 0;
        const dist = dir.length();
        if (dist > 3) {
            dir.normalize();
            boss.position.addScaledVector(dir, 4 * deltaTime); // El jefe es más rápido
        } else {
            if (!isInvulnerable) {
                const lastAttack = boss.userData.lastAttackTime || 0;
                if (timeSecs - lastAttack >= 0.5) {
                    boss.userData.lastAttackTime = timeSecs;
                    takeDamage(15); // El jefe hace 15 de daño cada 0.5s
                }
            }
        }
        boss.rotation.y = Math.atan2(dir.x, dir.z);
    }

    // Enfriamiento de ataque y efecto visual
    if(attackCooldown > 0) {
        attackCooldown -= deltaTime;
        slashHitbox.material.opacity -= deltaTime * 3; // Desvanecer efecto
        if(slashHitbox.material.opacity < 0) slashHitbox.material.opacity = 0;
    } else {
        isAttacking = false;
    }

    // Lógica de Salto y Gravedad Básica
    if (keys.space && !isJumping) {
        velocity.y = 8; // Fuerza de salto
        isJumping = true;
    }
    
    velocity.y -= 20 * deltaTime; // Gravedad
    player.position.y += velocity.y * deltaTime;

    // Colisión con el piso
    if (player.position.y <= 1) { // 1 es la mitad de la altura del cubo
        player.position.y = 1;
        velocity.y = 0;
        isJumping = false;
    }

    // Hacer que la cámara siga al jugador (Ángulo isométrico/cenital)
    camera.position.x = player.position.x;
    camera.position.y = player.position.y + 12; // Cámara bien arriba
    camera.position.z = player.position.z + 8; // Y un poco hacia atrás
    camera.lookAt(player.position);

    // Renderizar la escena
    renderer.render(scene, camera);
}

// 7. Ajuste de pantalla al redimensionar
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Iniciar el juego
animate();

// --- 8. MÚSICA DE FONDO Y MENÚ DE INICIO ---
const bgMusic = new Audio('/music.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.5;

function startMusic() {
    bgMusic.play().then(() => {
        console.log("Música iniciada");
    }).catch((err) => console.log("Error de audio:", err));
}

// Botón de Inicio
window.startGame = function() {
    const menu = document.getElementById('start-menu');
    if (menu) menu.style.display = 'none';
    gameStarted = true;
    try { startMusic(); } catch(err) { console.log("Audio block:", err); }
    try { clock.start(); } catch(err) { console.log("Clock err:", err); }
};

const btnStart = document.getElementById('btn-start');
if (btnStart) {
    btnStart.addEventListener('click', window.startGame);
}

// Botón de Reiniciar Juego (Game Over)
document.getElementById('btn-restart').addEventListener('click', () => {
    window.location.reload();
});

// Evento para Re-escalar Ventana (Responsive)
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
