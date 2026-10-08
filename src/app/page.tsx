import { About } from "@/components/About";
import { Atmosphere } from "@/components/Atmosphere";
import { Barbers } from "@/components/Barbers";
import { Career } from "@/components/Career";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { JsonLd } from "@/components/JsonLd";
import { Maps } from "@/components/Maps";
import { Navbar } from "@/components/Navbar";

export default function Home() {
  return (
    <>
      <JsonLd />
      <Navbar />
      <main className="overflow-x-clip">
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
