# Bitácora de cambios

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el versionado sigue [SemVer](https://semver.org/lang/es/).

## [1.1.0] — 2026-08-27

Resuelve las consultas que quedaron abiertas al publicar 1.0.0. **El criterio de
conformidad se endurece:** una implementación verificada contra 1.0.0 debe volver a
ejecutar la batería de casos.

### Agregado
- §4.4 Presupuesto del campo: explica el límite de 5.000 caracteres y el modo de falla
  del recorte, que se come el centinela de cierre y hace desaparecer el dato sin error
  visible.
- §4.3.4: una Factura Electrónica corresponde a una sola orden de compra. `oc` es de
  valor único y no admite listas.
- §4.3.5: recomendación de colocar el bloque al inicio del campo, para que un recorte
  consuma texto libre en lugar del dato.
- §6.1 Versionado del registro: los tres compromisos de estabilidad —las claves
  existentes no cambian de significado, una versión nueva solo agrega, el receptor lee
  hacia adelante— que permiten publicar `#FER2#` sin coordinar una fecha de corte.
- Aclaración en §1 de que la especificación define el contenido del campo y no
  prescribe qué componente de la cadena de emisión lo escribe.
- Aclaración en §1 de que la convención no se restringe a un tipo de documento: donde
  `dInfEmFE` esté disponible, §4 y §5 aplican sin cambio.
- Aclaración en §4.2 de que `dCodProd` lleva el código del emisor, no el número de
  artículo del receptor, y que la llave de identificación es `cbar`.
- §7.1 enuncia explícitamente los falsos positivos del perfil heredado a nivel de
  ítem, con ejemplos, como límite inherente del formato y argumento para migrar.
- Decisión [0006](decisiones/0006-reglas-de-extraccion-normativas.md).
- `conformidad/xml/ejemplo-completo.xml` para probar el validador.
- El registro de claves se publica en una URL estable.
- El validador acepta un archivo XML completo y revisa las recomendaciones de emisión
  de §4.3 y §4.4, que los casos de conformidad no pueden ejercitar.

### Cambiado
- Tres reglas pasan de nota de implementación (§5.3) a normativas (§5.2): normalización
  de claves a minúsculas al leer, clave duplicada resuelta por la primera ocurrencia, y
  procesamiento de un bloque de versión superior. Los casos `doc-08`, `doc-09` y
  `doc-14` pasan a normativos: **20 casos normativos** en lugar de 17.
- §5.2 declara explícitamente que sus reglas determinan qué dato extrae el receptor, y
  §5.3 que la disposición del documento no es materia de la convención.
- §5.3.1 reencuadra la clave duplicada como defecto de emisión y recomienda apartar el
  documento para revisión en lugar de procesarlo automáticamente.
- §8 deja la representación gráfica del bloque como decisión de quien genera el CAFE;
  la convención solo aporta la posibilidad técnica de separarlo sin heurísticas.
- El emisor **DEBE** escribir las claves en minúsculas (§4.3.3).
- La decisión 0005 queda parcialmente superseada por la 0006.

### Notas
- El texto de 1.0.0 permanece disponible en el tag `v1.0.0`.

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
