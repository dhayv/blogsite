---
title: "Build a Secure CI/CD Pipeline for Amazon EKS Using GitHub Actions and AWS OIDC"
date: "1-29-2025"
author:  
excerpt: "Learn how to build a secure CI/CD pipeline for Amazon EKS using GitHub Actions, AWS OIDC, and ECR. Deploy FastAPI seamlessly with Kubernetes"
---
In this guide, I’ll show you how to build a secure **AWS EKS(Kubernetes)** CI/CD pipeline for your FastAPI app complete with **GitHub Actions**, **Docker**, and **OpenID Connect (OIDC)** all while following AWS security best practices like least-privilege IAM policies. We won’t obsess over every detail of FastAPI or Docker, but we’ll cover enough to get your application running on EKS with confidence.

> Note: The primary focus of this blog is on CI/CD processes and AWS configuration, so we won’t dive too deeply into FastAPI or Docker fundamentals.

### Table of Contents

- [Prerequisites](#prerequisites)
- [Step 1: GitHub Repository](#step-1-github-repository)
- [Step 2: Create an Amazon ECR Repository](#step-2-create-an-amazon-ecr-repository)
- [Step 3: Create an Amazon EKS Cluster with Eksctl](#step-3-create-an-amazon-eks-cluster-with-eksctl)
- [Step 4: Set Up a GitHub Actions Workflow for EKS Deployment](#step-4-set-up-a-github-actions-workflow-for-eks-deployment)
- [Step 5: Github Actions Workflow](#step-5-github-actions-workflow)
- [Clean Up Resources](#clean-up-resources)
- [Conclusion](#conclusion)

### Technologies & Skills

- **AWS EKS** (Kubernetes on AWS)
- **FastAPI**
- **Amazon ECR**
- **Cloud Security & IAM**
- **Kubernetes Orchestration**

## Prerequisites

- **AWS Account:** Admin permissions for creating EKS clusters, IAM roles, and ECR repositories.
- AWS CLI installed and configured: [Install Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- eksctl installed: [Installation Guide](https://eksctl.io/installation/)
- Docker installed: [Get Started with Docker](https://www.docker.com/get-started/)

## **Introduction**

Managing Kubernetes on AWS via EKS is a great approach, but configuring secure access for CI/CD can be tricky. With OIDC, GitHub Actions can assume roles in AWS without storing secret keys, so no static credentials, Let’s walk through setting up an EKS cluster, creating an ECR repo, and configuring GitHub Actions to deploy our FastAPI service to Kubernetes automatically.

This guide walks through:

1. Setting up an EKS cluster with eksctl
2. Creating an ECR repository for your Docker images
3. Configuring OIDC so GitHub Actions can assume an IAM role
4. Deploying the FastAPI application to EKS

### Key Takeaways

- **Security-First CI/CD:** By using OIDC, there’s no need to embed AWS credentials in GitHub.
- **Least-Privilege Access:** You’ll attach minimal IAM permissions, restricted to your ECR repo or EKS cluster.
- **Easy Automation:**  GitHub Actions automatically builds, pushes, and deploys whenever you push code to your main branch.

## Step-by-Step Guide

### Step 1: GitHub Repository

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

### Step 2: Create an Amazon ECR Repository

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

### Step 3: Create an Amazon EKS Cluster with Eksctl

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

### Step 4: Set Up a GitHub Actions Workflow for EKS Deployment

To avoid storing permanent AWS credentials in GitHub, we’ll configure OpenID Connect (OIDC) so GitHub Actions can assume roles in AWS. [Guthub Action in AWS](https://aws.amazon.com/blogs/security/use-iam-roles-to-connect-github-actions-to-actions-in-aws/)

If you have previously created a Identity provider for GitHub skip this step if not create one:

#### Add a New OIDC Provider

Go to the **AWS Console** > **IAM** > **Identity Providers** > **Add provider**.

- **Provider type:** OpenID Connect
- **Provider Url:** https://token.actions.githubusercontent.com
- **Audience:** sts.amazonaws.com

Next **Add provider**.

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/zxkmr82acbcr2ki9b5ki.png)

#### Assign a role

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

![c](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/pkdtmj1nzl53lyv3c5p0.png)

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

### Step 5: Github actions Workflow

Finally, set up your GitHub Actions workflow to build, push, and deploy automatically.

In your GitHub repo, navigate to **Actions** > **New Workflow.**

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/q0e6zetc3bikd1cks4ma.png)

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ugjmze78ihzxgq4jzmmr.png)

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

#### Understanding Our GitHub Actions Workflow for AWS Deployment

Let's walk through our CI/CD pipeline that automates deploying applications to AWS using GitHub Actions. This workflow handles everything from building Docker images to deploying on EKS, all while maintaining security best practices.

##### Workflow Triggers and Permissions

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

##### Secure AWS Authentication

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

##### Container Image Management

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

##### EKS Deployment

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

##### Security Considerations

- All sensitive values are stored as GitHub secrets
- OIDC provides secure, temporary AWS credentials
- The workflow uses specific, versioned actions to prevent supply chain attacks
- Each step follows the principle of least privilege

Remember to replace the placeholder values (anything starting with $) with your specific information when setting up this workflow.n

### Github Secrets

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

#### Push Code and Access Cluster

You can monitor the progress of your CI/CD pipeline by visiting the “GitHub Actions” tab in your repository. Here, you’ll see the status of each step in your workflow.

Here is what a successful deployment looks like.

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/dxrxtszocq94c9w7fy6g.png)

IN the AWS console got to **EC2** > **Load balancer**

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/6y71j4d3elzagtibol31.png)

Copy the DNS name and go to port 80.

### Clean up resources

When you’re done, it’s best to delete unneeded resources to avoid costs:

```bash
eksctl delete cluster --name=fastapi-demo
```

Also, remove or delete the ECR repository if you no longer need it.

### Conclusion

Congratulations! You’ve created a fully automated pipeline that deploys a FastAPI app to EKS, all without embedding long-lived AWS credentials in GitHub. By pairing OIDC with carefully scoped IAM policies, you maintain strong security practices while enjoying a streamlined deployment process.
