/**
 * Copia la especificación y las decisiones desde la raíz del repositorio hacia
 * src/contenido/, inyectando el frontmatter que Astro necesita.
 *
 * El repositorio es la fuente de verdad: src/contenido/ es generado y está en
 * .gitignore. Nunca se edita a mano.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = join(aqui, "..", "..");
const destino = join(aqui, "..", "src", "contenido");

rmSync(destino, { recursive: true, force: true });
mkdirSync(join(destino, "decisiones"), { recursive: true });

function titulo(md) {
  const m = md.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : "Sin título";
}

function sinH1(md) {
  return md.replace(/^#\s+.+$/m, "").replace(/^\s+/, "");
}

/**
 * Cada decisión abre con una línea en cursiva que dice qué problema resuelve. En
 * GitHub es la entradilla del documento; aquí sube al frontmatter para que el índice
 * la use como descripción y la página la componga aparte del cuerpo.
 */
const ENTRADILLA = /^\*([^*][\s\S]*?)\*(?:\n|$)/;

function entradilla(cuerpo) {
  const m = cuerpo.match(ENTRADILLA);
  return m ? m[1].replace(/\s+/g, " ").trim() : "";
}

function sinEntradilla(cuerpo) {
  return cuerpo.replace(ENTRADILLA, "").replace(/^\s+/, "");
}

function escapar(s) {
  return s.replace(/"/g, '\\"');
}

// Especificación
const spec = readFileSync(join(raiz, "spec", "v1.1.1.md"), "utf8");
writeFileSync(
  join(destino, "spec.md"),
  `---\ntitulo: "${escapar(titulo(spec))}"\n---\n\n${sinH1(spec)}`
);

// Decisiones
const dir = join(raiz, "decisiones");
let n = 0;
for (const archivo of readdirSync(dir).sort()) {
  if (!archivo.endsWith(".md") || archivo === "README.md") continue;
  const md = readFileSync(join(dir, archivo), "utf8");
  const slug = basename(archivo, ".md");
  const cuerpo = sinH1(md);
  writeFileSync(
    join(destino, "decisiones", `${slug}.md`),
    `---\ntitulo: "${escapar(titulo(md))}"\nslug: "${slug}"\n` +
      `resumen: "${escapar(entradilla(cuerpo))}"\n---\n\n${sinEntradilla(cuerpo)}`
  );
  n++;
}

// Casos de conformidad
writeFileSync(
  join(destino, "casos.json"),
  readFileSync(join(raiz, "conformidad", "casos.json"), "utf8")
);

// Parser de referencia, para el validador
writeFileSync(
  join(destino, "fer.js"),
  readFileSync(join(raiz, "referencia", "javascript", "fer.js"), "utf8")
);

// Registro de claves en URL estable, para que una herramienta valide sin clonar.
writeFileSync(
  join(aqui, "..", "public", "registro.json"),
  readFileSync(join(raiz, "claves", "registro.json"), "utf8")
);

// Adoptantes. La portada los renderiza desde aquí y no desde una lista propia,
// para que un alta sea un PR al registro y no una edición del sitio.
writeFileSync(
  join(destino, "adoptantes.json"),
  readFileSync(join(raiz, "adoptantes", "registro.json"), "utf8")
);

console.log(`sync: spec + ${n} decisiones + casos + parser + registro + adoptantes`);
