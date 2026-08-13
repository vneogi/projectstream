import Link from "next/link";
import type { Subject } from "@/lib/types";

export function SubjectCard({ subject, count }: { subject: Subject; count: number }) {
  return (
    <Link
      href={`/subjects/${subject.slug}`}
      className="group block border-l-4 py-2 pl-4 transition hover:pl-5"
      style={{ borderColor: subject.color }}
    >
      <h3
        className="text-lg text-steam-deep group-hover:text-steam-mid"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {subject.name}
      </h3>
      <p className="mt-1 text-sm text-steam-muted">{subject.description}</p>
      <p className="mt-2 text-xs text-steam-muted">
        {count} article{count === 1 ? "" : "s"}
      </p>
    </Link>
  );
}
