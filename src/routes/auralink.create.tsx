import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Check,
  Sparkles,
} from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RequireAuth } from "@/components/RequireAuth";
import { AuraLinkView } from "@/components/AuraLinkView";
import { Aurascope } from "@/components/Aurascope";
import { useAuth } from "@/hooks/useAuth";
import {
  PLATFORMS,
  THEME_LIST,
  ensureUniqueSlug,
  getAuraLinks,
  newAuraLinkId,
  saveAuraLink,
  slugify,
  type AuraLinkLink,
  type AuraLinkMode,
  type AuraLinkPage,
  type AuraLinkTheme,
} from "@/lib/auralink";
import { getSavedAuras, type SavedAura } from "@/lib/farm";

export const Route = createFileRoute("/auralink/create")({
  head: () => ({
    meta: [
      { title: "Build AuraLink — Auragram" },
      {
        name: "description",
        content:
          "Create a music-first link page with streaming links, Auras, or both.",
      },
      { property: "og:title", content: "Build AuraLink — Auragram" },
      {
        property: "og:description",
        content:
          "Create a music-first link page with streaming links, Auras, or both.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <BuilderPage />
    </RequireAuth>
  ),
});

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function BuilderPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [auras, setAuras] = useState<SavedAura[]>([]);
  useEffect(() => {
    setAuras(getSavedAuras());
  }, []);

  // Form state
  const [mode, setMode] = useState<AuraLinkMode>("mixed");
  const [title, setTitle] = useState("");
  const [artistName, setArtistName] = useState(
    profile?.display_name ?? profile?.username ?? "",
  );
  const [description, setDescription] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState<string>("");
  const [slug, setSlug] = useState("");
  const [theme, setTheme] = useState<AuraLinkTheme>("midnight");
  const [links, setLinks] = useState<AuraLinkLink[]>([]);
  const [selectedAuraIds, setSelectedAuraIds] = useState<string[]>([]);

  const [showPreview, setShowPreview] = useState(false);

  // derived
  const computedSlug = useMemo(
    () => slug.trim() ? slugify(slug) : slugify(title || artistName || "auralink"),
    [slug, title, artistName],
  );

  const previewPage: AuraLinkPage = useMemo(
    () => ({
      id: "preview",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      title: title || "Untitled AuraLink",
      artistName,
      handleSlug: computedSlug,
      description,
      profileImageUrl: profileImageUrl || undefined,
      mode,
      selectedAuraIds,
      links,
      theme,
      visibility: "public",
    }),
    [title, artistName, computedSlug, description, profileImageUrl, mode, selectedAuraIds, links, theme],
  );

  // ----- Link helpers -----
  const addStreamingLink = () => {
    const id = uid();
    setLinks((prev) => [
      ...prev,
      {
        id,
        type: "streaming",
        platformName: "spotify",
        label: "Spotify",
        url: "",
        order: prev.length,
      },
    ]);
  };
  const addCustomLink = () => {
    const id = uid();
    setLinks((prev) => [
      ...prev,
      {
        id,
        type: "custom",
        label: "",
        url: "",
        order: prev.length,
      },
    ]);
  };
  const updateLink = (id: string, patch: Partial<AuraLinkLink>) => {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };
  const removeLink = (id: string) => {
    setLinks((prev) =>
      prev.filter((l) => l.id !== id).map((l, i) => ({ ...l, order: i })),
    );
  };
  const moveLink = (id: string, dir: -1 | 1) => {
    setLinks((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next.map((l, i) => ({ ...l, order: i }));
    });
  };

  const toggleAura = (id: string) => {
    setSelectedAuraIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };
  const moveAura = (id: string, dir: -1 | 1) => {
    setSelectedAuraIds((prev) => {
      const idx = prev.indexOf(id);
      if (idx < 0) return prev;
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  };

  const [uploadingCover, setUploadingCover] = useState(false);
  const onImage = async (file: File | null) => {
    if (!file) return;
    setUploadingCover(true);
    try {
      const { uploadAuraLinkCover } = await import("@/lib/auralinkImages");
      const url = await uploadAuraLinkCover(file);
      setProfileImageUrl(url);
    } catch (e) {
      console.error(e);
      toast.error(
        e instanceof Error ? e.message : "Could not upload cover image.",
      );
    } finally {
      setUploadingCover(false);
    }
  };

  // Validation
  const canPublish =
    !uploadingCover &&
    title.trim().length > 1 &&
    (mode === "auras"
      ? selectedAuraIds.length > 0
      : mode === "streaming_links"
        ? links.length > 0
        : selectedAuraIds.length > 0 || links.length > 0);

  const publish = () => {
    if (uploadingCover) {
      toast.error("Cover image is still uploading.");
      return;
    }
    if (!canPublish) {
      toast.error("Add a title and at least one link or Aura.");
      return;
    }
    const finalSlug = ensureUniqueSlug(computedSlug);
    const id = newAuraLinkId();
    const page: AuraLinkPage = {
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      title: title.trim(),
      artistName: artistName.trim(),
      handleSlug: finalSlug,
      description: description.trim() || undefined,
      profileImageUrl: profileImageUrl || undefined,
      mode,
      selectedAuraIds,
      links: links.map((l, i) => ({ ...l, order: i })),
      theme,
      visibility: "public",
    };
    try {
      saveAuraLink(page);
    } catch (e) {
      console.error(e);
      toast.error(
        e instanceof Error ? e.message : "Could not publish AuraLink.",
      );
      return;
    }
    toast.success("AuraLink published.");
    navigate({ to: "/l/$slug", params: { slug: finalSlug } });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Nav showCta={false} />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-8 py-8 sm:py-14">
        <div className="text-center animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 h-7 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            <Sparkles className="h-3 w-3" /> AuraLink
          </div>
          <h1 className="mt-3 font-display text-3xl sm:text-5xl tracking-tight">
            Build <span className="text-aura-gradient">AuraLink.</span>
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground px-4">
            Create a music-first link page with streaming links, Auras, or both.
          </p>
        </div>

        {/* Mobile preview toggle */}
        <div className="lg:hidden mt-8 flex justify-end">
          <button
            onClick={() => setShowPreview((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full glass px-4 h-10 text-xs"
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? "Edit" : "Preview"}
          </button>
        </div>

        <div className="mt-6 grid lg:grid-cols-[1fr_360px] gap-8">
          {/* ----- Form column ----- */}
          <div className={showPreview ? "hidden lg:block" : ""}>
            {/* Mode selector */}
            <Section title="What do you want to share?">
              <div className="grid sm:grid-cols-3 gap-3">
                {(
                  [
                    ["streaming_links", "Streaming Links", "Spotify, Apple Music, more"],
                    ["auras", "Auras", "Your saved sonic identities"],
                    ["mixed", "Mixed Page", "Streaming links + Auras"],
                  ] as const
                ).map(([key, label, hint]) => {
                  const active = mode === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setMode(key)}
                      className={
                        "rounded-2xl p-4 text-left border transition-all " +
                        (active
                          ? "border-foreground/30 bg-aura-gradient/10 shadow-[0_0_30px_-12px_oklch(0.7_0.2_310/0.7)]"
                          : "border-border/60 bg-background/30 hover:bg-foreground/5")
                      }
                    >
                      <div className="font-display text-base">{label}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
                    </button>
                  );
                })}
              </div>
            </Section>

            {/* Identity */}
            <Section title="AuraLink details">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Title">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="My new EP"
                    className="input-base"
                  />
                </Field>
                <Field label="Artist / Profile name">
                  <input
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    placeholder="Your artist name"
                    className="input-base"
                  />
                </Field>
                <Field label="URL slug">
                  <div className="flex items-stretch rounded-xl bg-background/40 border border-border/60 overflow-hidden focus-within:border-foreground/25">
                    <span className="px-3 grid place-items-center text-xs text-muted-foreground border-r border-border/60">
                      /l/
                    </span>
                    <input
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder={computedSlug}
                      spellCheck={false}
                      className="flex-1 bg-transparent px-3 h-10 text-sm outline-none"
                    />
                  </div>
                </Field>
                <Field label="Cover / avatar image">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onImage(e.target.files?.[0] ?? null)}
                    className="block text-xs text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-foreground/10 file:px-3 file:py-2 file:text-xs"
                  />
                </Field>
                <Field label="Description (optional)" className="sm:col-span-2">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="One-liner for your bio link"
                    rows={2}
                    className="input-base min-h-[64px] py-2"
                  />
                </Field>
              </div>
            </Section>

            {/* Links block */}
            {(mode === "streaming_links" || mode === "mixed") && (
              <Section
                title="Links"
                action={
                  <div className="flex gap-2">
                    <button onClick={addStreamingLink} className="btn-ghost">
                      <Plus className="h-3.5 w-3.5" /> Add Streaming Link
                    </button>
                    <button onClick={addCustomLink} className="btn-ghost">
                      <Plus className="h-3.5 w-3.5" /> Add Custom Link
                    </button>
                  </div>
                }
              >
                {links.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Add Spotify, Apple Music, SoundCloud, YouTube, Bandcamp, and
                    more.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {links.map((l, i) => (
                      <div
                        key={l.id}
                        className="rounded-2xl border border-border/60 bg-background/30 p-3 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          {l.type === "streaming" ? (
                            <select
                              value={l.platformName}
                              onChange={(e) => {
                                const v = e.target.value;
                                updateLink(l.id, {
                                  platformName: v,
                                  label:
                                    PLATFORMS.find((p) => p.key === v)?.label ?? l.label,
                                });
                              }}
                              className="input-base !h-9 !w-auto"
                            >
                              {PLATFORMS.map((p) => (
                                <option key={p.key} value={p.key}>
                                  {p.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground px-2">
                              Custom
                            </span>
                          )}
                          <span className="ml-auto flex items-center gap-1">
                            <button
                              onClick={() => moveLink(l.id, -1)}
                              disabled={i === 0}
                              className="icon-btn"
                              aria-label="Move up"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => moveLink(l.id, 1)}
                              disabled={i === links.length - 1}
                              className="icon-btn"
                              aria-label="Move down"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => removeLink(l.id)}
                              className="icon-btn"
                              aria-label="Remove"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        </div>
                        <input
                          value={l.label}
                          onChange={(e) => updateLink(l.id, { label: e.target.value })}
                          placeholder="Display label"
                          className="input-base"
                        />
                        <input
                          value={l.url ?? ""}
                          onChange={(e) => updateLink(l.id, { url: e.target.value })}
                          placeholder={
                            l.type === "streaming"
                              ? PLATFORMS.find((p) => p.key === l.platformName)?.hint ??
                                "https://…"
                              : "https://…"
                          }
                          spellCheck={false}
                          className="input-base"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            )}

            {/* Auras block */}
            {(mode === "auras" || mode === "mixed") && (
              <Section title="Auras from your Farm">
                {auras.length === 0 ? (
                  <div className="rounded-2xl border border-border/60 bg-background/30 p-6 text-center">
                    <h3 className="font-display text-lg">
                      You don&apos;t have any Auras yet.
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Create an Aura first, or build an AuraLink with streaming
                      links.
                    </p>
                    <div className="mt-4 flex justify-center gap-2">
                      <Link to="/create" className="btn-primary">
                        Create Aura
                      </Link>
                      <button
                        onClick={() => setMode("streaming_links")}
                        className="btn-ghost"
                      >
                        Use Streaming Links
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid sm:grid-cols-3 gap-3">
                      {auras.map((a) => {
                        const sel = selectedAuraIds.includes(a.id);
                        return (
                          <button
                            key={a.id}
                            onClick={() => toggleAura(a.id)}
                            className={
                              "relative rounded-2xl p-3 border transition-all " +
                              (sel
                                ? "border-foreground/30 bg-aura-gradient/10 shadow-[0_0_30px_-12px_oklch(0.7_0.2_310/0.8)]"
                                : "border-border/60 bg-background/30 hover:bg-foreground/5")
                            }
                          >
                            {sel && (
                              <span className="absolute top-2 right-2 inline-grid place-items-center h-5 w-5 rounded-full bg-aura-gradient text-primary-foreground">
                                <Check className="h-3 w-3" />
                              </span>
                            )}
                            <div className="flex items-center gap-3">
                              <Aurascope
                                aura={{
                                  id: a.id,
                                  palette: a.palette,
                                  seed: a.seed,
                                  auraName: a.auraName,
                                  colors: a.colors,
                                }}
                                size="mini"
                                mode="minimal"
                                showLabel={false}
                              />
                              <div className="text-left min-w-0">
                                <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground truncate">
                                  {a.auraName}
                                </div>
                                <div className="text-sm font-medium truncate">
                                  {a.trackTitle}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {selectedAuraIds.length > 0 && (
                      <div className="mt-4">
                        <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground mb-2">
                          Order
                        </div>
                        <div className="space-y-1.5">
                          {selectedAuraIds.map((id, i) => {
                            const a = auras.find((x) => x.id === id);
                            if (!a) return null;
                            return (
                              <div
                                key={id}
                                className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/30 px-3 py-2"
                              >
                                <span className="text-xs text-muted-foreground w-5">
                                  {i + 1}.
                                </span>
                                <span className="flex-1 truncate text-sm">
                                  {a.trackTitle}{" "}
                                  <span className="text-muted-foreground">
                                    — {a.auraName}
                                  </span>
                                </span>
                                <button
                                  onClick={() => moveAura(id, -1)}
                                  disabled={i === 0}
                                  className="icon-btn"
                                  aria-label="Move up"
                                >
                                  <ArrowUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => moveAura(id, 1)}
                                  disabled={i === selectedAuraIds.length - 1}
                                  className="icon-btn"
                                  aria-label="Move down"
                                >
                                  <ArrowDown className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => toggleAura(id)}
                                  className="icon-btn"
                                  aria-label="Remove"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </Section>
            )}

            {/* Theme */}
            <Section title="Choose a vibe">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {THEME_LIST.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTheme(t.key)}
                    className={
                      "rounded-xl p-3 border text-left transition-all " +
                      (theme === t.key
                        ? "border-foreground/30 ring-1 ring-foreground/20"
                        : "border-border/60 hover:border-foreground/20")
                    }
                    style={{ background: t.bg }}
                  >
                    <div
                      className="text-[11px] uppercase tracking-[0.22em]"
                      style={{ color: t.accent }}
                    >
                      {t.name}
                    </div>
                  </button>
                ))}
              </div>
            </Section>

            {/* Footer actions */}
            <div className="sticky bottom-3 mt-10 flex flex-wrap gap-2 z-20">
              <button
                onClick={() => setShowPreview(true)}
                className="lg:hidden btn-ghost"
              >
                <Eye className="h-4 w-4" /> Preview AuraLink
              </button>
              <button
                onClick={publish}
                disabled={!canPublish}
                className="btn-primary ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Publish AuraLink
              </button>
            </div>
          </div>

          {/* ----- Preview column ----- */}
          <aside className={showPreview ? "" : "hidden lg:block"}>
            <div className="lg:sticky lg:top-20">
              <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">
                Live Preview
              </div>
              <div className="rounded-[28px] overflow-hidden ring-1 ring-foreground/10 shadow-2xl bg-black/40 mx-auto w-full max-w-[360px]">
                <AuraLinkView page={previewPage} auras={auras} showLogo={false} />
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="font-display text-lg">{title}</h2>
        {action}
      </div>
      <div className="rounded-2xl sm:rounded-3xl border border-border/60 bg-background/30 p-3 sm:p-5">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={"block " + (className ?? "")}>
      <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/80 px-1">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
