import { getAllBlogPosts } from "@/lib/actions/blog";
import { BlogView } from "@/components/blog/blog-view";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const posts = await getAllBlogPosts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Blog</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create and manage blog posts for simsforhire.com
        </p>
      </div>
      <BlogView initialPosts={posts} />
    </div>
  );
}
