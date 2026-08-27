# FER — Factura Electrónica Retail

Convención de etiquetado para Facturas Electrónicas de retail en Panamá.

**Versión 1.1.0** · Especificación abierta · [Sitio](https://factura-facil.github.io/estandar-fe-retail-fer/) · [Texto normativo](spec/v1.1.0.md) · [Registro de claves](claves/registro.json) · [Casos de conformidad](conformidad/casos.json)

FER define **dónde y cómo** viajan dos datos de negocio dentro del XML de la Factura
Electrónica de Panamá, para que cualquier receptor pueda leerlos con una sola regla,
sin importar qué PAC use el emisor:

- el **número de orden de compra**, a nivel de documento;
- el **código de barra** de cada producto, a nivel de ítem.

Ambos se registran dentro del campo oficial `dInfEmFE` (B29 a nivel de documento,
C19 a nivel de ítem) en un bloque delimitado que **convive con el texto libre** del
emisor. El SKU permanece en su campo propio, `dCodProd`.

```xml
<dInfEmFE>Gracias por su compra. #FER1# oc=4500000001 | ref=TIENDA RETAIL X #FER1#</dInfEmFE>
```

```xml
<dInfEmFE>Producto refrigerado. #FER1# cbar=7600000000001 #FER1#</dInfEmFE>
```

La regla de lectura es única: el receptor extrae únicamente lo delimitado por los
centinelas. Todo lo demás es uso libre del emisor y se ignora.

---

## El problema

Las cadenas de retail de Panamá reciben facturas de cientos o miles de proveedores.
Cada proveedor emite a través del PAC que eligió, y coloca el número de pedido y el
código de barra donde su desarrollo decida. No existe convención común.

El costo se paga en los dos extremos: el proveedor mantiene un mapeo distinto por
cada cadena a la que factura, y la cadena mantiene reglas de ingesta distintas por
cada proveedor. El resultado son rechazos, reprocesos y trabajo manual en cuentas
por pagar.

Un estándar común —definido por las propias cadenas y adoptado por sus proveedores—
elimina esa fricción de raíz. La pregunta técnica es dónde colocar los dos datos, y
la respuesta es el campo oficial `dInfEmFE`: es la única sede que combina capacidad
suficiente y cero dependencias con otros nodos obligatorios.

El razonamiento completo, incluyendo por qué los campos dedicados (`dNroPed`,
`dGTINCom`, `dCodProd`, `dInfEmPedGl`, `dInfEmPedIt`) no son viables, está en
[`decisiones/`](decisiones/).

## Qué NO es FER

- **No es un requisito de la DGI.** Es una convención de industria. El nombre FER
  es un identificador neutral y no representa una posición oficial de la Dirección
  General de Ingresos.
- **No modifica el esquema XML de la DGI.** Se apoya enteramente en un campo
  oficial ya existente de la Ficha Técnica vigente.
- **No requiere cambiar de PAC** ni ser cliente de ningún proveedor en particular.
  Cualquier emisor puede implementarlo con cualquier PAC.
- **No es un producto.** Es un documento y un conjunto de casos de prueba.

## Estado

| | |
|---|---|
| Versión del esquema | `1.1.0` (centinela `#FER1#`) |
| Claves normativas | `oc`, `ref`, `cbar` |
| Compatibilidad | Perfil heredado soportado, ver [§7](spec/v1.1.0.md#7-perfil-heredado) |
| Cambios | [CHANGELOG.md](CHANGELOG.md) |

## Cómo implementar

**Emisores.** Envolver los datos actuales en el bloque, separando el número de
pedido de su referencia. Ver [§4](spec/v1.1.0.md#4-emisión).

**Receptores.** Implementar la extracción según [§5](spec/v1.1.0.md#5-recepción) y
validar contra [`conformidad/casos.json`](conformidad/casos.json). Hay
implementaciones de referencia en Python y JavaScript en
[`referencia/`](referencia/README.md), sin dependencias, que pasan los 20 casos
normativos. Los otros 4 casos del archivo, marcados `"normativo": false`, ejercitan
las notas de implementación de [§5.3](spec/v1.1.0.md#53-notas-de-implementación--no-normativo)
y quedan fuera del criterio de conformidad.

Extractos XML con la ubicación exacta del campo en cada nivel:
[`conformidad/xml/`](conformidad/xml/).

Hay un [validador en línea](https://factura-facil.github.io/estandar-fe-retail-fer/validador/)
que corre la implementación de referencia en el navegador. Acepta el contenido de un
campo o un archivo XML completo; en el segundo caso revisa además las recomendaciones
de emisión de §4.3 y §4.4, que los casos de conformidad no pueden ejercitar. Nada sale
del navegador.

El registro de claves se publica en una URL estable para validar sin clonar el
repositorio: [`registro.json`](https://factura-facil.github.io/estandar-fe-retail-fer/registro.json).

## Gobernanza

FER es **neutral respecto del PAC**: el campo portador es oficial y lo emite cualquier
proveedor de autorización calificado, por lo que implementar la convención no depende
de quién procese la factura.

La especificación se versiona con [SemVer](https://semver.org). Las claves nuevas se
proponen mediante issue y se incorporan por PR al registro; ver
[CONTRIBUTING.md](CONTRIBUTING.md). Las decisiones de diseño quedan registradas y no
se reescriben.

El rol de Factura Fácil, S.A. es el de **facilitador y custodio**: mantener el
repositorio, versionar la especificación y llevar el registro de adoptantes. La
propiedad del beneficio es de la industria. Ver [MAINTAINERS.md](MAINTAINERS.md). Las
empresas que adoptan la convención se listan en [ADOPTANTES.md](ADOPTANTES.md).

Cualquier interpretación normativa específica sobre el uso del campo debe verificarse
con la DGI (`dgi.fe.consultas@mef.gob.pa`).

## Licencia

Texto de la especificación: [CC BY 4.0](LICENSE-spec).
Código e implementaciones de referencia: [Apache-2.0](LICENSE-code).
