import { Link } from "@tanstack/react-router";
import { HelpCircle } from "lucide-react";

export function HelpLink({
  hash,
  label = "Need help? Read the FAQ",
  className = "",
}: {
  hash?: string;
  label?: string;
  className?: string;
}) {
  return (
    <Link
      to="/faq"
      hash={hash}
      className={`inline-flex items-center gap-1.5 rounded-full glass px-3 h-7 text-[10px] uppercase tracking-[0.24em] text-muted-foreground hover:text-foreground transition-colors ${className}`}
    >
      <HelpCircle className="h-3 w-3" />
      {label}
    </Link>
  );
}
