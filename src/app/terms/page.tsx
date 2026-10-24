import Link from "next/link";
import { siteConfig } from "@/lib/site";

export const metadata = {
  title: "Terms of use",
  description: "Terms for using and contributing to Project STEAM.",
};

export default function TermsPage() {
  return (
    <section className="section section--tight">
      <div className="page-glow" />
      <div className="container container--narrow">
        <span className="section__eyebrow">Legal</span>
        <h1 className="section__title">Terms of use</h1>
        <p className="section__lead">Last updated: 20 October 2026</p>

        <div className="prose">
          <p>
            Project STEAM is a free, student-led educational library. By using
            the website or submitting material, you agree to these terms.
          </p>

          <h2>Educational use</h2>
          <p>
            Articles and Ask AI answers are for general learning, not
            professional medical, mental-health, legal, financial, or safety
            advice. Student work and AI-generated summaries can contain
            mistakes. Check important facts with a teacher or reliable primary
            source.
          </p>

          <h2>Using the website</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Attempt to access drafts, Editor tools, or private files.</li>
            <li>
              Disrupt the website, bypass rate limits, or automate abusive
              traffic.
            </li>
            <li>
              Use Search, Ask AI, submissions, or downloads for unlawful,
              harmful, harassing, or deceptive activity.
            </li>
            <li>
              Misrepresent Project STEAM content as verified professional
              advice.
            </li>
          </ul>

          <h2>Submitting work</h2>
          <p>
            Only submit material that you created or have permission to share.
            Do not submit copyrighted textbooks, paid course material, private
            school records, personal data, or content that is unsafe,
            discriminatory, unlawful, or misleading.
          </p>
          <p>
            By submitting work, you give Project STEAM permission to store,
            review, edit for clarity and safety, categorize, summarize, and
            publish the educational material on the website. You also permit
            us to use automated tools and AI providers to process it. You keep
            ownership of work you own.
          </p>
          <p>
            Submission does not guarantee publication. We may reject, edit,
            unpublish, or remove material at any time. Email{" "}
            <a href={`mailto:${siteConfig.submitEmail}`}>
              {siteConfig.submitEmail}
            </a>{" "}
            to request correction or removal.
          </p>

          <h2>Accounts and downloads</h2>
          <p>
            Google sign-in is used to protect original files. You are
            responsible for the security of your Google account. Do not
            redistribute files when you do not have permission from their
            creator.
          </p>

          <h2>Ask AI</h2>
          <p>
            Ask AI attempts to answer from public Project STEAM article
            summaries and abstracts and shows its sources. It may misunderstand
            a question or produce an incomplete answer. Do not rely on it for
            high-stakes decisions.
          </p>

          <h2>Availability and changes</h2>
          <p>
            The website is provided as-is and may change, become unavailable,
            or remove features or content without notice. These terms may be
            updated as the project grows; the date above identifies the latest
            version.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about these terms can be sent to{" "}
            <a href={`mailto:${siteConfig.submitEmail}`}>
              {siteConfig.submitEmail}
            </a>
            . Read our <Link href="/privacy">Privacy page</Link> for how data is
            handled.
          </p>
        </div>
      </div>
    </section>
  );
}
