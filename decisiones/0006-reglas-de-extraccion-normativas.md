# 0006 — Reglas de extracción normativas y compromisos de estabilidad del registro

**Estado:** aceptada
**Fecha:** 2026-08
**Aplica a:** FER 1.1.0
**Supersede:** el pasaje de [0005](0005-bloque-delimitado-y-centinela.md) sobre
estabilidad de las claves y sobre el tratamiento de un bloque de versión superior

## Contexto

La versión 1.0.0 agrupó en un solo apartado no normativo (§5.3) ocho resoluciones que,
al revisarse, resultaron ser de dos clases distintas:

- **Cómo se extrae el dato del XML.** Qué valor se toma cuando una clave viene
  duplicada, qué se hace con un campo que llega en mayúsculas, qué se extrae de un
  bloque cuya versión el receptor no implementa.
- **Qué hace el receptor con el documento.** Si lo procesa, si lo aparta para revisión,
  si lo rechaza.

La segunda clase correctamente no le compete a la convención: es territorio del ERP del
receptor y de la normativa aplicable. Pero la primera sí, y por una razón que 0005 ya
enunciaba sin extraer la consecuencia: la convención existe para que **dos receptores
conformes lean lo mismo del mismo documento**. Si la regla de clave duplicada es
opcional, una cadena puede conciliar contra el primer valor y otra contra el segundo,
las dos siendo conformes, y un proveedor no puede responder qué va a leer su cliente.

El caso de la versión superior era además una contradicción interna. 0005 declaraba que
la migración incremental sin fecha de corte era la propiedad que hace adoptable el
estándar, y al mismo tiempo dejaba como opcional la única regla que la sostiene.

## Decisión

**1. Las reglas de extracción son normativas.** Pasan a §5.2 como DEBE:

- normalización de claves a minúsculas al leer;
- clave duplicada: prevalece la primera ocurrencia;
- versión superior: se procesa el bloque y se extrae lo que se reconoce.

**2. Las reglas de disposición siguen fuera de la convención.** §5.3 conserva la
tolerancia a fallos, el bloque malformado, el valor vacío y el prefijo heredado. Sobre
un documento con clave duplicada, la recomendación es apartarlo para revisión en lugar
de procesarlo automáticamente, y la decisión final es del receptor.

**3. El registro asume tres compromisos de estabilidad**, enunciados en §6.1: las
claves existentes no cambian de significado, una versión nueva solo agrega, y el
receptor lee hacia adelante.

El punto 3 supersede directamente lo que 0005 dejaba constando: que la convención no
prometía estabilidad de las claves de la versión 1. Ahora la promete, explícitamente.

## Fundamento

La distinción operativa es sencilla y sirve como criterio para clasificar cualquier
regla futura: **si la regla determina qué valor termina en el ERP, es normativa; si
determina qué se hace con ese valor, no lo es.**

Sobre el punto 3, la garantía de estabilidad no es un añadido sino la precondición de
la lectura hacia adelante. Un receptor solo puede procesar un bloque `#FER2#` con
seguridad si sabe que `oc` sigue significando lo mismo en la versión 2. Sin ese
compromiso, la regla de versión superior sería imprudente en lugar de útil: extraería
claves cuyo significado podría haber cambiado.

Las tres piezas —regla normativa, compromiso de estabilidad y solo-agregar— funcionan
únicamente juntas. Es la razón por la que se resuelven en una sola decisión y no en
tres.

## Consecuencias

**El criterio de conformidad se endurece.** Los casos `doc-08`, `doc-09` y `doc-14`
pasan de nota a normativos: 20 casos normativos en lugar de 17. Una implementación
verificada contra 1.0.0 debe volver a ejecutar la batería.

**Publicar una versión mayor del registro deja de requerir coordinación.** Un emisor
puede emitir `#FER2#` sin avisar y ningún receptor previo pierde datos que antes leía.
Esa era la propiedad prometida en 0005 y hasta ahora no estaba respaldada por ninguna
cláusula.

**El estándar pierde una salida.** Con las claves de la versión 1 congeladas en
significado, un error de diseño en `oc`, `ref` o `cbar` ya no se puede corregir en una
versión menor: exige una versión mayor de la especificación con nota de migración. Es
un costo aceptado a cambio de la estabilidad, y la razón por la que el registro se
mantiene deliberadamente pequeño.

## Alternativas consideradas

| Alternativa | Por qué se descartó |
|---|---|
| Dejar todo §5.3 como no normativo | Permite que dos receptores conformes extraigan datos distintos del mismo documento, que es el problema que la convención viene a resolver |
| Promover todo §5.3 a normativo | Arrastraría las reglas de disposición, y qué hace un receptor con una factura no le compete a esta convención |
| Prometer estabilidad sin hacer normativa la lectura hacia adelante | La promesa no tendría efecto: un receptor podría ignorar legítimamente un bloque de versión superior y el dato desaparecería igual |
| Hacer normativa la lectura hacia adelante sin prometer estabilidad | Obligaría al receptor a extraer claves cuyo significado podría cambiar entre versiones |
