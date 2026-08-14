import Link from "next/link";
import { Icon } from "./Icon";
import { siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer__row">
          <div className="footer__brand">
            <Link href="/" className="nav__brand">
              <span className="brand-mark">
                <Icon name="atom" />
              </span>
              Project <span className="brand-accent">Steam</span>
            </Link>
            <p className="footer__tagline">{siteConfig.description}</p>
          </div>

          <div className="footer__nav">
            <p className="footer__nav-title">Explore</p>
            <Link href="/browse">All subjects</Link>
            <Link href="/search">Search</Link>
            <Link href="/ask">Ask AI</Link>
          </div>

          <div className="footer__nav">
            <p className="footer__nav-title">Community</p>
            <Link href="/submit">Share your work</Link>
            <Link href="/about">About</Link>
            <Link href="/admin">Editor login</Link>
          </div>

          <div className="footer__nav">
            <p className="footer__nav-title">Contact</p>
            <a href={`mailto:${siteConfig.submitEmail}`}>
              {siteConfig.submitEmail}
            </a>
          </div>
        </div>

        <p className="footer__bottom">
          A student passion project. Content is shared by students and reviewed
          before publishing.
        </p>
      </div>
    </footer>
  );
}
