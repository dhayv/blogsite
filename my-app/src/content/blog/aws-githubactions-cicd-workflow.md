---
title: "Zero-Touch AWS Deployments: Building a Modern CI/CD Pipeline with GitHub Actions and CloudFront"
date: "12-17-2024"
author: "David Hyppolite"
excerpt: "Good architecture isn't about using the latest tech - it's about solving real problems."
tags: ['aws', 'github-actions', 'cicd', 'docker', 'cloudfront', 's3', 'ec2']
---
## Tech Stack Deep Dive

- **CI/CD & DevOps:** GitHub Actions for automation, self-hosted runners for deployment
- **Containerization:** Docker for consistent backend deployments
- **Cloud Infrastructure:** AWS S3, CloudFront, EC2, ACM
- **Nginx:** Reverse proxy
- **Database:** MongoDB Atlas for reliable data persistence
- **Security & Auth:** ACM for SSL, OIDC for AWS Role Assumption
- **Frontend:** React, Vite
- **Backend:** Python

[GitHub](https://github.com/dhayv/WiseWalletWin)
[Github Actions Workflow](https://github.com/dhayv/WiseWalletWin/blob/main/.github/workflows/CI_CD.yml)

## The Wake-Up Call

It started with a simple need: I wanted to know exactly how much money I needed to set aside before payday to cover my next two weeks. Simple enough, right? I built [Wisewallet](wisewalletwin.com) to solve this problem, but little did I know this straightforward application would become my crash course in modern cloud architecture and DevOps practices.

Picture this: It's 10 PM, and I'm staring at my terminal, hands slightly shaking as I rsync changes. My EC2 had to be rebooted instance, taking my SQLite database with it into the digital void. All that data, gone. Again. My monolithic setup - a React frontend, Python backend, SQLite database, and Nginx, all crammed onto a single EC2 instance - was starting to feel like a house of cards.

## The Breaking Point

Every deployment was a small adventure in anxiety. I'd SSH into my server, fingers crossed, hoping my rsync command wouldn't miss any crucial files or add files that shouldn't belong:

```bash
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude '.env' \
  --exclude 'venv' --exclude '__pycache__' --exclude 'db.sqlite3' \
  -e "ssh -i ~/.ssh/id_rsa" \
  . ubuntu@ec2-24-127-53:~/app
```

Then came the ritual of commands:

```bash
sudo apt update
sudo apt upgrade
sudo systemctl stop frontend.service
sudo systemctl stop backend-container.service
cd ~/app/frontend
npm install
npm run build
```

Old manual and Tedious

![Monolithic](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/l7zzfch9n4uuiy9genhz.png)

Each step was another chance for something to go wrong. And things did go wrong. Often. The EC2 instance would run out of storage during npm install. The build would timeout. The database would vanish with instance restarts. It was like playing DevOps roulette, and I was losing sleep over it. The app was not usable - it was a burden for months, constantly having to add the information over again.

## The Rumination Phase

I spent weeks turning the problem over in my mind. The data loss issue haunted me the most. I kept thinking, "There has to be a better way to handle persistence." That's when I started researching MongoDB Atlas. The idea of a managed database service was appealing - no more data loss anxiety, automatic backups, and scaling without the headache. But I wrestled with the decision - was I overcomplicating things? Was I just adding unnecessary complexity?

Then there was the frontend deployment issue. Every time I needed to update the UI, I had to run `npm run build` on the EC2 instance. It was slow, resource-intensive, and frankly, felt wrong. The lightbulb moment came during a particularly frustrating deployment: "Why am I building static files on a server? These could live anywhere!"

## The Architecture Evolution

Current CI/CD pipeline
![Architecture diagram of the CI/CD pipeline from GitHub Actions to S3 and CloudFront](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/x1fxlq1be66gx5l62j0m.png)

### Breaking Free from the Monolith

The first major decision was moving to MongoDB Atlas. It wasn't just about preventing data loss - it was about peace of mind. Knowing my data would survive any EC2 mishaps was worth the migration effort. The process taught me about data modeling, replication, and the true value of managed services. It took some time to change my code over from SQL to NoSQL but it was worth it.

For the frontend, S3 was an obvious choice, but the real game-changer was CloudFront. I remember the exact moment the decision clicked. I was comparing costs between running an Application Load Balancer and using CloudFront and saw how the configurations meant I could use it for the backend too!

This led to an interesting architecture: two CloudFront distributions - one for the S3-hosted frontend and another for the EC2 backend. It was unconventional, perhaps, but it solved multiple problems:

- HTTPS everywhere without managing Nginx certificates
- Caching at the edge
- Cost-effective compared to an ALB for my use case

### The CI/CD Epiphany

The manual deployment process still bothered me. I wanted zero SSH access needed for routine deployments, and I wanted to essentially mimic the exact steps I did manually but automated without errors or forgetting anything. The solution came in layers:

> First, containerize the backend with Docker:

```yaml
jobs:
  dockerize-backend:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4.1.7

      - name: Setup Docker Buildx
        uses: docker/setup-buildx-action@v3.4.0

      - name: Login to Docker Hub
        uses: docker/login-action@v3.2.0
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v6.4.1
        with:
          context: ./Backend/
          push: true
          tags: ${{ secrets.DOCKER_USERNAME }}/wisewallet-backend:latest
```

The key was sending the built image to DockerHub to be held until needed.

> But how to get the container onto EC2 without SSH? This stumped me for days. The breakthrough came when I discovered self-hosted GitHub Actions runners. I could install a runner on my EC2 instance, waiting to pull and run the latest Docker image. It was elegant in its simplicity:

```yaml
  deploy:
    needs: dockerize-backend
    name: aws-ec2
    runs-on: self-hosted  
    steps:
      - name: Pull image from Docker Hub
        run: docker pull ${{ secrets.DOCKER_USERNAME }}/wisewallet-backend:latest

      - name: Delete old Container
        run: docker rm -f ${{ secrets.DOCKER_USERNAME }}/wisewallet-backend:latest

      - name: Run docker container
        run: sudo systemctl restart backend.service
```

Then came the systemd services - one to keep the runner alive, another to manage the container lifecycle. No more manual intervention needed.

### Installing a Self-Hosted Runner

The process is straightforward:

1. Go to repo under actions tab
2. Under management < runners
3. Hit new Runners < new self-hosted runner
4. Runners are versatile for Linux, Windows, macOS

Here's the runner service configuration:

```bash
[Unit]
Description=Github actions runner
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/actions-runner/
ExecStart=/home/ubuntu/actions-runner/run.sh
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

And the backend service:

```bash
[Unit]
Description=Docker for Backend Service
Requires=docker.service
After=network.target docker.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/
ExecStartPre=/usr/bin/docker pull image/backend:latest
ExecStart=/usr/bin/docker run --rm --name backend -p 8000:8000 --env-file /etc/app.env image/backend:latest uvicorn main:app --host 0.0.0.0
ExecStop=/usr/bin/docker stop backend
Restart=always
EnvironmentFile=/etc/app.env

[Install]
WantedBy=multi-user.target
```

### Building the Static Files

No more manual npm run build, npm installs, or timeouts:

```yaml
  build-frontend:
    runs-on: ubuntu-latest
    permissions:
      id-token: write   
      contents: read
      
    env:
      AWS_REGION: ${{ secrets.AWS_REGION }}
      
    steps:
      - name: Checkout code
        uses: actions/checkout@v4.1.7

      - name: Set up Node.js
        uses: actions/setup-node@v4.0.3
        with:
          node-version: 20.12.1

      - name: Cache Node.js modules
        uses: actions/cache@v4
        with:
          path: Frontend/node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('**/Frontend/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-node-

      - name: Install dependencies
        run: |
          cd ./Frontend
          npm install

      - name: Build the frontend
        env:
          VITE_APP_API_URL: ${{ secrets.VITE_APP_API_URL }}
        run: |
          cd ./Frontend
          npm run build
```

### The Security Evolution

The final piece was security. Storing AWS credentials in GitHub secrets felt wrong. That's when I discovered AWS OpenID Connect. The ability to generate temporary credentials just when needed was exactly what I was looking for. It was a perfect example of the principle of least privilege in action. It allowed me to get my static images to S3 and invalidate my CloudFront cache instantly to apply changes - the only stored credentials are fairly simple:

```yaml
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          role-session-name: GitHubActionsSession
          aws-region: ${{ secrets.AWS_REGION }}

      - name: Deploy to S3
        run: |
          aws s3 sync ./Frontend/dist/ s3://${{ secrets.AWS_S3_BUCKET }} --region ${{ secrets.AWS_REGION }} --delete

      - name: Invalidate CloudFront cache
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/index.html"
```

## The Results

The transformation has been dramatic. What used to be a stress-inducing manual process is now a simple git push, but with a twist - the deploy is now manual so I can send features once a month. The architecture is distributed but not overly complex. Each component does one thing well:

- MongoDB Atlas handles data persistence
- S3 and CloudFront manage static content delivery
- Docker provides consistent backend deployments
- GitHub Actions orchestrates everything

More importantly, I sleep better at night. No more 10 PM panic sessions. No more data loss anxiety. No more deployment roulette.

## Looking Forward

This journey taught me that good architecture isn't about using the latest tech - it's about solving real problems. Each decision was driven by a specific pain point, not just a desire to use cool technology.

Looking ahead, I'm exploring:

- Container orchestration with ECS (though for my scale, the current setup works well)
- Integration tests in the CI/CD pipeline
- Potentially going serverless with Lambda

But the biggest lesson? Sometimes the best solutions come from living with the pain long enough to truly understand the problem. Every sleepless night, every failed deployment, every data loss incident - they all contributed to the solution I have today.

Want to discuss cloud architecture, DevOps practices, or share your own journey? Connect with me on LinkedIn. I'm always eager to learn from others' experiences!
