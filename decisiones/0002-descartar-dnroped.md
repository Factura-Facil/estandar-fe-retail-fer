# 0002 — Descartar `dNroPed` para la orden de compra

**Estado:** aceptada
**Fecha:** 2026-02
**Aplica a:** FER 1.0.0

## Contexto

La Ficha Técnica define campos dedicados para el número de pedido. Son la opción que
cualquiera consideraría primero, y hay que documentar por qué no sirven antes de
proponer un campo de texto libre.

Un número de orden de compra de SAP tiene típicamente 10 dígitos, por ejemplo
`4500000001`, y en la práctica del retail panameño viaja acompañado de una referencia
de negocio legible que identifica a la cadena o el centro de recepción.

## Decisión

No se usan `dNroPed` ni sus nodos asociados. La orden de compra se transporta en
`dInfEmFE` (B29) mediante las claves `oc` y `ref`.

## Fundamento

| Campo dedicado | Tipo / tamaño | Restricción |
|---|---|---|
| `dNroPed` global (F101), en `gPedComGl` | Alfanumérico, 1–12 | El número de 10 dígitos cabe, pero número más referencia legible excede los 12 caracteres. Abrir `gPedComGl` vuelve obligatorio `dNroPed` |
| `dNroPed` por ítem (E151), en `gPedComIr` | Numérico, 1–9 | Numérico y máximo 9 dígitos: un pedido de 10 dígitos no cabe. Obliga además a informar `dSecItemPed` |

Tres problemas distintos, y basta uno para descartar la vía:

1. **Capacidad insuficiente.** El campo global no admite el número junto a su
   referencia. El campo por ítem no admite ni el número solo.
2. **Nodos condicionalmente obligatorios.** Abrir el grupo contenedor obliga a poblar
   campos adicionales. Cada nodo obligatorio extra es un punto de falla más en el
   mapeo desde el formato de salida del ERP y más superficie de prueba.
3. **Modelado incorrecto.** La orden de compra es un atributo de cabecera.
   Replicarla en cada línea es redundante, infla el documento y, dado que el campo
   por ítem no admite el número real, es inviable además de conceptualmente errado.

## Consecuencias

La orden de compra queda en un campo de texto, con las implicaciones de
[0001](0001-sede-del-dato-dinfemfe.md). En cambio, se separa el número limpio (`oc`,
consumible directamente por el three-way match) de la referencia legible (`ref`), algo
que el campo dedicado no permitía ni siquiera cuando el dato cabía.

## Alternativas consideradas

| Alternativa | Por qué se descartó |
|---|---|
| Truncar la referencia para caber en 12 caracteres | Pierde información que la cadena usa para enrutar la factura |
| Emitir solo el número en `dNroPed` y la referencia en `dInfEmFE` | Obliga al receptor a leer dos campos con reglas distintas y arrastra los nodos obligatorios de `gPedComGl` sin evitar el texto libre |
| Usar `dNroPed` por ítem con el número truncado a 9 dígitos | Produce un identificador que no existe en el ERP de la cadena |
