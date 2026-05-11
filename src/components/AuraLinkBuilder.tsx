import { useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
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
  Star,
  ExternalLink,
  Copy,
  FilePlus,
  Pencil,
} from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { AuraLinkView } from "@/components/AuraLinkView";
import { Aurascope } from "@/components/Aurascope";
import { useAuth } from "@/hooks/useAuth";
import { getPersonality } from "@/lib/aura";
import {
  PLATFORMS,
  SOCIAL_PLATFORMS,
  THEME_LIST,
  DEFAULT_CUSTOM_THEME,
  ensureUniqueSlug,
  newAuraLinkId,
  saveAuraLink,
  updateAuraLink,
  deleteAuraLink,
  getAuraLink,
  getAuraLinks,
  resolveTheme,
  slugify,
  type AuraLinkCustomLink,
  type AuraLinkMode,
  type AuraLinkPage,
  type AuraLinkSocialLink,
  type AuraLinkStreamingLink,
  type AuraLinkTheme,
  type AuraLinkThemePreset,
} from "@/lib/auralink";
import { getSavedAuras, type SavedAura } from "@/lib/farm";
import { HelpLink } from "@/components/HelpLink";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function AuraLinkBuilder() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [auras, setAuras] = useState<SavedAura[]>([]);
  const [savedLinks, setSavedLinks] = useState<AuraLinkPage[]>([]);
  useEffect(() => {
    setAuras(getSavedAuras());
    setSavedLinks(getAuraLinks());
  }, []);

  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [mode, setMode] = useState<AuraLinkMode>("mixed");
  const [title, setTitle] = useState("");
  const [artistName, setArtistName] = useState(
    profile?.display_name ?? profile?.username ?? "",
  );
  const [description, setDescription] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState<string>("");
  const [slug, setSlug] = useState("");
  const [theme, setTheme] = useState<AuraLinkThemePreset>("midnight");
  const [customTheme, setCustomTheme] = useState<AuraLinkTheme>({
    ...DEFAULT_CUSTOM_THEME,
  });
  const themeValue: AuraLinkTheme | AuraLinkThemePreset =
    theme === "custom"
      ? { ...customTheme, mode: "custom", name: customTheme.name || "Custom" }
      : theme;
  const [streamingLinks, setStreamingLinks] = useState<AuraLinkStreamingLink[]>([]);
  const [socialLinks, setSocialLinks] = useState<AuraLinkSocialLink[]>([]);
  const [customLinks, setCustomLinks] = useState<AuraLinkCustomLink[]>([]);
  const [selectedAuraIds, setSelectedAuraIds] = useState<string[]>([]);
  const [featuredAuraId, setFeaturedAuraId] = useState<string | undefined>(undefined);

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
      featuredAuraId,
      streamingLinks,
      socialLinks,
      customLinks,
      theme: themeValue,
      visibility: "public",
    }),
    [
      title,
      artistName,
      computedSlug,
      description,
      profileImageUrl,
      mode,
      selectedAuraIds,
      featuredAuraId,
      streamingLinks,
      socialLinks,
      customLinks,
      theme,
      customTheme,
    ],
  );

  // ----- Streaming link helpers -----
  const addStreamingLink = () => {
    setStreamingLinks((prev) => [
      ...prev,
      {
        id: uid(),
        platformName: "spotify",
        label: "Spotify",
        url: "",
        order: prev.length,
      },
    ]);
  };
  const updateStreamingLink = (id: string, patch: Partial<AuraLinkStreamingLink>) => {
    setStreamingLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };
  const removeStreamingLink = (id: string) => {
    setStreamingLinks((prev) =>
      prev.filter((l) => l.id !== id).map((l, i) => ({ ...l, order: i })),
    );
  };
  const moveStreamingLink = (id: string, dir: -1 | 1) => {
    setStreamingLinks((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next.map((l, i) => ({ ...l, order: i }));
    });
  };

  // ----- Social link helpers -----
  const addSocialLink = () => {
    setSocialLinks((prev) => [
      ...prev,
      {
        id: uid(),
        platformName: "instagram",
        label: "Instagram",
        url: "",
        order: prev.length,
      },
    ]);
  };
  const updateSocialLink = (id: string, patch: Partial<AuraLinkSocialLink>) => {
    setSocialLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };
  const removeSocialLink = (id: string) => {
    setSocialLinks((prev) =>
      prev.filter((l) => l.id !== id).map((l, i) => ({ ...l, order: i })),
    );
  };

  // ----- Custom link helpers -----
  const addCustomLink = () => {
    setCustomLinks((prev) => [
      ...prev,
      { id: uid(), label: "", url: "", order: prev.length },
    ]);
  };
  const updateCustomLink = (id: string, patch: Partial<AuraLinkCustomLink>) => {
    setCustomLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };
  const removeCustomLink = (id: string) => {
    setCustomLinks((prev) =>
      prev.filter((l) => l.id !== id).map((l, i) => ({ ...l, order: i })),
    );
  };

  const toggleAura = (id: string) => {
    setSelectedAuraIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setFeaturedAuraId((cur) => {
      if (cur === id) return undefined;
      // If we just selected the only Aura, feature it.
      return cur;
    });
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

  const totalLinks = streamingLinks.length + socialLinks.length + customLinks.length;

  // Validation
  const canPublish =
    !uploadingCover &&
    title.trim().length > 1 &&
    (mode === "auras"
      ? selectedAuraIds.length > 0
      : mode === "streaming_links"
        ? totalLinks > 0
        : selectedAuraIds.length > 0 || totalLinks > 0);

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
      featuredAuraId:
        featuredAuraId && selectedAuraIds.includes(featuredAuraId)
          ? featuredAuraId
          : selectedAuraIds[0],
      streamingLinks: streamingLinks.map((l, i) => ({ ...l, order: i })),
      socialLinks: socialLinks.map((l, i) => ({ ...l, order: i })),
      customLinks: customLinks.map((l, i) => ({ ...l, order: i })),
      theme: themeValue,
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
          <div className="mt-4 flex justify-center">
            <HelpLink hash="auralinks" label="What is an AuraLink?" />
          </div>
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
                  {uploadingCover && (
                    <div className="mt-1 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                      Uploading…
                    </div>
                  )}
                  {!uploadingCover && profileImageUrl && (
                    <div className="mt-1 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                      Uploaded ✓
                    </div>
                  )}
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

            {/* Streaming links */}
            {(mode === "streaming_links" || mode === "mixed") && (
              <Section
                title="Streaming Links"
                action={
                  <button onClick={addStreamingLink} className="btn-ghost">
                    <Plus className="h-3.5 w-3.5" /> Add platform
                  </button>
                }
              >
                {streamingLinks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Add Spotify, Apple Music, SoundCloud, YouTube, Bandcamp, Tidal,
                    and more.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {streamingLinks.map((l, i) => (
                      <div
                        key={l.id}
                        className="rounded-2xl border border-border/60 bg-background/30 p-3 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <select
                            value={l.platformName}
                            onChange={(e) => {
                              const v = e.target.value;
                              updateStreamingLink(l.id, {
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
                          <span className="ml-auto flex items-center gap-1">
                            <button
                              onClick={() => moveStreamingLink(l.id, -1)}
                              disabled={i === 0}
                              className="icon-btn"
                              aria-label="Move up"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => moveStreamingLink(l.id, 1)}
                              disabled={i === streamingLinks.length - 1}
                              className="icon-btn"
                              aria-label="Move down"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => removeStreamingLink(l.id)}
                              className="icon-btn"
                              aria-label="Remove"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        </div>
                        <input
                          value={l.label}
                          onChange={(e) => updateStreamingLink(l.id, { label: e.target.value })}
                          placeholder="Display label"
                          className="input-base"
                        />
                        <input
                          value={l.url}
                          onChange={(e) => updateStreamingLink(l.id, { url: e.target.value })}
                          placeholder={
                            PLATFORMS.find((p) => p.key === l.platformName)?.hint ??
                            "https://…"
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

            {/* Social links */}
            {(mode === "streaming_links" || mode === "mixed") && (
              <Section
                title="Social Links"
                action={
                  <button onClick={addSocialLink} className="btn-ghost">
                    <Plus className="h-3.5 w-3.5" /> Add social
                  </button>
                }
              >
                {socialLinks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Add Instagram, TikTok, X, YouTube, Threads, and more.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {socialLinks.map((l) => (
                      <div
                        key={l.id}
                        className="rounded-2xl border border-border/60 bg-background/30 p-3 flex items-center gap-2"
                      >
                        <select
                          value={l.platformName}
                          onChange={(e) => {
                            const v = e.target.value;
                            updateSocialLink(l.id, {
                              platformName: v,
                              label:
                                SOCIAL_PLATFORMS.find((p) => p.key === v)?.label ?? l.label,
                            });
                          }}
                          className="input-base !h-9 !w-auto"
                        >
                          {SOCIAL_PLATFORMS.map((p) => (
                            <option key={p.key} value={p.key}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                        <input
                          value={l.url}
                          onChange={(e) => updateSocialLink(l.id, { url: e.target.value })}
                          placeholder={
                            SOCIAL_PLATFORMS.find((p) => p.key === l.platformName)?.hint ??
                            "https://…"
                          }
                          spellCheck={false}
                          className="input-base flex-1"
                        />
                        <button
                          onClick={() => removeSocialLink(l.id)}
                          className="icon-btn"
                          aria-label="Remove"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            )}

            {/* Custom links */}
            {(mode === "streaming_links" || mode === "mixed") && (
              <Section
                title="Custom Links"
                action={
                  <button onClick={addCustomLink} className="btn-ghost">
                    <Plus className="h-3.5 w-3.5" /> Add custom
                  </button>
                }
              >
                {customLinks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Anything else — merch, tickets, presaves, websites.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {customLinks.map((l) => (
                      <div
                        key={l.id}
                        className="rounded-2xl border border-border/60 bg-background/30 p-3 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            value={l.label}
                            onChange={(e) => updateCustomLink(l.id, { label: e.target.value })}
                            placeholder="Label (e.g. Merch)"
                            className="input-base flex-1"
                          />
                          <button
                            onClick={() => removeCustomLink(l.id)}
                            className="icon-btn"
                            aria-label="Remove"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <input
                          value={l.url}
                          onChange={(e) => updateCustomLink(l.id, { url: e.target.value })}
                          placeholder="https://…"
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
                                  onClick={() =>
                                    setFeaturedAuraId(featuredAuraId === id ? undefined : id)
                                  }
                                  className={
                                    "rounded-full px-2 h-7 text-[10px] uppercase tracking-[0.2em] transition-colors " +
                                    ((featuredAuraId ?? selectedAuraIds[0]) === id
                                      ? "bg-aura-gradient text-primary-foreground"
                                      : "border border-border/60 text-muted-foreground hover:text-foreground")
                                  }
                                  aria-label="Feature this Aura"
                                  title="Feature this Aura on the AuraLink"
                                >
                                  {(featuredAuraId ?? selectedAuraIds[0]) === id
                                    ? "Featured"
                                    : "Feature"}
                                </button>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {THEME_LIST.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTheme(t.key)}
                    className={
                      "rounded-xl p-3 border text-left transition-all min-h-[64px] " +
                      (theme === t.key
                        ? "border-foreground/40 ring-2 ring-foreground/30"
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
                {/* Custom tile */}
                <button
                  onClick={() => setTheme("custom")}
                  className={
                    "rounded-xl p-3 border text-left transition-all min-h-[64px] relative overflow-hidden " +
                    (theme === "custom"
                      ? "border-foreground/40 ring-2 ring-foreground/30"
                      : "border-border/60 hover:border-foreground/20")
                  }
                  style={{
                    background: `radial-gradient(ellipse at top, ${customTheme.primaryAccent}33 0%, ${customTheme.backgroundColor} 65%, ${customTheme.backgroundColor} 100%)`,
                  }}
                >
                  <div
                    className="text-[11px] uppercase tracking-[0.22em]"
                    style={{ color: customTheme.primaryAccent }}
                  >
                    Custom
                  </div>
                  <div className="mt-1.5 flex gap-1">
                    {[
                      customTheme.backgroundColor,
                      customTheme.primaryAccent,
                      customTheme.secondaryAccent,
                      customTheme.glowColor,
                    ].map((c, i) => (
                      <span
                        key={i}
                        className="h-2.5 w-2.5 rounded-full ring-1 ring-foreground/20"
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </button>
              </div>

              {theme === "custom" && (
                <div className="mt-4 rounded-2xl glass-strong p-4 space-y-3">
                  <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                    Build your custom vibe
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "backgroundColor", label: "Background" },
                      { key: "primaryAccent", label: "Primary accent" },
                      { key: "secondaryAccent", label: "Secondary accent" },
                      { key: "buttonColor", label: "Button" },
                      { key: "glowColor", label: "Glow" },
                    ].map((f) => (
                      <label key={f.key} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <input
                          type="color"
                          value={(customTheme as Record<string, string | undefined>)[f.key] ?? "#1a1430"}
                          onChange={(e) =>
                            setCustomTheme((c) => ({ ...c, [f.key]: e.target.value }))
                          }
                          className="h-8 w-8 rounded-md border border-border/50 bg-transparent cursor-pointer"
                        />
                        <span>{f.label}</span>
                      </label>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={customTheme.name}
                    onChange={(e) =>
                      setCustomTheme((c) => ({ ...c, name: e.target.value.slice(0, 32) }))
                    }
                    placeholder="Name this vibe (optional)"
                    className="w-full rounded-lg bg-background/40 border border-border/60 px-3 h-9 text-sm outline-none focus:border-foreground/25"
                  />
                </div>
              )}
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
