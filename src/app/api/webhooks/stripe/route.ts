import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { createNotification } from "@/lib/actions/notifications";

/**
 * POST /api/webhooks/stripe
 *
 * Handles Stripe webhook events (payment confirmations, expirations).
 * Verifies the webhook signature using the admin's stored signing secret.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const sig = request.headers.get("stripe-signature");

    const supabase = getAdminSupabase();

    // 1. Load payment settings for secret key + webhook secret
    const { data: settings } = await supabase
      .from("payment_settings")
      .select("stripe_secret_key, stripe_webhook_secret")
      .limit(1)
      .single();

    if (!settings?.stripe_secret_key) {
      return NextResponse.json(
        { error: "Payment settings not configured" },
        { status: 400 }
      );
    }

    const stripe = new Stripe(settings.stripe_secret_key);

    // 2. Verify webhook signature (if webhook secret is configured)
    let event: Stripe.Event;

    if (settings.stripe_webhook_secret && sig) {
      try {
        event = stripe.webhooks.constructEvent(
          rawBody,
          sig,
          settings.stripe_webhook_secret
        );
      } catch (err) {
        console.error("[Stripe Webhook] Signature verification failed:", err);
        return NextResponse.json(
          { error: "Invalid webhook signature" },
          { status: 400 }
        );
      }
    } else {
      // No webhook secret configured — parse event directly (less secure)
      event = JSON.parse(rawBody) as Stripe.Event;
    }

    // 3. Handle event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Update payment record
        await supabase
          .from("payments")
          .update({
            status: "succeeded",
            stripe_payment_intent_id:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : null,
            customer_email: session.customer_details?.email ?? null,
          })
          .eq("stripe_session_id", session.id);

        // Update project status to "paid"
        const projectId = session.metadata?.project_id;
        if (projectId) {
          await supabase
            .from("projects")
            .update({ status: "paid" })
            .eq("id", projectId);

          // Notify admin
          const amountFormatted = session.amount_total
            ? `$${(session.amount_total / 100).toFixed(2)}`
            : "an invoice";

          await createNotification({
            projectId,
            type: "payment_received",
            title: `Payment of ${amountFormatted} received`,
            body: session.customer_details?.email
              ? `Paid by ${session.customer_details.email}`
              : null,
          });
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;

        await supabase
          .from("payments")
          .update({ status: "expired" })
          .eq("stripe_session_id", session.id);

        break;
      }

      default:
        // Unhandled event type — acknowledge but don't process
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[POST /api/webhooks/stripe]", err);
    return NextResponse.json(
      { error: "Webhook handler error" },
      { status: 500 }
    );
  }
}
