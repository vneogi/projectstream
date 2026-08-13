export const metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1
        className="text-4xl text-steam-deep"
        style={{ fontFamily: "var(--font-display)" }}
      >
        About Project_Steam
      </h1>
      <div className="mt-8 space-y-6 text-steam-muted leading-relaxed">
        <p>
          Project_Steam is a passion project started by a Class 10 student who
          believes knowledge should not depend on where you live or what school
          you attend.
        </p>
        <p>
          Hundreds of students email notes, explanations, experiments, and ideas
          about STEM and education. Each submission is read, categorized by
          subject and topic, and published here so millions of learners — in
          India and around the world — can access it for free.
        </p>
        <h2
          className="text-2xl text-steam-deep"
          style={{ fontFamily: "var(--font-display)" }}
        >
          How it works
        </h2>
        <ol className="list-decimal space-y-2 pl-6">
          <li>Students share content by email (see Submit page).</li>
          <li>We review for clarity, accuracy, and respect.</li>
          <li>Content is tagged by subject — physics, math, biology, and more.</li>
          <li>Published articles are searchable and can power grounded AI answers.</li>
        </ol>
        <h2
          className="text-2xl text-steam-deep"
          style={{ fontFamily: "var(--font-display)" }}
        >
          For students everywhere
        </h2>
        <p>
          Whether you are preparing for board exams, curious about coding, or
          exploring science on your own — this library is for you. If you have
          something to teach, you are welcome to contribute.
        </p>
      </div>
    </div>
  );
}
