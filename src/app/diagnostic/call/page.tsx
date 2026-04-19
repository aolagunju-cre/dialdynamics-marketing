"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Vapi from "@vapi-ai/web";
import { PERSONAS, getPersona } from "@/lib/vapi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type CallStage = "idle" | "connecting" | "inProgress" | "complete";

export default function CallPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") || "";
  const challenge = searchParams.get("challenge") || "";
  const referralCode = searchParams.get("referralCode") || "";
  const personaId = searchParams.get("persona") || "sarah";

  const [callStage, setCallStage] = useState<CallStage>("idle");
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [transcriptText, setTranscriptText] = useState("");
  const vapiRef = useRef<InstanceType<typeof Vapi> | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const persona = getPersona(personaId);

  const handleCallEnd = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    setCallStage("complete");
    setSeconds(30);

    // Submit score (mock based on transcript analysis)
    const wordCount = transcriptText.split(" ").length;
    let score = 50;
    if (wordCount > 20 && wordCount < 60) score += 20;
    if (transcriptText.includes("?")) score += 10;
    if (transcriptText.length > 150) score -= 10;
    score = Math.min(100, Math.max(0, score));

    try {
      await fetch("/api/diagnostic/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          score,
          transcript: transcriptText,
          drillCompleted: false,
        }),
      });
    } catch (e) {
      console.error("Score submit error:", e);
    }

    // Redirect to score page after brief delay
    setTimeout(() => {
      router.push(
        `/diagnostic/score?sessionId=${sessionId}&referralCode=${referralCode}&score=${score}`
      );
    }, 1500);
  }, [sessionId, referralCode, transcriptText, router]);

  function startCall() {
    if (!sessionId) return;

    const vapi = new Vapi();
    vapiRef.current = vapi;

    vapi.on("call-start", () => {
      setCallStage("inProgress");
      setSeconds(0);

      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s >= 29) {
            clearInterval(timerRef.current!);
            vapi.stop();
            return 30;
          }
          return s + 1;
        });
      }, 1000);
    });

    vapi.on("call-end", () => {
      handleCallEnd();
    });

    vapi.on("speech-update", (msg: any) => {
      if (msg.transcript) {
        setTranscript((prev) => [...prev.slice(-20), msg.transcript]);
        setTranscriptText((prev) => prev + " " + msg.transcript);
      }
    });

    vapi.on("error", (e: any) => {
      console.error("Vapi error:", e);
      if (timerRef.current) clearInterval(timerRef.current);
      // Fallback: redirect to score anyway
      handleCallEnd();
    });

    setCallStage("connecting");
    vapi.start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!);
  }

  function endCallEarly() {
    if (vapiRef.current) {
      vapiRef.current.stop();
    }
    handleCallEnd();
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (vapiRef.current) {
        try {
          vapiRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const timerColor = seconds >= 25 ? "text-error" : seconds >= 20 ? "text-yellow-500" : "text-text";

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-border">
        <button
          onClick={() => router.push("/")}
          className="text-sm text-text-muted hover:text-text"
        >
          ← Back
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
            <span className="text-white text-xs font-bold">DD</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {callStage === "idle" && (
          <>
            {/* Persona Card */}
            <Card className="w-full max-w-sm p-6 text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center text-3xl">
                📞
              </div>
              <h2 className="font-heading text-xl font-semibold mb-1">
                {persona.name}
              </h2>
              <p className="text-sm text-text-muted mb-2">
                {persona.title} @ {persona.company}
              </p>
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
                {persona.personality}
              </span>
            </Card>

            {/* Pre-call brief */}
            <Card className="w-full max-w-sm p-4 mb-6 border-dashed border-2">
              <p className="text-sm text-text text-center leading-relaxed">
                {persona.setupLine}
              </p>
            </Card>

            <p className="text-xs text-text-muted text-center mb-6">
              Your challenge:{" "}
              <span className="text-text font-medium">
                {challenge.replace("_", " ")}
              </span>
            </p>

            <Button
              onClick={startCall}
              className="w-full max-w-sm h-14 bg-accent hover:bg-accent-hover text-text font-semibold text-base rounded-xl"
            >
              TAP TO START CALL
            </Button>
          </>
        )}

        {callStage === "connecting" && (
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 mx-auto mb-6 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 animate-pulse" />
            </div>
            <p className="text-text-muted text-sm">Connecting...</p>
          </div>
        )}

        {callStage === "inProgress" && (
          <div className="w-full max-w-sm">
            {/* Timer */}
            <div className="text-center mb-6">
              <span className={`font-mono text-3xl font-bold ${timerColor}`}>
                {seconds}s / 30s
              </span>
            </div>

            {/* Waveform */}
            <div className="flex justify-center mb-6">
              <div className="waveform">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="waveform-bar" />
                ))}
              </div>
            </div>

            {/* Transcript */}
            <Card className="p-4 mb-6 min-h-[100px]">
              <p className="text-xs text-text-muted mb-2 font-medium">
                Live transcript
              </p>
              {transcript.length === 0 ? (
                <p className="text-sm text-text-muted italic">
                  Start talking...
                </p>
              ) : (
                <p className="text-sm text-text leading-relaxed">
                  {transcript[transcript.length - 1] || ""}
                </p>
              )}
            </Card>

            {/* End early */}
            <Button
              onClick={endCallEarly}
              variant="outline"
              className="w-full h-11 border-error/50 text-error hover:bg-error/10"
            >
              End Call Early
            </Button>
          </div>
        )}

        {callStage === "complete" && (
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-success/10 mx-auto mb-6 flex items-center justify-center">
              <span className="text-4xl">✓</span>
            </div>
            <p className="text-text font-medium mb-2">Call complete!</p>
            <p className="text-text-muted text-sm">
              Calculating your score...
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
