import React from "react";
import Link from "next/link";


const BlogListing: React.FC = () => {

    const posts = [
        { id: 1, slug: "post-one", title: 'Post One', excerpt: 'This is the first post.' },
        { id: 2, slug: "post-two", title: 'Post Two', excerpt: 'This is the second post.' },
    ]
    const listPost = posts.map((post) => (
        <li key={post.id} className="space-y-2">
          <h3 className="text-lg font-semibold">{post.title}</h3>
          <p className="text-gray-600">{post.excerpt}</p>
          <Link href={`/blog/${post.slug}`} className="text-blue-500 hover:underline">
            Read More
          </Link>
        </li>
    ))

    return(
        <div className="max-w-xl mx-auto w-full space-y-6">
      <h1 className="text-xl font-bold underline underline-offset-2">Recent Posts</h1>
      <ul className="space-y-4">{listPost}</ul>
    </div>
    )
}

export default BlogListing