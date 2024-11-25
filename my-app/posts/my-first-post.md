---
title: "Building a Cloud-Native Blog Platform with Terraform"
date: "11-25-2024"
author: David Hyppolite
excerpt: "A journey through building a cloud-native blog platform using Terraform and AWS services"
---

## Why Build Another Blog Platform?

"Just use WordPress," they said. "You could have it up in minutes."

As an AWS Solutions Architect, I knew I could spin up a simple blog in the console within an hour. But here's the thing - I've already built production systems maintaining 99.9% uptime. I've already clicked through the console countless times. This project wasn't about the fastest path to a blog; it was about pushing my limits.

I needed a platform that would:

1. **Force me to translate my console knowledge into code**
2. **Challenge my understanding of AWS service interactions**
3. **Create a real-world testing ground for complex cloud architectures**
4. **Serve as documentation for other engineers facing similar challenges**

The real value? The gap between knowing how to do something in the console and implementing it in Terraform. That's where the learning happens. That's where engineers grow.

## Architectural Decisions

### Core Infrastructure Components

I designed the architecture with several key requirements in mind:

- **High Availability**: Using CloudFront for edge distribution
- **Security**: Implementing proper IAM roles and OIDC federation
- **Scalability**: S3 for static content and versioning
- **Automation**: Complete CI/CD pipeline with GitHub Actions

Here's how each piece fits together:

#### Content Delivery and Security

- **CloudFront Distribution**: Handles HTTPS termination, caching, and low-latency delivery
- **ACM (AWS Certificate Manager)**: Manages SSL certificates for secure communication
- **Origin Access Identity (OAI)**: Restricts S3 access exclusively to CloudFront
- **S3 Bucket**: Hosts static files with versioning enabled

#### Infrastructure Management

- **Private S3 Backend**: Maintains Terraform state files securely
- **IAM Roles**: Enables long-term automation with least privilege
- **OIDC Web Identity**: Secures GitHub Actions' AWS access

This setup not only adheres to AWS’s six pillars of well-architected frameworks but also taught me the intricacies of networking and IaC.

## The Real Challenges: A Sequential Journey

What looks like a straightforward architecture on paper turned into a complex troubleshooting journey. Here's how each challenge led to the next:

### 1. The Hosted Zone Puzzle

Initially, Terraform couldn't access the hosted zone by name. While AWS CLI could find it, Terraform kept failing. This was my first hint that something deeper was wrong, though I didn't realize it yet.

```hcl
# Initial attempt that failed`
resource "zone_name" "primary" {
  name = var.domain_name
}

# Solution: Use zone ID directly`
data "zone_id" "primary" {
  zone_id = var.zone_id
}
```

### 2. The Multi-Account Maze

The hosted zone issue unveiled a complex problem: I was unknowingly trying to access resources across multiple AWS accounts without proper cross-account permissions. Here's how it manifested:

1. **First sign**: Permission errors when Terraform tried accessing resources such as hosted zone
2. **Second sign**: User not found in the expected account
3. **Final revelation**: S3 bucket 403 errors indicating cross-account access attempts

After numerous attempts at fixing permissions, with fatigue setting in and countless Chrome tabs open, I stepped away from the computer. Sometimes the best debugging tool is a fresh perspective. When I returned, I methodically verified each environment variable, discovering they weren't properly configured.

Initially, I set environment variables for my default account:

```bash
# Checking current identity
aws sts get-caller-identity

# Setting up environment variables
export AWS_ACCESS_KEY_ID="new_access_key"
export AWS_SECRET_ACCESS_KEY="new_secret_key"
export AWS_DEFAULT_REGION="us-east-1"

# Profile
export AWS_PROFILE=default
```

But this created conflicts when trying to switch between accounts. The real issue? The Terraform role lacked cross-account access permissions.

### 3. Cross-Account Resource Management

The situation became clear:

- **Hosted zone**: In main account but inaccessible due to resource in backup account
- **S3 bucket**: In backup account but main role lacked cross-account access
- **Terraform**: Were able to create resources becuase I gave permission from backup account but not main account.

With a fresh mind,I saw the clear picture. I took a systematic approach:

Resolution required systematic cleanup:

1. **Profile Configuration**: I configured a profile specifically for the backup account, which I had initially removed. By setting `export AWS_PROFILE=backup`, I aligned the Terraform operations with the correct account.
2. **Environment Variable Adjustment**: I unset the previous environment variables that were causing conflicts and reconfigured the AWS CLI to ensure that operations were correctly authenticated and executed under the appropriate account.
3. **Verification and Cleanup**: I ran `aws sts get-caller-identity` to verify that the CLI was now using the correct account. Subsequently, I used `terraform init` to reinitialize Terraform and `terraform destroy --auto-approve` to remove mistakenly created resources in backup.

The resolution of these issues marked a significant turning point in the project. Not only did I manage to streamline the AWS architecture by ensuring resources were correctly aligned with their respective accounts, but I also reinforced best practices in AWS management and Terraform usage. This process underscored the importance of vigilant account management and served as a valuable lesson in maintaining clarity and organization in cloud environments.

### 4. CI/CD Pipeline Optimization

The final challenge emerged in the CI/CD pipeline. While the YAML was syntactically correct, Terraform operations were hanging at Terraform Plan. The root cause? Environment variables needed to be passed to each Terraform command individually:

```yaml
- name: Terraform Init
  run: |
    cd ./terraform-config
    terraform init
  env:
    TF_VAR_domain_name: ${{ secrets.DOMAIN_NAME }}
    TF_VAR_aws_region: ${{ secrets.AWS_REGION}}
    TF_VAR_zone_id: ${{ secrets.ZONE_ID }}

- name: Terraform
  id: plan
  run: |
    cd ./terraform-config
    terraform plan -out=tfplan
    
- name: Terraform Apply
  id: apply
  run: |
    cd ./terraform-config
    terraform apply -auto-approve tfplan 
```

# Working solution

```yaml
- name: Terraform Init
  run: |
    cd ./terraform-config
    terraform init
  env:
    TF_VAR_domain_name: ${{ secrets.DOMAIN_NAME }}
    TF_VAR_aws_region: ${{ secrets.AWS_REGION}}
    TF_VAR_zone_id: ${{ secrets.ZONE_ID }}

- name: Terraform
  id: plan
  run: |
    cd ./terraform-config
    terraform plan -out=tfplan
  env:
    TF_VAR_domain_name: ${{ secrets.DOMAIN_NAME }}
    TF_VAR_aws_region: ${{ secrets.AWS_REGION}}
    TF_VAR_zone_id: ${{ secrets.ZONE_ID }}

- name: Terraform Apply
  id: apply
  run: |
    cd ./terraform-config
    terraform apply -auto-approve tfplan 
  env:
    TF_VAR_domain_name: ${{ secrets.DOMAIN_NAME }}
    TF_VAR_aws_region: ${{ secrets.AWS_REGION}}
    TF_VAR_zone_id: ${{ secrets.ZONE_ID }}
```

This challenge took me two hours to solve, highlighting the importance of understanding the nuances of Terraform commands within CI/CD pipelines and reinforcing the need for meticulous configuration to ensure smooth automation.

## Key Learnings

1. **Account Management is Critical**

    - Always verify which account you're operating in
    - Set up proper profile management early
    - Use `aws sts get-caller-identity` frequently
2. **Infrastructure as Code Requires Different Thinking**

    - What works in the console might need different approaches in Terraform
    - Resource relationships need explicit definition
    - State management is crucial
3. **Authentication Flow Understanding**

    - OIDC federation setup requires careful configuration
    - Environment variables affect different tools differently
    - Multiple authentication methods need careful management
4. **Best Practices Emerged**

    - Always verify account context before operations
    - Implement clear naming conventions
    - Maintain separation of concerns between accounts
    - Document environment variable requirements

## Embracing the Hard Path

One year ago, I made a choice: stop settling for the easy path. I had already built multiple AWS projects. Already maintained Linux servers. Already earned my AWS Solutions Architect certification. But Terraform? That was my next mountain to climb.

The console is comfortable. It's visual. It's immediate. But code? Code demands precision. Every resource relationship must be explicit. Every permission must be defined. Every interaction must be planned.

This project forced me to think differently about infrastructure:

- No more clicking through options
- No more relying on AWS's default settings
- No more visual confirmation of changes

Instead, I had to:

- Define every resource relationship in code
- Understand every service interaction deeply
- Plan for automation from the start
- Think in terms of state management and drift detection

Was it harder? Absolutely.
Did it take longer? Without question.
Was it worth it? Every frustrating minute.

## Looking Forward

This platform isn't just a blog—it's a testament to the complexity and learning opportunities in modern cloud architecture. Every challenge forced me to dig deeper into AWS services, Terraform behavior, and Cloud practices.

The final architecture follows AWS Well-Architected Framework principles:

- **Security**: Proper IAM roles, OIDC federation, and access controls
- **Reliability**: CloudFront distribution and S3 versioning
- **Performance Efficiency**: Edge caching and optimization
- **Cost Optimization**: Practically Free
- **Operational Excellence**: Fully automated deployments

## Code Examples and Documentation

[Github Code](https://github.com/dhayv/blogsite)

The complete Terraform configuration, GitHub Actions workflows, and detailed setup instructions are available in the repository. Feel free to use this as a reference for your own projects or to suggest improvements.

Remember: Sometimes the longest path teaches you the most valuable lessons.
