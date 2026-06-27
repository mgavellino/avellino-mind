import { createFileRoute } from "@tanstack/react-router";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import About from "@/components/landing/About";
import Services from "@/components/landing/Services";
import TCC from "@/components/landing/TCC";
import Space from "@/components/landing/Space";
import Location from "@/components/landing/Location";
import Testimonials from "@/components/landing/Testimonials";
import FAQ from "@/components/landing/FAQ";
import WhatsAppCTA from "@/components/landing/WhatsAppCTA";
import Footer from "@/components/landing/Footer";
import MusicPlayer from "@/components/landing/MusicPlayer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aline Dias — Psicóloga Clínica em Santa Luzia/MG" },
      {
        name: "description",
        content:
          "Psicóloga clínica em Santa Luzia/MG. Terapia Cognitivo-Comportamental para adolescentes e adultos — atendimento presencial e online.",
      },
      { property: "og:title", content: "Aline Dias — Psicóloga Clínica" },
      {
        property: "og:description",
        content: "Conheça o trabalho de Aline Dias. Atendimento humano, acolhedor e baseado em evidências.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <>
      <Navbar />
      <Hero />
      <About />
      <Services />
      <TCC />
      <Space />
      <Location />
      <Testimonials />
      <FAQ />
      <WhatsAppCTA />
      <Footer />
      <MusicPlayer />
    </>
  );
}
