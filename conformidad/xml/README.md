# Ejemplos XML

Los archivos de esta carpeta son **extractos ilustrativos**, no Facturas Electrónicas
completas ni validables contra el esquema de la DGI. Muestran únicamente la ubicación
del campo portador dentro de su grupo, con los nodos vecinos necesarios para
identificar la posición.

Para validar un documento completo, usa los ejemplos y archivos de ayuda publicados
por la Dirección General de Ingresos junto a la Ficha Técnica vigente.

Todos los valores son ficticios.

| Archivo | Nivel | Campo | Escenario |
|---|---|---|---|
| `cabecera-bloque.xml` | Documento | B29 | Bloque sin texto libre |
| `cabecera-texto-libre.xml` | Documento | B29 | Texto libre antes y después del bloque |
| `item-bloque.xml` | Ítem | C19 | Bloque sin texto libre, SKU preservado en `dCodProd` |
| `item-heredado.xml` | Ítem | C19 | Perfil heredado, código de barra en crudo |
| `ejemplo-completo.xml` | Ambos | B29 y C19 | Documento con tres ítems, para probar el validador |
