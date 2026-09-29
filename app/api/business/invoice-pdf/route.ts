import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireUser } from "@/lib/apiAuth";
import type { Invoice } from "@/lib/business";
import { renderInvoice } from "@/lib/invoicePdf";

export const runtime = "nodejs";

// PDF d'une facture (A4) avec QR-facture suisse en bas de page, pour le coach émetteur ou le
// client destinataire. Coordonnées figées dans la facture (seller/buyer), jamais relues du profil.
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const { invoiceId } = await req.json();
    if (!invoiceId) return NextResponse.json({ error: "invoiceId manquant" }, { status: 400 });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY manquante côté serveur" }, { status: 500 });
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

    const { data: inv } = await admin.from("invoices").select("*").eq("id", invoiceId).maybeSingle();
    if (!inv) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
    const invoice = inv as Invoice;
    const { data: coach } = await admin.from("coaches").select("profile_id").eq("id", invoice.coach_id).maybeSingle();
    if (coach?.profile_id !== user.id && invoice.client_id !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const pdf = await renderInvoice(invoice);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="facture-${invoice.number}.pdf"`,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, { status: 500 });
  }
}
