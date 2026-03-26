"use client";

import { usePathname } from "next/navigation";

const sectionMeta = {
  "/dashboard": {
    title: "Dashboard",
  },
  "/products": {
    title: "Products",
  },
  "/sales": {
    title: "Sales",
  },
  "/orders": {
    title: "Orders",
  },
  "/customers": {
    title: "Customers",
  },
} as const;

export function SectionIntro() {
  const pathname = usePathname();
  const current =
    Object.entries(sectionMeta).find(([route]) => pathname === route || pathname.startsWith(`${route}/`))?.[1] ??
    sectionMeta["/dashboard"];

  return (
    <div>
      <h1 className="text-[1.9rem] font-semibold leading-none tracking-tight">
        {current.title}
      </h1>
    </div>
  );
}
