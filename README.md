# Físico — gym y nutrición (PWA)

App web instalable para iPhone con dos apartados:

- **Gym:** programa Torso · Pierna · Full Body de 17 semanas por olas (calibración de 1RM, Training Max, AMRAP, doble progresión de accesorios y descargas), con sesión guiada serie a serie y temporizador de descanso.
- **Nutrición:** calcula calorías y macros según tu objetivo, registra lo que comes
(código de barras con Open Food Facts, foto de la etiqueta con IA opcional o a mano), agua, suplementos
y peso, y ajusta el plan cada semana con tu progreso real. Los datos se guardan solo en el dispositivo.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:5173  (añade ?sim para simular notch y barra inferior)
npm run build
```

## Publicar en GitHub Pages

1. Sube el proyecto a un repositorio de GitHub (rama `main`).
2. **Settings → Pages → Source: GitHub Actions**.
3. Cada `git push` a `main` publica en `https://<usuario>.github.io/<repositorio>/`.

## Lectura de etiquetas con IA (opcional)

En **Ajustes → Lectura de etiquetas** se pega una clave de API de Anthropic (console.anthropic.com).
La clave se guarda solo en el dispositivo y no se incluye en las copias de seguridad.
