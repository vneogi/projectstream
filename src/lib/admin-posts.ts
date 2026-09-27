import type { Post, PostStatus } from "./types";

export type StatusFilter = "all" | PostStatus;
export type PostSortOrder =
  | "draft-newest"
  | "newest"
  | "published-newest";

function statusRank(status: PostStatus, first: PostStatus): number {
  return status === first ? 0 : 1;
}

export function filterAndSortAdminPosts(
  posts: Post[],
  statusFilter: StatusFilter,
  sortOrder: PostSortOrder,
): Post[] {
  const filtered =
    statusFilter === "all"
      ? posts
      : posts.filter((post) => post.status === statusFilter);

  return [...filtered].sort((a, b) => {
    if (sortOrder === "draft-newest") {
      const difference =
        statusRank(a.status, "draft") - statusRank(b.status, "draft");
      if (difference !== 0) return difference;
    }
    if (sortOrder === "published-newest") {
      const difference =
        statusRank(a.status, "published") -
        statusRank(b.status, "published");
      if (difference !== 0) return difference;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
