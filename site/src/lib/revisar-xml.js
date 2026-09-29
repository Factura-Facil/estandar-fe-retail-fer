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
const VERSION_REGISTRO = 1; // §6.1

const REGISTRO = {
  documento: ["oc", "ref"],
  item: ["cbar"],
};

/** Dónde vive cada clave del registro, para detectar las puestas en el nivel que no es. */
const NIVEL_DE = { oc: "documento", ref: "documento", cbar: "item" };

/**
 * Todos los descendientes cuyo nombre local coincida, ignorando el namespace y
 * **en orden de documento**, que es el orden en que el emisor escribió los ítems.
 *
 * Recorre `childNodes` filtrando por tipo en lugar de usar `children`, que no todos
 * los DOM de servidor implementan: así el mismo código corre en el navegador y bajo
 * el runner de pruebas.
 */
function porNombre(raiz, nombre) {
  const salida = [];
  (function descender(n) {
    for (const hijo of n.childNodes ?? []) {
      if (hijo.nodeType !== 1) continue;
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
 * Datos de identificación del documento. No son materia de la convención —son campos
 * de la Ficha Técnica— y por eso su ausencia no produce ningún hallazgo: se leen solo
 * para que quien valida reconozca su propia factura en pantalla y no dude de si el
 * informe corresponde al archivo que acaba de soltar.
 */
function identificacion(raiz) {
  const numero = primerTexto(raiz, "dNroDF");
  const punto = primerTexto(raiz, "dPtoFacDF");
  const [emis] = porNombre(raiz, "gEmis");
  return {
    numero: numero && punto ? `${punto}-${numero}` : numero,
    fecha: primerTexto(raiz, "dFechaEm"),
    emisor: primerTexto(raiz, "dNombEm"),
    // Dentro de gEmis: a nivel de documento hay más de un dRuc y el del receptor no
    // es el que identifica a quien emitió.
    ruc: emis ? primerTexto(emis, "dRuc") : null,
    receptor: primerTexto(raiz, "dNombRec"),
    itemsDeclarados: primerTexto(raiz, "dNroItems"),
  };
}

/**
 * Pares en crudo, sin aplicar la resolución de §5.2. Sirve para detectar lo que la
 * implementación de referencia resuelve en silencio: claves duplicadas y claves fuera
 * del registro.
 */
function paresCrudos(valor) {
  const texto = valor ?? "";
  const m = BLOQUE.exec(texto);
  if (!m) return null;
  const pares = [];
  /**
   * Los fragmentos sin `=` se guardan aparte en lugar de descartarse. Son el rastro
   * que deja un valor con `|` dentro: §3.4 lo prohíbe justamente porque el separador
   * parte el valor en dos y la segunda mitad deja de ser un par. Sin registrarlos,
   * medio dato desaparece sin que nada lo diga.
   */
  const sueltos = [];
  for (const frag of m[2].split("|")) {
    const corte = frag.indexOf("=");
    if (corte === -1) {
      if (frag.trim()) sueltos.push(frag.trim());
      continue;
    }
    pares.push({
      // La clave cruda se conserva para poder señalar §4.3.3, que pide minúsculas al
      // emisor aunque §5.2.4 obligue al receptor a normalizarlas de todos modos.
      clave: frag.slice(0, corte).trim().toLowerCase(),
      claveCruda: frag.slice(0, corte).trim(),
      valor: frag.slice(corte + 1).trim(),
    });
  }
  // §4.3.1: un bloque por campo. Lo que venga después del cierre se ignora (§5.2.1),
  // así que un segundo bloque es dato que el emisor cree haber enviado y no llega.
  const resto = texto.slice(m.index + m[0].length);
  return {
    bloque: m[0],
    version: Number(m[1]),
    inicio: m.index,
    pares,
    sueltos,
    repetido: CENTINELA.test(resto),
  };
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
    if (crudo.repetido) {
      avisos.push({
        grado: "error",
        texto:
          "Hay más de un bloque en el campo. Un receptor conforme lee el primero y trata " +
          "el resto como texto libre, así que lo que venga en el segundo no llega.",
        ref: "§4.3.1",
      });
    }
    for (const suelto of crudo.sueltos) {
      avisos.push({
        grado: "error",
        texto:
          `El fragmento "${suelto}" no tiene "=" y se descarta. Suele ocurrir cuando un ` +
          "valor contiene el separador |, que parte el valor en dos y convierte la " +
          "segunda mitad en un fragmento suelto.",
        ref: "§3.4",
      });
    }
    if (crudo.version > VERSION_REGISTRO) {
      avisos.push({
        grado: "nota",
        texto:
          `El bloque declara la versión ${crudo.version} del registro y esta revisión implementa la ` +
          `${VERSION_REGISTRO}. Se procesa igual y se extraen las claves conocidas: el receptor lee hacia adelante.`,
        ref: "§5.2.6",
      });
    }
    const vistas = new Set();
    for (const { clave, claveCruda } of crudo.pares) {
      if (vistas.has(clave)) {
        avisos.push({
          grado: "error",
          texto: `La clave "${clave}" aparece más de una vez. Se toma la primera ocurrencia, pero indica un defecto en la emisión.`,
          ref: "§5.2.5",
        });
      }
      vistas.add(clave);
      if (claveCruda !== clave) {
        avisos.push({
          grado: "aviso",
          texto: `La clave "${claveCruda}" no está en minúsculas. Se lee igual, porque el receptor las normaliza, pero la emisión debe escribirlas en minúsculas.`,
          ref: "§4.3.3",
        });
      }
      if (!conocidas.includes(clave)) {
        // Una clave del registro en el nivel que no le toca no es una clave
        // desconocida cualquiera: el emisor quiso enviar ese dato y el receptor no
        // lo va a leer ahí. Merece decirse con su nombre.
        avisos.push(
          NIVEL_DE[clave]
            ? {
                grado: "aviso",
                texto: `La clave "${clave}" es del nivel de ${NIVEL_DE[clave]} y está en el nivel de ${nivel}. Un receptor conforme la ignora aquí, así que el dato no llega.`,
                ref: "§6",
              }
            : {
                grado: "nota",
                texto: `La clave "${clave}" no está en el registro para este nivel. Un receptor conforme la ignora.`,
                ref: "§5.2.2",
              }
        );
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

  /**
   * La Orden de Compra no viaja, y da igual por qué. Antes esto solo avisaba cuando
   * había un bloque FER sin `oc`; un documento cuyo campo de cabecera está en perfil
   * heredado no disparaba nada, porque tampoco disparaba el aviso de §4.1 —ese solo
   * mira si el campo existe—. El resultado era un informe que decía «sin errores ni
   * avisos» sobre un documento en el que la Orden de Compra no llega a ninguna parte.
   *
   * El caso importa porque es el más común en la práctica: el emisor sí escribe el
   * número de la Orden de Compra en el campo, pero como prosa para que la lea una
   * persona. Para un receptor eso equivale a no haberlo escrito.
   */
  if (nivel === "documento" && !lectura.datos.oc) {
    avisos.push({
      grado: "aviso",
      texto:
        lectura.perfil === "fer"
          ? "Hay un bloque a nivel de documento pero no trae la clave oc, así que no viaja la Orden de Compra."
          : "El campo de cabecera no trae bloque FER, así que no viaja la Orden de Compra. " +
            "Si el número está escrito en el texto libre, un receptor no puede extraerlo.",
      ref: lectura.perfil === "fer" ? "§6" : "§4.1",
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

  // `crudo` sale junto al resto para que `receta()` pueda reconstruir el bloque con una
  // clave más sin volver a parsear el campo. Es null cuando no hay bloque.
  return { nivel, campo: valor, lectura, crudo, avisos };
}

/**
 * Revisa un XML completo.
 *
 * @param {string} texto contenido del archivo
 * @param {(texto: string) => Document} [parsear] parser alternativo. El navegador trae
 *   DOMParser; el runner de pruebas inyecta el suyo para poder ejercitar estas reglas
 *   sin levantar un navegador. Un hueco como el de §4.1 sobrevivió a dos revisiones
 *   por no tener dónde escribirle un caso.
 */
export function revisarXml(texto, parsear) {
  let dom;
  try {
    dom = parsear ? parsear(texto) : new DOMParser().parseFromString(texto, "application/xml");
  } catch {
    return { ok: false, error: "El archivo no es XML bien formado." };
  }
  const malformado = dom.getElementsByTagName("parsererror");
  if (malformado.length > 0 || !dom.documentElement) {
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
  const revisionPorItem = new Map();

  for (const nodo of campos) {
    const gItem = ancestroItem(nodo);
    const valor = nodo.textContent ?? "";
    if (gItem) {
      revisionPorItem.set(gItem, revisarCampo(valor, "item"));
    } else {
      documento.push(revisarCampo(valor, "documento"));
    }
  }

  /**
   * La lista se arma desde los gItem y no desde los campos encontrados, para que los
   * ítems que **no** traen dInfEmFE aparezcan por su nombre en el informe. Antes solo
   * se contaban, y un «3 de 10» no dice cuáles de los siete faltantes revisar.
   */
  const nodosItem = porNombre(raiz, "gItem");
  const items = nodosItem.map((nodo) => {
    const revision = revisionPorItem.get(nodo) ?? null;
    const codProd = primerTexto(nodo, "dCodProd");
    const avisos = [...(revision?.avisos ?? [])];

    /**
     * §4.2 dice que el emisor NO DEBE reemplazar `dCodProd` por el Código de Barras:
     * `dCodProd` lleva el código del emisor —su SKU— y `cbar` la llave por la que el
     * receptor identifica el artículo. Cuando coinciden, el receptor se queda sin la
     * referencia del proveedor, que es la que necesita para devolverle una incidencia
     * sobre esa línea. Solo se comprueba en el perfil FER: en heredado `cbar` es el
     * campo entero y la coincidencia no significaría lo mismo.
     */
    const cbar = revision?.lectura.perfil === "fer" ? revision.lectura.datos.cbar : null;
    if (cbar && codProd && cbar === codProd) {
      avisos.push({
        grado: "error",
        texto:
          `dCodProd y cbar traen el mismo valor (${cbar}). dCodProd debe conservar el ` +
          "código del emisor: si se reemplaza por el Código de Barras, el receptor pierde " +
          "la referencia con la que identificar la línea ante el proveedor.",
        ref: "§4.2",
      });
    }

    return {
      secItem: primerTexto(nodo, "dSecItem"),
      codProd,
      descProd: primerTexto(nodo, "dDescProd"),
      conCampo: revision !== null,
      campo: revision?.campo ?? null,
      lectura: revision?.lectura ?? null,
      crudo: revision?.crudo ?? null,
      avisos,
    };
  });

  const totalItems = items.length;
  const conCampo = items.filter((i) => i.conCampo);
  const itemsSinCampo = totalItems - conCampo.length;

  /**
   * Cobertura de Código de Barras. Se separa por perfil a propósito: en el perfil
   * heredado `cbar` es el contenido completo del campo, porque §7.1 no permite
   * distinguir un código de una nota. Contarlos juntos prometería una cobertura que
   * el formato heredado no puede sostener.
   */
  const cobertura = {
    total: totalItems,
    fer: items.filter((i) => i.lectura?.perfil === "fer" && i.lectura.datos.cbar).length,
    heredado: items.filter((i) => i.lectura?.perfil === "heredado" && i.lectura.datos.cbar)
      .length,
    sinCampo: itemsSinCampo,
  };

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
      texto:
        itemsSinCampo === 1
          ? `1 de ${totalItems} ítems no trae dInfEmFE, así que no trae Código de Barras.`
          : `${itemsSinCampo} de ${totalItems} ítems no traen dInfEmFE, así que no traen Código de Barras.`,
      ref: "§4.2",
    });
  }
  // `items` incluye ahora los que no traen campo, y esos no tienen lectura.
  const heredados = [...documento, ...conCampo].filter((r) => r.lectura.perfil === "heredado");
  if (heredados.length > 0) {
    globales.push({
      grado: "nota",
      texto:
        (heredados.length === 1
          ? "1 campo se lee con el perfil heredado"
          : `${heredados.length} campos se leen con el perfil heredado`) +
        ". Funciona, pero es transitorio: en el nivel de ítem no permite distinguir un código de una nota.",
      ref: "§7",
    });
  }

  const avisos = [...globales, ...documento.flatMap((d) => d.avisos), ...items.flatMap((i) => i.avisos)];

  return {
    ok: true,
    identificacion: identificacion(raiz),
    documento: documento[0] ?? null,
    items,
    totalItems,
    cobertura,
    globales,
    resumen: {
      errores: avisos.filter((a) => a.grado === "error").length,
      avisos: avisos.filter((a) => a.grado === "aviso").length,
      notas: avisos.filter((a) => a.grado === "nota").length,
    },
  };
}

/* ── Cómo se corrige ────────────────────────────────────────────────────── */

/** Los huecos que rellena quien emite. En versales y con tilde para que rompan a la vista. */
const HUECO = { oc: "NÚMERO", cbar: "CÓDIGO" };

/**
 * Un número suelto de seis dígitos o más. Se ofrece como pista y nunca como valor:
 * lo único que lo hace parecer una Orden de Compra es su forma, y la forma no es
 * evidencia. Ver la nota de `receta()`.
 */
const CANDIDATO = /\b\d{6,}\b/;

/** Dos campos comparten patrón si solo se diferencian en los números que llevan. */
const patron = (s) => (s ?? "").replace(/\d+/g, "#").trim();

/**
 * El bloque que debería haber, con una clave más.
 *
 * Se reconstruye desde los pares que un receptor lee de verdad y no desde la cadena
 * original: así la sugerencia no arrastra la clave duplicada ni el fragmento sin `=`
 * que el emisor cree estar enviando. Las claves fuera del registro sí se conservan
 * —son dato suyo y esto no es quién para borrárselo— y la versión del bloque también,
 * para no devolver a `#FER1#` a quien ya emite `#FER2#`.
 */
function bloqueCon(crudo, clave) {
  const v = crudo?.version ?? 1;
  const vistas = new Set();
  const pares = [`${clave}=${HUECO[clave]}`];
  for (const p of crudo?.pares ?? []) {
    if (p.clave === clave || vistas.has(p.clave) || !p.valor) continue;
    vistas.add(p.clave);
    pares.push(`${p.clave}=${p.valor}`);
  }
  return `#FER${v}# ${pares.join(" | ")} #FER${v}#`;
}

/**
 * Dónde buscar un candidato: fuera del bloque. Un número que ya está asignado a otra
 * clave no es un candidato a Orden de Compra, es el valor de esa otra clave.
 */
function pista(revision) {
  const zona = revision?.crudo ? (revision.lectura.textoLibre ?? "") : (revision?.campo ?? "");
  return CANDIDATO.exec(zona)?.[0] ?? null;
}

/**
 * Qué hay que escribir para que el documento sirva.
 *
 * Devuelve la **forma** del campo, no el campo corregido: los huecos van en versales
 * —`oc=NÚMERO`, `cbar=CÓDIGO`— y ahí se quedan. La tentación de rellenarlos es real,
 * porque casi siempre hay en el texto libre un número que encaja, pero nada en el
 * documento dice que ese número sea la Orden de Compra: que lo parezca es una
 * inferencia de quien lee, y una Orden de Compra inventada se concilia contra el
 * pedido equivocado — un daño peor que el de no sugerir nada, porque llega con el
 * aval de la herramienta.
 *
 * Con `cbar` no es siquiera prudencia. §7.1 dice que el perfil heredado no permite
 * distinguir un código de una nota; sacarlo del texto con una expresión regular sería
 * hacer exactamente lo que la convención que esta página publica declara imposible.
 *
 * Los candidatos se devuelven aparte, en `candidato`, para que la interfaz los muestre
 * como lo que son —un número que está ahí, sin confirmar— y nunca dentro de `bloque`,
 * que es lo que alguien va a copiar y pegar.
 *
 * @returns {Array<{clave: string, ref: string, titulo: string, ahora: string|null,
 *   bloque: string, donde: string, candidato: string|null, cuantos: number,
 *   ejemplos: string[], nota: string|null}>}
 */
export function receta(r) {
  if (!r.ok) return [];
  const pasos = [];

  const doc = r.documento;
  const datos = doc?.lectura?.datos ?? {};

  if (!datos.oc) {
    const notas = [];
    if (!datos.ref) {
      // Sin empezar por la barra: al final de una línea queda huérfana y se lee como
      // parte de la prosa en vez de como el separador del bloque.
      notas.push(
        "Si la cadena te identifica además con una referencia propia del pedido, añádela " +
          "dentro del mismo bloque, separada por una barra: ref=TU-REFERENCIA."
      );
    }
    if (doc?.crudo?.sueltos.length) {
      notas.push(
        'El bloque de arriba se rehízo con los pares que un receptor lee de verdad: los ' +
          'fragmentos sin "=" no aparecen porque se descartan.'
      );
    }
    pasos.push({
      clave: "oc",
      ref: doc?.crudo ? "§6" : "§4.1",
      titulo: "Cabecera — no viaja la Orden de Compra",
      ahora: doc?.campo ?? null,
      bloque: bloqueCon(doc?.crudo, "oc"),
      donde: !doc
        ? "en un campo dInfEmFE nuevo dentro de gDGen"
        : doc.crudo
          ? "en lugar del bloque que ya está"
          : "al inicio del campo, antes del texto que ya lleva",
      candidato: pista(doc),
      cuantos: 1,
      ejemplos: [],
      nota: notas.join(" ") || null,
    });
  }

  /**
   * Un ítem cuenta como pendiente salvo que traiga `cbar` en bloque. El perfil heredado
   * no basta por la misma razón que no cuenta en el veredicto: ahí `cbar` es el campo
   * entero, así que un ítem que dice «Código de barra 7460577050229» se lee como si el
   * código fuera esa frase completa.
   */
  const pendientes = r.items.filter(
    (i) => !(i.lectura?.perfil === "fer" && i.lectura.datos.cbar)
  );

  /**
   * Agrupados por forma y no uno por uno. Un catálogo emitido por el mismo sistema
   * repite el mismo defecto en todas sus líneas, y treinta diferencias idénticas
   * esconden la única que hay que leer.
   */
  const grupos = new Map();
  for (const i of pendientes) {
    const estado = !i.conCampo ? "sin-campo" : i.crudo ? "sin-clave" : "heredado";
    const llave = `${estado}\u0000${patron(i.campo)}`;
    if (!grupos.has(llave)) grupos.set(llave, { estado, items: [] });
    grupos.get(llave).items.push(i);
  }

  const TITULO = {
    "sin-campo": "Ítems — no traen el campo dInfEmFE",
    heredado: "Ítems — el Código de Barras no se puede extraer",
    "sin-clave": "Ítems — el bloque no trae la clave cbar",
  };
  const DONDE = {
    "sin-campo": "en un campo dInfEmFE nuevo dentro de cada gItem",
    heredado: "al inicio del campo, antes del texto que ya lleva",
    "sin-clave": "en lugar del bloque que ya está",
  };

  for (const { estado, items } of [...grupos.values()].sort(
    (a, b) => b.items.length - a.items.length
  )) {
    const [primero] = items;
    const candidato = estado === "sin-campo" ? null : pista(primero);
    /**
     * Decir también lo que ya está bien. `dCodProd` lleva el código del emisor y es la
     * referencia con la que el receptor le devuelve una incidencia sobre esa línea;
     * quien acaba de leer «falta el Código de Barras» tiene justo ahí la tentación de
     * ponerlo en su lugar, que es lo que §4.2 prohíbe.
     */
    const nota =
      primero.codProd && primero.codProd !== candidato
        ? `dCodProd ya lleva tu código de artículo (${primero.codProd}) y se queda como está: ` +
          "el Código de Barras va en cbar, no en su lugar (§4.2)."
        : null;

    pasos.push({
      clave: "cbar",
      ref: estado === "sin-clave" ? "§6" : "§4.2",
      titulo: TITULO[estado],
      ahora: primero.campo,
      bloque: bloqueCon(primero.crudo, "cbar"),
      donde: DONDE[estado],
      candidato,
      cuantos: items.length,
      ejemplos: items.map((i) => i.secItem).filter(Boolean),
      nota,
    });
  }

  return pasos;
}
