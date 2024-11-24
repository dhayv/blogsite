import { GetStaticPaths, GetStaticProps } from 'next';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

interface PostProps {
  content: string;
  metadata: {
    title: string;
    date: string;
  };
}

const PostPage: React.FC<PostProps> = ({ content, metadata }) => {
  return (
    <div>
      <h1>{metadata.title}</h1>
      <p>{metadata.date}</p>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const files = fs.readdirSync(path.join('posts'));

  const paths = files.map((filename) => ({
    params: { slug: filename.replace('.md', '') },
  }));

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const markdownWithMeta = fs.readFileSync(path.join('posts', slug + '.md'), 'utf-8');

  const { data, content } = matter(markdownWithMeta);
  const processedContent = await remark().use(html).process(content);
  const contentHtml = processedContent.toString();

  return {
    props: {
      metadata: data,
      content: contentHtml,
    },
  };
};

export default PostPage;
