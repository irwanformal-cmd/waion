import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { AiSection } from "@/components/landing/AiSection";
import { Benefits } from "@/components/landing/Benefits";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <AiSection />
        <Benefits />
      </main>
      <Footer />
    </>
  );
}