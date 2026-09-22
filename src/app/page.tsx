import { Hero } from "@/components/home/hero";
import { FinalCta } from "@/components/home/final-cta";
import { Services } from "@/components/home/services";
import { Trust } from "@/components/home/trust";

export default function Home() {
  return (
    <main>
      <Hero />
      <Trust />
      <Services />
      <FinalCta />
    </main>
  );
}