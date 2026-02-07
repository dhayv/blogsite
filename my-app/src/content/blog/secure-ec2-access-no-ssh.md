---
title: "Secure EC2 Access Without SSH Using AWS Systems Manager"
date: "01-08-2025"
author: "David Hyppolite"
excerpt: "Learn how to eliminate the need for SSH keys and bastion hosts, enhance your security posture, and simplify instance management through IAM roles and robust logging mechanisms."
tags: ['aws', 'ec2', 'ssm', 'iam']
---
**Need to access your EC2 instances securely without managing SSH keys?** AWS Systems Manager (SSM) Session Manager provides a secure, auditable solution that might be exactly what you're looking for. Let's explore how it works.

While SSH is secure, managing SSH access at scale across multiple VPCs and regions creates significant operational complexity. Organizations often struggle with key management, rotation policies, and maintaining bastion hosts - all of which increase both security risks and operational overhead.

## The Challenge

Consider a common scenario: You're managing EC2 instances across multiple VPCs and regions, with strict security policies prohibiting open SSH ports. Traditional approaches might require maintaining multiple bastion hosts - even a single t2.micro bastion host running 24/7 adds unnecessary cost and complexity. SSM eliminates this overhead while providing secure, auditable access to your instances.

## Enter Systems Manager

AWS Systems Manager (SSM) Session Manager offers a compelling alternative, especially when working with cloud-native architectures. For teams using AWS-supported AMIs - including Amazon Linux 2023, Ubuntu, Windows Server, and many others - the SSM agent comes pre-installed, eliminating additional setup steps, making it a truly managed service that adds an extra layer of security without the complexity of key management.

## Benefits

When working with cloud-native technologies, teams frequently spin up instances to test services and scripts in private subnets. While traditional solutions might rely on bastion hosts or VPC endpoints, SSM provides direct access to these private instances through IAM roles - simplifying your architecture while maintaining strict security controls.

### Business Value

From a business perspective, SSM offers several key advantages:

- **Comprehensive Audit Capabilities:** Through session logging and integration with CloudWatch, every action is recorded for compliance and troubleshooting.
- **Session History Tracking:** Easily track who accessed which instance and when.
- **Flexible Log Storage:** Option to send session logs to Amazon S3 for long-term storage or stream them to CloudWatch Logs for real-time monitoring.
- **Enhanced Security:** Eliminates the need for open inbound ports, reducing the attack surface and leveraging IAM for access control.

## IAM Role

### IAM Instance Profile

An **IAM instance profile** is a container for an IAM role that you can assign to an EC2 instance. This allows the instance to securely interact with other AWS services without the need to manage credentials manually.

#### Creating an IAM Role for SSM Access

In the AWS console search up **Roles** > **Create role**

**Trusted Entity:** EC2 > EC2 use case.

Click **Next**

**Add Permissions:** Attach the **AmazonSSMManagedInstanceCore** policy to grant necessary permissions for SSM.

Click **Next**

Name the role.

- Provide a name for the role, such as **DemoEC2RoleForSSM**.  

Review your settings then click **Create role**.

### Create a EC2 instance

In the AWS console search up **EC2** > **launch Instance**

**Name:** Give a unique name
**AMI:** Amazon Linux 2023
**Instance Type:** t2.micro
**Key pair (login):** Proceed without a key pair.

![network-settings](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/w4c327x6yq1keog214hj.png)

#### Network settings

- **Auto-assign public IP:** Disable.
- **Firewall (security groups):** Create a new security group.
- **Allow SSH traffic from:** Uncheck to ensure SSH is not open.

##### For Custom VPC with Private Subnets

- **VPC:** Select your custom vpc
- **Subnet:** Choose your private subnet
- **Auto-assign public IP:** Disabled.
- **Firewall (security groups):** Remove the security group; SSM will handle access.

#### Advanced details

**IAM instance profile:** Select DemoEC2RoleForSSM.

Click **Launch instance** to create your EC2 instance.

## Access EC2 via SSM

In the AWS Console Search "Systems Manager"

![session-manager-aws](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ps84ua9lfeuvnskdknwd.png)

**Start a Session:**

- Under **Node Tools** Click on **Session Manager.**
- Click **Start Session**

![start-session-ssm](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ccnucy3kg7a304b69gu4.png)

Select your Instance click **Start Session.**

![Instance-session](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ufe3d2l9ntrmrg8yfomv.png)

You will now be logged into your EC2 instance without needing SSH.

![session-screen](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/nwdc4qmxm96bpkcozgvn.png)

> Terminal interface within Session Manager.

### Conclusion

By leveraging AWS Systems Manager Session Manager, you can achieve secure EC2 access without the hassles of SSH key management. This AWS Systems Manager tutorial demonstrates a streamlined, cost-effective approach to managing your EC2 instances across multiple VPCs and regions. Embrace this method to bypass SSH with AWS SSM, enhancing both your security posture and operational efficiency.
