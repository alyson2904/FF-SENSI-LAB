# FF SENSI LAB — Yoru Studio

Primera beta web instalable (PWA) del generador experimental de sensibilidad.

## Estructura
- `index.html`: interfaz.
- `css/styles.css`: diseño adaptable.
- `js/app.js`: detección básica y algoritmo inicial.
- `manifest.webmanifest`: metadatos de instalación.
- `sw.js`: caché básica para uso offline.

## Probar desde Android
1. Sube todos los archivos a un repositorio público de GitHub.
2. En el repositorio abre Settings → Pages.
3. En Build and deployment selecciona Deploy from a branch.
4. Selecciona `main` y `/ (root)`, guarda.
5. Abre la URL de GitHub Pages en Chrome Android.
6. Menú ⋮ → Añadir a pantalla principal / Instalar aplicación.

## Importante
Esta versión es una PWA, todavía no un APK nativo. El navegador no puede leer con precisión modelo, DPI del sistema, RAM total o tasa real de refresco en todos los Android. La beta solicita esos datos manualmente. El siguiente paso será crear el contenedor Android y el puente nativo para detectar lo que Android permita.

El algoritmo es una heurística inicial no oficial. Los números deben validarse con pruebas de entrenamiento y no prometen headshots.
