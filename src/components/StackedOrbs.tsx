import { Aurascope } from "./Aurascope";
import type { PaletteKey } from "@/lib/aura";

type Item = { palette: PaletteKey; seed: number };

export function StackedOrbs({
  items,
  size = 56,
  max = 3,
  overlap = 0.45,
}: {
  items: Item[];
  size?: number;
  max?: number;
  overlap?: number;
}) {
  const visible = items.slice(0, max);
  const step = size * (1 - overlap);
  const total = visible.length === 0 ? size : size + step * (visible.length - 1);
  return (
    <div
      className="relative"
      style={{ width: total, height: size }}
      aria-hidden
    >
      {visible.map((it, i) => (
        <div
          key={i}
          className="absolute top-0"
          style={{
            left: i * step,
            width: size,
            height: size,
            zIndex: visible.length - i,
            filter: `drop-shadow(0 4px 18px oklch(0.6 0.18 290 / 0.35))`,
          }}
        >
          <Aurascope aura={{ palette: it.palette, seed: it.seed }} size="mini" mode="minimal" className="w-full h-full" />
        </div>
      ))}
    </div>
  );
}
