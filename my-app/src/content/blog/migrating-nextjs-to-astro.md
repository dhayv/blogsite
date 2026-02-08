---
title: "Why I Migrated My Blog From Next.js to Astro (And Fixed CloudFront S3 403 Errors for Good)"
date: "2-7-2026"
author: "David Hyppolite"
excerpt: "How I replaced Next.js with Astro for my static blog, eliminated CloudFront 403 Access Denied errors on S3 with OAC, and codified the fix in Terraform."
tags: ['astro', 'aws', 'cloudfront', 'terraform', 's3']
---

If you're hosting a static site on S3 with CloudFront and Origin Access Control, you've probably hit the dreaded **403 Access Denied** error when navigating to subdirectories. I spent months working around this with Next.js-specific hacks. When I migrated to Astro, I finally solved it properly.

This post covers why I switched frameworks, how I fixed the CloudFront routing problem permanently, and how I codified everything in Terraform so it never drifts.

## Why Next.js Was the Wrong Tool for a Static Blog

I built this blog with Next.js 15 using the App Router and `output: 'export'` for static generation. It worked, but the codebase had problems that Next.js couldn't solve — because Next.js was the wrong tool for the job.

**Duplicated markdown parsing logic.** I had two separate functions calling `fs.readFileSync`, `gray-matter`, and `remark` to parse the same markdown files. Two copies of the `Post` TypeScript interface. Every time I changed the post schema, I had to update both.

**No syntax highlighting.** Eleven of my thirteen posts contain code blocks — HCL, Bash, YAML, Python, TypeScript, Dockerfiles. Every single one rendered as plain monospace text with no color. The `remark-html` pipeline I was using doesn't support syntax highlighting without additional plugins and configuration.

**React runtime shipped for zero interactivity.** This blog has no forms, no client-side state, no dynamic behavior. But Next.js was still bundling and shipping the React runtime to every visitor. That's wasted bandwidth and slower page loads for content that's purely static.

**XSS risk from `dangerouslySetInnerHTML`.** Every blog post was rendered by injecting raw HTML from `remark` into the DOM with `dangerouslySetInnerHTML`. For markdown I control, the risk was low — but it's a bad pattern that linters rightfully flag.

### Why Astro Is Purpose-Built for Content Sites

[Astro](https://astro.build/) is a static site generator designed for content-heavy websites. The key differences that mattered for my migration:

- **Content Collections** replace the entire `fs` + `gray-matter` + `remark` pipeline. You define a [Zod](https://zod.dev/) schema, drop markdown files into `src/content/blog/`, and call `getCollection('blog')`. One function, type-safe, zero boilerplate.
- **Built-in Shiki syntax highlighting** with dual-theme support. I configured `github-light` and `github-dark` themes — every code block now has proper syntax coloring that respects the user's light/dark preference.
- **Zero JavaScript by default.** Astro renders everything to static HTML at build time. The only client-side JS on this site is a small inline script for the dark mode toggle.
- **Safe markdown rendering.** Astro's `<Content />` component renders markdown without `dangerouslySetInnerHTML`. The XSS vector is eliminated.

The [official Astro migration guide from Next.js](https://docs.astro.build/en/guides/migrate-to-astro/from-nextjs/) covers the mechanical steps. What it doesn't cover is the infrastructure side — which is where the real complexity was.

## How to Fix CloudFront S3 403 Access Denied Errors With OAC

This is the problem that countless developers hit when hosting static sites on AWS. You set up S3 + CloudFront + Origin Access Control, everything works on the root URL, and then you get **403 Access Denied** on every subdirectory path like `/blog` or `/about`.

### Why S3 REST Endpoints Don't Resolve Directory Indexes

The root cause is well-documented in the [AWS blog post on implementing directory indexes with CloudFront Functions](https://aws.amazon.com/blogs/networking-and-content-delivery/implementing-default-directory-indexes-in-amazon-s3-backed-amazon-cloudfront-origins-using-cloudfront-functions/): **S3 REST API endpoints do not support default directory indexes.**

When you use OAC (which requires the S3 REST endpoint, not the static website endpoint), CloudFront sends the exact URI path to S3. A request for `/blog` asks S3 for an object literally named `blog`. That object doesn't exist — the actual file is `blog/index.html`. S3 returns 403 Forbidden (not 404 — OAC masks the difference).

This is confirmed in the [AWS documentation on 403 errors with CloudFront](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/http-403-permission-denied.html) and has been reported extensively on [AWS re:Post](https://repost.aws/questions/QUfV8SeCqESR-XRLKWm_I3Qg/s3-cloudfront-oac-access-denied-when-accessing-path-other-than-index-site).

CloudFront's `default_root_object` setting only applies to the root path (`/`). It does **not** apply to subdirectories. This trips up almost everyone.

### The CloudFront Function That Fixes It Permanently

The solution is a [CloudFront Function](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cloudfront-functions.html) on the **viewer request** event that rewrites extensionless URLs to their directory index:

```javascript
function handler(event) {
    var request = event.request;
    var uri = request.uri;

    // If the URI has no file extension, resolve to index.html
    if (!uri.includes('.')) {
        if (!uri.endsWith('/')) {
            uri += '/';
        }
        uri += 'index.html';
    }

    request.uri = uri;
    return request;
}
```

This works because Astro (and most static site generators) use `build.format: 'directory'` by default, which outputs every page as a directory containing `index.html`:

| Browser URL | CloudFront rewrites to | S3 object key |
|---|---|---|
| `/` | `/index.html` | `index.html` |
| `/blog` | `/blog/index.html` | `blog/index.html` |
| `/blog/` | `/blog/index.html` | `blog/index.html` |
| `/blog/some-post` | `/blog/some-post/index.html` | `blog/some-post/index.html` |
| `/tags/aws` | `/tags/aws/index.html` | `tags/aws/index.html` |
| `/style.css` | `/style.css` (unchanged) | `_astro/style.css` |

No special cases. No route-specific logic. Adding new pages never requires updating the function.

### Why Not Use S3 Static Website Hosting Instead?

You might wonder why I don't just enable [S3 static website hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html), which handles directory indexes natively. The reason: **S3 website endpoints don't work with OAC.** As documented in the [AWS re:Post knowledge center](https://repost.aws/knowledge-center/cloudfront-oac-origins), you must use the S3 REST endpoint for OAC, which means you lose directory index resolution and need the CloudFront function to get it back.

If you don't need OAC (i.e., your bucket can be public), the website endpoint is simpler. But for private buckets with CloudFront-only access, the function approach is the correct solution.

## How to Handle OAC 403 vs 404 Errors for Custom Error Pages

There's a second gotcha with OAC that catches people off guard: **S3 returns 403 for missing objects, not 404.** When someone visits a URL that doesn't map to any page, S3 returns `AccessDenied` because the OAC policy only grants access to objects that exist.

This is documented in the [AWS troubleshooting guide for 403 errors](https://repost.aws/knowledge-center/s3-rest-api-cloudfront-error-403). The fix is to configure CloudFront custom error responses that map both 403 and 404 to your custom error page:

```hcl
custom_error_response {
  error_code         = 403
  response_code      = 404
  response_page_path = "/404.html"
}

custom_error_response {
  error_code         = 404
  response_code      = 404
  response_page_path = "/404.html"
}
```

Without this, visitors see a raw XML `AccessDenied` response instead of your custom 404 page.

## Managing the CloudFront Function in Terraform

The most common implementation I see in tutorials is creating the CloudFront function manually in the AWS console, then hardcoding the ARN. This works until someone modifies or deletes the function, and suddenly your site is broken with no version control trail.

I codified the function as a Terraform resource:

```hcl
resource "aws_cloudfront_function" "url_rewrite" {
  name    = "url-rewrite-index"
  runtime = "cloudfront-js-2.0"
  comment = "Rewrite extensionless URLs to /index.html"
  publish = true
  code    = <<-EOT
    function handler(event) {
        var request = event.request;
        var uri = request.uri;
        if (!uri.includes('.')) {
            if (!uri.endsWith('/')) {
                uri += '/';
            }
            uri += 'index.html';
        }
        request.uri = uri;
        return request;
    }
  EOT
}
```

Then reference it in the distribution's cache behavior:

```hcl
function_association {
  event_type   = "viewer-request"
  function_arn = aws_cloudfront_function.url_rewrite.arn
}
```

No GitHub secrets for the function ARN. No console drift. The function is version-controlled alongside the rest of the infrastructure.

## Astro Build Configuration for S3 and CloudFront

For the CloudFront function to work correctly, your static site generator must output directory-style paths. Here's the Astro configuration:

```javascript
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: `https://${process.env.DOMAIN_NAME || 'localhost:4321'}`,
  output: 'static',
  integrations: [tailwind(), sitemap()],
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },
});
```

Astro defaults to `build.format: 'directory'`, which generates the `blog/index.html` structure the CloudFront function expects. Do **not** set `build.format: 'file'` — that generates `blog.html` instead of `blog/index.html`, which breaks the rewrite logic.

The `site` property is important for the [sitemap integration](https://docs.astro.build/en/guides/integrations-guide/sitemap/) to generate correct absolute URLs. I pass `DOMAIN_NAME` as an environment variable in the GitHub Actions build step.

## The Migration Result

| Metric | Next.js | Astro |
|---|---|---|
| Client-side JavaScript | React runtime | Zero |
| Build time (38 pages) | ~12s | ~5s |
| Syntax highlighting | None | Shiki dual-theme |
| Markdown pipeline | fs + gray-matter + remark + dangerouslySetInnerHTML | Content Collections + safe `<Content />` |
| CloudFront function | Manual console config, special-cased routes | Terraform-managed, generic directory resolver |
| Custom 404 page | None | Astro `404.astro` + CloudFront error response |
| Accessibility | No audit | WCAG 2.1 AA compliant |

The deploy pipeline stayed the same: GitHub Actions builds the site, syncs to S3, and invalidates the CloudFront cache. The only CI/CD changes were updating the output directory from `out` to `dist` and removing the `FUNCTION_ARN` secret that's no longer needed.

If you're running a static blog on Next.js and fighting CloudFront routing issues, consider whether a purpose-built static site generator like Astro — paired with a proper directory-index CloudFront function — is the simpler path. It was for me.
