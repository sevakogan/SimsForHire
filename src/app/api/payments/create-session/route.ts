import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { calculateInvoiceTotals } from "@/lib/invoice-calculations";
import type { DiscountType } from "@/types";

/**
 * POST /api/payments/create-session
 *
 * Creates a Stripe Checkout Session for a project invoice.
 * Authenticated via share token (no user session required).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shareToken, projectId } = body as {
      shareToken: string;
      projectId: string;
    };

    if (!shareToken || !projectId) {
      return NextResponse.json(
        { error: "Missing shareToken or projectId" },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabase();

    // 1. Validate share token matches project
    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("share_token", shareToken)
      .single();

    if (!project) {
      return NextResponse.json(
        { error: "Invalid project or share token" },
        { status: 404 }
      );
    }

    // Don't allow payment if already paid
    if (project.status === "paid") {
      return NextResponse.json(
        { error: "This invoice has already been paid" },
        { status: 400 }
      );
    }

    // 2. Load payment settings
    const { data: settings } = await supabase
      .from("payment_settings")
      .select("*")
      .limit(1)
      .single();

    if (!settings?.payments_enabled || !settings.stripe_secret_key) {
      return NextResponse.json(
        { error: "Online payments are not configured" },
        { status: 400 }
      );
    }

    // 3. Calculate invoice total from items
    const { data: items } = await supabase
      .from("items")
      .select("retail_price, retail_shipping, quantity, category, price_sold_for")
      .eq("project_id", projectId);

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "No items on this invoice" },
        { status: 400 }
      );
    }

    const itemsTotal = items.reduce((sum, i) => {
      const cat = (i.category as string) ?? "product";
      if (cat === "service") return sum;
      return sum + Number(i.price_sold_for ?? i.retail_price) * (i.quantity ?? 1);
    }, 0);

    const serviceRetailTotal = items.reduce((sum, i) => {
      const cat = (i.category as string) ?? "product";
      if (cat !== "service") return sum;
      return sum + Number(i.price_sold_for ?? i.retail_price) * (i.quantity ?? 1);
    }, 0);

    const shippingTotal = items.reduce(
      (sum, i) => sum + Number(i.retail_shipping) * (i.quantity ?? 1),
      0
    );

    const deliveryTotal = serviceRetailTotal + shippingTotal;

    const discountType = (project.discount_type ?? "percent") as DiscountType;
    const discountPercent = Number(project.discount_percent) || 0;
    const discountAmount = Number(project.discount_amount) || 0;
    const taxPercent = Number(project.tax_percent) || 0;

    const totals = calculateInvoiceTotals({
      itemsTotal,
      deliveryTotal,
      discountType,
      discountPercent,
      discountValue: discountAmount,
      taxPercent,
    });

    const grandTotalCents = Math.round(totals.grandTotal * 100);

    if (grandTotalCents <= 0) {
      return NextResponse.json(
        { error: "Invoice total must be greater than $0" },
        { status: 400 }
      );
    }

    // 4. Create Stripe instance with admin's stored keys
    const stripe = new Stripe(settings.stripe_secret_key);

    // 5. Determine origin for redirect URLs
    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const invoiceLabel = project.invoice_number
      ? `Invoice #${project.invoice_number}`
      : project.name;

    // 6. Create Checkout Session
    // Omit payment_method_types so Stripe dynamically shows all methods
    // enabled in the Stripe Dashboard (Affirm, Klarna, Apple Pay, etc.)
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: invoiceLabel,
              description: `Payment for ${project.name}`,
            },
            unit_amount: grandTotalCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/share/${shareToken}/payments?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/share/${shareToken}/payments?status=cancel`,
      metadata: {
        project_id: projectId,
        share_token: shareToken,
      },
    });

    // 7. Create payment record in DB
    await supabase.from("payments").insert({
      project_id: projectId,
      stripe_session_id: session.id,
      amount: grandTotalCents,
      currency: "usd",
      status: "pending",
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[POST /api/payments/create-session]", err);
    const message =
      err instanceof Error ? err.message : "Failed to create payment session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
