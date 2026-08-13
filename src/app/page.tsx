import Link from "next/link";
import { Icon } from "@/components/Icon";
import { PostCard } from "@/components/PostCard";
import { SearchBar } from "@/components/SearchBar";
import { SubjectCard } from "@/components/SubjectCard";
import { listPublishedPosts, listSubjects } from "@/lib/data";

const steps = [
  {
    icon: "send" as const,
    title: "Students share",
    desc: "Hundreds of students email their notes, experiments, and explanations.",
  },
  {
    icon: "inbox" as const,
    title: "We review",
    desc: "Every submission is read and checked for clarity and accuracy.",
  },
  {
    icon: "tag" as const,
    title: "We organize",
    desc: "Content is sorted by subject and topic so it is easy to find.",
  },
  {
    icon: "users" as const,
    title: "Everyone learns",
    desc: "Published free for any student with an internet connection.",
  },
];

const features = [
  {
    icon: "search" as const,
    title: "Search that works",
    desc: "Find explanations by subject, topic, or class level in seconds.",
    href: "/search",
    linkLabel: "Try search",
  },
  {
    icon: "sparkles" as const,
    title: "Ask AI, grounded",
    desc: "Get answers built only from our published articles, with sources shown.",
    href: "/ask",
    linkLabel: "Ask a question",
  },
  {
    icon: "book" as const,
    title: "Written by students",
    desc: "Real explanations from peers who just learned it themselves.",
    href: "/browse",
    linkLabel: "Browse library",
  },
];

export default async function HomePage() {
  const subjects = await listSubjects();
  const posts = await listPublishedPosts();
  const recent = posts.slice(0, 3);

  const counts = Object.fromEntries(
    subjects.map((s) => [
      s.slug,
      posts.filter((p) => p.subjectSlug === s.slug).length,
    ]),
  );

  return (
    <>
      <section className="hero">
        <div className="page-glow" />
        <div className="container hero__inner">
          <div className="hero__grid">
            <div className="reveal">
              <span className="hero__eyebrow">Student passion project</span>
              <h1 className="hero__title">
                STEM knowledge, shared by students
                <span className="hero__title-dot">.</span>
              </h1>
              <p className="hero__lead">
                Free, clear, and open to every learner.
              </p>
              <p className="hero__desc">
                Hundreds of students send us their best notes and ideas. We
                organize them by subject so millions of learners across India
                and the world can find them.
              </p>
              <div className="hero__ctas">
                <Link href="/browse" className="btn btn--primary">
                  Explore the library
                  <Icon name="arrow-right" />
                </Link>
                <Link href="/submit" className="btn btn--secondary">
                  Share your work
                </Link>
              </div>
              <div className="stat-row">
                <div>
                  <p className="stat__value">{posts.length}</p>
                  <p className="stat__label">Published articles</p>
                </div>
                <div>
                  <p className="stat__value">{subjects.length}</p>
                  <p className="stat__label">Subjects covered</p>
                </div>
                <div>
                  <p className="stat__value">Free</p>
                  <p className="stat__label">Always, for everyone</p>
                </div>
              </div>
            </div>

            <div className="hero__art reveal" style={{ "--d": "0.15s" } as React.CSSProperties}>
              <div className="art-card">
                <div className="art-card__head">
                  <span className="art-card__dot" />
                  <span className="art-card__dot" />
                  <span className="art-card__dot" />
                  <span className="art-card__label">Latest submissions</span>
                </div>
                {(recent.length > 0 ? recent : posts.slice(0, 3)).map((post) => (
                  <div key={post.id} className="art-row">
                    <span className="art-row__icon">
                      <Icon name="book" />
                    </span>
                    <div>
                      <p className="art-row__title">{post.title}</p>
                      <p className="art-row__meta">{post.subjectName}</p>
                    </div>
                  </div>
                ))}
              </div>
              <span className="art-badge">
                <Icon name="check" />
                Reviewed before publishing
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <div className="panel">
            <SearchBar />
          </div>
        </div>
      </section>

      <section className="section how">
        <div className="container">
          <span className="section__eyebrow section__eyebrow--center">
            How it works
          </span>
          <h2 className="section__title section__title--center">
            From an email to a lesson anyone can find
          </h2>
          <div className="how__grid">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="how__step reveal"
                style={{ "--d": `${i * 0.08}s` } as React.CSSProperties}
              >
                <span className="how__icon">
                  <span className="how__badge">{i + 1}</span>
                  <Icon name={step.icon} />
                </span>
                <h3 className="how__step-title">{step.title}</h3>
                <p className="how__step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <div className="features">
            <div className="features__grid">
              {features.map((feature) => (
                <div key={feature.title} className="feature">
                  <span className="feature__icon">
                    <Icon name={feature.icon} />
                  </span>
                  <h3 className="feature__title">{feature.title}</h3>
                  <p className="feature__desc">{feature.desc}</p>
                  <Link href={feature.href} className="link-arrow">
                    {feature.linkLabel}
                    <Icon name="arrow-right" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <span className="section__eyebrow section__eyebrow--center">
            Subjects
          </span>
          <h2 className="section__title section__title--center">
            Pick where you want to start
          </h2>
          <p className="section__lead section__lead--center">
            Every article is filed under a subject and tagged by topic, so you
            can go from curiosity to explanation quickly.
          </p>
          <div className="card-grid card-grid--3">
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

      <section className="section section--tight">
        <div className="container">
          <div className="section__head">
            <div>
              <span className="section__eyebrow">Fresh from the community</span>
              <h2 className="section__title">Recent articles</h2>
            </div>
            <Link href="/browse" className="link-arrow">
              View all
              <Icon name="arrow-right" />
            </Link>
          </div>
          <div className="card-grid card-grid--3">
            {recent.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <div className="join">
            <div className="join__grid">
              <div className="join__copy">
                <h2 className="join__title">
                  You learned something. Someone else needs it.
                </h2>
                <p className="join__desc">
                  If you have notes that helped you understand a hard topic,
                  send them in. A clear explanation can change how another
                  student sees a subject.
                </p>
                <div className="join__ctas">
                  <Link href="/submit" className="btn btn--light">
                    Share your work
                    <Icon name="arrow-right" />
                  </Link>
                  <Link href="/about" className="btn btn--outline-light">
                    About the project
                  </Link>
                </div>
              </div>
              <ul className="join__list">
                <li>
                  <Icon name="check" />
                  Any subject in science, maths, coding, or engineering
                </li>
                <li>
                  <Icon name="check" />
                  Notes, diagrams, experiments, or study tips
                </li>
                <li>
                  <Icon name="check" />
                  Credit stays with you — or stay anonymous
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
