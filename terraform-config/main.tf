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
  bucket = var.domain_name
  acl    = "private"

  control_object_ownership = true
  object_ownership         = "ObjectWriter"

  versioning = {
    enabled = true
  } 

    index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html"
  }

  tags = {
    Name = "My blog bucket"
  }
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