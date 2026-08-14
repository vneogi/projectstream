"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthButton } from "./AuthButton";
import { Icon } from "./Icon";

const links = [
  { href: "/browse", label: "Browse" },
  { href: "/search", label: "Search" },
  { href: "/ask", label: "Ask AI" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="site-header">
      <div className="container">
        <nav className="nav">
          <Link href="/" className="nav__brand">
            <span className="brand-mark">
              <Icon name="atom" />
            </span>
            Project <span className="brand-accent">STEAM</span>
          </Link>

          <div className="nav__links">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="nav__actions">
            <AuthButton />
            <Link href="/submit" className="btn btn--primary btn--sm nav__cta">
              Share your work
              <Icon name="arrow-right" />
            </Link>
            <button
              type="button"
              className="nav__toggle"
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              <Icon name={open ? "close" : "menu"} />
            </button>
          </div>
        </nav>

        {open && (
          <div className="nav__panel">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
            <Link href="/auth/login">Sign in to download</Link>
            <Link href="/submit" className="btn btn--primary">
              Share your work
              <Icon name="arrow-right" />
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
