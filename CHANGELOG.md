# Bitácora de cambios

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el versionado sigue [SemVer](https://semver.org/lang/es/).

## [1.0.0] — 2026-08-27

Primera versión de la especificación.

El texto normativo reproduce la propuesta de estándar de industria de Factura Fácil,
S.A. y no agrega requisitos por su cuenta. Lo que la propuesta no resuelve se publica
como no normativo en §5.3.

### Agregado
- Gramática del bloque delimitado por el centinela `#FER1#` (§3), con ABNF y
  expresión regular canónica.
- Reglas de emisión a nivel de documento (B29) y de ítem (C19) (§4).
- Algoritmo de recepción y reglas de resolución normativas: un solo bloque, clave
  desconocida y preservación del texto libre (§5.1, §5.2).
- Notas de implementación **no normativas** (§5.3) para los casos sobre los que la
  propuesta no se pronuncia: clave duplicada, valor vacío, versión superior, bloque
  malformado, tolerancia a fallos, normalización de claves, tamaño del bloque y
  sensibilidad del prefijo heredado.
- Registro de claves normativas `oc`, `ref` y `cbar` (§6).
- Perfil heredado y regla de convivencia durante la migración (§7). En el nivel de
  ítem, el valor crudo es el contenido completo del campo: la convención no define un
  criterio para distinguir un código de una nota, porque el formato heredado no lo
  permite.
- Criterio de conformidad basado en `conformidad/casos.json` (§9): 17 casos
  normativos, más 7 casos marcados `"normativo": false` que ejercitan §5.3 y no
  afectan la conformidad.
- Registro de decisiones de diseño en `decisiones/` (0001 a 0005), con las
  alternativas descartadas.
- Implementaciones de referencia en Python y JavaScript, sin dependencias.
- Extractos XML ilustrativos en `conformidad/xml/`.
