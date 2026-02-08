---
title: "Fix Next.js CloudFront 403 Access Denied on S3 Static Export"
date: "12-13-2024"
author: David Hyppolite
tags: ['aws', 'nextjs', 'cloudfront', 'debugging']
excerpt: "How to fix Next.js CloudFront 403 access denied errors caused by URL routing mismatches on S3 static exports using CloudFront Functions."
---
## Skills Demonstrated: AWS, Next.js, Terraform, and Cloud Debugging

This post demonstrates my expertise in:

- **Cloud Infrastructure**: AWS (CloudFront, S3, Lambda) infrastructure management with production debugging
- **Modern Web Development**: Next.js static site optimization and deployment
- **DevOps Practices**: Infrastructure as Code with Terraform, CI/CD pipeline automation
- **Problem Solving**: Complex debugging of URL routing and permissions in distributed systems
- **Cloud Security**: IAM roles, bucket policies, and CloudFront function implementation
- **Monitoring & Logging**: Setting up ETL pipeline for CloudFront logs using Lambda

**Tech Stack**: Next.js, AWS (CloudFront, S3, Lambda), Terraform, Python, JavaScript, CI/CD

## Why Next.js Static Exports Return 403 on CloudFront

Being an engineer, you're always learning things on the fly, and when you're hosting your own services, you're always running into unexpected bugs.

I hope this post helps somebody out there. Typically, issues like these are due to mismatched URL paths between what CloudFront expects and what it's getting back from your S3 bucket.

It's harder to know what to expect in production, especially in situations like these where you can't locally simulate the architecture to address edge cases.

## Configuring Next.js trailingSlash for S3 Static Export

I was originally building my Next.js files as a static site on S3 using this code in next.config.ts and using trailingSlash to export all files as index.html:

```javascript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true
};

export default nextConfig;
```

Everything was perfect - I got the best of both worlds, but I wasn't aware of the limitations. CloudFront added an extra layer of complexity to URLs.

I figure this out later but this is crucial to fix the issue, you must open next.config.ts and make sure that trailingSlash is removed or set to false:

```javascript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: false,
};

export default nextConfig;
```

I haved already saved you time.

Now when I use `output: 'export'` with `trailingSlash: false`, my files are being built with the default /about.html format. This allows Next.js to export each blog post in its own directory containing an index.html (so it will output /about/index.html).

That set up the directories beautifully on my S3 bucket but sadly did not address the permission denied issue. The problem had to be a path-based issue when the application accessed the logs.

## Setting Up CloudFront Access Logs With S3

I wanted to understand deeply what was going on, so let's create logs to see what CloudFront is doing.

First, I created an S3 bucket to add CloudFront logs, using the default settings that S3 provides.

![s3 bucket main](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/9chxq2w4ouzkdn1mpz5k.png)

![s3 bucket scroll](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/qz2ctedltp8xr0zlljvs.png)

![s3 bucket bottom page](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/awajjnphn49oay5tnbj3.png)

### Enabling Standard Logging on a CloudFront Distribution

- Go to your current CloudFront distribution and navigate to the Logging tab

![Cloudfront create](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/qlyfg4et66jlhyhfh4xj.png)

- We're going to associate our S3 bucket in the Standard log destination

![S3 bucket](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/9agboz502pk9m2pgliig.png)

- Hit "Add" and select "Amazon S3"

![s3 bucket 2](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/0kqrylev8jasxg9wa8kw.png)

- Select the "Destination S3 bucket" to be your newly created log bucket

Access your site, give it some time for logs to generate, and you should see new logs being created in this format:

```bash
"distribution ID".YYYY-MM-DD-HH.unique-ID.gz
```

or

```bash
"optional prefix"/"distribution ID".YYYY-MM-DD-HH.unique-ID.gz
```

We cannot access the logs directly as they are zipped. This is where Lambda comes in.

## Using AWS Lambda to Decompress CloudFront Log Files

Why use Amazon lambda?

Why use Amazon Lambda? For this moment, Lambda serves 3 purposes:

1. Extract: Getting the gzipped logs from CloudFront/S3
2. Transform: Unzipping/decompressing the files
3. Load: Sending to CloudWatch

Let's create a lambda function with basic configurations.

![Lambda main page](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/uj3mf5duwkod7u4nhmov.png)

Hit create function.

![Lambda blueprint](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/1j7zmdw8nw5t666y1ivo.png)

We are using a blueprint to save us time.

- Start with the "Get S3 Object" blueprint using Python runtime

Name your function.

- Create a new role with basic Lambda permissions (this will only include permissions for writing logs to CloudWatch but lacks permissions for accessing S3)

![Lambda function trigger](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/p4nqevd7qto9flhmtd6l.png)

- Select your bucket you created logs
- Under event types, use only "Put" since logs are a put event
- Make sure to check the "Recursive invocation" box

Now hit create function.

Update the Lambda function with this code:

```python
import json
import urllib.parse
import boto3
import gzip
import io

print('Loading function')
s3 = boto3.client('s3')

def lambda_handler(event, context):
    try:
        bucket = event['Records'][0]['s3']['bucket']['name']
        key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'], encoding='utf-8')
        
        response = s3.get_object(Bucket=bucket, Key=key)
        compressed = response['Body'].read()
        
        with gzip.GzipFile(fileobj=io.BytesIO(compressed)) as gz:
            content = gz.read().decode('utf-8')
            print(content) 
        
        return {
            "statusCode": 200,
            "body": content
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        raise
```

The only addition to the original code given is this will allow us to unzip the log files in the s3 bucket.

### Adding IAM Inline Policy for Lambda S3 Access

Now we need to add permissions for our Lambda role to access the S3 bucket:

- In Lambda, go to Configuration > Permissions

![Lambda config](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/rcvi41qa0llm98owpail.png)

- Select the role name under "Execution Role"

![Lambda Roles](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/xctw16ficfenvv0747b3.png)

Here is the role with current basic policy.

Now go to "Add permissions" than "Create Inline Policy".

![policy permission](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/229lf78s8h41afftpygj.png)

- Add an inline policy with these permissions:
- GetObject: to retrieve log files
- ListBucket: to select the Log bucket

![policy restriction](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/n4mre9p0jlqg9wf55lcp.png)

- Restrict access to your specific log bucket ARN

Once your done hit "Next"

![Name policy](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/8dwkqy0b1m83fwut4anq.png)

Name the policy. Now your lambda function will have access to log bucket.

Now go to your site and click and refreshed it to get some permission denied errors to generate some logs.

![log group](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/fg55ws2jnan4dqk64hk0.png)

First set of logs. Hit "Search all log streams".

![log stream](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ynq72ops39zaud05l99w.png)
We can now see the access logs are being successfully decompressed.

You want to go through your logs to get the exact errors and paths affected.

## Creating a CloudFront Function for URL Rewriting

After analyzing the logs, we can create a CloudFront function to rewrite the URLs properly:

![Cloudfront function](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/yzq3fs62w030mw6a8h5n.png)

- Go to Cloudfront and on the left Side look for functions

![Cloudfront side](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/c5qiyp5hdxhf87jy9zti.png)

Give your function a name and description of what it does. Than hit "Create function".

- Create a new function with this our your code:

```javascript
function handler(event) {
    var request = event.request;
    var uri = request.uri;

    if (uri === "/blog" || uri === "/blog/") {
        request.uri = "/blog.html";
        return request;
    }
    
    if (!uri.includes('.')) {
        uri += '.html';
    }
    
    request.uri = uri;
    return request;
}
```

Now save your changes.

![Cloudfront association](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/cjfvievvi9xjurc1bpiw.png)

### Publishing and Associating the CloudFront Function

- Publish the function

![Publish cloudfront](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/zwk1b9u78091t9r1julh.png)

- Add an association to your CloudFront Distribution:
- Event Type: "Viewer Request"
- Behavior: Use the affected path (e.g., /blog*)

Note: I changed my behavior path to "/blog*" - this ensures that both /blog and /blog/* are handled by the same cache behavior and CloudFront Function.

Wait for your Distribution to redeploy, then invalidate your cache. Open your site in a new private window to test.

This solution worked for my case. If it doesn't work for you, go through your set of logs to see what the errors/paths are and alter your function accordingly - that's what I did.

## Root Cause: S3 URL Path Mismatch With CloudFront

### How Static Export URL Paths Cause 403 Errors

- Static site generators like Next.js create HTML files for each route
- S3 expects full file paths (e.g., `/about.html`) while users access clean URLs (e.g., `/about`)
- CloudFront and S3 handle URL paths differently in production vs local development
- The URL mismatch causes permission denied errors only on direct access or page refreshes

### Next.js, CloudFront, and S3 Integration Lessons

1. **Next.js Configuration Impact**:
   - `trailingSlash` setting significantly affects URL structure
   - Static export behavior needs special handling with CloudFront
   - Default configurations might work locally but fail in production

2. **Production Debugging Strategy**:
   - Set up proper logging infrastructure first
   - Use Lambda to process CloudFront logs effectively
   - Monitor actual user access patterns
   - Test both direct access and navigation scenarios

3. **CloudFront Function Benefits**:
   - Handles URL rewrites at the edge
   - Provides clean URLs for users while maintaining proper S3 access
   - Cost-effective solution for URL path manipulation
   - Allows flexible routing rules based on your needs

### How to Prevent Next.js CloudFront 403 Errors

- Start with `trailingSlash: false` in Next.js when using CloudFront
- Set up comprehensive logging before deploying to production
- Test all URL access patterns:
  - Direct URL access
  - Navigation through links
  - Page refreshes
  - Nested routes
- Document your CloudFront function behavior for future reference

Remember: What seems like a simple permission issue might actually be a complex interaction between your static site generator, CDN, and storage service. Always validate your assumptions with proper logging and testing in production.
