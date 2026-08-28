# 0001 — `dInfEmFE` como sede de los datos de retail

*Por qué el campo de notas libre es la única sede viable para los dos datos de negocio.*

**Estado:** aceptada
**Fecha:** 2026-02
**Aplica a:** FER 1.0.0

## Contexto

Las cadenas de retail de Panamá reciben Facturas Electrónicas de cientos o miles de
proveedores y necesitan dos datos de negocio para poder ingerirlas en su ERP sin
intervención manual:

- la **Orden de Compra** de la cadena, que habilita el three-way match (la conciliación
  entre pedido, recepción y factura);
- el **Código de Barras** de cada producto, que identifica físicamente el artículo en
  punto de venta, bodega y logística.

Ninguno de los dos tiene hoy una ubicación acordada en el XML. Cada emisor los coloca
donde su desarrollo o su PAC decide, y el resultado es que el proveedor mantiene un
mapeo por cliente y la cadena mantiene una regla de ingesta por proveedor.

La pregunta de diseño es una sola: **dónde colocar estos dos datos**, dado que el
esquema de la Dirección General de Ingresos no puede modificarse y no existe un nodo
de extensión libre equivalente al `Addenda` del CFDI mexicano.

## Decisión

Los dos datos se registran en el campo `dInfEmFE` ("Información de interés del
emisor"), usando sus dos ocurrencias:

- **B29**, a nivel de documento, para la Orden de Compra;
- **C19**, a nivel de ítem, para el Código de Barras.

Ambos son alfanuméricos de hasta 5.000 caracteres con ocurrencia 0–1. El SKU
permanece en `dCodProd`.

## Fundamento

`dInfEmFE` es el único campo del esquema que reúne las cuatro propiedades necesarias
simultáneamente:

1. **Capacidad suficiente.** 5.000 caracteres admiten el número de la Orden de Compra,
   su referencia legible y espacio para claves futuras.
2. **Tipo permisivo.** Alfanumérico, por lo que acepta códigos que no son
   estrictamente numéricos ni de longitud fija.
3. **Cero dependencias.** Es un nodo autónomo. No pertenece a ningún grupo que, al
   abrirse, vuelva obligatorios otros campos.
4. **Disponibilidad en ambos niveles.** Existe tanto a nivel de documento como de ítem,
   con la misma semántica, lo que permite una sola regla de lectura para los dos
   datos.

Los campos dedicados que a primera vista parecerían la opción correcta fallan en al
menos una de estas cuatro propiedades. El análisis está en
[0002](0002-descartar-dnroped.md), [0003](0003-descartar-dgtincom-y-dcodprod.md) y
[0004](0004-descartar-dinfemped.md).

## Consecuencias

**Positivas.** No requiere modificar el esquema de la DGI ni gestión regulatoria
alguna: se implementa sobre la Ficha Técnica vigente. Es independiente del PAC, ya que
el campo es oficial y lo emite cualquier proveedor. El mapeo desde el IDoc o el
formato de salida de SAP se hace desde un solo campo por nivel.

**Negativas.** `dInfEmFE` es un campo de texto libre, por lo que la estructura no la
garantiza el esquema XML sino la convención. Esto obliga a definir una gramática
propia, un criterio de conformidad y un registro de claves, y traslada al receptor la
responsabilidad de una lectura tolerante a fallos. Es el costo que
[0005](0005-bloque-delimitado-y-centinela.md) administra.

**Riesgo asumido.** Si una versión futura de la Ficha Técnica incorporara un nodo de
extensión estructurado, la convención debería migrar a él. La decisión de versionar la
especificación con SemVer y un centinela existe precisamente para hacer viable esa
migración sin romper a los implementadores.

## Alternativas consideradas

| Alternativa | Por qué se descartó |
|---|---|
| Campos dedicados (`dNroPed`, `dGTINCom`) | Restricciones de tipo, longitud y obligatoriedad. Ver 0002 y 0003 |
| Campos de interés del emisor del pedido (`dInfEmPedGl`, `dInfEmPedIt`) | Arrastran los nodos obligatorios de su grupo contenedor. Ver 0004 |
| Gestionar ante la DGI un nodo de extensión nuevo | Fuera del alcance y del control de los participantes; plazo indeterminado |
| Canal paralelo al XML (EDI, API, portal de proveedores) | Duplica la integración, no viaja con el documento fiscal y depende de infraestructura por cadena |
| Reutilizar `dCodProd` para el Código de Barras | Destruye el SKU. Ver 0003 |
