"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Vapi from "@vapi-ai/web";
import { PERSONAS, getPersona } from "@/lib/vapi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type CallStage = "idle" | "connecting" | "inProgress" | "complete";

export const dynamic = "force-dynamic";

function CallPageInner() {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function startCall() {
    if (!sessionId) return;

    const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!);
    vapiRef.current = vapi;

    vapi.on("call-start" as any, () => {
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

    vapi.on("call-end" as any, () => {
      handleCallEnd();
    });

    // Use 'message' event with transcript type - per Vapi Web SDK docs
    vapi.on("message" as any, (msg: any) => {
      if (msg.type === "transcript" && msg.transcript) {
        setTranscript((prev) => [...prev.slice(-20), msg.transcript]);
        setTranscriptText((prev) => prev + " " + msg.transcript);
      }
    });

    vapi.on("error" as any, (e: any) => {
      console.error("Vapi error:", e);
      if (timerRef.current) clearInterval(timerRef.current);
      // Fallback: redirect to score anyway
      handleCallEnd();
    });

    vapi.start(persona.id);

    setCallStage("connecting");
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

  // Show message if no session (e.g., direct navigation)
  if (!sessionId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md w-full p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">No Session Found</h2>
          <p className="text-muted-foreground mb-4">
            Please start a call from the home page first.
          </p>
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <Card className="max-w-md w-full p-8">
        {/* Persona info */}
        <div className="mb-6 text-center">
          <div className="flex justify-center mb-4">
            <div
              className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold"
              style={{ backgroundColor: persona.id === "sarah" ? "#6366f1" : persona.id === "marcus" ? "#059669" : persona.id === "priya" ? "#d97706" : "#8b5cf6" }}
            >
              {persona.name.charAt(0)}
            </div>
          </div>
          <h1 className="text-xl font-semibold">{persona.name}</h1>
          <p className="text-sm text-muted-foreground">{persona.title}</p>
        </div>

        {/* Challenge display */}
        {challenge && (
          <div className="mb-4 p-3 bg-muted rounded-lg text-center">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Scenario
            </span>
            <p className="font-medium">{persona.setupLine}</p>
          </div>
        )}

        {/* Call status */}
        <div className="mb-8 text-center">
          {callStage === "idle" && (
            <>
              <p className="text-muted-foreground mb-4">
                This is a <strong>30-second practice call</strong>. The AI will
                evaluate your cold call opener and first few questions.
              </p>
              <Button onClick={startCall} size="lg" className="w-full">
                Start Practice Call
              </Button>
            </>
          )}

          {callStage === "connecting" && (
            <div className="py-4">
              <div className="animate-pulse text-lg">Connecting...</div>
            </div>
          )}

          {callStage === "inProgress" && (
            <div className="py-4">
              <div className="text-4xl font-bold mb-2">{seconds}s / 30s</div>
              <p className="text-muted-foreground text-sm">
                Speak naturally — the AI is listening
              </p>
              {seconds >= 25 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Ending soon...
                </p>
              )}
            </div>
          )}

          {callStage === "complete" && (
            <div className="py-4">
              <div className="text-2xl font-bold text-green-600 mb-2">
                Call Complete!
              </div>
              <p className="text-muted-foreground">Calculating your score...</p>
            </div>
          )}
        </div>

        {/* Transcript (scrollable) */}
        {callStage === "inProgress" && transcript.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-2">Live Transcript</h3>
            <div className="bg-muted rounded-lg p-3 max-h-40 overflow-y-auto">
              {transcript.map((line, i) => (
                <p key={i} className="text-sm mb-1">
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Help text */}
      <p className="mt-4 text-sm text-muted-foreground text-center max-w-md">
        Need help? Check out our{" "}
        <a href="/diagnostic" className="underline">
          diagnostic guide
        </a>{" "}
        or{" "}
        <a href="/resources" className="underline">
          practice tips
        </a>
        .
      </p>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse text-lg">Loading...</div>
    </div>
  );
}

export default function CallPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CallPageInner />
    </Suspense>
  );
}