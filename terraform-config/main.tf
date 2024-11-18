terraform {
    required_providers {
      aws = {
        source = "hashicorp/aws",
        version = "5.76.0"
      }
    }

    required_version = ">= 1.2.0"
}

provider "aws" {
  region = "us-east-1"
}

module "s3_bucket" {
  source = "./modules/blog/s3.tf"
}

module "ACM" {
  source = "./modules/blog/acm.tf"
}

module "aws_cloudfront" {
  source = "./modules/blog/cloudfront.tf"
}

module "aws_route53_zone" {
  source = "./modules/blog/route53.tf"
}

module "s3_policy" {
  source = "./modules/blog/s3-policy.tf"
}