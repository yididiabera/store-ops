import Link from "next/link";

const quickStats = [
  { label: "Products", value: "05" },
  { label: "Orders", value: "05" },
  { label: "Today", value: "ETB 620" },
];

const quickLinks = [
  { href: "/dashboard", label: "Dashboard", note: "Overview" },
  { href: "/products", label: "Products", note: "Catalog" },
  { href: "/orders", label: "Orders", note: "Flow" },
];

export default function Home() {
  return (
    <main className="royal-shell royal-grain relative overflow-hidden px-5 py-4 sm:px-10 sm:py-5 lg:px-14 lg:py-6 xl:px-18">
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-20" />
      <div className="ambient-orb pointer-events-none absolute left-[-10rem] top-20 h-80 w-80 rounded-full bg-white/65 blur-3xl" />
      <div className="ambient-orb-delay pointer-events-none absolute right-[-6rem] top-16 h-[26rem] w-[26rem] rounded-full bg-[#f0c8ae]/65 blur-3xl" />
      <div className="ambient-orb pointer-events-none absolute bottom-10 right-[22%] h-52 w-52 rounded-full bg-[#fff7ef]/70 blur-3xl" />

      <section className="relative mx-auto flex min-h-[100svh] w-full max-w-[1500px] flex-col justify-center">
        <header className="glass-panel royal-sheen mb-8 flex items-center justify-between rounded-[1.9rem] px-5 py-4 sm:px-7 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,#9a5d45,#2e1b17)] text-sm font-semibold text-[#fff7f1] shadow-[0_10px_26px_rgba(46,27,23,0.24)]">
              VC
            </div>
            <div>
              <p className="font-display text-2xl italic tracking-wide">Veloura Cakes</p>
              <p className="gold-text text-xs uppercase tracking-[0.28em]">
                Management demo
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-3 md:flex">
            {quickLinks.map((item) => (
              <Link key={item.href} href={item.href} className="action-button action-neutral px-5 py-2.5">
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_0.84fr] lg:items-center xl:gap-12">
          <section className="hero-haze space-y-8 py-2 lg:py-4">
            <div className="royal-chip inline-flex w-fit rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] gold-text">
              Signature atelier
            </div>

            <div className="space-y-5">
              <h1 className="hero-headline font-display max-w-[13ch] text-[2.7rem] leading-[0.95] font-semibold tracking-[-0.04em] sm:text-[3.35rem] lg:text-[4.05rem] xl:text-[4.35rem]">
                Cake shop management with a royal finish.
              </h1>
              <p className="max-w-lg text-[0.96rem] leading-7 text-[color:var(--muted)]">
                Soft, refined, and presentation-ready for premium clients.
              </p>
            </div>

            <div className="royal-divider max-w-lg" />

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/dashboard" className="action-button action-add px-7 py-3.5">
                Open dashboard
              </Link>
              <Link href="/products" className="action-button action-neutral px-7 py-3.5">
                Manage products
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:max-w-2xl">
              {quickStats.map((stat) => (
                <article key={stat.label} className="glass-panel royal-chip rounded-[1.7rem] p-4">
                  <p className="text-sm text-[color:var(--muted)]">{stat.label}</p>
                  <p className="mt-2 text-[2rem] font-semibold tracking-tight">{stat.value}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="floating-card lg:px-4 xl:px-6">
            <div className="glass-panel royal-frame royal-sheen overflow-hidden rounded-[2.2rem] bg-white/60 p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="gold-text text-sm uppercase tracking-[0.28em]">
                  Live preview
                </p>
                <span className="royal-chip rounded-full px-4 py-2 text-sm font-semibold gold-text">
                  Ready
                </span>
              </div>

              <div className="space-y-3">
                <div className="royal-chip rounded-[1.8rem] p-4">
                  <p className="text-sm text-[color:var(--muted)]">Featured order</p>
                  <p className="mt-2 font-display text-[2rem] leading-none italic sm:text-[2.35rem]">
                    Ivory Wedding Cake
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1.25rem] bg-white/88 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                      <p className="text-sm text-[color:var(--muted)]">Due</p>
                      <p className="mt-2 text-lg font-semibold">March 27</p>
                    </div>
                    <div className="rounded-[1.25rem] bg-white/88 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                      <p className="text-sm text-[color:var(--muted)]">Status</p>
                      <p className="mt-2 text-lg font-semibold">In Production</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_0.85fr]">
                  <div className="rounded-[1.8rem] bg-[linear-gradient(180deg,#3b241f,#2a1714)] p-4 text-[#fff6ef] shadow-[0_20px_50px_rgba(42,23,20,0.22)]">
                    <p className="text-sm uppercase tracking-[0.24em] text-[#f0d29f]">Queue</p>
                    <div className="mt-4 space-y-2.5">
                      <div className="rounded-[1.15rem] border border-white/8 bg-white/8 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                        <p className="font-medium">Bake tiers</p>
                      </div>
                      <div className="rounded-[1.15rem] border border-white/8 bg-white/8 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                        <p className="font-medium">Final finish</p>
                      </div>
                    </div>
                  </div>

                  <div className="royal-chip rounded-[1.8rem] p-4">
                    <p className="gold-text text-sm uppercase tracking-[0.24em]">
                      Shop pulse
                    </p>
                    <p className="mt-4 font-display text-[2.8rem] italic">94%</p>
                    <div className="mt-4 h-2 rounded-full bg-white/80">
                      <div className="h-2 w-[94%] rounded-full bg-[linear-gradient(90deg,#c79562,#8f5838)]" />
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {quickLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="royal-chip rounded-[1.25rem] px-4 py-3 transition-transform duration-300 hover:-translate-y-0.5"
                    >
                      <p className="gold-text text-xs uppercase tracking-[0.22em]">
                        {item.note}
                      </p>
                      <p className="mt-1.5 text-base font-semibold">{item.label}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
