import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { sessionAccess, accessLogs } from "@/lib/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature error:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const odSessionId = session.metadata?.sessionId;

    if (odSessionId) {
      // Grant toolkit access
      await db.insert(sessionAccess).values({
        sessionId: odSessionId,
        accessType: "toolkit",
        stripePaymentId: session.id,
      });

      // Log event
      await db.insert(accessLogs).values({
        sessionId: odSessionId,
        event: "toolkit_purchased",
        metadata: {
          paymentId: session.id,
          amount: session.amount_total,
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
