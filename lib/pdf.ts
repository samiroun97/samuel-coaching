import { jsPDF } from "jspdf";
import { type ExerciceItem, parseExercices } from "@/lib/exercices";
const GYM_BG_B64 = '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';

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

export async function generateWeeklyReportPdf(data: WeeklyReportData) {
const doc = new jsPDF({ unit: "mm", format: "a4" });
  let hasBebasNeue = false;
  try {
    const _fr = await fetch("https://raw.githubusercontent.com/google/fonts/main/ofl/bebasneue/BebasNeue-Regular.ttf");
    if (_fr.ok) {
      const _buf = await _fr.arrayBuffer();
      const _arr = new Uint8Array(_buf);
      let _bin = ""; for (let _fi = 0; _fi < _arr.length; _fi++) _bin += String.fromCharCode(_arr[_fi]);
      doc.addFileToVFS("BebasNeue.ttf", btoa(_bin));
      doc.addFont("BebasNeue.ttf", "BebasNeue", "normal");
      hasBebasNeue = true;
    }
  } catch (_e) {}
const pageW = 210, pageH = 297, margin = 16;
let y = 0;

const fillBg = () => {
  doc.addImage('data:image/jpeg;base64,' + GYM_BG_B64, 'JPEG', 0, 0, pageW, pageH);
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

if (hasBebasNeue) {
    doc.setFont("BebasNeue", "normal");
    doc.setFontSize(38);
  } else {
    if (hasBebasNeue) {
      doc.setFont("BebasNeue", "normal");
      doc.setFontSize(38);
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(30);
    }
  }
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
