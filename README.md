# ⚔️ Las Tumbas de Resina

**Las Tumbas de Resina** es un videojuego de acción y supervivencia 3D para navegador web desarrollado con **Three.js** y **Vite**. Enfréntate a hordas de enemigos en un entorno sombrío, gestiona tu salud y derrota al temible Boss final para salir victorioso.

---

## 🎮 Controles del Juego

| Acción | Tecla / Control |
| :--- | :--- |
| **Moverse** | `W` `A` `S` `D` o Flechas de Dirección |
| **Atacar** | Click Izquierdo / `Espacio` / `F` |
| **Pausar / Reanudar** | `F2` |
| **Salir / Abandonar** | `F1` |

---

## 🌟 Características Principales

- **Bucle de Juego Completo:** Menú de inicio interactivo, HUD dinámico de salud y puntuación, menú de pausa y pantallas de Victoria / Game Over.
- **Sistema de Combate Dinámico:** 
  - Héroe con **100 HP**.
  - Enemigos comunes que causan entre **5 y 10 HP** de daño.
  - **Boss Final** temible con **10 HP** que causa **15 HP** de daño por golpe.
- **Optimización mediante Object Pooling:** Límite estricto de máximo 20 enemigos simultáneos reutilizando objetos en memoria para mantener 60 FPS estables.
- **Paredes Invisibles de Mapa:** Delimitación de área (100x100 unidades) para evitar caídas fuera del mapa.
- **Adaptabilidad Responsive:** Ajuste automático a la pantalla mediante listener de redimensionamiento de ventana (`resize`).

---

## 🛠️ Tecnologías Utilizadas

- **Lenguaje:** JavaScript (ES6 Modules)
- **Motor Gráfico:** [Three.js](https://threejs.org/)
- **Empaquetador & Dev Server:** [Vite](https://vitejs.dev/)
- **Estilos:** CSS3 nativo con efectos de cristal (Glassmorphism) y modo oscuro
- **Estructura:** HTML5 Canvas

---

## 🚀 Instalación y Ejecución Local

1. **Clonar o descargar el repositorio:**
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd juego2
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre el navegador en la URL indicada (por ejemplo, `http://localhost:5173`).

4. **Compilar para producción:**
   ```bash
   npm run build
   ```
   Los archivos optimizados se generarán en la carpeta `dist/`, listos para desplegar en servicios como AWS S3, Vercel o Netlify.

---

## 📜 Créditos y Reconocimientos

Este proyecto ha sido desarrollado con fines **académicos y educativos sin fines de lucro**.
- Inspiración conceptual y estética en el universo de *Hollow Knight* (propiedad de **Team Cherry**).
- Motor de renderizado 3D por la comunidad de **Three.js**.

---
*Desarrollado para la materia de Sistemas Embebidos / Desarrollo Web 3D.*
