import { defineCollection, z } from 'astro:content';

const topicCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    month: z.number().min(1).max(3),
    week: z.number().min(1).max(12),
    topic: z.string(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    flashcardCount: z.number().default(0),
    hasQuiz: z.boolean().default(false),
    order: z.number().default(0),
    resources: z
      .array(
        z.object({
          type: z.enum(['video', 'doc', 'blog', 'github']),
          title: z.string(),
          url: z.string().url(),
          author: z.string().optional(),
        })
      )
      .default([]),
  }),
});

export const collections = {
  'month-1': topicCollection,
  'month-2': topicCollection,
  'month-3': topicCollection,
};
