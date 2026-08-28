# 0004 — Descartar `dInfEmPedGl` y `dInfEmPedIt`

*Por qué un campo de texto con capacidad de sobra igual no sirve, si vive dentro del
grupo equivocado.*

**Estado:** aceptada
**Fecha:** 2026-02
**Aplica a:** FER 1.0.0

## Contexto

La Ficha Técnica define otros campos de "información de interés del emisor" que, por
su nombre y por su capacidad, parecerían alternativas naturales a `dInfEmFE`:

- `dInfEmPedGl` (F119), a nivel de pedido global;
- `dInfEmPedIt` (E159), a nivel de pedido por ítem.

Ambos son alfanuméricos de hasta 5.000 caracteres, la misma capacidad que `dInfEmFE`.
Conviene documentar por qué no se eligieron, porque es la primera objeción que
plantea alguien que conoce el esquema.

## Decisión

No se usan. La convención se apoya únicamente en `dInfEmFE` (B29 y C19).

## Fundamento

El problema no es el campo de texto, es **dónde vive**.

| Campo | Grupo contenedor | Qué arrastra al abrirlo |
|---|---|---|
| `dInfEmPedGl` (F119) | `gPedComGl` | Vuelve obligatorio `dNroPed` (F101), alfanumérico 1–12, que no admite la referencia completa |
| `dInfEmPedIt` (E159) | `gPedComIr` | Vuelve obligatorios `dNroPed` (E151, numérico 1–9) y `dSecItemPed` (E152) |

Es decir: fallan por la misma razón que documenta
[0002](0002-descartar-dnroped.md). Aunque el campo de texto tiene capacidad
suficiente, para poder usarlo hay que abrir el grupo que lo contiene, y abrir ese
grupo obliga precisamente a poblar los nodos que se estaban tratando de evitar.

`dInfEmFE`, en cambio, es un nodo autónomo. No pertenece a ningún grupo que imponga
campos obligatorios adicionales. Es la única sede que combina capacidad suficiente y
cero dependencias.

## Consecuencias

La convención usa un solo campo por nivel, con el mismo nombre en ambos, lo que
simplifica tanto el mapeo del emisor como la regla de lectura del receptor.

## Alternativas consideradas

| Alternativa | Por qué se descartó |
|---|---|
| Abrir `gPedComGl` y poblar `dNroPed` con el número truncado | Emite un identificador que no corresponde al pedido real de la cadena |
| Abrir `gPedComGl` con `dNroPed` correcto y la referencia en `dInfEmPedGl` | Funciona en cabecera pero no tiene equivalente utilizable a nivel de ítem, donde `dNroPed` es numérico de 9 dígitos. Rompe la simetría entre niveles |
