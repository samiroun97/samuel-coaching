import { jsPDF } from "jspdf";
import { type ExerciceItem, parseExercices } from "@/lib/exercices";

type CoachSeance = { titre: string; type_seance: string | null; date_prevue: string | null; semaine?: number | null; description: string | null; exercices: string | null };

const GOLD = { r: 201, g: 168, b: 76 };
const GOLD_LIGHT = { r: 226, g: 201, b: 126 };
const WHITE = { r: 255, g: 255, b: 255 };
const GRAY = { r: 155, g: 155, b: 155 };
const GRAY_DIM = { r: 95, g: 95, b: 95 };
const BG = { r: 9, g: 9, b: 9 };
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

  const fillBg = () => { doc.setFillColor(BG.r, BG.g, BG.b); doc.rect(0, 0, pageW, pageH, "F"); };

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

const GREEN = { r: 126, g: 184, b: 160 };
const RED   = { r: 224, g: 112, b: 112 };

export type ReportSection = { point_fort: string; point_faible: string; conseil: string };

export type WeeklyReportData = {
  clientName?: string;
  weekStart: string;
  weekEnd: string;
  daysLogged: number;
  avgCalories: number;
  goalCalories: number;
  avgTdee: number;
  balanceStatus: "deficit" | "surplus" | "maintenance";
  balancePerDay: number;
  avgProteines: number;
  goalProteines: number;
  avgGlucides: number;
  goalGlucides: number;
  avgLipides: number;
  goalLipides: number;
  sessionsCount: number;
  targetSessions: number | null;
  totalTrainingMinutes: number;
  restDays: number;
  avgSteps: number;
  stepsGoal: number;
  weightStart: number | null;
  weightEnd: number | null;
  objectifs?: string | null;
  nutrition: ReportSection;
  neat: ReportSection;
  eat: ReportSection;
};

export function generateWeeklyReportPdf(data: WeeklyReportData) {
const doc = new jsPDF({ unit: "mm", format: "a4" });
const pageW = 210, pageH = 297, margin = 16;
let y = 0;

const fillBg = () => { doc.setFillColor(BG.r, BG.g, BG.b); doc.rect(0, 0, pageW, pageH, "F"); };
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
if (y + needed > pageH - 20) { drawFooter(); doc.addPage(); fillBg(); y = margin; }
};

fillBg();

// ── En-tête premium ──
doc.setFillColor(13, 13, 13);
doc.rect(0, 0, pageW, 62, "F");
doc.setFillColor(GOLD.r, GOLD.g, GOLD.b);
doc.rect(0, 0, 5, 62, "F");
doc.setFillColor(GOLD.r, GOLD.g, GOLD.b);
doc.rect(0, 61.5, pageW, 0.8, "F");
doc.setFillColor(30, 25, 10);
doc.rect(pageW - 60, 0, 60, 62, "F");
doc.setDrawColor(GOLD.r, GOLD.g, GOLD.b);
doc.setLineWidth(0.3);
doc.line(pageW - 60, 0, pageW - 60, 62);

doc.setFont("helvetica", "bold");
doc.setFontSize(30);
doc.setTextColor(WHITE.r, WHITE.g, WHITE.b);
doc.text("BILAN", 12, 24);
const bilanW = doc.getTextWidth("BILAN");
doc.setTextColor(GOLD.r, GOLD.g, GOLD.b);
doc.text(" HEBDOMADAIRE", 12 + bilanW, 24);

doc.setDrawColor(GOLD.r, GOLD.g, GOLD.b);
doc.setLineWidth(0.3);
doc.line(12, 28, pageW - 65, 28);

const fmtDate = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
doc.setFont("helvetica", "normal");
doc.setFontSize(11);
doc.setTextColor(WHITE.r, WHITE.g, WHITE.b);
doc.text(data.clientName ? `Préparé pour ${data.clientName}` : "Bilan personnalisé", 12, 38);
doc.setFontSize(9);
doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
doc.text(`${fmtDate(data.weekStart)} — ${fmtDate(data.weekEnd)}`, 12, 46);
if (data.objectifs) {
doc.setFontSize(8);
doc.setFont("helvetica", "bold");
doc.setTextColor(GOLD.r, GOLD.g, GOLD.b);
doc.text(data.objectifs.toUpperCase(), 12, 56);
}
doc.setFont("helvetica", "normal");
doc.setFontSize(7.5);
doc.setTextColor(GRAY_DIM.r, GRAY_DIM.g, GRAY_DIM.b);
doc.text(new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }), pageW - 8, 54, { align: "right" });

y = 72;

// ── Carte résultat semaine ──
const statusColor = data.balanceStatus === "surplus" ? RED : data.balanceStatus === "deficit" ? GREEN : GOLD;
const statusLabel = data.balanceStatus === "surplus" ? "SURPLUS CALORIQUE" : data.balanceStatus === "deficit" ? "DÉFICIT CALORIQUE" : "MAINTIEN CALORIQUE";
const weekConsumed = data.avgCalories * 7;
const weekBurned = data.avgTdee * 7;
const weekBalance = weekConsumed - weekBurned;
const cardH = 42;
ensureSpace(cardH + 4);
doc.setFillColor(CARD_BG.r, CARD_BG.g, CARD_BG.b);
doc.setDrawColor(statusColor.r, statusColor.g, statusColor.b);
doc.setLineWidth(0.3);
doc.roundedRect(margin, y, pageW - margin * 2, cardH, 1.5, 1.5, "FD");
doc.setFillColor(statusColor.r, statusColor.g, statusColor.b);
doc.rect(margin, y + 1, 3.5, cardH - 2, "F");
doc.setFont("helvetica", "bold");
doc.setFontSize(8);
doc.setTextColor(GRAY_DIM.r, GRAY_DIM.g, GRAY_DIM.b);
doc.text("RÉSULTAT DE LA SEMAINE", margin + 9, y + 8);
doc.setFontSize(19);
doc.setTextColor(statusColor.r, statusColor.g, statusColor.b);
doc.text(statusLabel, margin + 9, y + 18);
doc.setFont("helvetica", "normal");
doc.setFontSize(10);
doc.setTextColor(WHITE.r, WHITE.g, WHITE.b);
doc.text(`${data.balancePerDay > 0 ? "+" : ""}${fmtInt(data.balancePerDay)} kcal / jour`, pageW - margin - 8, y + 18, { align: "right" });
doc.setDrawColor(CARD_BORDER.r, CARD_BORDER.g, CARD_BORDER.b);
doc.setLineWidth(0.15);
doc.line(margin + 9, y + 23, pageW - margin - 8, y + 23);
const subW = (pageW - margin * 2 - 17) / 3;
[
{ label: "BRÛLÉES / SEMAINE", value: `${fmtInt(weekBurned)} kcal` },
{ label: "CONSOMMÉES / SEMAINE", value: `${fmtInt(weekConsumed)} kcal` },
{ label: "BILAN TOTAL", value: `${weekBalance > 0 ? "+" : ""}${fmtInt(weekBalance)} kcal`, hi: true },
].forEach((s, i) => {
const x = margin + 9 + i * subW;
doc.setFont("helvetica", "normal");
doc.setFontSize(6.5);
doc.setTextColor(GRAY_DIM.r, GRAY_DIM.g, GRAY_DIM.b);
doc.text(s.label, x, y + 29);
doc.setFont("helvetica", "bold");
doc.setFontSize(11);
const c = s.hi ? statusColor : WHITE;
doc.setTextColor(c.r, c.g, c.b);
doc.text(s.value, x, y + 37);
});
y += cardH + 7;

// ── Stats en grille 3 colonnes ──
const statsGrid: { label: string; value: string; gold?: boolean }[] = [
{ label: "CALORIES / JOUR", value: `${fmtInt(data.avgCalories)} kcal`, gold: true },
{ label: "SÉANCES", value: data.targetSessions ? `${data.sessionsCount} / ${data.targetSessions}` : `${data.sessionsCount}`, gold: true },
{ label: "JOURS DE REPOS", value: `${data.restDays} / 7` },
{ label: "OBJECTIF TDEE", value: `${fmtInt(data.avgTdee)} kcal` },
{ label: "PAS / JOUR", value: fmtInt(data.avgSteps), gold: true },
{ label: "POIDS", value: data.weightStart !== null && data.weightEnd !== null ? `${data.weightStart} -> ${data.weightEnd} kg` : "—" },
];
const gc = 3, gW = (pageW - margin * 2 - (gc - 1) * 4) / gc, gRH = 20;
const gRows = Math.ceil(statsGrid.length / gc);
ensureSpace(gRows * gRH + 4);
statsGrid.forEach((s, i) => {
const col = i % gc, row = Math.floor(i / gc);
const x = margin + col * (gW + 4), sy = y + row * gRH;
doc.setFillColor(CARD_BG.r, CARD_BG.g, CARD_BG.b);
doc.setDrawColor(s.gold ? GOLD.r : CARD_BORDER.r, s.gold ? GOLD.g : CARD_BORDER.g, s.gold ? GOLD.b : CARD_BORDER.b);
doc.setLineWidth(s.gold ? 0.3 : 0.2);
doc.roundedRect(x, sy, gW, gRH - 4, 1, 1, "FD");
doc.setFont("helvetica", "normal");
doc.setFontSize(6.5);
doc.setTextColor(GRAY_DIM.r, GRAY_DIM.g, GRAY_DIM.b);
doc.text(s.label, x + 5, sy + 6);
doc.setFont("helvetica", "bold");
doc.setFontSize(12);
doc.setTextColor(s.gold ? GOLD.r : WHITE.r, s.gold ? GOLD.g : WHITE.g, s.gold ? GOLD.b : WHITE.b);
doc.text(s.value, x + 5, sy + 14);
});
y += gRows * gRH + 7;

// ── Feedback qualitatif ──
const domains: { title: string; section: ReportSection }[] = [
{ title: "NUTRITION", section: data.nutrition },
{ title: "ACTIVITÉ QUOTIDIENNE", section: data.neat },
{ title: "ENTRAÎNEMENT", section: data.eat },
];
domains.forEach(({ title, section }) => {
ensureSpace(14);
doc.setFillColor(GOLD.r, GOLD.g, GOLD.b);
doc.rect(margin, y, 3, 8, "F");
doc.setFont("helvetica", "bold");
doc.setFontSize(11);
doc.setTextColor(GOLD.r, GOLD.g, GOLD.b);
doc.text(title, margin + 7, y + 6.5);
const tw = doc.getTextWidth(title);
doc.setDrawColor(CARD_BORDER.r, CARD_BORDER.g, CARD_BORDER.b);
doc.setLineWidth(0.15);
doc.line(margin + 7 + tw + 4, y + 4, pageW - margin, y + 4);
y += 12;
const rows: { label: string; text: string; color: typeof GOLD }[] = [
{ label: "POINT FORT", text: section.point_fort, color: GREEN },
{ label: "A AMELIORER", text: section.point_faible, color: RED },
{ label: "CONSEIL", text: section.conseil, color: GOLD },
];
rows.forEach(f => {
const lines = doc.splitTextToSize(f.text, pageW - margin * 2 - 14);
const h = 10 + lines.length * 4.5;
ensureSpace(h + 3);
doc.setFillColor(f.color.r, f.color.g, f.color.b);
doc.rect(margin, y, 2.5, h - 4, "F");
doc.setFont("helvetica", "bold");
doc.setFontSize(7.5);
doc.setTextColor(f.color.r, f.color.g, f.color.b);
doc.text(f.label, margin + 6, y + 5);
doc.setFont("helvetica", "normal");
doc.setFontSize(9.5);
doc.setTextColor(WHITE.r, WHITE.g, WHITE.b);
doc.text(lines, margin + 6, y + 11);
y += h + 3;
});
y += 5;
});

drawFooter();
const filenameSafe = data.clientName ? data.clientName.toLowerCase().replace(/[^a-z0-9]+/gi, "-") : "bilan";
doc.save(`samuel-coaching-bilan-${filenameSafe}-${data.weekStart}.pdf`);
}
