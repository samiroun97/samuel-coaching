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
