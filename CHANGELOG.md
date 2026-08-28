# Bitácora de cambios

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el versionado sigue [SemVer](https://semver.org/lang/es/).

## [1.1.1] — 2026-08-28

Revisión editorial y de navegación. **Ninguna regla cambia:** no se agregan ni se
retiran requisitos, el registro de claves es el mismo y los 20 casos normativos siguen
pasando sin modificación. Una implementación conforme a 1.1.0 lo sigue siendo.

### Agregado
- §4.5 Documento completo: un XML con la Orden de Compra en la cabecera y el Código de
  Barras en el ítem del mismo documento. Los ejemplos de §4.1 y §4.2 mostraban cada
  nivel por separado y nunca los dos juntos.
- §9.1 Correr los casos localmente: cómo consumir `conformidad/casos.json` contra una
  implementación propia, sin depender del validador en línea.
- La página de la especificación abre con un bloque de implementación mínima —emisión de
  cabecera, emisión de ítem y expresión regular de recepción— y una tabla de contenidos
  de las diez secciones con sus subtítulos, generada desde los encabezados del texto.
- Nota de contexto antes del ABNF de §3.2, que remite a la expresión regular de §3.3
  como suficiente para la mayoría de los casos.
- El validador explica qué hacer con el resultado: cuando el campo se lee con el perfil
  heredado dice que no es un error y enlaza a §7, y bajo cada lectura ofrece el paso
  siguiente —los casos de conformidad o las reglas de emisión— según lo que haya
  extraído.
- El validador enuncia los tres grados de su revisión de XML —error, aviso y nota— y qué
  significa cada uno.
- Cada decisión abre con una entradilla de una línea que dice qué problema resuelve. El
  índice la usa como descripción, para poder elegir cuál abrir sin abrirlas todas.
- Navegación entre decisiones contiguas al pie de cada una: se leen en cadena —0002
  remite a 0001, 0004 a 0002— y hasta ahora había que volver al índice para dar un paso.
- 0006 dice qué ejercita cada uno de los tres casos que promovió: `doc-08` clave en
  mayúsculas, `doc-09` clave duplicada, `doc-14` bloque de versión superior. Quien
  verificó contra 1.0.0 sabe qué reprobar sin abrir `casos.json`.

### Cambiado
- Terminología unificada en el texto y en el sitio: **Orden de Compra** y **Código de
  Barras**, en lugar de las variantes «número de orden de compra», «número de pedido» y
  «código de barra». Los literales del perfil heredado —el prefijo `Orden de compra: `
  de §7— no se tocan: son texto de coincidencia normativa.
- §6: la descripción de `oc` habla de conciliación automática entre pedido, recepción y
  factura, en lugar de «three-way match», y su nota de valor único se enuncia sin
  remitir a §4.3.4, que es una regla de emisión.
- §4.4 pasa de «Presupuesto del campo» a **«Límite del campo»**. La palabra presupuesto
  se leía como término financiero.
- §2: la definición de **Bloque** se enuncia por su forma —abre con `#FER1#`, contiene
  los pares, cierra con `#FER1#`— en vez de remitir a §3 antes de que el lector llegue.
- El aviso de procedencia enuncia el alcance normativo (§1 a §9, con §5.3 y §10 fuera)
  antes de explicar la excepción.
- La portada deja de usar tecnicismos que no le sirven al lector de negocio: `dInfEmFE`
  se presenta como el campo de notas de la factura, desaparecen «centinela»,
  `clave=valor`, `dCodProd`, SKU y «three-way match», y el CTA de la ruta de cadena pasa
  de «Algoritmo de recepción» a «Cómo empezar como cadena».
- La tabla de estado —versión, claves, conformidad, referencia, compatibilidad— se muda
  de la portada a la página de la especificación, que es a quien le habla.
- El bullet de implementaciones de referencia sale del bloque de beneficios para
  proveedores y queda solo en la ruta de PAC y desarrolladores, que es su público.
- El validador abre diciendo qué hacer —«Comprueba qué extrae un receptor FER», con la
  instrucción encima del campo— en vez de describir qué es. Sus rótulos anteponen el
  término de negocio al técnico: «Campo de notas de la factura (`dInfEmFE`)», «Cabecera
  del documento (B29)» y «Línea de producto / ítem (C19)».
- La garantía de privacidad del validador se repite junto al campo, que es donde se
  decide si pegar datos de una factura real.
- La ruta `referencia/javascript/fer.js` y la nota de discrepancia pasan a un detalle
  colapsable, bajo la afirmación corta de que el validador usa la implementación de
  referencia sin modificar.

- La terminología unificada alcanza a las decisiones: **Orden de Compra** y **Código de
  Barras** en el texto narrativo y en los títulos de 0002 y 0003. El literal heredado de
  0005 no se toca. «Three-way match» se conserva —son documentos técnicos— pero se
  glosa la primera vez que aparece en cada decisión.
- El estado de 0005 antepone lo que cambió: «parcialmente superseada por 0006 ·
  aceptada». Quien escanea el encabezado ve primero lo que le afecta.
- El aparte de superseción de 0005 se compone distinto de una cita corriente: lo que
  dice es que el párrafo anterior ya no describe el estándar vigente. El párrafo mismo
  cierra ahora con una marca editorial que avisa de la nota antes de que el lector la
  alcance: quien lee ese pasaje suelto —en una búsqueda, en un fragmento citado— sabía
  hasta ahora que estaba vigente.
- El cuarto fundamento de 0001 pasa de «Presencia en ambos niveles» a **«Disponibilidad
  en ambos niveles»**: lo que sostiene el argumento es que el campo esté disponible en
  documento y en ítem, no que aparezca en ambos.

- **Rediseño del sitio.** El look and feel se rehace sobre el handoff de diseño: nueva
  escala tipográfica —Poppins en los titulares, Plus Jakarta Sans en el texto, IBM Plex
  Mono en el código—, rótulos de sección con filete cian en lugar de numeración, tarjetas
  con sombra en vez de marcos, y un pie en navy con la marca separada del texto legal.
  **La lógica no cambia:** el validador reusa `referencia/javascript/fer.js` sin tocar y
  conserva los mismos ids y nombres de clase, de modo que el rediseño no puede alterar lo
  que el validador extrae. Dos desviaciones deliberadas del handoff: el rótulo de sección
  y el número de índice usan un cian más oscuro (`#1279b8`) que el de marca, que no
  alcanza contraste AA sobre blanco.
- `public/og.png` se regenera desde `scripts/og.html`, que toma los colores y las
  tipografías del sitio: la imagen de previsualización quedaba con la escala anterior.

### Corregido
- **Los enlaces entre decisiones daban 404 en el sitio.** Las decisiones se remiten unas
  a otras con rutas `.md` relativas, que es lo correcto al leerlas en GitHub, pero salían
  literales al HTML y en el sitio esa ruta no existe. Se reescriben al renderizar, de
  modo que las dos lecturas funcionan sin duplicar los documentos. Eran 20 enlaces.
- `referencia/README.md` anunciaba 17 casos normativos y 7 no normativos, el conteo de
  1.0.0. Desde 1.1.0 son **20 y 4**: quien fuera a contribuir una implementación en otro
  lenguaje leía ahí la cifra equivocada de qué debe pasar.

### Notas
- `spec/v1.1.0.md` pasa a `spec/v1.1.1.md`. El texto de 1.1.0 permanece disponible en el
  tag `v1.1.0`: el número de versión sube porque el texto publicado cambió, no porque
  cambie lo que hay que implementar.

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
