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
        className="relative shrink-0"
        style={{ width: size, height: size }}
        aria-hidden
      >
        {/* Crop tightly to just the "A" symbol (top ~70% of source image) */}
        <img
          src={logo}
          alt=""
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-none pointer-events-none select-none"
          style={{
            height: size * 2.4,
            width: "auto",
            objectFit: "contain",
            transform: `translate(-50%, calc(-50% - ${size * 0.42}px))`,
          }}
          draggable={false}
        />
      </div>
      {showWordmark && (
        <span className="wordmark text-[12px] text-foreground/90">Auragram</span>
      )}
    </div>
  );
}
