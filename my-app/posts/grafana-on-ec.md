---
title: "Deploying Grafana on an AWS EC2 Instance(2025)"
date: "3-5-2025"
author:  
excerpt: "Deploy Grafana on AWS EC2 for real-time performance monitoring and proactive cloud infrastructure management using Instance Connect."
---
This blog post walks you through setting up **Grafana** on an **AWS EC2** instance to visualize real-time performance metrics and run stress tests, all while being secured by using Instance Connect to bypass the need for SSH.

## Problem

Cloud infrastructure issues often go undetected until they cause downtime costing businesses thousands per minute and putting immense pressure on engineering teams.

## Solution

This tutorial demonstrates how to implement proactive monitoring with Grafana on AWS EC2. You’ll learn to deploy an EC2 instance, attach the necessary IAM role, integrate CloudWatch, and configure Grafana to visualize performance metrics in real time.

## Why This Matters

Mastering this setup enables you to:

- Configure IAM roles effectively.
- Deploy and secure EC2 instances using Instance Connect.
- Integrate AWS CloudWatch for comprehensive monitoring.
- Create dynamic Grafana dashboards for real-time performance visualization.

## What You'll Learn

By following this guide, you will achieve a complete AWS monitoring setup that not only demonstrates your infrastructure deployment skills but also provides visual proof of your ability to monitor and manage real-time performance metrics effectively.

## Tools Used

- **AWS Console:** For managing EC2 and IAM roles.
- **Grafana:** For visualization, dashboard creation, and alerting.
- **Amazon Linux 2:** As the operating system for the EC2 instance.
- **CloudWatch:** For monitoring EC2 metrics.
- **Stress:** Command-line tool to simulate load on the instance.
- **Instance Connect:** For connecting to the EC2 instance without SSH.

### Step 1 Create your IAM role

In the AWS Console, navigate to **Roles** and click **Create Role**.

**Select Trusted Entity:** AWS service  
**Service Use Case:** EC2

Click **Next**.

Attach the permission policy: **AmazonGrafanaCloudWatchAccess**.

Click **Next**.

Provide a unique name for your role.

Click **Create Role**.

### Step 2 Launch your instance

Launch and install Grafana on an EC2 instance.

In the AWS Console, search for **EC2** and click **Launch Instance**.

Configure your instance with these settings:

- **Name:** Choose a unique name
- **AMI**: Amazon Linux 2
- **Instance type**: t2.micro
- **Key pair (login):** Proceed without a key pair.

#### Network settings

- **Firewall (security groups):** Create a new security group.
- **Allow SSH traffic from:** `com.amazonaws.us-east-1.ec2-instance-connect` (replace `us-east-1` with your region)
- **Allow HTTP traffic from the internet**: Checked

> replace _us-east-1_ with your region This will allow us to instance connect.

#### Advanced details

**IAM instance profile:**  Attach the IAM role you created earlier. This is crucial for granting the EC2 instance the necessary permissions to access CloudWatch via Grafana.

##### User Data

Paste the following script to install and start Grafana:

```bash
#!/usr/bin/env bash

# Install Grafana
sudo yum install -y https://dl.grafana.com/enterprise/release/grafana-enterprise-11.5.2-1.x86_64.rpm

# Enable/Start Grafana
sudo systemctl enable grafana-server
sudo systemctl start grafana-server
```

Click **Launch instance** to create your EC2 instance.

![Instance-connect](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/lfabud4o1zmn6xuava8r.png)

Connect to your instance using **Instance Connect** (instead of SSH).

To verify the installation run:

```bash

sudo systemctl status grafana-server
```

You should see Grafana running, similar to the provided screenshot.

![grafana check](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/tyt3ba08p3irx321benc.png)

## Step 3 Connect to Grafana UI

Gain Access to the security group of your EC2 instance.

Edit the inbound rules of your instance’s security group

**Type:** Custom TCP
**Port range:** 3000
**Source:** Custom
**CIDR Block:** 0.0.0.0/0

![grafana-port](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/4drsgeqd8208du7fkg4f.png)

Access Grafana by copying your instance's public IP and appending port 3000 (e.g., 54.164.96.183:3000).

You should see a web page like this.

![grafana-page](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/768quaw7d3kajys7z721.png)

Log in using the default credentials:

```bash
email: admin
password: admin
```

You can skip the password change prompt if desired.

## Step 4 Configure a data source

Grafana needs to be provided a data source to fetch and display data.

In Grafana, navigate to the **Data Sources**:

![grafana-homepage](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/bm3avfz7by07wi19n1tf.png)

Select **CloudWatch**

![aws-cloudwatch](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/p3hxxpkhgiy1x8ap3u3a.png)

Use these settings:

**Authentication Provider:** AWS SDK default
**Default Region:** us-east-1
**Namespaces of Custom Metrics** ec2-monitoring

Click **Save & test**. You should see a confirmation message indicating that the queries to the CloudWatch metrics and logs APIs were successful.

### Build a Dashboard

On the success page, click **Build a dashboard** > **Add visualization**

Select your CloudWatch data source.

![add-visualization](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/wm757lbt0pq20zashpdw.png)

![dashboard-source](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/pg77robki33mz39omxmx.png)

At the moment "No data" will be shown.

Delete the default query.

![default-query](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/l7h869utdytyi465wc4p.png)

![add-query](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/96fmluhc2rsomhcqyi6t.png)

Add a new query with these parameters:

**Namespace:** AWS/EC2
**Metric name:** CPUUtilization
**Statistic:** Average
> add dimension
**Dimensions:** InstanceId (select your Grafana instance's ID)

Click **Run Queries** to view your data.

![query-button](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/h1dqtzyiatv5sfkm1tjd.png)

Congratultions! You should now see your first queried Data from your EC2 instance.

![grafana-data](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/wig0s9fpusvqczfwbq1w.png)

## Step 5 Stress test the EC2

We can stress test our EC2 to see check the results on Grafana.

Reconnect to your EC2 instance using **Instance Connect** if necessary.

Install the stress testing tool:

```bash

sudo amazon-linux-extras install epel -y

sudo yum install stress -y
```

Run the stress test:

```bash

stress --cpu 4 --timeout 120s
```

![stress-test](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/e0c10dihepthw78at68g.png)

After the test completes, check your Grafana dashboard to see the updated metrics.

![stess-visual](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/okv6g3gnxiatink8i8b4.png)

## Conclusion

By following these steps, you've successfully deployed Grafana on an EC2 instance, attached the necessary IAM role, and set up monitoring for CPU utilization using CloudWatch. This guide demonstrates a straightforward approach to achieving real-time monitoring with AWS and Grafana, providing essential insights for system performance analysis and stress testing.

Happy monitoring!
