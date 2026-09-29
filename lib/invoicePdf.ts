import PDFDocument from "pdfkit";
import { SwissQRBill } from "swissqrbill/pdf";
import { isIBANValid, isQRIBAN, calculateQRReferenceChecksum } from "swissqrbill/utils";
import type { Invoice } from "@/lib/business";

// Rendu serveur (Node) d'une facture A4 avec QR-facture suisse (bulletin de versement) en bas
// de page — utilisé par /api/business/invoice-pdf.

const money = (n: number) => n.toLocaleString("fr-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const day = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("fr-CH", { day: "2-digit", month: "2-digit", year: "numeric" });

// Référence QR (27 chiffres, obligatoire avec un QR-IBAN) dérivée des chiffres du numéro de facture.
function qrReference(invoiceNumber: string) {
  const base = invoiceNumber.replace(/\D/g, "").slice(-26).padStart(26, "0");
  return base + calculateQRReferenceChecksum(base);
}

export function renderInvoice(inv: Invoice): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margins: { top: 50, bottom: 40, left: 50, right: 50 } });
    const chunks: Buffer[] = [];
    doc.on("data", c => chunks.push(c as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const s = inv.seller ?? { name: "" };
    const b = inv.buyer ?? { name: "" };
    const gold = "#b8963f";
    const left = 50, right = 545;

    // Émetteur
    doc.fillColor("#111").font("Helvetica-Bold").fontSize(14).text(s.name || "—", left, 50);
    doc.font("Helvetica").fontSize(9).fillColor("#444");
    const sellerLines = [
      [s.street, s.building_number].filter(Boolean).join(" "),
      [s.zip, s.city].filter(Boolean).join(" "),
      s.email, s.phone, s.vat_number ? `N° TVA ${s.vat_number}` : "",
    ].filter(Boolean) as string[];
    sellerLines.forEach(l => doc.text(l));

    // Destinataire
    doc.font("Helvetica").fontSize(10).fillColor("#111");
    const buyerLines = [
      b.name, [b.street, b.building_number].filter(Boolean).join(" "), [b.zip, b.city].filter(Boolean).join(" "), b.email,
    ].filter(Boolean) as string[];
    doc.text(buyerLines.join("\n"), 330, 130, { width: 215 });

    // Titre et dates
    doc.font("Helvetica-Bold").fontSize(20).fillColor(gold).text(`Facture ${inv.number}`, left, 230);
    doc.font("Helvetica").fontSize(9).fillColor("#444")
      .text(`Date : ${day(inv.issue_date)}${inv.due_date ? `     Échéance : ${day(inv.due_date)}` : ""}`, left, 258);

    // Tableau des prestations
    let y = 290;
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#111");
    doc.text("Prestation", left, y).text("Qté", 350, y, { width: 40, align: "right" })
      .text("Prix unit.", 395, y, { width: 70, align: "right" }).text("Montant", 470, y, { width: 75, align: "right" });
    y += 16;
    doc.moveTo(left, y - 4).lineTo(right, y - 4).lineWidth(0.5).strokeColor("#ccc").stroke();
    doc.font("Helvetica").fillColor("#222");
    for (const it of inv.items ?? []) {
      const amount = (Number(it.qty) || 0) * (Number(it.unit_price) || 0);
      const h = doc.heightOfString(it.label, { width: 290 });
      doc.text(it.label, left, y, { width: 290 })
        .text(String(it.qty), 350, y, { width: 40, align: "right" })
        .text(money(Number(it.unit_price) || 0), 395, y, { width: 70, align: "right" })
        .text(money(amount), 470, y, { width: 75, align: "right" });
      y += Math.max(h, 12) + 6;
    }
    doc.moveTo(left, y).lineTo(right, y).stroke();
    y += 8;
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#111")
      .text("Total CHF", 350, y, { width: 115, align: "right" }).text(money(inv.total_chf), 470, y, { width: 75, align: "right" });
    y += 16;
    doc.font("Helvetica").fontSize(8.5).fillColor("#555");
    if (s.vat_number && inv.vat_rate) {
      const vat = inv.total_chf * inv.vat_rate / (100 + inv.vat_rate);
      doc.text(`dont TVA ${inv.vat_rate} % : CHF ${money(vat)}`, 300, y, { width: 245, align: "right" });
    } else {
      doc.text("Non assujetti à la TVA", 300, y, { width: 245, align: "right" });
    }
    y += 24;

    if (inv.status === "payee") {
      doc.font("Helvetica-Bold").fontSize(12).fillColor("#4f9a7c").text(`PAYÉE${inv.paid_at ? ` le ${day(inv.paid_at)}` : ""}`, left, y);
      y += 20;
    } else if (inv.status === "annulee") {
      doc.font("Helvetica-Bold").fontSize(12).fillColor("#b05050").text("ANNULÉE", left, y);
      y += 20;
    }
    if (inv.notes) { doc.font("Helvetica").fontSize(9).fillColor("#444").text(inv.notes, left, y, { width: 495 }); y = doc.y + 10; }
    if (s.iban && inv.status === "emise") {
      doc.font("Helvetica").fontSize(9).fillColor("#444")
        .text(`Merci de régler ce montant${inv.due_date ? ` d'ici au ${day(inv.due_date)}` : ""} avec le bulletin QR ci-dessous (app bancaire ou TWINT).`, left, y, { width: 495 });
    }

    // QR-facture (bulletin de versement suisse) : seulement si l'IBAN est valable et la facture à payer.
    const iban = (s.iban ?? "").replace(/\s/g, "");
    if (inv.status === "emise" && iban && isIBANValid(iban) && s.zip && s.city && s.street) {
      const hasBuyerAddress = !!(b.name && b.street && b.zip && b.city);
      const qr = new SwissQRBill({
        currency: "CHF",
        amount: inv.total_chf > 0 ? Math.round(inv.total_chf * 100) / 100 : undefined,
        creditor: {
          account: iban, name: s.name.slice(0, 70), address: s.street.slice(0, 70),
          buildingNumber: s.building_number || undefined, zip: s.zip, city: s.city.slice(0, 35), country: s.country || "CH",
        },
        debtor: hasBuyerAddress ? {
          name: b.name.slice(0, 70), address: (b.street ?? "").slice(0, 70), buildingNumber: b.building_number || undefined,
          zip: b.zip ?? "", city: (b.city ?? "").slice(0, 35), country: b.country || "CH",
        } : undefined,
        reference: isQRIBAN(iban) ? qrReference(inv.number) : undefined,
        message: `Facture ${inv.number}`.slice(0, 140),
      }, { language: "FR" });
      qr.attachTo(doc);
    }

    doc.end();
  });
}
