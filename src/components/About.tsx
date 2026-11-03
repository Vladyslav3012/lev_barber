import { site } from "@/data/site";
import { Reveal } from "./Reveal";

export function About() {
  return (
    <section id="about" className="px-5 pt-24 pb-12 md:px-10 md:pt-32 md:pb-16 lg:px-16">
      <Reveal>
        <h2 className="max-w-4xl font-display text-[2.4rem] leading-[1.15] font-medium tracking-[-0.02em] text-mist sm:text-5xl lg:text-[3.5rem]">
          {site.statement}
        </h2>
      </Reveal>
      <div className="mt-10 max-w-xl space-y-5 text-[15px] leading-7 text-mist/78 md:text-base">
        {site.about.map((paragraph) => (
          <Reveal key={paragraph}>
            <p>{paragraph}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
