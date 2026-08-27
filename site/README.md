# Sitio

Presentación legible de la especificación. **No es una fuente de contenido:** el
repositorio es la fuente de verdad y el sitio lo renderiza.

`scripts/sync-contenido.mjs` copia `spec/`, `decisiones/`, `conformidad/casos.json` y
`referencia/javascript/fer.js` hacia `src/contenido/`, que está en `.gitignore` y nunca
se edita a mano. Para cambiar el texto de la especificación se edita el archivo de la
raíz del repositorio.

El validador importa `referencia/javascript/fer.js` sin modificarlo, así que la
herramienta y la implementación de referencia no pueden divergir.

## Desarrollo

```bash
cd site
npm install
npm run dev      # sincroniza y levanta en localhost:4321
npm run build    # sincroniza y genera dist/
```

## Publicación

GitHub Actions publica en Pages con cada push a `main` que toque `site/`, la
especificación, las decisiones, los casos o el parser de referencia. El workflow corre
los casos de conformidad antes de construir: si el parser deja de pasar, el sitio no se
publica.

## Mover a un dominio propio

En `astro.config.mjs`:

```js
site: "https://midominio.org",
base: "/",
```

Y agregar `public/CNAME` con el dominio. Nada más depende de la URL: las rutas se
construyen desde `import.meta.env.BASE_URL`.

## Diseño

Papel, tinta y un marcador amarillo sobre lo único que el receptor lee. El gesto se
repite en la portada y en el validador: el mismo objeto, primero explicado y después
manipulable. Tipografía IBM Plex, pensada para documentación técnica. Sin sombras, sin
esquinas redondeadas, sin degradados.
