/**
 * Revisión de un XML completo contra FER 1.1.1.
 *
 * Recorre el documento buscando los campos portadores `dInfEmFE` por nombre local, de
 * modo que funciona con o sin declaración de namespace y sin depender de la posición
 * exacta de los nodos. Sobre cada campo corre la implementación de referencia sin
 * modificarla, y además revisa las recomendaciones de §4.3 y §4.4, que los casos de
 * conformidad no pueden ejercitar porque no dependen de la lectura sino de la emisión.
 *
 * Todo corre en el navegador. El archivo no sale de la máquina.
 */
import { leer } from "../contenido/fer.js";

const CENTINELA = /#FER(\d)#/;
const BLOQUE = /#FER(\d)#([\s\S]*?)#FER\1#/;
const MAX_CAMPO = 5000; // Ficha Técnica
const MAX_BLOQUE = 512; // §4.4

const REGISTRO = {
  documento: ["oc", "ref"],
  item: ["cbar"],
};

/**
 * Todos los descendientes cuyo nombre local coincida, ignorando el namespace y
 * **en orden de documento**, que es el orden en que el emisor escribió los ítems.
 */
function porNombre(raiz, nombre) {
  const salida = [];
  (function descender(n) {
    for (const hijo of n.children ?? []) {
      if (hijo.localName === nombre) salida.push(hijo);
      descender(hijo);
    }
  })(raiz);
  return salida;
}

function primerTexto(raiz, nombre) {
  const [n] = porNombre(raiz, nombre);
  return n ? n.textContent.trim() : null;
}

function ancestroItem(nodo) {
  let n = nodo.parentElement;
  while (n) {
    if (n.localName === "gItem") return n;
    n = n.parentElement;
  }
  return null;
}

/**
 * Pares en crudo, sin aplicar la resolución de §5.2. Sirve para detectar lo que la
 * implementación de referencia resuelve en silencio: claves duplicadas y claves fuera
 * del registro.
 */
function paresCrudos(valor) {
  const m = BLOQUE.exec(valor ?? "");
  if (!m) return null;
  const pares = [];
  for (const frag of m[2].split("|")) {
    const corte = frag.indexOf("=");
    if (corte === -1) continue;
    pares.push({
      clave: frag.slice(0, corte).trim().toLowerCase(),
      valor: frag.slice(corte + 1).trim(),
    });
  }
  return { bloque: m[0], version: Number(m[1]), inicio: m.index, pares };
}

/**
 * @returns {{nivel: string, campo: string, lectura: object, avisos: Array}}
 */
function revisarCampo(valor, nivel) {
  const lectura = leer(valor, nivel);
  const crudo = paresCrudos(valor);
  const avisos = [];
  const conocidas = REGISTRO[nivel];

  if (valor.length > MAX_CAMPO) {
    avisos.push({
      grado: "error",
      texto: `El campo tiene ${valor.length} caracteres y el límite de la Ficha Técnica es ${MAX_CAMPO}.`,
      ref: "§4.4",
    });
  }

  if (crudo) {
    if (crudo.inicio !== 0) {
      avisos.push({
        grado: "aviso",
        texto:
          "El bloque no está al inicio del campo. Si algo recorta el campo al límite, " +
          "lo que se pierde es el centinela de cierre y el dato desaparece sin error.",
        ref: "§4.3.5",
      });
    }
    if (crudo.bloque.length > MAX_BLOQUE) {
      avisos.push({
        grado: "aviso",
        texto: `El bloque tiene ${crudo.bloque.length} caracteres; la recomendación es mantenerlo bajo ${MAX_BLOQUE}.`,
        ref: "§4.4",
      });
    }
    const vistas = new Set();
    for (const { clave } of crudo.pares) {
      if (vistas.has(clave)) {
        avisos.push({
          grado: "error",
          texto: `La clave "${clave}" aparece más de una vez. Se toma la primera ocurrencia, pero indica un defecto en la emisión.`,
          ref: "§5.2.5",
        });
      }
      vistas.add(clave);
      if (!conocidas.includes(clave)) {
        avisos.push({
          grado: "nota",
          texto: `La clave "${clave}" no está en el registro para este nivel. Un receptor conforme la ignora.`,
          ref: "§5.2.2",
        });
      }
    }
    for (const { clave, valor: v } of crudo.pares) {
      if (conocidas.includes(clave) && !v) {
        avisos.push({
          grado: "aviso",
          texto: `La clave "${clave}" viene vacía. Se lee como clave ausente; conviene omitirla.`,
          ref: "§5.3.2",
        });
      }
    }
    if (crudo.pares.length === 0) {
      avisos.push({
        grado: "error",
        texto: "Hay centinelas pero el bloque no produce ningún par válido. Se descarta y se aplica el perfil heredado.",
        ref: "§5.3.3",
      });
    }
  } else if (CENTINELA.test(valor)) {
    avisos.push({
      grado: "error",
      texto:
        "Hay un centinela de apertura sin cierre que coincida. El bloque se descarta " +
        "en silencio y se aplica el perfil heredado.",
      ref: "§5.3.3",
    });
  }

  if (nivel === "documento" && lectura.perfil === "fer" && !lectura.datos.oc) {
    avisos.push({
      grado: "aviso",
      texto: "Hay un bloque a nivel de documento pero no trae la clave oc.",
      ref: "§6",
    });
  }

  if (nivel === "documento" && (lectura.datos.oc ?? "").match(/[,;]|\s/)) {
    avisos.push({
      grado: "error",
      texto:
        "El valor de oc parece contener más de una Orden de Compra. Un documento " +
        "corresponde a una sola Orden de Compra y oc no admite listas.",
      ref: "§4.3.4",
    });
  }

  return { nivel, campo: valor, lectura, avisos };
}

/**
 * Revisa un XML completo.
 * @param {string} texto contenido del archivo
 */
export function revisarXml(texto) {
  const dom = new DOMParser().parseFromString(texto, "application/xml");
  const error = dom.querySelector("parsererror");
  if (error || !dom.documentElement) {
    return { ok: false, error: "El archivo no es XML bien formado." };
  }

  const raiz = dom.documentElement;
  const campos = porNombre(raiz, "dInfEmFE");

  if (campos.length === 0) {
    return {
      ok: false,
      error:
        "El documento no tiene ningún campo dInfEmFE. Sin ese campo no hay nada que " +
        "leer: el emisor no está aplicando la convención.",
    };
  }

  const documento = [];
  const items = [];

  for (const nodo of campos) {
    const gItem = ancestroItem(nodo);
    const valor = nodo.textContent ?? "";
    if (gItem) {
      const r = revisarCampo(valor, "item");
      items.push({
        ...r,
        secItem: primerTexto(gItem, "dSecItem"),
        codProd: primerTexto(gItem, "dCodProd"),
        descProd: primerTexto(gItem, "dDescProd"),
      });
    } else {
      documento.push(revisarCampo(valor, "documento"));
    }
  }

  const totalItems = porNombre(raiz, "gItem").length;
  const itemsSinCampo = totalItems - items.length;

  const globales = [];
  if (documento.length === 0) {
    globales.push({
      grado: "aviso",
      texto: "No hay campo dInfEmFE a nivel de documento, así que no viaja la Orden de Compra.",
      ref: "§4.1",
    });
  }
  if (documento.length > 1) {
    globales.push({
      grado: "error",
      texto: `Hay ${documento.length} campos dInfEmFE fuera de gItem. La Ficha Técnica admite una sola ocurrencia por nivel.`,
      ref: "§2",
    });
  }
  if (itemsSinCampo > 0) {
    globales.push({
      grado: "aviso",
      texto: `${itemsSinCampo} de ${totalItems} ítems no traen dInfEmFE, así que no traen Código de Barras.`,
      ref: "§4.2",
    });
  }
  const heredados = [...documento, ...items].filter((r) => r.lectura.perfil === "heredado");
  if (heredados.length > 0) {
    globales.push({
      grado: "nota",
      texto: `${heredados.length} campo(s) se leen con el perfil heredado. Funciona, pero es transitorio: en el nivel de ítem no permite distinguir un código de una nota.`,
      ref: "§7",
    });
  }

  const avisos = [...globales, ...documento.flatMap((d) => d.avisos), ...items.flatMap((i) => i.avisos)];

  return {
    ok: true,
    documento: documento[0] ?? null,
    items,
    totalItems,
    globales,
    resumen: {
      errores: avisos.filter((a) => a.grado === "error").length,
      avisos: avisos.filter((a) => a.grado === "aviso").length,
      notas: avisos.filter((a) => a.grado === "nota").length,
    },
  };
}
