import { Hero } from "@/components/home/hero";
import { Trust } from "@/components/home/trust";
import { Services } from "@/components/home/services";
import { FeaturedProjects } from "@/components/home/projects";
import { WhyBuildora } from "@/components/home/why-buildora";
import { Process } from "@/components/home/process";
import { Testimonials } from "@/components/home/testimonials";
import { FinalCta } from "@/components/home/final-cta";

export default function Home() {
  return (
    <main className="overflow-hidden">
      <Hero />
      <Trust />
      <Services />
      <FeaturedProjects />
      <WhyBuildora />
      <Process />
      <Testimonials />
      <FinalCta />
    </main>
  );
}