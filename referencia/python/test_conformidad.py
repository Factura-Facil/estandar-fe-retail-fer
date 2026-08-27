"""Ejecuta los casos de conformidad/casos.json contra la implementación de referencia.

Los casos con "normativo": false ejercitan las notas de implementación de §5.3, sobre
las que la propuesta de estándar no se pronuncia. Se ejecutan y se reportan aparte,
pero no cuentan para el criterio de conformidad: una implementación puede resolverlos
de otro modo y seguir siendo conforme.
"""
import json, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import fer

casos = json.loads((pathlib.Path(__file__).parents[2] / "conformidad" / "casos.json").read_text(encoding="utf-8"))["casos"]

fallos_norm = 0
fallos_notas = 0
total_norm = 0
total_notas = 0

for c in casos:
    normativo = c.get("normativo", True)
    r = fer.leer(c["entrada"], nivel="documento" if c["nivel"] == "documento" else "item")
    claves_esperadas = set(c["esperado"])
    obtenido = {k: v for k, v in r.datos.items() if k in claves_esperadas} if claves_esperadas else {k: v for k, v in r.datos.items() if k in fer.CLAVES_DOCUMENTO + fer.CLAVES_ITEM}
    ok = obtenido == c["esperado"] and r.perfil == c["perfil"]

    if normativo:
        total_norm += 1
    else:
        total_notas += 1

    if not ok:
        if normativo:
            fallos_norm += 1
            etiqueta = "FALLA"
        else:
            fallos_notas += 1
            etiqueta = "DIFIERE"
        print(f"{etiqueta} {c['id']}: {c['descripcion']}")
        print(f"  perfil  esperado={c['perfil']!r} obtenido={r.perfil!r}")
        print(f"  datos   esperado={c['esperado']} obtenido={obtenido}")
    else:
        print(f"{'ok   ' if normativo else 'ok(i)'} {c['id']}")

print(f"\n{total_norm - fallos_norm}/{total_norm} casos normativos conformes")
print(f"{total_notas - fallos_notas}/{total_notas} notas de implementación (§5.3) coinciden — no afectan la conformidad")
sys.exit(1 if fallos_norm else 0)
