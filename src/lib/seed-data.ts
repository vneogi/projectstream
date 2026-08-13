import type { Post, Subject } from "./types";

export const subjects: Subject[] = [
  {
    id: "physics",
    name: "Physics",
    slug: "physics",
    description: "Motion, energy, waves, and the laws that shape our universe.",
    color: "#0d9488",
  },
  {
    id: "chemistry",
    name: "Chemistry",
    slug: "chemistry",
    description: "Elements, reactions, materials, and the chemistry of everyday life.",
    color: "#c2410c",
  },
  {
    id: "biology",
    name: "Biology",
    slug: "biology",
    description: "Life from cells to ecosystems — health, nature, and discovery.",
    color: "#15803d",
  },
  {
    id: "mathematics",
    name: "Mathematics",
    slug: "mathematics",
    description: "Patterns, proofs, and problem-solving that powers every science.",
    color: "#1d4ed8",
  },
  {
    id: "computer-science",
    name: "Computer Science",
    slug: "computer-science",
    description: "Coding, algorithms, AI basics, and building with technology.",
    color: "#7c3aed",
  },
  {
    id: "engineering",
    name: "Engineering",
    slug: "engineering",
    description: "Design, build, and innovate — from bridges to rockets.",
    color: "#b45309",
  },
  {
    id: "general-stem",
    name: "General STEM",
    slug: "general-stem",
    description: "Cross-disciplinary ideas, career paths, and learning tips.",
    color: "#475569",
  },
];

const now = new Date().toISOString();

export const seedPosts: Post[] = [
  {
    id: "1",
    title: "Why the night sky looks different in winter",
    slug: "night-sky-winter",
    excerpt:
      "Earth’s orbit changes which stars we see at night. Here’s a simple way to understand seasons and constellations.",
    content:
      "When we look at the night sky in winter, we are facing a different part of the Milky Way than in summer. Earth moves around the Sun, so our nighttime view points toward different stars over the year.\n\nTry this: note one bright star you see this week. Check again in three months at the same time. It may have shifted or disappeared below the horizon.\n\nFor students without telescopes: use a free app like Stellarium or Sky Map. Match what you see with your location in India — Orion is bright in winter evenings, while Scorpius dominates summer skies.\n\nShare what you observe with classmates. Small, repeated observations build real scientific thinking.",
    subjectId: "physics",
    subjectSlug: "physics",
    subjectName: "Physics",
    topics: ["astronomy", "seasons", "observation"],
    authorName: "Student contributor",
    authorSchool: "Class 10",
    language: "en",
    status: "published",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "2",
    title: "Balancing chemical equations without memorizing",
    slug: "balance-equations-tips",
    excerpt:
      "A step-by-step method for balancing reactions using atoms as inventory — no tricks, just logic.",
    content:
      "Think of a chemical equation like a ledger: atoms on the left must equal atoms on the right.\n\n1. Write the unbalanced equation.\n2. Count atoms for each element.\n3. Adjust coefficients (numbers in front) — never change subscripts inside formulas.\n4. Re-count until every element balances.\n\nExample: Fe + O₂ → Fe₂O₃\nStart with iron, then oxygen. Use the smallest whole-number coefficients.\n\nPractice with household examples: rusting iron, baking soda + vinegar. Connecting equations to things you can see makes chemistry less abstract.",
    subjectId: "chemistry",
    subjectSlug: "chemistry",
    subjectName: "Chemistry",
    topics: ["equations", "stoichiometry", "class-10"],
    authorName: "Student contributor",
    language: "en",
    status: "published",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "3",
    title: "Photosynthesis in one diagram — and why it matters for food",
    slug: "photosynthesis-diagram",
    excerpt:
      "Light, chlorophyll, water, and carbon dioxide — how plants make the energy that feeds the world.",
    content:
      "Photosynthesis converts light energy into chemical energy stored in glucose. The simplified equation:\n\n6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂\n\nKey idea: plants are solar-powered factories. Without them, most life on Earth could not survive.\n\nActivity: place a leaf in dark for 24 hours, then test for starch. Compare with a leaf kept in sunlight. You are measuring the outcome of photosynthesis with simple materials.\n\nWhen you share notes like this, you help students in villages and cities alike access the same core ideas — free, clear, and in their language.",
    subjectId: "biology",
    subjectSlug: "biology",
    subjectName: "Biology",
    topics: ["plants", "energy", "class-10"],
    authorName: "Student contributor",
    language: "en",
    status: "published",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "4",
    title: "Quadratic equations: when will I ever use this?",
    slug: "quadratic-equations-real-life",
    excerpt:
      "From projectile motion to profit optimization — quadratics show up everywhere once you know where to look.",
    content:
      "A quadratic equation has the form ax² + bx + c = 0. The solutions tell you where a parabola crosses the x-axis.\n\nReal uses:\n- Physics: height of a ball thrown upward over time.\n- Business: finding maximum profit when price changes demand.\n- Engineering: designing curved structures safely.\n\nMethod toolkit: factorization, completing the square, quadratic formula. Pick the fastest for each problem — speed comes from practice, not magic.\n\nTip for exam prep: always check your roots by substituting back into the original equation.",
    subjectId: "mathematics",
    subjectSlug: "mathematics",
    subjectName: "Mathematics",
    topics: ["algebra", "quadratics", "applications"],
    authorName: "Student contributor",
    language: "en",
    status: "published",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "5",
    title: "Your first Python program: explain a science idea",
    slug: "first-python-science",
    excerpt:
      "Use a few lines of code to simulate motion or visualize data — coding is a tool for thinking, not just jobs.",
    content:
      "Python is readable and free. Install from python.org or use an online editor.\n\nExample — position of a ball with constant velocity:\n\nfor t in range(0, 11):\n    position = 5 * t\n    print(f\"Time {t}s: position {position} m\")\n\nChange 5 to try different speeds. You have built a tiny simulation.\n\nNext steps: plot with matplotlib, or try turtle graphics for geometry. Share your scripts with Project_Steam — other students can run and learn from them.",
    subjectId: "computer-science",
    subjectSlug: "computer-science",
    subjectName: "Computer Science",
    topics: ["python", "beginners", "simulation"],
    authorName: "Student contributor",
    language: "en",
    status: "published",
    createdAt: now,
    updatedAt: now,
  },
];

export function getSubjectBySlug(slug: string): Subject | undefined {
  return subjects.find((s) => s.slug === slug);
}

export function getPublishedPosts(): Post[] {
  return seedPosts.filter((p) => p.status === "published");
}

export function getPostBySlug(slug: string): Post | undefined {
  return seedPosts.find((p) => p.slug === slug);
}

export function searchPosts(query: string): Post[] {
  const q = query.trim().toLowerCase();
  if (!q) return getPublishedPosts();

  return getPublishedPosts().filter((post) => {
    const haystack = [
      post.title,
      post.excerpt,
      post.content,
      post.subjectName,
      ...post.topics,
      post.authorName,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}
