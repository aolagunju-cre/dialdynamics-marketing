"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function PaySuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id") || "";
  const [accessGranted, setAccessGranted] = useState(false);

  useEffect(() => {
    if (sessionId) {
      // Access is granted via webhook - this page just confirms
      setAccessGranted(true);
    }
  }, [sessionId]);

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 mx-auto mb-6 flex items-center justify-center">
          <span className="text-4xl">✓</span>
        </div>
        <h1 className="font-heading text-2xl font-bold mb-3">You're in!</h1>
        <p className="text-text-muted mb-8 leading-relaxed">
          Your toolkit is ready. Check your email for access instructions and your
          receipt.
        </p>

        <Button
          onClick={() => window.location.href = "/diagnostic"}
          className="w-full h-12 bg-primary hover:bg-primary-light text-white font-semibold"
        >
          START PRACTICING →
        </Button>
      </div>
    </main>
  );
}
