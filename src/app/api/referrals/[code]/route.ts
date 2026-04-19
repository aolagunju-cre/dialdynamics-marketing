import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { referrals } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const [referral] = await db
    .select()
    .from(referrals)
    .where(eq(referrals.code, code.toUpperCase()))
    .limit(1);

  if (!referral) {
    return NextResponse.json({ valid: false }, { status: 404 });
  }

  return NextResponse.json({
    valid: true,
    referralCount: referral.referralCount || 0,
    threshold: 3,
    hasUnlocked: referral.hasUnlocked || false,
  });
}
