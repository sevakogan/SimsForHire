import { getAllBlogPosts, getBlogContext } from "@/lib/actions/blog";
import { BlogView } from "@/components/blog/blog-view";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const [posts, context] = await Promise.all([
    getAllBlogPosts(),
    getBlogContext(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Blog</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create and manage blog posts for simsforhire.com
        </p>
      </div>
      <BlogView initialPosts={posts} initialContext={context} />
    </div>
  );
}
