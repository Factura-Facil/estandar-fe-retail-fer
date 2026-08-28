/**
 * Implementación de referencia de FER 1.1.1.
 *
 * Convención de etiquetado para Facturas Electrónicas de retail (Panamá).
 * Especificación: spec/v1.1.1.md
 *
 * Copyright 2026 Factura Fácil, S.A. — Apache-2.0
 * Sin dependencias. Funciona en Node y en el navegador (ESM).
 */

export const VERSION_SPEC = "1.1.1";
export const VERSION_ESQUEMA_SOPORTADA = 1;

export const CLAVES_DOCUMENTO = ["oc", "ref"];
export const CLAVES_ITEM = ["cbar"];

// §3.3 — expresión regular canónica. El cierre debe coincidir en dígito.
const BLOQUE = /#FER(\d)#([\s\S]*?)#FER\1#/;

// §7.1 — prefijo del perfil heredado. La insensibilidad a mayúsculas y tildes es una
// nota de implementación (§5.3.8), no un requisito de la convención.
const PREFIJO_HEREDADO = "orden de compra:";

const RESERVADO_CENTINELA = /#FER\d#/;

function sinTildes(texto) {
  return texto.normalize("NFD").replace(/\p{Mn}/gu, "");
}

/**
 * §5.1.3 — divide el contenido del bloque en pares clave=valor.
 */
function parsearPares(contenido) {
  const datos = Object.create(null);
  for (const fragmento of contenido.split("|")) {
    const corte = fragmento.indexOf("="); // divide en el primer "="
    if (corte === -1) continue;
    const clave = fragmento.slice(0, corte).trim().toLowerCase();
    const valor = fragmento.slice(corte + 1).trim();
    if (!clave || !valor) continue; // §5.3.2 — valor vacío es clave ausente
    if (clave in datos) continue; // §5.3.1 — prevalece la primera ocurrencia
    datos[clave] = valor;
  }
  return datos;
}

/**
 * §7.1 — lectura del perfil heredado.
 */
function leerHeredado(valor, nivel) {
  const datos = Object.create(null);
  const plano = valor.trim();

  if (nivel === "documento") {
    const pos = sinTildes(plano).toLowerCase().indexOf(PREFIJO_HEREDADO);
    if (pos !== -1) {
      const resto = plano.slice(pos + PREFIJO_HEREDADO.length).trim();
      const partes = resto.split(/\s+/);
      if (partes.length && partes[0]) {
        datos.oc = partes[0];
        const ref = partes.slice(1).join(" ").trim();
        if (ref) datos.ref = ref;
      }
    }
  } else if (nivel === "item") {
    // §7.1 — el valor crudo es el contenido completo del campo. La convención no
    // define un criterio para distinguir un código de una nota: el formato heredado
    // no lo permite. Quien necesite esa distinción la resuelve con su propio
    // catálogo, fuera del alcance de FER.
    if (plano) datos.cbar = plano;
  }

  return { perfil: "heredado", datos, textoLibre: plano, versionEsquema: null };
}

/**
 * Lee un campo dInfEmFE conforme a FER 1.1.1.
 *
 * `valor` debe ser el contenido del nodo XML ya des-escapado por el parser (§5.1.1),
 * no los bytes crudos del documento.
 *
 * `nivel` es "documento" (campo B29) o "item" (campo C19).
 *
 * Nunca lanza por contenido malformado: descarta el bloque y cae al perfil heredado
 * (§5.3.4). Esta implementación no trata un bloque ausente, sobrante o malformado
 * como error (§5.3.5).
 *
 * @returns {{perfil: "fer"|"heredado", datos: Object, textoLibre: string, versionEsquema: number|null}}
 */
export function leer(valor, nivel = "documento") {
  if (nivel !== "documento" && nivel !== "item") {
    throw new Error('nivel debe ser "documento" o "item"');
  }

  if (!valor) {
    return {
      perfil: "heredado",
      datos: Object.create(null),
      textoLibre: "",
      versionEsquema: null,
    };
  }

  const m = BLOQUE.exec(valor);
  if (m === null) return leerHeredado(valor, nivel);

  const datos = parsearPares(m[2]);
  // §5.3.4 — el bloque no produjo ningún par válido: se descarta.
  if (Object.keys(datos).length === 0) return leerHeredado(valor, nivel);

  const antes = valor.slice(0, m.index).trim();
  const despues = valor.slice(m.index + m[0].length).trim();

  return {
    perfil: "fer",
    datos,
    textoLibre: [antes, despues].filter(Boolean).join(" "),
    versionEsquema: Number(m[1]),
  };
}

/**
 * Construye el contenido de un campo dInfEmFE conforme a §4.
 *
 *   escribir({ oc: "4500000001", ref: "TIENDA RETAIL X" })
 *   // '#FER1# oc=4500000001 | ref=TIENDA RETAIL X #FER1#'
 *
 * @param {Object} claves pares clave/valor a emitir
 * @param {string} textoLibre mensaje del emisor, opcional
 */
export function escribir(claves = {}, textoLibre = "") {
  const centinela = `#FER${VERSION_ESQUEMA_SOPORTADA}#`;
  const pares = [];

  for (const [claveCruda, valorCrudo] of Object.entries(claves)) {
    const clave = String(claveCruda).trim().toLowerCase();
    const valor = valorCrudo == null ? "" : String(valorCrudo).trim();
    if (!valor) continue; // §5.3.2 — no se emiten claves con valor vacío
    if (valor.includes("|") || RESERVADO_CENTINELA.test(valor)) {
      throw new Error(
        `el valor de "${clave}" contiene un carácter reservado (§3.4)`
      );
    }
    pares.push(`${clave}=${valor}`);
  }

  if (pares.length === 0) return textoLibre.trim();

  const bloque = `${centinela} ${pares.join(" | ")} ${centinela}`;
  return `${textoLibre.trim()} ${bloque}`.trim();
}
