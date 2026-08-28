import { defineConfig } from "astro/config";

// Sitio de proyecto en GitHub Pages: https://factura-facil.github.io/estandar-fe-retail-fer
// Al mover a dominio propio: site = "https://midominio.org", base = "/".
const base = "/estandar-fe-retail-fer";

function texto(nodo) {
  if (nodo.type === "text") return nodo.value;
  return (nodo.children ?? []).map(texto).join("");
}

/**
 * Los .md de la raíz son la fuente de verdad y se leen también en GitHub, donde un
 * enlace relativo a otro .md es lo correcto. En el sitio esa ruta no existe —la
 * decisión se publica como directorio— y el enlace daría 404, así que se reescribe al
 * renderizar en vez de romper la lectura en GitHub.
 *
 * De paso marca el aparte de superseción: sin clase propia se compone igual que
 * cualquier cita, y lo que dice es que el párrafo de arriba ya no describe el estándar
 * vigente.
 */
const ENLACE_ADR = /^(\d{4}-[a-z0-9-]+)\.md(#.*)?$/;

function rehypeDecisiones() {
  return (arbol) => {
    const visitar = (nodo) => {
      if (nodo.tagName === "a") {
        const m = ENLACE_ADR.exec(nodo.properties?.href ?? "");
        if (m) nodo.properties.href = `${base}/decisiones/${m[1]}/${m[2] ?? ""}`;
      }
      if (nodo.tagName === "blockquote" && texto(nodo).trim().startsWith("Superseado.")) {
        nodo.properties.className = [
          ...(nodo.properties.className ?? []),
          "aparte--superseado",
        ];
      }
      for (const hijo of nodo.children ?? []) visitar(hijo);
    };
    visitar(arbol);
  };
}

/**
 * La especificación abre declarando estado, versión y centinela. En markdown eso es un
 * párrafo de tres pares «**Rótulo:** valor» separados por saltos de línea, que al HTML
 * sale como un bloque de texto corrido donde las tres afirmaciones se pierden.
 *
 * Se recomponen como pastillas, que es como se leen: de un vistazo y sin orden de
 * lectura. La regla es de forma, no de contenido —párrafo que abre con un <strong>
 * terminado en dos puntos y que trae tres o más— para no acoplar la plantilla a las
 * palabras del texto normativo, que es fuente de verdad y no se toca desde aquí.
 */
function esPastillas(nodo) {
  const hijos = (nodo.children ?? []).filter((h) => h.type !== "text" || h.value.trim());
  const fuertes = hijos.filter((h) => h.tagName === "strong");
  return (
    fuertes.length >= 3 &&
    hijos[0]?.tagName === "strong" &&
    texto(hijos[0]).trim().endsWith(":")
  );
}

function pastilla(rotulo, valor) {
  // Los saltos de línea que separaban los pares en el markdown sobran dentro de la
  // pastilla, pero los espacios interiores no: un valor puede traer un enlace en medio.
  const limpio = valor.map((n) =>
    n.type === "text" ? { ...n, value: n.value.replace(/\s+/g, " ") } : n
  );
  while (limpio.length && !texto(limpio[0]).trim()) limpio.shift();
  while (limpio.length && !texto(limpio[limpio.length - 1]).trim()) limpio.pop();
  const primero = limpio[0];
  const ultimo = limpio[limpio.length - 1];
  if (primero?.type === "text") primero.value = primero.value.replace(/^\s+/, "");
  if (ultimo?.type === "text") ultimo.value = ultimo.value.replace(/\s+$/, "");

  // La del centinela lleva el verde del marcador: es el dato que el receptor busca.
  const codigo = limpio.some((n) => n.tagName === "code");

  return {
    type: "element",
    tagName: "span",
    properties: { className: ["pastilla", ...(codigo ? ["pastilla--verde"] : [])] },
    children: [
      {
        type: "element",
        tagName: "strong",
        properties: {},
        children: [{ type: "text", value: texto(rotulo).trim().replace(/:$/, "") }],
      },
      // El valor va en un solo nodo: la pastilla es un flex de dos piezas y un valor
      // suelto en varios trozos repartiría el gap entre cada uno.
      { type: "element", tagName: "span", properties: {}, children: limpio },
    ],
  };
}

function rehypePastillas() {
  return (arbol) => {
    const visitar = (nodo) => {
      for (const hijo of nodo.children ?? []) {
        if (hijo.tagName === "p" && esPastillas(hijo)) {
          const grupos = [];
          for (const n of hijo.children) {
            if (n.tagName === "strong") grupos.push({ rotulo: n, valor: [] });
            else if (grupos.length) grupos[grupos.length - 1].valor.push(n);
          }
          hijo.tagName = "div";
          hijo.properties = { className: ["pastillas"] };
          hijo.children = grupos.map((g) => pastilla(g.rotulo, g.valor));
        } else {
          visitar(hijo);
        }
      }
    };
    visitar(arbol);
  };
}

export default defineConfig({
  site: "https://factura-facil.github.io",
  base,
  trailingSlash: "always",
  markdown: {
    // Los bloques de código van sobre el azul marino de titular, así que el tema del
    // resaltador es oscuro. El fondo y el color base los fija fer.css; del tema salen
    // los colores de token.
    shikiConfig: { theme: "github-dark", wrap: true },
    rehypePlugins: [rehypeDecisiones, rehypePastillas],
  },
  build: { format: "directory" },
});
