"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function JoinPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "";
  const [referrer, setReferrer] = useState<{
    referralCount: number;
    threshold: number;
    valid: boolean;
  } | null>(null);

  useEffect(() => {
    if (!code) return;
    fetch(`/api/referrals/${code}`)
      .then((r) => r.json())
      .then(setReferrer)
      .catch(() => setReferrer({ valid: false, referralCount: 0, threshold: 3 }));
  }, [code]);

  if (referrer === null) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-text-muted text-sm">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold">DD</span>
          </div>
          <span className="font-heading font-semibold text-primary text-xl">
            DialDynamics
          </span>
        </div>

        <div className="w-20 h-20 rounded-full bg-primary/10 mx-auto mb-6 flex items-center justify-center text-4xl">
          👋
        </div>

        <h1 className="font-heading text-2xl font-bold text-text mb-3">
          Someone thinks you'd benefit from this.
        </h1>
        <p className="text-text-muted mb-8 leading-relaxed">
          They took the DialDynamics cold call test and scored{" "}
          {referrer.valid
            ? `${referrer.referralCount} referral${referrer.referralCount !== 1 ? "s" : ""} in`
            : ""}{" "}
          their practice calls. Take it yourself — it's free and takes 30 seconds.
        </p>

        <Button
          onClick={() => router.push(`/?ref=${code}`)}
          className="w-full h-14 bg-accent hover:bg-accent-hover text-text font-semibold text-base rounded-xl mb-4"
        >
          TAKE THE FREE TEST →
        </Button>

        <p className="text-xs text-text-muted">
          Free diagnostic · 30 seconds · AI prospect
        </p>

        {referrer.valid && referrer.referralCount >= 3 && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-sm text-green-700 font-medium">
              🎉 This person unlocked full coaching!
            </p>
          </div>
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

export default function JoinPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <JoinPageInner />
    </Suspense>
  );
}