# Sitio

Presentación legible de la especificación. **No es una fuente de contenido:** el
repositorio es la fuente de verdad y el sitio lo renderiza.

`scripts/sync-contenido.mjs` copia `spec/`, `decisiones/`, `conformidad/casos.json` y
`referencia/javascript/fer.js` hacia `src/contenido/`, que está en `.gitignore` y nunca
se edita a mano. Para cambiar el texto de la especificación se edita el archivo de la
raíz del repositorio.

El validador importa `referencia/javascript/fer.js` sin modificarlo, así que la
herramienta y la implementación de referencia no pueden divergir. Tiene dos modos: el
contenido de un campo, y un archivo XML completo. El modo XML añade `src/lib/revisar-xml.js`,
que recorre el documento por nombre local —funciona con o sin namespace— y revisa las
recomendaciones de emisión de §4.3 y §4.4 sobre los datos en crudo, antes de que la
resolución de §5.2 las oculte. Ese archivo sí es propio del sitio: es lógica de
validación, no de lectura, y no forma parte de la especificación.

`scripts/sync-contenido.mjs` copia además `claves/registro.json` a `public/`, de modo
que el registro queda servido en una URL estable.

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

Papel, tinta y un marcador sobre lo único que el receptor lee. El gesto se repite en la
portada y en el validador: el mismo objeto, primero explicado y después manipulable.
Tipografía IBM Plex, pensada para documentación técnica. Sin sombras, sin esquinas
redondeadas, sin degradados.

El marcador usa el color que el manual de marca de Factura Fácil reserva para
marcadores editoriales. Es el único punto donde la marca del custodio entra en el
sistema visual; el logo va en el pie, no en la portada, porque la portada es del
estándar.

### Imagen de compartir

`public/og.png` se rinde de `scripts/og.html`, que importa `src/styles/fer.css` para que
los colores salgan de los tokens y no se desincronicen del sitio. Al cambiar el
marcador o subir de versión hay que volver a generarla:

```bash
chromium --headless --window-size=1200,630 \
  --screenshot=site/public/og.png site/scripts/og.html
```

Requiere red: las IBM Plex vienen de Google Fonts. Verificar que el texto no quedó en
la tipografía de reserva antes de dar la imagen por buena.
