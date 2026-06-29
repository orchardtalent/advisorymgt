"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/settings/rate-cards",  label: "Rate cards" },
  { href: "/settings/consultants", label: "Consultants" },
  { href: "/settings/services",    label: "Engagement types" },
];

export default function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1.5 mb-6">
      {TABS.map(t => (
        <Link
          key={t.href}
          href={t.href}
          className={`otg-btn otg-btn--sm ${pathname.startsWith(t.href) ? "otg-btn--primary" : "otg-btn--ghost"}`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
