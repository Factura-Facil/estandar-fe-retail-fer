// Ejecuta los casos de conformidad/casos.json contra la implementación de referencia.
// Uso: node referencia/javascript/test-conformidad.mjs
//
// Los casos con "normativo": false ejercitan las notas de implementación de §5.3,
// sobre las que la propuesta de estándar no se pronuncia. Se ejecutan y se reportan
// aparte, pero no cuentan para el criterio de conformidad: una implementación puede
// resolverlos de otro modo y seguir siendo conforme.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import * as fer from "./fer.js";

const aqui = dirname(fileURLToPath(import.meta.url));
const ruta = join(aqui, "..", "..", "conformidad", "casos.json");
const { casos } = JSON.parse(readFileSync(ruta, "utf8"));

const NORMATIVAS = [...fer.CLAVES_DOCUMENTO, ...fer.CLAVES_ITEM];
let fallosNorm = 0;
let fallosNotas = 0;
let totalNorm = 0;
let totalNotas = 0;

for (const c of casos) {
  const normativo = c.normativo !== false;
  const r = fer.leer(c.entrada, c.nivel === "documento" ? "documento" : "item");
  const esperadas = Object.keys(c.esperado);
  const filtro = esperadas.length ? esperadas : NORMATIVAS;
  const obtenido = {};
  for (const k of filtro) if (k in r.datos) obtenido[k] = r.datos[k];

  const ok =
    r.perfil === c.perfil &&
    JSON.stringify(obtenido) === JSON.stringify(c.esperado);

  if (normativo) totalNorm++;
  else totalNotas++;

  if (ok) {
    console.log(`${normativo ? "ok   " : "ok(i)"} ${c.id}`);
  } else {
    if (normativo) fallosNorm++;
    else fallosNotas++;
    console.log(`${normativo ? "FALLA" : "DIFIERE"} ${c.id}: ${c.descripcion}`);
    console.log(`  perfil  esperado=${c.perfil} obtenido=${r.perfil}`);
    console.log(`  datos   esperado=${JSON.stringify(c.esperado)} obtenido=${JSON.stringify(obtenido)}`);
  }
}

console.log(`\n${totalNorm - fallosNorm}/${totalNorm} casos normativos conformes`);
console.log(`${totalNotas - fallosNotas}/${totalNotas} notas de implementación (§5.3) coinciden — no afectan la conformidad`);
process.exit(fallosNorm ? 1 : 0);
