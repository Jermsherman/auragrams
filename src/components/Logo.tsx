import logo from "@/assets/auragram-logo.png";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  showWordmark = true,
  size = 22,
}: {
  className?: string;
  showWordmark?: boolean;
  size?: number;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className="shrink-0"
        style={{
          width: size,
          height: size,
          backgroundImage: `url(${logo})`,
          backgroundRepeat: "no-repeat",
          // Source image: A symbol sits roughly centered horizontally, vertically in top ~55%.
          // Zoom in and offset upward so we crop just the A glyph cleanly.
          backgroundSize: `${size * 2.2}px auto`,
          backgroundPosition: `center ${-size * 0.35}px`,
        }}
        aria-hidden
      />
      {showWordmark && (
        <span className="wordmark text-[12px] text-foreground/90">Auragram</span>
      )}
    </div>
  );
}
