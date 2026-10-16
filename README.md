# AccesApp — Accesibilidad UNM

Juego de preguntas para aprender a identificar **barreras para la accesibilidad** en imágenes:
**físicas**, **comunicacionales** y **actitudinales**.

La persona carga su nombre, apellido y email, responde las preguntas (cada una con una foto) y al final ve su puntaje. Los resultados se guardan en una planilla de Google Sheets.

---

## ¿Cómo está armada?

| Parte | Archivo | Qué hace |
|---|---|---|
| Inicio | `src/app/page.tsx` | Portada con la descripción y el botón **INICIAR**. |
| Juego | `src/app/jugar/page.tsx` | Ventana de datos, preguntas, timer, respuestas y resultados. |
| Preguntas | `src/data/preguntas.ts` | **Acá se agregan o cambian las preguntas.** |
| Guardado | `src/app/api/save/route.ts` | Recibe los resultados y los agrega como fila en Google Sheets. |
| Estilos | `src/app/globals.css` | Todo el diseño visual y las animaciones. Los colores están al principio. |
| Sonidos | `src/lib/sonidos.ts` | Los sonidos del juego (se generan con código, no hay archivos de audio). |
| Pantalla de carga | `src/components/PantallaCarga.tsx` | El ojo animado que aparece mientras se cargan las fotos. |
| Escena de la portada | `src/components/EscenaBarreras.tsx` | La lupa que recorre una escena y marca las tres barreras. |
| Fotos | `public/fotos/` | Imágenes de cada pregunta (formato `.webp`). |
| Diseño general | `src/app/layout.tsx` | Fuente, título de la pestaña y estructura común a todas las páginas. |

Tecnologías: [Next.js](https://nextjs.org) (React + TypeScript). Se publica en **Vercel**: cada cambio que se sube a la rama `main` de GitHub se despliega solo.

## Agregar o editar una pregunta

1. Poné la foto en `public/fotos/` (idealmente `.webp`, de unos 740 px de ancho y menos de 150 KB).
2. En `src/data/preguntas.ts` agregá un bloque como este:

```ts
{
  id: 9,                                   // número que no se repita
  imagen: "/fotos/mi_foto.webp",
  alt: "Descripción de lo que se ve en la foto, para personas que usan lector de pantalla.",
  enunciado: "¿Qué barreras se visualizan en la imagen?",
  opciones: ["Barrera física", "Barrera comunicacional", "Barrera actitudinal"],
  correctas: [0, 2],                       // 0 = física, 1 = comunicacional, 2 = actitudinal
  tiempo: 60,                              // segundos
  explicacion: "Texto que se muestra después de responder.",
},
```


> **Sobre el `alt`:** describí la escena como se la contarías a alguien por teléfono (quién está, dónde, qué hace), **sin decir cuál es la barrera**: eso es lo que la persona tiene que descubrir.

## Correrla en tu computadora

Necesitás [Node.js](https://nodejs.org) 20 o más nuevo.

```bash
npm install      # instala las dependencias (solo la primera vez o si cambian)
npm run dev      # abre la app en http://localhost:3000
```

Para que el guardado en Google Sheets funcione en tu compu, creá un archivo `.env.local` (no se sube a GitHub) con las mismas variables que están cargadas en Vercel (ver abajo).

Otros comandos útiles:

```bash
npm run build    # compila como lo hace Vercel (sirve para detectar errores antes de subir)
npm run lint     # revisa el código en busca de problemas comunes
```

## Variables de entorno (en Vercel → Settings → Environment Variables)

| Variable | Para qué |
|---|---|
| `SHEET_ID` | ID de la planilla (la parte larga de la URL de Google Sheets). |
| `SHEET_TAB` | Nombre de la pestaña donde se guardan las filas (por defecto `Respuestas`). |
| `GOOGLE_SERVICE_ACCOUNT` | JSON completo de la cuenta de servicio de Google. |
| — o en su lugar — `GOOGLE_CLIENT_EMAIL` + `GOOGLE_PRIVATE_KEY` | Email y clave privada de la cuenta de servicio, por separado. |

La planilla tiene que estar **compartida con el email de la cuenta de servicio** (con permiso de edición).

Cada partida agrega una fila con: fecha, nombre, apellido, email, puntaje, total de preguntas, tiempo total en segundos y un resumen de cada respuesta.

## Accesibilidad

Como es una app sobre accesibilidad, la app también intenta serlo:

- Todas las fotos tienen descripción (`alt`) para lectores de pantalla.
- Se puede usar entera con teclado; hay un enlace "Saltar al contenido".
- Los formularios tienen etiquetas y mensajes de error claros.
- Los resultados de cada respuesta y los avisos del timer se anuncian al lector de pantalla.
- El tiempo se puede pausar, extender o desactivar.
- Se respeta la preferencia del sistema de "reducir movimiento": con esa opción activada, las animaciones se apagan.
- Los sonidos nunca son la única señal (siempre hay un mensaje en pantalla) y se pueden apagar con el botón **Sonido**; la elección queda guardada en el navegador.
