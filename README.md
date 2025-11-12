# Neuma Fader

Sistema de mezcla de audio personalizado para **Neuma Audio Solutions**. Permite controlar dinámicamente el balance entre dos pistas de audio (música y efectos de sonido) sincronizadas con un reproductor de video.

## 🎯 Características

- ✅ **Video muteado** - Solo se escuchan las pistas de audio externas
- 🎚️ **Fader profesional** - Control deslizante con lógica de mezcla balanceada
- 📊 **Indicadores visuales** - Muestra porcentajes en tiempo real de cada pista
- 🎛️ **Presets rápidos** - Botones para 100% Música, 50/50, y 100% Efectos
- 🔄 **Sincronización precisa** - Mantiene audios alineados con tolerancia de 0.15s
- ⚡ **Precarga automática** - Buffer de medios para reproducción fluida
- ❌ **Manejo de errores** - Mensajes claros si algo falla al cargar
- 📱 **Diseño responsive** - Optimizado para móviles con controles táctiles grandes
- 🎨 **Interfaz moderna** - Tema oscuro profesional

## 🎬 Cómo funciona el Fader

La lógica de mezcla mantiene siempre al menos una pista al 50% de volumen:

- **Fader a la izquierda (0.0)**: Música 50% | Efectos 0%
- **Fader al centro (0.5)**: Música 50% | Efectos 50%
- **Fader a la derecha (1.0)**: Música 0% | Efectos 50%

Esto garantiza que siempre haya contenido audible mientras se mezcla entre las dos fuentes.

## 📁 Estructura del Proyecto

```
neuma-fader/
├── index.html              # Página principal
├── README.md              # Este archivo
├── css/
│   └── styles.css         # Estilos con diseño responsive
├── js/
│   └── app.js             # Lógica de sincronización y fader
└── assets/
    ├── images/
    │   └── neuma-logo.svg # Logo para el thumb del fader
    ├── audio/             # (Reservado para archivos locales)
    └── video/             # (Reservado para archivos locales)
```

## 🚀 Cómo ejecutar localmente

### Opción 1: Abrir directamente (más simple)
```powershell
# Desde PowerShell en la carpeta del proyecto
ii .\index.html
```

### Opción 2: Servidor HTTP con Python (recomendado)
```powershell
# Si tienes Python instalado
python -m http.server 8000

# Luego abre en tu navegador:
ii http://localhost:8000
```

### Opción 3: Servidor HTTP con Node.js
```powershell
# Usando npx (no requiere instalación)
npx http-server -p 8000

# Luego abre:
ii http://localhost:8000
```

### Opción 4: VS Code Live Server (para desarrollo)
1. Abre la carpeta en VS Code
2. Instala la extensión **"Live Server"**
3. Clic derecho en `index.html` → **"Open with Live Server"**
4. Se abrirá automáticamente en `http://127.0.0.1:5500`

## 🎮 Instrucciones de uso

1. **Espera a que cargue** - Verás un spinner mientras se precargan los medios
2. **Presiona Play** en el video
3. **Mueve el fader** para mezclar música y efectos
4. **Usa los presets** para cambios rápidos (100% Música, 50/50, 100% Efectos)
5. Los **indicadores de volumen** muestran los porcentajes en tiempo real

## 🔧 Configuración técnica

### Archivos de medios
Actualmente usa archivos remotos desde GitHub Pages:
- Video: `teaser2.mp4`
- Música: `musica1.mp3`
- Efectos: `sfx1.mp3`

Para usar archivos locales, colócalos en las carpetas correspondientes y actualiza las rutas en `index.html`:
```html
<source src="assets/video/tu-video.mp4" type="video/mp4">
<audio id="music-audio" src="assets/audio/tu-musica.mp3"></audio>
<audio id="sfx-audio" src="assets/audio/tus-efectos.mp3"></audio>
```

### Personalización
- **Colores**: Edita `css/styles.css` (variables de color en la parte superior)
- **Lógica del fader**: Modifica la función `setFaderValue()` en `js/app.js`
- **Tolerancia de sincronización**: Ajusta `tolerance` en el event listener de `timeupdate`

## 📱 Compatibilidad

- ✅ Chrome/Edge (WebKit)
- ✅ Firefox
- ✅ Safari (iOS/macOS)
- ✅ Opera
- ✅ Navegadores móviles (táctil optimizado)

## 🛠️ Desarrollo

### Próximas mejoras sugeridas
- [ ] Subir archivos locales desde interfaz
- [ ] Exportar mezcla final
- [ ] Más presets personalizables
- [ ] Visualizador de forma de onda
- [ ] Modo de ecualizador

## 📄 Licencia

Proyecto desarrollado para **Neuma Audio Solutions**

---

**Desarrollado con ❤️ para profesionales de audio**
