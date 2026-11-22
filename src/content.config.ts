import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
const entries = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/entries' }),
  schema: z.object({
    title: z.string(),
    slug: z.string().regex(/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/),
    description: z.string(),
    destination: z.string(),
    kind: z.enum(['guide', 'story', 'project']),
    status: z.enum(['recovered', 'pending', 'published', 'draft']),
    source: z.string().optional(),
    date: z.string().optional(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    featured: z.boolean().default(false),
    ready: z.boolean().default(false),
    photoEssay: z.boolean().default(false),
  }),
});
export const collections = { entries };
