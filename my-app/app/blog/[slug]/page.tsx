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


export async function generateStaticParams() {
  const postsDirectory = path.join(process.cwd(), "posts");
  
  try {
    const files = fs.readdirSync(postsDirectory);
    console.log("Generating paths for:", files);
    
    return files
      .filter(filename => filename.endsWith('.md'))
      .map((filename) => ({
        slug: filename.replace(".md", "").toLowerCase()
      }));
  } catch (error) {
    // console.error("Error reading posts directory:", error);
    return [];
  }
}


async function getPost(slug: string): Promise<Post> {
  const postsDirectory = path.join(process.cwd(), "posts");
  const filePath = path.join(postsDirectory, `${slug}.md`);

  // console.log("Attempting to read:", filePath);

  try {
    const markdownWithMeta = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(markdownWithMeta);
    const processedContent = await remark()
      .use(html)
      .process(content);

    return {
      slug: slug.toLowerCase(),
      title: data.title || 'Untitled',
      date: data.date || 'No date',
      content: processedContent.toString(),
    };
  } catch (error) {
    console.error(`Error reading post ${slug}:`, error);
    throw new Error(`Post not found: ${slug}`);
  }
}


export default async function PostPage(props: PageProps) {
  const params = await props.params;
  const post = await getPost(params.slug);

  return (
    <article className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
        <time className="text-gray-500">{post.date}</time>
      </header>
      <div 
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content || "<p>No content available.</p>" }}
      />
    </article>
  );
}