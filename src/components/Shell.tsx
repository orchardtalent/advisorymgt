"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard",   label: "Dashboard" },
  { href: "/engagements", label: "Engagements" },
  { href: "/settings",    label: "Settings" },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-bg">
      <header className="bg-dark-teal px-gutter flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/otg-logo-icon-light.svg" alt="" className="h-7 w-auto" />
            <span className="text-on-dark font-black text-base tracking-tight">Orchard Advisory</span>
          </span>
          <nav className="flex items-center gap-1">
            {NAV.map(n => (
              <Link
                key={n.href}
                href={n.href}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors duration-fast ${
                  pathname.startsWith(n.href)
                    ? "bg-white/15 text-on-dark"
                    : "text-on-dark/60 hover:text-on-dark hover:bg-white/10"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-on-dark/60 text-sm">{session?.user?.name}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-on-dark/60 hover:text-on-dark text-sm transition-colors duration-fast"
          >
            Sign out
          </button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
