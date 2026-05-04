import mark from "@/assets/auragram-mark.png";
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
      <img
        src={mark}
        alt=""
        aria-hidden
        draggable={false}
        className="shrink-0 select-none"
        style={{ width: size, height: size, objectFit: "contain" }}
      />
      {showWordmark && (
        <span className="wordmark text-[12px] text-foreground/90 hidden sm:inline">Auragram</span>
      )}
    </div>
  );
}
