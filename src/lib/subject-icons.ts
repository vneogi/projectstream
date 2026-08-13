import type { IconName } from "@/components/Icon";

const icons: Record<string, IconName> = {
  physics: "atom",
  chemistry: "beaker",
  biology: "leaf",
  mathematics: "sigma",
  "computer-science": "code",
  engineering: "cog",
  "general-stem": "compass",
};

export function subjectIcon(slug: string): IconName {
  return icons[slug] ?? "book";
}
