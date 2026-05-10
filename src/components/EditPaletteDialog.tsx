import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import type { AuraPalette } from "@/lib/aura";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialColors: AuraPalette;
  generatedColors?: AuraPalette;
  initialName?: string;
  onSave: (next: AuraPalette, name: string) => void;
};

const KEYS: (keyof Omit<AuraPalette, "swatches">)[] = [
  "primary",
  "secondary",
  "accent",
  "glow",
  "shadow",
  "particle",
];

const KEY_LABEL: Record<string, string> = {
  primary: "Primary",
  secondary: "Secondary",
  accent: "Accent",
  glow: "Glow",
  shadow: "Shadow",
  particle: "Particle",
};

function clamp(s: string): string {
  // Always coerce to hex for <input type="color">
  if (/^#([0-9a-f]{6})$/i.test(s)) return s;
  return "#aa66cc";
}

export function EditPaletteDialog({
  open,
  onOpenChange,
  initialColors,
  generatedColors,
  initialName,
  onSave,
}: Props) {
  const [palette, setPalette] = useState<AuraPalette>(initialColors);
  const [name, setName] = useState(initialName ?? "Custom Palette");

  useEffect(() => {
    if (open) {
      setPalette(initialColors);
      setName(initialName ?? "Custom Palette");
    }
  }, [open, initialColors, initialName]);

  const updateKey = (k: keyof AuraPalette, v: string) =>
    setPalette((p) => ({ ...p, [k]: v }));

  const updateSwatch = (i: number, v: string) =>
    setPalette((p) => {
      const sw = [...(p.swatches ?? [])];
      sw[i] = v;
      return { ...p, swatches: sw };
    });

  const addSwatch = () =>
    setPalette((p) => {
      const sw = [...(p.swatches ?? [])];
      if (sw.length >= 8) return p;
      sw.push(p.accent || "#aa66cc");
      return { ...p, swatches: sw };
    });

  const removeSwatch = (i: number) =>
    setPalette((p) => {
      const sw = [...(p.swatches ?? [])];
      if (sw.length <= 4) return p;
      sw.splice(i, 1);
      return { ...p, swatches: sw };
    });

  const reset = () => {
    if (generatedColors) {
      setPalette(generatedColors);
      toast.message("Palette reset to generated");
    }
  };

  const save = () => {
    onSave(palette, name.trim() || "Custom Palette");
    toast.success("Palette updated");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card/90 backdrop-blur-2xl border-border/60 max-w-md">
        <DialogHeader>
          <DialogTitle>Edit palette</DialogTitle>
          <DialogDescription>
            Tune your Aura's color language. Updates the Aurascope live.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="palette-name" className="text-xs uppercase tracking-wider">
              Palette name
            </Label>
            <Input
              id="palette-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5"
              placeholder="e.g. Velvet Dusk"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {KEYS.map((k) => (
              <label key={k} className="flex items-center gap-2 text-xs">
                <input
                  type="color"
                  value={clamp(palette[k] as string)}
                  onChange={(e) => updateKey(k, e.target.value)}
                  className="h-9 w-9 rounded-md cursor-pointer border border-border/50 bg-transparent"
                />
                <span className="text-muted-foreground">{KEY_LABEL[k]}</span>
              </label>
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Swatches ({(palette.swatches ?? []).length})
              </span>
              <button
                onClick={addSwatch}
                disabled={(palette.swatches ?? []).length >= 8}
                className="inline-flex items-center gap-1 text-xs hover:text-foreground text-muted-foreground disabled:opacity-40"
              >
                <Plus className="h-3 w-3" /> Add
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {(palette.swatches ?? []).map((c, i) => (
                <div key={i} className="relative group">
                  <input
                    type="color"
                    value={clamp(c)}
                    onChange={(e) => updateSwatch(i, e.target.value)}
                    className="h-10 w-10 rounded-md cursor-pointer border border-border/50 bg-transparent"
                  />
                  {(palette.swatches ?? []).length > 4 && (
                    <button
                      onClick={() => removeSwatch(i)}
                      className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-background border border-border/60 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {generatedColors && (
            <button
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-full glass px-4 h-9 text-xs hover:bg-foreground/10"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          )}
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full glass px-4 h-9 text-xs hover:bg-foreground/10"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="rounded-full bg-aura-gradient text-primary-foreground px-5 h-9 text-xs font-medium"
          >
            Save palette
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
