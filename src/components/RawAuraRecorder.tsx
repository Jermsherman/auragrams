import { useEffect, useRef, useState } from "react";
import { Mic, Square, RefreshCcw, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type State = "idle" | "recording" | "recorded";

function pickMime(): string | undefined {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  if (typeof MediaRecorder === "undefined") return undefined;
  for (const m of candidates) {
    if (MediaRecorder.isTypeSupported?.(m)) return m;
  }
  return undefined;
}

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function RawAuraRecorder({
  file,
  onReady,
  onClear,
}: {
  file: File | null;
  onReady: (file: File, durationSec: number) => void;
  onClear: () => void;
}) {
  const [state, setState] = useState<State>(file ? "recorded" : "idle");
  const [elapsed, setElapsed] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startTsRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => () => stopAll(), []);

  function stopAll() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (recRef.current && recRef.current.state !== "inactive") {
      try { recRef.current.stop(); } catch { /* ignore */ }
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recRef.current = null;
  }

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMime();
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      recRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const type = rec.mimeType || "audio/webm";
        const ext = /mp4/.test(type) ? "mp4" : /ogg/.test(type) ? "ogg" : "webm";
        const blob = new Blob(chunksRef.current, { type });
        const f = new File([blob], `raw-aura-${Date.now()}.${ext}`, { type });
        const dur = (Date.now() - startTsRef.current) / 1000;
        onReady(f, dur);
        setState("recorded");
      };
      rec.start();
      startTsRef.current = Date.now();
      setElapsed(0);
      setState("recording");
      const tick = () => {
        setElapsed((Date.now() - startTsRef.current) / 1000);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (e) {
      console.warn("[record] mic error", e);
      const msg =
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "Microphone permission denied."
          : "Couldn't start recording.";
      setError(msg);
      toast.error(msg);
      setState("idle");
    }
  };

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (recRef.current && recRef.current.state !== "inactive") {
      recRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const reset = () => {
    onClear();
    setElapsed(0);
    setState("idle");
  };

  return (
    <div className="glass rounded-3xl p-6 sm:p-8 text-center space-y-5">
      <div>
        <p className="font-display text-base">Record a Raw Aura</p>
        <p className="mt-1 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          Capture a vocal, idea, hook, or demo
        </p>
        <p className="mt-2 text-xs text-muted-foreground/85">
          Save the idea before it disappears.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        {state === "recording" ? (
          <button
            type="button"
            onClick={stop}
            className="relative h-20 w-20 rounded-full grid place-items-center bg-aura-gradient text-primary-foreground shadow-[0_0_60px_-10px_oklch(0.7_0.2_310/0.9)]"
            aria-label="Stop recording"
          >
            <span className="absolute inset-0 rounded-full animate-ping bg-foreground/15" />
            <Square className="h-7 w-7 relative" />
          </button>
        ) : (
          <button
            type="button"
            onClick={start}
            disabled={state === "recorded"}
            className="h-20 w-20 rounded-full grid place-items-center bg-aura-gradient text-primary-foreground shadow-[0_0_50px_-12px_oklch(0.7_0.2_310/0.85)] disabled:opacity-40"
            aria-label="Start recording"
          >
            <Mic className="h-7 w-7" />
          </button>
        )}
        <div className="text-sm tabular-nums text-foreground/85">
          {state === "recording"
            ? fmt(elapsed)
            : state === "recorded" && file
              ? `Recorded · ${(file.size / 1024).toFixed(0)} KB`
              : "Tap to start"}
        </div>
        {state === "recording" && (
          <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            Recording…
          </p>
        )}
      </div>

      {state === "recorded" && previewUrl && (
        <div className="space-y-3">
          <audio src={previewUrl} controls className="w-full" />
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full glass px-4 h-9 text-xs hover:bg-foreground/10 transition-colors text-muted-foreground hover:text-foreground"
          >
            <RefreshCcw className="h-3.5 w-3.5" /> Re-record
          </button>
        </div>
      )}

      {error && (
        <div className="inline-flex items-center gap-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </div>
      )}
    </div>
  );
}
