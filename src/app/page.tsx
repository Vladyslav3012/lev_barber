import dynamic from "next/dynamic";
import { About } from "@/components/About";
import { Atmosphere } from "@/components/Atmosphere";
import { Barbers } from "@/components/Barbers";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { JsonLd } from "@/components/JsonLd";
import { Maps } from "@/components/Maps";
import { Navbar } from "@/components/Navbar";

const Career = dynamic(
  () =>
    import("@/components/Career").then((mod) => ({ default: mod.Career })),
  {
    loading: () => (
      <section
        id="career"
        className="min-h-[28rem] px-5 py-24 md:px-10 md:py-32 lg:px-16"
        aria-hidden
      />
    ),
  },
);

export default function Home() {
  return (
    <>
      <JsonLd />
      <a href="#main" className="skip-link">
        До змісту
      </a>
      <Navbar />
      <main id="main" className="overflow-x-clip" tabIndex={-1}>
        <Hero />
        <About />
        <Barbers />
        <Atmosphere />
        <Maps />
        <Career />
      </main>
      <Footer />
    </>
  );
}
