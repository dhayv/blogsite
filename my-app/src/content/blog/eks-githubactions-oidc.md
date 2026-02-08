---
title: "How to Deploy to Amazon EKS With GitHub Actions and OIDC"
date: "1-29-2025"
author: "David Hyppolite"
excerpt: "Deploy to Amazon EKS using GitHub Actions with OIDC authentication. No static AWS credentials needed. Includes ECR, IAM, and Kubernetes setup."
tags: ['aws', 'eks', 'kubernetes', 'github-actions', 'cicd', 'docker', 'iam']
---
In this guide, I’ll show you how to build a secure **AWS EKS(Kubernetes)** CI/CD pipeline for your FastAPI app complete with **GitHub Actions**, **Docker**, and **OpenID Connect (OIDC)** all while following AWS security best practices like least-privilege IAM policies. We won’t obsess over every detail of FastAPI or Docker, but we’ll cover enough to get your application running on EKS with confidence.

> Note: The primary focus of this blog is on CI/CD processes and AWS configuration, so we won’t dive too deeply into FastAPI or Docker fundamentals.

### Table of Contents

- [Prerequisites](#prerequisites)
- [Step 1: Set Up the GitHub Repository](#step-1-set-up-the-github-repository)
- [Step 2: Create an Amazon ECR Repository for Docker Images](#step-2-create-an-amazon-ecr-repository-for-docker-images)
- [Step 3: Create an Amazon EKS Cluster Using Eksctl](#step-3-create-an-amazon-eks-cluster-using-eksctl)
- [Step 4: Configure AWS OIDC for GitHub Actions Authentication](#step-4-configure-aws-oidc-for-github-actions-authentication)
- [Step 5: Build the GitHub Actions CI/CD Workflow](#step-5-build-the-github-actions-cicd-workflow)
- [Clean Up AWS EKS Resources](#clean-up-aws-eks-resources)
- [Conclusion](#conclusion)

### Technologies and AWS Services Used

- **AWS EKS** (Kubernetes on AWS)
- **FastAPI**
- **Amazon ECR**
- **Cloud Security & IAM**
- **Kubernetes Orchestration**

## Prerequisites for EKS Deployment With GitHub Actions

- **AWS Account:** Admin permissions for creating EKS clusters, IAM roles, and ECR repositories.
- AWS CLI installed and configured: [Install Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- eksctl installed: [Installation Guide](https://eksctl.io/installation/)
- Docker installed: [Get Started with Docker](https://www.docker.com/get-started/)

## Why Use OIDC for GitHub Actions and AWS EKS

Managing Kubernetes on AWS via EKS is a great approach, but configuring secure access for CI/CD can be tricky. With OIDC, GitHub Actions can assume roles in AWS without storing secret keys, so no static credentials, Let’s walk through setting up an EKS cluster, creating an ECR repo, and configuring GitHub Actions to deploy our FastAPI service to Kubernetes automatically.

This guide walks through:

1. Setting up an EKS cluster with eksctl
2. Creating an ECR repository for your Docker images
3. Configuring OIDC so GitHub Actions can assume an IAM role
4. Deploying the FastAPI application to EKS

### What You Will Learn in This EKS CI/CD Tutorial

- **Security-First CI/CD:** By using OIDC, there’s no need to embed AWS credentials in GitHub.
- **Least-Privilege Access:** You’ll attach minimal IAM permissions, restricted to your ECR repo or EKS cluster.
- **Easy Automation:**  GitHub Actions automatically builds, pushes, and deploys whenever you push code to your main branch.

## Step-by-Step: Deploy to EKS With GitHub Actions

### Step 1: Set Up the GitHub Repository

Create (or use) a repository that holds your FastAPI app and Kubernetes manifests:

```bash

Repository Structure:
├── main.py        # FastApi application
├── Dockerfile        # Docker
├── fastapi-deploy.yaml           # deploy scripts
├── fastapi-service.yaml           # service scripts
└── requirements.txt
```

> Keep your code organized. The .yaml files will be applied to EKS to deploy the FastAPI service.

### Step 2: Create an Amazon ECR Repository for Docker Images

Amazon ECR is used to store your Docker images.

1. Go to AWS Console > Search **ECR** > **Create Repository**
2. Name it (e.g., fastapi-app) or anything you prefer
3. Leave defaults, then Create

![create-ecr](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/kf1lq25fuzmjafwz8y80.png)

1. Set the repository name: fastapi-app
2. Leave the default settings
3. click **Create**

**View Repository Commands:**

- After creation select the repo

- Click **View push commands** on your new repo to see the exact Docker build/push steps.

Retrieve the ECR ARN for use in IAM policies:

```bash
aws ecr describe-repositories --region us-east-1
```

> This is important if you want to create inline IAM policies restricting actions to this specific repository.

### Step 3: Create an Amazon EKS Cluster Using Eksctl

Make sure you have the AWS CLI and Eksctl installed on your device to create the EKS cluster.
Using eksctl, create the EKS cluster:

```bash
eksctl create cluster --name cluster-name \
                      --region <YOUR_REGION> \
                      --node-type instance-type \
                      --nodes-min 2 \
                      --nodes-max 6
```

I used.

```bash
eksctl create cluster --name fastapi-demo \
                      --region us-east-1 \
                      --node-type t3.medium \
                      --nodes-min 2 \
                      --nodes-max 6
```

This will take several minutes. Once finished, your kubeconfig will be updated so you can run kubectl commands against the new cluster.

Verify the cluster:

```bash
kubectl get nodes
```

### Step 4: Configure AWS OIDC for GitHub Actions Authentication

To avoid storing permanent AWS credentials in GitHub, we’ll configure OpenID Connect (OIDC) so GitHub Actions can assume roles in AWS. [Guthub Action in AWS](https://aws.amazon.com/blogs/security/use-iam-roles-to-connect-github-actions-to-actions-in-aws/)

If you have previously created a Identity provider for GitHub skip this step if not create one:

#### Add a GitHub OIDC Identity Provider in AWS IAM

Go to the **AWS Console** > **IAM** > **Identity Providers** > **Add provider**.

- **Provider type:** OpenID Connect
- **Provider Url:** https://token.actions.githubusercontent.com
- **Audience:** sts.amazonaws.com

Next **Add provider**.

![IAM Identity Provider configuration screen with OpenID Connect settings for GitHub Actions](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/zxkmr82acbcr2ki9b5ki.png)

#### Create an IAM Role for GitHub Actions OIDC

Copy the Identity provider role arn.

Select the newly your newly created provider on the Identity providers screen

![assign-role](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/1no2ncorfyp2am8hh2ma.png)

Click **Assign a role**

![new-role](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ld4jz7v1774b5u9g0wqo.png)

- **Role options:** Create a new role

![trusted-entity-type](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/aarppzu5dmwp5zekjyuc.png)

**Trusted entity type:** Custom trust policy

Click **next**

GitHub organization <aws-samples>, the repository named <EXAMPLEREPO>, and the branch named <ExampleBranch>. Update the Federated ARN with the GitHub IdP ARN that you copied previously.

Replace <AWS_ACCOUNT_ID>,<OWNER>,<REPO> and <BRANCH> with your AWS account ID, GitHub repository owner, repository name, and branch name.

```bash
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<AWS_ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:<OWNER>/<REPO>:ref:refs/heads/<BRANCH>"
        }
      }
    }
  ]
}
```

Than click **Next**

Attach the policies below:

1. AmazonEKSClusterPolicy
2. AmazonEKSWorkerNodePolicy

Than click **Next**

Name the role, e.g. **GitHubActionsEKSECRRole**

Next click **Create Role**

Access the newly created role.

**Add Inline Policy for ECR:**

**Add Permissions** > **Create Inline policy** > Use the **JSON** editor

![IAM inline policy JSON editor for creating an ECR permissions policy](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/pkdtmj1nzl53lyv3c5p0.png)

Copy the code below to restrict to you repository ARN, as shown below.

```bash
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:GetRepositoryPolicy",
        "ecr:DescribeRepositories",
        "ecr:ListImages",
        "ecr:DescribeImages",
        "ecr:BatchGetImage",
        "ecr:GetLifecyclePolicy",
        "ecr:GetLifecyclePolicyPreview",
        "ecr:ListTagsForResource",
        "ecr:DescribeImageScanFindings",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:PutImage"
      ],
      "Resource": "arn:aws:ecr:<AWS-REGION>:<ACCOUNT-ID>:repository/<REPO-NAME>"
    }
  ]
}

```

Give your role policy a name; **GitHubActionsEKSECRRole**

Click **Next**

Instead of editing aws-auth ConfigMap, you can give this role direct EKS access:

Run the following code in your CLI.

Replace cluster-name with the name of your cluster.

```bash
"aws eks create-access-entry --cluster-name <cluster-name> --principal-arn arn:aws:iam::<AWS_ACCOUNT_ID>:role/GitHubActionsEKSECRRole --type STANDARD"
```

Then associate the policy that allows cluster admin actions:

```bash
aws eks associate-access-policy --cluster-name <cluster-name> --principal-arn arn:aws:iam::<AWS_ACCOUNT_ID>:role/GitHubActionsEKSECRRole \
  --access-scope type=cluster --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy
```

You can verify your entry:

```bash
aws eks list-access-entries --cluster-name fastapi-demo
```

### Step 5: Build the GitHub Actions CI/CD Workflow

Finally, set up your GitHub Actions workflow to build, push, and deploy automatically.

In your GitHub repo, navigate to **Actions** > **New Workflow.**

![GitHub Actions tab showing the New Workflow button](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/q0e6zetc3bikd1cks4ma.png)

![GitHub Actions workflow editor with a blank YAML file](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ugjmze78ihzxgq4jzmmr.png)

Copy the code below and replace with your information. Anything that is full capitilized and begins with a "$" is sensitive information that will not be easily shown in your code.

```yaml
name: Deploy to AWS

on:
  workflow_dispatch:  
  push:
    branches:
      - main
  
jobs:
  deploy:
    runs-on: ubuntu-latest
  
    permissions:
      id-token: write
      contents: read
  
    steps:
      - name: Checkout code
        uses: actions/checkout@v4.2.2

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          role-session-name: GitHubActionsSession
          aws-region: ${{ secrets.AWS_REGION }}
  
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2
  
      - name: Build, tag, and push docker image to Amazon ECR
        env:
          REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          REPOSITORY: fastapi-app # your ECR repository name
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $REGISTRY/$REPOSITORY:$IMAGE_TAG .
          docker push $REGISTRY/$REPOSITORY:$IMAGE_TAG

      - name: Update kube config
        run: aws eks update-kubeconfig --name ${{ secrets.EKS_CLUSTER_NAME }} --region ${{ secrets.AWS_REGION }}
    
      - name: Deploy to EKS
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}        
          IMAGE_TAG: ${{ github.sha }}
          EKS_CLUSTER_NAME: ${{ secrets.EKS_CLUSTER_NAME }}
        run: |
          sed -i.bak "s|DOCKER_IMAGE|$ECR_REGISTRY/$REPOSITORY:$IMAGE_TAG|g" fastapi-deploy.yaml
          kubectl apply -f fastapi-deploy.yaml
          kubectl apply -f fastapi-service.yaml

```

#### Understanding the GitHub Actions EKS Deployment Workflow

Let's walk through our CI/CD pipeline that automates deploying applications to AWS using GitHub Actions. This workflow handles everything from building Docker images to deploying on EKS, all while maintaining security best practices.

##### GitHub Actions Workflow Triggers and OIDC Permissions

```yaml
name: Deploy to AWS
on:
  workflow_dispatch:  
  push:
    branches:
      - main
```

Our pipeline springs into action in two scenarios:

- When code is pushed to the main branch
- Manually through workflow_dispatch (useful for testing or one-off deployments)

The workflow needs specific permissions to interact with AWS securely:

```yaml
permissions:
  id-token: write
  contents: read
```

These permissions enable OIDC authentication with AWS while keeping access to our GitHub repository read-only - following the principle of least privilege.

##### Authenticate GitHub Actions With AWS Using OIDC

```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
    role-session-name: GitHubActionsSession
    aws-region: ${{ secrets.AWS_REGION }}
```

This step establishes secure communication with AWS using OIDC. Instead of storing long-lived credentials, we assume an IAM role temporarily. This role grants just enough permissions to:

- Push images to ECR
- Deploy to our EKS cluster

##### Build and Push Docker Images to Amazon ECR

```yaml
- name: Login to Amazon ECR
  id: login-ecr
  uses: aws-actions/amazon-ecr-login@v2

- name: Build, tag, and push docker image to Amazon ECR
  env:
    REGISTRY: ${{ steps.login-ecr.outputs.registry }}
    REPOSITORY: fastapi-app
    IMAGE_TAG: ${{ github.sha }}
  run: |
    docker build -t $REGISTRY/$REPOSITORY:$IMAGE_TAG .
    docker push $REGISTRY/$REPOSITORY:$IMAGE_TAG
```

Here's where we handle our Docker image:

1. First, we authenticate with Amazon ECR
2. Then we build the image using our Dockerfile
3. We tag it with the git commit SHA for version tracking
4. Finally, we push it to our ECR repository

##### Deploy to Amazon EKS With Kubectl

```yaml
- name: Update kube config
  run: aws eks update-kubeconfig --name ${{ secrets.EKS_CLUSTER_NAME }} --region ${{ secrets.AWS_REGION }}

- name: Deploy to EKS
  env:
    ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}        
    IMAGE_TAG: ${{ github.sha }}
    EKS_CLUSTER_NAME: ${{ secrets.EKS_CLUSTER_NAME }}
  run: |
    sed -i.bak "s|DOCKER_IMAGE|$ECR_REGISTRY/$REPOSITORY:$IMAGE_TAG|g" fastapi-deploy.yaml
    kubectl apply -f fastapi-deploy.yaml
    kubectl apply -f fastapi-service.yaml
```

The final stage deploys our application to EKS:

1. We configure kubectl to communicate with our EKS cluster
2. Update our Kubernetes manifests with the new image details
3. Apply both the deployment and service configurations

##### Security Best Practices for GitHub Actions and AWS

- All sensitive values are stored as GitHub secrets
- OIDC provides secure, temporary AWS credentials
- The workflow uses specific, versioned actions to prevent supply chain attacks
- Each step follows the principle of least privilege

Remember to replace the placeholder values (anything starting with $) with your specific information when setting up this workflow.n

### Store AWS Credentials as GitHub Actions Secrets

Store your AWS account details as secrets:
It is good practice to not hardcode sensitive information but we still need to use it to save sensitive infornation we will be using GitHub secrets.

1. Go to your repo > **Settings** → **Secrets & Variables** > **Actions** to add them.
2. You're going to create a **New Repository Secret**.
![github-security](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/hl6cmkj4o3hyjagcbcg9.png)

Your entries will look like this.

![aws-region](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/aqkq5fm5gafqyvpsmeje.png)

Add entries for:

```bash
AWS_REGION

AWS_ROLE_ARN # Role created

EKS_CLUSTER_NAME
```

#### Trigger the Pipeline and Verify EKS Deployment

You can monitor the progress of your CI/CD pipeline by visiting the “GitHub Actions” tab in your repository. Here, you’ll see the status of each step in your workflow.

Here is what a successful deployment looks like.

![GitHub Actions workflow run showing all steps completed successfully](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/dxrxtszocq94c9w7fy6g.png)

IN the AWS console got to **EC2** > **Load balancer**

![AWS EC2 Load Balancer page showing the DNS name to access the application](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/6y71j4d3elzagtibol31.png)

Copy the DNS name and go to port 80.

### Clean Up AWS EKS Resources

When you’re done, it’s best to delete unneeded resources to avoid costs:

```bash
eksctl delete cluster --name=fastapi-demo
```

Also, remove or delete the ECR repository if you no longer need it.

### Summary: Secure EKS Deployment With GitHub Actions OIDC

Congratulations! You’ve created a fully automated pipeline that deploys a FastAPI app to EKS, all without embedding long-lived AWS credentials in GitHub. By pairing OIDC with carefully scoped IAM policies, you maintain strong security practices while enjoying a streamlined deployment process.
