import Image from "next/image";
import Link from "next/link";
import { PostCard } from "@/components/PostCard";
import { SearchBar } from "@/components/SearchBar";
import { SubjectCard } from "@/components/SubjectCard";
import { listPublishedPosts, listSubjects } from "@/lib/data";

export default async function HomePage() {
  const subjects = await listSubjects();
  const posts = await listPublishedPosts();
  const recent = posts.slice(0, 4);

  const counts = Object.fromEntries(
    subjects.map((s) => [
      s.slug,
      posts.filter((p) => p.subjectSlug === s.slug).length,
    ]),
  );

  return (
    <>
      <section className="relative min-h-[88vh] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=2400&q=80"
          alt="Students learning together in a classroom"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-steam-deep/85 via-steam-deep/70 to-steam-cream" />

        <div className="hero-grid absolute inset-0 opacity-30" />

        <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6 sm:pb-20">
          <p className="fade-up text-sm font-medium uppercase tracking-[0.2em] text-steam-sky">
            Student passion project
          </p>
          <h1
            className="fade-up-delay mt-4 max-w-3xl text-5xl leading-[1.05] text-white sm:text-6xl lg:text-7xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Project<span className="text-steam-gold">_</span>Steam
          </h1>
          <p className="fade-up-delay-2 mt-5 max-w-xl text-lg leading-relaxed text-white/90 sm:text-xl">
            Hundreds of students share STEM notes and ideas by email. We
            organize them here — free for millions who need clear, honest
            learning.
          </p>
          <div className="fade-up-delay-2 mt-8 flex flex-wrap gap-3">
            <Link
              href="/browse"
              className="bg-steam-warm px-6 py-3 font-medium text-white transition hover:bg-white hover:text-steam-deep"
            >
              Explore subjects
            </Link>
            <Link
              href="/submit"
              className="border border-white/40 px-6 py-3 font-medium text-white transition hover:bg-white/10"
            >
              Share your knowledge
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="max-w-2xl">
          <h2
            className="text-3xl text-steam-deep sm:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Find what you need
          </h2>
          <p className="mt-3 text-steam-muted">
            Search across physics, chemistry, math, coding, and more — written
            by students like you.
          </p>
        </div>
        <div className="mt-8">
          <SearchBar large />
        </div>
      </section>

      <section className="border-y border-steam-deep/10 bg-white/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2
            className="text-3xl text-steam-deep"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Subjects
          </h2>
          <p className="mt-2 text-steam-muted">
            Every article is categorized so you can browse by topic.
          </p>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                count={counts[subject.slug] ?? 0}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2
              className="text-3xl text-steam-deep"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Recent articles
            </h2>
            <p className="mt-2 text-steam-muted">
              Reviewed and published for the community.
            </p>
          </div>
          <Link
            href="/browse"
            className="text-sm font-medium text-steam-mid hover:text-steam-deep"
          >
            View all →
          </Link>
        </div>
        <div className="mt-10 grid gap-10 sm:grid-cols-2">
          {recent.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </section>
    </>
  );
}
