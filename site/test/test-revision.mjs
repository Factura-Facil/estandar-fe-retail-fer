// Ejecuta los casos de test/casos-revision.json contra la capa de revisión del sitio.
// Uso: npm test --prefix site   (o: node site/test/test-revision.mjs, con el sync hecho)
//
// Esto no comprueba la conformidad de la convención —de eso se encarga
// referencia/javascript/test-conformidad.mjs, que ejercita la implementación de
// referencia sobre campos sueltos— sino la capa que el sitio construye encima:
// recorrer un XML completo y decidir qué se le dice a quien lo subió.
//
// Existe porque esa capa no tenía dónde escribirle un caso. Un documento cuya cabecera
// venía en perfil heredado no disparaba ningún hallazgo: el aviso de §4.1 solo miraba
// si el campo existía y el de §6 solo corría dentro de un bloque. El informe decía
// "sin errores ni avisos" sobre un documento en el que la Orden de Compra no llegaba a
// ninguna parte, y el defecto sobrevivió a dos revisiones a ojo. Lo encontró un
// adoptante con una factura real.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { DOMParser } from "@xmldom/xmldom";
import { revisarXml, receta } from "../src/lib/revisar-xml.js";

const aqui = dirname(fileURLToPath(import.meta.url));
const { casos } = JSON.parse(readFileSync(join(aqui, "casos-revision.json"), "utf8"));

/**
 * El navegador trae DOMParser; aquí se inyecta uno equivalente. `revisarXml` lo recibe
 * como parámetro justamente para poder correr sin levantar un navegador.
 *
 * `onError` se silencia porque los errores de parseo son un caso bajo prueba
 * (`xml-malformado`), no un fallo del runner: lanzar es la señal que `revisarXml`
 * espera para responder que el archivo no es XML bien formado.
 */
const parsear = (texto) =>
  new DOMParser({ onError: () => { throw new Error("XML malformado"); } })
    .parseFromString(texto, "text/xml");

const escapar = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Monta un rFE mínimo. Lleva namespace por defecto a propósito: la revisión busca los
 * campos por nombre local, y este es el único sitio donde eso queda comprobado.
 */
function montar(doc) {
  const cabecera = doc.rellenoCabecera
    ? (doc.cabecera ?? "").padEnd(doc.rellenoCabecera + 1, "x")
    : doc.cabecera;

  const items = doc.items.map((it, i) => {
    const campo = it.campo === null || it.campo === undefined
      ? ""
      : `\n    <dInfEmFE>${escapar(it.campo)}</dInfEmFE>`;
    return `  <gItem>
    <dSecItem>${i + 1}</dSecItem>
    <dCodProd>${escapar(it.cod)}</dCodProd>
    <dDescProd>Artículo de prueba ${i + 1}</dDescProd>${campo}
  </gItem>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rFE xmlns="http://dgi-fep.mef.gob.pa:80/wsdl/FeRecepFactura">
  <gDGen>
    <dNroDF>0000001</dNroDF>
    <dPtoFacDF>001</dPtoFacDF>
    <dFechaEm>2026-09-29T10:00:00-05:00</dFechaEm>
    <gEmis>
      <dRuc>0-000-000000</dRuc>
      <dNombEm>PROVEEDOR DE PRUEBA, S.A.</dNombEm>
    </gEmis>
    <gRecep>
      <dNombRec>TIENDA RETAIL X</dNombRec>
    </gRecep>${
      cabecera === null || cabecera === undefined
        ? ""
        : `\n    <dInfEmFE>${escapar(cabecera)}</dInfEmFE>`
    }
  </gDGen>
${items.join("\n")}
</rFE>`;
}

/** Todos los hallazgos del informe, vengan del nivel global, del documento o de un ítem. */
function hallazgos(r) {
  return [
    ...r.globales,
    ...(r.documento?.avisos ?? []),
    ...r.items.flatMap((i) => i.avisos),
  ].map((a) => `${a.grado} ${a.ref}`);
}

/** Compara como multiconjunto: el orden lo decide la pantalla, no el dato. */
function mismos(a, b) {
  const orden = (xs) => [...xs].sort().join(" ; ");
  return orden(a) === orden(b);
}

/**
 * Un paso de la receta en una línea. Se compara como cadena y no como objeto para que
 * el caso se lea entero en el JSON y para que el orden de las claves no sea parte del
 * contrato. Lo que sí es contrato es el bloque literal: es lo que alguien va a copiar y
 * pegar en su emisión, y cambiarlo es cambiar lo que esta herramienta le promete.
 *
 * El orden de los pasos sí importa —los grupos de ítems salen del más numeroso al menos—
 * y por eso aquí se compara en orden.
 */
const linea = (p) =>
  `${p.clave} | ${p.bloque} | ×${p.cuantos} | candidato=${p.candidato ?? "—"}`;

let fallos = 0;
const problemas = [];

for (const c of casos) {
  const xml = c.xml ?? montar(c.documento);
  const r = revisarXml(xml, parsear);
  const e = c.espera;
  const falta = [];

  if (e.ok === false) {
    if (r.ok !== false) falta.push(`  esperaba que no se pudiera revisar; devolvió ok=true`);
  } else {
    if (!r.ok) {
      falta.push(`  la revisión falló: ${r.error}`);
    } else {
      const obtenidos = hallazgos(r);
      if (!mismos(obtenidos, e.hallazgos)) {
        falta.push(`  hallazgos esperado=[${[...e.hallazgos].sort().join(", ")}]`);
        falta.push(`            obtenido=[${[...obtenidos].sort().join(", ")}]`);
      }
      const datos = r.documento?.lectura?.datos ?? {};
      for (const clave of ["oc", "ref"]) {
        if (!(clave in e)) continue;
        const obtenido = datos[clave] ?? null;
        if (obtenido !== e[clave]) {
          falta.push(`  ${clave} esperado=${JSON.stringify(e[clave])} obtenido=${JSON.stringify(obtenido)}`);
        }
      }
      if (e.cobertura) {
        const obtenida = JSON.stringify(r.cobertura);
        const esperada = JSON.stringify(e.cobertura);
        if (obtenida !== esperada) {
          falta.push(`  cobertura esperada=${esperada} obtenida=${obtenida}`);
        }
      }
      if (e.receta) {
        const obtenida = receta(r).map(linea);
        if (obtenida.join("\n") !== e.receta.join("\n")) {
          falta.push(`  receta esperada=[${e.receta.join(" / ")}]`);
          falta.push(`         obtenida=[${obtenida.join(" / ")}]`);
        }
      }

      /**
       * Se comprueba en TODOS los casos, no solo en los que declaran `receta`.
       *
       * Es la regla que no puede romperse dentro de seis meses, cuando a alguien le
       * parezca una mejora obvia rellenar el hueco con el número que está ahí mismo. No
       * lo es: lo único que hace a ese número parecer una Orden de Compra es su forma, y
       * si se cuela dentro del bloque llega a producción con el aval de esta herramienta
       * y concilia contra el pedido de otro. El candidato se ofrece aparte y señalado; el
       * bloque siempre deja el hueco.
       */
      for (const p of receta(r)) {
        if (p.candidato && p.bloque.includes(p.candidato)) {
          falta.push(`  el candidato ${p.candidato} se coló dentro del bloque: ${p.bloque}`);
        }
        if (!/NÚMERO|CÓDIGO/.test(p.bloque)) {
          falta.push(`  el bloque sugerido no deja hueco para el valor: ${p.bloque}`);
        }
      }
    }
  }

  if (falta.length === 0) {
    console.log(`ok    ${c.id}`);
  } else {
    fallos++;
    console.log(`FALLA ${c.id}`);
    problemas.push([c, falta]);
  }
}

for (const [c, falta] of problemas) {
  console.log(`\n${c.id}`);
  console.log(`  ${c.porque}`);
  console.log(falta.join("\n"));
}

console.log(`\n${casos.length - fallos}/${casos.length} casos de revisión pasan`);
process.exit(fallos ? 1 : 0);
