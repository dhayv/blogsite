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

variable "domain_name" {
  type = string
  
}

module "s3_bucket" {
  source = "./modules/blog/s3.tf"
  bucket = var.domain_name
  acl = "private"
  versioning_enabled = true

} 

module "origin_access" {
  source = "./modules/blog"
  domain_name = var.domain_name
}


module "acm" {
  source = "./modules/blog/acm.tf"
  domain = var.domain_name
}

module "cloudfront" {
  source = "./modules/blog/cloudfront.tf"
  domain = var.domain_name
}

module "route53" {
  source = "./modules/blog/route53.tf"
  domain = var.domain_name
  cloudfront_domain_name = module.cloudfront.cloudfront_domain_name
  cloudfront_hosted_zone_id = module.cloudfront.cloul

}

module "s3_policy" {
  source = "./modules/blog/s3-policy.tf"
  domain = var.domain_name
  origin_access_control_arn = module.origin_access.origin_access_control_id
}