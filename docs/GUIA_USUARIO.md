# Guía de usuario — LogINV

La guía de uso completa vive **dentro de la app**, en **Ayuda y guía** (`/ayuda`):
explica cada pantalla y botón con capturas, filtra según tu rol e incluye la tabla
de permisos y preguntas frecuentes.

- En computadora: menú lateral → *Ayuda y guía*.
- En el celular: barra inferior → *Más* → *Ayuda*.
- También desde el menú de tu cuenta (arriba a la derecha).

## Para administradores: dar de alta a una persona nueva

1. *Usuarios* → **Nueva cuenta**: nombre, correo, **Generar** contraseña y rol.
2. En la tarjeta verde que aparece, **Copiar mensaje de bienvenida** y enviarlo
   (incluye el enlace de la app y la indicación de abrir la guía).
3. La persona verá una tarjeta "¿Primera vez en LogINV?" en el panel que la lleva a la guía.

## Mantener la guía actualizada

- Textos: `src/app/ayuda/guideContent.js`.
- Capturas (`public/ayuda/*.webp`): se regeneran con la app en modo demo:

  ```bash
  NEXT_DIST_DIR=.next-demo NEXT_PUBLIC_USE_MOCK=true npx next build
  NEXT_DIST_DIR=.next-demo NEXT_PUBLIC_USE_MOCK=true npx next start -p 3123
  npm run guide:screenshots   # en otra terminal
  ```
