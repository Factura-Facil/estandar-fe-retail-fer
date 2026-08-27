"""
Implementación de referencia de FER 1.1.0.

Convención de etiquetado para Facturas Electrónicas de retail (Panamá).
Especificación: spec/v1.1.0.md

Copyright 2026 Factura Fácil, S.A. — Apache-2.0
Sin dependencias externas. Compatible con Python 3.8+.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass, field
from typing import Dict, Optional

VERSION_SPEC = "1.1.0"
VERSION_ESQUEMA_SOPORTADA = 1

CLAVES_DOCUMENTO = ("oc", "ref")
CLAVES_ITEM = ("cbar",)

# §3.3 — expresión regular canónica. El cierre debe coincidir en dígito.
_BLOQUE = re.compile(r"#FER(\d)#(.*?)#FER\1#", re.DOTALL)

# §7.1 — prefijo del perfil heredado. La insensibilidad a mayúsculas y tildes es una
# nota de implementación (§5.3.8), no un requisito de la convención.
_PREFIJO_HEREDADO = "orden de compra:"


@dataclass
class Lectura:
    """Resultado de leer un campo dInfEmFE."""

    perfil: str  # "fer" | "heredado"
    datos: Dict[str, str] = field(default_factory=dict)
    texto_libre: str = ""
    version_esquema: Optional[int] = None

    def __getitem__(self, clave: str) -> str:
        return self.datos[clave]

    def get(self, clave: str, defecto: Optional[str] = None) -> Optional[str]:
        return self.datos.get(clave, defecto)


def _sin_tildes(texto: str) -> str:
    descompuesto = unicodedata.normalize("NFD", texto)
    return "".join(c for c in descompuesto if unicodedata.category(c) != "Mn")


def _parsear_pares(contenido: str) -> Dict[str, str]:
    """§5.1.3 — divide el contenido del bloque en pares clave=valor."""
    datos: Dict[str, str] = {}
    for fragmento in contenido.split("|"):
        if "=" not in fragmento:
            continue
        clave, _, valor = fragmento.partition("=")  # divide en el primer "="
        clave = clave.strip().lower()
        valor = valor.strip()
        if not clave or not valor:
            continue  # §5.3.2 — valor vacío se trata como clave ausente
        if clave in datos:
            continue  # §5.3.1 — prevalece la primera ocurrencia
        datos[clave] = valor
    return datos


def _leer_heredado(valor: str, nivel: str) -> Lectura:
    """§7.1 — lectura del perfil heredado."""
    datos: Dict[str, str] = {}
    plano = valor.strip()

    if nivel == "documento":
        normalizado = _sin_tildes(plano).lower()
        pos = normalizado.find(_PREFIJO_HEREDADO)
        if pos != -1:
            resto = plano[pos + len(_PREFIJO_HEREDADO):].strip()
            partes = resto.split(None, 1)
            if partes:
                datos["oc"] = partes[0]
                if len(partes) > 1 and partes[1].strip():
                    datos["ref"] = partes[1].strip()
    elif nivel == "item":
        # §7.1 — el valor crudo es el contenido completo del campo. La convención no
        # define un criterio para distinguir un código de una nota: el formato
        # heredado no lo permite. Quien necesite esa distinción la resuelve con su
        # propio catálogo, fuera del alcance de FER.
        if plano:
            datos["cbar"] = plano

    return Lectura(perfil="heredado", datos=datos, texto_libre=plano)


def leer(valor: Optional[str], nivel: str = "documento") -> Lectura:
    """
    Lee un campo dInfEmFE conforme a FER 1.1.0.

    `valor` debe ser el contenido del nodo XML **ya des-escapado** por el parser
    (§5.1.1), no los bytes crudos del documento.

    `nivel` es "documento" (campo B29) o "item" (campo C19).

    Nunca lanza excepción por contenido malformado: descarta el bloque y cae al
    perfil heredado (§5.3.4). Esta implementación no trata un bloque ausente,
    sobrante o malformado como error (§5.3.5).
    """
    if nivel not in ("documento", "item"):
        raise ValueError("nivel debe ser 'documento' o 'item'")

    if not valor:
        return Lectura(perfil="heredado", datos={}, texto_libre="")

    coincidencia = _BLOQUE.search(valor)
    if coincidencia is None:
        return _leer_heredado(valor, nivel)

    datos = _parsear_pares(coincidencia.group(2))
    if not datos:
        # §5.3.4 — el bloque no produjo ningún par válido: se descarta.
        return _leer_heredado(valor, nivel)

    antes = valor[: coincidencia.start()].strip()
    despues = valor[coincidencia.end():].strip()
    texto_libre = " ".join(p for p in (antes, despues) if p)

    return Lectura(
        perfil="fer",
        datos=datos,
        texto_libre=texto_libre,
        version_esquema=int(coincidencia.group(1)),
    )


def escribir(nivel: str = "documento", texto_libre: str = "", **claves: str) -> str:
    """
    Construye el contenido de un campo dInfEmFE conforme a §4.

    >>> escribir(oc="4500000001", ref="TIENDA RETAIL X")
    '#FER1# oc=4500000001 | ref=TIENDA RETAIL X #FER1#'
    """
    centinela = f"#FER{VERSION_ESQUEMA_SOPORTADA}#"
    pares = []
    for clave, valor in claves.items():
        clave = clave.strip().lower()
        valor = "" if valor is None else str(valor).strip()
        if not valor:
            continue  # §5.3.2 — no se emiten claves con valor vacío
        if "|" in valor or re.search(r"#FER\d#", valor):
            raise ValueError(
                f"el valor de '{clave}' contiene un carácter reservado (§3.4)"
            )
        pares.append(f"{clave}={valor}")

    if not pares:
        return texto_libre.strip()

    bloque = f"{centinela} " + " | ".join(pares) + f" {centinela}"
    return f"{texto_libre.strip()} {bloque}".strip()
