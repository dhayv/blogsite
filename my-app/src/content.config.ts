import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.string().transform((str) => {
      const parts = str.split('-');
      const month = parts[0].padStart(2, '0');
      const day = parts[1].padStart(2, '0');
      const year = parts[2];
      return new Date(`${year}-${month}-${day}`);
    }),
    author: z.string().optional().default('David Hyppolite'),
    excerpt: z.string().optional().default(''),
    tags: z.array(z.string()).optional().default([]),
  }),
});

export const collections = { blog };
