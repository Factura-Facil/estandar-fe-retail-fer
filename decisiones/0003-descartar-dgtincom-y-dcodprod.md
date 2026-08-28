# 0003 — Descartar `dGTINCom` y `dCodProd` para el Código de Barras

*Por qué el campo dedicado al GTIN deja fuera a buena parte del catálogo panameño.*

**Estado:** aceptada
**Fecha:** 2026-02
**Aplica a:** FER 1.0.0

## Contexto

Para el Código de Barras del artículo existen dos campos que parecerían adecuados:
`dGTINCom`, pensado explícitamente para GTIN, y `dCodProd`, el código de producto.

El requisito real es distinto del que esos campos suponen: la cadena necesita **un
solo campo, con el mismo formato, presente en todos los ítems del catálogo**, sin
importar qué tipo de código lleve el artículo.

## Decisión

No se usan `dGTINCom` ni `dCodProd` para el Código de Barras. Se transporta en
`dInfEmFE` (C19) mediante la clave `cbar`. `dCodProd` conserva su uso original: el
SKU o número de material.

## Fundamento

| Campo dedicado | Tipo / tamaño | Restricción |
|---|---|---|
| `dGTINCom` (C301), en `gCodItem` | Numérico, longitud fija 8, 12, 13 o 14 | Solo admite GTIN perfecto. Un producto sin GTIN válido queda fuera o es rechazado por longitud. Abrir el grupo obliga a informar `dCantGTINCom` |
| `dCodProd` (C04) | Alfanumérico, 1–20 | Es el código interno del ítem, el número de material en SAP. Dato distinto del Código de Barras |

**No todos los productos tienen un GTIN perfecto.** En los catálogos panameños
conviven al menos cuatro casos que no lo son:

- marca propia con codificación interna;
- artículos de peso variable, cuyos códigos incrustan peso o precio y no son GTIN
  válidos;
- producto local sin registro GS1;
- importaciones con codificaciones no estándar.

Usar `dGTINCom` produciría facturas con **estructura variable dentro del mismo
catálogo**: unos ítems llevarían el campo y otros no, o serían rechazados por
longitud. Eso complica el desarrollo del emisor y la ingesta del receptor
simultáneamente, que es exactamente el problema que la convención busca eliminar.

**El SKU no es negociable.** `dCodProd` ya transporta el número de material.
Reutilizarlo para el Código de Barras destruye la identificación interna del artículo,
que la cadena necesita para conciliar contra su maestro de materiales.

## Consecuencias

`cbar` es una clave única y uniforme para todo el catálogo: contiene un EAN/GTIN
cuando existe, un código de peso variable o un código local cuando no. La estructura
de la factura es idéntica para todos los ítems.

El costo es que la convención no valida el contenido de `cbar`. No se verifica dígito
de control ni longitud; eso queda del lado del receptor, que es quien conoce su
maestro de artículos. La especificación tipifica `cbar` como texto deliberadamente.

## Alternativas consideradas

| Alternativa | Por qué se descartó |
|---|---|
| `dGTINCom` cuando el código es GTIN válido, `dInfEmFE` cuando no | Estructura variable en el mismo catálogo; el receptor necesita dos rutas de lectura y el emisor lógica condicional por ítem |
| Emitir el Código de Barras en `dCodProd` y el SKU en `dInfEmFE` | Invierte el problema sin resolverlo, y contradice la semántica del campo oficial |
| Exigir GTIN válido a todos los proveedores | Fuera del alcance de una convención de facturación; depende de registro GS1 y de decisiones de catálogo de cada cadena |
