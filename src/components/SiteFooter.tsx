import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-steam-deep/10 bg-white/50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p
              className="text-lg text-steam-deep"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Project<span className="text-steam-warm">_</span>Steam
            </p>
            <p className="mt-2 max-w-sm text-sm text-steam-muted">
              Student-shared STEM knowledge for learners across India and the
              world — free, reviewed, and searchable.
            </p>
          </div>
          <div className="flex gap-8 text-sm text-steam-muted">
            <div className="space-y-2">
              <p className="font-medium text-steam-ink">Explore</p>
              <Link href="/browse" className="block hover:text-steam-deep">
                All subjects
              </Link>
              <Link href="/search" className="block hover:text-steam-deep">
                Search
              </Link>
              <Link href="/ask" className="block hover:text-steam-deep">
                Ask AI
              </Link>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-steam-ink">Community</p>
              <Link href="/submit" className="block hover:text-steam-deep">
                Submit content
              </Link>
              <Link href="/about" className="block hover:text-steam-deep">
                About the project
              </Link>
              <Link href="/admin" className="block hover:text-steam-deep">
                Admin
              </Link>
            </div>
          </div>
        </div>
        <p className="mt-8 text-xs text-steam-muted">
          Built as a passion project. Content is community-submitted and
          reviewed before publishing.
        </p>
      </div>
    </footer>
  );
}
