import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { diagnosticSessions, referrals, accessLogs, sessionAccess } from "@/lib/schema";
import { eq } from "drizzle-orm";

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    const { challenge, persona, referralCode } = await req.json();

    if (!challenge || !persona) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Check if referrer code exists and credit it
    if (referralCode) {
      const [referrer] = await db
        .select()
        .from(referrals)
        .where(eq(referrals.code, referralCode.toUpperCase()))
        .limit(1);

      if (referrer) {
        const newCount = (referrer.referralCount || 0) + 1;
        await db
          .update(referrals)
          .set({ referralCount: newCount })
          .where(eq(referrals.code, referralCode.toUpperCase()));

        // If 3 referrals reached, unlock
        if (newCount >= 3 && !referrer.hasUnlocked) {
          await db
            .update(referrals)
            .set({ hasUnlocked: true })
            .where(eq(referrals.code, referralCode.toUpperCase()));

          if (referrer.sessionId) {
            await db.insert(sessionAccess).values({
              sessionId: referrer.sessionId,
              accessType: "referral_3",
            });
          }
        }
      }
    }

    // Create session
    const [session] = await db
      .insert(diagnosticSessions)
      .values({
        challenge,
        persona,
        referralCodeUsed: referralCode?.toUpperCase() || null,
        ipAddress: req.headers.get("x-forwarded-for") || null,
      })
      .returning();

    // Create referral code for this session
    const code = generateCode();
    await db.insert(referrals).values({
      code,
      sessionId: session.id,
      challenge,
    });

    // Log event
    await db.insert(accessLogs).values({
      sessionId: session.id,
      event: "diagnostic_started",
      metadata: { challenge, persona, referralCode },
    });

    return NextResponse.json({
      sessionId: session.id,
      referralCode: code,
    });
  } catch (err) {
    console.error("Session create error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
