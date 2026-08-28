# Decisiones de diseño

Registro de las decisiones que dieron forma a la especificación, con el contexto que
las motivó y las alternativas descartadas.

Estos documentos son **históricos**: no se reescriben. Si una decisión cambia, se
agrega un documento nuevo que supersede al anterior y el anterior queda marcado como
tal. El objetivo es que un implementador pueda entender por qué la especificación es
como es sin tener que preguntar.

| # | Decisión | Estado |
|---|---|---|
| [0001](0001-sede-del-dato-dinfemfe.md) | `dInfEmFE` como sede de los datos de retail | Aceptada |
| [0002](0002-descartar-dnroped.md) | Descartar `dNroPed` para la Orden de Compra | Aceptada |
| [0003](0003-descartar-dgtincom-y-dcodprod.md) | Descartar `dGTINCom` y `dCodProd` para el Código de Barras | Aceptada |
| [0004](0004-descartar-dinfemped.md) | Descartar `dInfEmPedGl` y `dInfEmPedIt` | Aceptada |
| [0005](0005-bloque-delimitado-y-centinela.md) | Bloque delimitado con centinela versionado | Parcialmente superseada por 0006 · aceptada |
| [0006](0006-reglas-de-extraccion-normativas.md) | Reglas de extracción normativas y compromisos de estabilidad del registro | Aceptada |

Formato: contexto, decisión, consecuencias, alternativas consideradas. Las referencias
a campos usan la nomenclatura de la Ficha Técnica de la Factura Electrónica de Panamá.
