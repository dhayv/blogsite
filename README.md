# Personal Technical Blog

A SEO-optimized technical blog built with Next.js, documenting cloud engineering experiences and architectural decisions. Features serverless deployment using AWS S3, CloudFront, and Terraform.

## Architecture Overview

- **Frontend**: Next.js (Static Site Generation for SEO)
- **Hosting**: AWS S3
- **CDN**: CloudFront
- **Infrastructure**: Terraform
- **CI/CD**: GitHub Actions

## Features

- ✨ Static Site Generation for optimal SEO
- 🚀 Serverless Architecture
- ⚡ Fast page loads with CloudFront CDN
- 🛠 Infrastructure as Code with Terraform
- 📱 Responsive Design
- 🔄 Automated deployments

## Infrastructure

All AWS resources are managed through Terraform:
- S3 bucket for static content
- CloudFront distribution
- SSL/TLS certificate
- IAM roles and policies

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production build locally
npm start
```

## Deployment

Infrastructure deployment and content updates are automated via GitHub Actions:

1. Terraform applies infrastructure changes
2. Next.js static site is built
3. Content is uploaded to S3
4. CloudFront cache is invalidated

## Project Status

🚧 Currently in development - Initial release coming soon!

## Blog Topics

- Cloud Engineering
- AWS Services
- Infrastructure as Code
- System Architecture
- DevOps Practices

## Contributing

This is a personal blog, but if you spot any issues or have suggestions, feel free to open an issue!
