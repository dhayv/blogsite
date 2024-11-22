# Cloud-Native Blog Platform

A production-grade blog platform built with Next.js and AWS, demonstrating modern cloud architecture and DevOps practices. The platform features serverless deployment, global content delivery, and infrastructure managed entirely through code.

- 🌐 [Live Site](Davidhyppolite.com)

## Architecture Overview

### Core Technologies
- **Frontend**: Next.js 
- **Cloud Provider**: AWS
- **Infrastructure**: Terraform
- **CI/CD**: GitHub Actions
- **Version Control**: Git

### AWS Infrastructure
```
├── CloudFront (CDN)
│   └── Global content delivery
│   └── SSL/TLS termination
│   └── HTTP to HTTPS redirection
├── S3
│   ├── Blog Content Bucket
│   │   └── Static file hosting
│   │   └── Versioning enabled
│   └── Terraform State Bucket
│       └── Encrypted state storage
├── Certificate Manager (ACM)
│   └── SSL/TLS certificate management
└── Route53
    └── DNS management
```

## Infrastructure as Code

### Terraform Module Structure
```
.
├── main.tf          # Root module configuration
├── variables.tf     # Input variables
└── modules/
    └── blog/
        ├── acm/            # Certificate management
        ├── cloudfront/     # CDN configuration
        ├── originaccess/   # S3 bucket access control
        ├── route53/        # DNS records
        └── s3/            # Storage configuration
```

### State Management
```hcl
terraform {
  backend "s3" {
    bucket  = "my-terraform-blog-state-bucket"
    key     = "blogsite/terraform.tfstate"
    region  = "us-east-1"
    encrypt = true
  }
}
```

## Security Implementation

- **Content Access**: Origin Access Identity (OAI) restricts S3 access to CloudFront
- **Data Transfer**: Forced HTTPS with SSL/TLS encryption
- **CI/CD**: OIDC authentication for GitHub Actions
- **State Management**: Encrypted Terraform state in private S3 bucket

## Development & Deployment

### Local Development
```bash
# Frontend
cd my-app
npm install
npm run dev     # Development server
npm run build   # Production build
npm start       # Serve production build

# Infrastructure
cd terraform-confi
terraform init  # Initialize Terraform
terraform plan  # Preview changes
terraform apply # Apply changes
```

### Required Variables
```hcl
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
}

variable "domain_name" {
  description = "Blog domain name"
  type        = string
}

variable "zone_id" {
  description = "Route53 hosted zone ID"
  type        = string
}

variable "aws_profile" {
  description = "AWS role to use locally to create"
  type        = string
  default     = "" (blank so AWS configure can assume role in pipeline)
}
```

### CI/CD Pipeline Workflow
1. **Infrastructure Validation**
   - Terraform format check
   - Terraform validation
   - Infrastructure plan

2. **Frontend Deployment**
   - Next.js build
   - Static file optimization
   - S3 upload

3. **Cache Management**
   - CloudFront invalidation
   - Cache optimization

## Engineering Highlights

### Performance Optimization
- Global content delivery via CloudFront
- Static site generation for optimal loading
- Automated cache management

### Cost Efficiency
- Serverless architecture
- Pay-per-use model
- Resource optimization

### Scalability & Reliability
- High availability design
- Auto-scaling capabilities
- Zero-downtime deployments

## Technical Skills Demonstrated

- **Cloud Architecture**: AWS service integration and best practices
- **Infrastructure as Code**: Terraform module design and state management
- **Security**: AWS security features and access control
- **CI/CD**: Automated testing and deployment pipelines
- **Frontend**: Next.js/React development and optimization

## Contributing
While this is a personal project, I welcome:
- Bug reports
- Feature suggestions
- Code reviews
- Documentation improvements

## License
MIT

---

*This project demonstrates production-grade cloud infrastructure implementation while maintaining modern DevOps practices and security standards.*
