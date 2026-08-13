import Link from "next/link";

const links = [
  { href: "/browse", label: "Browse" },
  { href: "/search", label: "Search" },
  { href: "/ask", label: "Ask AI" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-steam-deep/10 bg-steam-cream/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2">
          <span
            className="font-display text-xl tracking-tight text-steam-deep sm:text-2xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Project<span className="text-steam-warm">_</span>Steam
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-2 py-1.5 text-sm text-steam-muted transition-colors hover:text-steam-deep sm:px-3"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/submit"
            className="ml-1 rounded-md bg-steam-deep px-3 py-1.5 text-sm text-white transition hover:bg-steam-mid sm:ml-2"
          >
            Share
          </Link>
        </nav>
      </div>
    </header>
  );
}
