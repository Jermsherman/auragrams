import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { AuraLinkView } from "@/components/AuraLinkView";
import { getAuraLinkBySlug, type AuraLinkPage } from "@/lib/auralink";
import { getSavedAuras, type SavedAura } from "@/lib/farm";

type LoaderData = {
  seoTitle: string;
  seoDescription: string;
  ogImage?: string;
};

export const Route = createFileRoute("/l/$slug")({
  // AuraLink data lives in localStorage, so on SSR/prerender we can't read
  // the real page. Fall back to generic copy in that environment and let the
  // client component re-render the real page after hydration.
  loader: ({ params }): LoaderData => {
    if (typeof window === "undefined") {
      return {
        seoTitle: "AuraLink — Auragram",
        seoDescription:
          "A music-first link page built on Auragram.",
      };
    }
    const page = getAuraLinkBySlug(params.slug);
    if (!page) {
      return {
        seoTitle: "AuraLink — Auragram",
        seoDescription: "A music-first link page built on Auragram.",
      };
    }
    const artist = page.artistName || page.title || "Artist";
    return {
      seoTitle: page.seoTitle || `${artist} | AuraLink`,
      seoDescription:
        page.seoDescription ||
        `Listen to ${artist}, explore Auras, and find all official music links.`,
      ogImage: page.socialPreviewImage || page.profileImageUrl,
    };
  },
  head: ({ loaderData }) => {
    const d = loaderData as LoaderData | undefined;
    const title = d?.seoTitle ?? "AuraLink — Auragram";
    const description = d?.seoDescription ?? "A music-first link page built on Auragram.";
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: d?.ogImage ? "summary_large_image" : "summary" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ];
    if (d?.ogImage) {
      meta.push({ property: "og:image", content: d.ogImage });
      meta.push({ name: "twitter:image", content: d.ogImage });
    }
    return { meta };
  },
  component: PublicAuraLink,
});

function PublicAuraLink() {
  const { slug } = useParams({ from: "/l/$slug" });
  const [page, setPage] = useState<AuraLinkPage | null | undefined>(undefined);
  const [auras, setAuras] = useState<SavedAura[]>([]);

  useEffect(() => {
    setPage(getAuraLinkBySlug(slug));
    setAuras(getSavedAuras());
  }, [slug]);

  if (page === undefined) {
    return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (page === null) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="text-center">
          <h1 className="font-display text-3xl">AuraLink not found.</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This AuraLink may have been removed or never existed.
          </p>
          <Link
            to="/auralink/create"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-aura-gradient text-primary-foreground h-11 px-5 text-sm font-medium"
          >
            Build AuraLink
          </Link>
        </div>
      </div>
    );
  }

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: page.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("AuraLink copied.");
      }
    } catch {
      /* cancelled */
    }
  };

  return (
    <div className="min-h-screen relative">
      <button
        onClick={share}
        aria-label="Share AuraLink"
        className="fixed top-4 right-4 z-30 inline-flex items-center gap-2 rounded-full glass px-4 h-10 text-xs"
      >
        <Share2 className="h-4 w-4" /> Share
      </button>
      <AuraLinkView page={page} auras={auras} />
    </div>
  );
}
