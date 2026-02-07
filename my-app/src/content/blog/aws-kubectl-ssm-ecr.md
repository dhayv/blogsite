---
title: "Managing Kubernetes in a Private AWS VPC: A Secure and Automated Approach"
date: "12-17-2024"
author: "David Hyppolite"
excerpt: "Good architecture isn't about using the latest tech - it's about solving real problems."
tags: ['aws', 'kubernetes', 'eks', 'terraform', 'ssm', 'vpc', 'iam', 'docker']
---
In this guide, I demonstrate how to deploy a **production-grade Amazon EKS cluster** within a **private AWS VPC** using **Terraform** and **AWS Systems Manager (SSM)**. This approach enhances security by eliminating the need for SSH keys and bastion hosts, showcasing expertise in **infrastructure as code**, **cloud security**, and **Kubernetes orchestration**.

### What You'll Learn

- **Deploy a production-grade EKS cluster** in a private VPC
- **Implement secure access** using AWS Systems Manager
- **Automate infrastructure** with Terraform
- **Configure networking and security** best practices
- **Deploy a sample FastAPI application**

### Table of Contents

- [Prerequisites](#prerequisites)
- [Introduction](#introduction)
  - [Why This Approach?](#why-this-approach)
  - [Critical Access Configuration](#critical-access-configuration)
- [Infrastructure Setup and Configuration](#infrastructure-setup-and-configuration)
  - [Step 1: GitHub Repository](#step-1-github-repository)
  - [Step 2: IAM Role Configuration](#step-2-iam-role-configuration)
  - [Step 3: Create ECR Repository](#step-3-create-ecr-repository)
  - [Step 4: Infrastructure Deployment](#step-4-infrastructure-deployment)
- [Deployment and Access Configuration](#deployment-and-access-configuration)
  - [Step 6: Creating the EC2 Instance](#step-6-creating-the-ec2-instance-for-cluster-access)
  - [Kubernetes Manifests and Deployment](#kubernetes-manifests-and-deployment)
- [Resource Cleanup](#resource-cleanup)
- [Optional: Implement CI/CD with GitHub Actions](#optional-implement-cicd-with-github-actions)

### Technologies & Skills

- **AWS EKS**
- **AWS Systems Manager (SSM)**
- **Terraform**
- **FastAPI**
- **Amazon ECR**
- **Infrastructure as Code (IaC)**
- **Cloud Security**
- **Kubernetes Orchestration**

## Prerequisites

- Basic understanding of AWS networking concepts (VPCs, subnets, routing)
- AWS Account with appropriate permissions
- AWS CLI installed and configured
- kubectl installed
- Terraform installed
- Docker installed

## **Introduction**

Deploying an **EKS cluster in a private VPC** ensures that your Kubernetes API server is not exposed to the public internet, enhancing security. However, this setup introduces challenges in managing access and automating infrastructure provisioning. By leveraging **Terraform** and **AWS SSM**, you can automate the entire deployment process, manage IAM roles effectively, and securely access your cluster without exposing it publicly.

### Why This Approach?

- **Enhanced Security:** Deploy EKS clusters in private subnets without exposing SSH ports
- **Simplified Access:** Use IAM roles instead of managing SSH keys
- **Cost Effective:** Eliminate the need for dedicated bastion hosts
- **Automation Ready:** Infrastructure as Code with Terraform
- **Production Grade:** Suitable for enterprise environments

### Critical Access Configuration

**Important:** Two key points about access management:

1. The IAM role `EC2RoleForSSM_EKS` (or similar) must exist and have the necessary permissions for both SSM and EKS interactions. Without this, you will be unable to access the cluster from within the private VPC.
2. When an EKS cluster is created, only the user/role that creates the cluster (e.g., Terraform) automatically receives `system:master` permissions. All other users or roles requiring cluster access must be explicitly added to the cluster's RBAC configuration.

Missing either of these configurations will prevent access to resources in the private VPC, whether through SSM or via the CLI.

### Why FastAPI?

I used **FastAPI** for the sample application due to its excellent container support and built-in Swagger documentation. While the focus is on the infrastructure setup, FastAPI provides a lightweight, production-ready application perfect for Kubernetes deployments.

### **Architecture Overview**

*Figure: Overview of the EKS deployment architecture, highlighting private VPC, EKS cluster, SSM endpoints, IAM roles, and load balancer setup.*

### Key Takeaways

- **Mastered deploying EKS in a secure, private environment**
- **Implemented infrastructure automation with Terraform**
- **Enhanced security using AWS Systems Manager (SSM)**
- **Demonstrated proficiency in Kubernetes and cloud networking**

## Infrastructure Setup and Configuration

### Step 1: GitHub Repository

Start by organizing your project repository to manage your FastAPI application, Terraform configurations, and deployment scripts.

You can use your own repository or follow along with mine:

Fork this repository: [Github](https://github.com/dhayv/aws-kubernetes-deploy)

Repo Contains:

```bash

Repository Structure:
├── main.py        # FastApi application
├── Dockerfile        # Docker
├── terraform/         # terraform module
├── fastapi-deploy.yaml           # service scripts
├── fastapi-service.yaml           # service scripts
└── requirements.txt
```

### Step 2: IAM Role Configuration

First, we'll create the necessary IAM role for Systems Manager access:

In the AWS console search up **Roles** > **Create role**

**Trusted Entity:** EC2 > EC2 use case.

Click **Next**

**Add Permissions:**

- AmazonSSMManagedInstanceCore
- AmazonEKSWorkerNodePolicy
- AmazonEKSServicePolicy
- AmazonEKSClusterPolicy

Click **Next**

Provide a name for the role.

- EC2RoleForSSM_EKS  

Review your settings then click **Create role**.

### Step 3: Create ECR repository

To store container image for the FastAPI application, we'll be using Amazon Elastic Container Registry(ECR). While the infrastructure for VPC and EKS will be automated with Terraform, we'll create the ECR repository manually via the AWS console.

In the AWS Console search **ECR** > **Create**

![create-ecr](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/kf1lq25fuzmjafwz8y80.png)

1. Set the repository name: fastapi-app
2. Leave the default settings
3. click **Create**

**View Repository Commands:**

- After creation select the repo

- Click **View push commands** to get the commands to build and push your Docker image to ECR. Follow the commands.

- > Note: These command are what you use to build and push your local Docker image to your ECR container to hold.

> The ECR repo stores the Docker image, which will later be pulled by the EKS cluster during deployment.

Once your image is pushed let's move on to setting up our VPC and EKS using Terraform.

### Step 4: Infrastructure Deployment

Automate the creation of a private VPC, EKS cluster, and node groups using Terraform.

The Terraform configuration creates three key modules:

- **VPC Module:** Provisions a private VPC with public and private subnets.
- **Security Group Module:** Configures security groups for ALB and EKS communication.
- **EKS Module:** Deploys the EKS cluster and worker nodes in private subnets.

Below are snippets for the complete Terraform configuration. The full code can be found in the GitHub repository: [Repo](https://github.com/dhayv/aws-kubernetes-deploy/tree/main/terraform/modules)

#### Set up the VPC

First, we'll set up our VPC with public and private subnets. The public subnets will host our NAT Gateway, while private subnets will contain our EKS nodes.

**Terraform Configuration:**

```bash
data "aws_availability_zones" "available" {
  state = "available"
}

# Create vpc 
resource "aws_vpc" "main" {
    cidr_block = var.vpc_cidr
    enable_dns_support = true
    enable_dns_hostnames = true

    tags = {
      Name = "${var.project_name}-vpc"
    }
  
}

# Create public subnets
resource "aws_subnet" "public" {
  count = length(var.azs)      
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.${count.index + 1}.0/24"
  availability_zone = var.azs[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-${count.index + 1}"
  }
}

# internet gateway for public subnets
resource "aws_internet_gateway" "main" {
    vpc_id = aws_vpc.main.id
    
    tags = {
        Name = "${var.project_name}-igw"}
}

# route table for public subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-public-rt"}
}

# 
resource "aws_route_table_association" "public" {
  count = length(var.azs)  
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}
```

#### Private subnets

```bash

# create private subnets
resource "aws_subnet" "private" {
  count = length(var.azs)      
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.${count.index + 10}.0/24"
  availability_zone = var.azs[count.index]

  tags = {
    Name = "${var.project_name}-private-${count.index + 1}"
  }
}

resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name = "${var.project_name}-nat-eip"
    }
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id = aws_subnet.public[0].id

  tags = {
    Name = "${var.project_name}-ngw"
    }

    depends_on = [ aws_internet_gateway.main ]
}

# route table for private subnets
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-private-rt"}
}

resource "aws_route_table_association" "private" {
  count = length(var.azs)  
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

```

> Note: The NAT Gateway and Internet Gateway ensure proper routing between private subnets and external services.

#### Security Group Configuration

These security groups control access to our EKS cluster and load balancer:

**ALB Security Group:**

- Allows inbound traffic on port 80 from the internet.
- Permits unrestricted outbound traffic.

**EKS Security Group:**

- Allows inbound traffic from the ALB for internal communication.

**Terraform Configuration:**

```bash

# ALB Security group
resource "aws_security_group" "alb" {
  name = "${var.project_name}-alb-sg"
  vpc_id = var.vpc_id

  tags = {
    Name = "${var.project_name}-eks-alb"
  }
}

# EKS Secuirty group
resource "aws_security_group" "eks" {
  name = "${var.project_name}-eks-sg"
  vpc_id = var.vpc_id

  tags = {
    Name = "${var.project_name}-eks-sg"
  }
}

# Allow ALB to communicate with EKS

resource "aws_security_group_rule" "allow_alb" {
  type = "ingress"
  security_group_id = aws_security_group.eks.id
  source_security_group_id = aws_security_group.alb.id
  from_port         = 80
  protocol       = "tcp"
  to_port           = 80
  
}

# Allow EKS to outbound traffic
resource "aws_security_group_rule" "allow_eks_egress" {
  type = "egress"
  security_group_id = aws_security_group.eks.id
  from_port         = 0
  protocol       = "-1"
  to_port           = 0
  cidr_blocks = [ "0.0.0.0/0" ]
}
```

> Tip: Always define strict ingress and egress rules to maintain security.

#### EKS Cluster Configuration

The EKS cluster is deployed in private subnets, and the ALB will forward traffic to the worker nodes. We let AWS manage the security up for cluster and node group creation this reduces the need for manual intervention.

**Terraform Configuration:**

```bash
# Create the EKS Cluster
resource "aws_eks_cluster" "main" {
  name     = "fastAPI-cluster"
  role_arn = aws_iam_role.cluster.arn
  version  = "1.31"

  vpc_config {
    endpoint_private_access = true
    endpoint_public_access  = false
    subnet_ids              = var.private_subnet_ids
  }

  depends_on = [
    aws_iam_role_policy_attachment.cluster_AmazonEKSClusterPolicy,
  ]
}

# Create EKS Node Group
resource "aws_eks_node_group" "main_node" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "fastAPI-node"
  node_role_arn   = aws_iam_role.node_group.arn
  subnet_ids      = var.private_subnet_ids

  scaling_config {
    desired_size = 3
    max_size     = 6
    min_size     = 3
  }

  remote_access {
    source_security_group_ids = [ var.eks_sg_id ]
  }

  instance_types = [ "t2.micro" ]

  depends_on = [
    aws_iam_role_policy_attachment.node_AmazonEKSWorkerNodePolicy,
    aws_iam_role_policy_attachment.node_AmazonEKS_CNI_Policy,
aws_iam_role_policy_attachment.node_AmazonEC2ContainerRegistryReadOnly,
  ]
```

#### EKS Access Entries and Policy Associations

```bash
  data "aws_iam_role" "console_role" {
  name = "EC2RoleForSSM_EKS" # Replace for with your roles name
}
  
  # Map IAM Role to Kubernetes Group using EKS Access Entry
  resource "aws_eks_access_entry" "additional_access" {
  cluster_name      = aws_eks_cluster.main.name
  principal_arn     = data.aws_iam_role.console_role.arn
  kubernetes_groups = ["eks:admin"] 
  type              = "STANDARD"
}

# # Associate Access Policy with Access Entry
resource "aws_eks_access_policy_association" "AdminPolicy" {
  cluster_name  = aws_eks_cluster.main.name
  policy_arn    = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSAdminPolicy"
  principal_arn = data.aws_iam_role.console_role.arn

  access_scope {
    type       = "cluster"
  }
}

}
```

> **In the EKS access control replace your name with your create role name**

#### Applying Terraform Configuration

Run the following commands to deploy your infrastructure:

```bash

terraform init

terraform validate

terraform plan

terraform apply -auto-approve
```

## Deployment and Access Configuration

> ⚠️ **Prerequisites Check:** Before proceeding, verify that the IAM role 'EC2RoleForSSM_EKS' or similar exists and has the correct permissions for both SSM and EKS. Remember that only the cluster creator has default access - all other users/roles need explicit RBAC configuration. Missing these steps will prevent cluster access.

### Step 6. Creating the EC2 Instance for Cluster Access

We'll create an EC2 instance in our private subnet that will serve as our secure access point to the EKS cluster.

In the AWS console search up **EC2** > **launch Instance**

### Launch EC2 Instance

**Name:** Give a unique name
**AMI:** Amazon Linux 2023
**Instance Type:** t2.micro
**Key pair (login):** Proceed without a key pair.
**Network settings:** Click edit

- **VPC:** Select your custom vpc managed by terraform
- **Subnet:** Select your private subnet managed by terraform
- **Auto-assign public IP:** disabled
- **Firewall (security groups):** Create security group(make a note of name)

> Remove all inbound rules to ensure the instance is accessible only via SSM.

![network-details](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/kk9d8kyn9w99c8asah0w.png)

Under Advanced details:

**IAM instance profile:** EC2RoleForSSM_EKS

#### User Data Script

Include this script in the EC2 instance user data:

```bash

#!/bin/bash

yum -y upgrade
yum -y update 

# install kubectl to interact with the private EKS cluster.
curl -O https://s3.us-west-2.amazonaws.com/amazon-eks/1.31.2/2024-11-15/bin/linux/amd64/kubectl

chmod +x ./kubectl

sudo mv ./kubectl /usr/local/bin/kubectl

```

Click **Launch instance**

Select your new instance.

Select the Security tab.

![security-tab](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/cwgeqm794geo4bfp8dh7.png)

Make a Note of the Security Group ID

##### Allow EC2 access to control plane security group

In the AWS  console search **VPC** > **Security Groups**

![vpc-sg-aws](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/2fbym9tizbsz7ss7y2v8.png)

Search and **select** the control plane security group "eks-cluster-sg-fastAPI-cluster-XXXXXX".

> look for a description "EKS created security group applied to ENI that is attached to EKS Control Plane master nodes, as well as any managed workloads."

Click **Edit inbound rules**

![inbound-rules](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/p44tvfwp7cq6i0jlz5h8.png)

**Add a new rule:**

- **Type:** HTTPS
- **Protocol:** TCP
- **Port Range:** 443
- **Source:** Select "Custom" and enter the Security Group ID of your EC2 instance (e.g., sg-xxxxxx).

Click **Save rules** to apply the changes.

#### Connecting via Systems Manager

In the AWS Console Search "Systems Manager"

![session-manager-aws](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ps84ua9lfeuvnskdknwd.png)

Under **Node Tools** Click **Session Manager** > **Start Session**

Select the Instance you created.

![Session Manager instance selection screen in the AWS console](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/7vol7ian6gg9d3o9w8m7.png)

Click Start session.

```bash
sudo su
```

To gain root access

Verify Kubectl is installed:

```bash

kubectl version --client
```

- Configure kubectl to connect to the EKS cluster:

```bash
aws eks --region <region> update-kubeconfig --name <cluster-name>

```

I used:

```bash
aws eks --region us-east-1 update-kubeconfig --name fastAPI-cluster
```

## Kubernetes Manifests and Deployment

### Understanding the Manifests

Our application deployment requires two Kubernetes manifests:

- A Deployment manifest to manage our FastAPI application pods
- A Service manifest to expose our application through a load balancer

## Deployment Manifest

The Deployment manifest (`fastapi-deploy.yaml`) defines how our application should run:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fastapi-deployment
  labels:
    app: fastapi
spec:
  replicas: 3
  selector:
    matchLabels:
      app: fastapi
  template:
    metadata:
      labels:
        app: fastapi
    spec:
      containers:
      - name: fastapi
        image: ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/fastapi-app:latest
        ports:
        - containerPort: 80
```

Key components:

- `replicas: 3`: Maintains three running instances of our application
- `app: fastapi`: Label used to identify our application pods
- `image`: References our container in ECR (replace with your ECR URI)

Example ECR URI format:

```bash
123456789012.dkr.ecr.us-east-1.amazonaws.com/fastapi-app:latest
```

## Service Manifest

The Service manifest (`fastapi-service.yaml`) configures how to access our application:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: fastapi-service
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-internal: "true"
spec:
  type: LoadBalancer
  selector:
    app: fastapi
  ports:
    - port: 80
      targetPort: 80
      protocol: TCP
```

Key components:

- `aws-load-balancer-internal: "true"`: Creates an internal load balancer
- `type: LoadBalancer`: Provisions an AWS Load Balancer
- `selector: app: fastapi`: Connects to pods with matching labels

### Deploying the Manifests

#### 1. Create the deployment file

```bash
nano fastapi-deploy.yaml
```

Paste the deployment manifest content.

#### 2. Create the service file

```bash
nano fastapi-service.yaml
```

Paste the service manifest content.

#### 3. Apply the manifests

```bash
kubectl apply -f fastapi-deploy.yaml
kubectl apply -f fastapi-service.yaml
```

#### 4. Verify the deployment

```bash
# Check pods status
kubectl get pods

# Check service and load balancer
kubectl get services
```

Expected outputs:

```bash
# Pods output
NAME                                  READY   STATUS    RESTARTS   
fastapi-deployment-xxxxxxxxxx-xxxx   1/1     Running   0          
fastapi-deployment-xxxxxxxxxx-xxxx   1/1     Running   0          
fastapi-deployment-xxxxxxxxxx-xxxx   1/1     Running   0          

# Services output
NAME              TYPE           CLUSTER-IP      EXTERNAL-IP                                    
fastapi-service   LoadBalancer   XXX.XXX.XXX.XX   internal-xxxxx.us-east-1.elb.amazonaws.com   
```

## Troubleshooting Tips

- If pods aren't starting, check the logs: `kubectl logs <pod-name>`
- For service issues: `kubectl describe service fastapi-service`
- To verify ECR access: `kubectl describe pod <pod-name>`

![ssm-commands](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/r3alxizpse4qgy5i2byq.png)

Access the application using the IP

![docker-container](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/xrduk2wrprdba6d8fhgq.png)

### Resource Cleanup

**Clean Kubernetes Resources:**

```bash
kubectl delete --all deployments
kubectl delete --all services
kubectl delete --all pods
```

**AWS Console Cleanup:**

1. Remove EC2 inbound rule from Kubernetes control plane security group
2. Terminate EC2 instance
3. Delete ECR repository if no longer needed

**Infrastructure Cleanup:**

```bash
terraform destroy -auto-approve
```

> If you run into terraform resources not being deleted. Delete through console.

### 📝 Conclusion

Deploying an EKS cluster within a private VPC enhances security by restricting API access. By leveraging Terraform and AWS Systems Manager, you can automate the provisioning process, manage IAM roles effectively, and securely access your cluster without exposing it to the public internet. This approach not only simplifies infrastructure management but also adheres to best practices for security and scalability in cloud environments.

**Best Practices Implemented:**

- Private VPC deployment for enhanced security
- IAM role-based access control
- Systems Manager for secure instance access
- Infrastructure as Code for consistency
- Containerized application deployment

### 🟢(Optional) Implement CI/CD with GitHub Actions

To further streamline your deployment process, integrating a CI/CD pipeline can automate the building and deployment of your FastAPI application. While this blog focuses on setting up the EKS cluster and deploying the application manually, you can enhance your workflow by implementing CI/CD using GitHub Actions.

#### **Basic CI/CD Workflow Overview**

1. **Code Commit**: Push your FastAPI application code to GitHub.
2. **Build**: GitHub Actions triggers a workflow to build your Docker image.
3. **Push to ECR**: The built image is pushed to Amazon ECR.
4. **Optional:** Have Terraform manage infrastructre.
5. **Deploy**: The updated image is deployed to your EKS cluster.

To further tighten security in workflows it is best practice to implement the use AWS OIDC with Github Actions creating a dedicated role for your entire workflow.
