import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

export async function generateStaticParams() {
  // Generate paths for all posts
  const files = fs.readdirSync(path.join("posts"));

  return files.map((filename) => ({
    slug: filename.replace(".md", ""),
  }));
}

export default async function PostPage({ params }:  { params: { slug: string } }) {

  const { slug } = params;
  const post = await getPost(slug);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">{post.title}</h1>
      <p className="text-gray-500">{post.date}</p>
      <div
        className="prose mx-auto"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </div>
  );
}


function getPost(slug: string) {
  const filePath = path.join("posts", `${slug}.md`);
  const markdownWithMeta = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(markdownWithMeta);
  const processedContent = remark().use(html).processSync(content);

  return {
    title: data.title,
    date: data.date,
    content: processedContent.toString(),
  };
}
