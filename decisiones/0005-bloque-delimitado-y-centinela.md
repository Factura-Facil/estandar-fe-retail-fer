# 0005 — Bloque delimitado con centinela versionado

*Por qué los datos van en un bloque delimitado y no ocupan el campo entero.*

**Estado:** parcialmente superseada por
[0006](0006-reglas-de-extraccion-normativas.md) · aceptada
**Fecha:** 2026-02
**Aplica a:** FER 1.0.0

## Contexto

Decidido que la sede es `dInfEmFE` ([0001](0001-sede-del-dato-dinfemfe.md)), queda la
pregunta de **cómo** ocupar un campo de texto libre de 5.000 caracteres.

La restricción es que el campo ya tiene un uso legítimo: los emisores lo usan para
mensajes al cliente, notas de manejo, avisos y promociones. Ocuparlo por completo con
datos técnicos le quita al emisor una funcionalidad que hoy tiene, lo que convierte la
adopción en una pérdida y no en una ganancia. Una convención que exige renunciar a
algo se adopta mal.

Además hay un formato previo, de uso común en el mercado, que coloca los datos
directamente en el campo sin delimitadores: `Orden de compra: 4500000001 TIENDA RETAIL
X` en cabecera y el Código de Barras en crudo en el ítem. Ese formato existe y hay que
convivir con él.

## Decisión

Los datos viajan en un **bloque acotado** que convive con el texto libre:

```
#FER1# clave=valor | clave=valor #FER1#
```

- El mismo centinela abre y cierra el bloque.
- El **dígito del centinela es la versión del esquema**: un lector que reconozca
  `#FER1#` sabe qué claves esperar, y futuras versiones (`#FER2#`) pueden coexistir
  sin romper a los implementadores previos.
- La regla de lectura es única: el receptor extrae solo lo delimitado; todo lo demás
  es uso libre del emisor y se ignora.

El formato previo se reconoce como **perfil heredado** y se define una regla de
convivencia: el receptor busca primero un bloque; si no existe, aplica la lectura
heredada.

## Fundamento

**Por qué un centinela y no otro delimitador.** `#FER1#` es improbable en texto
humano, no requiere escape en XML, es legible a simple vista en un log o en un visor
de facturas, y su simetría de apertura y cierre permite localizarlo con una sola
expresión regular sin conocer la posición.

**Por qué la versión va en el centinela y no en una clave.** Si la versión fuera una
clave, un lector tendría que parsear el bloque para saber si puede parsearlo. Ponerla
en el delimitador permite decidir antes de leer. El costo es que un cambio de versión
altera la cadena que se busca.

**Cómo se atenúa el fallo silencioso.** Ese costo es real: un lector que buscara
literalmente `#FER1#` no encontraría un bloque `#FER2#` y caería a la lectura
heredada sin error visible, lo que es peor que fallar. La gramática lo atenúa por
construcción —el receptor localiza `#FER(\d)#`, no una versión literal—, de modo que
un bloque de versión superior se reconoce como bloque aunque su registro de claves
sea desconocido.

Qué hacer entonces con ese bloque es una nota de implementación (§5.3.3), no una
regla de la convención: las implementaciones de referencia lo procesan y extraen las
claves que reconocen, apoyándose en el principio de coexistencia que enuncia el
documento madre. Este ADR deja constancia de que la convención **no** promete que las
claves de la versión 1 sean estables en versiones posteriores; esa garantía tendría
que darla explícitamente una versión futura del estándar, y hoy no está dada.
**[Este pasaje describe el estado en 1.0.0 y quedó superseado: ver la nota que
sigue.]**

> **Superseado.** FER 1.1.0 sí da esa garantía y hace normativa la lectura hacia
> adelante. Ver [0006](0006-reglas-de-extraccion-normativas.md) y §6.1. El párrafo
> anterior se conserva como registro del estado en 1.0.0.

**Por qué claves con nombre y no posiciones.** Un formato posicional
(`4500000001|TIENDA RETAIL X`) es más corto, pero cualquier cambio en el orden o
cualquier campo opcional lo rompe, y un valor ausente exige un separador vacío que es
fácil de emitir mal. Las claves con nombre permiten omitir lo que no aplica y agregar
lo que no existía, que es la propiedad que hace posible §5.2.2 (clave desconocida se
ignora, nunca se rechaza).

**Por qué no hay escape en 1.0.0.** Un mecanismo de escape agrega complejidad al
emisor, al receptor y a los casos de prueba, a cambio de resolver un caso que no
aparece en los datos reales: ni las Órdenes de Compra ni los Códigos de Barras
contienen `|`. Se declaran caracteres reservados y punto. Si aparece un caso legítimo,
se resuelve en una versión mayor.

## Consecuencias

**Positivas.** El emisor conserva el uso del campo. La migración es incremental: cada
proveedor cambia cuando puede, sin fecha de corte coordinada, porque emisores migrados
y no migrados conviven en la misma regla de ingesta. La representación gráfica del
CAFE puede omitir el bloque sin ambigüedad, ya que los delimitadores separan el
mensaje al cliente del dato técnico.

**Negativas.** El receptor debe implementar dos rutas de lectura durante la
transición, no una. La convención asume el costo de mantener un registro de claves y
un criterio de conformidad, trabajo que un esquema XML haría gratis.

**Consecuencia deliberada.** Las implementaciones de referencia no tratan un bloque
ausente, duplicado o malformado como error (§5.3.4): sacrifican capacidad de
validación a cambio de que adoptar la convención no pueda introducir un modo de falla
nuevo en la recepción de facturas. Sin esa propiedad, el riesgo percibido de adoptar
supera el beneficio.

Está registrado como nota de implementación y no como regla normativa porque el
documento madre limita el «nunca se rechaza» a las claves desconocidas y no lo
extiende al documento completo. La convención no puede prometer, en nombre del
receptor, qué es o no motivo de rechazo: eso depende de su normativa y de sus propios
controles. Lo que sí ofrece es una lectura que nunca falla por sí misma.

## Alternativas consideradas

| Alternativa | Por qué se descartó |
|---|---|
| Ocupar el campo completo con los datos, sin delimitadores | Es el perfil heredado. Le quita al emisor el uso del campo, y el prefijo de texto es frágil ante mayúsculas, tildes e idioma |
| JSON dentro del campo | Legible por máquina, pero verboso, sensible al escape de `"` en XML, ilegible en el CAFE si se imprime, y obliga al emisor a un serializador donde hoy concatena texto |
| XML anidado dentro del texto | El contenido debe escaparse entero, lo que produce un campo ilegible y propenso a doble escape |
| Bloque con delimitadores distintos de apertura y cierre | Ninguna ventaja sobre el centinela simétrico, y duplica los literales a mantener |
| Versión como clave dentro del bloque (`v=1`) | Obliga a parsear para saber si se puede parsear |
| Formato posicional | Frágil ante campos opcionales y extensiones |
