import { jsPDF } from "jspdf";
import { type ExerciceItem, parseExercices } from "@/lib/exercices";

type CoachSeance = { titre: string; type_seance: string | null; date_prevue: string | null; semaine?: number | null; description: string | null; exercices: string | null };

const GOLD = { r: 201, g: 168, b: 76 };
const GOLD_LIGHT = { r: 226, g: 201, b: 126 };
const WHITE = { r: 255, g: 255, b: 255 };
const GRAY = { r: 155, g: 155, b: 155 };
const GRAY_DIM = { r: 95, g: 95, b: 95 };
const CARD_BG = { r: 17, g: 17, b: 17 };
const CARD_BORDER = { r: 42, g: 42, b: 42 };

// jsPDF (police "helvetica" standard, encodage WinAnsi) ne sait pas afficher l'espace fine
// insécable utilisée par `toLocaleString("fr-FR")` pour grouper les milliers (rendue en glyphe
// cassé dans le PDF) ni le caractère flèche "→" : on formate donc les nombres nous-mêmes.
const fmtInt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");

export function generateProgrammePdf(seances: CoachSeance[], clientName?: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210, pageH = 297, margin = 16;
  let y = margin;

  const fillBg = () => {
    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, pageW, pageH, "F");
  };

  const drawFooter = () => {
    doc.setDrawColor(GOLD.r, GOLD.g, GOLD.b);
    doc.setLineWidth(0.2);
    doc.line(margin, pageH - 14, pageW - margin, pageH - 14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(GOLD.r, GOLD.g, GOLD.b);
    doc.text("SAMUEL.COACHING", margin, pageH - 9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(GRAY_DIM.r, GRAY_DIM.g, GRAY_DIM.b);
    doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, pageW - margin, pageH - 9, { align: "right" });
  };

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - 20) {
      drawFooter();
      doc.addPage();
      fillBg();
      y = margin;
    }
  };

  fillBg();

  // ── En-tête ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(GOLD.r, GOLD.g, GOLD.b);
  doc.text("PROGRAMME D'ENTRAÎNEMENT", margin, y + 6);
  y += 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(WHITE.r, WHITE.g, WHITE.b);
  doc.text(clientName ? `Préparé pour ${clientName}` : "Ton programme personnalisé", margin, y);
  y += 6;

  doc.setFontSize(9);
  doc.setTextColor(GRAY_DIM.r, GRAY_DIM.g, GRAY_DIM.b);
  doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`, margin, y);
  y += 6;

  doc.setDrawColor(GOLD.r, GOLD.g, GOLD.b);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageW - margin, y);
  y += 10;

  // ── Séances ──
  seances.forEach((s, si) => {
    const items = parseExercices(s.exercices);

    ensureSpace(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(WHITE.r, WHITE.g, WHITE.b);
    doc.text(`Séance ${si + 1} — ${s.titre}`, margin, y + 5);

    if (s.date_prevue || s.semaine) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(GRAY_DIM.r, GRAY_DIM.g, GRAY_DIM.b);
      const dateLabel = s.date_prevue ? new Date(s.date_prevue + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) : "";
      const label = [s.semaine ? `Semaine ${s.semaine}` : "", dateLabel].filter(Boolean).join(" · ");
      doc.text(label, pageW - margin, y + 5, { align: "right" });
    }
    y += 9;

    if (s.type_seance) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      const tw = doc.getTextWidth(s.type_seance) + 5;
      doc.setDrawColor(GOLD.r, GOLD.g, GOLD.b);
      doc.setLineWidth(0.25);
      doc.roundedRect(margin, y - 3.3, tw, 5, 0.6, 0.6, "S");
      doc.setTextColor(GOLD.r, GOLD.g, GOLD.b);
      doc.text(s.type_seance, margin + 2.5, y);
      y += 6;
    }

    if (s.description) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
      const lines = doc.splitTextToSize(s.description, pageW - margin * 2);
      ensureSpace(lines.length * 4.3 + 2);
      doc.text(lines, margin, y);
      y += lines.length * 4.3 + 4;
    } else {
      y += 2;
    }

    const drawExerciceCard = (ex: ExerciceItem, ei: number, grouped: boolean) => {
      const noteLines: string[] = ex.note ? doc.splitTextToSize(ex.note, pageW - margin * 2 - 12) : [];
      const bodyLines: string[] = ex.mode === "avance"
        ? ex.sets.map((s, si) => {
            const parts = [s.reps, s.poids, s.repos ? `repos ${s.repos}` : "", s.rpe ? `RPE ${s.rpe}` : "", s.tempo ? `tempo ${s.tempo}` : ""].filter(Boolean);
            return parts.length ? `Série ${si + 1} — ${parts.join(" · ")}` : "";
          }).filter(Boolean)
        : [];
      const stats: string[] = [];
      if (ex.mode === "simple") {
        if (ex.series) stats.push(`${ex.series}${ex.repetitions ? ` × ${ex.repetitions}` : " séries"}`);
        if (ex.poids) stats.push(ex.poids);
        if (ex.repos) stats.push(`repos ${ex.repos}`);
      }
      const freeLines: string[] = ex.mode === "libre" && ex.texteLibre ? doc.splitTextToSize(ex.texteLibre, pageW - margin * 2 - 12) : [];

      const cardH = 12
        + (stats.length ? 4.5 : 0)
        + (bodyLines.length ? bodyLines.length * 3.8 + 1 : 0)
        + (freeLines.length ? freeLines.length * 3.8 + 2 : 0)
        + (noteLines.length ? noteLines.length * 3.8 + 2 : 0);
      ensureSpace(cardH + 3);

      doc.setFillColor(CARD_BG.r, CARD_BG.g, CARD_BG.b);
      doc.setDrawColor(CARD_BORDER.r, CARD_BORDER.g, CARD_BORDER.b);
      doc.setLineWidth(0.2);
      doc.roundedRect(margin, y, pageW - margin * 2, cardH, 1, 1, "FD");

      if (grouped) {
        doc.setDrawColor(GOLD.r, GOLD.g, GOLD.b);
        doc.setLineWidth(0.8);
        doc.line(margin, y, margin, y + cardH);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(GOLD.r, GOLD.g, GOLD.b);
      doc.text(`${ei + 1}`, margin + 4, y + 6);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(WHITE.r, WHITE.g, WHITE.b);
      doc.text(ex.nom, margin + 10, y + 6);

      if (ex.type) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(GRAY_DIM.r, GRAY_DIM.g, GRAY_DIM.b);
        doc.text(ex.type, pageW - margin - 4, y + 6, { align: "right" });
      }

      let cy = y + 10.5;
      if (stats.length) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(GOLD_LIGHT.r, GOLD_LIGHT.g, GOLD_LIGHT.b);
        doc.text(stats.join("   ·   "), margin + 10, cy);
        cy += 4.5;
      }
      if (bodyLines.length) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(GOLD_LIGHT.r, GOLD_LIGHT.g, GOLD_LIGHT.b);
        doc.text(bodyLines, margin + 10, cy);
        cy += bodyLines.length * 3.8 + 1;
      }
      if (freeLines.length) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
        doc.text(freeLines, margin + 10, cy);
        cy += freeLines.length * 3.8 + 2;
      }
      if (noteLines.length) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7.5);
        doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
        doc.text(noteLines, margin + 10, cy);
      }

      y += cardH + 3;
    };

    let ei = 0;
    while (ei < items.length) {
      const ex = items[ei];
      const isGrouped = !!ex.groupId && ((ei > 0 && items[ei - 1].groupId === ex.groupId) || (ei < items.length - 1 && items[ei + 1].groupId === ex.groupId));
      if (isGrouped && ex.groupId) {
        const gid = ex.groupId;
        let ej = ei;
        while (ej < items.length && items[ej].groupId === gid) ej++;
        ensureSpace(6);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(GOLD.r, GOLD.g, GOLD.b);
        doc.text((ex.groupLabel || "Superset").toUpperCase(), margin + 2, y + 3);
        y += 5.5;
        for (let k = ei; k < ej; k++) drawExerciceCard(items[k], k, true);
        ei = ej;
      } else {
        drawExerciceCard(ex, ei, false);
        ei += 1;
      }
    }

    y += 6;
  });

  drawFooter();

  const filenameSafe = clientName ? clientName.toLowerCase().replace(/[^a-z0-9]+/gi, "-") : "programme";
  doc.save(`samuel-coaching-${filenameSafe}.pdf`);
}
