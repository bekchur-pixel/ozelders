"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Bugün", icon: "🏠" },
  { href: "/dersler", label: "Dersler", icon: "📅" },
  { href: "/takvim", label: "Takvim", icon: "🗓️" },
  { href: "/dersler/yeni", label: "Yeni", icon: "➕" },
  { href: "/ogrenciler", label: "Öğrenci", icon: "🎹" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {items.map((it) => {
          const active =
            it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
                active ? "text-rose-700" : "text-stone-500"
              }`}
            >
              <span className="text-xl leading-none">{it.icon}</span>
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
