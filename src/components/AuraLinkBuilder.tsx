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
  DEFAULT_SECTION_ORDER,
  FONT_PAIRS,
  resolveTheme,
  slugify,
  type AuraLinkBackground,
  type AuraLinkButtonShape,
  type AuraLinkButtonStyle,
  type AuraLinkCustomLink,
  type AuraLinkDecorations,
  type AuraLinkMode,
  type AuraLinkPage,
  type AuraLinkSectionKey,
  type AuraLinkSocialLink,
  type AuraLinkSpacing,
  type AuraLinkStreamingLink,
  type AuraLinkTheme,
  type AuraLinkThemePreset,
} from "@/lib/auralink";
import {
  listMyAuraLinks,
  getAuraLinkById,
  saveAuraLink,
  updateAuraLink,
  deleteAuraLink,
  ensureUniqueSlug,
} from "@/lib/auralinkService";
import { listMyAuras, mapAuraRowToSaved, hydrateSavedAuraAudioUrls } from "@/lib/cloudAura";
import { type SavedAura } from "@/lib/farm";
import { HelpLink } from "@/components/HelpLink";

function newAuraLinkId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return (crypto as Crypto).randomUUID();
  }
  // Fallback (RFC4122-ish) — only used if crypto.randomUUID isn't available.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function AuraLinkBuilder() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [auras, setAuras] = useState<SavedAura[]>([]);
  const [savedLinks, setSavedLinks] = useState<AuraLinkPage[]>([]);

  const refreshSaved = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const rows = await listMyAuraLinks(profile.id);
      setSavedLinks(rows);
    } catch (e) {
      console.error(e);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const [auraRows, linkRows] = await Promise.all([
          listMyAuras(profile.id),
          listMyAuraLinks(profile.id),
        ]);
        if (cancelled) return;
        const mapped = auraRows.map(mapAuraRowToSaved);
        await hydrateSavedAuraAudioUrls(mapped);
        if (cancelled) return;
        setAuras(mapped);
        setSavedLinks(linkRows);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile?.id]);

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
  const [themeExtras, setThemeExtras] = useState<{
    fontHeading?: string;
    fontBody?: string;
    buttonShape?: AuraLinkButtonShape;
    buttonStyle?: AuraLinkButtonStyle;
    spacing?: AuraLinkSpacing;
    decorations?: AuraLinkDecorations;
    background?: AuraLinkBackground;
    sectionOrder?: AuraLinkSectionKey[];
  }>({});
  const themeValue: AuraLinkTheme =
    theme === "custom"
      ? { ...customTheme, mode: "custom", name: customTheme.name || "Custom", ...themeExtras }
      : { name: theme, mode: "preset", preset: theme, ...themeExtras };
  const [streamingLinks, setStreamingLinks] = useState<AuraLinkStreamingLink[]>([]);
  const [socialLinks, setSocialLinks] = useState<AuraLinkSocialLink[]>([]);
  const [customLinks, setCustomLinks] = useState<AuraLinkCustomLink[]>([]);
  const [selectedAuraIds, setSelectedAuraIds] = useState<string[]>([]);
  const [featuredAuraId, setFeaturedAuraId] = useState<string | undefined>(undefined);

  /** Four representative colors for an Aura (saved palette, else mood defaults). */
  const auraSwatches = (a: SavedAura): string[] => {
    if (a.colors) {
      return [a.colors.shadow, a.colors.primary, a.colors.accent, a.colors.glow];
    }
    const p = getPersonality(a.palette);
    return p.swatches.slice(0, 4);
  };

  /** Derive the custom theme colors from an Aura's palette. */
  const applyAuraPalette = (a: SavedAura) => {
    const c = a.colors;
    const p = getPersonality(a.palette);
    const sw = p.swatches;
    setCustomTheme((prev) => ({
      ...prev,
      mode: "custom",
      name: a.auraName ? `${a.auraName} palette` : prev.name || "Custom",
      backgroundColor: c?.shadow ?? sw[3] ?? prev.backgroundColor,
      primaryAccent: c?.accent ?? sw[0] ?? prev.primaryAccent,
      secondaryAccent: c?.secondary ?? sw[1] ?? prev.secondaryAccent,
      buttonColor: c?.primary ?? sw[2] ?? prev.buttonColor,
      glowColor: c?.glow ?? sw[0] ?? prev.glowColor,
    }));
    setTheme("custom");
    toast.success("Theme matched to Aura palette");
  };



  // SEO & sharing
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [socialPreviewImage, setSocialPreviewImage] = useState<string>("");
  const [uploadingSocial, setUploadingSocial] = useState(false);

  const [showPreview, setShowPreview] = useState(false);

  // Reset form to a blank slate (used by "New AuraLink").
  const resetForm = useCallback(() => {
    setEditingId(null);
    setMode("mixed");
    setTitle("");
    setArtistName(profile?.display_name ?? profile?.username ?? "");
    setDescription("");
    setProfileImageUrl("");
    setSlug("");
    setTheme("midnight");
    setCustomTheme({ ...DEFAULT_CUSTOM_THEME });
    setThemeExtras({});
    setStreamingLinks([]);
    setSocialLinks([]);
    setCustomLinks([]);
    setSelectedAuraIds([]);
    setFeaturedAuraId(undefined);
    setSeoTitle("");
    setSeoDescription("");
    setSocialPreviewImage("");
  }, [profile]);

  // Load an existing AuraLink into the form for editing.
  const loadForEdit = useCallback(async (id: string) => {
    const p = await getAuraLinkById(id);
    if (!p) {
      toast.error("AuraLink not found.");
      return;
    }
    setEditingId(p.id);
    setMode(p.mode);
    setTitle(p.title);
    setArtistName(p.artistName);
    setDescription(p.description ?? "");
    setProfileImageUrl(p.profileImageUrl ?? "");
    setSlug(p.handleSlug);
    if (typeof p.theme === "string") {
      setTheme(p.theme);
      setThemeExtras({});
    } else {
      const t = p.theme;
      if (t.mode === "custom") {
        setTheme("custom");
        setCustomTheme({ ...DEFAULT_CUSTOM_THEME, ...t });
      } else {
        setTheme((t.preset ?? "midnight") as AuraLinkThemePreset);
      }
      setThemeExtras({
        fontHeading: t.fontHeading,
        fontBody: t.fontBody,
        buttonShape: t.buttonShape,
        buttonStyle: t.buttonStyle,
        spacing: t.spacing,
        decorations: t.decorations,
        background: t.background,
        sectionOrder: t.sectionOrder,
      });
    }
    setStreamingLinks(p.streamingLinks ?? []);
    setSocialLinks(p.socialLinks ?? []);
    setCustomLinks(p.customLinks ?? []);
    setSelectedAuraIds(p.selectedAuraIds ?? []);
    setFeaturedAuraId(p.featuredAuraId);
    setSeoTitle(p.seoTitle ?? "");
    setSeoDescription(p.seoDescription ?? "");
    setSocialPreviewImage(p.socialPreviewImage ?? "");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  // Hydrate from ?id=<auraLinkId> on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = new URLSearchParams(window.location.search).get("id");
    if (id) loadForEdit(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      seoTitle: seoTitle.trim() || undefined,
      seoDescription: seoDescription.trim() || undefined,
      socialPreviewImage: socialPreviewImage || undefined,
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
      themeExtras,
      seoTitle,
      seoDescription,
      socialPreviewImage,
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

  const onSocialImage = async (file: File | null) => {
    if (!file) return;
    setUploadingSocial(true);
    try {
      const { uploadAuraLinkCover } = await import("@/lib/auralinkImages");
      const url = await uploadAuraLinkCover(file);
      setSocialPreviewImage(url);
    } catch (e) {
      console.error(e);
      toast.error(
        e instanceof Error ? e.message : "Could not upload preview image.",
      );
    } finally {
      setUploadingSocial(false);
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

  const [publishing, setPublishing] = useState(false);

  const publish = async () => {
    if (uploadingCover) {
      toast.error("Cover image is still uploading.");
      return;
    }
    if (!canPublish) {
      toast.error("Add a title and at least one link or Aura.");
      return;
    }
    if (!profile?.id) {
      toast.error("You need to sign in to do that.");
      return;
    }
    setPublishing(true);
    const isEdit = !!editingId;
    try {
      const finalSlug = isEdit
        ? computedSlug
        : await ensureUniqueSlug(computedSlug);
      const id = isEdit ? editingId! : newAuraLinkId();
      const existing = isEdit ? await getAuraLinkById(id) : null;
      const page: AuraLinkPage = {
        id,
        createdAt: existing?.createdAt ?? Date.now(),
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
        seoTitle: seoTitle.trim() || undefined,
        seoDescription: seoDescription.trim() || undefined,
        socialPreviewImage: socialPreviewImage || undefined,
      };
      if (isEdit) {
        await updateAuraLink(id, profile.id, page);
      } else {
        await saveAuraLink(profile.id, page);
      }
      await refreshSaved();
      toast.success(isEdit ? "AuraLink updated." : "AuraLink published.");
      navigate({ to: "/l/$slug", params: { slug: finalSlug } });
    } catch (e) {
      console.error(e);
      toast.error("Could not save AuraLink. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  const onDeleteSaved = async (id: string, t: string) => {
    if (!profile?.id) return;
    if (!confirm(`Delete "${t || "Untitled AuraLink"}"?`)) return;
    try {
      await deleteAuraLink(id, profile.id);
      await refreshSaved();
      if (editingId === id) resetForm();
      toast.success("AuraLink deleted");
    } catch (e) {
      console.error(e);
      toast.error("Could not delete AuraLink. Please try again.");
    }
  };


  const onCopySaved = async (s: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/l/${s}`);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy");
    }
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
            {editingId ? "Edit" : "Build"}{" "}
            <span className="text-aura-gradient">AuraLink.</span>
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground px-4">
            {editingId
              ? "Update your link page — changes save when you publish."
              : "Create a music-first link page with streaming links, social links, and Auras from your Farm."}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <HelpLink hash="auralinks" label="What is an AuraLink?" />
            {editingId && (
              <button
                onClick={resetForm}
                className="inline-flex items-center gap-1.5 rounded-full glass px-3 h-7 text-[10px] uppercase tracking-[0.28em] text-muted-foreground hover:text-foreground transition-colors"
              >
                <FilePlus className="h-3 w-3" /> New AuraLink
              </button>
            )}
          </div>
        </div>

        {/* Library strip — your saved AuraLinks */}
        {savedLinks.length > 0 && (
          <section className="mt-8">
            <div className="flex items-end justify-between mb-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                  Your AuraLinks
                </div>
                <div className="font-display text-base">
                  {savedLinks.length} saved
                </div>
              </div>
              {editingId && (
                <button
                  onClick={resetForm}
                  className="btn-ghost"
                >
                  <FilePlus className="h-3.5 w-3.5" /> New
                </button>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
              {savedLinks.map((p) => {
                const t = resolveTheme(p.theme);
                const isActive = editingId === p.id;
                const featured =
                  auras.find(
                    (a) => a.id === (p.featuredAuraId ?? p.selectedAuraIds[0]),
                  );
                return (
                  <div
                    key={p.id}
                    className={
                      "group relative shrink-0 snap-start rounded-2xl border p-3 w-[220px] transition-all " +
                      (isActive
                        ? "border-foreground/40 ring-2 ring-foreground/30"
                        : "border-border/60 hover:border-foreground/20")
                    }
                    style={{ background: t.bg }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="h-10 w-10 rounded-xl overflow-hidden grid place-items-center shrink-0"
                        style={{ boxShadow: t.glow }}
                      >
                        {p.profileImageUrl ? (
                          <img
                            src={p.profileImageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : featured ? (
                          <Aurascope
                            aura={{
                              id: featured.id,
                              palette: featured.palette,
                              seed: featured.seed,
                              auraName: featured.auraName,
                              colors: featured.colors,
                            }}
                            size="mini"
                            mode="minimal"
                            showLabel={false}
                          />
                        ) : (
                          <Sparkles
                            className="h-4 w-4"
                            style={{ color: t.accent }}
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <div
                          className="text-sm font-medium truncate"
                          style={{ color: t.accent }}
                        >
                          {p.title || "Untitled"}
                        </div>
                        <div
                          className="text-[10px] uppercase tracking-[0.2em] truncate opacity-70"
                          style={{ color: t.accent }}
                        >
                          /l/{p.handleSlug}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-1">
                      <button
                        onClick={() => loadForEdit(p.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1 rounded-full h-7 text-[10px] uppercase tracking-[0.22em] border border-foreground/20 hover:bg-foreground/10 transition-colors"
                        style={{ color: t.accent }}
                      >
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                      <button
                        onClick={() => onCopySaved(p.handleSlug)}
                        aria-label="Copy link"
                        className="grid place-items-center h-7 w-7 rounded-full hover:bg-foreground/10"
                        style={{ color: t.accent }}
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <a
                        href={`/l/${p.handleSlug}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Open"
                        className="grid place-items-center h-7 w-7 rounded-full hover:bg-foreground/10"
                        style={{ color: t.accent }}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <button
                        onClick={() => onDeleteSaved(p.id, p.title)}
                        aria-label="Delete"
                        className="grid place-items-center h-7 w-7 rounded-full hover:bg-destructive/20 opacity-70 hover:opacity-100"
                        style={{ color: t.accent }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

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
                        const p = getPersonality(a.palette);
                        const swatches: string[] = (
                          a.colors?.swatches && a.colors.swatches.length > 0
                            ? a.colors.swatches
                            : p.swatches
                        ).slice(0, 4);
                        return (
                          <button
                            key={a.id}
                            onClick={() => toggleAura(a.id)}
                            className={
                              "relative rounded-2xl p-3 border transition-all overflow-hidden text-left " +
                              (sel
                                ? "border-foreground/40 ring-2 ring-foreground/30"
                                : "border-border/60 hover:border-foreground/20")
                            }
                            style={{
                              backgroundImage: `radial-gradient(circle at 50% 0%, ${p.atmosphere}, transparent 70%)`,
                              backgroundColor: "oklch(0.12 0.02 280 / 0.6)",
                              boxShadow: sel
                                ? `0 0 30px -10px ${p.glow}`
                                : undefined,
                            }}
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
                            <div className="mt-2 flex items-center gap-1">
                              {swatches.map((c: string, ix: number) => (
                                <span
                                  key={ix}
                                  className="h-2 flex-1 rounded-full ring-1 ring-foreground/15"
                                  style={{ background: c }}
                                />
                              ))}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {selectedAuraIds.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-aura-gradient/15 border border-foreground/15 px-2.5 h-6 text-[10px] uppercase tracking-[0.24em]">
                            <Star className="h-3 w-3" />
                            Featured plays on hero
                          </div>
                          <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                            · drag to reorder
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          {selectedAuraIds.map((id, i) => {
                            const a = auras.find((x) => x.id === id);
                            if (!a) return null;
                            const p = getPersonality(a.palette);
                            const isFeatured =
                              (featuredAuraId ?? selectedAuraIds[0]) === id;
                            return (
                              <div
                                key={id}
                                className={
                                  "flex items-center gap-2 rounded-xl border px-3 py-2 transition-all " +
                                  (isFeatured
                                    ? "border-foreground/30 ring-1 ring-foreground/20"
                                    : "border-border/60 bg-background/30")
                                }
                                style={
                                  isFeatured
                                    ? {
                                        backgroundImage: `radial-gradient(circle at 0% 50%, ${p.atmosphere}, transparent 70%)`,
                                        boxShadow: `0 0 24px -10px ${p.glow}`,
                                      }
                                    : undefined
                                }
                              >
                                <span className="text-xs text-muted-foreground w-5">
                                  {i + 1}.
                                </span>
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
                                <span className="flex-1 truncate text-sm min-w-0">
                                  <span className="block truncate">
                                    {a.trackTitle}
                                  </span>
                                  <span className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground truncate">
                                    {a.auraName}
                                  </span>
                                </span>
                                <button
                                  onClick={() =>
                                    setFeaturedAuraId(isFeatured ? undefined : id)
                                  }
                                  className={
                                    "grid place-items-center h-8 w-8 rounded-full transition-all " +
                                    (isFeatured
                                      ? "bg-aura-gradient text-primary-foreground shadow-[0_0_20px_-4px_oklch(0.7_0.2_310/0.9)]"
                                      : "border border-border/60 text-muted-foreground hover:text-foreground")
                                  }
                                  aria-label={
                                    isFeatured ? "Unfeature" : "Feature this Aura"
                                  }
                                  title={
                                    isFeatured
                                      ? "Featured on AuraLink hero"
                                      : "Feature this Aura on the AuraLink hero"
                                  }
                                >
                                  <Star
                                    className={
                                      "h-3.5 w-3.5 " +
                                      (isFeatured ? "fill-current" : "")
                                    }
                                  />
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

              {/* Match Aura palette — derive the page look from one of your Auras */}
              {selectedAuraIds.length > 0 && (
                <div className="mt-4 rounded-2xl glass-strong p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                      Match Aura palette
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const f = auras.find(
                          (a) => a.id === (featuredAuraId ?? selectedAuraIds[0]),
                        );
                        if (f) applyAuraPalette(f);
                      }}
                      className="text-[10px] uppercase tracking-[0.22em] text-foreground/70 hover:text-foreground transition-colors"
                    >
                      Use featured Aura
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pull the background, accent and glow straight from one of your Auras. You can
                    fine-tune the colors afterwards.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {auras
                      .filter((a) => selectedAuraIds.includes(a.id))
                      .map((a) => {
                        const sw = auraSwatches(a);
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => applyAuraPalette(a)}
                            className="rounded-xl border border-border/60 hover:border-foreground/25 bg-background/30 px-3 py-2 text-left transition-colors"
                          >
                            <div className="flex gap-1">
                              {sw.map((c, i) => (
                                <span
                                  key={i}
                                  className="h-3 w-3 rounded-full ring-1 ring-foreground/15"
                                  style={{ background: c }}
                                />
                              ))}
                            </div>
                            <div className="mt-1.5 text-[11px] truncate max-w-[140px]">
                              {a.auraName ?? a.title}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

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
                          value={(customTheme as unknown as Record<string, string | undefined>)[f.key] ?? "#1a1430"}
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

            {/* Layout & polish — deep customization that applies to any theme */}
            <Section title="Layout & polish">
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/80 px-1">Heading font</span>
                    <select
                      value={themeExtras.fontHeading ?? "default"}
                      onChange={(e) => setThemeExtras((x) => ({ ...x, fontHeading: e.target.value === "default" ? undefined : e.target.value }))}
                      className="mt-1.5 input-base !h-10"
                    >
                      {FONT_PAIRS.map((p) => (
                        <option key={p.key} value={p.key}>{p.label}{p.heading ? ` — ${p.heading}` : ""}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/80 px-1">Body font</span>
                    <select
                      value={themeExtras.fontBody ?? themeExtras.fontHeading ?? "default"}
                      onChange={(e) => setThemeExtras((x) => ({ ...x, fontBody: e.target.value === "default" ? undefined : e.target.value }))}
                      className="mt-1.5 input-base !h-10"
                    >
                      {FONT_PAIRS.map((p) => (
                        <option key={p.key} value={p.key}>{p.label}{p.body ? ` — ${p.body}` : ""}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <label className="block">
                    <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/80 px-1">Button shape</span>
                    <select
                      value={themeExtras.buttonShape ?? "pill"}
                      onChange={(e) => setThemeExtras((x) => ({ ...x, buttonShape: e.target.value as AuraLinkButtonShape }))}
                      className="mt-1.5 input-base !h-10"
                    >
                      {(["pill","rounded","soft","square","glass"] as AuraLinkButtonShape[]).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/80 px-1">Button style</span>
                    <select
                      value={themeExtras.buttonStyle ?? "solid"}
                      onChange={(e) => setThemeExtras((x) => ({ ...x, buttonStyle: e.target.value as AuraLinkButtonStyle }))}
                      className="mt-1.5 input-base !h-10"
                    >
                      {(["solid","outline","ghost","gradient"] as AuraLinkButtonStyle[]).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/80 px-1">Spacing</span>
                    <select
                      value={themeExtras.spacing ?? "comfy"}
                      onChange={(e) => setThemeExtras((x) => ({ ...x, spacing: e.target.value as AuraLinkSpacing }))}
                      className="mt-1.5 input-base !h-10"
                    >
                      {(["compact","comfy","airy"] as AuraLinkSpacing[]).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/80 px-1 mb-2">Decorations</div>
                  <div className="flex flex-wrap gap-2">
                    {(["grain","stars","bokeh"] as (keyof AuraLinkDecorations)[]).map((k) => {
                      const on = !!themeExtras.decorations?.[k];
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setThemeExtras((x) => ({ ...x, decorations: { ...(x.decorations ?? {}), [k]: !on } }))}
                          className={
                            "rounded-full px-3 h-8 text-[11px] uppercase tracking-[0.2em] border transition-colors " +
                            (on ? "border-foreground/40 bg-foreground/10" : "border-border/60 text-muted-foreground hover:text-foreground")
                          }
                        >
                          {k}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/80 px-1 mb-2">Background</div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(["preset","gradient","image","aura"] as const).map((k) => {
                      const on = (themeExtras.background?.kind ?? "preset") === k;
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() =>
                            setThemeExtras((x) => ({
                              ...x,
                              background: k === "preset" ? undefined : { ...(x.background ?? { kind: k }), kind: k },
                            }))
                          }
                          className={
                            "rounded-full px-3 h-8 text-[11px] uppercase tracking-[0.2em] border transition-colors " +
                            (on ? "border-foreground/40 bg-foreground/10" : "border-border/60 text-muted-foreground hover:text-foreground")
                          }
                        >
                          {k}
                        </button>
                      );
                    })}
                  </div>
                  {themeExtras.background?.kind === "image" && (
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const { uploadAuraLinkCover } = await import("@/lib/auralinkImages");
                            const url = await uploadAuraLinkCover(file);
                            setThemeExtras((x) => ({ ...x, background: { ...(x.background ?? { kind: "image" }), kind: "image", imageUrl: url } }));
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : "Could not upload");
                          }
                        }}
                        className="block text-xs text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-foreground/10 file:px-3 file:py-2 file:text-xs"
                      />
                      <label className="block text-[11px] text-muted-foreground">
                        Overlay darkness
                        <input
                          type="range" min={0} max={100}
                          value={Math.round(((themeExtras.background?.overlayOpacity ?? 0.45)) * 100)}
                          onChange={(e) => setThemeExtras((x) => ({ ...x, background: { ...(x.background ?? { kind: "image" }), kind: "image", overlayOpacity: Number(e.target.value) / 100 } }))}
                          className="w-full"
                        />
                      </label>
                    </div>
                  )}
                  {themeExtras.background?.kind === "gradient" && (
                    <label className="block text-[11px] text-muted-foreground">
                      Angle
                      <input
                        type="range" min={0} max={360}
                        value={themeExtras.background?.gradientAngle ?? 135}
                        onChange={(e) => setThemeExtras((x) => ({ ...x, background: { ...(x.background ?? { kind: "gradient" }), kind: "gradient", gradientAngle: Number(e.target.value) } }))}
                        className="w-full"
                      />
                    </label>
                  )}
                  {themeExtras.background?.kind === "aura" && (
                    <select
                      value={themeExtras.background?.auraId ?? ""}
                      onChange={(e) => setThemeExtras((x) => ({ ...x, background: { ...(x.background ?? { kind: "aura" }), kind: "aura", auraId: e.target.value || undefined } }))}
                      className="input-base !h-10"
                    >
                      <option value="">— Pick an Aura —</option>
                      {auras.map((a) => (
                        <option key={a.id} value={a.id}>{a.auraName} · {a.trackTitle}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/80 px-1 mb-2">Section order</div>
                  <div className="space-y-1.5">
                    {(themeExtras.sectionOrder ?? DEFAULT_SECTION_ORDER).map((k, i, arr) => (
                      <div key={k} className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/30 px-3 py-2">
                        <span className="text-xs text-muted-foreground w-6">{i + 1}.</span>
                        <span className="flex-1 text-sm capitalize">{k}</span>
                        <button
                          className="icon-btn"
                          aria-label="Move up"
                          disabled={i === 0}
                          onClick={() => {
                            const next = [...arr];
                            [next[i - 1], next[i]] = [next[i], next[i - 1]];
                            setThemeExtras((x) => ({ ...x, sectionOrder: next }));
                          }}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="icon-btn"
                          aria-label="Move down"
                          disabled={i === arr.length - 1}
                          onClick={() => {
                            const next = [...arr];
                            [next[i + 1], next[i]] = [next[i], next[i + 1]];
                            setThemeExtras((x) => ({ ...x, sectionOrder: next }));
                          }}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Section>




            {/* SEO & sharing */}
            <Section title="SEO & sharing">
              <p className="text-xs text-muted-foreground mb-3">
                How your AuraLink appears in search results, social previews, and link unfurls.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="SEO title" className="sm:col-span-2">
                  <input
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder={`${(artistName || title || "Artist Name")} | AuraLink`}
                    className="input-base"
                  />
                </Field>
                <Field label="SEO description" className="sm:col-span-2">
                  <textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder={`Listen to ${artistName || title || "[Artist Name]"}, explore Auras, and find all official music links.`}
                    rows={2}
                    className="input-base min-h-[64px] py-2"
                  />
                </Field>
                <Field label="Social preview image (optional)" className="sm:col-span-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onSocialImage(e.target.files?.[0] ?? null)}
                    className="block text-xs text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-foreground/10 file:px-3 file:py-2 file:text-xs"
                  />
                  {uploadingSocial && (
                    <div className="mt-1 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                      Uploading…
                    </div>
                  )}
                  {!uploadingSocial && socialPreviewImage && (
                    <div className="mt-2 flex items-center gap-2">
                      <img src={socialPreviewImage} alt="Social preview" className="h-12 w-12 rounded-md object-cover ring-1 ring-foreground/15" />
                      <button
                        onClick={() => setSocialPreviewImage("")}
                        className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground hover:text-foreground"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </Field>
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
                disabled={!canPublish || publishing}
                className="btn-primary ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {publishing ? "Publishing AuraLink…" : editingId ? "Update AuraLink" : "Publish AuraLink"}
              </button>
            </div>
          </div>

          {/* ----- Preview column ----- */}
          <aside className={showPreview ? "" : "hidden lg:block"}>
            <div className="lg:sticky lg:top-20">
              <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">
                Live Preview
              </div>
              <p className="text-[10px] text-muted-foreground mb-2">
                AuraLinks are public and shareable. Creation access is currently limited.
              </p>
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
