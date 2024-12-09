import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

interface Post {
  slug: string;
  title: string;
  date: string;
  excerpt?: string; 
  content?: string;
}

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Generate static paths for all blog posts
export async function generateStaticParams() {
  const files = fs.readdirSync(path.join(process.cwd(), "posts"));

  console.log("Generating paths for:", files);

  return files.map((filename) => {
    const slug = filename.replace(".md", "");
    return {
      slug: slug.toLowerCase()
    }
  });
}

// Fetch the content of a specific blog post
async function getPost(slug: string): Promise<Post> {
  const postDirectory = path.join(process.cwd(), "posts")
  const filePath = path.join("posts", `${slug}.md`);

  console.log("Attempting to read:", filePath);

  if (!fs.existsSync(filePath)) {
    console.error(`Post not found ${filePath}`)
    throw new Error(`Post not found: ${slug}`);
  }


  const markdownWithMeta = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(markdownWithMeta);
  const processedContent = await remark().use(html).process(content);

  return {
    slug: slug.toLowerCase(),
    title: data.title,
    date: data.date,
    content: processedContent.toString(),
  };
}

// The main page component for a blog post
export default async function PostPage(props: PageProps) {
  const params = await props.params;
  const { slug } = params;
  const post = await getPost(params.slug);

  return (
    <div className="mx-auto w-full max-w-sm ">
  <h1 className="text-3xl font-bold">{post.title}</h1>
  <p className="text-gray-500">{post.date}</p>
  <div
    className="prose"
    dangerouslySetInnerHTML={{ __html: post.content || "<p>No content available.</p>" }}
  />
</div>

  );
}
