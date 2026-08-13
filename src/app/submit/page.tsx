import { siteConfig } from "@/lib/site";

export const metadata = {
  title: "Submit content",
};

export default function SubmitPage() {
  const email = siteConfig.submitEmail;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1
        className="text-4xl text-steam-deep"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Share your knowledge
      </h1>
      <p className="mt-4 text-lg text-steam-muted">
        Email your notes, diagrams, experiments, or explanations. We read
        everything and publish what helps the community learn.
      </p>

      <div className="mt-10 border-l-4 border-steam-warm pl-4">
        <p className="text-sm font-medium uppercase tracking-wide text-steam-warm">
          Email submissions
        </p>
        <p className="mt-2 text-2xl text-steam-deep">{email}</p>
        <p className="mt-2 text-sm text-steam-muted">
          Replace this address in the site config with your real inbox before
          going live.
        </p>
      </div>

      <div className="mt-10 space-y-4 text-steam-muted">
        <h2
          className="text-xl text-steam-deep"
          style={{ fontFamily: "var(--font-display)" }}
        >
          What to include
        </h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>Your name (or &ldquo;anonymous&rdquo; if you prefer)</li>
          <li>Class / school (optional)</li>
          <li>Subject and topic (e.g. Physics — optics)</li>
          <li>Clear writing — short paragraphs, examples, steps</li>
          <li>Only share what you wrote or have permission to share</li>
        </ul>
      </div>

      <div className="mt-10 border-t border-steam-deep/10 pt-8 text-sm text-steam-muted">
        <p>
          Submissions are reviewed before publishing. We may edit lightly for
          clarity. By submitting, you agree your content can be shared freely
          for education on this site.
        </p>
      </div>
    </div>
  );
}
