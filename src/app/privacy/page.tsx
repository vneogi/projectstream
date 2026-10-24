import Link from "next/link";
import { siteConfig } from "@/lib/site";

export const metadata = {
  title: "Privacy",
  description: "How Project STEAM handles submissions, accounts, analytics, and AI.",
};

export default function PrivacyPage() {
  return (
    <section className="section section--tight">
      <div className="page-glow" />
      <div className="container container--narrow">
        <span className="section__eyebrow">Legal</span>
        <h1 className="section__title">Privacy</h1>
        <p className="section__lead">Last updated: 20 October 2026</p>

        <div className="prose">
          <p>
            Project STEAM is a student passion project that publishes
            educational work shared by students. This page explains what
            information we handle and why.
          </p>

          <h2>Information you provide</h2>
          <p>
            If you email a submission, we receive the email, attachments, and
            links you send. We use them to create a private draft for review.
            Submissions are never published automatically. Please do not
            include names, email addresses, phone numbers, school identifiers,
            or other personal information in material intended for publication.
          </p>
          <p>
            We may retain the source message identifier, sender address,
            extracted text, and original file to prevent duplicate processing
            and manage the submission. Public articles normally focus on the
            educational material rather than the contributor&apos;s identity.
          </p>

          <h2>Google sign-in</h2>
          <p>
            Google sign-in is handled through Supabase. We use the resulting
            account session to unlock original-file downloads. We do not
            display your Google profile on published articles and do not
            receive your Google password.
          </p>

          <h2>Search, Ask AI, and usage analytics</h2>
          <p>
            We store Search terms and Ask AI questions so Editors can see what
            learners need and identify missing topics. We also count page
            views, article views, and downloads. A one-way keyed hash based on
            network and browser information estimates unique visitors; raw IP
            addresses are not stored in this first-party analytics table.
          </p>
          <p>
            Google Analytics is also used to understand traffic and feature
            usage. IP anonymization is enabled, and we do not intentionally
            send names or email addresses to Google Analytics. Avoid entering
            personal information in Search or Ask AI.
          </p>

          <h2>Artificial intelligence</h2>
          <p>
            Project STEAM uses Groq, and may use OpenAI as a fallback, to
            organize submitted educational text and answer questions. Ask AI
            is grounded only in the public title, subject, topics, summary, and
            abstract of published articles. Source cards are shown with
            answers. Submitted material may be sent to an AI provider while an
            Editor prepares a draft.
          </p>

          <h2>Files and security</h2>
          <p>
            Original files are kept in private storage. Signed-in users receive
            a short-lived download link through the website; the storage bucket
            is not public. Drafts and usage records are available only to the
            server and Editor.
          </p>

          <h2>Retention and removal</h2>
          <p>
            We aim to retain usage events for no longer than 180 days. Drafts,
            source emails, and published materials may be retained while they
            are needed to operate the library. To request correction or removal
            of a submission or associated data, email{" "}
            <a href={`mailto:${siteConfig.submitEmail}`}>
              {siteConfig.submitEmail}
            </a>
            . Please identify the article or submission without sending
            additional sensitive information.
          </p>

          <h2>Your choices</h2>
          <ul>
            <li>You can browse abstracts and use Search without signing in.</li>
            <li>You can choose not to submit work or use Ask AI.</li>
            <li>
              You can request removal or correction by contacting the project.
            </li>
          </ul>

          <p>
            See also our <Link href="/terms">Terms of use</Link>.
          </p>
        </div>
      </div>
    </section>
  );
}
