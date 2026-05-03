import logo from "@/assets/auragram-logo.png";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  showWordmark = true,
  size = 28,
}: {
  className?: string;
  showWordmark?: boolean;
  size?: number;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className="relative rounded-md overflow-hidden"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <img
          src={logo}
          alt=""
          className="absolute inset-0 w-full h-full object-cover scale-[1.6] -translate-y-[14%]"
          draggable={false}
        />
      </div>
      {showWordmark && (
        <span className="wordmark text-[13px] text-foreground/90">
          Auragram
        </span>
      )}
    </div>
  );
}
