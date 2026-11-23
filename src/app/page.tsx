import { IntroProvider } from "@/lib/intro";
import { Intro } from "@/components/Intro";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Arsenal } from "@/components/sections/Arsenal";
import { Projects } from "@/components/sections/Projects";
import { Experience } from "@/components/sections/Experience";
import { Journey } from "@/components/sections/Journey";
import { Exploring } from "@/components/sections/Exploring";
import { Contact } from "@/components/sections/Contact";

export default function Home() {
  return (
    <IntroProvider>
      <Intro />
      <Nav />
      <main id="main">
        <Hero />
        <About />
        <Arsenal />
        <Projects />
        <Experience />
        <Journey />
        <Exploring />
        <Contact />
      </main>
    </IntroProvider>
  );
}
