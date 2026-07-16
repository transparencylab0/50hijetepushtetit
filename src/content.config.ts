import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const publicUrl = z.url().refine((value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}, "URL must start with http:// or https://");

const imageSrc = z.union([
  publicUrl,
  z.string().regex(/^\/[A-Za-z0-9/_\-.%]+$/, "Image path must be a local public path or full URL")
]);

const imageSchema = z.object({
  src: imageSrc,
  alt: z.string(),
  credit: z.string(),
  license: z.string().optional(),
  sourceUrl: publicUrl.optional(),
  layout: z.enum(["landscape", "portrait"]).default("landscape")
});

const caseSchema = z.object({
  title: z.string(),
  summary: z.string(),
  subjects: z.array(
    z.object({
      name: z.string(),
      role: z.string(),
      type: z.enum(["official", "business", "relative", "organization", "other"])
    })
  ),
  priority: z.enum(["P1", "P2", "P3"]),
  era: z.enum(["rama", "berisha", "cross-era"]),
  year: z.number().int().min(1990).max(2100),
  category: z.enum(["investime-strategjike", "tendera"]),
  status: z.enum(["sourced", "developing", "needs-info", "disputed", "right-of-reply"]),
  tags: z.array(z.string()).default([]),
  image: imageSchema.optional(),
  redFlags: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      severity: z.enum(["high", "medium", "low"]),
      sources: z.array(z.string())
    })
  ),
  missingInfo: z.array(
    z.object({
      question: z.string(),
      priority: z.enum(["high", "medium", "low"]),
      status: z.enum(["open", "submitted", "resolved"])
    })
  ),
  sources: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      publisher: z.string(),
      url: publicUrl,
      linkLabel: z.string().optional(),
      archiveUrl: publicUrl.optional(),
      date: z.string().optional(),
      note: z.string().optional()
    })
  ),
  timeline: z.array(
    z.object({
      date: z.string(),
      event: z.string(),
      sources: z.array(z.string())
    })
  ),
  communityTips: z.array(
    z.object({
      id: z.string(),
      author: z.string().default("Anonim"),
      date: z.string(),
      status: z.enum(["pending-source", "needs-review", "verified", "rejected"]).default("needs-review"),
      title: z.string(),
      body: z.string(),
      links: z.array(publicUrl).default([]),
      replies: z.array(
        z.object({
          author: z.string().default("Anonim"),
          date: z.string(),
          body: z.string(),
          links: z.array(publicUrl).default([])
        })
      ).default([])
    })
  ).default([])
});

const articleSchema = z.object({
  title: z.string(),
  summary: z.string(),
  type: z.enum(["skandal", "profil", "analize", "perditesim", "opinion"]),
  author: z.string().default("50 Hijet e Pushtetit"),
  authorType: z.enum(["redaksi", "kontributor", "anonim"]).default("redaksi"),
  disclaimer: z.string().optional(),
  rightOfReply: z.boolean().default(true),
  publishedAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
  keyFacts: z.array(
    z.object({
      value: z.string(),
      label: z.string()
    })
  ).default([]),
  relatedCases: z.array(z.string()).default([]),
  relatedArticles: z.array(z.string()).default([]),
  image: imageSchema.optional(),
  sources: z.array(
    z.object({
      title: z.string(),
      publisher: z.string(),
      url: publicUrl,
      linkLabel: z.string().optional(),
      archiveUrl: publicUrl.optional(),
      date: z.string().optional(),
      note: z.string().optional()
    })
  ).default([])
});

const cases = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/cases" }),
  schema: caseSchema
});

const casesEn = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/cases-en" }),
  schema: caseSchema
});

const articles = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/articles" }),
  schema: articleSchema
});

const articlesEn = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/articles-en" }),
  schema: articleSchema
});

export const collections = { cases, "cases-en": casesEn, articles, "articles-en": articlesEn };
