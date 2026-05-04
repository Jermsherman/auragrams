import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { ArrowRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQ } from "@/lib/faq";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "How to Use Auragram — FAQ" },
      {
        name: "description",
        content:
          "Learn how Auragram works: Auras, Aurascopes, AuraLinks, the Farm, Auracles, uploads, music links, and troubleshooting.",
      },
      { property: "og:title", content: "How to Use Auragram — FAQ" },
      {
        property: "og:description",
        content:
          "Create living music visuals, save them to your Farm, and share them anywhere with AuraLinks.",
      },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav showCta={false} />
      <main className="flex-1 mx-auto w-full max-w-3xl px-5 sm:px-8 py-12 sm:py-20">
        <div className="text-center animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 h-7 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            FAQ
          </div>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl tracking-tight">
            How to Use <span className="text-aura-gradient">Auragram.</span>
          </h1>
          <p className="mt-4 text-muted-foreground text-sm sm:text-base">
            Create living music visuals, save them to your Farm, and share them
            anywhere with AuraLinks.
          </p>
        </div>

        {/* Section nav */}
        <nav className="mt-10 flex flex-wrap justify-center gap-2 animate-fade-up">
          {FAQ.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="rounded-full glass px-3 h-8 inline-flex items-center text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
            >
              {s.title}
            </a>
          ))}
        </nav>

        <div className="mt-12 space-y-10 animate-fade-up">
          {FAQ.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-24"
            >
              <h2 className="font-display text-2xl sm:text-3xl tracking-tight mb-4">
                {section.title}
              </h2>
              <div className="glass rounded-3xl p-2 sm:p-4">
                <Accordion type="multiple" className="w-full">
                  {section.items.map((it, i) => (
                    <AccordionItem
                      key={it.q}
                      value={`${section.id}-${i}`}
                      className="border-border/40 last:border-b-0"
                    >
                      <AccordionTrigger className="text-left text-sm sm:text-base font-display px-3 sm:px-4 hover:no-underline">
                        {it.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground px-3 sm:px-4 leading-relaxed">
                        {it.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/create"
            className="inline-flex items-center justify-center gap-2 rounded-full px-6 h-11 text-sm font-medium text-primary-foreground bg-aura-gradient"
          >
            Create Aura <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/auralink/create"
            className="inline-flex items-center justify-center gap-2 rounded-full px-6 h-11 text-sm font-medium glass-strong"
          >
            Build AuraLink
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
