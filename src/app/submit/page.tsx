import { Icon } from "@/components/Icon";
import { siteConfig, siteCopy } from "@/lib/site";

export const metadata = {
  title: "Share your work",
};

const guidelines = [
  "Your name — or tell us you would rather stay anonymous",
  "Class and school, if you want the credit",
  "Subject and topic, for example Physics — optics",
  "Short paragraphs, clear steps, and examples where you can",
  "Only share work you wrote or have permission to share",
];

export default function SubmitPage() {
  return (
    <section className="section section--tight">
      <div className="page-glow" />
      <div className="container container--narrow">
        <span className="section__eyebrow">Contribute</span>
        <h1 className="section__title">{siteCopy.submitTitle}</h1>
        <p className="section__lead">{siteCopy.submitLead}</p>

        <div className="panel">
          <span className="card__eyebrow">
            <Icon name="inbox" />
            Email submissions
          </span>
          <p
            style={{
              fontSize: "1.375rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginBlock: "10px 16px",
            }}
          >
            {siteConfig.submitEmail}
          </p>
          <a
            href={`mailto:${siteConfig.submitEmail}?subject=Project Steam submission`}
            className="btn btn--primary"
          >
            Write an email
            <Icon name="arrow-right" />
          </a>
        </div>

        <div className="panel panel--soft" style={{ marginTop: "24px" }}>
          <h2 className="feature__title">What to include</h2>
          <ul className="join__list" style={{ marginTop: "16px" }}>
            {guidelines.map((item) => (
              <li
                key={item}
                style={{
                  background: "#fff",
                  borderColor: "var(--border)",
                  color: "var(--text-2)",
                }}
              >
                <Icon name="check" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p
          className="field__hint"
          style={{ marginTop: "24px", maxWidth: "560px" }}
        >
          Submissions are reviewed before publishing and may be lightly edited
          for clarity. By submitting, you agree your content can be shared
          freely for education on this site.
        </p>
      </div>
    </section>
  );
}
