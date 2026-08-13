import Link from "next/link";
import { Icon } from "./Icon";
import { subjectIcon } from "@/lib/subject-icons";
import type { Subject } from "@/lib/types";

export function SubjectCard({
  subject,
  count,
}: {
  subject: Subject;
  count: number;
}) {
  return (
    <Link href={`/subjects/${subject.slug}`} className="card">
      <span className="card__icon">
        <Icon name={subjectIcon(subject.slug)} />
      </span>
      <h3 className="card__title">{subject.name}</h3>
      <p className="card__desc">{subject.description}</p>
      <div className="card__meta">
        <span className="count-pill">
          {count} article{count === 1 ? "" : "s"}
        </span>
      </div>
    </Link>
  );
}
