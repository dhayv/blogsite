import React from "react";

const RecentPost: React.FC = () => {

    const posts = [
        { id: 1, title: 'Post One', excerpt: 'This is the first post.' },
        { id: 2, title: 'Post Two', excerpt: 'This is the second post.' },
    ]
    const listPost = posts.map((post) => (
    <li key={post.id}>
        <h3>{post.title}</h3>

    </li>
    ))

    return (
        <div className="space-y-3 ">
            <h1 className="underline underline-offset-1">Recent Posts</h1>
            <ul className="space-y-4">{listPost}</ul>
            
        </div>
        
    )
}

export default RecentPost;