# 50 Hijet e Pushtetit / 50 Shades of Power

`50 Hijet e Pushtetit` is a static public-interest archive about power, public money, political influence, strategic investments, tenders, media ownership, and open public questions in Albania.

The goal is simple: make documented information easier to read, compare, and challenge. The site is built as a calm archive, not as a social network, comment system, or private leak platform.

## Purpose

This project exists to:

- collect public-source dossiers in one readable place;
- separate documented facts from open questions and opinion;
- preserve links, dates, source notes, and right-of-reply paths;
- publish profiles and articles that help readers understand recurring people, institutions, and patterns;
- make corrections and additional sources easy to send.

The Albanian version is the primary public version. English pages exist so international readers, journalists, researchers, and diaspora readers can follow the same archive.

## Editorial Standard

This project should stay source-oriented.

- Dossiers should be evidence-led and cautious.
- Articles can include analysis, questions, and opinion, but they should make that clear.
- Claims about corruption, abuse, conflicts, or wrongdoing should be tied to sources or framed as allegations/questions.
- People and institutions should have a visible right-of-reply path.
- Corrections should be welcomed when better sources appear.

The site does not automatically publish reader submissions. Anything public is reviewed and added manually through Markdown.

## Privacy And Source Safety

This is a static Astro site deployed through GitHub Pages.

- No custom backend.
- No database.
- No admin panel.
- No login route.
- No analytics script by default.
- No live anonymous submission form.

Public contributions are currently sent by email to `thetourist1@proton.me`.

Normal email is not truly anonymous. People sending sensitive information should avoid personal accounts and consider Proton Mail, SimpleLogin, or another alias account. For higher-risk material, read the safety guide first:

- Albanian: `/sq/siguria/`
- English: `/en/safety/`

Do not open GitHub issues for private tips, unpublished documents, private addresses, phone numbers, or sensitive personal data. GitHub issues are public.

## Content Structure

Content is Markdown-first.

- Albanian dossiers: `src/content/cases/`
- English dossiers: `src/content/cases-en/`
- Albanian articles and profiles: `src/content/articles/`
- English articles and profiles: `src/content/articles-en/`
- Static public files and source notes: `public/`

Profiles are article-style pages, not a private database. Related cases and related articles are linked through Markdown frontmatter.

## Publishing

Publishing happens through GitHub:

1. Edit or add Markdown content.
2. Run the build locally.
3. Commit and push to `main`.
4. GitHub Pages builds and deploys the static site.

Useful commands:

```bash
npm install
npm run dev
npm run build
```

## Deployment

The site is configured for GitHub Pages with a custom domain:

```text
50hijetepushtetit.com
```

The deploy workflow lives in `.github/workflows/deploy.yml` and runs on pushes to `main`.

## Public Repository Notes

This repository is intended to be public for transparency. That also means commit history, issues, pull requests, and build logs can be visible.

Do not commit:

- private source identities;
- unpublished sensitive documents;
- access tokens, API keys, or secrets;
- private contact details;
- drafts that reveal confidential reporting strategy.

If sensitive material is received, keep it outside the repository and publish only reviewed, necessary, source-safe summaries.
