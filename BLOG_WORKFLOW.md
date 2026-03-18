# Blog Workflow

This site now has a git-backed blog that the owner can publish without coding.

## How to publish a post

1. Open `/admin/` in the browser.
1. Sign in through Netlify Identity.
1. Create a new post in the `Blog Posts` collection.
1. Fill in the title, description, publish date, tags, and body.
1. Upload a featured image if you want one.
1. Save the draft, preview it if needed, then publish.

## What happens after publish

- Decap CMS writes a markdown file into `content/blog/`.
- The public blog pages at `/blog/` and `/blog/post.html?slug=...` read posts directly from the GitHub repository.
- Once the commit is available on `main`, the post appears on the site automatically.

## Assumptions

- The repository is public or readable through the public GitHub API.
- Netlify Identity and Git Gateway are enabled for this site.
- Featured images are stored under `/images/blog/`.

## If you want to add more posts later

- Use the CMS, not the markdown files directly.
- Keep the slug short and descriptive.
- Use one clear featured image per post when possible.
- Write descriptions that work as social snippets and preview cards.
