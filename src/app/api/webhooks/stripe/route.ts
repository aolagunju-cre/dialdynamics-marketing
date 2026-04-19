import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { sessionAccess, accessLogs } from "@/lib/schema";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const key: string = process.env.STRIPE_SECRET_KEY ?? "";
  if (!key) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stripe = new Stripe(key as any);

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET ?? ""
    );
  } catch (err: any) {
    console.error("Webhook signature error:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const odSessionId = session.metadata?.sessionId;

    if (odSessionId) {
      await db.insert(sessionAccess).values({
        sessionId: odSessionId,
        accessType: "toolkit",
        stripePaymentId: session.id,
      });

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
