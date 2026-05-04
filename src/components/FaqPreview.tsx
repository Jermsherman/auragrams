import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getHomepageFaqs } from "@/lib/faq";

export function FaqPreview() {
  const items = getHomepageFaqs();
  return (
    <section className="relative">
      <div className="mx-auto max-w-3xl px-5 sm:px-8 py-20">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 h-7 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            FAQ
          </div>
          <h2 className="mt-4 font-display text-3xl sm:text-4xl tracking-tight">
            Questions before you{" "}
            <span className="text-aura-gradient">create?</span>
          </h2>
        </div>

        <div className="mt-10 glass rounded-3xl p-2 sm:p-4">
          <Accordion type="single" collapsible className="w-full">
            {items.map((it, i) => (
              <AccordionItem
                key={it.q}
                value={`faq-${i}`}
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

        <div className="mt-8 flex justify-center">
          <Link
            to="/faq"
            className="inline-flex items-center gap-2 rounded-full glass-strong px-5 h-10 text-sm hover:opacity-90 transition-opacity"
          >
            View Full FAQ <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
