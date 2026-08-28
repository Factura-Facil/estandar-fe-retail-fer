# Implementaciones de referencia

Implementaciones mínimas de la lectura y la escritura definidas en
[`spec/v1.1.1.md`](../spec/v1.1.1.md). Sin dependencias externas, pensadas para leerse
completas en una sentada y para copiarse a un proyecto real.

No son librerías con soporte: son la traducción ejecutable de la especificación. Si una
implementación y la especificación discrepan, la especificación manda y la
implementación es el defecto.

| Lenguaje | Archivo | Casos de conformidad |
|---|---|---|
| Python 3.8+ | [`python/fer.py`](python/fer.py) | `python3 referencia/python/test_conformidad.py` |
| JavaScript (ESM) | [`javascript/fer.js`](javascript/fer.js) | `node referencia/javascript/test-conformidad.mjs` |

Ambas pasan los 20 casos normativos de
[`conformidad/casos.json`](../conformidad/casos.json). Los 4 casos restantes, marcados
`"normativo": false`, ejercitan las notas de implementación de
[§5.3](../spec/v1.1.1.md#53-notas-de-implementación--no-normativo): estas
implementaciones también coinciden con ellos, pero no son requisito de conformidad.

## Uso

```python
import fer

r = fer.leer("Gracias. #FER1# oc=4500000001 | ref=TIENDA RETAIL X #FER1#")
r.perfil        # 'fer'
r.get("oc")     # '4500000001'
r.texto_libre   # 'Gracias.'

fer.escribir(oc="4500000001", ref="TIENDA RETAIL X")
# '#FER1# oc=4500000001 | ref=TIENDA RETAIL X #FER1#'
```

```javascript
import { leer, escribir } from "./fer.js";

const r = leer("#FER1# cbar=7600000000001 #FER1#", "item");
r.datos.cbar;  // '7600000000001'

escribir({ oc: "4500000001", ref: "TIENDA RETAIL X" });
// '#FER1# oc=4500000001 | ref=TIENDA RETAIL X #FER1#'
```

## Contribuir una implementación

Un PR que agregue otro lenguaje debe pasar los casos normativos de
`conformidad/casos.json` completos, sin excepciones marcadas, y no introducir
dependencias externas. Los casos `"normativo": false` son opcionales: coincidir con
ellos facilita que distintos receptores se comporten igual, pero resolverlos de otro
modo no rompe la conformidad. Faltan ABAP, C#, PHP y Java, que son los entornos donde
vive la mayoría de los emisores.
