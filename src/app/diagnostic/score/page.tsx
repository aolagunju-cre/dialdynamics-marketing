"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

function ScoreRing({ score, scoreLabel }: { score: number; scoreLabel: string }) {
  const circumference = 2 * Math.PI * 66;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "#059669" : score >= 50 ? "#F5B800" : "#DC2626";

  return (
    <div className="score-ring mx-auto mb-4">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle
          className="score-ring-bg"
          cx="80"
          cy="80"
          r="66"
        />
        <circle
          className="score-ring-fill"
          cx="80"
          cy="80"
          r="66"
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-4xl font-bold" style={{ color }}>
          {score}%
        </span>
        <span className="text-sm text-text-muted font-medium">{scoreLabel}</span>
      </div>
    </div>
  );
}

const CHALLENGE_LABELS: Record<string, string> = {
  interrupted: "I get interrupted before I finish my opener",
  hang_up: "They hang up after 10 seconds",
  freeze: 'I freeze when they ask "how did you get my number?"',
  scripted: "I sound scripted and they can tell",
  interested: "I can't tell if they're actually interested",
};

function ScorePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("sessionId") || "";
  const referralCode = searchParams.get("referralCode") || "";
  const score = parseInt(searchParams.get("score") || "0");
  const challenge = searchParams.get("challenge") || "interrupted";
  const [showDrill, setShowDrill] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const scoreLabel =
    score >= 90 ? "A+" : score >= 80 ? "A-" : score >= 70 ? "B+" : score >= 60 ? "B" : score >= 50 ? "B-" : score >= 40 ? "C+" : "D";

  function handleDrillComplete() {
    setShowDrill(false);
    setShowPaywall(true);
  }

  async function handleShareUnlock() {
    const url = `${window.location.origin}/join/${referralCode}`;
    if (navigator.share) {
      await navigator.share({
        title: "My DialDynamics Score",
        text: `I scored ${score}% on my cold call opener. Take the test: ${url}`,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copied! Share it with a friend.");
    }
    window.location.href = `/referrals?sessionId=${sessionId}&code=${referralCode}`;
  }

  async function handlePay() {
    try {
      const res = await fetch("/api/pay/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      console.error("Checkout error:", e);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-6 py-5 text-center border-b border-border">
        <h1 className="font-heading text-lg font-semibold">Your Score</h1>
      </header>

      <div className="px-6 py-8 max-w-sm mx-auto">
        {/* Score Ring */}
        <ScoreRing score={score} scoreLabel={scoreLabel} />

        <p className="text-center text-text-muted text-sm mb-6">
          Cold call opener · {CHALLENGE_LABELS[challenge] || CHALLENGE_LABELS.interrupted}
        </p>

        {/* Strengths & Improvements */}
        <div className="space-y-3 mb-6">
          {score >= 50 && (
            <Card className="p-4 border-green-200 bg-green-50">
              <p className="text-sm font-medium text-green-700 flex items-start gap-2">
                <span>✓</span>
                Permission bridge: You created enough urgency to keep them on the line.
              </p>
            </Card>
          )}
          {score < 80 && (
            <Card className="p-4 border-red-200 bg-red-50">
              <p className="text-sm font-medium text-red-700 flex items-start gap-2">
                <span>✗</span>
                Your monologue was too long. Top performers keep individual points under 20 seconds.
              </p>
            </Card>
          )}
          {score < 60 && (
            <Card className="p-4 border-red-200 bg-red-50">
              <p className="text-sm font-medium text-red-700 flex items-start gap-2">
                <span>✗</span>
                You didn't ask a discovery question. Never pitch before you qualify.
              </p>
            </Card>
          )}
        </div>

        {/* The Fix */}
        <Card className="p-4 mb-6 border-primary/20 bg-primary/5">
          <p className="text-xs text-primary font-semibold mb-1 uppercase tracking-wide">
            The Fix
          </p>
          <p className="text-sm text-text leading-relaxed">
            30-second monologue. That kills calls. Try this instead:
          </p>
          <div className="mt-3 p-3 bg-white rounded-lg border border-primary/20">
            <p className="text-sm font-medium text-primary italic">
              "I know you're busy — I promise this is worth 90 seconds. Can I explain why I called?"
            </p>
          </div>
        </Card>

        {!showDrill && !showPaywall && (
          <Button
            onClick={() => setShowDrill(true)}
            className="w-full h-12 bg-accent hover:bg-accent-hover text-text font-semibold"
          >
            TRY THE FIX IN 30 SECONDS →
          </Button>
        )}

        {/* 30-second Drill */}
        {showDrill && (
          <div className="text-center">
            <p className="text-sm font-medium mb-4">
              Say the permission bridge out loud, then add your opener:
            </p>
            <Card className="p-6 mb-4">
              <p className="text-sm text-text-muted mb-2">You:</p>
              <p className="font-medium text-text leading-relaxed">
                "I know you're busy — I promise this is worth 90 seconds. Can I explain why I called?"
              </p>
              <p className="text-sm text-text-muted mt-3 mb-2">Then add:</p>
              <p className="font-medium text-text leading-relaxed">
                "I'm calling because most sales teams we work with..."
              </p>
            </Card>
            <Button
              onClick={handleDrillComplete}
              className="w-full h-12 bg-accent hover:bg-accent-hover text-text font-semibold"
            >
              THAT FELT DIFFERENT →
            </Button>
          </div>
        )}

        {/* Paywall */}
        {showPaywall && (
          <div>
            {/* Blurred preview */}
            <div className="paywall-blur mb-4 rounded-xl overflow-hidden">
              <div className="p-4 bg-white/50">
                <p className="text-sm font-medium text-text mb-2">
                  Full Coaching Report
                </p>
                <p className="text-xs text-text-muted leading-relaxed">
                  Step-by-step monologue breakdown... objection handling scripts...
                  discovery question framework... closing technique...
                </p>
              </div>
              <div className="paywall-overlay">
                <div className="text-center px-6">
                  <p className="text-sm font-medium text-text mb-1">
                    Unlock full coaching
                  </p>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-3">
              <Button
                onClick={handlePay}
                className="w-full h-12 bg-accent hover:bg-accent-hover text-text font-semibold"
              >
                GET THE TOOLKIT — $47
              </Button>

              <Button
                onClick={handleShareUnlock}
                variant="outline"
                className="w-full h-12 border-primary text-primary hover:bg-primary/5"
              >
                SHARE TO UNLOCK — {referralCode ? "3/3 referrals" : "Free"}
              </Button>

              <p className="text-center text-xs text-text-muted">
                Or $3/week — cancel anytime
              </p>
            </div>
          </div>
        )}

        {!showDrill && !showPaywall && (
          <button
            onClick={() => setShowPaywall(true)}
            className="w-full mt-4 text-sm text-text-muted hover:text-text underline"
          >
            Skip drill — see pricing
          </button>
        )}
      </div>
    </main>
  );
}

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse text-lg">Loading...</div>
    </div>
  );
}

export default function ScorePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ScorePageInner />
    </Suspense>
  );
}