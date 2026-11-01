import type { ReactNode } from "react";
import type { TrackAnalysis } from "@/lib/analysis/analyze";

function clock(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function Category({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-background/30 px-4 py-3">
      <h3 className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">{title}</h3>
      <div className="mt-2 text-sm leading-relaxed text-foreground/90">{children}</div>
    </section>
  );
}

function Arc({
  curve,
  peak,
}: {
  curve: { t: number; lufs: number }[];
  peak: { t: number; lufs: number };
}) {
  if (curve.length < 2) return <p>Not enough of the track to draw an arc.</p>;
  const w = 320;
  const h = 56;
  const min = -60;
  const max = 0;
  const y = (lufs: number) =>
    h - ((Math.max(min, Math.min(max, lufs)) - min) / (max - min)) * (h - 8) - 4;
  const last = curve[curve.length - 1].t || 1;
  const points = curve.map((row, i) => `${(i / (curve.length - 1)) * w},${y(row.lufs)}`).join(" ");
  const px = (peak.t / last) * w;
  return (
    <div>
      <p className="tabular-nums">
        Peak {clock(peak.t)} · {peak.lufs.toFixed(1)} LUFS
      </p>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="mt-2 w-full h-16"
        role="img"
        aria-label="Energy arc"
      >
        <polyline fill="none" stroke="currentColor" strokeWidth="2" points={points} />
        <circle cx={px} cy={y(peak.lufs)} r="4" fill="currentColor" />
      </svg>
    </div>
  );
}

function TensionArc({ points }: { points: { t: number; value: number }[] }) {
  if (points.length < 2) return null;
  const w = 320;
  const h = 48;
  const d = points
    .map((row, i) => `${(i / (points.length - 1)) * w},${h - 4 - row.value * (h - 8)}`)
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="mt-2 w-full h-12"
      role="img"
      aria-label="Harmonic tension"
    >
      <polyline fill="none" stroke="currentColor" strokeWidth="2" points={d} />
    </svg>
  );
}

function Locked({ title }: { title: string }) {
  return (
    <Category title={title}>
      <p className="text-muted-foreground">Pro</p>
    </Category>
  );
}

/** Measured categories. Each one cites a field from the whole-track analysis. */
export function InsightCategories({ analysis, pro = false }: { analysis: TrackAnalysis; pro?: boolean }) {
  const bpmText =
    analysis.bpm != null && analysis.bpmConfidence >= 0.35
      ? `${Math.round(analysis.bpm)} BPM`
      : "Tempo unclear";
  const bandText = [
    analysis.tempoLabel !== "Unclear" ? analysis.tempoLabel : null,
    analysis.feel === "swung" && analysis.swingRatio != null
      ? `swung (${Math.round(analysis.swingRatio * 100)}%)`
      : analysis.feel === "straight"
        ? "straight"
        : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className="mt-8 w-full max-w-md mx-auto grid gap-2 text-left">
      <Category title="Key">
        <p>
          {analysis.key.display}
          {analysis.key.label ? ` · ${analysis.key.confidenceLabel} confidence` : ""}
        </p>
        {analysis.key.changes.length > 0 && (
          <ul className="mt-1 text-muted-foreground">
            {analysis.key.changes.map((change) => (
              <li key={`${change.atSec}-${change.label}`}>
                {change.label} at {clock(change.atSec)}
              </li>
            ))}
          </ul>
        )}
      </Category>
      <Category title="Tempo">
        <p className="font-display text-2xl tabular-nums leading-none">{bpmText}</p>
        {bandText ? <p className="mt-1 text-xs text-muted-foreground">{bandText}</p> : null}
      </Category>
      <Category title="Energy arc">
        <Arc curve={analysis.energyCurve} peak={analysis.energyPeak} />
      </Category>
      <Category title="Palette">
        <div className="flex gap-2">
          {analysis.palette.swatches.map((color) => (
            <span
              key={color}
              className="h-6 w-6 rounded-full ring-1 ring-foreground/15"
              style={{ background: color }}
              title={color}
            />
          ))}
        </div>
        <ul className="mt-2 space-y-1 text-muted-foreground">
          {analysis.paletteBecause.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Category>
      <Category title="Read">
        <p>{analysis.read.text}</p>
      </Category>
      <Category title="Song map">
        <ul>
          {analysis.sections.map((section) => (
            <li key={`${section.startSec}-${section.label}`}>
              {section.label} · {clock(section.startSec)}–{clock(section.endSec)}
            </li>
          ))}
        </ul>
        <p className="mt-1 text-xs text-muted-foreground">
          Sections follow loudness changes. Verse and chorus are not claimed.
        </p>
      </Category>
      <Category title="The moment">
        {analysis.moment ? (
          <p>
            {clock(analysis.moment.startSec)} · {analysis.moment.durationSec}s. {analysis.moment.reason}
          </p>
        ) : (
          <p>No moment marked.</p>
        )}
      </Category>
      {pro ? (
        <Category title="Low end">
          <p>{Math.round(analysis.lowEnd.shareBelow120Hz * 100)}% of spectral energy is below 120 Hz.</p>
        </Category>
      ) : (
        <Locked title="Low end" />
      )}
      {pro ? (
        <Category title="Loudness & dynamics">
          <p>
            {analysis.loudness.integratedLufs.toFixed(1)} LUFS integrated · LRA {analysis.loudness.loudnessRangeLu.toFixed(1)} LU · level span {analysis.loudness.levelSpanLu.toFixed(1)} LU · crest {analysis.loudness.crestDb.toFixed(1)} dB
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{analysis.loudness.method}</p>
        </Category>
      ) : (
        <Locked title="Loudness & dynamics" />
      )}
      {pro ? (
        <Category title="Width">
          <p>
            {analysis.width.label}
            {analysis.width.correlation != null ? ` · correlation ${analysis.width.correlation.toFixed(2)}` : ""}
          </p>
        </Category>
      ) : (
        <Locked title="Width" />
      )}
      {pro ? (
        <Category title="Tension">
          {analysis.tension.length > 1 ? (
            <>
              <TensionArc points={analysis.tension} />
              <p className="mt-1 text-xs text-muted-foreground">Distance from the home-key profile. Higher means less resolved.</p>
            </>
          ) : (
            <p>No tension curve. The key was not clear enough to measure resolution against.</p>
          )}
        </Category>
      ) : (
        <Locked title="Tension" />
      )}
      {pro ? (
        <Category title="Fingerprint">
          {analysis.fingerprint.length > 0 ? (
            <ul className="space-y-1">
              {analysis.fingerprint.map((row) => (
                <li key={row.id}>{row.text}</li>
              ))}
            </ul>
          ) : (
            <p>Nothing here stands far from the fixed references.</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">Compared with fixed references, not other Auragram songs.</p>
        </Category>
      ) : (
        <Locked title="Fingerprint" />
      )}
    </div>
  );
}
