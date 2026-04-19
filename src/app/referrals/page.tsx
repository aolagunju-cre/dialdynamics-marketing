"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

function ReferralsPageInner() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") || "";
  const code = searchParams.get("code") || "";

  const [referralData, setReferralData] = useState<{
    referralCount: number;
    threshold: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const referralUrl = typeof window !== "undefined"
    ? `${window.location.origin}/join/${code}`
    : "";

  useEffect(() => {
    if (!code) return;
    fetch(`/api/referrals/${code}`)
      .then((r) => r.json())
      .then(setReferralData)
      .catch(() => {});
  }, [code]);

  async function copyLink() {
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function shareVia(channel: string) {
    const text = `I just scored ${Math.floor(Math.random() * 40 + 50)}% on my cold call opener. Take the test:`;
    const urls: Record<string, string> = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralUrl)}`,
      sms: `sms:?body=${encodeURIComponent(text + " " + referralUrl)}`,
      email: `mailto:?subject=Try DialDynamics&body=${encodeURIComponent(text + "\n\n" + referralUrl)}`,
    };

    if (channel === "linkedin" || channel === "twitter") {
      window.open(urls[channel], "_blank");
    } else if (channel === "sms" || channel === "email") {
      window.location.href = urls[channel];
    } else {
      copyLink();
    }
  }

  const count = referralData?.referralCount ?? 0;
  const threshold = referralData?.threshold ?? 3;
  const remaining = Math.max(0, threshold - count);

  return (
    <main className="min-h-screen bg-background">
      <header className="px-6 py-5 border-b border-border">
        <div className="max-w-sm mx-auto flex items-center justify-between">
          <button onClick={() => history.back()} className="text-sm text-text-muted">
            ← Back
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <span className="text-white text-xs font-bold">DD</span>
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 py-8 max-w-sm mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl">🔗</span>
          </div>
          <h1 className="font-heading text-xl font-bold mb-2">Your Referral Link</h1>
          <p className="text-sm text-text-muted">
            Share it. Every friend who signs up = +1 free call credit.
          </p>
        </div>

        {/* Link Card */}
        <Card className="p-4 mb-6">
          <p className="text-xs text-text-muted mb-2 font-medium">YOUR LINK</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-background border border-border rounded-lg px-3 py-2 overflow-hidden">
              <p className="text-sm font-mono text-text truncate">{referralUrl}</p>
            </div>
            <Button onClick={copyLink} size="sm" className="shrink-0 bg-accent hover:bg-accent-hover text-text">
              {copied ? "✓" : "📋"}
            </Button>
          </div>
        </Card>

        {/* Share Buttons */}
        <div className="grid grid-cols-4 gap-2 mb-8">
          {[
            { label: "SMS", icon: "💬", key: "sms" },
            { label: "Email", icon: "✉️", key: "email" },
            { label: "LinkedIn", icon: "💼", key: "linkedin" },
            { label: "Twitter", icon: "𝕏", key: "twitter" },
          ].map(({ label, icon, key }) => (
            <button
              key={key}
              onClick={() => shareVia(key)}
              className="flex flex-col items-center gap-1 p-3 border border-border rounded-xl hover:bg-accent/5 transition-colors"
            >
              <span>{icon}</span>
              <span className="text-xs text-text-muted">{label}</span>
            </button>
          ))}
        </div>

        {/* Progress */}
        <Card className="p-4 mb-6">
          <p className="text-xs text-text-muted mb-3 font-medium uppercase tracking-wide">
            Share to Unlock Full Access
          </p>
          <div className="flex gap-2 mb-3">
            {Array.from({ length: threshold }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-2 rounded-full ${i < count ? "bg-primary" : "bg-border"}`}
              />
            ))}
          </div>
          <p className="text-sm text-center font-medium">
            {remaining === 0 ? (
              <span className="text-green-600">✓ Full Access Unlocked!</span>
            ) : (
              <span>
                {remaining} more referral{remaining !== 1 ? "s" : ""} to unlock coaching
              </span>
            )}
          </p>
        </Card>

        {/* TikTok Tip */}
        <Card className="p-4 border-dashed border-primary/30 bg-primary/5">
          <p className="text-xs font-medium text-primary mb-1">💡 Tip from DialDynamics</p>
          <p className="text-sm text-text-muted leading-relaxed">
            Drop your link in a TikTok comment. Someone just posted about failing
            their cold call opener — they're probably looking for this.
          </p>
        </Card>
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

export default function ReferralsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ReferralsPageInner />
    </Suspense>
  );
}