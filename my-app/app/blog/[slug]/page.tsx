import { GetStaticPaths, GetStaticProps } from 'next';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import exp from 'constants';
import { title } from 'process';

interface PostProps {
  content: string;
  metadata: {
    title: string;
    date: string;
  };
}

export async function generateStaticParams() {
    const files = fs.readdirSync(path.join("posts"));
    return files.map((filename => ({
        slug: filename.replace(".md", "")
    })))
}

export default async function PostPage({ params }: { params: { slug: string } }) {
    

  return (
    <div className="">
        <h1></h1>
        
        <p></p>
        <div></div>
    
        
        
    </div>
  )
  
}

function getPost(slug: string) {
    const filepath = path.join("content", `${slug}.md`)
    const markdownWithMeta = fs.readFileSync(filepath, 'utf-8');
    const {data, content} = matter(markdownWithMeta)
    const processedContent =remark().use(html).processSync(content)
    return {
        title: data.title,
        date: data.date,
        content: processedContent.toString()
    }
}

