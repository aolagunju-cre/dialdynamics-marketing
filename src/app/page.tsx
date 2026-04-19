"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const CHALLENGES = [
  {
    id: "interrupted",
    icon: "🔇",
    title: "I get interrupted before I finish my opener",
    description: "They cut me off before I can deliver my pitch",
  },
  {
    id: "hang_up",
    icon: "📵",
    title: "They hang up after 10 seconds",
    description: "I lose them immediately and don't know why",
  },
  {
    id: "freeze",
    icon: "😬",
    title: 'I freeze when they ask "how did you get my number?"',
    description: "I'm not ready for the first pushback",
  },
  {
    id: "scripted",
    icon: "🎭",
    title: "I sound scripted and they can tell",
    description: "I rehearse too much and it comes off fake",
  },
  {
    id: "interested",
    icon: "🤔",
    title: "I can't tell if they're actually interested",
    description: "I pitch but can't read the room",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    if (!selected) return;
    setLoading(true);

    // Check for referral code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get("ref");

    try {
      const res = await fetch("/api/diagnostic/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge: selected,
          persona: "sarah",
          referralCode: refCode,
        }),
      });
      const data = await res.json();
      router.push(`/diagnostic/call?sessionId=${data.sessionId}&referralCode=${data.referralCode}&challenge=${selected}&persona=sarah`);
    } catch {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between max-w-xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">DD</span>
          </div>
          <span className="font-heading font-semibold text-primary text-lg">
            DialDynamics
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 pt-8 pb-12 max-w-xl mx-auto text-center">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-text mb-4 leading-tight">
          Most cold calls fail in the{" "}
          <span className="text-primary">first 10 seconds.</span>
          <br />
          Here's why.
        </h1>
        <p className="text-text-muted text-base md:text-lg mb-8">
          Take a 30-second practice call with an AI prospect. Get scored
          instantly. Find out exactly what's costing you the call.
        </p>

        {/* Challenge Selector */}
        <Card className="p-6 text-left border-border shadow-sm">
          <p className="text-sm font-medium text-text mb-4">
            Which sounds most like you?
          </p>
          <div className="space-y-3">
            {CHALLENGES.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`challenge-option ${selected === c.id ? "selected" : ""}`}
              >
                <span className="text-2xl mt-0.5">{c.icon}</span>
                <div>
                  <p className="font-medium text-sm text-text">{c.title}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {c.description}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <Button
            onClick={handleStart}
            disabled={!selected || loading}
            className="w-full mt-6 bg-accent hover:bg-accent-hover text-text font-semibold h-12 text-base"
          >
            {loading ? "Starting..." : "START FREE CALL →"}
          </Button>
          <p className="text-center text-xs text-text-muted mt-3">
            30 seconds · AI prospect · No signup required
          </p>
        </Card>
      </section>

      {/* How it works */}
      <section className="px-6 py-12 bg-white border-t border-border">
        <div className="max-w-xl mx-auto">
          <h2 className="font-heading text-xl font-semibold text-center mb-8">
            How it works
          </h2>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl mb-2">🎯</div>
              <p className="text-sm font-medium">Pick your challenge</p>
              <p className="text-xs text-text-muted mt-1">
                We match you with the right AI prospect
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">📞</div>
              <p className="text-sm font-medium">Take a 30-second call</p>
              <p className="text-xs text-text-muted mt-1">
                Real AI. Real scenario. Real pressure.
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">📊</div>
              <p className="text-sm font-medium">Get your score</p>
              <p className="text-xs text-text-muted mt-1">
                Instant breakdown. Specific fix. Free.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing mention */}
      <section className="px-6 py-10 text-center">
        <p className="text-sm text-text-muted mb-2">
          After your free call:
        </p>
        <p className="font-heading text-lg font-semibold">
          Unlock full coaching for{" "}
          <span className="text-primary">$47</span> — or share to unlock for
          free
        </p>
      </section>

      <footer className="px-6 py-6 text-center text-xs text-text-muted border-t border-border">
        <p>© 2026 DialDynamics. All rights reserved.</p>
      </footer>
    </main>
  );
}
