// Constancia de revisión FER en PDF. Recibe un modelo ya calculado por la página (no
// evalúa reglas: el veredicto y los hallazgos vienen de revisar-xml.js y faltas()).
//
// La página lo carga con import() al pulsar el botón: jsPDF pesa más que todo el
// validador junto, y quien solo quiere leer el veredicto no tiene por qué bajarlo.
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const C = {
  navy: "#0e1a47", tinta: "#1e2532", tenue: "#5a6478", fant: "#65738c", rotulo: "#616b7b",
  linea: "#e6edf5", hondo: "#f7fafd", cian: "#25baf0", cianT: "#1174b0", cianTenue: "#e8f6fd",
  verde: "#4f6a18", verdeT: "#edf6dc", verdeB: "#dcebc2", marc: "#c6e17a",
  rojo: "#a4342a", rojoT: "#fdf7f6", rojoB: "#f0dcd8", rojoP: "#f7e6e3",
};
const ESTADO = { ok: ["OK", C.verde], mal: ["Corregir", C.rojo], info: ["Informativo", C.cianT] };
const GRADO = { error: C.rojo, aviso: C.verde, nota: C.tenue };

export function generarConstancia(vm, logo) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = 595.28, H = 841.89, M = 48, AN = W - 2 * M;
  let y = M;
  const nuevaPagina = () => { doc.addPage(); y = M; };
  const cabe = (h) => { if (y + h > H - 64) nuevaPagina(); };
  const fuente = (estilo, tam, color, fam = "helvetica") => {
    doc.setFont(fam, estilo); doc.setFontSize(tam); doc.setTextColor(color);
  };
  const parrafo = (txt, x, ancho, tam = 9, color = C.tenue, estilo = "normal", fam = "helvetica", inter = 1.4) => {
    fuente(estilo, tam, color, fam);
    const lineas = doc.splitTextToSize(txt, ancho);
    for (const l of lineas) { cabe(tam * inter); doc.text(l, x, y + tam); y += tam * inter; }
  };
  const seccion = (titulo, extra) => {
    cabe(48);
    y += 14;
    doc.setDrawColor(C.cian); doc.setLineWidth(2); doc.line(M, y, M + 28, y);
    y += 16;
    fuente("bold", 12, C.navy); doc.text(titulo, M, y);
    if (extra) { fuente("normal", 8.5, C.fant); doc.text(extra, W - M, y, { align: "right" }); }
    y += 10;
  };
  const tabla = (opts) => {
    autoTable(doc, {
      startY: y, margin: { left: M, right: M, top: M, bottom: 64 }, theme: "plain",
      styles: { font: "helvetica", fontSize: 8.5, textColor: C.tinta, cellPadding: { top: 5, bottom: 5, left: 6, right: 6 }, lineColor: C.linea, lineWidth: 0, overflow: "linebreak" },
      headStyles: { fillColor: C.hondo, textColor: C.rotulo, fontSize: 7.5, fontStyle: "normal" },
      didDrawCell: (d) => { if (d.section === "body") { doc.setDrawColor(C.linea); doc.setLineWidth(0.5); doc.line(d.cell.x, d.cell.y + d.cell.height, d.cell.x + d.cell.width, d.cell.y + d.cell.height); } },
      ...opts,
    });
    y = doc.lastAutoTable.finalY + 6;
  };

  // Encabezado
  if (logo) doc.addImage(logo, "PNG", M, y - 4, 94, 32);
  fuente("bold", 17, C.navy); doc.text("Constancia de revisión FER", W - M, y + 10, { align: "right" });
  fuente("normal", 8.5, C.fant); doc.text(`Validador FER 1.1.1 · Generada el ${vm.generado}`, W - M, y + 24, { align: "right" });
  y += 44;
  doc.setDrawColor(C.linea); doc.setLineWidth(0.75); doc.line(M, y, W - M, y);
  y += 20;

  // Veredicto
  const ancho = AN - 70;
  fuente("normal", 10.5, C.tinta);
  const porque = doc.splitTextToSize(vm.porque, ancho);
  const extra = vm.heredado ? doc.splitTextToSize(vm.heredado, ancho) : [];
  const alto = 30 + 22 + porque.length * 14 + (extra.length ? 8 + extra.length * 13 : 0) + 6;
  doc.setFillColor(vm.sirve ? C.verdeT : C.rojoT);
  doc.setDrawColor(vm.sirve ? C.verdeB : C.rojoB); doc.setLineWidth(0.75);
  doc.roundedRect(M, y, AN, alto, 10, 10, "FD");
  const cx = M + 32, cy = y + 32;
  doc.setFillColor(vm.sirve ? C.marc : C.rojoP); doc.circle(cx, cy, 13, "F");
  doc.setDrawColor(vm.sirve ? C.verde : C.rojo); doc.setLineWidth(2.2); doc.setLineCap("round"); doc.setLineJoin("round");
  if (vm.sirve) doc.lines([[4.5, 4.5], [8, -10]], cx - 6.5, cy + 0.5);
  else { doc.line(cx, cy - 7, cx, cy + 6); doc.lines([[5, 5], [5, -5]], cx - 5, cy + 1); }
  fuente("bold", 20, vm.sirve ? C.verde : C.rojo); doc.text(vm.titular, M + 56, y + 39);
  let ty = y + 62;
  fuente("normal", 10.5, C.tinta);
  for (const l of porque) { doc.text(l, M + 56, ty); ty += 14; }
  if (extra.length) { ty += 4; fuente("normal", 9, C.tenue); for (const l of extra) { doc.text(l, M + 56, ty); ty += 13; } }
  y += alto + 6;

  // Ficha
  seccion("Documento revisado");
  tabla({
    body: vm.ficha.map(([k, v]) => [k, v]),
    columnStyles: { 0: { cellWidth: 130, textColor: C.rotulo, fontSize: 8 }, 1: { fontStyle: "bold" } },
  });

  // Lista de verificación
  seccion("Lo que se revisó", vm.resumenChecks);
  tabla({
    head: [["Estado", "Comprobación", "Resultado", "Tipo"]],
    body: vm.checks.map((c) => [ESTADO[c.estado][0], `${c.titulo}${c.ref ? `  (${c.ref})` : ""}`, `${c.valor} — ${c.detalle}`, c.decide ? "Obligatoria" : "Informativa"]),
    columnStyles: { 0: { cellWidth: 62, fontStyle: "bold" }, 1: { cellWidth: 140, fontStyle: "bold" }, 3: { cellWidth: 82, textColor: C.fant, fontSize: 7.5 } },
    didParseCell: (d) => { if (d.section === "body" && d.column.index === 0) d.cell.styles.textColor = ESTADO[vm.checks[d.row.index].estado][1]; },
  });

  // Cómo se corrige
  if (vm.pasos.length) {
    seccion("Cómo se corrige", "Los huecos en versales los rellena quien emite");
    vm.pasos.forEach((p, i) => {
      cabe(90);
      y += 6;
      fuente("bold", 10, C.tinta); doc.text(`${i + 1}. ${p.titulo}`, M, y + 10);
      fuente("normal", 8, C.fant); doc.text(p.ref + (p.cuantos ? ` · ${p.cuantos}` : ""), W - M, y + 10, { align: "right" });
      y += 18;
      const fila = (rotulo, txt, caja) => {
        fuente("normal", 7, C.rotulo); cabe(14); doc.text(rotulo.toUpperCase(), M, y + 10);
        fuente("normal", 8.5, C.tinta, "courier");
        const ls = doc.splitTextToSize(txt, AN - 70);
        const h = ls.length * 11 + (caja ? 10 : 2);
        cabe(h);
        if (caja) { doc.setFillColor(C.verdeT); doc.setDrawColor(C.verdeB); doc.setLineWidth(0.5); doc.roundedRect(M + 62, y, AN - 62, h, 4, 4, "FD"); }
        let yy = y + (caja ? 13 : 9);
        doc.setTextColor(caja ? C.tinta : C.tenue);
        for (const l of ls) { doc.text(l, M + 68, yy); yy += 11; }
        y += h + 4;
      };
      fila("Ahora", p.ahora, false);
      fila("Escribe", p.bloque, true);
      parrafo(p.donde, M + 62, AN - 62, 8, C.fant);
      if (p.alternativa) {
        y += 2;
        fila("O bien", p.alternativa.bloque, true);
        parrafo(`En el perfil heredado (§7), ${p.alternativa.donde}.`, M + 62, AN - 62, 8, C.fant);
      }
      if (p.candidato) { y += 2; parrafo(p.candidato, M + 62, AN - 62, 8, C.tenue); }
      if (p.nota) { y += 2; parrafo(p.nota, M + 62, AN - 62, 8, C.tenue); }
      y += 4;
    });
    if (vm.pasosResto) parrafo(vm.pasosResto, M, AN, 8.5, C.tenue);
  }

  // Ítems
  seccion(`Ítems · ${vm.items.length}`, vm.resumenItems);
  if (vm.items.length) {
    tabla({
      head: [["#", "Producto", "dCodProd", "Código de Barras", "Estado"]],
      body: vm.items.map((i) => [i.sec, i.desc, i.cod, i.cbar, i.estadoTexto]),
      columnStyles: { 0: { cellWidth: 24, textColor: C.fant }, 2: { cellWidth: 70, font: "courier", fontSize: 8 }, 3: { cellWidth: 92, font: "courier", fontSize: 8 }, 4: { cellWidth: 92, fontStyle: "bold" } },
      didParseCell: (d) => {
        if (d.section !== "body") return;
        const it = vm.items[d.row.index];
        if (d.column.index === 4) d.cell.styles.textColor = it.ok ? C.verde : C.rojo;
        if (d.column.index === 3 && it.ok) d.cell.styles.fillColor = C.verdeT;
        if (!it.ok && d.column.index !== 3) d.cell.styles.fillColor = C.rojoT;
      },
    });
  }

  // Observaciones
  if (vm.obs.length) {
    seccion("Observaciones", vm.resumenObs);
    tabla({
      head: [["Grado", "Hallazgo", "Ref."]],
      body: vm.obs.map((a) => [a.grado.toUpperCase(), a.texto, a.ref]),
      columnStyles: { 0: { cellWidth: 56, fontStyle: "bold", fontSize: 7.5 }, 1: { textColor: C.tenue }, 2: { cellWidth: 46, textColor: C.fant } },
      didParseCell: (d) => { if (d.section === "body" && d.column.index === 0) d.cell.styles.textColor = GRADO[vm.obs[d.row.index].grado]; },
    });
  }

  // Alcance y sello
  cabe(130);
  y += 18;
  doc.setDrawColor(C.linea); doc.setLineWidth(0.75); doc.line(M, y, W - M, y);
  y += 16;
  const sy = y;
  fuente("bold", 9.5, C.navy); doc.text("Alcance de esta constancia", M, y + 10); y += 18;
  parrafo(vm.alcance, M, AN - 140, 8.5, C.tenue);
  y += 4;
  parrafo("El sello es informativo: identifica quién generó la revisión y cuándo. No es una firma digital.", M, AN - 140, 7.5, C.fant);
  // Sello: anillo doble, marca arriba, fecha al centro y estado en una pastilla que
  // cabe dentro del anillo interior (se parte en dos líneas si el titular es largo).
  const R = 54, sx = W - M - R, scy = sy + R;
  const tono = vm.sirve ? C.verde : C.rojo;
  doc.setDrawColor(C.cianT); doc.setLineWidth(2); doc.circle(sx, scy, R, "S");
  doc.setLineWidth(0.6); doc.circle(sx, scy, R - 6, "S");
  fuente("bold", 7.5, C.navy); doc.text("FACTURA FÁCIL", sx, scy - 27, { align: "center" });
  fuente("normal", 6, C.cianT); doc.text("REVISIÓN FER 1.1.1", sx, scy - 19, { align: "center" });
  doc.setDrawColor(C.cian); doc.setLineWidth(0.6); doc.line(sx - 22, scy - 14, sx + 22, scy - 14);
  fuente("bold", 11, C.navy); doc.text(vm.selloFecha, sx, scy - 1, { align: "center" });
  fuente("normal", 7, C.tenue); doc.text(vm.selloHora, sx, scy + 9, { align: "center" });
  fuente("bold", 6, "#ffffff");
  const estado = (vm.sirve ? vm.titular : "Por corregir").toUpperCase();
  const lineasEstado = doc.getTextWidth(estado) > 60 ? doc.splitTextToSize(estado, 60) : [estado];
  const anchoP = Math.max(...lineasEstado.map((l) => doc.getTextWidth(l))) + 12;
  const altoP = lineasEstado.length * 7 + 6;
  const py = scy + 14;
  doc.setFillColor(tono); doc.roundedRect(sx - anchoP / 2, py, anchoP, altoP, 3, 3, "F");
  lineasEstado.forEach((l, i) => doc.text(l, sx, py + 8.5 + i * 7, { align: "center" }));
  y = Math.max(y, scy + R + 8);

  // Pie en cada página
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setDrawColor(C.linea); doc.setLineWidth(0.5); doc.line(M, H - 40, W - M, H - 40);
    fuente("normal", 7.5, C.fant);
    doc.text(`Factura Fácil, S.A. · Custodio del registro FER · ${vm.archivo}`, M, H - 28);
    doc.text(`Página ${i} de ${n}`, W - M, H - 28, { align: "right" });
  }
  doc.save(vm.nombrePdf);
}
