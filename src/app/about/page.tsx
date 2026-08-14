import Link from "next/link";
import { Icon } from "@/components/Icon";
import { siteCopy } from "@/lib/site";

export const metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <>
      <section className="section section--tight">
        <div className="page-glow" />
        <div className="container container--narrow">
          <span className="section__eyebrow">About</span>
          <h1 className="section__title">{siteCopy.aboutTitle}</h1>
          <div className="prose">
            <p>
              Project Steam is a passion project started by a Class 10 student
              who believes what you can learn should not depend on where you
              live or which school you attend.
            </p>
            <p>
              Hundreds of students send in notes, explanations, experiments, and
              ideas about STEM. Each submission is read, categorized by subject
              and topic, and published here so learners across India and the
              world can use it for free.
            </p>
            <h2>How it works</h2>
            <ol>
              <li>Students share content by email.</li>
              <li>Every piece is reviewed for clarity, accuracy, and respect.</li>
              <li>
                Content is tagged by subject — physics, chemistry, biology,
                maths, computer science, and engineering.
              </li>
              <li>
                Published articles become searchable and power grounded AI
                answers.
              </li>
            </ol>
            <h2>For students everywhere</h2>
            <p>
              Whether you are preparing for board exams, curious about coding,
              or exploring science on your own, this library is for you. If you
              have something to teach, you are welcome to contribute.
            </p>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <div className="join">
            <div className="join__grid">
              <div className="join__copy">
                <h2 className="join__title">Be part of the library</h2>
                <p className="join__desc">
                  Every submission makes the next student&rsquo;s learning a
                  little easier.
                </p>
                <div className="join__ctas">
                  <Link href="/submit" className="btn btn--light">
                    Share your work
                    <Icon name="arrow-right" />
                  </Link>
                  <Link href="/browse" className="btn btn--outline-light">
                    Browse the library
                  </Link>
                </div>
              </div>
              <ul className="join__list">
                <li>
                  <Icon name="check" />
                  Free for every student, always
                </li>
                <li>
                  <Icon name="check" />
                  Reviewed by real people before publishing
                </li>
                <li>
                  <Icon name="check" />
                  Built and run by students
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
