import { Icon } from "@/components/Icon";
import { siteConfig, siteCopy } from "@/lib/site";

export const metadata = {
  title: "Share your work",
};

const guidelines = [
  "Attach your notes as a file — PDF is best. Do not send only a Drive, WhatsApp, or website link; we often cannot open those.",
  "If you took several photos, join them into one PDF before emailing (Preview on a Mac, Google Drive, or any free “images to PDF” tool).",
  "Do not put your name, email, phone number, school ID, or home address in the notes or in the email body. That text can be published with the article.",
  "Do not paste personal chat or file links inside the article.",
  "Write in your own words. Only send work you created or have permission to share.",
  "Short paragraphs, labelled diagrams, and a clear topic (for example Physics — optics) help other students find it.",
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
            href={`mailto:${siteConfig.submitEmail}?subject=Project STEAM submission`}
            className="btn btn--primary"
          >
            Write an email
            <Icon name="arrow-right" />
          </a>
        </div>

        <div className="panel panel--soft" style={{ marginTop: "24px" }}>
          <h2 className="feature__title">How to send your work</h2>
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
