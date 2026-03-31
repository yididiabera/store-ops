import Link from "next/link";
import { AppNavigation } from "@/components/app/app-navigation";
import { SectionIntro } from "@/components/app/section-intro";

const primaryNavigation = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "dashboard",
  },
  {
    href: "/sales",
    label: "Sales",
    icon: "sales",
  },
  {
    href: "/products",
    label: "Products",
    icon: "menu",
  },
  {
    href: "/orders",
    label: "Orders",
    icon: "orders",
  },
];

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative h-screen overflow-hidden px-4 py-4 sm:px-6 sm:py-6">
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-25" />
      <div className="pointer-events-none absolute left-[-10rem] top-0 h-80 w-80 rounded-full bg-white/60 blur-3xl" />
      <div className="pointer-events-none absolute right-[-6rem] top-20 h-96 w-96 rounded-full bg-[#f0c8ae]/60 blur-3xl" />

      <div className="relative mx-auto grid h-[calc(100vh-2rem)] w-full max-w-7xl gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="glass-panel flex h-full flex-col overflow-hidden rounded-[1.5rem] p-4 lg:p-5">
          <div className="flex items-center gap-3 px-2 pt-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-[0.7rem] bg-[linear-gradient(135deg,#7a3e2a,#2e1b17)] text-xs font-bold text-[#f1ceb9]">
              VC
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-[color:var(--foreground)]">
              Admin
            </h1>
          </div>

          <AppNavigation items={primaryNavigation} />

          <div className="mt-auto pt-4">
            <Link
              href="/"
              className="flex w-full items-center justify-center gap-2 rounded-[1rem] border border-[color:var(--line)] bg-white/60 px-4 py-3 text-sm font-semibold text-[color:var(--foreground)] transition-colors hover:bg-white/80"
            >
              Back to Store
            </Link>
          </div>
        </aside>

        <div className="glass-panel flex h-full min-h-0 flex-col overflow-hidden rounded-[1.5rem] p-4 sm:p-5">
          <header className="mb-4 flex min-h-[3.85rem] flex-col justify-center gap-2 border-b border-[color:var(--line)] pb-3 pt-0 lg:flex-row lg:items-center lg:justify-between">
            <SectionIntro />

            <div className="flex flex-col justify-center gap-3 sm:flex-row sm:items-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-[0.95rem] border border-[color:var(--accent-soft)] bg-white/72 px-4 py-2.5 text-sm font-semibold text-[color:var(--accent-deep)] transition-colors hover:bg-white"
              >
                Logout
              </Link>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
