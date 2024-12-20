---
title: "Automating Website Deployments with AWS CodePipeline and S3 No Upload"
date: "12-9-2024"
author: David Hyppolite
excerpt: "Zero-touch process from Github to S3 using Codeipeline"
---
A step-by-step implementation of automated deployments using AWS CodePipeline, S3 static website hosting, and GitHub integration. This project demonstrates CI/CD pipeline creation, IAM security configuration, and version-controlled deployments - replacing traditional FTP uploads with a zero-touch solution.

## Quick Links

- [Business Benefits](#business-benefits)
- [The Problem](#the-problem)
- [The Solution: AWS CodePipeline](#the-solution-aws-codepipeline)
- [Implementation Guide](#implementation-guide)
- [Making Changes and Verifying Deployment](#making-changes-and-verifying-deployment)

### Initial Architecture

```bash
GitHub Repository
    └── CodePipeline
        └── S3 Static Website
```

## Business Value

### Business Benefits

- **Zero Manual Intervention:** Automates the deployment process.
- **Complete Deployment History:** Maintains a detailed record of all deployments.
- **Quick Rollback Capability:** Easily revert to previous versions if needed.
- **Secure Access Control:** Uses IAM roles to manage permissions securely.
- **Reduced Human Error:** Minimizes mistakes associated with manual uploads.

## The Problem

A retail company is currently hosting their static website content on-premises. The marketing team updates the website content by manually uploading files via FTP. During holiday sales, the website experiences high traffic and occasional outages.

### Common Issues with FTP Deployments

- **Incomplete Uploads:** Can break the website if files aren't fully uploaded.
- **Lack of Deployment History:** No records of what was deployed and when.
- **Change Tracking:** Difficult to identify who made specific changes.
- **No Rollback Capability:** Unable to revert to previous versions easily.
- **Security Vulnerabilities:** FTP lacks robust security measures, exposing the site to potential threats.

## The Solution: AWS CodePipeline

### Key Takeaways

- **Automated Deployments:** Eliminate the risks associated with FTP.
- **Version Control:** Provides a comprehensive deployment history.
- **IAM Roles:** Ensure secure access and permissions management.
- **S3 Static Hosting:** Enables reliable and scalable content delivery.
- **CodePipeline Automation:** Streamlines the entire deployment process from source to deployment.

While many tutorials jump straight to CloudFront and custom domains, let's focus on the fundamental problem: automating deployments reliably.

Instead of manually uploading files to S3, this guide demonstrates a true zero-touch process. We'll start with an empty S3 bucket and let CodePipeline handle the entire deployment lifecycle.

## Implementation Guide

### **Step 1:** GitHub Repository Setup

Create your HTML file by running the following command in your repository:

```bash
touch index.html
```

![basic-index.html](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/6cgk39ypnagsdu6sof67.png)

Copy and paste the provided HTML code:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Codepipeline Demo</title>
</head>
<body>
    <H1>Deploy via AWS Codepipeline</H1>
    <p>Deployment version: <span>1</span></p>
</body>
</html>
```

Push your code to your repo.

### **Step** 2: S3 Configuration

First, create an S3 bucket with static website hosting:

In the AWS Console Search "**S3**".

![S3 landing page](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/298g4yt0f7rwdeii22wz.png)

Click the "Create Bucket" button.

![bucket name](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/92axvdf7qooo8jqs5ef0.png)

**Bucket Name:** myawsbucket-demov1 (ensure the name is unique).

Keep Default settings except:

- **Uncheck the box:** Block All Public Access.
- Acknowledge the previous selection to Enable Public Access.
- **Bucket Versioning:** Enable.

![public access](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/yu1arrmeny02nxoiunkc.png)

![Bucket versioning](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/i5x0s0vu8prt352znzwz.png)

Enable Versioning (we are simulating a company its important to have versioning enabled for accidental deletes and to track history of changes)

Accept the remaining defaults and create the bucket.

#### Enable Static Website Hosting

After creating your bucket, select it and navigate to the **Properties** tab. Scroll down to **Static website hosting** and click **Edit**.

![static website s3](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/h3hxjng7wbdo3xrnpfsf.png)

- **Static website hosting:** enable
- **Hosting type:** Host a static website
- **Index document:** index.html
- Save Changes

We Have created a bucket but we don't have the necessary permissions to access the items in the bucket.

#### Configure Bucket Policy

Navigate to the **Permissions** tab and scroll to **Bucket Policy**.

![policy section](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/50omfx72imwqjgyrudzc.png)

Click **Edit** and add the following policy to grant public read access to your objects:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": [
                "s3:GetObject"
            ],
            "**Resource**": "arn:aws:s3:::my-bucket/*"
        }
    ]
}
```

Adapt the **Resource** to match your bucket name, then save changes.

### **Step 3:** CodePipeline Setup

In the AWS Console, search for and select **CodePipeline**.

![code-pipeline-initial-screen](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/rhetwin48387j85lioli.png)

Click Create **Pipeline**.

![pipeline-step1](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/8l6q2php3r18btk9cf0a.png)

This option allows us to build a custom pipeline to deploy from GitHub to s3.

Click **Next**.

![pipeline-step2](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/tdcvq5e9omwz011vj5pr.png)

#### Pipeline Settings

- **Name the Pipeline:** Choose a meaningful name.
- **Service Role:** Select New service role to allow AWS to create a role automatically.

![pipeline-step2.2](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/exnw2d023p8ppo614088.png)

- **Advanced settings:** Use the default location to allow AWS to create an S3 bucket for CodePipeline artifacts, which will maintain deployment history.

#### Add Source Stage

![Image-description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/l22l7xvoq8ut7wh5w04t.png)

Click **Connect to GitHub**.

![github-app-connection](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/xjs59qnrzck9wu4esa8h.png)

Name your connection and click **Connect to Github**.

![aws-connector](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/0wejg7zcchncuj8uqaj4.png)

Click **Authorize AWS Connector for Github** to grant AWS access to your GitHub repository.

![basic-connect](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/1q4k4u5qkt8kmz1tfwyh.png)

- A basic GitHub user connection suffices for this static website deployment pipeline.
- If working with multiple organizations, select the specific user or organization repositories you want to use.
- Click **Connect**.

#### Configure Source Stage

- **Source Provider:** GitHub (via GitHub App)
- **Connection:** Your GitHub connection
- **Repository Name:** Select your repository
- **Default Branch:** main
- **Output Artifact Format:** Default settings
- **Webhook Events:** Trigger the pipeline on push and pull request events.
- Click **Next**.

![build-stage](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/wt69syzf54d9w2v55czh.png)

#### Skip Build and Test Stages

- Since you're deploying HTML files, you can skip the build stage.
- Optionally, skip the test stage.

#### Deploy stage

![deploy-stage](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/i4tzc66p806shvk3v7od.png)

- **Deploy Provider:** Amazon S3
- **Region:** Your chosen AWS region
- **Bucket:** Select your static hosted S3 bucket
- **S3 Object Key:** Leave blank
- **Extract file before deploy:** Checked
- Click **Next**.

#### Review and Create Pipeline

- Review all settings and click **Create Pipeline**.

### **Step4:** Testing and Verification

Pipeline automatically starts

![pipeline-queue](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/kh14tbz8q82qahw7nuff.png)

![pipeline-done](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/d7lwcw9gogstdm39014b.png)

![pipeline-success-details](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/xjmtekicwu5516ueimsp.png)

The pipeline creation process should complete quickly.

![s3-website-endpoint](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/s9j4z7623b3y2qxy2a6h.png)

As you can see, we've created a zero-touch solution from GitHub to S3, where files are automatically pulled from the repository without manual uploads.

![first-s3-pull-fromgithub](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/gyzj50yoxj3x5iq5rkv8.png)

With versioning enabled, you can track deployments:

![first-upload](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/4uav1w1bu2v2w831are0.png)

## Making Changes and Verifying Deployment

Make a change in your repository with a commit message like "Update index.html" to update the deployment version to 2.

![github-changes](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/n43q7ajazr7as7hdroeo.png)

CodePipeline will automatically detect the changes:

![code-pipeline-changes](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/sbjbjsog86gxtd22n5hg.png)

View the updated site reflecting the changes:

![site-changes](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/a5g2reqkc09rp181rms7.png)

### Conclusion

By following this guide, you've successfully set up an automated, secure, and efficient deployment pipeline using AWS CodePipeline, S3 static website hosting, and GitHub. This zero-touch solution not only streamlines your deployment process but also enhances security, provides version control, and ensures high availability during peak traffic periods.
