import React from "react";
import Link from "next/link";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { Post } from "@/app/types/post";

const BlogListing: React.FC = () => {
  const posts = getAllPosts();

  // Sort posts by most recent date
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-xl font-bold underline underline-offset-2">All Posts</h1>
      <ul className="space-y-4">
        {posts.map((post) => (
          <li key={post.slug} className="space-y-2">
            <h3 className="text-lg font-semibold">{post.title}</h3>
            <p className="text-gray-600">{post.excerpt}</p>
            <Link href={`/blog/${post.slug.toLowerCase()}/`} className="text-blue-500 hover:underline">
              Read More
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Utility function to fetch all posts
function getAllPosts(): Post[] {
  const files = fs.readdirSync(path.join("posts"));

  return files.map((filename) => {
    const slug = filename.replace(".md", "");
    const markdownWithMeta = fs.readFileSync(path.join("posts", filename), "utf-8");
    const { data } = matter(markdownWithMeta);

    return {
      slug,
      title: data.title,
      date: data.date, // Ensure dates are valid strings in the markdown front matter
      excerpt: data.excerpt || "No excerpt available.",
    };
  });
}

export default BlogListing;
