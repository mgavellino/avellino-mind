import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";

import { FAQ } from "@/components/landing/FAQ";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";
import ogImage from "@/assets/og-avellpsy.jpg";

const TITLE = "AvellPsy — Plataforma de gestão para psicólogos e clínicas";
const DESCRIPTION =
  "Agenda inteligente, prontuário com autosave, pagamentos e admin em um só lugar. Compliance LGPD, design premium e teste grátis.";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: "/" },
      { property: "og:image", content: ogImage },
      { name: "twitter:image", content: ogImage },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});


function Index() {
  return (
    <main className="min-h-screen bg-background text-foreground antialiased">
      <Navbar />
      <Hero />
      <Features />
      <Pricing />
      
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
