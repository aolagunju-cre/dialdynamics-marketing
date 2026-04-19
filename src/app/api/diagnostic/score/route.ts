import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { diagnosticSessions, accessLogs } from "@/lib/schema";
import { eq } from "drizzle-orm";

// Scoring rubric — challenge-specific
const SCORING_RUBRIC: Record<
  string,
  {
    opener: string;
    permissionBridge: string;
    discovery: string;
    objectionHandling: string;
    closing: string;
  }
> = {
  interrupted: {
    opener:
      "You introduced yourself clearly but didn't use a permission bridge — that's why you got cut off.",
    permissionBridge:
      "Strong permission bridge: 'I know you're busy, I promise this is worth 90 seconds' — this reframes your call as a gift, not a disruption.",
    discovery: "You asked one open-ended question — good start, but dig deeper.",
    objectionHandling: "When they pushed back, you stayed calm. Good recovery.",
    closing: "You went for the close too early without qualifying.",
  },
  hang_up: {
    opener:
      "Your opener was 38 seconds long. That's 3x too long. The first 8 seconds are all they give you.",
    permissionBridge:
      "No permission bridge = they feel ambushed. 'I know you're busy' changes everything.",
    discovery: "You made it to discovery but didn't ask the most important question first.",
    objectionHandling: "You didn't address their primary objection — you pivoted too fast.",
    closing: "You didn't ask for the meeting. If you don't ask, you don't get.",
  },
  freeze: {
    opener:
      "You started strong but lost momentum when she challenged you. That's normal — it's called active listening.",
    permissionBridge:
      "Your permission bridge was good. The freeze happened because you weren't ready for the pushback.",
    discovery: "You got flustered and skipped discovery entirely. Go back to basics.",
    objectionHandling:
      "You froze because you didn't have a rehearsed response to 'how did you get my number?' Have three answers ready.",
    closing: "No close attempt — which is fine at 30 seconds, but you need to set the next step.",
  },
  scripted: {
    opener:
      "You sounded like you were reading from a script because you were. Natural conversation doesn't rhyme.",
    permissionBridge:
      "Your tone was flat. Vary your pace — fast for energy, slow for emphasis.",
    discovery: "You asked the questions but didn't wait for the answers. Listen more than you talk.",
    objectionHandling: "You had a response ready but it didn't match what she actually said.",
    closing: "You rushed the close. Pause before asking for the meeting.",
  },
  interested: {
    opener:
      "You built rapport well — she sounded engaged. Good energy on the call.",
    permissionBridge:
      "Your opener was warm and confident. You made her curious.",
    discovery:
      "Strong discovery questions. You qualified her interest before pitching — that's the right order.",
    objectionHandling: "You handled the 'not interested' objection by asking why — smart move.",
    closing:
      "Good close attempt. Follow up with 'Would Tuesday or Thursday work better?' instead of 'Can we meet?'",
  },
};

function getScoreLabel(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A-";
  if (score >= 70) return "B+";
  if (score >= 60) return "B";
  if (score >= 50) return "B-";
  if (score >= 40) return "C+";
  if (score >= 30) return "C";
  return "D";
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, score, transcript, drillCompleted } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    // Get session to find challenge
    const [session] = await db
      .select()
      .from(diagnosticSessions)
      .where(eq(diagnosticSessions.id, sessionId))
      .limit(1);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Cap score at 0-100
    const cappedScore = Math.min(100, Math.max(0, score ?? 0));
    const scoreLabel = getScoreLabel(cappedScore);
    const rubric = SCORING_RUBRIC[session.challenge] || SCORING_RUBRIC.opener;

    // Calculate breakdown based on score
    const baseStrengths = [];
    const baseImprovements = [];

    if (cappedScore >= 50) {
      baseStrengths.push(rubric.permissionBridge);
    }
    if (cappedScore < 70) {
      baseImprovements.push(rubric.objectionHandling);
    }
    if (cappedScore < 50) {
      baseImprovements.push(rubric.opener);
    }

    // Update session
    await db
      .update(diagnosticSessions)
      .set({
        score: cappedScore,
        scoreLabel,
        transcript: transcript || null,
        drillCompleted: drillCompleted ?? false,
      })
      .where(eq(diagnosticSessions.id, sessionId));

    // Log event
    await db.insert(accessLogs).values({
      sessionId,
      event: "diagnostic_completed",
      metadata: { score: cappedScore, scoreLabel, drillCompleted },
    });

    return NextResponse.json({
      score: cappedScore,
      scoreLabel,
      breakdown: {
        strengths: baseStrengths,
        improvements: baseImprovements,
        nextDrill: rubric.opener,
      },
    });
  } catch (err) {
    console.error("Score error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
