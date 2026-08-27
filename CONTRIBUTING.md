# Cómo contribuir

Todo cambio a la especificación pasa por un issue y un PR públicos. No hay canal
privado: si una duda de implementación se responde por correo, el siguiente
implementador tiene que volver a preguntarla.

## Reportar una ambigüedad

Si dos implementaciones pueden leer la misma cláusula de forma distinta, es un
defecto de la especificación. Abre un issue con el fragmento del campo `dInfEmFE`,
la cláusula involucrada y las dos lecturas posibles. Toda ambigüedad confirmada se
cierra agregando un caso a `conformidad/casos.json`.

## Proponer una clave nueva

Usa la plantilla de issue *Nueva clave*. Una propuesta se evalúa por:

1. **Necesidad.** El dato no puede transportarse en un campo dedicado de la Ficha
   Técnica sin las restricciones documentadas en `decisiones/`.
2. **Generalidad.** Sirve a más de una cadena. Las claves específicas de una sola
   empresa no entran al registro.
3. **Nivel.** Documento o ítem, sin ambigüedad.
4. **Nombre.** Minúsculas ASCII, corto, sin abreviaturas que dependan del idioma.

Las claves nuevas se agregan en una versión **menor**. No rompen a los lectores
previos, que las ignoran conforme a §5.2.2.

## Cambios que rompen compatibilidad

Un cambio de gramática o de semántica de una clave existente exige versión **mayor** y
nuevo centinela. Se documenta con una nota de migración en el CHANGELOG. Estos
cambios se evitan salvo defecto grave.

## Listarse como adoptante

`adoptantes/registro.json` es la lista pública de quién emite el bloque y quién lo
lee. Para entrar, abre un PR que agregue una entrada con el nombre de la empresa, su
sitio, la versión desde la que la implementa y una nota por cada rol —`receptor`,
`emisor`, o los dos— describiendo qué hace con el bloque. La portada del sitio se
construye desde ese archivo, así que no hay nada más que editar.

Estar en la lista es una declaración de quien se lista, no una certificación: la
convención no tiene autoridad que certifique a nadie, y el PR no se revisa contra
ninguna auditoría. Lo verificable es otra cosa: los casos de `conformidad/casos.json`
corridos contra la implementación. Un PR se rechaza solo si la entrada no identifica a
una empresa real o si la nota describe algo que la especificación no contempla.

Para salir de la lista basta un PR que quite la entrada, sin justificación.

## Registrar una decisión de diseño

Las alternativas descartadas se documentan en `decisiones/` con formato ADR y no se
reescriben: si una decisión cambia, se agrega un documento nuevo que supersede al
anterior. El valor del registro está en que un implementador pueda entender por qué la
especificación es como es sin tener que preguntar.

## Implementaciones

Un PR que agregue una implementación de referencia en otro lenguaje debe pasar
`conformidad/casos.json` completo, sin excepciones marcadas.

## Licencia de las contribuciones

Al abrir un PR aceptas publicar tu aporte bajo CC BY 4.0 (texto) o Apache-2.0
(código), según corresponda.
