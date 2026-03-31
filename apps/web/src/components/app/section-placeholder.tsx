type SectionPlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
};

export function SectionPlaceholder({
  eyebrow,
  title,
  description,
  bullets,
}: SectionPlaceholderProps) {
  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] bg-[linear-gradient(135deg,#fff9f4,#f5dfd0)] p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.22em] text-[color:var(--accent-deep)]">
          {eyebrow}
        </p>
        <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {title}
        </h2>
        <p className="mt-5 max-w-3xl text-base leading-8 text-[color:var(--muted)] sm:text-lg">
          {description}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {bullets.map((bullet, index) => (
          <article key={bullet} className="rounded-[1.75rem] bg-white/72 p-5">
            <p className="text-sm text-[color:var(--muted)]">Milestone {index + 1}</p>
            <p className="mt-3 text-xl font-semibold leading-8">{bullet}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[2rem] bg-[#2f1d19] p-6 text-[#fff7f1] sm:p-8">
        <p className="text-sm uppercase tracking-[0.22em] text-[#f3d5c5]">
          Status
        </p>
        <p className="mt-4 text-2xl font-semibold">
          This section is scaffolded and ready for the next implementation pass.
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#ecd7cb]">
          The route exists so the product feels cohesive during demos, while the next phase focuses on replacing these placeholders with full CRUD screens and real data interactions.
        </p>
      </section>
    </main>
  );
}
