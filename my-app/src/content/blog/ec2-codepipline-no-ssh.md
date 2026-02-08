---
title: "Deploy to EC2 With AWS CodePipeline, CodeBuild, and CodeDeploy"
date: "12-30-2024"
author: "David Hyppolite"
excerpt: "Build an automated CI/CD pipeline to deploy to EC2 using AWS CodePipeline, CodeBuild, and CodeDeploy. Eliminate manual SSH with this step-by-step guide."
tags: ['aws', 'codepipeline', 'cicd', 'ec2', 'iam']
---
Set up a fully automated CI/CD pipeline using AWS CodePipeline, CodeBuild, CodeDeploy, EC2, and GitHub. This guide will help you create a zero-touch solution that automates code updates, ensures reliable deployments, and eliminates the need for manual SSH sessions. By the end, you'll have a robust and efficient deployment process that enhances both reliability and speed.

![cloud architecture](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/3zehpnu7t8spv7gs7iny.png)

Technologies Used:

1. **GitHub:** Stores the application’s source code.
2. **AWS CodePipeline:** Detects changes in the repository, triggers builds, and initiates deployments.
3. **AWS CodeBuild:** Builds your code into production-ready artifacts.
4. **AWS CodeDeploy:** Automates the deployment of your builds onto EC2 instances.
5. **Amazon EC2:** Hosts your web application.
6. **Amazon S3 (Optional):** Stores build artifacts
7. **IAM:** Manages secure permissions for the pipeline and services to interact.

## Why Use CodePipeline Instead of Manual EC2 Deployments

### Key Benefits of Automated EC2 Deployment

- **Improved Reliability:** No more manual SSH deployments. CodeDeploy ensures consistency in every deployment.
- **Faster Iteration:** Push code and let the pipeline test and deploy automatically, speeding up feedback loops.
- **Rollback Capability:** If something goes wrong, CodeDeploy can roll back to a previous stable version quickly, minimizing downtime.

### The Problem With SSH-Based EC2 Deployments

Your team currently deploys updates by SSHing into a live EC2 instance—leading to human error, missed steps, and risky rollbacks. This tutorial fixes that by detecting GitHub changes automatically, deploying them via CodeDeploy, and using a repeatable, testable process.

### Issues CodeDeploy Eliminates

Traditional SSH-based deployments lead to:

- Human errors during manual deployments
- Inconsistent deployment steps
- Difficult rollbacks
- Security vulnerabilities

This solution implements industry best practices for automated, secure, and reliable deployments.

Ready to eliminate manual deployments? Let's build your pipeline.

## Step-by-Step: Build an EC2 CI/CD Pipeline on AWS

### Step 1: Set Up the GitHub Repository

You can use your own repo or follow along with mine:

Fork this repository:

Github Repo: [Github EC2](https://github.com/dhayv/ec2-deploy)

Repo Contains:

```bash

Repository Structure:
├── my-react-app/        # Sample React application
├── buildspec.yml        # CodeBuild instructions
├── appspec.yml         # CodeDeploy configuration
└── scripts/           # Deployment scripts
```

### Step 2: Create IAM Roles for EC2 and CodeDeploy

> **Important:** If you attach a new role to an existing EC2 instance, reboot the instance so it recognizes the updated permissions.

#### Create the EC2 Instance IAM Role

In the AWS Console search **Roles** -> **Create role**.

**Trusted Entity:** EC2 > EC2 use case.

![trusted-entity](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/fx3h3xk6epg4ed7drlsd.png)

Click **Next**

**Add Permissions:** Attach the AmazonEC2RoleforAWSCodeDeploy policy.

Click **Next**

Provide a name for the role.

- EC2CodeDeployRole

Review your settings then click "Create role".

#### Create the AWS CodeDeploy Service Role

Click **Create role**.

**Trusted Entity:** EC2 > EC2 use case.

Click **Next**

**Add Permissions:** Attach AWSCodeDeployRole.

Click **Next**

Provide a name for the role.

- CodeDeployRole

Review your settings then click "Create role".

Edit the trusted policy using:

Search for the newly created **CodeDeployRole** and select.

Choose the **Trust relationships** tab.

Choose **Edit trust policy**.

Copy and paste this trust policy.

```bash
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "",
            "Effect": "Allow",
            "Principal": {
                "Service": [
                    "codedeploy.amazonaws.com"
                ]
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
```

Click "Update policy".

### Step 3: Launch and Configure the EC2 Instance

In the AWS console search up **EC2** > **Launch Instance.**

#### Launch an EC2 Instance With CodeDeploy Agent

Keep default settings.

![base-image](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/o55sqrhlyq14w0prvhuc.png)

**Name and tags:** Name your instance.
**Application and OS Images:** Ubuntu
**Instance type:** t2.micro
**Key pair (login)**: Create or use an existing key pair.

![network-settings](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/5wgb0ny4fg49nqpdr8kq.png)

**Network settings:** Use or create a security group allowing SSH (port 22) from your IP and HTTP (port 80) from the internet..

Under **Advanced details**

**IAM instance profile:** EC2CodeDeployRole

User data: Install the CodeDeploy agent on launch. Adjust region endpoints if you’re not using us-east-1:

Use this [link](https://docs.aws.amazon.com/codedeploy/latest/userguide/resource-kit.html#resource-kit-bucket-names) to get your region to fetch your appropriate code-deploy region identifier

Edit this line in the script  "aws-codedeploy-us-east-1.s3.us-east-1." with your appropriate region and identifier.

![User data](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/9sexqsp88zsl7x67fzyy.png)

Copy and paste the code below.

```bash
#!/bin/bash

# Update system
apt update -y

# Install CodeDeploy Agent
apt install ruby-full -y
cd /home/ubuntu
wget https://aws-codedeploy-us-east-1.s3.us-east-1.amazonaws.com/latest/install
chmod +x ./install
./install auto

systemctl enable codedeploy-agent
systemctl start codedeploy-agent
```

Click **Launch Instance** and wait until it’s initialized..

#### Attach the IAM Role to the EC2 Instance

We will be attaching an IAM role to an instance to allow CodeDeploy to pull/put artifact onto the instance.

### Step 4: Create an AWS CodeDeploy Application

We are setting up CodeDeploy first because it makes it easier to use and reference for later in the CodePipeline Section.

In the AWS search and select **CodeDeploy** > **Create Application**.

![deployment-name](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/9aqmo5pntewaahtha0z9.png)

- **Application name:** vite-react-deploy
- **Compute platform** EC2/on-premise

Click **Create application**.

![deployment-group](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/013gqzipin0nliruzevn.png)

Click **Create deployment group**

#### Create a CodeDeploy Deployment Group for EC2

![CodeDeploy deployment group creation form with group name and service role fields](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/7tr2q3qqmwan6610vcew.png)

Deployment group name: vite-react-group
Service role: CodeDeployRole (Select the service role we created earlier)

Deployment type: In-place

![Environment-config](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/poxr1brkq403klei85r1.png)

Select "Amazon Instances".
Key: Name
Value: Select your Instance

Leave the default settings for Agent configuration with AWS Systems Manager and Deployment settings.

##### Disable Load Balancer for Single-Instance Deploy

**Enable load balancing:** Uncheck selection

Click **Create deployment group**

Review changes than Click **Create deployment**

> Now on the creating a deployment page we can leave this section empty(exit page) and just move on to the next section because CodePipeline will handle the deployment for.

#### Understanding the AppSpec.yml for CodeDeploy

```yaml
version: 0.0
os: linux
files:
  - source: /my-react-app/dist
    destination: /var/www/html/
hooks:
  BeforeInstall:
    - location: scripts/before_install.sh
      timeout: 300
      runas: root
  AfterInstall:
    - location: scripts/after_install.sh
      timeout: 300
      runas: root
  ApplicationStart:
    - location: scripts/start_application.sh
      timeout: 300
      runas: root
```

##### AppSpec Hooks and File Mapping Explained

- `source: /my-react-app/dist` is where CodeBuild places the compiled files.
- `destination: /var/www/html/` is where Nginx serves static files.
- `hooks:` are scripts you define to run before/after install and on app start.

### Step 5: Create an AWS CodePipeline With CodeBuild and CodeDeploy

In the AWS console search **CodePipeline** > **Create Pipeline**

![pipeline-step1](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/8l6q2php3r18btk9cf0a.png)

This option allows us to build a custom pipeline to deploy from GitHub.

Click **Next**.

![pipeline-settings](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/9d5u7991pld2d7kmbeff.png)

- **Name the Pipeline:** Choose a meaningful name.
- **Service Role:** Select New service role to allow AWS to create a role automatically.

![pipeline-step2.2](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/exnw2d023p8ppo614088.png)

- **Advanced settings:** Use the default location to allow AWS to create an S3 bucket for CodePipeline artifacts, which will maintain deployment history.

#### Configure the GitHub Source Stage

![CodePipeline source stage configuration with GitHub connection settings](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/yjvh8uarv6zwwg2chmh2.png)

I have previously connected to GitHub so I will be using that connection.

**For New Connections:**

Click **Connect to GitHub**.

![github-app-connection](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/xjs59qnrzck9wu4esa8h.png)

Name your connection and click **Connect to Github**.

![aws-connector](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/0wejg7zcchncuj8uqaj4.png)

Click **Authorize AWS Connector for Github** to grant AWS access to your GitHub repository.

![basic-connect](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/1q4k4u5qkt8kmz1tfwyh.png)

- A basic GitHub user connection suffices for our deployment pipeline.
- If working with multiple organizations, select the specific user or organization repositories you want to use.
- Click **Connect**.

#### GitHub Source Stage Settings

- **Source Provider:** GitHub (via GitHub App)
- **Connection:** Your GitHub connection
- **Repository Name:** Select your repository
- **Default Branch:** main
- **Output Artifact Format:** Default settings
- **Webhook Events:** Trigger the pipeline on push and pull request events.
- Click **Next**.

#### Set Up the CodeBuild Build Stage

Here is where we will be the vite app using the buildspec.yml. so we will be creating a CodeBuild project to reference our file in the repo.

Click **Create project**

![buildstage](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/7lrc3x5puwh93c3ofpbf.png)
![build-stage2](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/7p3jwt85d90h73x0kxzq.png)

Keep the default settings.

Name your project.

A new service role will be create for us through AWS.

##### Understanding the Buildspec.yml for CodeBuild

![build-spec](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/i0wvrr9cxat0o0xbtt8u.png)

**Build specifications:** Use a buildspec file

Here is where your buildspec.yml in the repo will be referenced.

```yaml
version: 0.2

phases:
  install:
    runtime-versions:
      nodejs: 20
    commands:
        - cd ./my-react-app
        - npm install
       
  build:
    commands:
        - npm run build
     
artifacts:
  files:
    - 'my-react-app/dist/**/*'
    - 'appspec.yml'
    - 'scripts/**/*'
  discard-paths: no
```

(This builds your Vite app and includes the dist, appspec.yml, and scripts folder in the output artifacts.)

###### BuildSpec Commands and Artifacts Explained

- `cd ./my-react-app` will move to the react app folder
- `npm install` will install all our node dependencies
- `npm build` will build our production static vite app into the dist folder
- The `'./my-react-app/dist'` line is to ensure all files in the build output are copied.
- `'**/*'` will include all build files in the root folder
- The `appspec.yml` and `scripts/**/*` are explicitly listed to ensure they're included

![codebuild-logs](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/t9oz7vyr7lf6fkqar5i9.png)

Click **Continue to CodePipeline**

**Build provider:** Other build providers (AWS CodeBuild)
**Build Type**: Single Type
**Region:** Select your Region
**Input artifacts:** Keep defaults

Click **Next**

#### Configure the CodeDeploy Deploy Stage

Here is how we will deploy to our EC2 instance. We will be using the CodeDeploy application we created earlier.

![deploy-build](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/6mxpao11uxy8g4paevyl.png)

**Deploy provider:** CodeDeploy
**Region:** Select your region
**Input artifacts:** Keep defaults
**Application name:** vite-react-deploy
**Deployment group:** vite-react-group

Click **Next**

Review your settings than click "Create pipeline"

Your Pipeline will now run an each stage we worked on will get built.

Now head on over to your instance an get the public address our site should now be deployed on the EC2 Instance.

![deployed-site](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/psfwku0j3r3s43broct4.png)

## Summary: Automated EC2 Deployment With AWS CI/CD Services

By following these steps, you’ve implemented a fully automated CI/CD pipeline using CodePipeline as the orchestrator an AWS Codebuild and CodeDeploy, EC2, and GitHub. This setup transforms your deployment process from fragile and manual to consistent, secure, and fast. You’ve minimized human error, introduced a clear rollback mechanism, and set the stage for more advanced enhancements—like adding integration tests, canary deployments, or blue/green strategies.

This is a crucial step toward embracing modern DevOps practices and ensures any team can deliver value to users with speed and confidence.
