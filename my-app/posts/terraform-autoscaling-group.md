---
title: "Building an Auto-Scaling AWS Infrastructure with Terraform"
date: "12-6-2024"
author: David Hyppolite
excerpt: "A detailed walkthrough of implementing and troubleshooting a production-ready auto-scaling infrastructure using Terraform and AWS services"
---

## Table of Contents

- [Project Overview](#project-overview)
  - [Real World Use Case](#real-world-use-case)
- [Creating an AWS Auto Scaling Architecture](#creating-an-aws-auto-scaling-architecture)
  - [VPC Module](#vpc-module)
  - [Launch Templates & Security Groups](#launch-templates-and-security-groups)
  - [Load Balancer & Auto Scaling Groups](#load-balancer-and-auto-scaling-groups)
  - [Monitoring & Alerts](#monitoring-and-alerts)
- [Implementation Challenges](#implementation-challenges)
  - [Resolving the 502 Bad Gateway](#resolving-the-502-bad-gateway)

## Project Overview

In this project, I designed and implemented a highly available/ fault-taolerant auto-scaling infrastructure using Terraform. The architecture spans three Availability Zones and includes both public and private subnets, demonstrating real-world security and scalability practices.

### Real World Use Case

1. Handling Traffic Spikes:
In real-world scenarios, websites often experience unpredictable traffic patterns due to marketing campaigns, product launches, or seasonal events. Autoscaling ensures that the infrastructure can handle sudden increases in traffic without compromising performance or user experience.

2. Cost Management:
By scaling resources up or down based on actual demand, companies can optimize their cloud spending. This dynamic allocation prevents over-provisioning during low-traffic periods and ensures that sufficient resources are available during high-demand times.

3. High Availability and Reliability:
Distributing the load across multiple instances enhances the reliability of the application. If one instance fails, others can seamlessly take over, minimizing downtime and ensuring continuous availability of the website.

4. Improved User Experience:
Maintaining optimal performance during traffic surges ensures that users have a smooth and responsive experience, which is critical for customer satisfaction and retention.

5. Scalability for Future Growth:
Implementing autoscaling lays the foundation for future growth. As the business expands and traffic increases, the infrastructure can effortlessly scale to meet new demands without requiring significant architectural changes.

## Creating an AWS Auto Scaling Architecture

### VPC Module

[Your VPC implementation details]

### Launch Templates and Security Groups

[Your launch template and security group details]

### Load Balancer and Auto Scaling Groups

[Your ALB and ASG implementation details]

### Monitoring and Alerts

[Your monitoring setup details]

## Implementation Challenges

### Resolving the 502 Bad Gateway

When attempting to access the Application Load Balancer's DNS name, I encountered a 502 Bad Gateway error, indicating a communication breakdown between the load balancer and the backend instances. This led me through a comprehensive troubleshooting process that demonstrates the complexity of debugging distributed systems.

#### Initial Investigation

After confirming that the EC2 instances were running in their designated private subnets, I discovered that while the instances were operational, the ALB target group showed all targets as unhealthy. This suggested a deeper application-level issue rather than an infrastructure problem. A thorough review of security group configurations and the launch template confirmed that the basic networking and instance setup were correct.

#### The Private Subnet Challenge

The architecture's security-first design presented an interesting troubleshooting challenge. With EC2 instances deliberately placed in private subnets and no public IP addresses or SSH access configured, traditional debugging approaches weren't viable. The solution required:

1. Implementing AWS Systems Manager Session Manager access by:
   - Adding appropriate IAM permissions to the EC2 role
   - Creating VPC endpoints for Systems Manager connectivity

2. Establishing secure instance access through the AWS console

#### Root Cause Analysis

After gaining instance access through Session Manager, I discovered through the command `sudo systemctl status nginx` that nginx wasn't installed on the instances. This explained the failed health checks - the web server wasn't present to respond to the ALB's requests. The resolution involved:

1. Manually installing nginx
2. Creating the index.html file using sudo tee
3. Enabling and restarting the nginx service

#### Resolution and Lessons Learned

The successful resolution, confirmed by the ALB serving the custom index page, highlighted several important aspects of AWS infrastructure management:

1. The importance of comprehensive instance configuration testing
2. The value of AWS Systems Manager for secure instance management
3. The critical relationship between load balancer health checks and application configuration
4. The practical implementation of security best practices in a production environment